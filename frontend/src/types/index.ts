export type Language = 'en' | 'te' | 'hi';

export type NavigationTab = 
  | 'dashboard'
  | 'analyzer'
  | 'chat'
  | 'comparison'
  | 'sources'
  | 'settings'
  | 'healthTips'
  | 'emergency'
  | 'history'
  | 'account'
  | 'login';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: 'doctor' | 'patient';
  created_at: string;
  login_method: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string | null;
  user?: UserProfile | null;
  message: string;
}

export interface OAuthStatusResponse {
  google_configured: boolean;
  apple_configured: boolean;
  google_client_id?: string | null;
  apple_client_id?: string | null;
  message: string;
}

export interface OAuthUrlResponse {
  configured: boolean;
  auth_url?: string | null;
  client_id?: string | null;
  message: string;
  required_env_vars?: string[];
  redirect_uri?: string;
}

export interface LoginParams {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface SignupParams {
  name: string;
  email: string;
  password: string;
}

export interface PatientInfo {
  name?: string;
  age_range?: string;
  gender?: string;
  date?: string;
}

export type TestStatus = 'normal' | 'high' | 'low' | 'borderline' | 'unspecified';

export interface TestResultItem {
  test_name: string;
  value: string | number;
  unit: string;
  reference_range: string;
  status: TestStatus;
  description: string;
  description_te?: string;
  description_hi?: string;
}

export interface ReportSummary {
  overview_en: string;
  overview_te: string;
  overview_hi?: string;
  key_takeaways_en: string[];
  key_takeaways_te: string[];
  key_takeaways_hi?: string[];
  questions_for_doctor_en: string[];
  questions_for_doctor_te: string[];
  questions_for_doctor_hi?: string[];
  disclaimer: string;
}

export interface AnalyzeReportResponse {
  mode: 'ai' | 'demo';
  filename: string;
  extracted_text_preview: string;
  raw_text_length: number;
  is_scanned_pdf: boolean;
  language: Language;
  report_type: string;
  patient_info: PatientInfo;
  test_results: TestResultItem[];
  summary: ReportSummary;
}

export interface ReportHistoryEntry {
  id: string;
  filename: string;
  report_type: string;
  analyzed_at: string;
  summary: ReportSummary;
  test_results: TestResultItem[];
}

export interface ChatHistoryEntry {
  id: string;
  question: string;
  reply: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode?: 'ai' | 'demo';
  suggested_questions?: string[];
  sources?: ChatSource[];
  retryQuestion?: string;
  failedUserMessageId?: string;
}

export interface ChatSource {
  title: string;
  organization: string;
  url: string;
  topic: string;
}

export interface ChatResponse {
  mode: 'ai';
  reply: string;
  language: Language;
  suggested_questions: string[];
  trusted_sources: ChatSource[];
  disclaimer: string;
  provider: 'gemini' | 'secondary';
  fallback_used: boolean;
  cached: boolean;
}

export interface AIStatus {
  status: 'available' | 'switching' | 'unavailable';
  primary_configured: boolean;
  secondary_configured: boolean;
  active_provider: 'gemini' | 'secondary' | null;
}

export interface HealthStatus {
  status: string;
  gemini_configured: boolean;
  gemini_status?: 'connected' | 'missing_key' | 'invalid_key' | 'permission_denied' | 'rate_limited' | 'invalid_request' | 'timeout' | 'unavailable' | 'error';
  gemini_message?: string;
  secondary_ai_configured?: boolean;
  ai_available?: boolean;
  model: string;
  version: string;
  features: string[];
}

export interface ComparisonMetric {
  test_name: string;
  val_a: number;
  val_b: number;
  unit: string;
  ref_range: string;
  diff: number;
  percent_diff: number;
  note: string;
}

export interface ComparisonDataset {
  title: string;
  description: string;
  report_a: { label: string; date: string };
  report_b: { label: string; date: string };
  metrics: ComparisonMetric[];
  clinical_caveat: string;
}

export interface TrustedSource {
  id: string;
  title: string;
  organization: string;
  url: string;
  description: string;
  category: string;
  badge: string;
}
