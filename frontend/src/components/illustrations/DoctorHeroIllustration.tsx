import React from 'react';

interface IllustrationProps {
  className?: string;
}

export const DoctorHeroIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-auto max-w-[420px]' }) => {
  return (
    <svg
      viewBox="0 0 480 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Friendly healthcare physician with medical tablet and vital signs"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="docBgGlow" x1="240" y1="40" x2="240" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" stopOpacity="0.35" />
          <stop offset="1" stopColor="#60A5FA" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="docCoatGrad" x1="180" y1="170" x2="300" y2="350" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="docScrubsGrad" x1="210" y1="180" x2="270" y2="280" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="tabletGrad" x1="280" y1="200" x2="380" y2="310" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E293B" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="screenGrad" x1="290" y1="210" x2="370" y2="300" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284C7" stopOpacity="0.25" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="cardioGlow" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#38BDF8" />
          <stop offset="0.5" stopColor="#34D399" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Soft Glow Circles */}
      <circle cx="240" cy="190" r="150" fill="url(#docBgGlow)" filter="url(#softGlow)" />
      <circle cx="340" cy="110" r="45" fill="#C4B5FD" fillOpacity="0.3" filter="url(#softGlow)" />
      <circle cx="130" cy="240" r="35" fill="#93C5FD" fillOpacity="0.25" filter="url(#softGlow)" />

      {/* Floating Medical Shield Badge (Top Left) */}
      <g className="transition-transform duration-500 hover:scale-105" transform="translate(70, 70)">
        <rect width="64" height="64" rx="20" fill="#FFFFFF" fillOpacity="0.9" />
        <rect width="64" height="64" rx="20" stroke="#E2E8F0" strokeWidth="1.5" />
        <path
          d="M32 18L44 23V33C44 40.5 38.9 47.5 32 50C25.1 47.5 20 40.5 20 33V23L32 18Z"
          fill="#EEF2FF"
          stroke="#4F46E5"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M32 27V39M26 33H38" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Floating Heart Vital Badge (Top Right) */}
      <g className="transition-transform duration-500 hover:scale-105" transform="translate(345, 65)">
        <rect width="68" height="64" rx="20" fill="#FFFFFF" fillOpacity="0.9" />
        <rect width="68" height="64" rx="20" stroke="#E2E8F0" strokeWidth="1.5" />
        <path
          d="M34 44C34 44 21 34.5 21 26.5C21 23 23.5 20.5 27 20.5C29.5 20.5 32 22 34 24C36 22 38.5 20.5 41 20.5C44.5 20.5 47 23 47 26.5C47 34.5 34 44 34 44Z"
          fill="#FEE2E2"
          stroke="#EF4444"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M25 32H29L32 27L36 36L39 32H43"
          stroke="#EF4444"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Doctor Body & Torso */}
      {/* Shoulders & White Lab Coat */}
      <path
        d="M165 350C165 275 190 220 240 220C290 220 315 275 315 350H165Z"
        fill="url(#docCoatGrad)"
      />
      {/* Inner Blue Scrubs Collar & Chest */}
      <path
        d="M212 210H268L256 275H224L212 210Z"
        fill="url(#docScrubsGrad)"
      />
      <path d="M224 210L240 235L256 210" stroke="#E0F2FE" strokeWidth="2" strokeLinecap="round" />

      {/* Coat Lapels */}
      <path
        d="M208 210L190 290L224 350L220 260L208 210Z"
        fill="#F8FAFC"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      <path
        d="M272 210L290 290L256 350L260 260L272 210Z"
        fill="#F8FAFC"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />

      {/* Stethoscope */}
      <path
        d="M218 205C214 235 214 265 228 280C238 290 244 285 244 275"
        stroke="#64748B"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M262 205C266 235 264 265 252 280"
        stroke="#64748B"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="244" cy="285" r="7" fill="#94A3B8" stroke="#475569" strokeWidth="2" />
      <circle cx="244" cy="285" r="3" fill="#38BDF8" />

      {/* Doctor Neck */}
      <rect x="226" y="180" width="28" height="35" rx="10" fill="#FBCFE8" />

      {/* Doctor Head */}
      <ellipse cx="240" cy="155" rx="34" ry="40" fill="#FDE047" fillOpacity="0.25" />
      <ellipse cx="240" cy="155" rx="34" ry="39" fill="#FCE7F3" />

      {/* Hair (Modern friendly haircut) */}
      <path
        d="M206 150C204 125 215 108 240 108C265 108 276 125 274 150C274 135 270 125 258 120C246 115 226 122 218 132C212 140 208 145 206 150Z"
        fill="#374151"
      />
      <path
        d="M208 142C208 116 220 110 240 110C260 110 272 116 272 142C264 128 252 120 236 122C220 124 212 134 208 142Z"
        fill="#1F2937"
      />

      {/* Friendly Eyes and Smile */}
      <ellipse cx="228" cy="152" rx="3.5" ry="4" fill="#1F2937" />
      <ellipse cx="252" cy="152" rx="3.5" ry="4" fill="#1F2937" />
      <circle cx="229.5" cy="150.5" r="1.2" fill="#FFFFFF" />
      <circle cx="253.5" cy="150.5" r="1.2" fill="#FFFFFF" />
      {/* Eyebrows */}
      <path d="M224 144C227 142 232 143 234 145" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
      <path d="M246 145C248 143 253 142 256 144" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
      {/* Friendly Smile */}
      <path d="M232 168C236 174 244 174 248 168" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
      {/* Cheeks */}
      <ellipse cx="222" cy="162" rx="4.5" ry="2.5" fill="#FDA4AF" fillOpacity="0.6" />
      <ellipse cx="258" cy="162" rx="4.5" ry="2.5" fill="#FDA4AF" fillOpacity="0.6" />

      {/* Professional Medical Tablet / Digital Chart (Right Hand) */}
      <g transform="translate(265, 205) rotate(-6)">
        {/* Tablet Frame */}
        <rect width="115" height="135" rx="14" fill="url(#tabletGrad)" stroke="#475569" strokeWidth="2" />
        {/* Tablet Screen */}
        <rect x="7" y="8" width="101" height="119" rx="8" fill="#0F172A" />
        <rect x="7" y="8" width="101" height="119" rx="8" fill="url(#screenGrad)" />

        {/* Screen Header */}
        <circle cx="20" cy="22" r="4" fill="#38BDF8" />
        <rect x="30" y="19" width="45" height="5" rx="2.5" fill="#94A3B8" />

        {/* Dynamic ECG / Cardiogram Line */}
        <path
          d="M15 52H32L38 40L44 65L50 45L56 55L62 52H98"
          stroke="url(#cardioGlow)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Biomarker Value Badges on Screen */}
        <rect x="15" y="70" width="38" height="18" rx="4" fill="#38BDF8" fillOpacity="0.2" stroke="#38BDF8" strokeWidth="0.8" />
        <text x="20" y="83" fill="#E0F2FE" fontSize="9" fontWeight="bold" fontFamily="monospace">Hb 14.2</text>

        <rect x="58" y="70" width="38" height="18" rx="4" fill="#34D399" fillOpacity="0.2" stroke="#34D399" strokeWidth="0.8" />
        <text x="63" y="83" fill="#D1FAE5" fontSize="9" fontWeight="bold" fontFamily="monospace">BP 118/76</text>

        <rect x="15" y="94" width="81" height="6" rx="3" fill="#334155" />
        <rect x="15" y="94" width="60" height="6" rx="3" fill="#818CF8" />

        <rect x="15" y="106" width="55" height="5" rx="2.5" fill="#475569" fillOpacity="0.8" />
      </g>

      {/* Doctor Hand Holding Tablet */}
      <circle cx="270" cy="290" r="12" fill="#FCE7F3" stroke="#CBD5E1" strokeWidth="1.5" />
      <path d="M266 280C270 280 274 285 273 293" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />

      {/* Floating Sparkles & Health Badges (Bottom Left) */}
      <g transform="translate(105, 275)">
        <rect width="105" height="34" rx="12" fill="#FFFFFF" fillOpacity="0.95" stroke="#E2E8F0" strokeWidth="1.5" />
        <circle cx="20" cy="17" r="7" fill="#DCFCE7" />
        <path d="M16 17L19 20L25 14" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="33" y="16" fill="#1E293B" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Reports Verified</text>
        <text x="33" y="26" fill="#64748B" fontSize="8" fontFamily="sans-serif">EN • తెలుగు AI</text>
      </g>

      {/* Star / Sparkle accents */}
      <path d="M160 115L163 123L171 126L163 129L160 137L157 129L149 126L157 123L160 115Z" fill="#818CF8" />
      <path d="M320 200L322 205L327 207L322 209L320 214L318 209L313 207L318 205L320 200Z" fill="#38BDF8" />
    </svg>
  );
};
