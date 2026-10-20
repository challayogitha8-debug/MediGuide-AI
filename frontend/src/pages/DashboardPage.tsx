import React from 'react';
import {
  FileText,
  MessageSquareText,
  GitCompare,
  BookOpenCheck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Activity,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { HealthStatus, Language, NavigationTab, UserProfile } from '../types';
import { DoctorHeroIllustration } from '../components/illustrations/DoctorHeroIllustration';

interface DashboardPageProps {
  language: Language;
  onNavigate: (tab: NavigationTab, sampleId?: string) => void;
  health: HealthStatus | null;
  currentUser?: UserProfile | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  language,
  onNavigate,
  currentUser,
}) => {
  const quickActions = [
    {
      id: 'analyzer' as NavigationTab,
      title_en: 'Medical Report Analyzer',
      title_te: 'మెడికల్ రిపోర్ట్ ఎనలైజర్',
      desc_en: 'Upload diagnostic lab PDFs or explore pre-loaded clinical samples with bilingual explanations.',
      desc_te: 'ల్యాబ్ PDF రిపోర్టులను అప్‌లోడ్ చేయండి లేదా నమూనా నివేదికలను తెలుగు & ఆంగ్లంలో సులభంగా అర్థం చేసుకోండి.',
      icon: FileText,
      gradient: 'from-blue-500 to-indigo-600',
      action_en: 'Analyze Report',
      action_te: 'రిపోర్ట్ విశ్లేషించండి',
    },
    {
      id: 'chat' as NavigationTab,
      title_en: 'AI Health Assistant',
      title_te: 'AI హెల్త్ అసిస్టెంట్',
      desc_en: 'Ask questions about medical terms, test ranges, and healthy habits with trusted reference links.',
      desc_te: 'వైద్య పదాలు, పరీక్షల పరిమితులు మరియు ఆరోగ్య అలవాట్లపై సందేహాలను అడగండి.',
      icon: MessageSquareText,
      gradient: 'from-violet-500 to-purple-600',
      action_en: 'Ask Questions',
      action_te: 'ప్రశ్నించండి',
    },
    {
      id: 'comparison' as NavigationTab,
      title_en: 'Report Comparison',
      title_te: 'రిపోర్ట్ పోలిక & మార్పులు',
      desc_en: 'Track changes between baseline and follow-up lab tests with interactive trend charts.',
      desc_te: 'మునుపటి మరియు ప్రస్తుత పరీక్ష ఫలితాల మధ్య మార్పులను ఇంటరాక్టివ్ గ్రాఫ్ ద్వారా పోల్చండి.',
      icon: GitCompare,
      gradient: 'from-indigo-500 to-cyan-600',
      action_en: 'Compare Reports',
      action_te: 'ఫలితాలను పోల్చండి',
    },
    {
      id: 'sources' as NavigationTab,
      title_en: 'Health Information Sources',
      title_te: 'విశ్వసనీయ సమాచార వనరులు',
      desc_en: 'Browse vetted guides from the WHO, MedlinePlus, CDC, and National Institutes of Health.',
      desc_te: 'WHO, MedlinePlus మరియు CDC అందించే అధీకృత సమాచారాన్ని పరిశీలించండి.',
      icon: BookOpenCheck,
      gradient: 'from-emerald-500 to-teal-600',
      action_en: 'Explore Sources',
      action_te: 'వనరులను చూడండి',
    },
  ];

  const sampleReports = [
    {
      id: 'cbc',
      title_en: 'Complete Blood Count (CBC)',
      title_te: 'కంప్లీట్ బ్లడ్ కౌంట్ (CBC)',
      tag: 'Hematology',
      preview_en: 'Mild microcytic anemia pattern with low Hemoglobin (10.4 g/dL) and MCV (74.2 fL). Normal WBCs.',
      preview_te: 'హిమోగ్లోబిన్ (10.4 g/dL) మరియు MCV తక్కువగా ఉన్న మైక్రోసైటిక్ రక్తహీనత సంకేతం. తెల్ల రక్త కణాలు సాధారణం.',
      badge_color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900',
    },
    {
      id: 'lipid',
      title_en: 'Comprehensive Lipid Profile',
      title_te: 'లిపిడ్ ప్రొఫైల్ (కొలెస్ట్రాల్)',
      tag: 'Cardiovascular',
      preview_en: 'Elevated LDL cholesterol (148 mg/dL) and borderline total cholesterol (228 mg/dL) with normal HDL.',
      preview_te: 'చెడు కొలెస్ట్రాల్ (LDL 148 mg/dL) అధికంగా మరియు ట్రైగ్లిజరైడ్స్ సరిహద్దు వద్ద ఉన్నాయి.',
      badge_color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
    },
    {
      id: 'metabolic',
      title_en: 'Metabolic & Kidney Panel',
      title_te: 'మెటబాలిక్ & కిడ్నీ ప్యానెల్',
      tag: 'Renal / Endocrine',
      preview_en: 'Healthy renal filtration (eGFR 94, Creatinine 0.95 mg/dL) with borderline fasting glucose (118 mg/dL).',
      preview_te: 'కిడ్నీల పనితీరు బాగుంది. పరగడుపున బ్లడ్ షుగర్ (118 mg/dL) కొద్దిగా ఎక్కువగా ఉంది.',
      badge_color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Card with Doctor Illustration on the Right */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-950 text-white p-6 sm:p-10 shadow-xl shadow-indigo-950/20">
        {/* Decorative soft glowing blobs */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Welcome Content on Left Side */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-violet-200">
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
              <span>
                {currentUser?.role === 'doctor'
                  ? 'Physician Clinical Workspace • Doctor Access'
                  : currentUser?.role === 'patient'
                  ? `Patient Health Portal • ${currentUser.name}`
                  : language === 'te'
                  ? 'తెలుగు & ఇంగ్లీష్ ద్విభాషా ఆరోగ్య సహాయకుడు'
                  : 'Bilingual English & Telugu Health Companion'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {currentUser?.role === 'doctor'
                ? `${currentUser.name} — Clinical Review Portal`
                : language === 'te'
                ? 'మీ ఆరోగ్యం, మరింత స్పష్టంగా అవగాహన.'
                : 'Your Health, Better Understood.'}
            </h1>

            <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed max-w-xl">
              {currentUser?.role === 'doctor'
                ? 'Review diagnostic panels, inspect reference ranges, and generate bilingual educational explanations. Uploaded reports are processed in memory; account details are stored separately.'
                : language === 'te'
                ? 'AI సహాయంతో మీ వైద్య నివేదికలను సులభమైన తెలుగు మరియు ఆంగ్లంలో స్పష్టంగా అర్థం చేసుకోండి.'
                : 'Understand your medical reports with AI-powered explanations in English and Telugu.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('analyzer')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-semibold text-sm hover:bg-violet-50 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>
                  {currentUser?.role === 'doctor'
                    ? 'Review Lab Report'
                    : language === 'te'
                    ? 'రిపోర్ట్ విశ్లేషించండి'
                    : 'Analyze Report'}
                </span>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </button>

              <button
                onClick={() => onNavigate('chat')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700/80 border border-white/20 text-white font-medium text-sm transition-all active:scale-95 cursor-pointer"
              >
                <MessageSquareText className="w-4 h-4 text-violet-200" />
                <span>
                  {currentUser?.role === 'doctor'
                    ? 'Clinical AI Consultation'
                    : language === 'te'
                    ? 'AI అసిస్టెంట్‌ని అడగండి'
                    : 'Ask AI Assistant'}
                </span>
              </button>
            </div>
          </div>

          {/* Professional Doctor Illustration on Right Side */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <DoctorHeroIllustration className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[420px] drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Core Privacy & Clinical Safety Highlights Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {language === 'te' ? '100% మెమరీ ప్రాసెసింగ్' : 'In-Memory Report Processing'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'te'
                ? 'రిపోర్టులు సర్వర్‌లో నిల్వ చేయబడవు, విశ్లేషణ వెంటనే తొలగించబడుతుంది.'
                : 'Uploaded PDFs are parsed in memory and are not retained. Account details are stored separately.'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {language === 'te' ? 'స్పష్టమైన తెలుగు వివరణ' : 'Dual Language Support'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'te'
                ? 'ప్రతి పరీక్ష ఫలితం సులభమైన తెలుగు మరియు ఆంగ్లంలో అందుబాటులో ఉంది.'
                : 'Full bilingual translations in English and Telugu (తెలుగు).'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {language === 'te' ? 'విశ్వసనీయ ల్యాబ్ గణన' : 'Non-Hallucinatory Data'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'te'
                ? 'తప్పుడు సమాచారాన్ని నివారించడానికి పత్రంలో ఉన్న విలువలు మాత్రమే ప్రదర్శిస్తాము.'
                : 'Strict verification of observed numbers from actual report text.'}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {language === 'te' ? 'త్వరిత ఫీచర్లు' : 'Explore Capabilities'}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'te' ? 'సహాయక విభాగాలు' : 'Educational Tools'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                onClick={() => onNavigate(action.id)}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${action.gradient} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {language === 'te' ? action.title_te : action.title_en}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {language === 'te' ? action.desc_te : action.desc_en}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  <span>{language === 'te' ? action.action_te : action.action_en}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Sample Reports Section */}
      <section className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'te' ? 'నమూనా ల్యాబ్ నివేదికలు (తక్షణ పరీక్ష)' : 'Interactive Clinical Sample Reports'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'te'
                ? 'పిడిఎఫ్ ఫైల్ లేకపోయినా 1-క్లిక్‌తో క్రింది నమూనా రిపోర్టుల విశ్లేషణను ప్రత్యక్షంగా చూడవచ్చు.'
                : 'Test the analyzer instantly with verified fictional clinical laboratory datasets.'}
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 self-start sm:self-auto">
            1-Click Interactive Demo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleReports.map((report) => (
            <div
              key={report.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${report.badge_color}`}
                  >
                    {report.tag}
                  </span>
                  <span className="text-[11px] text-slate-400">Sample Lab</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {language === 'te' ? report.title_te : report.title_en}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                  {language === 'te' ? report.preview_te : report.preview_en}
                </p>
              </div>

              <button
                onClick={() => onNavigate('analyzer', report.id)}
                className="mt-4 w-full py-2 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{language === 'te' ? 'ఈ రిపోర్ట్ చూడండి' : 'Open in Analyzer'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Safety & Medical Ethics Card */}
      <section className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-4">
        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
            {language === 'te' ? 'వైద్యపరమైన బాధ్యతాయుత సూచన' : 'Responsible AI & Clinical Safety Protocol'}
          </h4>
          <p className="text-xs text-amber-900/90 dark:text-amber-300/80 leading-relaxed">
            {language === 'te'
              ? 'ల్యాబ్ ఫలితాలు వ్యక్తి యొక్క వయస్సు, లింగం, అనారోగ్య చరిత్ర మరియు ఇతర పరీక్షలతో కలిపి మాత్రమే అర్థం చేసుకోవాలి. MediGuide AI ఎటువంటి మందులు లేదా చికిత్సలను సూచించదు. ఏదైనా ఆరోగ్య సమస్య ఉంటే వెంటనే వైద్యుడిని సంప్రదించండి.'
              : 'Medical laboratory values should never be evaluated in isolation. Physiological variations, medications, and clinical history play key roles. MediGuide AI strictly provides educational summaries to facilitate better communication between patients and their physicians.'}
          </p>
        </div>
      </section>
    </div>
  );
};
