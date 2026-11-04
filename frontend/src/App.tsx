import React, { useState, useEffect } from 'react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ReportAnalyzerPage } from './pages/ReportAnalyzerPage';
import { ChatAssistantPage } from './pages/ChatAssistantPage';
import { ReportComparisonPage } from './pages/ReportComparisonPage';
import { SourcesPage } from './pages/SourcesPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { HealthTipsPage } from './pages/HealthTipsPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { AccountPage } from './pages/AccountPage';
import { HistoryPage } from './pages/HistoryPage';
import { HealthStatus, Language, NavigationTab, UserProfile } from './types';
import { ApiRequestError, fetchCurrentUser, fetchHealth, logoutApi } from './services/api';
import { HeartHandshake, ShieldCheck } from 'lucide-react';

function getStoredAuthToken(): string | null {
  return sessionStorage.getItem('mediguide_token') || localStorage.getItem('mediguide_token');
}

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(() => !getStoredAuthToken());
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    const guestFlag = sessionStorage.getItem('mediguide_guest');
    if (typeof window !== 'undefined' && (window.location.hash === '#dashboard' || window.location.search.includes('tab=dashboard'))) {
      return 'dashboard';
    }
    return guestFlag ? 'dashboard' : 'login';
  });

  const [language, setLanguage] = useState<Language>(() => {
    const storedLanguage = localStorage.getItem('mediguide_language');
    return storedLanguage === 'te' || storedLanguage === 'hi' ? storedLanguage : 'en';
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('mediguide_theme') === 'dark');
  const [initialSampleId, setInitialSampleId] = useState<string | null>(null);
  const [initialChatQuestion, setInitialChatQuestion] = useState('');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('mediguide_language', lang);
  };

  const handleThemeChange = () => {
    setDarkMode((previous) => {
      const next = !previous;
      localStorage.setItem('mediguide_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  const handleNavigate = (tab: NavigationTab, sampleId?: string) => {
    if (tab !== 'chat') setInitialChatQuestion('');
    if (sampleId) {
      setInitialSampleId(sampleId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueChat = (question: string) => {
    setInitialChatQuestion(question);
    handleNavigate('chat');
  };

  const handleLoginSuccess = (user: UserProfile, token: string, rememberMe = true) => {
    setAuthError(null);
    setCurrentUser(user);
    localStorage.removeItem('mediguide_user');
    localStorage.removeItem('mediguide_token');
    sessionStorage.removeItem('mediguide_token');
    (rememberMe ? localStorage : sessionStorage).setItem('mediguide_token', token);
    sessionStorage.removeItem('mediguide_guest');
    setAuthReady(true);
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = () => {
    const token = getStoredAuthToken();
    if (token) {
      void logoutApi(token).catch((error: Error) => {
        console.warn('Failed to revoke sign-in session:', error.message);
      });
    }
    setCurrentUser(null);
    localStorage.removeItem('mediguide_user');
    localStorage.removeItem('mediguide_token');
    sessionStorage.removeItem('mediguide_token');
    sessionStorage.removeItem('mediguide_guest');
    setAuthReady(true);
    setActiveTab('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreAsGuest = () => {
    localStorage.removeItem('mediguide_user');
    localStorage.removeItem('mediguide_token');
    sessionStorage.removeItem('mediguide_token');
    setCurrentUser(null);
    sessionStorage.setItem('mediguide_guest', 'true');
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshHealthStatus = async (force: boolean = false) => {
    try {
      const data = await fetchHealth(force);
      setHealth(data);
    } catch (e) {
      console.error('Error fetching health status:', e);
    }
  };

  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((data) => {
        if (active) setHealth(data);
      })
      .catch((error: Error) => {
        console.error('Error fetching health status:', error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) return;

    let active = true;
    fetchCurrentUser(token)
      .then((user) => {
        if (!active) return;
        setCurrentUser(user);
        sessionStorage.removeItem('mediguide_guest');
        setActiveTab('dashboard');
      })
      .catch((error: unknown) => {
        if (!active) return;
        const storedToken = getStoredAuthToken();
        if (error instanceof ApiRequestError && error.status === 401) {
          localStorage.removeItem('mediguide_user');
          localStorage.removeItem('mediguide_token');
          sessionStorage.removeItem('mediguide_token');
        }
        setCurrentUser(null);
        if (error instanceof ApiRequestError && error.status === 401) {
          setActiveTab('login');
        } else {
          setAuthError(
            storedToken
              ? 'Your saved session could not be verified because the backend is unavailable. Please try again or sign in.'
              : 'The backend could not verify your session. Please try again.'
          );
          setActiveTab('login');
        }
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Verifying your session...
      </div>
    );
  }

  // Full-Screen Dedicated Login Page View
  if (activeTab === 'login') {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <DisclaimerBanner language={language} />
        {authError && (
          <div role="alert" className="mx-auto mt-4 w-full max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {authError}
          </div>
        )}
        <LoginPage
          language={language}
          onLoginSuccess={handleLoginSuccess}
          onExploreAsGuest={handleExploreAsGuest}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-800 transition-colors">
      {/* 1. Medical Safety Disclaimer Banner (Top) */}
      <DisclaimerBanner language={language} />

      {/* 2. Top Navigation Bar */}
      <Navbar
        language={language}
        onLanguageChange={handleLanguageChange}
        onSelectTab={handleNavigate}
        health={health}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        darkMode={darkMode}
        onToggleDarkMode={handleThemeChange}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onSignInClick={() => setActiveTab('login')}
      />

      {/* 3. Main Application Layout with Desktop Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleNavigate}
          language={language}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />

        {/* Dynamic Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardPage
              language={language}
              onNavigate={handleNavigate}
              health={health}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'analyzer' && (
            <ReportAnalyzerPage
              language={language}
              onLanguageChange={handleLanguageChange}
              token={getStoredAuthToken()}
              initialSampleId={initialSampleId}
              onClearInitialSampleId={() => setInitialSampleId(null)}
            />
          )}

          {activeTab === 'chat' && (
            <ChatAssistantPage
              language={language}
              onLanguageChange={handleLanguageChange}
              token={getStoredAuthToken()}
              initialQuestion={initialChatQuestion}
            />
          )}

          {activeTab === 'comparison' && (
            <ReportComparisonPage language={language} token={getStoredAuthToken()} />
          )}

          {activeTab === 'sources' && (
            <SourcesPage language={language} />
          )}

          {activeTab === 'healthTips' && (
            <HealthTipsPage language={language} />
          )}

          {activeTab === 'emergency' && (
            <EmergencyPage language={language} />
          )}

          {activeTab === 'history' && (
            <HistoryPage
              language={language}
              token={getStoredAuthToken()}
              onContinueChat={handleContinueChat}
            />
          )}

          {activeTab === 'account' && (
            <AccountPage
              language={language}
              user={currentUser}
              token={getStoredAuthToken()}
              onUserUpdated={setCurrentUser}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              language={language}
              onLanguageChange={handleLanguageChange}
              health={health}
              onRefreshHealth={refreshHealthStatus}
            />
          )}
        </main>
      </div>

      {/* 4. Global Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-6 px-4 sm:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white">
              <HeartHandshake className="w-3 h-3" />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-200">MediGuide AI</span>
            <span>•</span>
            <span>Understand Your Health, Make Informed Decisions.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {language === 'te' ? 'విద్యా & సమాచార ప్రయోజనాల కోసం మాత్రమే' : language === 'hi' ? 'केवल शैक्षिक और सूचनात्मक उपयोग के लिए' : 'Educational & Informational Only'}
            </span>
            <span>•</span>
            <button
              onClick={() => handleNavigate('settings')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 underline"
            >
              {language === 'te' ? 'గోప్యత & డేటా నియంత్రణలు' : language === 'hi' ? 'गोपनीयता और डेटा नियंत्रण' : 'Privacy & Data Controls'}
            </button>
            {currentUser && (
              <>
                <span>•</span>
                <button
                  onClick={handleSignOut}
                  className="hover:text-rose-600 dark:hover:text-rose-400 underline"
                >
                  {language === 'te' ? 'సైన్ అవుట్' : language === 'hi' ? 'साइन आउट' : 'Sign Out'} ({currentUser.name})
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
