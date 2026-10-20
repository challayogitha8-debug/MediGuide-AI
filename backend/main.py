"""
main.py - MediGuide AI Backend Service
FastAPI service providing medical report parsing, Gemini AI explanation, and health assistance.
Educational and informational purposes only.
"""

import io
import json
import logging
import os
import re
from typing import List, Optional, Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pypdf

# Load this service's configuration regardless of the current working directory.
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Setup safe logger (NEVER log sensitive reports or API keys)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("MediGuide")

# Initialize Gemini Client if key is available
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
gemini_client = None

if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
    try:
        from google import genai
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Google Gemini client initialized successfully.")
    except Exception as e:
        logger.warning("Failed to initialize Gemini client.")
        gemini_client = None
else:
    logger.info("No active GEMINI_API_KEY found. Running in high-fidelity Demo Mode.")

import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import sample datasets
from demo_data import (
    SAMPLE_REPORTS,
    COMPARISON_DATASETS,
    TRUSTED_SOURCES,
    DEMO_CHAT_RESPONSES,
    DEFAULT_FALLBACK_CHAT,
)

app = FastAPI(
    title="MediGuide AI API",
    description="Educational AI healthcare information backend with dual English & Telugu support.",
    version="1.0.0",
)

# CORS configuration for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/"),
    ])),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit


# -------------------------------------------------------------
# Pydantic Request & Response Models
# -------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    gemini_configured: bool
    gemini_status: Optional[str] = "missing_key"
    gemini_message: Optional[str] = None
    model: str
    version: str
    features: List[str]


class TestResultItem(BaseModel):
    test_name: str
    value: Any
    unit: str = ""
    reference_range: str = ""
    status: str = "unspecified"  # normal, high, low, borderline, unspecified
    description: str = ""
    description_te: Optional[str] = ""


class PatientInfo(BaseModel):
    name: Optional[str] = "Confidential / Patient"
    age_range: Optional[str] = "Not Specified"
    gender: Optional[str] = "Not Specified"
    date: Optional[str] = "Recent"


class ReportSummary(BaseModel):
    overview_en: str
    overview_te: str
    key_takeaways_en: List[str]
    key_takeaways_te: List[str]
    questions_for_doctor_en: List[str]
    questions_for_doctor_te: List[str]
    disclaimer: str


class AnalyzeReportResponse(BaseModel):
    mode: str  # "ai" or "demo"
    filename: str
    extracted_text_preview: str
    raw_text_length: int
    is_scanned_pdf: bool
    language: str  # "en" or "te"
    report_type: str
    patient_info: PatientInfo
    test_results: List[TestResultItem]
    summary: ReportSummary


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    language: str = Field("en", pattern="^(en|te)$")
    history: Optional[List[ChatMessage]] = []


class ChatSource(BaseModel):
    title: str
    organization: str
    url: str
    topic: str


class ChatResponse(BaseModel):
    mode: str
    reply: str
    language: str
    suggested_questions: List[str]
    trusted_sources: List[ChatSource]
    disclaimer: str


# -------------------------------------------------------------
# System Prompts & Safety Guidelines
# -------------------------------------------------------------

MEDICAL_SAFETY_SYSTEM_PROMPT = """
You are MediGuide AI, an educational healthcare information assistant.
Your sole purpose is to help users understand medical laboratory terms and general health metrics in simple language.

CRITICAL MEDICAL SAFETY RULES:
1. NEVER provide a definitive clinical diagnosis.
2. NEVER prescribe medications, calculate drug dosages, or recommend stopping existing treatments.
3. NEVER make conclusive judgements based on isolated lab values. Always clarify that lab metrics require holistic medical evaluation.
4. Encourage the user to discuss all results with a qualified healthcare professional.
5. If the extracted text does not state a reference range or value, DO NOT invent or fabricate them.
6. Support bilingual output in English and Telugu (తెలుగు) as requested.
7. Return strictly valid JSON when requested.
"""


# -------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------

def extract_text_from_pdf(pdf_bytes: bytes) -> tuple[str, bool]:
    """
    Extracts text from PDF bytes using pypdf.
    Returns (extracted_text, is_scanned_or_empty).
    """
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted_pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                extracted_pages.append(text.strip())

        full_text = "\n\n".join(extracted_pages).strip()
        # If extracted text is under 30 characters, it is likely a scanned image or photograph
        is_scanned = len(full_text) < 30
        return full_text, is_scanned
    except Exception as e:
        logger.error(f"Error parsing PDF with pypdf: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not parse the PDF file. Please ensure it is a valid, uncorrupted PDF document.",
        )


def analyze_with_gemini(extracted_text: str, language: str) -> Optional[Dict[str, Any]]:
    """
    Calls the Google Gemini API using google-genai SDK to parse and explain medical report text.
    Returns structured dict or None if API fails or is not configured.
    """
    global gemini_client
    if not gemini_client:
        return None

    prompt = f"""
Analyze the following extracted medical laboratory report text strictly for educational purposes.
Language requested for explanations: {language} (Provide both English and Telugu summaries).

Extracted Report Text:
---
{extracted_text[:4000]}
---

Extract the test items accurately. DO NOT hallucinate values.
Produce a JSON response matching this schema:
{{
  "report_type": "string describing type of test (e.g. Complete Blood Count, Lipid Panel)",
  "patient_info": {{
    "name": "Patient name or Anonymous",
    "age_range": "e.g. 30-40 or Not Specified",
    "gender": "Male / Female / Not Specified",
    "date": "Date if present or Recent"
  }},
  "test_results": [
    {{
      "test_name": "Name of test/analyte",
      "value": "Extracted numerical or qualitative value",
      "unit": "Unit (e.g. g/dL, mg/dL, /uL) or blank",
      "reference_range": "Reference range exactly as listed or blank",
      "status": "normal" | "high" | "low" | "borderline" | "unspecified",
      "description": "Simple 1-2 sentence English explanation of what this biomarker measures",
      "description_te": "Simple 1-2 sentence Telugu explanation of what this biomarker measures"
    }}
  ],
  "summary": {{
    "overview_en": "Clear 2-3 sentence overview in simple English explaining general observations without diagnosing.",
    "overview_te": "Clear 2-3 sentence overview in Telugu explaining general observations without diagnosing.",
    "key_takeaways_en": ["Key educational observation 1", "Key educational observation 2"],
    "key_takeaways_te": ["తెలుగు పరిశీలన 1", "తెలుగు పరిశీలన 2"],
    "questions_for_doctor_en": ["Educational question to ask doctor 1", "Question 2"],
    "questions_for_doctor_te": ["వైద్యుడిని అడగవలసిన ప్రశ్న 1", "ప్రశ్న 2"],
    "disclaimer": "This information is educational and not a medical diagnosis. Consult your doctor."
  }}
}}
Return ONLY valid JSON.
"""

    # We try gemini-3.8-flash first, then fallbacks
    models_to_try = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    for model_name in models_to_try:
        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                system_instruction=MEDICAL_SAFETY_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.2,
            )
            response = gemini_client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            text_resp = response.text.strip()
            # Clean possible markdown fence if present
            if text_resp.startswith("```json"):
                text_resp = text_resp[7:]
            if text_resp.startswith("```"):
                text_resp = text_resp[3:]
            if text_resp.endswith("```"):
                text_resp = text_resp[:-3]
            parsed = json.loads(text_resp.strip())
            return parsed
        except Exception as err:
            logger.warning(f"Gemini API call failed with model {model_name}.")
            continue

    return None


def chat_with_gemini(message: str, language: str, history: List[ChatMessage]) -> Optional[str]:
    """
    Answers general health questions safely using Gemini.
    """
    global gemini_client
    if not gemini_client:
        return None

    lang_instruction = "Respond in Telugu (తెలుగు script)" if language == "te" else "Respond in clear, simple English"
    
    conversation_context = ""
    for h in history[-4:]:
        conversation_context += f"{h.role.capitalize()}: {h.content}\n"

    prompt = f"""
User Question: {message}

Language Requirement: {lang_instruction}.
Context:
{conversation_context}

Provide a helpful, educational answer explaining relevant medical terms, typical ranges, and lifestyle principles.
Follow all medical safety rules: do NOT diagnose, do NOT prescribe drugs or dosages, and remind the user to consult their healthcare provider.
"""

    models_to_try = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    for model_name in models_to_try:
        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                system_instruction=MEDICAL_SAFETY_SYSTEM_PROMPT,
                temperature=0.3,
            )
            response = gemini_client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            return response.text.strip()
        except Exception as err:
            logger.warning(f"Gemini chat failed with model {model_name}.")
            continue

    return None


import time

_gemini_connection_cache = {
    "verified": False,
    "last_checked": 0.0,
    "status": "missing_key",
    "message": "No GEMINI_API_KEY configured",
}


def verify_gemini_connection(force: bool = False) -> tuple[bool, str, str]:
    """
    Verifies actual connectivity with the Google Gemini API using the configured key.
    Checks not only key existence, but tests model connectivity, invalid keys, and API errors.
    Never leaks the raw API key in the returned message.
    """
    global gemini_client, _gemini_connection_cache

    now = time.time()
    if not force and _gemini_connection_cache["last_checked"] > 0 and (now - _gemini_connection_cache["last_checked"] < 60):
        return (
            _gemini_connection_cache["verified"],
            _gemini_connection_cache["status"],
            _gemini_connection_cache["message"],
        )

    # Check / re-read env if client not initialized
    load_dotenv()
    current_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not current_key or current_key == "your_gemini_api_key_here":
        gemini_client = None
        _gemini_connection_cache = {
            "verified": False,
            "last_checked": now,
            "status": "missing_key",
            "message": "No GEMINI_API_KEY found in backend/.env",
        }
        return False, "missing_key", _gemini_connection_cache["message"]

    if gemini_client is None:
        try:
            from google import genai
            gemini_client = genai.Client(api_key=current_key)
        except Exception as err:
            _gemini_connection_cache = {
                "verified": False,
                "last_checked": now,
                "status": "invalid_key",
                "message": "Failed to initialize Gemini client with configured key.",
            }
            return False, "invalid_key", _gemini_connection_cache["message"]

    # Active ping test with gemini-3.8-flash
    try:
        res = gemini_client.models.generate_content(
            model="gemini-3.8-flash",
            contents="Respond with the word pong.",
        )
        if res and (res.text or res.candidates):
            _gemini_connection_cache = {
                "verified": True,
                "last_checked": now,
                "status": "connected",
                "message": "Gemini AI is connected and ready to use.",
            }
            return True, "connected", _gemini_connection_cache["message"]
        else:
            raise Exception("Empty response returned by Gemini service.")
    except Exception as e:
        err_str = str(e)
        logger.warning("Gemini live verification check failed.")
        if "API_KEY_INVALID" in err_str or "invalid" in err_str.lower() or "400" in err_str or "403" in err_str:
            status = "invalid_key"
            msg = "The configured Gemini API key is invalid or unauthorized."
        elif "quota" in err_str.lower() or "429" in err_str:
            status = "error"
            msg = "Gemini API quota exceeded or rate limit reached."
        else:
            status = "error"
            msg = "Failed to connect to Google Gemini service."

        _gemini_connection_cache = {
            "verified": False,
            "last_checked": now,
            "status": status,
            "message": msg,
        }
        return False, status, msg


# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse)
async def health_check(check: bool = False):
    """Returns the operational status of MediGuide AI and actual Gemini connectivity."""
    is_connected, gemini_status, gemini_msg = verify_gemini_connection(force=check)
    return HealthResponse(
        status="ok",
        gemini_configured=is_connected,
        gemini_status=gemini_status,
        gemini_message=gemini_msg,
        model="gemini-3.8-flash" if is_connected else "Demo Fallback Mode",
        version="1.0.0",
        features=[
            "PDF Text Extraction (pypdf)",
            "English & Telugu Bilingual Summaries",
            "Structured Lab Result Extraction",
            "Scanned PDF Detection",
            "Safe AI Health Assistant",
            "Longitudinal Report Comparison",
            "Trusted Public Health Reference Library",
        ],
    )


from backend.auth import router as auth_router

app.include_router(auth_router)


@app.get("/api/sample-reports")
async def get_sample_reports():
    """Returns available sample reports for quick 1-click testing."""
    return [
        {
            "id": r["id"],
            "title": r["title"],
            "title_te": r["title_te"],
            "report_type": r["report_type"],
            "patient_info": r["patient_info"],
        }
        for r in SAMPLE_REPORTS.values()
    ]


@app.get("/api/comparison-data")
async def get_comparison_data():
    """Returns longitudinal comparison datasets for the Report Comparison page."""
    return COMPARISON_DATASETS


@app.get("/api/sources")
async def get_sources():
    """Returns curated trusted health information sources."""
    return TRUSTED_SOURCES


@app.post("/api/analyze-report", response_model=AnalyzeReportResponse)
async def analyze_report(
    file: Optional[UploadFile] = File(None),
    sample_id: Optional[str] = Form(None),
    language: str = Form("en"),
):
    """
    Parses and analyzes a medical laboratory report.
    Accepts either an uploaded PDF file or a sample report ID ('cbc', 'lipid', 'metabolic').
    """
    if language not in ("en", "te"):
        language = "en"

    # Case 1: User requested a predefined sample report
    if sample_id and sample_id in SAMPLE_REPORTS:
        sample = SAMPLE_REPORTS[sample_id]
        return AnalyzeReportResponse(
            mode="demo",
            filename=f"Sample_{sample_id.upper()}_Report.pdf",
            extracted_text_preview=sample["raw_text"],
            raw_text_length=len(sample["raw_text"]),
            is_scanned_pdf=False,
            language=language,
            report_type=sample["report_type"],
            patient_info=PatientInfo(**sample["patient_info"]),
            test_results=[TestResultItem(**item) for item in sample["test_results"]],
            summary=ReportSummary(**sample["summary"]),
        )

    # Case 2: User uploaded a file
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a PDF file or select an interactive sample report.",
        )

    # Validate file extension and mime type
    filename = file.filename or "uploaded_report.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. MediGuide AI supports PDF files (.pdf) only.",
        )

    # Read file content safely with size limit
    content = await file.read()
    if len(content) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 10 MB limit. Please upload a smaller PDF.",
        )

    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid PDF document header.",
        )

    logger.info("Processing uploaded PDF (%s bytes).", len(content))

    # Extract text using pypdf
    extracted_text, is_scanned = extract_text_from_pdf(content)

    if is_scanned:
        # PDF is scanned image or has no readable text
        return AnalyzeReportResponse(
            mode="demo",
            filename=filename,
            extracted_text_preview="[Notice: No readable text layer found in this PDF document. The document appears to be a scanned image or photograph.]",
            raw_text_length=len(extracted_text),
            is_scanned_pdf=True,
            language=language,
            report_type="Scanned Document / Unextractable Text",
            patient_info=PatientInfo(),
            test_results=[],
            summary=ReportSummary(
                overview_en="This uploaded PDF does not contain extractable digital text. It is likely a scanned photo or image-only PDF. MediGuide AI currently parses digital text layers to protect accuracy and prevent inventing test values.",
                overview_te="ఈ PDF లో డిజిటల్ టెక్స్ట్ లేయర్ కనుగొనబడలేదు. ఇది స్కాన్ చేసిన ఫోటో లేదా ఇమేజ్ అయి ఉండవచ్చు. తప్పు సమాచారం నివారించడానికి టెక్స్ట్ స్పష్టంగా ఉన్న డిజిటల్ PDF ని ఉపయోగించండి.",
                key_takeaways_en=[
                    "Document appears to be an image/scan without text.",
                    "No lab parameters could be verified without text.",
                    "Try requesting a digital PDF from your diagnostic lab portal, or test with our built-in sample reports."
                ],
                key_takeaways_te=[
                    "పత్రంలో చదవదగిన టెక్స్ట్ కనుగొనబడలేదు.",
                    "డిజిటల్ ల్యాబ్ కాపీని అప్‌లోడ్ చేయండి లేదా మా నమూనా నివేదికలను పరీక్షించండి."
                ],
                questions_for_doctor_en=[
                    "Can your diagnostic center provide an electronic/downloadable PDF report?"
                ],
                questions_for_doctor_te=[
                    "డయాగ్నస్టిక్ సెంటర్ నుండి డిజిటల్ పిడిఎఫ్ కాపీ పొందవచ్చా?"
                ],
                disclaimer="No clinical content could be extracted from this image-only document.",
            ),
        )

    # Attempt AI analysis if Gemini is available
    ai_result = analyze_with_gemini(extracted_text, language)

    if ai_result:
        # Live Gemini Analysis
        try:
            return AnalyzeReportResponse(
                mode="ai",
                filename=filename,
                extracted_text_preview=extracted_text[:1200] + ("..." if len(extracted_text) > 1200 else ""),
                raw_text_length=len(extracted_text),
                is_scanned_pdf=False,
                language=language,
                report_type=ai_result.get("report_type", "Laboratory Report"),
                patient_info=PatientInfo(**ai_result.get("patient_info", {})),
                test_results=[TestResultItem(**item) for item in ai_result.get("test_results", [])],
                summary=ReportSummary(**ai_result.get("summary", {})),
            )
        except Exception as e:
            logger.error("Error structuring Gemini response (%s).", type(e).__name__)

    # Fallback to Demo matching if Gemini is not configured or failed
    # Check if text matches CBC, Lipid, or Metabolic
    text_lower = extracted_text.lower()
    chosen_sample = SAMPLE_REPORTS["cbc"]
    if "cholesterol" in text_lower or "lipid" in text_lower or "triglyceride" in text_lower:
        chosen_sample = SAMPLE_REPORTS["lipid"]
    elif "glucose" in text_lower or "creatinine" in text_lower or "metabolic" in text_lower or "kidney" in text_lower:
        chosen_sample = SAMPLE_REPORTS["metabolic"]

    return AnalyzeReportResponse(
        mode="demo",
        filename=filename,
        extracted_text_preview=extracted_text[:1200] + ("..." if len(extracted_text) > 1200 else ""),
        raw_text_length=len(extracted_text),
        is_scanned_pdf=False,
        language=language,
        report_type=chosen_sample["report_type"] + " (Demo Interpretation)",
        patient_info=PatientInfo(**chosen_sample["patient_info"]),
        test_results=[TestResultItem(**item) for item in chosen_sample["test_results"]],
        summary=ReportSummary(**chosen_sample["summary"]),
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat_assistant(request: ChatRequest):
    """
    Handles user inquiries regarding medical terms, test explanations, and wellness questions.
    Provides answers in English or Telugu with supporting references.
    """
    message = request.message.strip()
    language = request.language

    # Default trusted sources to display alongside response
    sources = [
        ChatSource(
            title=TRUSTED_SOURCES[0]["title"],
            organization=TRUSTED_SOURCES[0]["organization"],
            url=TRUSTED_SOURCES[0]["url"],
            topic="Laboratory Tests & Clinical References",
        ),
        ChatSource(
            title=TRUSTED_SOURCES[1]["title"],
            organization=TRUSTED_SOURCES[1]["organization"],
            url=TRUSTED_SOURCES[1]["url"],
            topic="Global Health Topics & Guidelines",
        ),
    ]

    # Try live Gemini assistant
    gemini_reply = chat_with_gemini(message, language, request.history or [])
    if gemini_reply:
        suggested = [
            "What questions should I ask my doctor about this?",
            "Can you explain the standard reference ranges for this test?",
            "What lifestyle habits support these biomarkers?",
        ]
        if language == "te":
            suggested = [
                "దీని గురించి డాక్టర్‌ని ఎలాంటి ప్రశ్నలు అడగాలి?",
                "ఈ పరీక్ష సాధారణ పరిమితులు ఏమిటి?",
                "ఆరోగ్యకరమైన అలవాట్లు ఏమిటి?",
            ]

        return ChatResponse(
            mode="ai",
            reply=gemini_reply,
            language=language,
            suggested_questions=suggested,
            trusted_sources=sources,
            disclaimer="Educational information only. This assistant does not diagnose conditions or prescribe medications. Consult a licensed physician.",
        )

    # Demo Mode Fallback: Match keywords from user message
    msg_lower = message.lower()
    selected_demo = None
    for entry in DEMO_CHAT_RESPONSES:
        if any(kw in msg_lower for kw in entry["keywords"]):
            selected_demo = entry
            break

    if selected_demo:
        reply_text = selected_demo["reply_te"] if language == "te" else selected_demo["reply_en"]
        suggested = selected_demo["suggested_questions"]
    else:
        reply_text = DEFAULT_FALLBACK_CHAT["reply_te"] if language == "te" else DEFAULT_FALLBACK_CHAT["reply_en"]
        suggested = DEFAULT_FALLBACK_CHAT["suggested_questions"]

    return ChatResponse(
        mode="demo",
        reply=reply_text,
        language=language,
        suggested_questions=suggested,
        trusted_sources=sources,
        disclaimer="Demo mode response. For real-time AI reasoning, configure GEMINI_API_KEY. Not medical advice.",
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
