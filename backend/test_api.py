"""
test_api.py - Comprehensive API testing script for MediGuide AI backend.
Verifies all endpoints, PDF processing, scanned PDF detection, and chat responses.
"""

import sys
import os
from starlette.testclient import TestClient

# Ensure backend module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import app

client = TestClient(app)

def test_health():
    print("\n--- Testing GET /api/health ---")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["status"] == "ok"
    print(f"PASS: Health OK. Gemini configured: {data['gemini_configured']}, Model: {data['model']}")

def test_sample_reports():
    print("\n--- Testing GET /api/sample-reports ---")
    res = client.get("/api/sample-reports")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3
    print(f"PASS: Retrieved {len(data)} sample reports: {[r['id'] for r in data]}")

def test_analyze_sample_form():
    print("\n--- Testing POST /api/analyze-report (Sample CBC) ---")
    res = client.post("/api/analyze-report", data={"sample_id": "cbc", "language": "en"})
    assert res.status_code == 200
    data = res.json()
    assert data["report_type"] == "Hematology / Complete Blood Count"
    assert len(data["test_results"]) > 0
    assert "Hemoglobin" in data["test_results"][0]["test_name"]
    print(f"PASS: Sample CBC parsed. Found {len(data['test_results'])} parameters.")

def test_analyze_uploaded_pdf():
    print("\n--- Testing POST /api/analyze-report (Uploaded CBC PDF) ---")
    pdf_path = os.path.join(os.path.dirname(__file__), "..", "sample_reports", "Sample_CBC_Lab_Report.pdf")
    with open(pdf_path, "rb") as f:
        res = client.post(
            "/api/analyze-report",
            files={"file": ("Sample_CBC.pdf", f, "application/pdf")},
            data={"language": "en"}
        )
    assert res.status_code == 200
    data = res.json()
    assert not data["is_scanned_pdf"]
    assert len(data["test_results"]) > 0
    print(f"PASS: Uploaded PDF parsed successfully. {len(data['test_results'])} tests extracted.")

def test_analyze_scanned_pdf():
    print("\n--- Testing POST /api/analyze-report (Scanned PDF Detection) ---")
    pdf_path = os.path.join(os.path.dirname(__file__), "..", "sample_reports", "Sample_Scanned_Document.pdf")
    with open(pdf_path, "rb") as f:
        res = client.post(
            "/api/analyze-report",
            files={"file": ("Scanned_Doc.pdf", f, "application/pdf")},
            data={"language": "te"}
        )
    assert res.status_code == 200
    data = res.json()
    assert data["is_scanned_pdf"] is True
    print(f"PASS: Scanned PDF correctly detected without crashing. is_scanned_pdf={data['is_scanned_pdf']}")

def test_chat_english():
    print("\n--- Testing POST /api/chat (English) ---")
    res = client.post("/api/chat", json={
        "message": "What does a high LDL cholesterol result mean for my health?",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    assert len(data["reply"]) > 50
    assert len(data["trusted_sources"]) > 0
    print(f"PASS: English Chat response received ({len(data['reply'])} chars). Mode: {data['mode']}")

def test_chat_telugu():
    print("\n--- Testing POST /api/chat (Telugu) ---")
    res = client.post("/api/chat", json={
        "message": "రక్తంలో హిమోగ్లోబిన్ తక్కువగా ఉంటే ఏమిటి?",
        "language": "te"
    })
    assert res.status_code == 200
    data = res.json()
    assert len(data["reply"]) > 50
    print(f"PASS: Telugu Chat response received ({len(data['reply'])} chars). Mode: {data['mode']}")

def test_comparison_and_sources():
    print("\n--- Testing Comparison & Sources Endpoints ---")
    res_comp = client.get("/api/comparison-data")
    assert res_comp.status_code == 200
    assert "lipid_panel" in res_comp.json()

    res_src = client.get("/api/sources")
    assert res_src.status_code == 200
    assert len(res_src.json()) >= 4
    print("PASS: Comparison datasets and trusted sources retrieved successfully.")

if __name__ == "__main__":
    test_health()
    test_sample_reports()
    test_analyze_sample_form()
    test_analyze_uploaded_pdf()
    test_analyze_scanned_pdf()
    test_chat_english()
    test_chat_telugu()
    test_comparison_and_sources()
    print("\n>>> ALL TESTS PASSED! Backend is 100% Hackathon-Ready. <<<")
