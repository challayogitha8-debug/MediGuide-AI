import React from 'react';

interface IllustrationProps {
  className?: string;
}

// 1. Medical Report Upload Illustration
export const ReportUploadIllustration: React.FC<IllustrationProps> = ({ className = 'w-24 h-24 mx-auto' }) => {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Medical laboratory report document with stethoscope"
    >
      <defs>
        <linearGradient id="sheetGrad" x1="30" y1="15" x2="90" y2="105" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F1F5F9" />
        </linearGradient>
        <linearGradient id="badgeGrad" x1="60" y1="65" x2="95" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
      </defs>

      {/* Soft Background Circle */}
      <circle cx="60" cy="60" r="50" fill="#EEF2FF" />

      {/* Medical Document Sheet */}
      <rect x="30" y="20" width="60" height="78" rx="8" fill="url(#sheetGrad)" stroke="#CBD5E1" strokeWidth="2" />
      {/* Document Fold Corner */}
      <path d="M72 20V34H88" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="2" strokeLinejoin="round" />

      {/* Header bar */}
      <rect x="40" y="32" width="26" height="5" rx="2.5" fill="#4F46E5" />

      {/* Content lines representing lab metrics */}
      <rect x="40" y="44" width="40" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="40" y="52" width="34" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="40" y="60" width="38" height="3" rx="1.5" fill="#94A3B8" />

      {/* Mini test status ticks */}
      <circle cx="43" cy="72" r="3" fill="#10B981" />
      <rect x="50" y="70.5" width="22" height="3" rx="1.5" fill="#64748B" />

      <circle cx="43" cy="81" r="3" fill="#F59E0B" />
      <rect x="50" y="79.5" width="26" height="3" rx="1.5" fill="#64748B" />

      {/* Stethoscope Wrap */}
      <path
        d="M22 45C17 62 20 85 36 92C46 96 56 94 62 86"
        stroke="#6366F1"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="22" cy="45" r="4.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />

      {/* Floating Upload Arrow Badge */}
      <g transform="translate(68, 68)">
        <circle cx="18" cy="18" r="18" fill="url(#badgeGrad)" />
        <path
          d="M18 24V12M18 12L13 17M18 12L23 17"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

// 2. Animated / Active Scanning Illustration for Report Analysis
export const ReportScannerAnimation: React.FC<IllustrationProps> = ({ className = 'w-16 h-16' }) => {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Medical document scan in progress"
    >
      <rect x="18" y="12" width="44" height="56" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
      <rect x="25" y="22" width="30" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="25" y="30" width="24" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="25" y="38" width="28" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="25" y="46" width="20" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="25" y="54" width="26" height="3" rx="1.5" fill="#94A3B8" />

      {/* Glowing scanning laser line */}
      <line x1="12" y1="36" x2="68" y2="36" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" className="animate-pulse" />
      <circle cx="40" cy="36" r="4" fill="#38BDF8" className="animate-ping" />
    </svg>
  );
};

// 3. Report Comparison Illustration
export const ReportComparisonIllustration: React.FC<IllustrationProps> = ({ className = 'w-28 h-28' }) => {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Comparing baseline and follow-up medical reports"
    >
      <defs>
        <linearGradient id="compGradA" x1="20" y1="20" x2="70" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EEF2FF" />
          <stop offset="1" stopColor="#E0E7FF" />
        </linearGradient>
        <linearGradient id="compGradB" x1="60" y1="40" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FAF5FF" />
          <stop offset="1" stopColor="#F3E8FF" />
        </linearGradient>
      </defs>

      {/* Report A (Baseline, Left Layer) */}
      <g transform="translate(15, 20) rotate(-6)">
        <rect width="52" height="70" rx="7" fill="url(#compGradA)" stroke="#6366F1" strokeWidth="1.8" />
        <rect x="8" y="10" width="24" height="4" rx="2" fill="#6366F1" />
        <rect x="8" y="20" width="34" height="3" rx="1.5" fill="#94A3B8" />
        <rect x="8" y="28" width="28" height="3" rx="1.5" fill="#94A3B8" />
        <rect x="8" y="36" width="32" height="3" rx="1.5" fill="#94A3B8" />
        <text x="8" y="55" fill="#4F46E5" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Report A</text>
      </g>

      {/* Report B (Follow-up, Right Layer) */}
      <g transform="translate(65, 32) rotate(4)">
        <rect width="54" height="72" rx="7" fill="url(#compGradB)" stroke="#A855F7" strokeWidth="1.8" />
        <rect x="8" y="10" width="26" height="4" rx="2" fill="#A855F7" />
        <rect x="8" y="20" width="36" height="3" rx="1.5" fill="#C084FC" />
        <rect x="8" y="28" width="30" height="3" rx="1.5" fill="#C084FC" />
        <rect x="8" y="36" width="34" height="3" rx="1.5" fill="#C084FC" />
        <text x="8" y="55" fill="#9333EA" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Report B</text>
      </g>

      {/* Dynamic Delta Arrow Circle in Center */}
      <g transform="translate(52, 65)">
        <circle cx="18" cy="18" r="18" fill="#10B981" />
        <circle cx="18" cy="18" r="18" stroke="#FFFFFF" strokeWidth="2.5" />
        {/* Trend line */}
        <path
          d="M11 21L16 15L20 18L25 12M25 12H21M25 12V16"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

// 4. Research Sources & Health Education Illustration
export const ResearchSourcesIllustration: React.FC<IllustrationProps> = ({ className = 'w-24 h-24' }) => {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Medical research literature and certified health encyclopedia"
    >
      <defs>
        <linearGradient id="bookGrad" x1="20" y1="30" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5F3FF" />
          <stop offset="1" stopColor="#EDE9FE" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="50" fill="#F0FDF4" />

      {/* Open Medical Textbook / Research Guide */}
      <path
        d="M20 78C35 74 55 76 60 84C65 76 85 74 100 78V36C85 32 65 34 60 42C55 34 35 32 20 36V78Z"
        fill="url(#bookGrad)"
        stroke="#4F46E5"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Book Spine Center */}
      <line x1="60" y1="42" x2="60" y2="84" stroke="#4F46E5" strokeWidth="2" />

      {/* Text Lines on Left Page */}
      <line x1="28" y1="46" x2="52" y2="46" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />
      <line x1="28" y1="54" x2="50" y2="54" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="28" y1="62" x2="48" y2="62" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />

      {/* Caduceus / Health Cross on Right Page */}
      <circle cx="80" cy="55" r="9" fill="#DCFCE7" />
      <path d="M80 50V60M75 55H85" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />

      {/* Verified Seal Ribbon */}
      <g transform="translate(48, 80)">
        <circle cx="12" cy="12" r="10" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M8 12L11 15L16 9" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};
