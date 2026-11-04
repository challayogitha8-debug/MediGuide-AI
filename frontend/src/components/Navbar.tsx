import React from 'react';
import {
  Activity,
  Sparkles,
  Menu,
  X,
  Layers,
  Sun,
  Moon,
  LogOut,
  LogIn,
  Stethoscope,
} from 'lucide-react';
import { HealthStatus, Language, NavigationTab, UserProfile } from '../types';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSelectTab: (tab: NavigationTab) => void;
  health: HealthStatus | null;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  currentUser?: UserProfile | null;
  onSignOut?: () => void;
  onSignInClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  onSelectTab,
  health,
  mobileMenuOpen,
  onToggleMobileMenu,
  darkMode = false,
  onToggleDarkMode,
  currentUser = null,
  onSignOut,
  onSignInClick,
}) => {
  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 dark:shadow-none group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                    MediGuide<span className="text-indigo-600 dark:text-indigo-400 font-extrabold"> AI</span>
                  </span>
                  <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300">
                    {language === 'te' ? 'త్రిభాషా' : language === 'hi' ? 'त्रिभाषी' : 'Trilingual'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Understand Your Health, Make Informed Decisions.
                </p>
              </div>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-0 sm:gap-3">
            {/* AI Status Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
              {health?.gemini_configured ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    {language === 'te' ? 'Gemini AI పనిచేస్తోంది' : language === 'hi' ? 'Gemini AI सक्रिय' : 'Gemini AI Active'}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    {language === 'te' ? 'డెమో మోడ్' : language === 'hi' ? 'डेमो मोड' : 'Demo Mode'}
                  </span>
                </>
              )}
            </div>

            {/* Dark Mode Toggle */}
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={
                  darkMode
                    ? language === 'te' ? 'లైట్ థీమ్‌కు మార్చండి' : language === 'hi' ? 'लाइट थीम पर जाएँ' : 'Switch to Light Theme'
                    : language === 'te' ? 'డార్క్ థీమ్‌కు మార్చండి' : language === 'hi' ? 'डार्क थीम पर जाएँ' : 'Switch to Dark Theme'
                }
                aria-label={language === 'te' ? 'థీమ్ మార్చండి' : language === 'hi' ? 'थीम बदलें' : 'Toggle Theme'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}

            {/* Language Switcher Button */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onLanguageChange('en')}
                className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Switch to English"
              >
                <span className="hidden sm:inline">English</span>
                <span className="sm:hidden">EN</span>
              </button>
              <button
                onClick={() => onLanguageChange('te')}
                className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'te'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="తెలుగు భాషకు మారండి"
              >
                <span className="hidden sm:inline">తెలుగు</span>
                <span className="sm:hidden">తె</span>
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'hi'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="हिंदी में बदलें"
              >
                <span className="hidden sm:inline">हिंदी</span>
                <span className="sm:hidden">हि</span>
              </button>
            </div>

            {/* User Session Chip or Sign In Action */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${
                    currentUser.role === 'doctor' ? 'bg-[#1677FF]' : 'bg-indigo-600'
                  }`}
                  title={currentUser.name}
                >
                  {currentUser.role === 'doctor' ? (
                    <Stethoscope className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <span>{currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}</span>
                  )}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight max-w-[120px] truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider font-semibold text-[#1677FF] leading-none">
                    {currentUser.role}
                  </p>
                </div>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title={language === 'te' ? 'సైన్ అవుట్' : language === 'hi' ? 'साइन आउट' : 'Sign Out'}
                    aria-label={language === 'te' ? 'సైన్ అవుట్' : language === 'hi' ? 'साइन आउट' : 'Sign Out'}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : onSignInClick ? (
              <button
                onClick={onSignInClick}
                className="flex items-center gap-1 px-2 sm:gap-1.5 sm:px-3 py-1.5 rounded-lg bg-[#1677FF] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {language === 'te' ? 'సైన్ ఇన్' : language === 'hi' ? 'साइन इन' : 'Sign In'}
                </span>
              </button>
            ) : null}

            {/* Mobile Menu Toggle */}
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={language === 'te' ? 'నావిగేషన్ మెనూ మార్చండి' : language === 'hi' ? 'नेविगेशन मेनू टॉगल करें' : 'Toggle Navigation Menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
