# MediGuide AI Error Fix Report

## Highest-priority findings

1. Authentication was not real: passwords were hashed with unsalted SHA-256, demo accounts and passwords were hard-coded in memory, returned tokens were random strings that were never checked, and account state disappeared on restart. A client could select a doctor role during signup.
2. Password recovery disclosed a usable reset token to the browser, kept it in memory without an expiry, and returned a success response without sending email.
3. Google authorization sent a placeholder instead of the access token when requesting user info. Apple decoded identity-token claims without verifying the signature, issuer, audience, or expiry. The frontend sent every OAuth callback to the Google endpoint.
4. A pending registration request had no client-side timeout. If the backend/network stopped responding, the form could remain in its loading state indefinitely.
5. Account profile data and successful-login state were trusted from `localStorage` without validating a server session, allowing stale/fabricated dashboard state.
6. The UI incorrectly described the application as zero-retention/256-bit encrypted despite persisting account records and optionally sending report text to Gemini.

## Fixes implemented

- Added SQLite-backed account, session, reset-token, and Apple-handoff storage in `backend/auth.py`. Passwords use salted PBKDF2-HMAC-SHA256; session and reset tokens are only stored as hashes.
- Added role-specific login verification, server-validated sessions (`/api/auth/me`), logout/revocation, duplicate-email handling, strict role schemas, and protected client dashboard initialization.
- Patient accounts can self-register. Doctor signup now requires both a physician license value and the server-only `DOCTOR_SIGNUP_CODE`; an administrator must independently verify credentials before issuing that code. OAuth-created accounts default to patient, and an existing account's stored role is preserved.
- Password reset uses a cryptographically random, 30-minute, single-use token sent over configured SMTP. The API returns no reset token and uses an account-independent response. Missing SMTP returns `503`; delivery failure returns `502`, and the unusable reset token is removed.
- Google authorization exchanges the code on the backend and verifies the resulting ID token signature against Google's published JWKS, audience, issuer, expiry, subject, and verified-email claim. OAuth state is retained and checked in the browser.
- Apple uses the registered `form_post` callback, exchanges the code server-side, verifies the ID token against Apple's published JWKS and claims, and issues a short-lived, single-use handoff ticket to the frontend. Provider secrets are never sent to the browser.
- Authentication requests now have a 20-second timeout; timeout and API errors are shown to the user and registration/login loading indicators stop in `finally` blocks.
- Updated the privacy disclosures to distinguish non-persisted report files from the persisted account database and from report text sent to Gemini when configured.
- Removed unsafe logging of provider error bodies, API exceptions, and uploaded PDF filenames. Updated Vite/API wiring and README setup/security documentation.

## Files changed

- `backend/auth.py` — persistent authentication, server sessions, email recovery, and OAuth implementations.
- `backend/main.py` — deterministic `.env` loading, safer logging, configurable frontend CORS, and auth router wiring.
- `backend/test_auth.py` — authentication, role, recovery, OAuth, health/API, and database-failure regression tests.
- `backend/requirements.txt` — added `PyJWT[crypto]`.
- `backend/.env.example` — documented SMTP, OAuth, doctor-signup, frontend-origin, and database settings.
- `.gitignore` — ignores local authentication databases.
- `frontend/src/App.tsx` — validates persisted sessions before rendering authenticated content and stores only server-issued tokens.
- `frontend/src/pages/LoginPage.tsx` — routes provider callbacks, validates OAuth state, wires provider-appropriate flows, and validates registration/recovery forms.
- `frontend/src/services/api.ts` — auth API requests, session calls, and bounded request timeouts.
- `frontend/src/types/index.ts` — role-specific profile and doctor-signup types.
- `frontend/src/pages/ReportAnalyzerPage.tsx`, `frontend/src/pages/ChatAssistantPage.tsx`, `frontend/src/pages/ReportComparisonPage.tsx`, `frontend/src/pages/SourcesPage.tsx`, `frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/SettingsPage.tsx`, `frontend/src/components/Sidebar.tsx`, and `frontend/src/components/Navbar.tsx` — addressed directly related loading/error/interaction, privacy-copy, or lint issues without redesigning the UI.
- `README.md` — updated environment configuration, security behavior, and test/run commands.

## Verification performed

- `npm run build` from `frontend`: **passed** (`tsc -b` and Vite production build). Vite still reports the existing large main-chunk warning (>500 kB).
- `npm run lint` from `frontend`: **completed with 3 React Compiler/hooks warnings** in `ReportAnalyzerPage.tsx` and `LoginPage.tsx`; no lint errors. The baseline had numerous warnings, which were reduced, but these remaining warnings are not claimed as resolved.
- `python -m py_compile backend\main.py backend\auth.py backend\test_auth.py`: **passed**.
- `python -m unittest backend.test_auth -v`: **10 tests passed**. Coverage includes successful patient and doctor signup/login, wrong passwords, role mismatches, invalid and duplicate registration, server-verified session access/revocation, single-use reset tokens, generic unknown-account behavior, missing/failed SMTP, mocked Google and Apple signature verification and ticket replay, missing OAuth configuration, health/routes, and a simulated database failure.
- Live local connectivity smoke test: backend `/api/health` returned `200`; Vite `/api/health` proxy returned `200`; patient signup/session lookup/logout succeeded; using a revoked session returned `401`.
- Browser smoke test: account registration completed, redirected to the signed-in dashboard, and displayed the account. A browser session was verified against `/api/auth/me`.
- Browser role flow: patient account failed Doctor Login with the expected role message, succeeded via Patient Login, and remained authenticated after reload.
- Browser failure handling: an aborted signup request displayed `Failed to fetch` and re-enabled the submit button; missing SMTP showed a recovery error, and the Google/Apple buttons showed missing-configuration guidance.
- `git diff --check`: **passed**.

The legacy `python backend/test_api.py` script was not run because it exercises live Gemini chat/report services and can consume provider quota; existing backend API behavior was covered with local/mock tests instead.

## External configuration still required

The checked-in example contains placeholders, and the local environment had no Google, Apple, or SMTP configuration. Consequently, real provider consent/sign-in and real email delivery were **not tested**.

1. Copy `backend/.env.example` to `backend/.env`.
2. Google Cloud Console: create an OAuth 2.0 **Web application** client, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and register the exact `GOOGLE_REDIRECT_URI` (default development URI: `http://localhost:5173/`) as an authorized redirect URI. Configure the OAuth consent screen and authorized origins for the frontend origin.
3. Apple Developer: enable **Sign in with Apple**, configure a primary App ID and Services ID, and set `APPLE_CLIENT_ID` to the Services ID, plus `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and the corresponding `.p8` contents in `APPLE_PRIVATE_KEY` (use `\n` for line breaks in `.env`). Set and register the exact publicly reachable HTTPS `APPLE_REDIRECT_URI` in the Services ID configuration. For local development, use an HTTPS tunnel; plain HTTP localhost callbacks are rejected.
4. SMTP: configure `SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM_EMAIL`; set both `SMTP_USER` and `SMTP_PASSWORD` if authentication is required. Set `SMTP_USE_SSL=true` for implicit TLS or leave it `false` for STARTTLS.
5. Doctor signup: set a strong private `DOCTOR_SIGNUP_CODE` and distribute it only to physicians whose credentials were independently verified. The app does not perform license-registry verification.
6. Configure `FRONTEND_URL` to the actual browser-visible origin. Set `MEDIGUIDE_DB_PATH` to a private persistent SQLite file location and back it up securely for deployments.

Existing demo credentials were deliberately removed; create patient accounts through signup. Existing doctor accounts must be provisioned through an administrator-controlled process and should not be assigned doctor privileges by changing a client request.

## Commands

From the project root, install backend dependencies and run FastAPI:

```powershell
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

In another terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Run focused backend tests from the project root:

```powershell
python -m unittest backend.test_auth -v
```

Run frontend checks from `frontend`:

```powershell
npm run lint
npm run build
```
