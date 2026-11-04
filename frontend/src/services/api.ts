import {
  AnalyzeReportResponse,
  AIStatus,
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
  ReportHistoryEntry,
  ChatHistoryEntry,
} from '../types';

const API_BASE = '/api';
const AUTH_REQUEST_TIMEOUT_MS = 20_000;

export interface NearbyHospital {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  distance_km: number | null;
  google_maps_url: string;
}

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
  let timeout = 0;
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

export async function fetchAIStatus(): Promise<AIStatus> {
  try {
    const response = await fetch(`${API_BASE}/ai/status`);
    if (!response.ok) throw new Error(`AI status request failed: ${response.status}`);
    return await response.json();
  } catch {
    return {
      status: 'unavailable',
      primary_configured: false,
      secondary_configured: false,
      active_provider: null,
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
  token?: string | null;
}): Promise<ChatResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 70_000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The AI request timed out. Please try again.');
    }
    throw new Error('Could not reach the MediGuide AI service. Check your connection and try again.');
  } finally {
    window.clearTimeout(timeout);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('You have sent several questions in a short time. Please wait a moment and try again.');
    }
    if (res.status === 400 || res.status === 422) {
      throw new Error('Please rephrase your question and try again.');
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('AI services are temporarily unavailable. Please try again later.');
    }
    throw new Error('MediGuide could not process that question. Please try again.');
  }
  if (!data || typeof data.reply !== 'string' || !data.reply.trim()) {
    throw new Error('The AI service returned an empty answer. Please try again.');
  }

  return data;
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

export async function findNearbyHospitals(params: {
  latitude?: number;
  longitude?: number;
  address?: string;
}): Promise<NearbyHospital[]> {
  const res = await fetchAuthRequest(`${API_BASE}/emergency/nearby-hospitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Nearby hospital search failed (${res.status})`);
  }
  return data;
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

export async function updateCurrentUserProfile(
  token: string,
  params: { name: string; avatar: string | null },
): Promise<UserProfile> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Profile update failed (${res.status})`);
  }
  return data;
}

export async function saveReportHistory(token: string, report: AnalyzeReportResponse): Promise<void> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/history/reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: report.filename,
      report_type: report.report_type,
      summary: report.summary,
      test_results: report.test_results,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Could not save report history (${res.status})`);
  }
}

export async function saveChatHistory(
  token: string,
  question: string,
  reply: string,
): Promise<void> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/history/chats`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, reply }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Could not save chat history (${res.status})`);
  }
}

export async function fetchUserHistory(
  token: string,
): Promise<{ reports: ReportHistoryEntry[]; chats: ChatHistoryEntry[] }> {
  const res = await fetchAuthRequest(`${API_BASE}/auth/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Could not load history (${res.status})`);
  }
  return data;
}

export async function deleteHistoryRecord(
  token: string,
  kind: 'reports' | 'chats',
  id: string,
): Promise<void> {
  const res = await fetchAuthRequest(
    `${API_BASE}/auth/history/${kind}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Could not delete history record (${res.status})`);
  }
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

export async function exchangeGoogleOAuth(params: {
  code?: string;
  id_token?: string;
  redirect_uri?: string;
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
