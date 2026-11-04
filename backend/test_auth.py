import os
import re
import smtplib
import tempfile
import threading
import time
import unittest
import json
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace
from pathlib import Path
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from backend.ai_service import AIService, GeminiProvider, OpenAIProvider, ProviderAnswer, ProviderFailure

_test_dir = tempfile.TemporaryDirectory(prefix="mediguide-auth-tests-")
os.environ["MEDIGUIDE_DB_PATH"] = str(Path(_test_dir.name) / "auth-tests.sqlite3")

from fastapi.testclient import TestClient

from backend import auth, main
from backend.main import app

client = TestClient(app)
failure_client = TestClient(app, raise_server_exceptions=False)


class FakeSMTP:
    messages = []
    fail_delivery = False

    def __init__(self, *args, **kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def starttls(self):
        pass

    def login(self, username, password):
        pass

    def send_message(self, message):
        if self.fail_delivery:
            raise smtplib.SMTPException("simulated delivery failure")
        self.messages.append(message)


class FakeGeminiModels:
    def __init__(self):
        self.calls = []
        self.fail_with = None
        self.fail_sequence = []

    def generate_content(self, *, model, contents, config=None):
        self.calls.append({"model": model, "contents": contents, "config": config})
        if self.fail_sequence:
            raise self.fail_sequence.pop(0)
        if self.fail_with:
            raise self.fail_with
        return SimpleNamespace(
            text="Generated answer from Gemini for the submitted healthcare question.",
            usage_metadata=SimpleNamespace(prompt_token_count=12, candidates_token_count=18),
        )


class FakeGeminiClient:
    def __init__(self):
        self.models = FakeGeminiModels()


class FakeGeminiProviderError(Exception):
    def __init__(self, code, details=None, headers=None):
        super().__init__("provider error details are private")
        self.code = code
        self.details = details or {}
        self.response = SimpleNamespace(headers=headers or {})


class FakeSecondaryProvider:
    name = "secondary"

    def __init__(self, configured=True, fail_with=None):
        self.configured = configured
        self.fail_with = fail_with
        self.calls = []

    def generate(self, system_prompt, history, message):
        self.calls.append(
            {"system_prompt": system_prompt, "history": history, "message": message}
        )
        if self.fail_with:
            raise self.fail_with
        return ProviderAnswer(
            "Generated answer from secondary AI for the submitted healthcare question.",
            15,
            20,
        )


class AuthenticationTests(unittest.TestCase):
    @classmethod
    def tearDownClass(cls):
        _test_dir.cleanup()

    def setUp(self):
        self.email = f"user-{uuid4().hex[:12]}@example.test"
        self.password = "correct horse battery"
        main.AI_SERVICE = AIService(
            lambda: main.gemini_client,
            secondary_provider=FakeSecondaryProvider(configured=False),
        )
        FakeSMTP.messages = []
        FakeSMTP.fail_delivery = False

    def signup(self, email=None, password=None, role="patient", **extra):
        return client.post(
            "/api/auth/signup",
            json={
                "name": "Test User",
                "email": email or self.email,
                "password": password or self.password,
                "role": role,
                **extra,
            },
        )

    def smtp_environment(self):
        return patch.dict(
            os.environ,
            {
                "SMTP_HOST": "mail.example.test",
                "SMTP_PORT": "587",
                "SMTP_USER": "mailer",
                "SMTP_PASSWORD": "test-only-password",
                "SMTP_FROM_EMAIL": "noreply@example.test",
                "SMTP_USE_SSL": "false",
            },
        )

    def test_signup_login_role_enforcement_and_session_revocation(self):
        registered = self.signup()
        self.assertEqual(registered.status_code, 200)
        profile = registered.json()["user"]
        token = registered.json()["token"]
        self.assertEqual(profile["role"], "patient")

        wrong_password = client.post(
            "/api/auth/login",
            json={"email": self.email, "password": "not the right password"},
        )
        self.assertEqual(wrong_password.status_code, 401)
        self.assertEqual(wrong_password.json()["detail"], "Invalid email or password.")

        doctor_portal = client.post(
            "/api/auth/login",
            json={"email": self.email, "password": self.password, "expected_role": "doctor"},
        )
        self.assertEqual(doctor_portal.status_code, 403)

        patient_portal = client.post(
            "/api/auth/login",
            json={"email": self.email, "password": self.password, "expected_role": "patient"},
        )
        self.assertEqual(patient_portal.status_code, 200)

        current = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(current.status_code, 200)
        self.assertEqual(current.json()["id"], profile["id"])
        self.assertEqual(client.get("/api/auth/me").status_code, 401)
        self.assertEqual(
            client.get("/api/auth/me", headers={"Authorization": "Bearer forged-token"}).status_code,
            401,
        )

        self.assertEqual(
            client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"}).status_code,
            200,
        )
        self.assertEqual(
            client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code,
            401,
        )

    def test_doctor_signup_requires_server_authorization_and_role_is_persisted(self):
        request = {
            "name": "Verified Clinician",
            "email": self.email,
            "password": self.password,
            "role": "doctor",
            "medical_license": "LICENSE-12345",
            "doctor_invite_code": "invalid",
        }
        with patch.dict(os.environ, {"DOCTOR_SIGNUP_CODE": ""}):
            self.assertEqual(client.post("/api/auth/signup", json=request).status_code, 403)
        with patch.dict(os.environ, {"DOCTOR_SIGNUP_CODE": "test-provisioned-code"}):
            request["doctor_invite_code"] = "test-provisioned-code"
            response = client.post("/api/auth/signup", json=request)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["user"]["role"], "doctor")
            login = client.post(
                "/api/auth/login",
                json={
                    "email": self.email,
                    "password": self.password,
                    "expected_role": "doctor",
                },
            )
            self.assertEqual(login.status_code, 200)
            patient_portal = client.post(
                "/api/auth/login",
                json={
                    "email": self.email,
                    "password": self.password,
                    "expected_role": "patient",
                },
            )
            self.assertEqual(patient_portal.status_code, 403)

    def test_signup_validation_and_no_preloaded_accounts(self):
        self.assertEqual(
            client.post(
                "/api/auth/signup",
                json={"name": "Bad", "email": "not-an-email", "password": self.password},
            ).status_code,
            400,
        )
        self.assertEqual(
            client.post(
                "/api/auth/signup",
                json={
                    "name": "Short Password",
                    "email": self.email,
                    "password": "short",
                    "role": "patient",
                },
            ).status_code,
            422,
        )
        self.assertEqual(
            client.post(
                "/api/auth/signup",
                json={
                    "name": "Invalid Role",
                    "email": self.email,
                    "password": self.password,
                    "role": "admin",
                },
            ).status_code,
            422,
        )
        for email, password in (
            ("sarah@mediguide.ai", "HealthPass123!"),
            ("patient@mediguide.ai", "HealthPass123!"),
            ("demo@mediguide.ai", "demo1234"),
        ):
            self.assertEqual(
                client.post(
                    "/api/auth/login",
                    json={"email": email, "password": password},
                ).status_code,
                401,
            )
        duplicate = self.signup()
        self.assertEqual(duplicate.status_code, 200)
        duplicate = self.signup()
        self.assertEqual(duplicate.status_code, 409)

    def test_account_history_is_private_deletable_and_excludes_source_pdf(self):
        registration = self.signup()
        token = registration.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        report_response = client.post(
            "/api/auth/history/reports",
            headers=headers,
            json={
                "filename": "blood-test.pdf",
                "report_type": "CBC",
                "summary": {"overview_en": "Saved analysis summary"},
                "test_results": [{"test_name": "Hemoglobin", "value": 13.2, "unit": "g/dL"}],
            },
        )
        self.assertEqual(report_response.status_code, 201)
        report_id = report_response.json()["id"]
        chat_response = client.post(
            "/api/auth/history/chats",
            headers=headers,
            json={"question": "What is hemoglobin?", "reply": "It is a protein in red blood cells."},
        )
        self.assertEqual(chat_response.status_code, 201)

        history = client.get("/api/auth/history", headers=headers)
        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.json()["reports"][0]["id"], report_id)
        self.assertEqual(len(history.json()["chats"]), 1)
        self.assertNotIn("raw_text", history.json()["reports"][0])

        other_registration = self.signup(email=f"other-{uuid4().hex[:12]}@example.test")
        other_headers = {"Authorization": f"Bearer {other_registration.json()['token']}"}
        denied_delete = client.delete(
            f"/api/auth/history/reports/{report_id}", headers=other_headers
        )
        self.assertEqual(denied_delete.status_code, 404)
        self.assertEqual(
            client.delete(f"/api/auth/history/reports/{report_id}", headers=headers).status_code,
            204,
        )
        self.assertEqual(client.get("/api/auth/history", headers=headers).json()["reports"], [])

    def test_authenticated_profile_can_be_updated(self):
        registration = self.signup()
        token = registration.json()["token"]
        response = client.patch(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Updated Test User",
                "avatar": "https://example.test/profile.png",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Updated Test User")
        self.assertEqual(response.json()["avatar"], "https://example.test/profile.png")
        self.assertEqual(client.patch("/api/auth/me", json={"name": "No token"}).status_code, 401)

    def test_places_search_requires_configuration_and_returns_provider_results(self):
        with patch.dict(os.environ, {"GOOGLE_MAPS_API_KEY": ""}):
            unavailable = client.post(
                "/api/emergency/nearby-hospitals",
                json={"latitude": 37.7749, "longitude": -122.4194},
            )
        self.assertEqual(unavailable.status_code, 503)

        class FakeProviderResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return json.dumps(
                    {
                        "places": [
                            {
                                "id": "place-123",
                                "displayName": {"text": "Verified Hospital"},
                                "formattedAddress": "100 Health St",
                                "nationalPhoneNumber": "+1 555 0100",
                                "location": {"latitude": 37.775, "longitude": -122.419},
                            }
                        ]
                    }
                ).encode()

        with patch.dict(os.environ, {"GOOGLE_MAPS_API_KEY": "test-key"}), patch.object(
            main.urllib.request, "urlopen", return_value=FakeProviderResponse()
        ) as provider_request:
            found = client.post(
                "/api/emergency/nearby-hospitals",
                json={"latitude": 37.7749, "longitude": -122.4194},
            )
        self.assertEqual(found.status_code, 200)
        hospital = found.json()[0]
        self.assertEqual(hospital["name"], "Verified Hospital")
        self.assertEqual(hospital["distance_km"], 0.0)
        self.assertNotIn("test-key", found.text)
        self.assertEqual(provider_request.call_args.kwargs["timeout"], 10)

    def test_chat_forwards_health_questions_to_gemini_and_returns_generated_answers(self):
        questions = [
            "What is WBC?",
            "What is hemoglobin?",
            "How can I improve my iron levels?",
            "What are the benefits of drinking water?",
            "What is diabetes?",
            "What foods contain iron?",
            "Why might someone feel tired often?",
            "What is blood pressure?",
            "What is LDL cholesterol?",
            "How can I improve my sleep?",
            "What is the difference between RBC and WBC?",
            "What does HDL cholesterol do?",
            "What is the purpose of an HbA1c test?",
            "How does walking benefit general health?",
            "What does a complete blood count measure?",
            "When should a persistent cough be discussed with a clinician?",
        ]
        fake_gemini = FakeGeminiClient()
        with patch.object(main, "gemini_client", fake_gemini):
            for question in questions:
                response = client.post(
                    "/api/chat",
                    json={"message": question, "language": "en"},
                )
                self.assertEqual(response.status_code, 200, response.text)
                self.assertEqual(response.json()["mode"], "ai")
                self.assertIn("Generated answer from Gemini", response.json()["reply"])
                self.assertNotIn("Hello! I am", response.json()["reply"])
        self.assertEqual(len(fake_gemini.models.calls), len(questions))
        for question, call in zip(questions, fake_gemini.models.calls):
            self.assertIn(question, call["contents"])
            self.assertEqual(call["model"], os.getenv("GEMINI_MODEL", "gemini-3.6-flash"))

    def test_chat_supports_selected_languages_and_follow_up_context(self):
        fake_gemini = FakeGeminiClient()
        prior_conversation = [
            {"role": "user", "content": "What is diabetes?"},
            {"role": "assistant", "content": "Diabetes is a condition involving blood glucose regulation."},
        ]
        with patch.object(main, "gemini_client", fake_gemini):
            for language, question in (
                ("en", "What are its symptoms?"),
                ("te", "దాని లక్షణాలు ఏమిటి?"),
                ("hi", "इसके लक्षण क्या हैं?"),
            ):
                response = client.post(
                    "/api/chat",
                    json={
                        "message": question,
                        "language": language,
                        "history": prior_conversation,
                    },
                )
                self.assertEqual(response.status_code, 200, response.text)
                self.assertEqual(response.json()["language"], language)
                self.assertEqual(response.json()["mode"], "ai")
                self.assertIn("Generated answer from Gemini", response.json()["reply"])
        for call in fake_gemini.models.calls:
            self.assertIn("What is diabetes?", call["contents"])
            self.assertIn("blood glucose regulation", call["contents"])
        self.assertIn("Respond in Telugu", fake_gemini.models.calls[1]["config"].system_instruction)
        self.assertIn("Respond in Hindi", fake_gemini.models.calls[2]["config"].system_instruction)

    def test_chat_without_gemini_configuration_returns_explicit_error_not_canned_answer(self):
        with patch.object(main, "gemini_client", None):
            response = client.post(
                "/api/chat",
                json={"message": "What is hemoglobin?", "language": "en"},
            )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "AI services are temporarily unavailable. Please try again later.")
        self.assertNotIn("Hello! I am", response.text)

    def test_chat_quota_errors_are_safe_and_not_returned_as_fake_answers(self):
        fake_gemini = FakeGeminiClient()
        fake_gemini.models.fail_with = FakeGeminiProviderError(429)
        with patch.object(main, "gemini_client", fake_gemini), patch.object(main.time, "sleep") as sleep:
            response = client.post(
                "/api/chat",
                json={"message": "What is blood pressure?", "language": "en"},
            )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "AI services are temporarily unavailable. Please try again later.")
        self.assertEqual(len(fake_gemini.models.calls), 1)
        sleep.assert_not_called()
        self.assertEqual(main.AI_SERVICE.metrics_snapshot()["gemini"]["rate_limits"], 1)

    def test_chat_rate_limit_retry_uses_google_retry_info(self):
        fake_gemini = FakeGeminiClient()
        fake_gemini.models.fail_sequence = [
            FakeGeminiProviderError(
                429,
                details={
                    "error": {
                        "details": [
                            {
                                "@type": "type.googleapis.com/google.rpc.RetryInfo",
                                "retryDelay": "0.25s",
                            }
                        ]
                    }
                },
            )
        ]
        with patch.object(main, "gemini_client", fake_gemini), patch.object(main.time, "sleep") as sleep:
            response = client.post(
                "/api/chat",
                json={"message": "What is WBC?", "language": "en"},
            )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(len(fake_gemini.models.calls), 2)
        sleep.assert_called_once_with(0.25)

    def test_chat_does_not_retry_before_long_provider_retry_info(self):
        fake_gemini = FakeGeminiClient()
        fake_gemini.models.fail_with = FakeGeminiProviderError(
            429,
            details={"error": {"details": [{"retryDelay": "60s"}]}},
        )
        with patch.object(main, "gemini_client", fake_gemini), patch.object(main.time, "sleep") as sleep:
            response = client.post(
                "/api/chat",
                json={"message": "What is WBC?", "language": "en"},
            )
        self.assertEqual(response.status_code, 503)
        self.assertIn("AI services are temporarily unavailable", response.json()["detail"])
        self.assertEqual(len(fake_gemini.models.calls), 1)
        sleep.assert_not_called()

    def test_chat_maps_provider_errors_to_specific_safe_statuses(self):
        for provider_code, expected_status in ((400, 400), (401, 503), (403, 503), (500, 503)):
            with self.subTest(provider_code=provider_code):
                fake_gemini = FakeGeminiClient()
                fake_gemini.models.fail_with = FakeGeminiProviderError(provider_code)
                with patch.object(main, "gemini_client", fake_gemini):
                    response = client.post(
                        "/api/chat",
                        json={"message": "What is WBC?", "language": "en"},
                    )
                self.assertEqual(response.status_code, expected_status)
                expected_message = (
                    "Please rephrase it"
                    if expected_status == 400
                    else "AI services are temporarily unavailable"
                )
                self.assertIn(expected_message, response.json()["detail"])
                self.assertNotIn("provider error details are private", response.text)

        fake_gemini = FakeGeminiClient()
        fake_gemini.models.fail_with = TimeoutError("provider timeout")
        with patch.object(main, "gemini_client", fake_gemini):
            timeout_response = client.post(
                "/api/chat",
                json={"message": "What is WBC?", "language": "en"},
            )
        self.assertEqual(timeout_response.status_code, 503)
        self.assertIn("AI services are temporarily unavailable", timeout_response.json()["detail"])

    def test_gemini_provider_generates_answer_independently(self):
        fake_gemini = FakeGeminiClient()
        provider = GeminiProvider(lambda: fake_gemini)
        answer = provider.generate(
            "Respond in clear, simple English.",
            [{"role": "user", "content": "What is WBC?"}],
            "What is its role?",
        )
        self.assertIn("Generated answer from Gemini", answer.text)
        self.assertEqual(answer.input_tokens, 12)
        self.assertEqual(answer.output_tokens, 18)
        self.assertEqual(len(fake_gemini.models.calls), 1)
        self.assertIn("What is its role?", fake_gemini.models.calls[0]["contents"])

    def test_chat_falls_back_to_secondary_after_gemini_rate_limit(self):
        fake_gemini = FakeGeminiClient()
        fake_gemini.models.fail_with = FakeGeminiProviderError(
            429,
            details={"error": {"details": [{"retryDelay": "3600s"}]}},
        )
        secondary = FakeSecondaryProvider()
        service = AIService(lambda: fake_gemini, secondary_provider=secondary)
        with patch.object(main, "AI_SERVICE", service):
            response = client.post(
                "/api/chat",
                json={"message": "What is WBC?", "language": "en"},
            )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertIn("Generated answer from secondary AI", response.json()["reply"])
        self.assertEqual(response.json()["provider"], "secondary")
        self.assertTrue(response.json()["fallback_used"])
        self.assertEqual(len(fake_gemini.models.calls), 1)
        self.assertEqual(len(secondary.calls), 1)
        self.assertEqual(service.status_snapshot()["active_provider"], "secondary")

    def test_chat_falls_back_when_gemini_credentials_are_rejected(self):
        fake_gemini = FakeGeminiClient()
        fake_gemini.models.fail_with = FakeGeminiProviderError(401)
        secondary = FakeSecondaryProvider()
        service = AIService(lambda: fake_gemini, secondary_provider=secondary)
        with patch.object(main, "AI_SERVICE", service):
            response = client.post(
                "/api/chat",
                json={"message": "What is diabetes?", "language": "en"},
            )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["provider"], "secondary")
        self.assertTrue(response.json()["fallback_used"])
        self.assertEqual(len(secondary.calls), 1)

    def test_fallback_preserves_selected_language_and_recent_context(self):
        secondary = FakeSecondaryProvider()
        service = AIService(lambda: None, secondary_provider=secondary)
        history = [
            {"role": "user", "content": "What is WBC?"},
            {"role": "assistant", "content": "WBC means white blood cell."},
        ]
        with patch.object(main, "AI_SERVICE", service):
            for language, question, expected_language in (
                ("en", "What is its normal range?", "clear, simple English"),
                ("te", "దాని సాధారణ పరిధి ఎంత?", "Telugu"),
                ("hi", "इसकी सामान्य सीमा क्या है?", "Hindi"),
            ):
                response = client.post(
                    "/api/chat",
                    json={"message": question, "language": language, "history": history},
                )
                self.assertEqual(response.status_code, 200, response.text)
                self.assertEqual(response.json()["language"], language)
                self.assertEqual(response.json()["provider"], "secondary")
                call = secondary.calls[-1]
                self.assertIn("WBC means white blood cell", call["history"][1]["content"])
                self.assertIn(expected_language, call["system_prompt"])

    def test_chat_returns_generic_error_when_both_providers_fail(self):
        fake_gemini = FakeGeminiClient()
        fake_gemini.models.fail_with = FakeGeminiProviderError(503)
        secondary = FakeSecondaryProvider(
            fail_with=ProviderFailure("secondary", "unavailable", 503)
        )
        service = AIService(lambda: fake_gemini, secondary_provider=secondary)
        with patch.object(main, "AI_SERVICE", service):
            response = client.post(
                "/api/chat",
                json={"message": "What is hemoglobin?", "language": "en"},
            )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "AI services are temporarily unavailable. Please try again later.")
        self.assertNotIn("provider error details are private", response.text)
        self.assertEqual(service.metrics_snapshot()["service"]["provider_switches"], 1)
        self.assertEqual(service.status_snapshot()["status"], "unavailable")

    def test_chat_network_timeout_uses_secondary_provider(self):
        fake_gemini = FakeGeminiClient()
        fake_gemini.models.fail_with = TimeoutError("provider timeout")
        secondary = FakeSecondaryProvider()
        service = AIService(lambda: fake_gemini, secondary_provider=secondary)
        with patch.object(main, "AI_SERVICE", service):
            response = client.post(
                "/api/chat",
                json={"message": "What is blood pressure?", "language": "en"},
            )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["provider"], "secondary")
        self.assertTrue(response.json()["fallback_used"])

    def test_general_question_cache_normalizes_question_and_keeps_language_separate(self):
        fake_gemini = FakeGeminiClient()
        service = AIService(
            lambda: fake_gemini,
            secondary_provider=FakeSecondaryProvider(configured=False),
        )
        with patch.object(main, "AI_SERVICE", service):
            first = client.post("/api/chat", json={"message": "What is WBC?", "language": "en"})
            repeated = client.post("/api/chat", json={"message": "what is wbc?", "language": "en"})
            other_language = client.post("/api/chat", json={"message": "What is WBC?", "language": "hi"})
        self.assertEqual(first.status_code, 200)
        self.assertEqual(repeated.status_code, 200)
        self.assertTrue(repeated.json()["cached"])
        self.assertFalse(first.json()["cached"])
        self.assertEqual(other_language.status_code, 200)
        self.assertFalse(other_language.json()["cached"])
        self.assertEqual(len(fake_gemini.models.calls), 2)
        self.assertEqual(service.metrics_snapshot()["service"]["cache_hits"], 1)

    def test_concurrent_duplicate_questions_share_one_provider_request(self):
        started = threading.Event()
        release = threading.Event()

        class BlockingProvider(FakeSecondaryProvider):
            def generate(self, system_prompt, history, message):
                started.set()
                if not release.wait(timeout=2):
                    raise TimeoutError("test provider release timed out")
                return super().generate(system_prompt, history, message)

        secondary = BlockingProvider()
        service = AIService(lambda: None, secondary_provider=secondary)
        args = ("What is WBC?", "en", [], "Respond in clear, simple English.")
        with ThreadPoolExecutor(max_workers=4) as executor:
            owner = executor.submit(service.generate, *args)
            self.assertTrue(started.wait(timeout=2))
            duplicates = [executor.submit(service.generate, *args) for _ in range(3)]
            time.sleep(0.05)
            release.set()
            results = [owner.result(timeout=3)] + [future.result(timeout=3) for future in duplicates]
        self.assertEqual(len(secondary.calls), 1)
        self.assertTrue(all(result.reply == results[0].reply for result in results))
        self.assertGreaterEqual(
            service.metrics_snapshot()["service"]["deduplicated_requests"],
            1,
        )

    def test_personalized_questions_are_not_cached(self):
        fake_gemini = FakeGeminiClient()
        service = AIService(
            lambda: fake_gemini,
            secondary_provider=FakeSecondaryProvider(configured=False),
        )
        with patch.object(main, "AI_SERVICE", service):
            first = client.post(
                "/api/chat",
                json={"message": "Why do I feel tired often?", "language": "en"},
            )
            second = client.post(
                "/api/chat",
                json={"message": "Why do I feel tired often?", "language": "en"},
            )
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(len(fake_gemini.models.calls), 2)
        self.assertFalse(second.json()["cached"])

    def test_chat_rate_limit_is_per_client_and_returns_retry_after(self):
        fake_gemini = FakeGeminiClient()
        service = AIService(
            lambda: fake_gemini,
            secondary_provider=FakeSecondaryProvider(configured=False),
        )
        with patch.object(main, "AI_SERVICE", service), patch.dict(
            os.environ,
            {"AI_RATE_LIMIT_REQUESTS_PER_MINUTE": "2"},
        ):
            first = client.post("/api/chat", json={"message": "What is WBC?", "language": "en"})
            second = client.post("/api/chat", json={"message": "What is RBC?", "language": "en"})
            limited = client.post("/api/chat", json={"message": "What is hemoglobin?", "language": "en"})
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(limited.status_code, 429)
        self.assertIn("retry-after", limited.headers)

    def test_ai_status_and_admin_metrics_require_configuration(self):
        status_response = client.get("/api/ai/status")
        self.assertEqual(status_response.status_code, 200)
        self.assertIn(status_response.json()["status"], ("available", "switching", "unavailable"))
        with patch.dict(os.environ, {"AI_METRICS_TOKEN": ""}):
            self.assertEqual(client.get("/api/ai/metrics").status_code, 404)
        with patch.dict(os.environ, {"AI_METRICS_TOKEN": "test-monitor-token"}):
            self.assertEqual(client.get("/api/ai/metrics").status_code, 401)
            metrics = client.get(
                "/api/ai/metrics",
                headers={"Authorization": "Bearer test-monitor-token"},
            )
        self.assertEqual(metrics.status_code, 200)
        self.assertIn("service", metrics.json())
        self.assertNotIn("api_key", metrics.text.lower())

    def test_openai_sdk_provider_sends_context_and_parses_generated_answer(self):
        fake_client = SimpleNamespace(
            chat=SimpleNamespace(
                completions=SimpleNamespace(
                    create=unittest.mock.Mock(
                        return_value=SimpleNamespace(
                            choices=[
                                SimpleNamespace(
                                    message=SimpleNamespace(
                                        content="Generated by configured OpenAI."
                                    )
                                )
                            ],
                            usage=SimpleNamespace(prompt_tokens=9, completion_tokens=7),
                        )
                    )
                )
            )
        )
        with patch.dict(
            os.environ,
            {
                "OPENAI_API_KEY": "test-only-openai-key",
                "OPENAI_MODEL": "test-model",
                "OPENAI_TIMEOUT_SECONDS": "30",
            },
        ), patch("openai.OpenAI", return_value=fake_client) as openai_client:
            provider = OpenAIProvider()
            answer = provider.generate(
                "Respond in Telugu.",
                [{"role": "user", "content": "What is WBC?"}],
                "What is its normal range?",
            )
        self.assertTrue(provider.configured)
        self.assertEqual(answer.text, "Generated by configured OpenAI.")
        self.assertEqual(answer.input_tokens, 9)
        self.assertEqual(answer.output_tokens, 7)
        openai_client.assert_called_once_with(
            api_key="test-only-openai-key",
            timeout=30,
            max_retries=0,
        )
        request = fake_client.chat.completions.create.call_args.kwargs
        self.assertEqual(request["model"], "test-model")
        self.assertEqual(request["timeout"], 30)
        self.assertIn("Respond in Telugu.", request["messages"][0]["content"])
        self.assertEqual(request["messages"][1]["content"], "What is WBC?")
        self.assertEqual(request["messages"][2]["content"], "What is its normal range?")

    def test_openai_sdk_provider_classifies_authentication_and_timeout_errors(self):
        class FakeOpenAIError(Exception):
            def __init__(self, status_code):
                super().__init__("private provider error")
                self.status_code = status_code

        with patch.dict(
            os.environ,
            {"OPENAI_API_KEY": "test-only-openai-key", "OPENAI_MODEL": "test-model"},
        ), patch("openai.OpenAI") as openai_client:
            openai_client.return_value.chat.completions.create.side_effect = FakeOpenAIError(401)
            provider = OpenAIProvider()
            with self.assertRaises(ProviderFailure) as authentication_error:
                provider.generate("Answer in English.", [], "What is WBC?")
            self.assertEqual(authentication_error.exception.category, "authentication")
            self.assertEqual(authentication_error.exception.status_code, 401)

            openai_client.return_value.chat.completions.create.side_effect = TimeoutError(
                "private timeout detail"
            )
            provider = OpenAIProvider()
            with self.assertRaises(ProviderFailure) as timeout_error:
                provider.generate("Answer in English.", [], "What is WBC?")
            self.assertEqual(timeout_error.exception.category, "timeout")
            self.assertNotIn("private timeout detail", str(timeout_error.exception))

    def test_openai_quota_error_is_not_retried_without_provider_retry_hint(self):
        class FakeOpenAIError(Exception):
            status_code = 429
            code = "insufficient_quota"

        with patch.dict(
            os.environ,
            {"OPENAI_API_KEY": "test-only-openai-key", "OPENAI_MODEL": "test-model"},
        ), patch("openai.OpenAI") as openai_client:
            openai_client.return_value.chat.completions.create.side_effect = FakeOpenAIError()
            provider = OpenAIProvider()
            with self.assertRaises(ProviderFailure) as quota_error:
                provider.generate("Answer in English.", [], "What is WBC?")

        self.assertEqual(quota_error.exception.category, "rate_limit")
        self.assertEqual(openai_client.return_value.chat.completions.create.call_count, 1)

    def test_openai_sdk_provider_falls_back_after_simulated_gemini_quota_error(self):
        fake_gemini = FakeGeminiClient()
        fake_gemini.models.fail_with = FakeGeminiProviderError(
            429,
            details={"error": {"details": [{"retryDelay": "3600s"}]}},
        )
        fake_openai = SimpleNamespace(
            chat=SimpleNamespace(
                completions=SimpleNamespace(
                    create=unittest.mock.Mock(
                        return_value=SimpleNamespace(
                            choices=[
                                SimpleNamespace(
                                    message=SimpleNamespace(
                                        content="OpenAI generated an answer based on conversation history."
                                    )
                                )
                            ],
                            usage=SimpleNamespace(prompt_tokens=11, completion_tokens=13),
                        )
                    )
                )
            )
        )
        with patch.dict(
            os.environ,
            {
                "OPENAI_API_KEY": "test-only-openai-key",
                "OPENAI_MODEL": "test-model",
            },
        ), patch("openai.OpenAI", return_value=fake_openai), patch.object(
            main, "gemini_client", fake_gemini
        ):
            service = AIService(lambda: fake_gemini)
            with patch.object(main, "AI_SERVICE", service):
                response = client.post(
                    "/api/chat",
                    json={
                        "message": "What is its normal range?",
                        "language": "hi",
                        "history": [
                            {"role": "user", "content": "What is WBC?"},
                            {"role": "assistant", "content": "WBC means white blood cell."},
                        ],
                    },
                )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(
            response.json()["reply"],
            "OpenAI generated an answer based on conversation history.",
        )
        self.assertEqual(response.json()["provider"], "secondary")
        self.assertTrue(response.json()["fallback_used"])
        self.assertEqual(len(fake_gemini.models.calls), 1)
        openai_request = fake_openai.chat.completions.create.call_args.kwargs
        self.assertIn("Respond in Hindi", openai_request["messages"][0]["content"])
        self.assertEqual(openai_request["messages"][1]["content"], "What is WBC?")
        self.assertEqual(
            openai_request["messages"][2]["content"],
            "WBC means white blood cell.",
        )
        self.assertEqual(
            openai_request["messages"][3]["content"],
            "What is its normal range?",
        )

    def test_database_failure_returns_server_error_without_leaking_details(self):
        with patch.object(auth, "connect_db", side_effect=sqlite3.OperationalError("private database path")):
            response = failure_client.post(
                "/api/auth/signup",
                json={
                    "name": "Database Failure",
                    "email": self.email,
                    "password": self.password,
                    "role": "patient",
                },
            )
        self.assertEqual(response.status_code, 500)
        self.assertNotIn("private database path", response.text)

    def test_password_reset_requires_delivery_and_token_is_single_use(self):
        self.signup()
        with patch.object(auth.smtplib, "SMTP", FakeSMTP), self.smtp_environment():
            response = client.post("/api/auth/forgot-password", json={"email": self.email})
            unknown = client.post(
                "/api/auth/forgot-password",
                json={"email": f"unknown-{uuid4().hex[:10]}@example.test"},
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), unknown.json())
        self.assertNotIn("reset_token", response.json())

        reset_link = re.search(r"http://localhost:5173/#reset_token=([^\s]+)", FakeSMTP.messages[0].get_content())
        self.assertIsNotNone(reset_link)
        token = reset_link.group(1)
        reset = client.post(
            "/api/auth/reset-password",
            json={"token": token, "new_password": "new safe password"},
        )
        self.assertEqual(reset.status_code, 200)
        self.assertEqual(
            client.post(
                "/api/auth/reset-password",
                json={"token": token, "new_password": "another new password"},
            ).status_code,
            400,
        )
        self.assertEqual(
            client.post(
                "/api/auth/login",
                json={"email": self.email, "password": self.password},
            ).status_code,
            401,
        )
        self.assertEqual(
            client.post(
                "/api/auth/login",
                json={"email": self.email, "password": "new safe password"},
            ).status_code,
            200,
        )

    def test_password_reset_fails_explicitly_if_smtp_is_missing_or_delivery_fails(self):
        self.signup()
        with patch.dict(
            os.environ,
            {
                "SMTP_HOST": "",
                "SMTP_PORT": "",
                "SMTP_USER": "",
                "SMTP_PASSWORD": "",
                "SMTP_FROM_EMAIL": "",
            },
        ):
            missing = client.post("/api/auth/forgot-password", json={"email": self.email})
        self.assertEqual(missing.status_code, 503)
        self.assertNotIn("reset_token", missing.json())

        FakeSMTP.fail_delivery = True
        with patch.object(auth.smtplib, "SMTP", FakeSMTP), self.smtp_environment():
            failed = client.post("/api/auth/forgot-password", json={"email": self.email})
        self.assertEqual(failed.status_code, 502)
        self.assertNotIn("reset_token", failed.json())

    def test_oauth_status_and_urls_report_missing_configuration(self):
        keys = (
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
            "APPLE_CLIENT_ID",
            "APPLE_TEAM_ID",
            "APPLE_KEY_ID",
            "APPLE_PRIVATE_KEY",
        )
        with patch.dict(os.environ, {key: "" for key in keys}):
            oauth_status = client.get("/api/auth/oauth-status")
            google = client.get("/api/auth/google/url", params={"state": "s" * 64})
            apple = client.get("/api/auth/apple/url", params={"state": "s" * 64})
        self.assertEqual(oauth_status.status_code, 200)
        self.assertFalse(oauth_status.json()["google_configured"])
        self.assertFalse(oauth_status.json()["apple_configured"])
        self.assertFalse(google.json()["configured"])
        self.assertIn("GOOGLE_CLIENT_SECRET", google.json()["required_env_vars"])
        self.assertFalse(apple.json()["configured"])
        self.assertIn("APPLE_PRIVATE_KEY", apple.json()["required_env_vars"])
        insecure_apple_env = {
            "APPLE_CLIENT_ID": "com.example.mediguide",
            "APPLE_TEAM_ID": "TEAM123456",
            "APPLE_KEY_ID": "KEY1234567",
            "APPLE_PRIVATE_KEY": "not-a-real-key",
            "APPLE_REDIRECT_URI": "http://localhost:8000/api/auth/apple/callback",
        }
        with patch.dict(os.environ, insecure_apple_env):
            insecure_apple = client.get(
                "/api/auth/apple/url",
                params={"state": "s" * 64},
            )
        self.assertFalse(insecure_apple.json()["configured"])

    def test_google_oauth_code_exchange_verifies_provider_identity_and_role(self):
        client_id = "test-google-client.apps.example.test"
        state = "g" * 64
        with patch.dict(
            os.environ,
            {
                "GOOGLE_CLIENT_ID": client_id,
                "GOOGLE_CLIENT_SECRET": "test-client-secret",
                "GOOGLE_REDIRECT_URI": "http://localhost:5173/",
            },
        ):
            authorization = client.get(
                "/api/auth/google/url",
                params={"state": state},
            ).json()
            self.assertTrue(authorization["configured"])
            authorization_params = parse_qs(urlparse(authorization["auth_url"]).query)
            self.assertEqual(authorization_params["state"], [state])
            self.assertEqual(authorization_params["redirect_uri"], ["http://localhost:5173/"])
            self.assertEqual(authorization_params["prompt"], ["select_account"])

            google_signing_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            google_jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(google_signing_key.public_key()))
            google_jwk["kid"] = "google-test-key"
            claims = {
                "aud": client_id,
                "iss": "https://accounts.google.com",
                "iat": int(auth.time.time()),
                "exp": int(auth.time.time()) + 300,
                "email_verified": "true",
                "sub": f"google-{uuid4().hex}",
                "email": self.email,
                "name": "Google Test User",
                "picture": "https://profiles.example.test/google-user.png",
            }
            provider_token = jwt.encode(
                claims,
                google_signing_key,
                algorithm="RS256",
                headers={"kid": "google-test-key"},
            )
            with patch.object(
                auth,
                "http_json",
                side_effect=[{"id_token": provider_token}, {"keys": [google_jwk]}],
            ):
                response = client.post(
                    "/api/auth/google/callback",
                    json={
                        "code": "single-use-provider-code",
                        "redirect_uri": "http://localhost:5173/",
                    },
                )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["email"], self.email)
        self.assertEqual(response.json()["user"]["role"], "patient")
        self.assertEqual(response.json()["user"]["name"], "Google Test User")
        self.assertEqual(
            response.json()["user"]["avatar"],
            "https://profiles.example.test/google-user.png",
        )

        existing_email = f"existing-{uuid4().hex[:12]}@example.test"
        registered = self.signup(email=existing_email)
        existing_profile = registered.json()["user"]
        existing_claims = {
            **claims,
            "sub": f"google-{uuid4().hex}",
            "email": existing_email,
            "name": "Updated Google Profile",
            "picture": "https://profiles.example.test/updated-google-user.png",
        }
        existing_token = jwt.encode(
            existing_claims,
            google_signing_key,
            algorithm="RS256",
            headers={"kid": "google-test-key"},
        )
        with patch.dict(
            os.environ,
            {
                "GOOGLE_CLIENT_ID": client_id,
                "GOOGLE_CLIENT_SECRET": "test-client-secret",
                "GOOGLE_REDIRECT_URI": "http://localhost:5173/",
            },
        ), patch.object(
            auth,
            "http_json",
            side_effect=[
                {"id_token": existing_token},
                {"keys": [google_jwk]},
            ],
        ):
            existing_login = client.post(
                "/api/auth/google/callback",
                json={
                    "code": "existing-user-provider-code",
                    "redirect_uri": "http://localhost:5173/",
                },
            )
        self.assertEqual(existing_login.status_code, 200)
        self.assertEqual(existing_login.json()["user"]["id"], existing_profile["id"])
        self.assertEqual(existing_login.json()["user"]["name"], "Updated Google Profile")
        self.assertEqual(
            existing_login.json()["user"]["avatar"],
            "https://profiles.example.test/updated-google-user.png",
        )
        password_login = client.post(
            "/api/auth/login",
            json={"email": existing_email, "password": self.password},
        )
        self.assertEqual(password_login.status_code, 200)

        unverified_token = jwt.encode(
            {**claims, "email_verified": "false"},
            google_signing_key,
            algorithm="RS256",
            headers={"kid": "google-test-key"},
        )
        with patch.dict(
            os.environ,
            {
                "GOOGLE_CLIENT_ID": client_id,
                "GOOGLE_CLIENT_SECRET": "test-client-secret",
                "GOOGLE_REDIRECT_URI": "http://localhost:5173/",
            },
        ), patch.object(auth, "http_json", return_value={"keys": [google_jwk]}):
            rejected = client.post(
                "/api/auth/google/callback",
                json={"id_token": unverified_token, "redirect_uri": "http://localhost:5173/"},
            )
        self.assertEqual(rejected.status_code, 401)

    def test_apple_form_post_validates_signature_and_exchanges_single_use_ticket(self):
        signing_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public_jwk = json.loads(
            jwt.algorithms.RSAAlgorithm.to_jwk(signing_key.public_key())
        )
        public_jwk["kid"] = "apple-test-key"
        apple_client_id = "com.example.mediguide"
        claims = {
            "iss": "https://appleid.apple.com",
            "aud": apple_client_id,
            "sub": f"apple-{uuid4().hex}",
            "email": self.email,
            "email_verified": True,
            "iat": int(auth.time.time()),
            "exp": int(auth.time.time()) + 300,
        }
        id_token = jwt.encode(
            claims,
            signing_key,
            algorithm="RS256",
            headers={"kid": "apple-test-key"},
        )
        client_secret_key = ec.generate_private_key(ec.SECP256R1())
        client_secret_pem = client_secret_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode("ascii")
        state = "a" * 64
        apple_env = {
            "APPLE_CLIENT_ID": apple_client_id,
            "APPLE_TEAM_ID": "TEAM123456",
            "APPLE_KEY_ID": "KEY1234567",
            "APPLE_PRIVATE_KEY": client_secret_pem,
            "APPLE_REDIRECT_URI": "https://auth.example.test/api/auth/apple/callback",
            "FRONTEND_URL": "http://localhost:5173",
        }

        def provider_response(url, data=None, headers=None):
            if url == "https://appleid.apple.com/auth/keys":
                return {"keys": [public_jwk]}
            return {"id_token": id_token}

        with patch.dict(os.environ, apple_env), patch.object(
            auth, "http_json", side_effect=provider_response
        ):
            callback = client.post(
                "/api/auth/apple/callback",
                data={"code": "apple-single-use-code", "state": state},
                follow_redirects=False,
            )
        self.assertEqual(callback.status_code, 303)
        redirect_parts = urlparse(callback.headers["location"])
        self.assertEqual(redirect_parts.path, "/")
        params = parse_qs(redirect_parts.fragment)
        self.assertEqual(params["state"], [state])
        self.assertEqual(params["oauth_provider"], ["apple"])
        ticket = params["oauth_ticket"][0]

        with patch.dict(os.environ, apple_env):
            exchange = client.post(
                "/api/auth/apple/exchange",
                json={"ticket": ticket, "expected_role": "patient"},
            )
            replay = client.post(
                "/api/auth/apple/exchange",
                json={"ticket": ticket, "expected_role": "patient"},
            )
        self.assertEqual(exchange.status_code, 200)
        self.assertEqual(exchange.json()["user"]["email"], self.email)
        self.assertEqual(replay.status_code, 401)

    def test_health_and_sample_report_endpoints(self):
        with patch("backend.main.verify_gemini_connection", return_value=(False, "missing_key", "Demo mode")):
            self.assertEqual(client.get("/api/health").status_code, 200)
        self.assertGreaterEqual(len(client.get("/api/sample-reports").json()), 3)
        self.assertEqual(client.get("/api/comparison-data").status_code, 200)
        self.assertEqual(client.get("/api/sources").status_code, 200)

    def test_gemini_health_check_reports_provider_error_category(self):
        for provider_code, expected_status in (
            (400, "invalid_request"),
            (401, "invalid_key"),
            (403, "permission_denied"),
            (429, "rate_limited"),
            (503, "unavailable"),
        ):
            with self.subTest(provider_code=provider_code):
                fake_gemini = FakeGeminiClient()
                fake_gemini.models.fail_with = FakeGeminiProviderError(provider_code)
                with patch.object(main, "gemini_client", fake_gemini):
                    connected, actual_status, message = main.verify_gemini_connection(force=True)
                self.assertFalse(connected)
                self.assertEqual(actual_status, expected_status)
                self.assertNotIn("provider error details are private", message)


if __name__ == "__main__":
    unittest.main()
