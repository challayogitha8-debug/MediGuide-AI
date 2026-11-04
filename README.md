# MediGuide AI 🏥🩺
> **"Understand Your Health, Make Informed Decisions."**

MediGuide AI is a full-stack healthcare information web application designed to help users understand medical laboratory reports and general health concepts through clear explanations in **English**, **Telugu (తెలుగు)**, and **Hindi (हिन्दी)**.

---

## ⚠️ Important Medical Disclaimer
**For Educational and Informational Purposes Only.**  
MediGuide AI **does not** diagnose diseases, prescribe medication or dosages, replace clinical consultations, or provide emergency triage. Medical laboratory values must never be evaluated in isolation. Always consult a qualified healthcare professional regarding individual health conditions. In emergencies, call your local emergency service (e.g., 911 / 108 / 112) immediately.

---

## 🌟 Core Features

1. **Dashboard Overview**
   - Welcome banner with application tagline and live connectivity indicators.
   - Quick action shortcuts to all features.
   - 1-Click Interactive Clinical Sample Reports (Complete Blood Count, Lipid Profile, Metabolic Panel).
   - Medical Safety & Ethics statement.

2. **Medical Report Analyzer**
   - PDF upload with validation (file extension, `%PDF-` header check, 10MB limit).
   - Upload progress and animated processing states.
   - In-memory PDF text extraction using `pypdf` (Zero data retention policy).
   - Extracted text preview drawer with copy capability.
   - **Image-Only / Scanned PDF Detection**: Clear alerts when a PDF lacks a digital text layer, preventing fabricated data.
   - **Structured Biomarkers Table**: Extracted test names, observed values, standard units, reference ranges, and status badges (`NORMAL`, `HIGH`, `LOW`, `BORDERLINE`).
   - **Multilingual AI Explanations**: Gemini-generated plain-language explanations include English, Telugu, and Hindi fields.
   - AI educational summary with key takeaways and actionable questions for your doctor.

3. **AI Health Assistant**
   - Clean, interactive multilingual chat interface.
   - Instant language switching between English, Telugu, and Hindi.
   - Context-aware explanations of medical terminology, tests, and healthy lifestyle habits.
   - Suggested follow-up prompt chips.
   - Supporting trusted public health references displayed alongside responses.
   - Session history with instant reset.

4. **Longitudinal Report Comparison**
   - Side-by-side comparison of baseline vs follow-up laboratory reports (e.g., Lipid Profile, CBC, Glycemic Control).
   - Compatible unit verification before calculating numerical deltas and percentage changes.
   - Interactive trend visualization powered by **Recharts**.
   - Clinical context safety alert: Prevents misinterpreting changes without physician evaluation.

5. **Trusted Health Information Sources**
   - Curated reference portal featuring the **WHO**, **MedlinePlus (NIH/NLM)**, **CDC**, **NHLBI**, and **ICMR**.
   - Search bar and category filtering (Diagnostics, Cardiovascular, Hematology, Nutrition, Global Health).
   - Explicit transparency labeling: Noted as educational references rather than claiming unverified RAG citations.

6. **Privacy, Ethics & Settings**
   - Real-time backend health check and live ping button.
   - Backend AI provider status and protected operational metrics.
   - Language preference persistence (`localStorage`).
   - Uploaded PDF files and extracted raw text are processed in memory and are never retained. Signed-in users can save analysis summaries/results and chat conversations to private account history and delete individual entries.
7. **Health Tips, Emergency & Account**
   - Health Tips are general educational content in English, Telugu, and Hindi.
   - Emergency search uses Google Places for provider-supplied hospital details and requires a backend-only `GOOGLE_MAPS_API_KEY`; the app does not dispatch emergency services.
   - Account profile edits are authenticated and stored in the user's profile.
   - Light/dark theme and language preferences persist locally.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic, python-multipart |
| **AI / NLP** | Gemini via official `google-genai` SDK, with OpenAI via the official `openai` SDK as the optional secondary provider |
| **PDF Extraction** | `pypdf` (in-memory stream parsing) |
| **Environment** | `python-dotenv` |

---

## 📁 Project Structure

```
MediGuide-Project/
├── backend/
│   ├── main.py                  # FastAPI server and API endpoints
│   ├── ai_service.py            # Provider routing, fallback, caching, limits & metrics
│   ├── demo_data.py             # Realistic fictional clinical datasets & bilingual demo content
│   ├── generate_sample_pdfs.py  # Generates test medical PDF documents
│   ├── test_api.py              # Automated backend API and PDF extraction test suite
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Template for API keys
│   └── .env                     # Local environment secrets (not committed)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DisclaimerBanner.tsx  # Medical safety banner
│   │   │   ├── Navbar.tsx            # Top header with branding, status & language toggle
│   │   │   └── Sidebar.tsx           # Desktop sidebar & mobile navigation drawer
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx         # Welcome hero, quick actions & sample showcase
│   │   │   ├── ReportAnalyzerPage.tsx    # PDF upload, extraction, lab table & AI summaries
│   │   │   ├── ChatAssistantPage.tsx     # Multilingual chat assistant with prompt chips
│   │   │   ├── ReportComparisonPage.tsx  # Longitudinal report trend analysis & Recharts
│   │   │   ├── HealthTipsPage.tsx         # Multilingual educational health guidance
│   │   │   ├── EmergencyPage.tsx          # Confirmed emergency calling & Places lookup
│   │   │   ├── HistoryPage.tsx            # Per-account report and chat history
│   │   │   ├── AccountPage.tsx            # Authenticated account profile editing
│   │   │   ├── SourcesPage.tsx           # Trusted medical references with search & filters
│   │   │   └── SettingsPage.tsx          # Privacy policy, API status & language settings
│   │   ├── services/
│   │   │   └── api.ts                    # Frontend API client connecting to FastAPI
│   │   ├── types/
│   │   │   └── index.ts                  # TypeScript interface definitions
│   │   ├── App.tsx                       # Root layout & page router
│   │   ├── main.tsx                      # Vite React entry point
│   │   └── index.css                     # Tailwind CSS imports & global styles
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts                    # Vite config with Tailwind & /api proxy to :8000
├── sample_reports/
│   ├── Sample_CBC_Lab_Report.pdf         # Complete Blood Count test PDF
│   ├── Sample_Lipid_Panel_Report.pdf     # Lipid Panel test PDF
│   └── Sample_Scanned_Document.pdf       # Test PDF for scanned/image-only detection
├── .gitignore
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** (v18 or higher) & **npm**
- **Python** (v3.10 or higher) & **pip**

---

### 2. Backend Setup

1. Open a terminal and navigate to the project root:
   ```bash
   cd MediGuide-Project
   ```

2. (Optional) Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell:
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Configure AI providers:
   - Copy `backend/.env.example` to `backend/.env`
   - Add your Gemini API key from [Google AI Studio](https://aistudio.google.com/) and select a model available to that project:
     ```ini
     GEMINI_API_KEY=your_actual_gemini_api_key_here
     GEMINI_MODEL=gemini-3.6-flash
     ```
   - Optional fallback: configure `OPENAI_API_KEY` and `OPENAI_MODEL` in `backend/.env`. Gemini remains primary; OpenAI is called automatically after a retryable Gemini outage or quota/rate-limit response. Leave them blank to disable fallback. Keys belong only in `backend/.env`; never add them to frontend settings or source control.
   - Optional operational controls are listed in `.env.example`: request rate limit, bounded rate-limit retries, general-question cache TTL, provider timeouts, an admin-only metrics token, and provider token prices for estimates.
   *AI chat does not return demo answers. If no configured provider can answer, it returns a user-safe temporary-unavailable message. Provider quotas and billing remain subject to each provider's plan and limits.*

5. Configure authentication services as needed:
   - **Email/password accounts** work without external credentials. Registration uses one common account flow; clinician accounts remain administrator-provisioned with the server-only `DOCTOR_SIGNUP_CODE` after license verification. The app does not query a licensing registry.
   - **Password recovery** requires `SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM_EMAIL`. Set `SMTP_USER` and `SMTP_PASSWORD` together if the mail server requires authentication. Reset links expire after 30 minutes. Missing or failed SMTP results in an explicit error; reset tokens are never returned by the API.
   - **Google sign-in** uses Google's authorization-code flow and requires a Google OAuth web client ID and secret in `backend/.env`. Add the exact value of `GOOGLE_REDIRECT_URI` as an authorized redirect URI in Google Cloud; by default it is `http://localhost:5173/`. Use that same frontend host in the browser so OAuth state is preserved. The app requests account selection and the `openid email profile` scopes, then verifies Google's ID token on the backend.
   - **Apple sign-in** is currently a disabled UI placeholder and does not start authentication.
   - **Nearby hospitals** require a Google Maps Platform Places API key in `GOOGLE_MAPS_API_KEY` on the backend. Enable the Places API for the key and restrict it to the backend/server where possible; never put the key in frontend code.
   - Set `FRONTEND_URL` to the browser-visible frontend origin used for password-reset links. Provider secrets and signing keys must remain in `backend/.env`.
   - The AI Health Assistant sends each question and up to 12 preceding conversation messages to the centralized backend AI service. Gemini is primary; a configured OpenAI account is used automatically after primary-provider failure. Only short, general, context-free educational questions are eligible for a process-local cache.
   - `GET /api/ai/status` reports safe provider availability. `GET /api/ai/metrics` requires `Authorization: Bearer <AI_METRICS_TOKEN>` and reports in-memory request, error, switch, latency, cache, token, and optional cost-estimate totals. Metrics, cache, rate limits, and cooldowns are process-local; use shared infrastructure for multi-worker or multi-instance deployments.

6. Start the FastAPI backend server from the project root:
   ```bash
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   Backend will be running at: `http://127.0.0.1:8000`  
   API Docs available at: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup

1. Open a second terminal and navigate to `frontend`:
   ```bash
   cd MediGuide-Project/frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend will be running at: `http://localhost:5173`

---

### 4. Running Backend Tests

Run the authentication, reset-email, OAuth-verification (provider calls mocked), health, and API regression tests from the project root:
```bash
python -m unittest backend.test_auth -v
```

The following legacy integration script also exercises PDF extraction and live Gemini chat. It may incur provider usage when `GEMINI_API_KEY` is configured:
```bash
python backend/test_api.py
```

Expected output:
```
--- Testing GET /api/health ---
PASS: Health OK. Gemini configured: False, Model: Demo Fallback Mode
...
>>> ALL TESTS PASSED! Backend is 100% Hackathon-Ready. <<<
```

---

## 🧪 Testing User Flows

1. **Upload Actual Medical PDFs**:
   - Navigate to **Report Analyzer**.
   - Drag & drop `sample_reports/Sample_CBC_Lab_Report.pdf` or `sample_reports/Sample_Lipid_Panel_Report.pdf`.
   - Watch the upload progress bar, verify extracted text preview, view structured lab values, and read available English, Telugu, and Hindi explanations.

2. **Test Scanned Image Detection**:
   - Drag & drop `sample_reports/Sample_Scanned_Document.pdf`.
   - Notice the yellow alert informing the user that no digital text layer exists, preventing hallucinated values.

3. **1-Click Clinical Samples**:
   - In either the **Dashboard** or **Report Analyzer**, click "Complete Blood Count", "Lipid Profile", or "Kidney & Metabolic" to test immediately without any files.

4. **Dual Language Toggle**:
   - Switch between **English** and **తెలుగు** in the top navigation bar or inside any section. Notice instant translation of medical terms, status badges, and doctor questions.

5. **AI Health Chat**:
   - Navigate to **AI Health Assistant**.
   - Type queries such as:
     - *"What does high LDL cholesterol mean?"*
     - *"రక్తంలో హిమోగ్లోబిన్ తక్కువగా ఉంటే ఏమిటి?"*
     - *"What questions should I ask my doctor about my blood sugar?"*
   - Explore verified reference links to MedlinePlus and WHO.

6. **Longitudinal Comparison**:
   - Navigate to **Report Comparison**.
   - Signed-in users can compare compatible numeric results from two saved uploaded reports; sample/demo data remains available to guests.
   - Only tests with matching names and units are compared. Review changes with a qualified healthcare professional.

7. **History & Account**:
   - Analyze an uploaded report or ask the assistant while signed in, then review/delete saved records in **History**.
   - Source PDFs and extracted raw report text are not saved.
   - Manage your display name and profile picture under **My Account**.

---

## 🔒 Security & Privacy Architecture

- **No Persistent PDF or raw-text Storage**: Uploaded files and extracted source text are parsed in memory and discarded. For signed-in users, the database stores report summaries/results (which may contain health information) and chat question/reply history until the user deletes them. Keep the local SQLite database protected.
- **AI report processing**: When a Gemini API key is configured, extracted report text is sent to Google's Gemini API for analysis and is subject to Google's data-handling terms. Demo mode does not send report text to Gemini.
- **Persistent authentication store**: Account profile fields and salted PBKDF2 password hashes are stored in `backend/mediguide.sqlite3` by default. Opaque sessions and password reset tokens are stored as hashes with expiration; password reset and sign-out revoke sessions.
- **User history**: Report analysis summaries/test results and assistant conversation text are stored per authenticated account. History endpoints enforce ownership and support deletion. Uploaded PDFs, extracted raw text, and patient profile fields from analyzed reports are not included in report-history persistence.
- **Role verification**: Doctor privileges are assigned only when the server validates its administrator-issued authorization code. An administrator must verify physician credentials before issuing that code.
- **Password recovery**: Single-use reset tokens expire after 30 minutes and are delivered through configured SMTP. Tokens are never returned in API responses, and the response does not disclose whether an account exists.
- **Strict Server-Side Key Isolation**: `GEMINI_API_KEY` is loaded exclusively into backend memory. No API keys are bundled into frontend assets or client storage.
- **Google Places key isolation**: `GOOGLE_MAPS_API_KEY` is used only by the backend to search for nearby hospitals and is never returned to the browser.
- **Safe Prompting**: Conservative system instructions restrict the model to educational summaries and actively block diagnostic or prescriptive statements.

---

## 📄 License
This project is created for educational and hackathon demonstration purposes.
