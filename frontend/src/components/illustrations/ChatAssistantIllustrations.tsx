import React from 'react';

interface IllustrationProps {
  className?: string;
}

export const AssistantAvatarIllustration: React.FC<IllustrationProps> = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="MediGuide AI Health Assistant Avatar"
    >
      <defs>
        <linearGradient id="aiAvatarBg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="aiFaceGrad" x1="12" y1="12" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EEF2FF" />
        </linearGradient>
      </defs>

      {/* Outer rounded pill container */}
      <rect width="44" height="44" rx="14" fill="url(#aiAvatarBg)" />

      {/* Head / Robot Dome */}
      <rect x="8" y="9" width="28" height="24" rx="9" fill="url(#aiFaceGrad)" />
      
      {/* Mini Medical Cross on Top */}
      <circle cx="22" cy="7" r="4.5" fill="#4F46E5" />
      <path d="M22 4.5V9.5M19.5 7H24.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />

      {/* Digital Screen Face */}
      <rect x="11" y="14" width="22" height="15" rx="6" fill="#1E1B4B" />

      {/* Friendly Glowing Eyes */}
      <ellipse cx="17" cy="20.5" rx="2.4" ry="3" fill="#38BDF8" />
      <circle cx="17.6" cy="19.6" r="0.8" fill="#FFFFFF" />

      <ellipse cx="27" cy="20.5" rx="2.4" ry="3" fill="#38BDF8" />
      <circle cx="27.6" cy="19.6" r="0.8" fill="#FFFFFF" />

      {/* Gentle Smiling Mouth */}
      <path d="M19 24.5C20.5 26 23.5 26 25 24.5" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />

      {/* Stethoscope Neck Accent */}
      <path d="M14 33C14 37 18 39 22 39C26 39 30 37 30 33" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="22" cy="39" r="2.5" fill="#38BDF8" />
    </svg>
  );
};

export const ChatEmptyIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48 mx-auto' }) => {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="AI Health Assistant consultation illustration"
    >
      <defs>
        <linearGradient id="chatBubbleGrad" x1="30" y1="20" x2="190" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EEF2FF" />
          <stop offset="1" stopColor="#E0E7FF" />
        </linearGradient>
        <linearGradient id="aiGlow" x1="100" y1="60" x2="140" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818CF8" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>

      {/* Soft Background Cloud/Circle */}
      <circle cx="120" cy="100" r="75" fill="#F5F3FF" />
      <circle cx="170" cy="70" r="30" fill="#EFF6FF" />

      {/* Dialogue Speech Bubble Behind Assistant */}
      <rect x="45" y="30" width="150" height="95" rx="20" fill="url(#chatBubbleGrad)" stroke="#C7D2FE" strokeWidth="1.5" />
      <path d="M95 125L85 140L110 125H95Z" fill="#E0E7FF" stroke="#C7D2FE" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Stethoscope Loop on Bubble */}
      <path
        d="M65 55C65 75 80 85 95 85C110 85 125 75 125 55"
        stroke="#818CF8"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="95" cy="88" r="6" fill="#4F46E5" />
      <circle cx="95" cy="88" r="2.5" fill="#FFFFFF" />

      {/* ECG Waveform in dialogue bubble */}
      <path
        d="M135 68H148L153 55L158 82L163 60L168 72H180"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Friendly AI Health Bot Figure */}
      <g transform="translate(90, 85)">
        <rect width="60" height="52" rx="18" fill="url(#aiGlow)" />
        <rect x="8" y="10" width="44" height="32" rx="12" fill="#1E1B4B" />

        {/* Friendly Screen Eyes */}
        <ellipse cx="20" cy="24" rx="4" ry="5.5" fill="#38BDF8" />
        <circle cx="21" cy="22" r="1.5" fill="#FFFFFF" />

        <ellipse cx="40" cy="24" rx="4" ry="5.5" fill="#38BDF8" />
        <circle cx="41" cy="22" r="1.5" fill="#FFFFFF" />

        {/* Smile */}
        <path d="M24 33C27 36 33 36 36 33" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />

        {/* Antenna with Heart Signal */}
        <rect x="28" y="-7" width="4" height="8" rx="2" fill="#6366F1" />
        <circle cx="30" cy="-9" r="4.5" fill="#EF4444" />
        <path d="M30 -11.5L28 -9.5H32L30 -11.5Z" fill="#FFFFFF" />
      </g>

      {/* Floating Pill / Capsule (Left) */}
      <g transform="translate(25, 95) rotate(-25)">
        <rect width="28" height="12" rx="6" fill="#F43F5E" />
        <rect x="14" width="14" height="12" rx="6" fill="#F8FAFC" />
        <rect width="28" height="12" rx="6" stroke="#E2E8F0" strokeWidth="1" />
      </g>

      {/* Floating Sparkle Stars */}
      <path d="M200 45L202 51L208 53L202 55L200 61L198 55L192 53L198 51L200 45Z" fill="#F59E0B" />
      <path d="M40 40L41.5 45L46 46.5L41.5 48L40 53L38.5 48L34 46.5L38.5 45L40 40Z" fill="#818CF8" />
    </svg>
  );
};
