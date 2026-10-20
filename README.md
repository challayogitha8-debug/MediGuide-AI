# MediGuide AI 🏥🩺
> **"Understand Your Health, Make Informed Decisions."**

MediGuide AI is a full-stack, hackathon-ready healthcare information web application designed to help users understand complex medical laboratory reports and general health concepts through simple, transparent explanations in **English** and **Telugu (తెలుగు)**.

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
   - **Bilingual AI Explanations**: Plain-language breakdown of every biomarker in English and Telugu.
   - AI educational summary with key takeaways and actionable questions for your doctor.

3. **AI Health Assistant**
   - Clean, interactive bilingual chat interface.
   - Instant language switching between English and Telugu.
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
   - Gemini API status indicator (Live Gemini 2.5 vs High-Fidelity Demo Mode).
   - Language preference persistence (`localStorage`).
   - Uploaded reports and extracted report contents are processed in memory and are not persisted by this app. Account profile data, salted password hashes, and hashed session/reset tokens are stored in a local SQLite database.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic, python-multipart |
| **AI / NLP** | Google Gemini API via official `google-genai` SDK (`gemini-2.5-flash` / `gemini-2.0-flash`) |
| **PDF Extraction** | `pypdf` (in-memory stream parsing) |
| **Environment** | `python-dotenv` |

---

## 📁 Project Structure

```
MediGuide-Project/
├── backend/
│   ├── main.py                  # FastAPI server, endpoints, Gemini integration & safety logic
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
│   │   │   ├── ChatAssistantPage.tsx     # Bilingual chat assistant with prompt chips
│   │   │   ├── ReportComparisonPage.tsx  # Longitudinal report trend analysis & Recharts
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

4. Configure Gemini API Key:
   - Copy `backend/.env.example` to `backend/.env`
   - Add your Gemini API key from [Google AI Studio](https://aistudio.google.com/):
     ```ini
     GEMINI_API_KEY=your_actual_gemini_api_key_here
     ```
   *Note: If no key is provided, MediGuide AI automatically operates in **High-Fidelity Demo Mode** with complete fictional lab reports and bilingual responses.*

5. Configure authentication services as needed:
   - **Email/password accounts** work without external credentials. Doctor signup requires a server-only `DOCTOR_SIGNUP_CODE`; issue it only after independently verifying the physician and their license. The app does not query a licensing registry.
   - **Password recovery** requires `SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM_EMAIL`. Set `SMTP_USER` and `SMTP_PASSWORD` together if the mail server requires authentication. Reset links expire after 30 minutes. Missing or failed SMTP results in an explicit error; reset tokens are never returned by the API.
   - **Google sign-in** requires a Google OAuth web client ID and secret. Register the exact `GOOGLE_REDIRECT_URI` in the provider console.
   - **Apple sign-in** requires a Sign in with Apple Service ID, Team ID, Key ID, private key, and publicly reachable HTTPS `APPLE_REDIRECT_URI` registered to the Services ID. For local development, use an HTTPS tunnel and register that exact callback URL; plain HTTP localhost callbacks are rejected.
   - Set `FRONTEND_URL` to the browser-visible frontend origin used for reset links and the Apple handoff. Provider secrets and signing keys must remain in `backend/.env`.

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
   - Watch the upload progress bar, verify extracted text preview, view structured lab values, and read English and Telugu summaries.

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
   - Switch between Lipid Profile, CBC, and Fasting Glucose trends.
   - Inspect the interactive Recharts bar charts and calculated deltas.

---

## 🔒 Security & Privacy Architecture

- **No Persistent PDF Storage**: Uploaded files are parsed via `io.BytesIO` in memory and discarded upon response delivery.
- **AI report processing**: When a Gemini API key is configured, extracted report text is sent to Google's Gemini API for analysis and is subject to Google's data-handling terms. Demo mode does not send report text to Gemini.
- **Persistent authentication store**: Account profile fields and salted PBKDF2 password hashes are stored in `backend/mediguide.sqlite3` by default. Opaque sessions and password reset tokens are stored as hashes with expiration; password reset and sign-out revoke sessions.
- **Role verification**: Doctor privileges are assigned only when the server validates its administrator-issued authorization code. An administrator must verify physician credentials before issuing that code.
- **Password recovery**: Single-use reset tokens expire after 30 minutes and are delivered through configured SMTP. Tokens are never returned in API responses, and the response does not disclose whether an account exists.
- **Strict Server-Side Key Isolation**: `GEMINI_API_KEY` is loaded exclusively into backend memory. No API keys are bundled into frontend assets or client storage.
- **Safe Prompting**: Conservative system instructions restrict the model to educational summaries and actively block diagnostic or prescriptive statements.

---

## 📄 License
This project is created for educational and hackathon demonstration purposes.
