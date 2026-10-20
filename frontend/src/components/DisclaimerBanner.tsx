import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { Language } from '../types';

interface DisclaimerBannerProps {
  language: Language;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ language }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-800 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          {language === 'te' 
            ? 'విద్యా ప్రయోజనాల కోసం మాత్రమే • వైద్య సలహా ప్రత్యామ్నాయం కాదు' 
            : 'Educational Purpose Only • Not a substitute for professional clinical medical advice'}
        </span>
        <button
          onClick={() => setDismissed(false)}
          className="text-amber-700 underline text-xs hover:text-amber-900"
        >
          {language === 'te' ? 'పూర్తి నిరాకరణ చూడండి' : 'Show Full Disclaimer'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200/80 px-4 py-2.5 sm:px-6 transition-all">
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1 rounded-full bg-amber-100 text-amber-700 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm text-amber-900 leading-snug">
            {language === 'te' ? (
              <>
                <strong className="font-semibold">ముఖ్యమైన వైద్య నిరాకరణ:</strong> MediGuide AI కేవలం విద్యా మరియు సమాచార ప్రయోజనాల కొరకు మాత్రమే రూపొందించబడింది. ఇది ఎటువంటి వ్యాధులను నిర్ధారించదు, మందులను సూచించదు మరియు నిపుణులైన వైద్య సలహాను భర్తీ చేయదు. వ్యక్తిగత నిర్ణయాల కోసం మీ వైద్యుడిని సంప్రదించండి.
              </>
            ) : (
              <>
                <strong className="font-semibold">Important Medical Information Disclaimer:</strong> MediGuide AI is designed strictly for educational and informational purposes. It does not provide medical diagnoses, prescribe medications, or replace professional clinical care. Always consult a qualified healthcare provider for personal health concerns.
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-800 p-1 rounded-md transition-colors shrink-0"
          title="Minimize disclaimer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
