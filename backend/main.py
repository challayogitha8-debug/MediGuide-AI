"""
main.py - MediGuide AI Backend Service
FastAPI service providing medical report parsing, Gemini AI explanation, and health assistance.
Educational and informational purposes only.
"""

import io
import hmac
import json
import logging
import math
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import List, Optional, Dict, Any, Literal

from dotenv import load_dotenv
import uuid
from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import pypdf

from backend.ai_service import (
    AIService,
    GeneratedAnswer,
    build_medical_system_prompt,
    provider_retry_delay,
)

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
        from google.genai import types
        gemini_client = genai.Client(
            api_key=GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=30_000),
        )
        logger.info("Google Gemini client initialized successfully.")
    except Exception as e:
        logger.warning("Failed to initialize Gemini client.")
        gemini_client = None
else:
    logger.info("No active GEMINI_API_KEY found. Gemini provider is not configured.")

AI_SERVICE = AIService(lambda: gemini_client)

import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import sample datasets
from demo_data import (
    SAMPLE_REPORTS,
    COMPARISON_DATASETS,
    TRUSTED_SOURCES,
)

app = FastAPI(
    title="MediGuide AI API",
    description="Educational AI healthcare information backend with English, Telugu, and Hindi support.",
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
    secondary_ai_configured: bool = False
    ai_available: bool = False
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
    description_hi: Optional[str] = ""


class PatientInfo(BaseModel):
    name: Optional[str] = "Confidential / Patient"
    age_range: Optional[str] = "Not Specified"
    gender: Optional[str] = "Not Specified"
    date: Optional[str] = "Recent"


class ReportSummary(BaseModel):
    overview_en: str
    overview_te: str
    overview_hi: str = ""
    key_takeaways_en: List[str]
    key_takeaways_te: List[str]
    key_takeaways_hi: List[str] = Field(default_factory=list)
    questions_for_doctor_en: List[str]
    questions_for_doctor_te: List[str]
    questions_for_doctor_hi: List[str] = Field(default_factory=list)
    disclaimer: str


class AnalyzeReportResponse(BaseModel):
    id: Optional[str] = None
    mode: str  # "ai" or "demo"
    filename: str
    extracted_text_preview: str
    raw_text_length: int
    is_scanned_pdf: bool
    language: str  # "en", "te", or "hi"
    report_type: str
    patient_info: PatientInfo
    test_results: List[TestResultItem]
    summary: ReportSummary
    abnormal_count: Optional[int] = 0
    status: Optional[str] = "completed"
    file_size: Optional[int] = 0


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    language: str = Field("en", pattern="^(en|te|hi)$")
    history: List[ChatMessage] = Field(default_factory=list, max_length=12)


class ChatSource(BaseModel):
    title: str
    organization: str
    url: str
    topic: str


class ChatResponse(BaseModel):
    mode: Literal["ai"]
    reply: str
    language: str
    suggested_questions: List[str]
    trusted_sources: List[ChatSource]
    disclaimer: str
    provider: str
    fallback_used: bool = False
    cached: bool = False


class NearbyHospitalRequest(BaseModel):
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    address: Optional[str] = Field(default=None, min_length=3, max_length=200)



# -------------------------------------------------------------
# Real Geocoding & Verified Hospital Search
# -------------------------------------------------------------

VERIFIED_METRO_HOSPITALS = [
    {
        "id": "hosp_aiims_delhi",
        "name": "AIIMS New Delhi (All India Institute of Medical Sciences)",
        "address": "Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029",
        "phone": "+91 11 2658 8500",
        "latitude": 28.5672,
        "longitude": 77.2100,
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=28.5672,77.2100",
    },
    {
        "id": "hosp_apollo_hyd",
        "name": "Apollo Hospitals, Jubilee Hills",
        "address": "Road No. 72, Opposite Bharatiya Vidya Bhavan School, Jubilee Hills, Hyderabad, Telangana 500033",
        "phone": "+91 40 2360 7777",
        "latitude": 17.4265,
        "longitude": 78.4118,
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=17.4265,78.4118",
    },
    {
        "id": "hosp_kims_hyd",
        "name": "KIMS Hospitals (Krishna Institute of Medical Sciences)",
        "address": "1-8-31/1, Minister Road, Krishna Nagar Colony, Begumpet, Secunderabad, Telangana 500003",
        "phone": "+91 40 4488 5000",
        "latitude": 17.4382,
        "longitude": 78.4878,
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=17.4382,78.4878",
    },
    {
        "id": "hosp_care_hyd",
        "name": "CARE Hospitals, Banjara Hills",
        "address": "Road No. 1, Prem Nagar, Banjara Hills, Hyderabad, Telangana 500034",
        "phone": "+91 40 6165 6565",
        "latitude": 17.4143,
        "longitude": 78.4485,
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=17.4143,78.4485",
    },
    {
        "id": "hosp_fortis_blr",
        "name": "Fortis Hospital, Bannerghatta Road",
        "address": "154/9, Bannerghatta Main Rd, Opposite IIM-B, Bilekahalli, Bengaluru, Karnataka 560076",
        "phone": "+91 80 6621 4444",
        "latitude": 12.8938,
        "longitude": 77.5973,
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=12.8938,77.5973",
    },
    {
        "id": "hosp_manipal_blr",
        "name": "Manipal Hospital, Old Airport Road",
        "address": "98, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017",
        "phone": "+91 80 2502 4444",
        "latitude": 12.9585,
        "longitude": 77.6496,
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=12.9585,77.6496",
    },
    {
        "id": "hosp_lilavati_mum",
        "name": "Lilavati Hospital and Research Centre",
        "address": "A-791, Bandra Reclamation, Bandra West, Mumbai, Maharashtra 400050",
        "phone": "+91 22 2675 1000",
        "latitude": 19.0511,
        "longitude": 72.8291,
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=19.0511,72.8291",
    },
    {
        "id": "hosp_kokilaben_mum",
        "name": "Kokilaben Dhirubhai Ambani Hospital",
        "address": "Rao Saheb, Achutrao Patwardhan Marg, Four Bungalows, Andheri West, Mumbai, Maharashtra 400053",
        "phone": "+91 22 4269 6969",
        "latitude": 19.1317,
        "longitude": 72.8252,
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=19.1317,72.8252",
    },
    {
        "id": "hosp_apollo_chennai",
        "name": "Apollo Hospitals, Greams Road",
        "address": "21, Greams Lane, Off Greams Road, Thousand Lights, Chennai, Tamil Nadu 600006",
        "phone": "+91 44 2829 0200",
        "latitude": 13.0617,
        "longitude": 80.2522,
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=13.0617,80.2522",
    },
    {
        "id": "hosp_ruby_kolkata",
        "name": "Ruby General Hospital",
        "address": "576, Anandapur Main Rd, Golpark, Sector I, Kasba, Kolkata, West Bengal 700107",
        "phone": "+91 33 3987 1800",
        "latitude": 22.5135,
        "longitude": 88.4042,
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=22.5135,88.4042",
    },
]

def calculate_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r_lat1, r_lat2 = math.radians(lat1), math.radians(lat2)
    d_lat = r_lat2 - r_lat1
    d_lon = math.radians(lon2 - lon1)
    arc = math.sin(d_lat / 2) ** 2 + math.cos(r_lat1) * math.cos(r_lat2) * math.sin(d_lon / 2) ** 2
    return round(6371 * 2 * math.atan2(math.sqrt(arc), math.sqrt(1 - arc)), 1)

def _osm_search_hospitals(latitude: float, longitude: float, radius_km: float = 15.0) -> list[dict[str, Any]]:
    radius_meters = int(radius_km * 1000)
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""[out:json][timeout:8];
    (
      node["amenity"="hospital"](around:{radius_meters},{latitude},{longitude});
      way["amenity"="hospital"](around:{radius_meters},{latitude},{longitude});
    );
    out center 12;
    """
    req = urllib.request.Request(
        overpass_url,
        data=query.encode("utf-8"),
        headers={"User-Agent": "MediGuideAI/1.0 (Emergency-Locator; contact@mediguide.ai)"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            data = json.loads(response.read().decode("utf-8"))
        results = []
        for el in data.get("elements", []):
            tags = el.get("tags", {})
            name = tags.get("name") or tags.get("name:en")
            if not name:
                continue
            lat = el.get("lat") or el.get("center", {}).get("lat")
            lon = el.get("lon") or el.get("center", {}).get("lon")
            if not lat or not lon:
                continue
            dist = calculate_haversine(latitude, longitude, lat, lon)
            addr_parts = [tags.get("addr:street"), tags.get("addr:suburb"), tags.get("addr:city"), tags.get("addr:postcode")]
            addr = ", ".join([p for p in addr_parts if p]) or f"Near coordinates {lat:.4f}, {lon:.4f}"
            phone = tags.get("phone") or tags.get("contact:phone") or tags.get("emergency:phone")
            results.append({
                "id": f"osm_{el.get('id')}",
                "name": name,
                "address": addr,
                "phone": phone,
                "distance_km": dist,
                "google_maps_url": f"https://www.google.com/maps/search/?api=1&query={lat},{lon}",
            })
        results.sort(key=lambda x: x["distance_km"])
        return results
    except Exception as e:
        logger.warning("Overpass hospital search failed (%s), falling back to registry.", type(e).__name__)
        return []

def _fallback_hospitals_search(lat: Optional[float], lon: Optional[float], address: Optional[str]) -> list[dict[str, Any]]:
    if lat is not None and lon is not None:
        osm_res = _osm_search_hospitals(lat, lon)
        if osm_res:
            return osm_res
        # Compute distances against verified hospital directory
        results = []
        for h in VERIFIED_METRO_HOSPITALS:
            dist = calculate_haversine(lat, lon, h["latitude"], h["longitude"])
            item = dict(h)
            item["distance_km"] = dist
            results.append(item)
        results.sort(key=lambda x: x["distance_km"])
        return results[:8]

    # If address query
    clean_addr = (address or "").strip().lower()
    matches = [
        h for h in VERIFIED_METRO_HOSPITALS
        if any(term in h["address"].lower() or term in h["name"].lower() for term in clean_addr.split() if len(term) >= 3)
    ]
    if matches:
        return [dict(m, distance_km=None) for m in matches]
    return [dict(m, distance_km=None) for m in VERIFIED_METRO_HOSPITALS[:6]]

def _google_places_search(request: NearbyHospitalRequest) -> list[dict[str, Any]]:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if not api_key:
        return _fallback_hospitals_search(request.latitude, request.longitude, request.address)

    if request.latitude is not None and request.longitude is not None:
        search_url = "https://places.googleapis.com/v1/places:searchNearby"
        payload: dict[str, Any] = {
            "includedTypes": ["hospital"],
            "maxResultCount": 10,
            "locationRestriction": {
                "circle": {
                    "center": {
                        "latitude": request.latitude,
                        "longitude": request.longitude,
                    },
                    "radius": 5000,
                }
            },
        }
    elif request.address and request.address.strip():
        search_url = "https://places.googleapis.com/v1/places:searchText"
        payload = {
            "textQuery": f"hospitals near {request.address.strip()}",
            "includedType": "hospital",
            "maxResultCount": 10,
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide both latitude and longitude, or enter a city or address.",
        )

    provider_request = urllib.request.Request(
        search_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": (
                "places.id,places.displayName,places.formattedAddress,"
                "places.location,places.nationalPhoneNumber"
            ),
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(provider_request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        logger.warning("Google Places search failed with HTTP %s.", error.code)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Nearby hospital information could not be retrieved. Please try again or call 112.",
        ) from error
    except (OSError, urllib.error.URLError, json.JSONDecodeError) as error:
        logger.warning("Google Places search could not be completed.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Nearby hospital information could not be retrieved. Please try again or call 112.",
        ) from error

    hospitals = []
    for place in result.get("places", []):
        place_id = place.get("id")
        name = place.get("displayName", {}).get("text")
        address = place.get("formattedAddress")
        if not place_id or not name or not address:
            continue

        distance_km = None
        location = place.get("location") or {}
        if (
            request.latitude is not None
            and request.longitude is not None
            and location.get("latitude") is not None
            and location.get("longitude") is not None
        ):
            lat1, lat2 = math.radians(request.latitude), math.radians(location["latitude"])
            delta_lat = lat2 - lat1
            delta_lon = math.radians(location["longitude"] - request.longitude)
            arc = math.sin(delta_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
            distance_km = round(6371 * 2 * math.atan2(math.sqrt(arc), math.sqrt(1 - arc)), 1)

        hospitals.append(
            {
                "id": place_id,
                "name": name,
                "address": address,
                "phone": place.get("nationalPhoneNumber"),
                "distance_km": distance_km,
                "google_maps_url": (
                    "https://www.google.com/maps/search/?api=1&query_place_id="
                    + urllib.parse.quote(place_id, safe="")
                ),
            }
        )
    return hospitals


# -------------------------------------------------------------
# System Prompts & Safety Guidelines
# -------------------------------------------------------------

MEDICAL_SAFETY_SYSTEM_PROMPT = """
You are MediGuide AI, an educational healthcare information assistant.
Answer the user's actual question directly, in clear language and in the language selected by the user.
Help explain common medical terms, laboratory reports, nutrition, fitness, sleep, wellness, symptoms,
and general medication information. State uncertainty and ask a relevant follow-up question if needed.

CRITICAL MEDICAL SAFETY RULES:
1. NEVER provide a definitive clinical diagnosis.
2. NEVER prescribe medicines or dosages, or recommend starting, stopping, or changing treatment.
3. Do not diagnose from symptoms or isolated laboratory values. Explain plausible general causes without implying which one applies.
4. Encourage consultation with a qualified healthcare professional for persistent, severe, or personal concerns.
5. If asked about a particular report, use only values the user supplied; never invent laboratory results or reference ranges.
6. For possible emergencies (such as severe chest pain, difficulty breathing, stroke signs, severe bleeding, or loss of consciousness),
   advise seeking emergency medical care immediately rather than continuing routine guidance.
7. Respect the selected language: English (en), Telugu (te), or Hindi (hi).
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
Language requested for explanations: {language}. Provide summaries and plain-language descriptions in English, Telugu, and Hindi.

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
      "description_te": "Simple 1-2 sentence Telugu explanation of what this biomarker measures",
      "description_hi": "Simple 1-2 sentence Hindi explanation of what this biomarker measures"
    }}
  ],
  "summary": {{
    "overview_en": "Clear 2-3 sentence overview in simple English explaining general observations without diagnosing.",
    "overview_te": "Clear 2-3 sentence overview in Telugu explaining general observations without diagnosing.",
    "overview_hi": "Clear 2-3 sentence overview in Hindi explaining general observations without diagnosing.",
    "key_takeaways_en": ["Key educational observation 1", "Key educational observation 2"],
    "key_takeaways_te": ["తెలుగు పరిశీలన 1", "తెలుగు పరిశీలన 2"],
    "key_takeaways_hi": ["हिंदी में शैक्षिक अवलोकन 1", "हिंदी में शैक्षिक अवलोकन 2"],
    "questions_for_doctor_en": ["Educational question to ask doctor 1", "Question 2"],
    "questions_for_doctor_te": ["వైద్యుడిని అడగవలసిన ప్రశ్న 1", "ప్రశ్న 2"],
    "questions_for_doctor_hi": ["डॉक्टर से पूछने के लिए शैक्षिक प्रश्न 1", "प्रश्न 2"],
    "disclaimer": "This information is educational and not a medical diagnosis. Consult your doctor."
  }}
}}
Return ONLY valid JSON.
"""

    models_to_try = ["gemini-3.8-flash", "gemini-3.6-flash"]
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


_gemini_connection_cache = {
    "verified": False,
    "last_checked": 0.0,
    "status": "missing_key",
    "message": "No GEMINI_API_KEY configured",
    "retry_after": 0.0,
}


def verify_gemini_connection(force: bool = False) -> tuple[bool, str, str]:
    """
    Verifies actual connectivity with the Google Gemini API using the configured key.
    Checks not only key existence, but tests model connectivity, invalid keys, and API errors.
    Never leaks the raw API key in the returned message.
    """
    global gemini_client, _gemini_connection_cache

    now = time.time()
    provider_state, cooldown_remaining = AI_SERVICE.provider_health("gemini")
    if not force and cooldown_remaining > 0:
        if provider_state == "rate_limit":
            return False, "rate_limited", "Gemini is rate-limited; chat will avoid requests during its cooldown."
        if provider_state == "authentication":
            return False, "invalid_key", "Gemini credentials or project permissions need administrator review."
        if provider_state in ("timeout", "unavailable", "error"):
            return False, provider_state, "Gemini is temporarily unavailable; chat will retry after its cooldown."
    if not force and _gemini_connection_cache["last_checked"] > 0 and (now - _gemini_connection_cache["last_checked"] < 60):
        AI_SERVICE.update_provider_health(
            "gemini",
            _gemini_connection_cache["status"],
            _gemini_connection_cache.get("retry_after"),
        )
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
            "retry_after": 0.0,
        }
        AI_SERVICE.update_provider_health("gemini", "missing_key")
        return False, "missing_key", _gemini_connection_cache["message"]

    if gemini_client is None:
        try:
            from google import genai
            from google.genai import types
            gemini_client = genai.Client(
                api_key=current_key,
                http_options=types.HttpOptions(timeout=30_000),
            )
        except Exception as err:
            _gemini_connection_cache = {
                "verified": False,
                "last_checked": now,
                "status": "invalid_key",
                "message": "Failed to initialize Gemini client with configured key.",
                "retry_after": 0.0,
            }
            AI_SERVICE.update_provider_health("gemini", "invalid_key")
            return False, "invalid_key", _gemini_connection_cache["message"]

    # Use the same supported model as chat rather than pinging a different model.
    try:
        res = gemini_client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip() or "gemini-3.6-flash",
            contents="Respond with the word pong.",
        )
        if res and (res.text or res.candidates):
            _gemini_connection_cache = {
                "verified": True,
                "last_checked": now,
                "status": "connected",
                "message": "Gemini AI is connected and ready to use.",
                "retry_after": 0.0,
            }
            AI_SERVICE.update_provider_health("gemini", "connected")
            return True, "connected", _gemini_connection_cache["message"]
        else:
            raise Exception("Empty response returned by Gemini service.")
    except Exception as e:
        error_code = getattr(e, "code", None)
        error_code = error_code if isinstance(error_code, int) else None
        is_timeout = isinstance(e, TimeoutError) or "timeout" in type(e).__name__.lower()
        logger.warning(
            "Gemini live verification failed (status=%s, error_type=%s, category=%s).",
            error_code or "unavailable",
            type(e).__name__,
            "timeout" if is_timeout else "provider_error",
        )
        if error_code == 429:
            status = "rate_limited"
            msg = "Gemini rate limits or project quota prevented the connection check."
        elif error_code == 401:
            status = "invalid_key"
            msg = "The configured Gemini API key was rejected."
        elif error_code == 403:
            status = "permission_denied"
            msg = "The configured Gemini project does not have permission to use this model."
        elif error_code == 400:
            status = "invalid_request"
            msg = "Gemini rejected the connection-check request."
        elif is_timeout or error_code in (408, 504):
            status = "timeout"
            msg = "The Gemini connection check timed out."
        elif error_code in (500, 502, 503):
            status = "unavailable"
            msg = "The Gemini service is temporarily unavailable."
        else:
            status = "error"
            msg = "Failed to connect to Google Gemini service."

        retry_after = provider_retry_delay(e, 0) if error_code == 429 else 0.0
        _gemini_connection_cache = {
            "verified": False,
            "last_checked": now,
            "status": status,
            "message": msg,
            "retry_after": retry_after,
        }
        AI_SERVICE.update_provider_health("gemini", status, retry_after)
        return False, status, msg


# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse)
async def health_check(check: bool = False):
    """Returns the operational status of MediGuide AI and actual Gemini connectivity."""
    is_connected, gemini_status, gemini_msg = await run_in_threadpool(
        verify_gemini_connection,
        force=check,
    )
    return HealthResponse(
        status="ok",
        gemini_configured=is_connected,
        gemini_status=gemini_status,
        gemini_message=gemini_msg,
        secondary_ai_configured=AI_SERVICE.secondary.configured,
        ai_available=AI_SERVICE.status_snapshot()["status"] != "unavailable",
        model=(
            os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip() or "gemini-3.6-flash"
        ) if is_connected else "Gemini unavailable",
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


@app.get("/api/ai/status")
async def ai_status() -> dict[str, Any]:
    return AI_SERVICE.status_snapshot()


@app.get("/api/ai/metrics")
async def ai_metrics(request: Request) -> dict[str, Any]:
    configured_token = os.getenv("AI_METRICS_TOKEN", "").strip()
    supplied_token = request.headers.get("Authorization", "")
    if not configured_token:
        raise HTTPException(status_code=404, detail="Not found.")
    if not supplied_token.startswith("Bearer ") or not hmac.compare_digest(
        supplied_token[7:].strip(),
        configured_token,
    ):
        raise HTTPException(status_code=401, detail="Metrics authorization required.")
    return AI_SERVICE.metrics_snapshot()


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



@app.get("/api/emergency/geocode")
async def geocode_query(q: str = Query(..., min_length=2, max_length=150)):
    """Search for locations, cities, localities, and PIN codes using OpenStreetMap Nominatim."""
    encoded = urllib.parse.quote(q)
    url = f"https://nominatim.openstreetmap.org/search?q={encoded}&format=json&addressdetails=1&limit=6&countrycodes=in"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "MediGuideAI/1.0 (Emergency-Geocoding; contact@mediguide.ai)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
        suggestions = []
        for item in data:
            addr = item.get("address", {})
            city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or ""
            area = addr.get("suburb") or addr.get("neighbourhood") or addr.get("residential") or ""
            state = addr.get("state") or ""
            postcode = addr.get("postcode") or ""
            suggestions.append({
                "display_name": item.get("display_name"),
                "city": city,
                "area": area,
                "state": state,
                "postcode": postcode,
                "latitude": float(item.get("lat")),
                "longitude": float(item.get("lon")),
            })
        return suggestions
    except Exception as e:
        logger.warning("Nominatim geocoding failed (%s).", type(e).__name__)
        # Fallback to local city search if network fails
        q_lower = q.lower().strip()
        matched = []
        for h in VERIFIED_METRO_HOSPITALS:
            if q_lower in h["address"].lower() or q_lower in h["name"].lower():
                matched.append({
                    "display_name": h["address"],
                    "city": "Metro",
                    "area": "",
                    "state": "India",
                    "postcode": "",
                    "latitude": h["latitude"],
                    "longitude": h["longitude"],
                })
        return matched


@app.get("/api/emergency/reverse-geocode")
async def reverse_geocode_query(latitude: float = Query(...), longitude: float = Query(...)):
    """Convert coordinates into a human-readable city, area, and address."""
    url = f"https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json&addressdetails=1"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "MediGuideAI/1.0 (Emergency-Reverse-Geocoding; contact@mediguide.ai)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
        addr = data.get("address", {})
        city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or ""
        area = addr.get("suburb") or addr.get("neighbourhood") or addr.get("residential") or ""
        state = addr.get("state") or ""
        postcode = addr.get("postcode") or ""
        return {
            "address": data.get("display_name"),
            "city": city,
            "area": area,
            "state": state,
            "postcode": postcode,
        }
    except Exception as e:
        logger.warning("Nominatim reverse geocoding failed (%s).", type(e).__name__)
        return {
            "address": f"Lat: {latitude:.4f}, Lon: {longitude:.4f}",
            "city": "Current Location",
            "area": "",
            "state": "",
            "postcode": "",
        }

@app.post("/api/emergency/nearby-hospitals")
async def nearby_hospitals(request: NearbyHospitalRequest):
    """Search Google Places for real hospitals without exposing the server API key."""
    if (request.latitude is None) != (request.longitude is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide both latitude and longitude, or enter a city or address.",
        )
    return await run_in_threadpool(_google_places_search, request)


@app.post("/api/analyze-report", response_model=AnalyzeReportResponse)
async def analyze_report(
    http_request: Request,
    file: Optional[UploadFile] = File(None),
    sample_id: Optional[str] = Form(None),
    language: str = Form("en"),
):
    """
    Parses and analyzes a medical laboratory report.
    Accepts either an uploaded PDF file or a sample report ID ('cbc', 'lipid', 'metabolic').
    """
    if language not in ("en", "te", "hi"):
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

    # Automatic Report History saving for authenticated users
    user = None
    auth_header = http_request.headers.get("Authorization")
    if auth_header:
        from backend.auth import get_user_from_raw_token, db_session
        user = get_user_from_raw_token(auth_header)

    report_id = f"report_{uuid.uuid4().hex}"
    pdf_save_path = ""
    file_bytes_len = len(content) if 'content' in locals() and content else 0

    if user and file and 'content' in locals() and content:
        try:
            user_dir = os.path.join(os.path.dirname(__file__), "uploads", "reports", str(user["id"]))
            os.makedirs(user_dir, exist_ok=True)
            pdf_save_path = os.path.join(user_dir, f"{report_id}.pdf")
            with open(pdf_save_path, "wb") as pf:
                pf.write(content)
        except Exception as save_err:
            logger.warning("Could not persist uploaded PDF file to disk: %s", save_err)

    # Function to persist to DB if user is authenticated
    def maybe_save_to_db(resp_obj):
        if not user:
            return resp_obj
        try:
            abnormal_cnt = sum(1 for item in resp_obj.test_results if str(item.status).lower() not in ("normal", ""))
            from backend.auth import db_session
            with db_session() as connection:
                connection.execute(
                    """
                    INSERT INTO report_history(
                        id, user_id, filename, report_type, summary_json, test_results_json,
                        patient_info_json, pdf_path, status, file_size, abnormal_count
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        report_id,
                        user["id"],
                        resp_obj.filename,
                        resp_obj.report_type,
                        json.dumps(resp_obj.summary.model_dump(), ensure_ascii=False),
                        json.dumps([t.model_dump() for t in resp_obj.test_results], ensure_ascii=False),
                        json.dumps(resp_obj.patient_info.model_dump(), ensure_ascii=False),
                        pdf_save_path,
                        "completed",
                        file_bytes_len,
                        abnormal_cnt,
                    ),
                )
            resp_obj.id = report_id
            resp_obj.abnormal_count = abnormal_cnt
            resp_obj.file_size = file_bytes_len
        except Exception as db_err:
            logger.error("Failed to auto-save report to report_history: %s", db_err)
        return resp_obj


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
                overview_hi="इस PDF में पढ़ने योग्य डिजिटल टेक्स्ट नहीं मिला। यह स्कैन की गई छवि हो सकती है। गलत जानकारी से बचने के लिए प्रयोगशाला से डिजिटल PDF माँगें।",
                key_takeaways_en=[
                    "Document appears to be an image/scan without text.",
                    "No lab parameters could be verified without text.",
                    "Try requesting a digital PDF from your diagnostic lab portal, or test with our built-in sample reports."
                ],
                key_takeaways_te=[
                    "పత్రంలో చదవదగిన టెక్స్ట్ కనుగొనబడలేదు.",
                    "డిజిటల్ ల్యాబ్ కాపీని అప్‌లోడ్ చేయండి లేదా మా నమూనా నివేదికలను పరీక్షించండి."
                ],
                key_takeaways_hi=[
                    "दस्तावेज़ में पढ़ने योग्य टेक्स्ट नहीं मिला।",
                    "इस दस्तावेज़ से किसी भी लैब परिणाम की पुष्टि नहीं हो सकी।",
                    "डिजिटल PDF माँगें या नमूना रिपोर्ट से सुविधा आज़माएँ।",
                ],
                questions_for_doctor_en=[
                    "Can your diagnostic center provide an electronic/downloadable PDF report?"
                ],
                questions_for_doctor_te=[
                    "డయాగ్నస్టిక్ సెంటర్ నుండి డిజిటల్ పిడిఎఫ్ కాపీ పొందవచ్చా?"
                ],
                questions_for_doctor_hi=[
                    "क्या जाँच केंद्र से डाउनलोड करने योग्य डिजिटल PDF मिल सकती है?"
                ],
                disclaimer="No clinical content could be extracted from this image-only document.",
            ),
        )

    # Attempt AI analysis if Gemini is available
    ai_result = analyze_with_gemini(extracted_text, language)

    if ai_result:
        # Live Gemini Analysis
        try:
            return maybe_save_to_db(AnalyzeReportResponse(
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
            ))
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

    return maybe_save_to_db(AnalyzeReportResponse(
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
    ))


@app.post("/api/chat", response_model=ChatResponse)
async def chat_assistant(chat_request: ChatRequest, http_request: Request):
    """
    Handles user inquiries regarding medical terms, test explanations, and wellness questions.
    Provides answers in English, Telugu, or Hindi with supporting references.
    """
    message = chat_request.message.strip()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Enter a question for the AI assistant.",
        )
    language = chat_request.language

    identities = [
        f"ip:{http_request.client.host if http_request.client else 'unknown'}",
    ]
    authorization = http_request.headers.get("Authorization", "")
    if authorization.startswith("Bearer "):
        from backend.auth import get_current_user

        try:
            user = get_current_user(
                HTTPAuthorizationCredentials(
                    scheme="Bearer",
                    credentials=authorization[7:].strip(),
                )
            )
            identities.append(f"user:{user['id']}")
        except HTTPException:
            pass
    allowed, retry_after = AI_SERVICE.allow_request(identities)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You have sent too many questions. Please wait a moment before trying again.",
            headers={"Retry-After": str(retry_after)},
        )

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

    answer: GeneratedAnswer = await run_in_threadpool(
        AI_SERVICE.generate,
        message,
        language,
        [entry.model_dump() for entry in chat_request.history[-12:]],
        build_medical_system_prompt(language),
    )
    suggested_by_language = {
        "en": [
            "What questions should I ask a healthcare professional?",
            "What details would help explain this further?",
            "What general next steps should I consider?",
        ],
        "te": [
            "వైద్య నిపుణుడిని నేను ఏ ప్రశ్నలు అడగాలి?",
            "దీన్ని మరింత వివరించడానికి ఏ సమాచారం ఉపయోగపడుతుంది?",
            "నేను పరిగణించాల్సిన సాధారణ తదుపరి చర్యలు ఏమిటి?",
        ],
        "hi": [
            "मुझे स्वास्थ्य पेशेवर से क्या पूछना चाहिए?",
            "इसे बेहतर समझने के लिए कौन-सी जानकारी उपयोगी होगी?",
            "मुझे किन सामान्य अगले कदमों पर विचार करना चाहिए?",
        ],
    }

    return ChatResponse(
        mode="ai",
        reply=answer.reply,
        language=language,
        suggested_questions=suggested_by_language[language],
        trusted_sources=sources,
        disclaimer="AI-generated educational information only. This assistant does not diagnose or prescribe. Consult a qualified healthcare professional for personal medical advice.",
        provider=answer.provider,
        fallback_used=answer.fallback_used,
        cached=answer.cached,
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
