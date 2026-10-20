import os
import re
import smtplib
import tempfile
import unittest
import json
import sqlite3
from pathlib import Path
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa

_test_dir = tempfile.TemporaryDirectory(prefix="mediguide-auth-tests-")
os.environ["MEDIGUIDE_DB_PATH"] = str(Path(_test_dir.name) / "auth-tests.sqlite3")

from fastapi.testclient import TestClient

from backend import auth
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


class AuthenticationTests(unittest.TestCase):
    @classmethod
    def tearDownClass(cls):
        _test_dir.cleanup()

    def setUp(self):
        self.email = f"user-{uuid4().hex[:12]}@example.test"
        self.password = "correct horse battery"
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
            "APPLE_REDIRECT_URI": "http://127.0.0.1:8000/api/auth/apple/callback",
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


if __name__ == "__main__":
    unittest.main()
