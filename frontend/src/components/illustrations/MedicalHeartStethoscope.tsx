import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

export const MedicalHeartStethoscope: React.FC<Props> = ({
  className = 'w-12 h-12',
  size = 48,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Medical heart and stethoscope emblem"
    >
      <defs>
        <linearGradient id="heartGrad" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1677FF" />
          <stop offset="0.6" stopColor="#0EA5E9" />
          <stop offset="1" stopColor="#22C7E8" />
        </linearGradient>
        <linearGradient id="stethGrad" x1="10" y1="14" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B1F4D" />
          <stop offset="0.7" stopColor="#1677FF" />
          <stop offset="1" stopColor="#22C7E8" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1677FF" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Subtle background circular aura */}
      <circle cx="32" cy="32" r="28" fill="#EEF7FF" />
      <circle cx="32" cy="32" r="24" fill="#FFFFFF" fillOpacity="0.8" />

      {/* Stylized Heart Shape with pulse notch */}
      <g filter="url(#softShadow)">
        <path
          d="M32 49.5C32 49.5 15 38.5 15 25.5C15 19.5 19.5 15 25 15C28.2 15 31.1 16.6 32 18.2C32.9 16.6 35.8 15 39 15C44.5 15 49 19.5 49 25.5C49 38.5 32 49.5 32 49.5Z"
          fill="url(#heartGrad)"
          fillOpacity="0.12"
          stroke="url(#heartGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Intertwined Stethoscope Ribbon Tube */}
      <path
        d="M23 20C20 20 18.5 22.5 18.5 25.5C18.5 33 26 40 32 44.5C38 40 45.5 33 45.5 25.5C45.5 22.5 44 20 41 20"
        stroke="url(#stethGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Earpieces */}
      <path
        d="M21 16V20M25 16V20"
        stroke="#0B1F4D"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="21" cy="15" r="1.5" fill="#1677FF" />
      <circle cx="25" cy="15" r="1.5" fill="#1677FF" />

      {/* Stethoscope Chest Piece / Bell */}
      <g transform="translate(39, 41)">
        <circle cx="5" cy="5" r="5" fill="#0B1F4D" />
        <circle cx="5" cy="5" r="3.2" fill="#22C7E8" />
        <circle cx="5" cy="5" r="1.5" fill="#FFFFFF" />
      </g>

      {/* ECG vital line inside heart */}
      <path
        d="M24 29H28L30 24L33 34L36 27L38 30H41"
        stroke="#1677FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sparkle star */}
      <path
        d="M47 13L47.7 15.3L50 16L47.7 16.7L47 19L46.3 16.7L44 16L46.3 15.3L47 13Z"
        fill="#22C7E8"
      />
    </svg>
  );
};
