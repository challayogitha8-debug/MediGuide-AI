import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  Search,
  ExternalLink,
  CheckCircle2,
  Info,
  Building,
} from 'lucide-react';
import { Language, TrustedSource } from '../types';
import { fetchSources } from '../services/api';

interface SourcesPageProps {
  language: Language;
}

export const SourcesPage: React.FC<SourcesPageProps> = ({ language }) => {
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSources();
        setSources(data);
      } catch (error: unknown) {
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load sources. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = ['All', 'Lab Tests & Diagnostics', 'Cardiovascular Health', 'Hematology & Blood', 'Global Public Health', 'Nutrition & Regional Health'];

  const filteredSources = sources.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Clear RAG Disclaimer Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {language === 'te' ? 'విశ్వసనీయ ఆరోగ్య సమాచార వనరులు' : 'Trusted Health Information Sources'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'te'
              ? 'ప్రపంచ ఆరోగ్య సంస్థ (WHO), MedlinePlus, మరియు CDC అందించే అధీకృత ఆరోగ్య వనరులు.'
              : 'Direct links to authoritative public-health libraries, clinical reference intervals, and medical encyclopedias.'}
          </p>
        </div>

        {/* Clear Informational Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Curated Informational Resources</span>
        </div>
      </div>

      {/* Explicit RAG / Citation Label Note */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {language === 'te' ? (
            <>
              <strong>సమాచార స్పష్టత:</strong> ఈ విభాగంలో జాబితా చేయబడిన సంస్థలు పబ్లిక్ హెల్త్ ప్రమాణాలు మరియు వైద్య పరీక్షల సమాచారం కోసం రిఫరెన్స్‌గా అందించబడ్డాయి. AI సమాధానాలు ప్రత్యక్ష RAG రిట్రీవల్ ద్వారా రూపొందించబడినవని మేము పేర్కొనడం లేదు. పరిశోధన కోసం క్రింది అధికారిక వెబ్‌సైట్‌లను సందర్శించండి.
            </>
          ) : (
            <>
              <strong>Transparency Note:</strong> The references below are curated public health repositories. MediGuide AI provides these as informational educational resources rather than claiming that individual generative answers are verified via live retrieval-augmented generation (RAG). Always cross-reference directly with official portals.
            </>
          )}
        </p>
      </div>

      {/* Search Bar & Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'te'
                ? 'వనరులు లేదా అంశాల కోసం వెతకండి (ఉదా: MedlinePlus, కొలెస్ట్రాల్, రక్త పరీక్షలు)...'
                : 'Search references (e.g., MedlinePlus, Blood Tests, WHO, Cholesterol)...'
            }
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading && <p role="status" className="text-sm text-slate-500">Loading trusted sources...</p>}
      {loadError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {loadError}
        </p>
      )}
      {!loading && !loadError && filteredSources.length === 0 && (
        <p className="text-sm text-slate-500">No sources match your search.</p>
      )}

      {!loading && !loadError && filteredSources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSources.map((source) => (
            <div
              key={source.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                    {source.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {source.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900">{source.title}</h3>
                  <p className="text-xs font-medium text-indigo-600 flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3" />
                    <span>{source.organization}</span>
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {source.description}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span>Visit Official Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
