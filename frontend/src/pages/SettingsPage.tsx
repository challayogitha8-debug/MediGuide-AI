import React, { useState } from 'react';
import {
  ShieldCheck,
  Server,
  Key,
  Globe,
  RefreshCw,
  AlertOctagon,
  Lock,
  CheckCircle2,
  Sliders,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { HealthStatus, Language } from '../types';

interface SettingsPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  health: HealthStatus | null;
  onRefreshHealth: (force?: boolean) => void | Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  language,
  onLanguageChange,
  health,
  onRefreshHealth,
}) => {
  const [checking, setChecking] = useState(false);
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);

  const handleManualCheck = async () => {
    setChecking(true);
    setLastCheckMessage(null);
    try {
      await onRefreshHealth(true);
      setLastCheckMessage(language === 'te' ? 'స్థితి విజయవంతంగా అప్‌డేట్ చేయబడింది.' : 'Status refreshed successfully.');
    } catch (err: any) {
      setLastCheckMessage(err?.message || 'Error pinging backend service.');
    } finally {
      setTimeout(() => setChecking(false), 500);
      setTimeout(() => setLastCheckMessage(null), 4000);
    }
  };

  // Determine Gemini connection status
  const isGeminiConnected = Boolean(
    health?.gemini_configured && health?.gemini_status === 'connected'
  );

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sliders className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {language === 'te' ? 'గోప్యత, భద్రత & సిస్టమ్ సెట్టింగ్‌లు' : 'Privacy, Ethics & System Settings'}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {language === 'te'
            ? 'సిస్టమ్ స్థితి, API కనెక్షన్ మరియు గోప్యతా నియమాలను ఇక్కడ పరిశీలించండి.'
            : 'Review backend connectivity, Gemini AI configuration, report processing, account storage, and medical disclaimers.'}
        </p>
      </div>

      {/* Backend & AI Connectivity Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900">
              {language === 'te' ? 'సిస్టమ్ మరియు API స్థితి' : 'System & Gemini AI Operational Status'}
            </h3>
          </div>
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-xs font-semibold text-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{checking ? (language === 'te' ? 'తనిఖీ చేస్తోంది...' : 'Pinging & Verifying...') : 'Ping Backend'}</span>
          </button>
        </div>

        {/* Temporary check notification banner */}
        {lastCheckMessage && (
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{lastCheckMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-slate-400 font-medium">FastAPI Backend:</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="font-bold text-slate-800 uppercase">{health?.status || 'Offline'}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Version {health?.version || '1.0.0'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-slate-400 font-medium">Gemini AI Engine:</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isGeminiConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="font-bold text-slate-800">
                {isGeminiConnected ? 'Connected & Verified' : 'Demo Fallback Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{health?.model || 'Demo Fallback Mode'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-slate-400 font-medium">PDF Parser:</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-800">pypdf (In-Memory)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Digital text layer verification</p>
          </div>
        </div>

        {/* Dynamic Card: Connected Success vs Warning Setup Panel */}
        {isGeminiConnected ? (
          /* GREEN SUCCESS CARD (Instructions Hidden) */
          <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">
                    {language === 'te'
                      ? 'Gemini AI విజయవంతంగా కనెక్ట్ చేయబడింది మరియు ఉపయోగించడానికి సిద్ధంగా ఉంది.'
                      : 'Gemini AI is connected and ready to use.'}
                  </h4>
                  <p className="text-xs text-emerald-800/90 mt-0.5 leading-relaxed">
                    {language === 'te'
                      ? `యాక్టివ్ మోడల్: ${health?.model || 'gemini-3.8-flash'}. లైవ్ నివేదిక విశ్లేషణ మరియు హెల్త్ అసిస్టెంట్ పూర్తిగా పనిచేస్తున్నాయి.`
                      : `Active Engine: ${health?.model || 'gemini-3.8-flash'}. Real-time report analysis, bilingual explanations, and interactive assistant are fully operational.`}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Connected
              </span>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {language === 'te'
                  ? 'మీ API కీ సర్వర్‌లో సురక్షితంగా ఉంచబడింది మరియు బ్రౌజర్ స్టోరేజ్ లేదా నెట్‌వర్క్ ప్యాకెట్లలో ఎప్పుడూ బహిర్గతం చేయబడదు.'
                  : 'Your API key is securely isolated on the backend server and is never exposed to the client browser or frontend code.'}
              </span>
            </div>
          </div>
        ) : (
          /* WARNING CARD & SETUP INSTRUCTIONS (When missing or invalid) */
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-amber-950">
                    {health?.gemini_status === 'invalid_key'
                      ? (language === 'te' ? 'Gemini API కీ చెల్లదు' : 'Gemini API Key Invalid or Unauthorized')
                      : (language === 'te' ? 'Gemini AI కీ కాన్ఫిగర్ చేయబడలేదు (డెమో మోడ్)' : 'Gemini AI Key Not Configured (Running in Demo Mode)')}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Demo Mode Active
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  {health?.gemini_message || (
                    language === 'te'
                      ? 'లైవ్ Gemini AI విశ్లేషణను సక్రియం చేయడానికి మీ API కీని backend/.env ఫైల్‌లో నమోదు చేయండి.'
                      : 'To activate live Gemini AI reasoning, configure your GEMINI_API_KEY in the backend/.env file.'
                  )}
                </p>
              </div>
            </div>

            {/* Step-by-step instructions */}
            <div className="p-4 rounded-xl bg-white border border-amber-200/90 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Key className="w-4 h-4 text-amber-600" />
                <span>{language === 'te' ? 'API కీని ఎలా కాన్ఫిగర్ చేయాలి:' : 'How to Connect Your Gemini API Key:'}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'te'
                  ? 'మీ ప్రాజెక్ట్ ఫోల్డర్‌లోని backend/.env ఫైల్‌ను తెరిచి లేదా సృష్టించి మీ Google AI Studio కీని నమోదు చేయండి:'
                  : 'Create or edit the backend/.env file on your server and enter your key from Google AI Studio:'}
              </p>
              <pre className="bg-slate-900 text-slate-200 text-xs p-3 rounded-xl font-mono overflow-x-auto">
                GEMINI_API_KEY=your_actual_gemini_api_key_here
              </pre>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {language === 'te'
                    ? 'భద్రతా గమనిక: బ్రౌజర్ ఫారమ్‌లలో ఎప్పుడూ API కీని నమోదు చేయవలసిన అవసరం లేదు.'
                    : 'Security Notice: Never enter your API key in browser forms. MediGuide AI keeps keys strictly on the server.'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Language Preference Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Globe className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-base text-slate-900">
            {language === 'te' ? 'ప్రాధాన్యత భాష' : 'Default Language Preference'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onLanguageChange('en')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              language === 'en'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">English</span>
              {language === 'en' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Standard clinical explanations in concise English.
            </p>
          </button>

          <button
            onClick={() => onLanguageChange('te')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              language === 'te'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">తెలుగు (Telugu)</span>
              {language === 'te' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              సరళమైన తెలుగు అనువాదాలు మరియు రోగికి అర్థమయ్యే వివరణలు.
            </p>
          </button>
        </div>
      </div>

      {/* Data Privacy & Processing Statement */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Lock className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-base text-slate-900">
            {language === 'te' ? 'డేటా గోప్యత & భద్రత' : 'Data Privacy & Processing'}
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>No File Storage:</strong> Uploaded PDF reports are streamed into memory buffer and parsed strictly on-the-fly. No PDF files are saved to server disk, database, or cloud buckets.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>AI Processing:</strong> When a Gemini API key is configured, extracted report text is sent to Google's Gemini API for analysis and is subject to Google's data-handling terms, including when the service later falls back to demo mode. Without a Gemini key, report text stays in this backend.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Account Data:</strong> Account names, email addresses, roles, salted password hashes, and hashed session credentials are stored in the configured SQLite database. Passwords and raw session tokens are not stored.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>No Patient Tracking:</strong> MediGuide AI does not log account identifiers or medical-record contents.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Client Session Isolation:</strong> Chat conversations are kept solely within the active browser session and can be cleared instantly at any moment.
            </p>
          </div>
        </div>
      </div>

      {/* Emergency & Disclaimer Warning */}
      <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3.5">
        <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-xs uppercase tracking-wider text-rose-900">
            {language === 'te' ? 'అత్యవసర పరిస్థితులు (Emergency Notice)' : 'Emergency Notice & Medical Disclaimer'}
          </h4>
          <p className="text-xs text-rose-900/90 leading-relaxed">
            {language === 'te'
              ? 'తీవ్రమైన ఛాతీ నొప్పి, శ్వాస ఆడకపోవడం లేదా అత్యవసర అనారోగ్య పరిస్థితులలో వెంటనే సమీప ఆసుపత్రికి వెళ్లండి లేదా అత్యవసర నంబర్ (108 / 112) కు కాల్ చేయండి. MediGuide AI అత్యవసర చికిత్స లేదా తక్షణ వైద్య సహాయాన్ని అందించదు.'
              : 'If you are experiencing severe chest pain, shortness of breath, loss of consciousness, or any medical emergency, call emergency services immediately (911 / 108 / 112) or go to the nearest emergency department. MediGuide AI does not provide emergency triage.'}
          </p>
        </div>
      </div>
    </div>
  );
};
