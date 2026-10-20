import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Printer,
  Sparkles,
  Layers,
  RefreshCw,
  Info,
  Calendar,
  User,
  Activity,
  FileSearch,
} from 'lucide-react';
import { AnalyzeReportResponse, Language, TestStatus } from '../types';
import { analyzeReport } from '../services/api';

interface ReportAnalyzerPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  initialSampleId?: string | null;
  onClearInitialSampleId?: () => void;
}

export const ReportAnalyzerPage: React.FC<ReportAnalyzerPageProps> = ({
  language,
  onLanguageChange,
  initialSampleId,
  onClearInitialSampleId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportData, setReportData] = useState<AnalyzeReportResponse | null>(null);
  const [showRawText, setShowRawText] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    setErrorMsg(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg(
        language === 'te'
          ? 'దయచేసి సరైన PDF ఫైల్‌ను మాత్రమే అప్‌లోడ్ చేయండి.'
          : 'Please upload a valid PDF file (.pdf).'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(
        language === 'te'
          ? 'ఫైల్ సైజు 10MB కంటే తక్కువగా ఉండాలి.'
          : 'File size exceeds 10 MB limit. Please upload a smaller file.'
      );
      return;
    }

    setSelectedFile(file);
    executeAnalysis({ file });
  };

  const executeAnalysis = useCallback(async (params: { file?: File; sampleId?: string }) => {
    setLoading(true);
    setErrorMsg(null);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
    }, 150);

    try {
      const response = await analyzeReport({
        file: params.file,
        sampleId: params.sampleId,
        language,
      });
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setReportData(response);
        setLoading(false);
      }, 250);
    } catch (err: any) {
      clearInterval(interval);
      setLoading(false);
      setErrorMsg(err.message || 'An error occurred while processing the report.');
    }
  }, [language]);

  const handleLoadSample = useCallback((sampleId: string) => {
    setErrorMsg(null);
    setSelectedFile(null);
    executeAnalysis({ sampleId });
  }, [executeAnalysis]);

  useEffect(() => {
    if (!initialSampleId) return;
    handleLoadSample(initialSampleId);
    onClearInitialSampleId?.();
  }, [initialSampleId, handleLoadSample, onClearInitialSampleId]);

  const handleCopyRawText = () => {
    if (reportData?.extracted_text_preview) {
      navigator.clipboard.writeText(reportData.extracted_text_preview);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'normal':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {language === 'te' ? 'సాధారణం' : 'NORMAL'}
          </span>
        );
      case 'high':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            {language === 'te' ? 'అధికం' : 'HIGH'}
          </span>
        );
      case 'low':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {language === 'te' ? 'తక్కువ' : 'LOW'}
          </span>
        );
      case 'borderline':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {language === 'te' ? 'సరిహద్దు' : 'BORDERLINE'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600">
            {language === 'te' ? 'సూచిక' : 'MEASURED'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Language Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>{language === 'te' ? 'మెడికల్ రిపోర్ట్ ఎనలైజర్' : 'Medical Report Analyzer'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'te'
              ? 'ల్యాబ్ PDF రిపోర్టును అప్‌లోడ్ చేయండి లేదా నమూనా ద్వారా ఫలితాల వివరణను పొందండి.'
              : 'Upload laboratory diagnostic PDFs to extract test values, units, and clear educational explanations.'}
          </p>
        </div>

        {/* Action Controls: Language Toggle & Print */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                language === 'en' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('te')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                language === 'te' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              తెలుగు
            </button>
          </div>

          {reportData && (
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
              title="Print Summary"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Upload Zone & Quick Sample Loaders */}
      <div className="space-y-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-violet-50/20 rounded-3xl p-8 text-center cursor-pointer transition-all shadow-xs group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 flex items-center justify-center mx-auto transition-transform shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <p className="font-bold text-slate-800 text-sm sm:text-base">
                {language === 'te'
                  ? 'మీ ల్యాబ్ PDF రిపోర్టును ఇక్కడ డ్రాగ్ చేయండి లేదా ఎంచుకోండి'
                  : 'Drop your medical lab PDF here, or click to browse'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'te'
                  ? 'డిజిటల్ టెక్స్ట్ ఉన్న PDF ఫైళ్లు మాత్రమే (గరిష్టంగా 10 MB)'
                  : 'Standard diagnostic PDF files with digital text layer (Max 10 MB)'}
              </p>
            </div>

            {selectedFile && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                <FileText className="w-3.5 h-3.5" />
                <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>
        </div>

        {/* 1-Click Interactive Sample Reports bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium px-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>{language === 'te' ? 'లేదా నమూనా రిపోర్ట్ ఎంచుకోండి:' : 'Or test with fictional sample reports:'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleLoadSample('cbc')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-700 font-semibold text-xs transition-colors shadow-xs"
            >
              {language === 'te' ? 'రక్త గణన (CBC)' : 'Complete Blood Count (CBC)'}
            </button>
            <button
              onClick={() => handleLoadSample('lipid')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-700 font-semibold text-xs transition-colors shadow-xs"
            >
              {language === 'te' ? 'లిపిడ్ ప్రొఫైల్ (కొలెస్ట్రాల్)' : 'Lipid Profile'}
            </button>
            <button
              onClick={() => handleLoadSample('metabolic')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-700 font-semibold text-xs transition-colors shadow-xs"
            >
              {language === 'te' ? 'కిడ్నీ & మెటబాలిక్' : 'Kidney & Metabolic'}
            </button>
          </div>
        </div>

        {/* Loading Progress State */}
        {loading && (
          <div className="p-6 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-3 animate-pulse">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-700">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {language === 'te'
                  ? 'PDF నుండి టెక్స్ట్ వేరుచేసి AI ద్వారా విశ్లేషిస్తున్నాము...'
                  : 'Extracting text layer with pypdf & parsing lab metrics...'}
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                {language === 'te' ? 'విశ్లేషణలో లోపం జరిగింది' : 'Analysis Notice'}
              </p>
              <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Result Presentation */}
      {reportData && (
        <div className="space-y-6 animate-fadeIn">
          {/* Mode Badge & Report Overview Meta */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-slate-900">
                    {reportData.report_type}
                  </span>
                  {reportData.mode === 'ai' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-800">
                      <Sparkles className="w-3 h-3 text-violet-600" />
                      Gemini AI Analysis
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      <Layers className="w-3 h-3 text-amber-600" />
                      Demo Mode Interpretation
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Source File: {reportData.filename}</span>
                </p>
              </div>

              {/* Patient Meta Tags */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  {reportData.patient_info?.name || 'Patient'} (
                  {reportData.patient_info?.gender || 'N/A'},{' '}
                  {reportData.patient_info?.age_range || 'N/A'})
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {reportData.patient_info?.date || 'Recent'}
                </span>
              </div>
            </div>

            {/* Scanned PDF Alert if Detected */}
            {reportData.is_scanned_pdf && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-sm">
                    {language === 'te'
                      ? 'స్కాన్ చేసిన ఇమేజ్ PDF గుర్తించబడింది'
                      : 'Image-Only / Scanned Document Detected'}
                  </p>
                  <p>
                    {language === 'te'
                      ? 'ఈ PDF పత్రంలో డిజిటల్ టెక్స్ట్ లేయర్ కనుగొనబడలేదు. తప్పుడు విలువలు లేదా ఊహించని అంచనాలను నివారించడానికి MediGuide AI డిజిటల్ టెక్స్ట్ ఉన్న నివేదికలను మాత్రమే విశ్లేషిస్తుంది. మీ ల్యాబ్ నుండి డిజిటల్ కాపీని డౌన్‌లోడ్ చేసి అప్‌లోడ్ చేయండి లేదా మా నమూనా నివేదికలను ప్రయత్నించండి.'
                      : 'No readable digital text layer was extracted from this PDF. To prevent hallucinating laboratory numbers, MediGuide AI strictly parses genuine digital text streams. Please obtain an electronic PDF from your diagnostic provider, or try one of our interactive clinical samples above.'}
                  </p>
                </div>
              </div>
            )}

            {/* Extracted Raw Text Drawer */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowRawText(!showRawText)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-slate-500" />
                  <span>
                    {language === 'te' ? 'వేరుచేసిన టెక్స్ట్ పరిశీలించండి' : 'Preview Extracted PDF Text'}{' '}
                    ({reportData.raw_text_length} characters)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    {showRawText ? 'Hide' : 'Show preview'}
                  </span>
                  {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showRawText && (
                <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-b-2xl relative max-h-64 overflow-y-auto">
                  <button
                    onClick={handleCopyRawText}
                    className="absolute top-3 right-3 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedText ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <pre className="whitespace-pre-wrap leading-relaxed pr-16">
                    {reportData.extracted_text_preview}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Structured Lab Results Table */}
          {reportData.test_results && reportData.test_results.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      Step 1 • Extracted Clinical Data
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    {language === 'te'
                      ? 'ల్యాబ్ ఫలితాల వివరాలు (నివేదిక నుండి సేకరించినవి)'
                      : 'Extracted Laboratory Biomarkers & Reference Ranges'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 italic">
                  {language === 'te'
                    ? '*ల్యాబ్ పత్రంలో ఉన్న విలువలు మాత్రమే'
                    : '*Values extracted verbatim from PDF document'}
                </p>
              </div>

              {/* Responsive Biomarkers Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">
                        {language === 'te' ? 'పరీక్ష పేరు' : 'Test Parameter'}
                      </th>
                      <th className="py-3 px-4">
                        {language === 'te' ? 'ఫలితం' : 'Observed Value'}
                      </th>
                      <th className="py-3 px-4">
                        {language === 'te' ? 'పరిమాణం (Unit)' : 'Unit'}
                      </th>
                      <th className="py-3 px-4">
                        {language === 'te' ? 'సాధారణ పరిమితి' : 'Reference Range'}
                      </th>
                      <th className="py-3 px-4">
                        {language === 'te' ? 'స్థితి' : 'Status'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.test_results.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {item.test_name}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {String(item.value)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                            {item.unit || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                            {item.reference_range || '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            {getStatusBadge(item.status)}
                          </td>
                        </tr>
                        {/* Plain language explanation sub-row */}
                        <tr className="bg-slate-50/40">
                          <td colSpan={5} className="px-4 py-2 text-xs text-slate-600 border-b border-slate-100">
                            <span className="font-semibold text-indigo-700">
                              {language === 'te' ? 'వివరణ: ' : 'Plain Language: '}
                            </span>
                            {language === 'te' && item.description_te
                              ? item.description_te
                              : item.description}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 2: AI Educational Summary & Key Takeaways */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/50 via-violet-50/30 to-white border border-indigo-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100/70">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full">
                  Step 2 • AI Educational Insights
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  {language === 'te' ? 'సారాంశం & అవగాహన పరిశీలనలు' : 'Educational Summary & Clinical Takeaways'}
                </h3>
              </div>
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>

            {/* Overview paragraph */}
            <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">
                {language === 'te' ? 'సాధారణ అవలోకనం' : 'Clinical Overview'}
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                {language === 'te'
                  ? reportData.summary.overview_te || reportData.summary.overview_en
                  : reportData.summary.overview_en}
              </p>
            </div>

            {/* Key Takeaways & Questions side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Takeaways Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-800">
                    {language === 'te' ? 'ముఖ్యమైన పరిశీలనలు' : 'Key Observations'}
                  </h4>
                </div>
                <ul className="space-y-2 text-xs text-slate-600">
                  {(language === 'te' && reportData.summary.key_takeaways_te?.length
                    ? reportData.summary.key_takeaways_te
                    : reportData.summary.key_takeaways_en
                  ).map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Questions for Doctor Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-800">
                    {language === 'te' ? 'వైద్యుడిని అడగవలసిన ప్రశ్నలు' : 'Questions to Ask Your Doctor'}
                  </h4>
                </div>
                <ul className="space-y-2 text-xs text-slate-600">
                  {(language === 'te' && reportData.summary.questions_for_doctor_te?.length
                    ? reportData.summary.questions_for_doctor_te
                    : reportData.summary.questions_for_doctor_en
                  ).map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Disclaimer in report */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {reportData.summary.disclaimer ||
                  'This information is for educational purposes only. Always consult a healthcare professional.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
