import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  FileText,
  Stethoscope,
  TrendingUp,
  Heart,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  HelpCircle,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import {
  loginApi,
  signupApi,
  forgotPasswordApi,
  resetPasswordApi,
  fetchGoogleAuthUrl,
  fetchAppleAuthUrl,
  exchangeGoogleOAuth,
  exchangeAppleOAuth,
} from '../services/api';
import { MedicalHeartStethoscope } from '../components/illustrations/MedicalHeartStethoscope';
import doctorHeroImg from '../assets/doctor_hero.jpg';

interface LoginPageProps {
  language: Language;
  onLoginSuccess: (user: UserProfile, token: string, rememberMe?: boolean) => void;
  onExploreAsGuest: () => void;
}

type RoleMode = 'all' | 'doctor' | 'patient';

function createOAuthState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const LoginPage: React.FC<LoginPageProps> = ({
  language,
  onLoginSuccess,
  onExploreAsGuest,
}) => {
  // Role selection mode: 'all' (initial with role selection options), 'doctor', or 'patient'
  const [selectedRole, setSelectedRole] = useState<RoleMode>('all');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(() =>
    Boolean(new URLSearchParams(window.location.hash.slice(1)).get('reset_token'))
  );
  const [showOAuthModal, setShowOAuthModal] = useState<{
    open: boolean;
    provider: 'Google' | 'Apple';
    configured: boolean;
    message: string;
    requiredVars?: string[];
  }>({
    open: false,
    provider: 'Google',
    configured: false,
    message: '',
  });

  // Sign up modal inputs
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'patient' | 'doctor'>('patient');
  const [signupLicense, setSignupLicense] = useState('');
  const [signupDoctorInviteCode, setSignupDoctorInviteCode] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // Forgot / Reset password modal inputs
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(() =>
    new URLSearchParams(window.location.hash.slice(1)).get('reset_token')
  );
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const oauthHandled = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const code = params.get('code');
    const ticket = params.get('oauth_ticket') || fragment.get('oauth_ticket');
    const provider =
      params.get('oauth_provider') ||
      fragment.get('oauth_provider') ||
      sessionStorage.getItem('mediguide_oauth_provider');
    const state = params.get('state') || fragment.get('state');
    const expectedState = sessionStorage.getItem('mediguide_oauth_state');
    const oauthError =
      params.get('oauth_error') || fragment.get('oauth_error') || params.get('error');
    const resetTokenFromLink = fragment.get('reset_token');

    if (resetTokenFromLink) {
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    }

    if (oauthError) {
      setErrorMessage(`OAuth authentication error: ${oauthError}`);
      oauthHandled.current = true;
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if ((code || ticket) && !oauthHandled.current) {
      oauthHandled.current = true;
      const handleOAuthReturn = async () => {
        try {
          setLoading(true);
          if (!state || !expectedState || state !== expectedState) {
            throw new Error('OAuth state validation failed. Please try again.');
          }
          const expectedRoleValue = sessionStorage.getItem('mediguide_oauth_role');
          const expectedRole =
            expectedRoleValue === 'doctor' || expectedRoleValue === 'patient'
              ? expectedRoleValue
              : undefined;
          let res;
          if (provider === 'apple' && ticket) {
            res = await exchangeAppleOAuth({ ticket, expected_role: expectedRole });
          } else if (provider === 'google' && code) {
            res = await exchangeGoogleOAuth({
              code,
              redirect_uri: sessionStorage.getItem('mediguide_oauth_redirect_uri') || undefined,
              expected_role: expectedRole,
            });
          } else {
            throw new Error('OAuth provider response was invalid. Please try again.');
          }
          if (res.success && res.user && res.token) {
            onLoginSuccess(res.user, res.token, rememberMe);
          } else {
            setErrorMessage(res.message || 'OAuth authentication failed.');
          }
        } catch (err: unknown) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to exchange authorization code.');
        } finally {
          setLoading(false);
          sessionStorage.removeItem('mediguide_oauth_state');
          sessionStorage.removeItem('mediguide_oauth_provider');
          sessionStorage.removeItem('mediguide_oauth_redirect_uri');
          sessionStorage.removeItem('mediguide_oauth_role');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      handleOAuthReturn();
    }
  }, [onLoginSuccess, rememberMe]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage(
        language === 'te'
          ? 'దయచేసి మీ ఇమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి.'
          : 'Please enter both your email address and password.'
      );
      return;
    }

    try {
      setLoading(true);
      const expectedRole = selectedRole === 'all' ? null : selectedRole;
      const res = await loginApi({
        email: email.trim(),
        password,
        remember_me: rememberMe,
        expected_role: expectedRole,
      });

      if (res.success && res.user && res.token) {
        setSuccessMessage(res.message || 'Welcome back!');
        setTimeout(() => {
          onLoginSuccess(res.user!, res.token!, rememberMe);
        }, 300);
      } else {
        setErrorMessage(res.message || 'Authentication could not be completed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      setSignupError('Please fill in all required registration fields.');
      return;
    }

    if (signupRole === 'doctor' && (!signupLicense.trim() || signupLicense.trim().length < 5)) {
      setSignupError('A valid physician license number (at least 5 characters) is required for Doctor accounts.');
      return;
    }

    try {
      setSignupLoading(true);
      const res = await signupApi({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        role: signupRole,
        medical_license: signupRole === 'doctor' ? signupLicense.trim() : undefined,
        doctor_invite_code: signupRole === 'doctor' ? signupDoctorInviteCode : undefined,
      });

      if (res.success && res.user && res.token) {
        setShowSignupModal(false);
        onLoginSuccess(res.user, res.token, true);
      } else {
        setSignupError(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setSignupError(err.message || 'Could not complete registration.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFeedback(null);

    if (!forgotEmail.trim()) {
      setForgotFeedback({ type: 'error', msg: 'Please enter your registered email address.' });
      return;
    }

    try {
      setForgotLoading(true);
      const res = await forgotPasswordApi({ email: forgotEmail.trim() });
      setForgotFeedback({
        type: 'success',
        msg: res.message || 'Password recovery instructions dispatched.',
      });
    } catch (err: any) {
      setForgotFeedback({
        type: 'error',
        msg: err.message || 'Failed to send reset link.',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;

    if (newPassword.length < 8) {
      setForgotFeedback({ type: 'error', msg: 'New password must be at least 8 characters.' });
      return;
    }

    try {
      setResetLoading(true);
      const res = await resetPasswordApi({ token: resetToken, new_password: newPassword });
      setForgotFeedback({ type: 'success', msg: res.message });
      setTimeout(() => {
        setShowForgotModal(false);
        setResetToken(null);
        setNewPassword('');
        setSuccessMessage('Password reset successfully. Please sign in with your new password.');
      }, 1500);
    } catch (err: any) {
      setForgotFeedback({ type: 'error', msg: err.message || 'Failed to reset password.' });
    } finally {
      setResetLoading(false);
    }
  };

  // Google OAuth Flow
  const handleGoogleClick = async () => {
    if (googleLoading) return;
    try {
      setGoogleLoading(true);
      setErrorMessage(null);
      const state = createOAuthState();
      sessionStorage.setItem('mediguide_oauth_state', state);
      sessionStorage.setItem('mediguide_oauth_provider', 'google');
      sessionStorage.setItem('mediguide_oauth_role', selectedRole);
      const res = await fetchGoogleAuthUrl(state);

      if (res.configured && res.auth_url) {
        sessionStorage.setItem('mediguide_oauth_redirect_uri', res.redirect_uri || '');
        sessionStorage.removeItem('mediguide_guest');
        window.location.href = res.auth_url;
      } else {
        sessionStorage.removeItem('mediguide_oauth_state');
        sessionStorage.removeItem('mediguide_oauth_provider');
        sessionStorage.removeItem('mediguide_oauth_role');
        setShowOAuthModal({
          open: true,
          provider: 'Google',
          configured: false,
          message: res.message,
          requiredVars: res.required_env_vars || ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
        });
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to initialize Google authentication.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Apple OAuth Flow
  const handleAppleClick = async () => {
    if (appleLoading) return;
    try {
      setAppleLoading(true);
      setErrorMessage(null);
      const state = createOAuthState();
      sessionStorage.setItem('mediguide_oauth_state', state);
      sessionStorage.setItem('mediguide_oauth_provider', 'apple');
      sessionStorage.setItem('mediguide_oauth_role', selectedRole);
      const res = await fetchAppleAuthUrl(state);

      if (res.configured && res.auth_url) {
        sessionStorage.removeItem('mediguide_guest');
        window.location.href = res.auth_url;
      } else {
        sessionStorage.removeItem('mediguide_oauth_state');
        sessionStorage.removeItem('mediguide_oauth_provider');
        sessionStorage.removeItem('mediguide_oauth_role');
        setShowOAuthModal({
          open: true,
          provider: 'Apple',
          configured: false,
          message: res.message,
          requiredVars: res.required_env_vars || ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'],
        });
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to initialize Apple authentication.');
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF7FF] flex flex-col lg:flex-row text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* ========================================================= */}
      {/* LEFT COLUMN: BRANDING, VALUE PROPS & DOCTOR ILLUSTRATION  */}
      {/* ========================================================= */}
      <div className="lg:w-[52%] xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#EEF7FF] via-[#E2F0FE] to-[#F1F8FF] p-6 sm:p-10 lg:p-14 xl:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#D8E3F2]/70">
        {/* Soft Organic Decorative Blobs & Circles in Background */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 bg-cyan-200/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding Section */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {/* Heart Pulse Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1677FF] via-[#0284C7] to-[#22C7E8] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-[#0B1F4D]">
                  MediGuide
                </span>
                <span className="text-2xl font-black bg-gradient-to-r from-[#1677FF] to-[#22C7E8] bg-clip-text text-transparent">
                  AI
                </span>
                <span className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#1677FF] border border-blue-200 uppercase tracking-wider">
                  Healthcare
                </span>
              </div>
              <p className="text-xs font-medium text-[#52658A]">
                Your Personal Health Companion
              </p>
            </div>
          </div>

          {/* Main Headline */}
          <div className="mt-8 sm:mt-12 max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B1F4D] tracking-tight leading-[1.18]">
              Smarter Healthcare
              <br />
              for a{' '}
              <span className="bg-gradient-to-r from-[#1677FF] to-[#0284C7] bg-clip-text text-transparent">
                Healthier You
              </span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#52658A] leading-relaxed max-w-lg">
              AI-powered insights, report analysis, and personalized health guidance — all in one place.
            </p>
          </div>

          {/* 4 Feature Value Rows */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            {/* Feature 1 */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/70 backdrop-blur-xs border border-white/80 shadow-xs hover:bg-white/95 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1677FF] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B1F4D]">Analyze Medical Reports</h4>
                <p className="text-[11px] text-[#52658A]">Instant PDF lab explanations</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/70 backdrop-blur-xs border border-white/80 shadow-xs hover:bg-white/95 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 text-[#0284C7] flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B1F4D]">Get AI Health Guidance</h4>
                <p className="text-[11px] text-[#52658A]">Bilingual English & Telugu</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/70 backdrop-blur-xs border border-white/80 shadow-xs hover:bg-white/95 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B1F4D]">Track Health Progress</h4>
                <p className="text-[11px] text-[#52658A]">Longitudinal report trends</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/70 backdrop-blur-xs border border-white/80 shadow-xs hover:bg-white/95 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B1F4D]">Personalized Insights</h4>
                <p className="text-[11px] text-[#52658A]">Educational questions for MDs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Illustration & Floating Glassmorphism Cards */}
        <div className="relative mt-8 lg:mt-12 flex flex-col items-center justify-center">
          {/* Main Visual Image Card with Halo */}
          <div className="relative w-full max-w-[420px] rounded-3xl p-2 bg-gradient-to-b from-white/80 to-blue-50/50 backdrop-blur-md border border-white shadow-xl shadow-blue-500/10">
            <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-100">
              <img
                src={doctorHeroImg}
                alt="Friendly female physician holding medical tablet"
                className="w-full h-full object-cover object-top hover:scale-102 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/doctor_hero.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F4D]/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold drop-shadow-md">
                <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Clinical AI Companion
                </span>
                <span className="bg-blue-600/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px]">
                  Bilingual English & Telugu
                </span>
              </div>
            </div>

            {/* Floating Card 1: Reports Analysis (Top Left) */}
            <div className="absolute -top-4 -left-3 sm:-left-6 bg-white/90 backdrop-blur-md border border-white p-3 rounded-2xl shadow-lg shadow-blue-500/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#0B1F4D]">Reports Analysis</p>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Instant PDF Breakdown
                </p>
              </div>
            </div>

            {/* Floating Card 2: AI Assistant (Bottom Right) */}
            <div className="absolute -bottom-4 -right-3 sm:-right-6 bg-white/90 backdrop-blur-md border border-white p-3 rounded-2xl shadow-lg shadow-blue-500/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1677FF] to-[#22C7E8] text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#0B1F4D]">AI Health Assistant</p>
                <p className="text-[10px] text-[#52658A]">Safe & Educational</p>
              </div>
            </div>
          </div>

          {/* Badge: "Your Health Matters" */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-blue-200 text-xs font-semibold text-[#0B1F4D] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#1677FF] animate-pulse"></span>
            <span>Your Health Matters</span>
            <span className="text-[#52658A] font-normal">•</span>
            <span className="text-xs text-[#52658A]">Report files processed in memory</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: CENTERED HEALTHCARE SAAS LOGIN CARD         */}
      {/* ========================================================= */}
      <div className="flex-1 bg-[#F5F8FC] flex items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-16">
        <div className="w-full max-w-[480px]">
          {/* Main White Card with Rounded-[32px] & Soft Shadow */}
          <div className="bg-white rounded-[32px] border border-[#D8E3F2] shadow-2xl shadow-blue-500/10 p-6 sm:p-10 relative">
            {/* Top Right Decorative Emblem: Heart Intertwined with Stethoscope */}
            <div className="absolute top-6 right-6" title="MediGuide Care Emblem">
              <MedicalHeartStethoscope className="w-12 h-12" size={48} />
            </div>

            {/* Card Header & Dynamic Role Badge */}
            <div className="pr-12">
              {selectedRole === 'doctor' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  Doctor Login Portal
                </div>
              ) : selectedRole === 'patient' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-800 text-xs font-bold mb-2">
                  <Heart className="w-3.5 h-3.5 text-[#0284C7]" />
                  Patient Login Portal
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#1677FF] text-xs font-semibold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1677FF]" />
                  Secure Health Portal
                </div>
              )}

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D] tracking-tight">
                {selectedRole === 'doctor'
                  ? 'Doctor Sign In'
                  : selectedRole === 'patient'
                  ? 'Patient Sign In'
                  : 'Welcome Back'}
              </h2>
              <p className="mt-1 text-sm text-[#52658A]">
                {selectedRole === 'doctor'
                  ? 'Access physician clinical review workspace'
                  : selectedRole === 'patient'
                  ? 'Access your personal medical reports and AI explanations'
                  : 'Sign in to access your personal health dashboard'}
              </p>
            </div>

            {/* Role Selection Buttons (Doctor Login / Patient Login) */}
            <div className="mt-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(selectedRole === 'doctor' ? 'all' : 'doctor');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex items-center justify-center gap-2.5 py-3 px-3 rounded-2xl border text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer shadow-2xs ${
                    selectedRole === 'doctor'
                      ? 'bg-blue-600 border-blue-700 text-white shadow-md shadow-blue-500/20'
                      : 'bg-blue-50/80 hover:bg-blue-100/90 border-blue-200/80 text-[#0B1F4D]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      selectedRole === 'doctor'
                        ? 'bg-white text-blue-600'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <span>Doctor Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(selectedRole === 'patient' ? 'all' : 'patient');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex items-center justify-center gap-2.5 py-3 px-3 rounded-2xl border text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer shadow-2xs ${
                    selectedRole === 'patient'
                      ? 'bg-[#0284C7] border-[#0369a1] text-white shadow-md shadow-cyan-500/20'
                      : 'bg-cyan-50/80 hover:bg-cyan-100/90 border-cyan-200/80 text-[#0B1F4D]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      selectedRole === 'patient'
                        ? 'bg-white text-[#0284C7]'
                        : 'bg-[#0284C7] text-white'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                  </div>
                  <span>Patient Login</span>
                </button>
              </div>

              {selectedRole !== 'all' && (
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-[#52658A] flex items-center gap-1 font-medium">
                    Filtered to: <strong className="capitalize text-[#0B1F4D]">{selectedRole} role</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('all');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-semibold text-[#1677FF] hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to role selection
                  </button>
                </div>
              )}
            </div>

            {/* Error / Success Notifications */}
            {errorMessage && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
              {/* Email Address */}
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-xs font-bold text-[#0B1F4D] mb-1.5 uppercase tracking-wider"
                >
                  {selectedRole === 'doctor'
                    ? 'Physician Email Address'
                    : selectedRole === 'patient'
                    ? 'Patient Email Address'
                    : 'Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      selectedRole === 'doctor'
                        ? 'doctor@hospital.org'
                        : selectedRole === 'patient'
                        ? 'patient@example.com'
                        : 'name@example.com'
                    }
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#F5F8FC] border border-[#D8E3F2] rounded-xl text-sm text-[#0B1F4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1677FF]/40 focus:border-[#1677FF] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password-input"
                  className="block text-xs font-bold text-[#0B1F4D] mb-1.5 uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-11 py-3 bg-[#F5F8FC] border border-[#D8E3F2] rounded-xl text-sm text-[#0B1F4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1677FF]/40 focus:border-[#1677FF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[#52658A]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#D8E3F2] text-[#1677FF] focus:ring-[#1677FF]/30 accent-[#1677FF]"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || '');
                    setForgotFeedback(null);
                    setResetToken(null);
                    setShowForgotModal(true);
                  }}
                  className="font-semibold text-[#1677FF] hover:text-[#0284C7] hover:underline focus:outline-none cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Gradient Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#1677FF] via-[#0EA5E9] to-[#22C7E8] text-white font-bold text-sm shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {selectedRole === 'doctor'
                        ? 'Sign In as Doctor'
                        : selectedRole === 'patient'
                        ? 'Sign In as Patient'
                        : 'Sign In'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* "Or continue with" Divider */}
            <div className="mt-5 relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#D8E3F2]" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-[#52658A]">
                Or continue with
              </span>
            </div>

            {/* Social Sign-in Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading || appleLoading}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#D8E3F2] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={handleAppleClick}
                disabled={googleLoading || appleLoading}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#D8E3F2] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {appleLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0 fill-current text-slate-900" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.86c.64-.78 1.08-1.86.96-2.95-.93.04-2.09.62-2.75 1.4-.58.67-1.09 1.76-.95 2.81 1.05.08 2.12-.52 2.74-1.26" />
                  </svg>
                )}
                <span>Continue with Apple</span>
              </button>
            </div>

            {/* Bottom Actions: Sign Up & Guest Mode */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-xs text-[#52658A]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setSignupError(null);
                    setShowSignupModal(true);
                  }}
                  className="font-bold text-[#1677FF] hover:text-[#0284C7] hover:underline focus:outline-none cursor-pointer"
                >
                  Sign Up
                </button>
              </p>

              <div>
                <button
                  type="button"
                  onClick={onExploreAsGuest}
                  className="text-xs font-medium text-slate-500 hover:text-[#1677FF] underline transition-colors cursor-pointer"
                >
                  Explore MediGuide AI as Guest (Skip Sign In) →
                </button>
              </div>
            </div>
          </div>

          {/* Security & HIPAA Compliance Notice */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[#52658A]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Report files processed in memory • Secure server-side authentication</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SIGN UP MODAL (WITH PHYSICIAN LICENSE VALIDATION)         */}
      {/* ========================================================= */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowSignupModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1677FF] flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0B1F4D]">Create Account</h3>
                <p className="text-xs text-[#52658A]">Join MediGuide AI to analyze reports securely</p>
              </div>
            </div>

            {signupError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{signupError}</span>
              </div>
            )}

            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Dr. Alex Morgan or Alex Taylor"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupRole('patient')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      signupRole === 'patient'
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole('doctor')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      signupRole === 'doctor'
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Doctor
                  </button>
                </div>
              </div>

              {signupRole === 'doctor' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    Physician Medical License Number *
                  </label>
                  <input
                    type="text"
                    value={signupLicense}
                    onChange={(e) => setSignupLicense(e.target.value)}
                    placeholder="e.g. MD-984321"
                    required
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <p className="mt-1 text-[10px] text-blue-700">
                    A physician license number and administrator-issued authorization code are required.
                  </p>
                </div>
              )}

              {signupRole === 'doctor' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor Authorization Code
                  </label>
                  <input
                    type="password"
                    value={signupDoctorInviteCode}
                    onChange={(e) => setSignupDoctorInviteCode(e.target.value)}
                    autoComplete="off"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#22C7E8] text-white font-bold text-sm shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {signupLoading ? 'Creating Account...' : 'Complete Sign Up'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FORGOT & RESET PASSWORD MODAL                             */}
      {/* ========================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setResetToken(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 text-[#0284C7] flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0B1F4D]">
                  {resetToken ? 'Enter New Password' : 'Reset Your Password'}
                </h3>
                <p className="text-xs text-[#52658A]">
                  {resetToken
                    ? 'Security token verified. Please choose a new password.'
                    : 'We will verify your registered email and issue a reset link.'}
                </p>
              </div>
            </div>

            {forgotFeedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  forgotFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                {forgotFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{forgotFeedback.msg}</span>
              </div>
            )}

            {!resetToken ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 rounded-xl bg-[#1677FF] hover:bg-blue-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {forgotLoading ? 'Dispatching Link...' : 'Send Recovery Instructions'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading ? 'Updating Password...' : 'Save New Password & Sign In'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* OAUTH INFORMATION & CONFIGURATION GUIDE MODAL             */}
      {/* ========================================================= */}
      {showOAuthModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowOAuthModal({ ...showOAuthModal, open: false })}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1677FF] flex items-center justify-center font-bold">
                {showOAuthModal.provider[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0B1F4D]">
                  {showOAuthModal.provider} Authentication
                </h3>
                <p className="text-xs text-[#52658A]">OAuth Provider Configuration Status</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Missing {showOAuthModal.provider} Credentials on Server
              </p>
              <p className="text-slate-700 leading-relaxed">
                {showOAuthModal.message ||
                  `To activate official ${showOAuthModal.provider} sign-in, configure your OAuth credentials in backend/.env.`}
              </p>
              {showOAuthModal.requiredVars && (
                <div className="mt-2 p-2 bg-white rounded-lg border border-amber-200 font-mono text-[11px] text-slate-800 space-y-1">
                  <p className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider">
                    Add to backend/.env:
                  </p>
                  {showOAuthModal.requiredVars.map((v) => (
                    <div key={v} className="text-blue-700">
                      {v}=your_{v.toLowerCase()}_here
                    </div>
                  ))}
                </div>
              )}
              <p className="text-slate-600 text-[11px]">
                Once configured, clicking &quot;Continue with {showOAuthModal.provider}&quot; will launch the official consent screen and securely authenticate your session.
              </p>
            </div>

            <button
              onClick={() => setShowOAuthModal({ ...showOAuthModal, open: false })}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
