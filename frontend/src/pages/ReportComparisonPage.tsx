import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  Calendar,
  Layers,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ComparisonDataset, Language, ReportHistoryEntry } from '../types';
import { fetchComparisonData, fetchUserHistory } from '../services/api';

interface ReportComparisonPageProps {
  language: Language;
  token: string | null;
}

const numericValue = (value: string | number): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = value.trim();
  if (!/^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

export const ReportComparisonPage: React.FC<ReportComparisonPageProps> = ({ language, token }) => {
  const [datasets, setDatasets] = useState<Record<string, ComparisonDataset> | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>('lipid_panel');
  const [userReports, setUserReports] = useState<ReportHistoryEntry[]>([]);
  const [reportAId, setReportAId] = useState('');
  const [reportBId, setReportBId] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        if (token) {
          const history = await fetchUserHistory(token);
          if (!active) return;
          const actualReports = history.reports
            .filter((report) => report.test_results.length > 0)
            .sort((a, b) => b.analyzed_at.localeCompare(a.analyzed_at));
          setUserReports(actualReports);
          setReportAId(actualReports[1]?.id ?? actualReports[0]?.id ?? '');
          setReportBId(actualReports[0]?.id ?? '');
        } else {
          const data = await fetchComparisonData();
          if (active) setDatasets(data);
        }
      } catch (err: unknown) {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load comparison data. Please try again.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadData();
    return () => { active = false; };
  }, [token]);

  const currentDataset = datasets ? datasets[selectedKey] : null;
  const reportA = userReports.find((report) => report.id === reportAId) ?? null;
  const reportB = userReports.find((report) => report.id === reportBId) ?? null;
  const userMetrics = reportA && reportB
    ? reportA.test_results.flatMap((firstResult) => {
        const secondResult = reportB.test_results.find(
          (result) =>
            normalize(result.test_name) === normalize(firstResult.test_name) &&
            normalize(result.unit) === normalize(firstResult.unit),
        );
        if (!secondResult) return [];
        const firstValue = numericValue(firstResult.value);
        const secondValue = numericValue(secondResult.value);
        if (firstValue === null || secondValue === null) return [];
        const difference = secondValue - firstValue;
        return [{
          name: firstResult.test_name,
          first: firstValue,
          second: secondValue,
          unit: firstResult.unit,
          diff: difference,
          percent: firstValue === 0 ? null : (difference / Math.abs(firstValue)) * 100,
        }];
      })
    : [];
  const userChartData = userMetrics.map((metric) => ({
    name: metric.name,
    earlierResult: metric.first,
    laterResult: metric.second,
    unit: metric.unit,
  }));

  if (token) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <header className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2"><GitCompare className="h-6 w-6 text-indigo-600" /><h1 className="text-2xl font-extrabold text-slate-900">{language === 'te' ? 'మీ రిపోర్టుల పోలిక' : language === 'hi' ? 'अपनी रिपोर्ट की तुलना करें' : 'Compare Your Reports'}</h1></div>
          <p className="mt-1 text-sm text-slate-600">{language === 'te' ? 'పేర్లు మరియు యూనిట్లు సరిపోలే సంఖ్యా పరీక్షలను మాత్రమే పోలుస్తుంది.' : language === 'hi' ? 'केवल समान नाम और इकाइयों वाले संख्यात्मक परीक्षणों की तुलना की जाती है।' : 'Only numeric tests with matching names and units are compared. No clinical conclusion is inferred.'}</p>
        </header>
        {loading && <p role="status" className="text-sm text-slate-500">{language === 'hi' ? 'रिपोर्ट लोड हो रही हैं…' : 'Loading your reports…'}</p>}
        {loadError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{loadError}</p>}
        {!loading && userReports.length < 2 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">{language === 'te' ? 'పోల్చడానికి కనీసం రెండు అప్‌లోడ్ చేసిన రిపోర్టులను విశ్లేషించి సేవ్ చేయండి.' : language === 'hi' ? 'तुलना करने के लिए कम से कम दो अपलोड की गई रिपोर्ट का विश्लेषण और सहेजें।' : 'Analyze and save at least two uploaded reports to compare your results.'}</p>}
        {userReports.length >= 2 && (
          <>
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">{language === 'hi' ? 'पहली रिपोर्ट' : 'Earlier report'}
                <select value={reportAId} onChange={(event) => setReportAId(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-sm font-normal">
                  {userReports.map((report) => <option key={report.id} value={report.id}>{report.filename} · {new Date(report.analyzed_at).toLocaleDateString()}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">{language === 'hi' ? 'दूसरी रिपोर्ट' : 'Later report'}
                <select value={reportBId} onChange={(event) => setReportBId(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-sm font-normal">
                  {userReports.map((report) => <option key={report.id} value={report.id}>{report.filename} · {new Date(report.analyzed_at).toLocaleDateString()}</option>)}
                </select>
              </label>
            </div>
            {reportAId === reportBId ? <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{language === 'hi' ? 'तुलना के लिए दो अलग-अलग रिपोर्ट चुनें।' : 'Choose two different reports to compare.'}</p> : userMetrics.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">{language === 'hi' ? 'दोनों रिपोर्ट में समान नाम और इकाइयों वाले संख्यात्मक परिणाम नहीं मिले।' : 'No compatible numeric tests with matching names and units were found in both reports.'}</p> : (
              <>
                <div className="h-72 rounded-2xl border border-slate-200 bg-white p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="earlierResult" name={reportA?.filename ?? 'Earlier report'} fill="#6366f1" /><Bar dataKey="laterResult" name={reportB?.filename ?? 'Later report'} fill="#10b981" /></BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-3">Test</th><th className="p-3">{reportA?.filename}</th><th className="p-3">{reportB?.filename}</th><th className="p-3">{language === 'hi' ? 'परिवर्तन' : 'Change'}</th></tr></thead>
                    <tbody>{userMetrics.map((metric) => <tr key={`${metric.name}-${metric.unit}`} className="border-t border-slate-100"><td className="p-3 font-semibold">{metric.name} <span className="font-normal text-slate-500">({metric.unit})</span></td><td className="p-3">{metric.first}</td><td className="p-3">{metric.second}</td><td className="p-3">{metric.diff > 0 ? '+' : ''}{metric.diff.toFixed(2)} {metric.unit}{metric.percent === null ? '' : ` (${metric.percent > 0 ? '+' : ''}${metric.percent.toFixed(1)}%)`}</td></tr>)}</tbody>
                  </table>
                </div>
                <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{language === 'te' ? 'మార్పులు స్వయంగా రోగ నిర్ధారణ కాదు. ఫలితాలను వైద్య నిపుణుడితో చర్చించండి.' : language === 'hi' ? 'परिवर्तन अपने आप में निदान नहीं हैं। परिणामों पर स्वास्थ्य पेशेवर से चर्चा करें।' : 'Changes alone are not a diagnosis. Discuss these results with a qualified healthcare professional.'}</p>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // Prepare chart data format for Recharts
  const chartData = currentDataset
    ? currentDataset.metrics.map((m) => ({
        name: m.test_name,
        [currentDataset.report_a.label]: m.val_a,
        [currentDataset.report_b.label]: m.val_b,
        unit: m.unit,
      }))
    : [];

  const getDiffBadge = (diff: number, percentDiff: number) => {
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          <Minus className="w-3 h-3" />
          No change
        </span>
      );
    }

    const isPositive = diff > 0;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          isPositive
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-violet-50 text-violet-700 border border-violet-200'
        }`}
      >
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>
          {isPositive ? `+${diff}` : `${diff}`} ({isPositive ? `+${percentDiff}%` : `${percentDiff}%`})
        </span>
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {language === 'te' ? 'రిపోర్ట్ పోలిక (మార్పుల విశ్లేషణ)' : 'Longitudinal Report Comparison'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'te'
              ? 'మునుపటి మరియు ప్రస్తుత ల్యాబ్ పరీక్షల మధ్య మార్పులు, యూనిట్లు మరియు పోలికల చార్టులు.'
              : 'Compare biomarkers across time intervals with unit verification and Recharts data visualization.'}
          </p>
        </div>

        {/* Fictional Sample Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 self-start sm:self-auto">
          <Layers className="w-3.5 h-3.5" />
          <span>Fictional Demonstration Data</span>
        </div>
      </div>

      {loading && <p role="status" className="text-sm text-slate-500">Loading comparison data...</p>}
      {loadError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {loadError}
        </p>
      )}

      {/* Dataset Selection Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setSelectedKey('lipid_panel')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            selectedKey === 'lipid_panel'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {language === 'te' ? 'లిపిడ్ ప్రొఫైల్ పోలిక (6 నెలలు)' : 'Lipid Profile (6-Month Trend)'}
        </button>
        <button
          onClick={() => setSelectedKey('cbc_panel')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            selectedKey === 'cbc_panel'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {language === 'te' ? 'రక్త గణన (CBC 3 నెలలు)' : 'Complete Blood Count (3-Month)'}
        </button>
        <button
          onClick={() => setSelectedKey('glucose_hba1c')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            selectedKey === 'glucose_hba1c'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {language === 'te' ? 'గ్లూకోజ్ & HbA1c మార్పులు' : 'Glycemic Fasting & HbA1c'}
        </button>
      </div>

      {/* Dataset Details & Recharts Visualization */}
      {currentDataset && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{currentDataset.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentDataset.description}</p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{currentDataset.report_a.label}</span>
                </div>
                <span className="text-slate-400 font-bold">vs</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-800 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{currentDataset.report_b.label}</span>
                </div>
              </div>
            </div>

            {/* Recharts Bar Chart Container */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Biomarker Comparison Visualization
                </span>
                <span className="text-[11px] text-slate-400">Values grouped by analyte</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar
                      dataKey={currentDataset.report_a.label}
                      fill="#6366F1"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey={currentDataset.report_b.label}
                      fill="#A855F7"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Side-by-Side Metrics Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2">
              <h3 className="font-bold text-base text-slate-900">
                {language === 'te'
                  ? 'సరిపోలిన పరీక్షలు & సంఖ్యా మార్పుల వివరాలు'
                  : 'Matching Test Values, Standard Units & Measured Deltas'}
              </h3>
              <span className="text-xs text-slate-400 italic">
                *Delta calculated only when units match
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Biomarker</th>
                    <th className="py-3 px-4">{currentDataset.report_a.label}</th>
                    <th className="py-3 px-4">{currentDataset.report_b.label}</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Reference Range</th>
                    <th className="py-3 px-4">Observed Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentDataset.metrics.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.test_name}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-700">
                        {item.val_a}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-violet-700">
                        {item.val_b}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                        {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                        {item.ref_range}
                      </td>
                      <td className="py-3.5 px-4">
                        {getDiffBadge(item.diff, item.percent_diff)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strict Clinical Context Alert */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                {language === 'te'
                  ? 'వైద్యపరమైన సందర్భం లేకుండా మార్పులను వర్గీకరించరాదు'
                  : 'Clinical Safety Guideline on Interpreting Trends'}
              </h4>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                {currentDataset.clinical_caveat}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
