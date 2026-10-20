import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import smtplib
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from contextlib import contextmanager
from email.message import EmailMessage
from email.utils import formatdate
from typing import Iterator, Literal, Optional

import jwt
from fastapi import APIRouter, Depends, Form, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

logger = logging.getLogger("MediGuide.auth")
router = APIRouter(prefix="/api/auth", tags=["authentication"])
bearer_scheme = HTTPBearer(auto_error=False)
Role = Literal["doctor", "patient"]
EMAIL_REGEX = re.compile(r"^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$")
PASSWORD_ITERATIONS = 600_000
RESET_TOKEN_TTL_SECONDS = 30 * 60
APPLE_HANDOFF_TTL_SECONDS = 2 * 60


def database_path() -> str:
    configured_path = os.getenv("MEDIGUIDE_DB_PATH", "").strip()
    if not configured_path:
        return os.path.join(os.path.dirname(__file__), "mediguide.sqlite3")
    if os.path.isabs(configured_path):
        return configured_path
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", configured_path))


def connect_db() -> sqlite3.Connection:
    connection = sqlite3.connect(database_path(), timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


@contextmanager
def db_session() -> Iterator[sqlite3.Connection]:
    connection = connect_db()
    try:
        yield connection
        connection.commit()
    except BaseException:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize_database() -> None:
    path = database_path()
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with db_session() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                name TEXT NOT NULL,
                password_hash TEXT,
                role TEXT NOT NULL CHECK (role IN ('doctor', 'patient')),
                avatar TEXT
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
            CREATE TABLE IF NOT EXISTS reset_tokens (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS apple_handoffs (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at INTEGER NOT NULL
            );
            """
        )


initialize_database()


def normalize_email(email: str) -> str:
    normalized = email.strip().lower()
    if len(normalized) > 254 or not EMAIL_REGEX.fullmatch(normalized):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )
    return normalized


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded_hash: Optional[str]) -> bool:
    if not encoded_hash:
        return False
    try:
        algorithm, iterations, salt_hex, digest_hex = encoded_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def digest_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def profile(user: sqlite3.Row) -> "UserProfile":
    return UserProfile(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        avatar=user["avatar"],
        role=user["role"],
    )


def issue_session(user_id: str, remember_me: bool) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = int(time.time()) + (30 * 24 * 60 * 60 if remember_me else 12 * 60 * 60)
    with db_session() as connection:
        connection.execute(
            "INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)",
            (digest_token(token), user_id, expires_at),
        )
    return token


def get_user_by_email(email: str) -> Optional[sqlite3.Row]:
    with db_session() as connection:
        return connection.execute(
            "SELECT id, email, name, password_hash, role, avatar FROM users WHERE email = ? COLLATE NOCASE",
            (email,),
        ).fetchone()


def get_user_by_id(user_id: str) -> Optional[sqlite3.Row]:
    with db_session() as connection:
        return connection.execute(
            "SELECT id, email, name, password_hash, role, avatar FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> sqlite3.Row:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    with db_session() as connection:
        user = connection.execute(
            """
            SELECT users.id, users.email, users.name, users.password_hash, users.role, users.avatar
            FROM sessions JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ? AND sessions.expires_at > ?
            """,
            (digest_token(credentials.credentials), int(time.time())),
        ).fetchone()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session is invalid or has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    avatar: Optional[str] = None
    role: Role


class AuthResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user: Optional[UserProfile] = None
    message: str


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    remember_me: bool = True
    expected_role: Optional[Role] = None


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    role: Role = "patient"
    medical_license: Optional[str] = Field(default=None, max_length=100)
    doctor_invite_code: Optional[str] = Field(default=None, max_length=256)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=8, max_length=128)


class OAuthStatusResponse(BaseModel):
    google_configured: bool
    apple_configured: bool
    google_client_id: Optional[str] = None
    apple_client_id: Optional[str] = None
    message: str


class OAuthUrlResponse(BaseModel):
    configured: bool
    auth_url: Optional[str] = None
    client_id: Optional[str] = None
    message: str
    required_env_vars: list[str] = Field(default_factory=list)
    redirect_uri: Optional[str] = None


class GoogleOAuthRequest(BaseModel):
    code: Optional[str] = None
    id_token: Optional[str] = None
    redirect_uri: Optional[str] = None
    expected_role: Optional[Role] = None


class AppleHandoffRequest(BaseModel):
    ticket: str = Field(min_length=32, max_length=256)
    expected_role: Optional[Role] = None


def frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173").strip().rstrip("/")


def google_redirect_uri() -> str:
    return os.getenv("GOOGLE_REDIRECT_URI", f"{frontend_url()}/")


def apple_redirect_uri() -> str:
    return os.getenv("APPLE_REDIRECT_URI", "").strip()


def apple_redirect_uri_is_valid() -> bool:
    redirect_uri = apple_redirect_uri()
    parsed = urllib.parse.urlparse(redirect_uri)
    return parsed.scheme == "https" and bool(parsed.netloc)


def google_configuration() -> tuple[str, str]:
    return (
        os.getenv("GOOGLE_CLIENT_ID", "").strip(),
        os.getenv("GOOGLE_CLIENT_SECRET", "").strip(),
    )


def apple_configuration() -> tuple[str, str, str, str]:
    return (
        os.getenv("APPLE_CLIENT_ID", "").strip(),
        os.getenv("APPLE_TEAM_ID", "").strip(),
        os.getenv("APPLE_KEY_ID", "").strip(),
        os.getenv("APPLE_PRIVATE_KEY", "").replace("\\n", "\n").strip(),
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest) -> AuthResponse:
    email = normalize_email(request.email)
    user = get_user_by_email(email)
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if request.expected_role and user["role"] != request.expected_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is not registered for {request.expected_role.capitalize()} Login.",
        )
    return AuthResponse(
        success=True,
        token=issue_session(user["id"], request.remember_me),
        user=profile(user),
        message=f"Welcome back, {user['name']}! Signed in to your {user['role'].capitalize()} dashboard.",
    )


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest) -> AuthResponse:
    name = request.name.strip()
    email = normalize_email(request.email)
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Please enter your full name.")
    if request.role == "doctor":
        configured_invite = os.getenv("DOCTOR_SIGNUP_CODE", "")
        supplied_invite = request.doctor_invite_code or ""
        if not configured_invite:
            raise HTTPException(
                status_code=403,
                detail="Doctor registration is restricted. Contact the administrator to provision a verified account.",
            )
        if not hmac.compare_digest(supplied_invite, configured_invite):
            raise HTTPException(status_code=403, detail="Doctor authorization could not be verified.")
        if not request.medical_license or len(request.medical_license.strip()) < 5:
            raise HTTPException(status_code=400, detail="A valid physician license number is required.")

    user_id = f"usr_{uuid.uuid4().hex}"
    try:
        with db_session() as connection:
            connection.execute(
                """
                INSERT INTO users(id, email, name, password_hash, role)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user_id, email, name, hash_password(request.password), request.role),
            )
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        ) from None

    user = get_user_by_id(user_id)
    assert user is not None
    return AuthResponse(
        success=True,
        token=issue_session(user_id, remember_me=True),
        user=profile(user),
        message=f"Account created successfully as {request.role.capitalize()}!",
    )


@router.get("/me", response_model=UserProfile)
async def current_session(user: sqlite3.Row = Depends(get_current_user)) -> UserProfile:
    return profile(user)


@router.post("/logout")
async def logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict[str, bool]:
    if credentials and credentials.scheme.lower() == "bearer":
        with db_session() as connection:
            connection.execute(
                "DELETE FROM sessions WHERE token_hash = ?",
                (digest_token(credentials.credentials),),
            )
    return {"success": True}


def smtp_settings() -> tuple[str, int, str, str, str, bool]:
    host = os.getenv("SMTP_HOST", "").strip()
    sender = os.getenv("SMTP_FROM_EMAIL", "").strip()
    username = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "")
    use_ssl = os.getenv("SMTP_USE_SSL", "false").strip().lower() == "true"
    try:
        port = int(os.getenv("SMTP_PORT", "465" if use_ssl else "587"))
    except ValueError:
        port = 0
    if not host or not sender or not 1 <= port <= 65535 or bool(username) != bool(password):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password recovery email is unavailable because SMTP is not configured correctly.",
        )
    return host, port, sender, username, password, use_ssl


def send_reset_email(email: str, token: str, settings: tuple[str, int, str, str, str, bool]) -> None:
    host, port, sender, username, password, use_ssl = settings
    reset_url = f"{frontend_url()}/#reset_token={urllib.parse.quote(token)}"
    message = EmailMessage()
    message["Subject"] = "MediGuide AI password reset"
    message["From"] = sender
    message["To"] = email
    message["Date"] = formatdate(localtime=False, usegmt=True)
    message.set_content(
        "A password reset was requested for this email address. "
        "If you requested it, use the following single-use link within 30 minutes:\n\n"
        f"{reset_url}\n\n"
        "If you did not request this, you can ignore this message."
    )
    try:
        client = (
            smtplib.SMTP_SSL(host, port, timeout=10)
            if use_ssl
            else smtplib.SMTP(host, port, timeout=10)
        )
        with client:
            if not use_ssl:
                client.starttls()
            if username:
                client.login(username, password)
            client.send_message(message)
    except (OSError, smtplib.SMTPException) as error:
        raise RuntimeError("Password reset email delivery failed.") from error


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest) -> dict[str, object]:
    email = normalize_email(request.email)
    settings = smtp_settings()
    user = get_user_by_email(email)
    token = secrets.token_urlsafe(32)
    if user:
        with db_session() as connection:
            connection.execute(
                "DELETE FROM reset_tokens WHERE user_id = ?",
                (user["id"],),
            )
            connection.execute(
                "INSERT INTO reset_tokens(token_hash, user_id, expires_at) VALUES (?, ?, ?)",
                (
                    digest_token(token),
                    user["id"],
                    int(time.time()) + RESET_TOKEN_TTL_SECONDS,
                ),
            )
    try:
        send_reset_email(email, token, settings)
    except RuntimeError:
        if user:
            with db_session() as connection:
                connection.execute(
                    "DELETE FROM reset_tokens WHERE token_hash = ?",
                    (digest_token(token),),
                )
        logger.error("Password reset email delivery failed.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Password recovery email could not be delivered. Please try again later.",
        ) from None
    return {
        "success": True,
        "message": "If an account exists for this email address, password recovery instructions have been sent.",
    }


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest) -> dict[str, object]:
    now = int(time.time())
    with db_session() as connection:
        connection.execute("BEGIN IMMEDIATE")
        reset = connection.execute(
            "SELECT user_id FROM reset_tokens WHERE token_hash = ? AND expires_at > ?",
            (digest_token(request.token), now),
        ).fetchone()
        if not reset:
            raise HTTPException(status_code=400, detail="Invalid or expired password reset token.")
        connection.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (hash_password(request.new_password), reset["user_id"]),
        )
        connection.execute("DELETE FROM reset_tokens WHERE user_id = ?", (reset["user_id"],))
        connection.execute("DELETE FROM sessions WHERE user_id = ?", (reset["user_id"],))
    return {
        "success": True,
        "message": "Password updated successfully. Please sign in with your new password.",
    }


def http_json(url: str, data: Optional[bytes] = None, headers: Optional[dict[str, str]] = None) -> dict:
    request = urllib.request.Request(url, data=data, headers=headers or {})
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (OSError, urllib.error.URLError, json.JSONDecodeError) as error:
        raise RuntimeError("Identity provider request failed.") from error
    if not isinstance(payload, dict):
        raise RuntimeError("Identity provider returned an invalid response.")
    return payload


def verify_google_id_token(id_token: str, client_id: str) -> dict:
    header = jwt.get_unverified_header(id_token)
    if header.get("alg") != "RS256" or not header.get("kid"):
        raise ValueError("Google returned an invalid signing algorithm.")
    jwks = http_json("https://www.googleapis.com/oauth2/v3/certs")
    key_data = next(
        (item for item in jwks.get("keys", []) if item.get("kid") == header["kid"]),
        None,
    )
    if not key_data:
        raise ValueError("Google signing key was not found.")
    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key_data))
    claims = jwt.decode(
        id_token,
        public_key,
        algorithms=["RS256"],
        audience=client_id,
        issuer=["accounts.google.com", "https://accounts.google.com"],
        options={"require": ["exp", "iat", "iss", "aud", "sub"]},
    )
    email_verified = str(claims.get("email_verified", "")).lower() == "true"
    if not email_verified or not claims.get("email"):
        raise ValueError("Google returned an invalid or unverified identity.")
    return claims


def create_oauth_user(email: str, name: str, avatar: Optional[str] = None) -> sqlite3.Row:
    user = get_user_by_email(email)
    if user:
        return user
    user_id = f"usr_{uuid.uuid4().hex}"
    with db_session() as connection:
        connection.execute(
            "INSERT INTO users(id, email, name, password_hash, role, avatar) VALUES (?, ?, ?, NULL, 'patient', ?)",
            (user_id, email, name[:100] or "MediGuide User", avatar),
        )
    user = get_user_by_id(user_id)
    assert user is not None
    return user


@router.get("/oauth-status", response_model=OAuthStatusResponse)
async def oauth_status() -> OAuthStatusResponse:
    google_id, google_secret = google_configuration()
    apple_id, apple_team, apple_key, apple_private = apple_configuration()
    google_ready = bool(google_id and google_secret and "your_" not in google_id)
    apple_ready = bool(
        apple_id
        and apple_team
        and apple_key
        and apple_private
        and "your_" not in apple_id
        and apple_redirect_uri_is_valid()
    )
    return OAuthStatusResponse(
        google_configured=google_ready,
        apple_configured=apple_ready,
        google_client_id=google_id if google_ready else None,
        apple_client_id=apple_id if apple_ready else None,
        message="OAuth provider status retrieved.",
    )


@router.get("/google/url", response_model=OAuthUrlResponse)
async def google_auth_url(state: str = Query(min_length=32, max_length=256)) -> OAuthUrlResponse:
    client_id, client_secret = google_configuration()
    required = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"]
    if not client_id or not client_secret or "your_" in client_id:
        return OAuthUrlResponse(
            configured=False,
            message="Google OAuth is not fully configured on the server.",
            required_env_vars=required,
            redirect_uri=google_redirect_uri(),
        )
    params = {
        "client_id": client_id,
        "redirect_uri": google_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
    }
    return OAuthUrlResponse(
        configured=True,
        auth_url="https://accounts.google.com/o/oauth2/v2/auth?"
        + urllib.parse.urlencode(params),
        client_id=client_id,
        message="Google OAuth authorization URL generated successfully.",
        required_env_vars=required,
        redirect_uri=google_redirect_uri(),
    )


@router.post("/google/callback", response_model=AuthResponse)
async def google_auth_callback(request: GoogleOAuthRequest) -> AuthResponse:
    client_id, client_secret = google_configuration()
    if not client_id or not client_secret:
        raise HTTPException(
            status_code=503,
            detail="Google OAuth is not configured on the server.",
        )
    if request.redirect_uri != google_redirect_uri():
        raise HTTPException(status_code=400, detail="Google OAuth redirect URI mismatch.")
    if not request.code and not request.id_token:
        raise HTTPException(status_code=400, detail="Missing Google authorization code.")
    try:
        if request.code:
            form_data = urllib.parse.urlencode(
                {
                    "code": request.code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": google_redirect_uri(),
                    "grant_type": "authorization_code",
                }
            ).encode("utf-8")
            token_data = http_json(
                "https://oauth2.googleapis.com/token",
                data=form_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            provider_token = token_data.get("id_token")
            if not provider_token:
                raise ValueError("Google did not return an ID token.")
        else:
            provider_token = request.id_token
        claims = verify_google_id_token(provider_token or "", client_id)
    except (RuntimeError, ValueError, jwt.PyJWTError) as error:
        logger.warning("Google OAuth authentication failed.")
        raise HTTPException(status_code=401, detail="Google authentication could not be verified.") from error
    email = normalize_email(claims["email"])
    try:
        user = create_oauth_user(email, str(claims.get("name") or "Google User"), claims.get("picture"))
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Unable to create the account.") from None
    if request.expected_role and user["role"] != request.expected_role:
        raise HTTPException(
            status_code=403,
            detail=f"This account is not registered for {request.expected_role.capitalize()} Login.",
        )
    return AuthResponse(
        success=True,
        token=issue_session(user["id"], remember_me=True),
        user=profile(user),
        message=f"Signed in successfully with Google as {user['name']}.",
    )


def apple_client_secret(client_id: str, team_id: str, key_id: str, private_key: str) -> str:
    return jwt.encode(
        {
            "iss": team_id,
            "iat": int(time.time()),
            "exp": int(time.time()) + 300,
            "aud": "https://appleid.apple.com",
            "sub": client_id,
        },
        private_key,
        algorithm="ES256",
        headers={"kid": key_id},
    )


def verify_apple_id_token(id_token: str, client_id: str) -> dict:
    header = jwt.get_unverified_header(id_token)
    if header.get("alg") != "RS256" or not header.get("kid"):
        raise ValueError("Apple returned an invalid signing algorithm.")
    jwks = http_json("https://appleid.apple.com/auth/keys")
    key_data = next(
        (item for item in jwks.get("keys", []) if item.get("kid") == header["kid"]),
        None,
    )
    if not key_data:
        raise ValueError("Apple signing key was not found.")
    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key_data))
    claims = jwt.decode(
        id_token,
        public_key,
        algorithms=["RS256"],
        audience=client_id,
        issuer="https://appleid.apple.com",
        options={"require": ["exp", "iat", "iss", "aud", "sub"]},
    )
    if not claims.get("sub") or not claims.get("email"):
        raise ValueError("Apple did not return a verified identity.")
    if str(claims.get("email_verified", "")).lower() != "true":
        raise ValueError("Apple email address is not verified.")
    return claims


@router.get("/apple/url", response_model=OAuthUrlResponse)
async def apple_auth_url(state: str = Query(min_length=32, max_length=256)) -> OAuthUrlResponse:
    client_id, team_id, key_id, private_key = apple_configuration()
    required = [
        "APPLE_CLIENT_ID",
        "APPLE_TEAM_ID",
        "APPLE_KEY_ID",
        "APPLE_PRIVATE_KEY",
        "APPLE_REDIRECT_URI",
    ]
    if (
        not all((client_id, team_id, key_id, private_key))
        or "your_" in client_id
        or not apple_redirect_uri_is_valid()
    ):
        return OAuthUrlResponse(
            configured=False,
            message="Sign in with Apple is not fully configured on the server.",
            required_env_vars=required,
            redirect_uri=apple_redirect_uri(),
        )
    params = {
        "client_id": client_id,
        "redirect_uri": apple_redirect_uri(),
        "response_type": "code",
        "response_mode": "form_post",
        "scope": "name email",
        "state": state,
    }
    return OAuthUrlResponse(
        configured=True,
        auth_url="https://appleid.apple.com/auth/authorize?"
        + urllib.parse.urlencode(params),
        client_id=client_id,
        message="Apple authorization URL generated successfully.",
        required_env_vars=required,
        redirect_uri=apple_redirect_uri(),
    )


def frontend_oauth_redirect(**params: str) -> RedirectResponse:
    target = f"{frontend_url()}/?" + urllib.parse.urlencode(params)
    return RedirectResponse(target, status_code=303)


@router.post("/apple/callback")
async def apple_auth_callback(
    code: Optional[str] = Form(default=None),
    id_token: Optional[str] = Form(default=None),
    state: Optional[str] = Form(default=None),
    error: Optional[str] = Form(default=None),
) -> RedirectResponse:
    if error:
        return frontend_oauth_redirect(
            oauth_provider="apple",
            oauth_error="Apple sign-in was not completed.",
            state=state or "",
        )
    if not code or not state:
        return frontend_oauth_redirect(
            oauth_provider="apple",
            oauth_error="Apple returned an incomplete authentication response.",
            state=state or "",
        )
    client_id, team_id, key_id, private_key = apple_configuration()
    if not all((client_id, team_id, key_id, private_key)) or not apple_redirect_uri_is_valid():
        return frontend_oauth_redirect(
            oauth_provider="apple",
            oauth_error="Sign in with Apple is not configured on the server.",
            state=state,
        )
    try:
        form_data = urllib.parse.urlencode(
            {
                "client_id": client_id,
                "client_secret": apple_client_secret(client_id, team_id, key_id, private_key),
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": apple_redirect_uri(),
            }
        ).encode("utf-8")
        token_data = http_json(
            "https://appleid.apple.com/auth/token",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        verified_token = token_data.get("id_token") or id_token
        if not verified_token:
            raise ValueError("Apple did not return an identity token.")
        claims = verify_apple_id_token(verified_token, client_id)
        email = normalize_email(claims["email"])
        user = create_oauth_user(email, email.split("@", 1)[0])
        ticket = secrets.token_urlsafe(32)
        with db_session() as connection:
            connection.execute(
                "INSERT INTO apple_handoffs(token_hash, user_id, expires_at) VALUES (?, ?, ?)",
                (
                    digest_token(ticket),
                    user["id"],
                    int(time.time()) + APPLE_HANDOFF_TTL_SECONDS,
                ),
            )
    except (RuntimeError, ValueError, sqlite3.IntegrityError, jwt.PyJWTError):
        logger.warning("Apple OAuth authentication failed.")
        return frontend_oauth_redirect(
            oauth_provider="apple",
            oauth_error="Apple authentication could not be verified.",
            state=state,
        )
    fragment = urllib.parse.urlencode(
        {"oauth_provider": "apple", "oauth_ticket": ticket, "state": state}
    )
    return RedirectResponse(f"{frontend_url()}/#{fragment}", status_code=303)


@router.post("/apple/exchange", response_model=AuthResponse)
async def apple_handoff_exchange(request: AppleHandoffRequest) -> AuthResponse:
    now = int(time.time())
    with db_session() as connection:
        connection.execute("BEGIN IMMEDIATE")
        handoff = connection.execute(
            "SELECT user_id FROM apple_handoffs WHERE token_hash = ? AND expires_at > ?",
            (digest_token(request.ticket), now),
        ).fetchone()
        if not handoff:
            raise HTTPException(status_code=401, detail="Apple authentication ticket is invalid or expired.")
        connection.execute(
            "DELETE FROM apple_handoffs WHERE token_hash = ?",
            (digest_token(request.ticket),),
        )
        user = connection.execute(
            "SELECT id, email, name, password_hash, role, avatar FROM users WHERE id = ?",
            (handoff["user_id"],),
        ).fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Apple account is no longer available.")
        if request.expected_role and user["role"] != request.expected_role:
            raise HTTPException(
                status_code=403,
                detail=f"This account is not registered for {request.expected_role.capitalize()} Login.",
            )
    return AuthResponse(
        success=True,
        token=issue_session(user["id"], remember_me=True),
        user=profile(user),
        message=f"Signed in successfully with Apple as {user['name']}.",
    )
