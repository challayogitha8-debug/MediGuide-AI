import {
  AnalyzeReportResponse,
  ChatResponse,
  HealthStatus,
  Language,
  ComparisonDataset,
  TrustedSource,
  AuthResponse,
  OAuthStatusResponse,
  OAuthUrlResponse,
  LoginParams,
  SignupParams,
  UserProfile,
} from '../types';

const API_BASE = '/api';
const AUTH_REQUEST_TIMEOUT_MS = 20_000;

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function fetchAuthRequest(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  let timeout: number;
  const timeoutError = new Promise<never>((_resolve, reject) => {
    timeout = window.setTimeout(() => {
      controller.abort();
      reject(
        new Error('Authentication request timed out. Check that the backend is running and try again.'),
      );
    }, AUTH_REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([
      fetch(input, { ...init, signal: controller.signal }),
      timeoutError,
    ]);
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchHealth(forceCheck: boolean = false): Promise<HealthStatus> {
  try {
    const url = `${API_BASE}/health${forceCheck ? '?check=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('Backend /api/health unavailable:', error);
    return {
      status: 'offline',
      gemini_configured: false,
      gemini_status: 'error',
      gemini_message: 'Backend service is offline or unreachable',
      model: 'Client Offline Mode',
      version: '1.0.0',
      features: ['Local Demo Features Available'],
    };
  }
}

export async function fetchSampleReports(): Promise<
  Array<{
    id: string;
    title: string;
    title_te: string;
    report_type: string;
    patient_info: any;
  }>
> {
  const res = await fetch(`${API_BASE}/sample-reports`);
  if (!res.ok) throw new Error('Failed to load sample reports');
  return await res.json();
}

export async function analyzeReport(params: {
  file?: File | null;
  sampleId?: string | null;
  language: Language;
}): Promise<AnalyzeReportResponse> {
  const formData = new FormData();
  formData.append('language', params.language);

  if (params.file) {
    formData.append('file', params.file);
  }
  if (params.sampleId) {
    formData.append('sample_id', params.sampleId);
  }

  const res = await fetch(`${API_BASE}/analyze-report`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Server error (${res.status}) while analyzing report`);
  }

  return await res.json();
}

export async function sendChatMessage(params: {
  message: string;
  language: Language;
  history?: Array<{ role: string; content: string }>;
}): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Server error (${res.status}) during chat response`);
  }

  return await res.json();
}

export async function fetchComparisonData(): Promise<Record<string, ComparisonDataset>> {
  const res = await fetch(`${API_BASE}/comparison-data`);
  if (!res.ok) throw new Error('Failed to load comparison datasets');
  return await res.json();
}

export async function fetchSources(): Promise<TrustedSource[]> {
  const res = await fetch(`${API_BASE}/sources`);
  if (!res.ok) throw new Error('Failed to load sources');
  return await res.json();
}

export async function loginApi(params: LoginParams): Promise<AuthResponse> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Sign in failed (${res.status})`);
  }
  return data;
}

export async function fetchCurrentUser(token: string): Promise<UserProfile> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiRequestError(data.detail || `Session validation failed (${res.status})`, res.status);
  }
  return data;
}

export async function logoutApi(token: string): Promise<void> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Sign out failed (${res.status})`);
  }
}

export async function signupApi(params: SignupParams): Promise<AuthResponse> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Registration failed (${res.status})`);
  }
  return data;
}

export async function forgotPasswordApi(params: {
  email: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Password reset request failed (${res.status})`);
  }
  return data;
}

export async function resetPasswordApi(params: {
  token: string;
  new_password: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Password update failed (${res.status})`);
  }
  return data;
}

export async function fetchOAuthStatus(): Promise<OAuthStatusResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/oauth-status`);
    if (!res.ok) throw new Error('Failed to fetch OAuth status');
    return await res.json();
  } catch {
    return {
      google_configured: false,
      apple_configured: false,
      message: 'OAuth status service unreachable or offline',
    };
  }
}

export async function fetchGoogleAuthUrl(state: string): Promise<OAuthUrlResponse> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/google/url?state=${encodeURIComponent(state)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to initialize Google OAuth URL');
  }
  return await res.json();
}

export async function fetchAppleAuthUrl(state: string): Promise<OAuthUrlResponse> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/apple/url?state=${encodeURIComponent(state)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to initialize Apple OAuth URL');
  }
  return await res.json();
}

export async function exchangeGoogleOAuth(params: {
  code?: string;
  id_token?: string;
  redirect_uri?: string;
  expected_role?: 'doctor' | 'patient';
}): Promise<AuthResponse> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/google/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Google authentication failed (${res.status})`);
  }
  return data;
}

export async function exchangeAppleOAuth(params: {
  ticket: string;
  expected_role?: 'doctor' | 'patient';
}): Promise<AuthResponse> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/apple/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Apple authentication failed (${res.status})`);
  }
  return data;
}
