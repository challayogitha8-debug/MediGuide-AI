import React, { useEffect, useState } from 'react';
import { AlertCircle, FileText, MessageSquareText, Trash2 } from 'lucide-react';
import { ChatHistoryEntry, Language, ReportHistoryEntry } from '../types';
import { deleteHistoryRecord, fetchUserHistory } from '../services/api';

interface HistoryPageProps {
  language: Language;
  token: string | null;
  onContinueChat: (question: string) => void;
}

const text = (language: Language, en: string, te: string, hi: string) =>
  language === 'te' ? te : language === 'hi' ? hi : en;

export const HistoryPage: React.FC<HistoryPageProps> = ({ language, token, onContinueChat }) => {
  const [reports, setReports] = useState<ReportHistoryEntry[] | null>(null);
  const [chats, setChats] = useState<ChatHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void fetchUserHistory(token)
      .then((history) => {
        if (!active) return;
        setReports(history.reports);
        setChats(history.chats);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setReports([]);
        setChats([]);
        setError(requestError instanceof Error ? requestError.message : 'Could not load history.');
      });
    return () => {
      active = false;
    };
  }, [token]);

  const matches = (date: string, searchable: string) => {
    const day = date.slice(0, 10);
    return (
      searchable.toLowerCase().includes(query.trim().toLowerCase()) &&
      (!startDate || day >= startDate) &&
      (!endDate || day <= endDate)
    );
  };
  const visibleReports = (reports ?? []).filter((report) => matches(report.analyzed_at, `${report.filename} ${report.report_type}`));
  const visibleChats = (chats ?? []).filter((chat) => matches(chat.created_at, `${chat.question} ${chat.reply}`));
  const loading = reports === null || chats === null;

  const remove = async (kind: 'reports' | 'chats', id: string) => {
    if (!token || !window.confirm(text(language, 'Delete this history item? This cannot be undone.', 'ఈ చరిత్ర అంశాన్ని తొలగించాలా? తిరిగి పొందలేరు.', 'क्या यह इतिहास प्रविष्टि हटाएँ? इसे वापस नहीं किया जा सकता।'))) return;
    setError(null);
    try {
      await deleteHistoryRecord(token, kind, id);
      if (kind === 'reports') setReports((items) => (items ?? []).filter((item) => item.id !== id));
      else setChats((items) => (items ?? []).filter((item) => item.id !== id));
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Could not delete history item.');
    }
  };

  if (!token) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900">{text(language, 'Sign in to view your private history.', 'మీ వ్యక్తిగత చరిత్రను చూడటానికి సైన్ ఇన్ చేయండి.', 'अपना निजी इतिहास देखने के लिए साइन इन करें।')}</p>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-900">{text(language, 'Your History', 'మీ చరిత్ర', 'आपका इतिहास')}</h1>
        <p className="mt-1 text-sm text-slate-600">{text(language, 'Private to your account. Original uploaded PDFs are not retained; reports here contain analysis details only.', 'మీ ఖాతాకు మాత్రమే కనిపిస్తుంది. అసలు PDFలు నిల్వ చేయబడవు; ఇక్కడ నివేదిక విశ్లేషణ వివరాలు మాత్రమే ఉంటాయి.', 'यह केवल आपके खाते के लिए है। अपलोड की गई मूल PDF सहेजी नहीं जाती; यहाँ केवल विश्लेषण विवरण हैं।')}</p>
      </header>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-3">
        <label className="sm:col-span-1">
          <span className="mb-1 block text-xs font-semibold">{text(language, 'Search', 'శోధన', 'खोजें')}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold">{text(language, 'From', 'నుండి', 'से')}</span>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold">{text(language, 'To', 'వరకు', 'तक')}</span>
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
      </div>

      {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4" />{error}</p>}
      {loading && <p role="status" className="text-sm text-slate-500">{text(language, 'Loading your history…', 'మీ చరిత్రను లోడ్ చేస్తోంది…', 'आपका इतिहास लोड हो रहा है…')}</p>}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><FileText className="h-5 w-5 text-indigo-600" />{text(language, 'Report history', 'రిపోర్ట్ చరిత్ర', 'रिपोर्ट इतिहास')}</h2>
        {visibleReports.length === 0 && !loading && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">{text(language, 'No saved report analyses match your filters.', 'మీ ఫిల్టర్‌లకు సరిపడే సేవ్ చేసిన రిపోర్ట్ విశ్లేషణలు లేవు.', 'आपके फ़िल्टर से मेल खाने वाला कोई रिपोर्ट विश्लेषण नहीं है।')}</p>}
        {visibleReports.map((report) => (
          <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <button onClick={() => setOpen(open === report.id ? null : report.id)} className="text-left">
                <h3 className="font-semibold text-slate-900">{report.filename}</h3>
                <p className="mt-1 text-xs text-slate-500">{report.report_type} · {new Date(report.analyzed_at).toLocaleString()}</p>
              </button>
              <button type="button" onClick={() => void remove('reports', report.id)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700" aria-label={text(language, 'Delete report history', 'రిపోర్ట్ చరిత్రను తొలగించండి', 'रिपोर्ट इतिहास हटाएँ')}><Trash2 className="h-4 w-4" /></button>
            </div>
            {open === report.id && (
              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                <p className="text-sm text-slate-700">{report.summary.overview_en}</p>
                {report.test_results.length > 0 && (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {report.test_results.map((result, index) => <li key={`${result.test_name}-${index}`} className="rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800"><strong>{result.test_name}:</strong> {String(result.value)} {result.unit}</li>)}
                  </ul>
                )}
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><MessageSquareText className="h-5 w-5 text-violet-600" />{text(language, 'AI assistant conversations', 'AI అసిస్టెంట్ సంభాషణలు', 'AI सहायक बातचीत')}</h2>
        {visibleChats.length === 0 && !loading && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">{text(language, 'No saved conversations match your filters.', 'మీ ఫిల్టర్‌లకు సరిపడే సంభాషణలు లేవు.', 'आपके फ़िल्टर से मेल खाने वाली बातचीत नहीं है।')}</p>}
        {visibleChats.map((chat) => (
          <article key={chat.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => setOpen(open === chat.id ? null : chat.id)} className="min-w-0 flex-1 text-left">
                <h3 className="truncate font-semibold text-slate-900">{chat.question}</h3>
                <p className="mt-1 text-xs text-slate-500">{new Date(chat.created_at).toLocaleString()}</p>
              </button>
              <button type="button" onClick={() => void remove('chats', chat.id)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700" aria-label={text(language, 'Delete conversation', 'సంభాషణను తొలగించండి', 'बातचीत हटाएँ')}><Trash2 className="h-4 w-4" /></button>
            </div>
            {open === chat.id && <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700"><p className="whitespace-pre-wrap text-sm text-slate-700">{chat.reply}</p><button type="button" onClick={() => onContinueChat(chat.question)} className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">{text(language, 'Continue in assistant', 'అసిస్టెంట్‌లో కొనసాగించండి', 'सहायक में जारी रखें')}</button></div>}
          </article>
        ))}
      </section>
    </div>
  );
};
