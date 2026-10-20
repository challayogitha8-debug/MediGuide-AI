export type Language = 'en' | 'te';

export type NavigationTab = 
  | 'dashboard'
  | 'analyzer'
  | 'chat'
  | 'comparison'
  | 'sources'
  | 'settings'
  | 'login';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: 'doctor' | 'patient';
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
  expected_role?: 'doctor' | 'patient' | null;
}

export interface SignupParams {
  name: string;
  email: string;
  password: string;
  role?: 'doctor' | 'patient';
  medical_license?: string;
  doctor_invite_code?: string;
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
}

export interface ReportSummary {
  overview_en: string;
  overview_te: string;
  key_takeaways_en: string[];
  key_takeaways_te: string[];
  questions_for_doctor_en: string[];
  questions_for_doctor_te: string[];
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode?: 'ai' | 'demo';
  suggested_questions?: string[];
  sources?: ChatSource[];
}

export interface ChatSource {
  title: string;
  organization: string;
  url: string;
  topic: string;
}

export interface ChatResponse {
  mode: 'ai' | 'demo';
  reply: string;
  language: Language;
  suggested_questions: string[];
  trusted_sources: ChatSource[];
  disclaimer: string;
}

export interface HealthStatus {
  status: string;
  gemini_configured: boolean;
  gemini_status?: 'connected' | 'missing_key' | 'invalid_key' | 'error';
  gemini_message?: string;
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
