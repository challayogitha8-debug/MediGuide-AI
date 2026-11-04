import React, { useState } from 'react';
import { Activity, ShieldCheck, Sparkles } from 'lucide-react';
import doctorAvatarPng from '../../assets/ai-doctor-avatar.png';
import doctorAvatarWebp from '../../assets/ai-doctor-avatar.webp';

interface IllustrationProps {
  className?: string;
  showBadges?: boolean;
}

export const DoctorHeroIllustration: React.FC<IllustrationProps> = ({
  className = 'w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[440px]',
  showBadges = true,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(doctorAvatarWebp);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Subtle Purple & Blue Ambient Tech Glows */}
      <div
        className="absolute -inset-4 sm:-inset-6 rounded-full bg-gradient-to-tr from-violet-600/30 via-indigo-500/25 to-cyan-400/25 blur-2xl pointer-events-none transform -rotate-6 animate-pulse"
        style={{ animationDuration: '6s' }}
        aria-hidden="true"
      />
      <div
        className="absolute w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Decorative concentric tech rings matching modern healthcare AI aesthetic */}
      <div
        className="absolute w-[86%] h-[86%] rounded-full border border-violet-400/20 dark:border-violet-400/15 pointer-events-none animate-spin"
        style={{ animationDuration: '40s' }}
        aria-hidden="true"
      />
      <div
        className="absolute w-[96%] h-[96%] rounded-full border border-dashed border-cyan-400/25 dark:border-cyan-400/20 pointer-events-none"
        aria-hidden="true"
      />

      {/* Floating Medical AI Status Badge - Top Left */}
      {showBadges && (
        <div className="absolute top-2 -left-2 sm:top-4 sm:-left-3 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-white/50 dark:border-slate-700/70 shadow-lg shadow-indigo-950/25 transition-all duration-300 hover:scale-105">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-violet-500 shrink-0" />
              AI Clinical Guide
            </span>
            <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
              Active • Real-time
            </span>
          </div>
        </div>
      )}

      {/* Floating Vital / Diagnostics Badge - Bottom Right */}
      {showBadges && (
        <div className="absolute bottom-2 -right-2 sm:bottom-4 sm:-right-3 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-white/50 dark:border-slate-700/70 shadow-lg shadow-indigo-950/25 transition-all duration-300 hover:scale-105">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Verified Analysis
            </span>
            <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Activity className="w-2.5 h-2.5 text-cyan-500 shrink-0" />
              EN • తెలుగు • हिन्दी
            </span>
          </div>
        </div>
      )}

      {/* Premium 3D AI Female Doctor Character Illustration */}
      <picture className="relative z-10 w-full flex items-center justify-center">
        <source srcSet="/assets/ai-doctor-avatar.webp" type="image/webp" />
        <source srcSet="/assets/ai-doctor-avatar.png" type="image/png" />
        <img
          src={imgSrc}
          alt="MediGuide AI Female Doctor - Professional Healthcare Assistant"
          width={440}
          height={440}
          loading="eager"
          decoding="async"
          onError={() => {
            // Robust fallback chain to ensure no broken images
            if (imgSrc !== doctorAvatarPng) {
              setImgSrc(doctorAvatarPng);
            } else if (imgSrc !== '/assets/ai-doctor-avatar.png') {
              setImgSrc('/assets/ai-doctor-avatar.png');
            }
          }}
          className="w-full h-auto max-h-[360px] sm:max-h-[400px] lg:max-h-[440px] object-contain drop-shadow-[0_15px_30px_rgba(15,23,42,0.35)] transition-transform duration-500 hover:scale-[1.02]"
        />
      </picture>
    </div>
  );
};
