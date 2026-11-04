import React from 'react';
import {
  LayoutDashboard,
  FileText,
  MessageSquareText,
  GitCompare,
  BookOpenCheck,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  Dumbbell,
  Siren,
  History,
  CircleUserRound,
} from 'lucide-react';
import { Language, NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  language: Language;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  language,
  mobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label_en: 'Dashboard',
      label_te: 'డాష్‌బోర్డ్',
      label_hi: 'डैशबोर्ड',
      desc_en: 'Overview & quick actions',
      desc_te: 'అవలోకనం & శీఘ్ర చర్యలు',
      desc_hi: 'अवलोकन और त्वरित विकल्प',
      icon: LayoutDashboard,
    },
    {
      id: 'analyzer' as NavigationTab,
      label_en: 'Report Analyzer',
      label_te: 'రిపోర్ట్ ఎనలైజర్',
      label_hi: 'रिपोर्ट विश्लेषक',
      desc_en: 'PDF upload & lab insights',
      desc_te: 'PDF విశ్లేషణ & ల్యాబ్ ఫలితాలు',
      desc_hi: 'PDF अपलोड और लैब जानकारी',
      icon: FileText,
      badge: 'Core',
    },
    {
      id: 'chat' as NavigationTab,
      label_en: 'AI Health Assistant',
      label_te: 'AI హెల్త్ అసిస్టెంట్',
      label_hi: 'AI स्वास्थ्य सहायक',
      desc_en: 'Bilingual health Q&A',
      desc_te: 'ద్విభాషా ఆరోగ్య సహాయం',
      desc_hi: 'स्वास्थ्य संबंधी प्रश्न और उत्तर',
      icon: MessageSquareText,
      badge: 'Interactive',
    },
    {
      id: 'comparison' as NavigationTab,
      label_en: 'Report Comparison',
      label_te: 'రిపోర్ట్ పోలిక',
      label_hi: 'रिपोर्ट तुलना',
      desc_en: 'Longitudinal trend graphs',
      desc_te: 'కాలక్రమేణా మార్పుల గ్రాఫ్స్',
      desc_hi: 'समय के साथ रुझान',
      icon: GitCompare,
    },
    {
      id: 'healthTips' as NavigationTab,
      label_en: 'Health Tips',
      label_te: 'ఆరోగ్య సూచనలు',
      label_hi: 'स्वास्थ्य सुझाव',
      desc_en: 'Movement & nutrition',
      desc_te: 'వ్యాయామం & పోషకాహారం',
      desc_hi: 'व्यायाम और पोषण',
      icon: Dumbbell,
    },
    {
      id: 'emergency' as NavigationTab,
      label_en: 'Emergency',
      label_te: 'అత్యవసర సహాయం',
      label_hi: 'आपातकालीन सहायता',
      desc_en: 'Urgent contacts & nearby care',
      desc_te: 'అత్యవసర సంప్రదింపులు & సమీప సేవలు',
      desc_hi: 'आपातकालीन संपर्क और पास की सहायता',
      icon: Siren,
    },
    {
      id: 'sources' as NavigationTab,
      label_en: 'Health Sources',
      label_te: 'వైద్య సమాచార వనరులు',
      label_hi: 'स्वास्थ्य स्रोत',
      desc_en: 'WHO, MedlinePlus, CDC',
      desc_te: 'విశ్వసనీయ వైద్య ప్రమాణాలు',
      desc_hi: 'WHO, MedlinePlus, CDC',
      icon: BookOpenCheck,
    },
    {
      id: 'history' as NavigationTab,
      label_en: 'History',
      label_te: 'చరిత్ర',
      label_hi: 'इतिहास',
      desc_en: 'Your reports & conversations',
      desc_te: 'మీ నివేదికలు & సంభాషణలు',
      desc_hi: 'आपकी रिपोर्ट और बातचीत',
      icon: History,
    },
    {
      id: 'account' as NavigationTab,
      label_en: 'My Account',
      label_te: 'నా ఖాతా',
      label_hi: 'मेरा खाता',
      desc_en: 'Profile & account details',
      desc_te: 'ప్రొఫైల్ & ఖాతా వివరాలు',
      desc_hi: 'प्रोफ़ाइल और खाता विवरण',
      icon: CircleUserRound,
    },
    {
      id: 'settings' as NavigationTab,
      label_en: 'Privacy & Settings',
      label_te: 'గోప్యత & సెట్టింగ్‌లు',
      label_hi: 'गोपनीयता और सेटिंग',
      desc_en: 'Report processing & API status',
      desc_te: 'డేటా భద్రత & సిస్టమ్ స్థితి',
      desc_hi: 'रिपोर्ट प्रसंस्करण और API स्थिति',
      icon: ShieldCheck,
    },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobileMenu();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white">MediGuide AI</span>
          </div>
          <button
            onClick={onCloseMobileMenu}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-medium px-2 py-1"
          >
            Close
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {language === 'te' ? 'నావిగేషన్' : language === 'hi' ? 'मुख्य मेनू' : 'Main Menu'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-indigo-950/60 dark:to-violet-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-900/50 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200 dark:shadow-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-700 dark:group-hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate">
                      {language === 'te' ? item.label_te : language === 'hi' ? item.label_hi : item.label_en}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {language === 'te' ? item.desc_te : language === 'hi' ? item.desc_hi : item.desc_en}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Privacy & Ethics Footer Box */}
        <div className="p-4 m-3 rounded-xl bg-gradient-to-br from-violet-50/70 to-indigo-50/70 dark:from-slate-800/80 dark:to-indigo-950/50 border border-violet-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {language === 'te' ? '100% గోప్యత హామీ' : '100% Privacy First'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {language === 'te'
              ? 'మీ రిపోర్టులు మెమరీలో మాత్రమే ప్రాసెస్ చేయబడతాయి. సర్వర్‌లో ఎప్పటికీ సేవ్ కావు.'
              : 'Medical files are processed in-memory only and never stored to disk or database.'}
          </p>
        </div>
      </aside>
    </>
  );
};
