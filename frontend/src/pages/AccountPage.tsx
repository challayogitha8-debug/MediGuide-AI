import React, { useState } from 'react';
import { AlertCircle, CircleUserRound, Save, ShieldCheck } from 'lucide-react';
import { Language, UserProfile } from '../types';
import { updateCurrentUserProfile } from '../services/api';

interface AccountPageProps {
  language: Language;
  user: UserProfile | null;
  token: string | null;
  onUserUpdated: (user: UserProfile) => void;
}

const text = (language: Language, en: string, te: string, hi: string) =>
  language === 'te' ? te : language === 'hi' ? hi : en;

export const AccountPage: React.FC<AccountPageProps> = ({ language, user, token, onUserUpdated }) => {
  const [name, setName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    if (!user || !token) {
      setError(text(language, 'Sign in to edit your account.', 'ఖాతాను మార్చడానికి సైన్ ఇన్ చేయండి.', 'खाता बदलने के लिए साइन इन करें।'));
      return;
    }
    if (name.trim().length < 2) {
      setError(text(language, 'Enter a name with at least 2 characters.', 'కనీసం 2 అక్షరాల పేరు నమోదు చేయండి.', 'कम से कम 2 अक्षरों का नाम दर्ज करें।'));
      return;
    }
    const pictureUrl = avatar.trim();
    if (pictureUrl) {
      try {
        if (new URL(pictureUrl).protocol !== 'https:') throw new Error();
      } catch {
        setError(text(language, 'Profile picture URL must use HTTPS.', 'ప్రొఫైల్ చిత్ర URL HTTPS ఉపయోగించాలి.', 'प्रोफ़ाइल चित्र URL HTTPS होना चाहिए।'));
        return;
      }
    }
    setSaving(true);
    try {
      const updated = await updateCurrentUserProfile(token, {
        name: name.trim(),
        avatar: pictureUrl || null,
      });
      onUserUpdated(updated);
      setSaved(true);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Profile update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <h1 className="text-xl font-bold">{text(language, 'My Account', 'నా ఖాతా', 'मेरा खाता')}</h1>
        <p className="mt-2 text-sm">{text(language, 'Sign in to view and edit your profile.', 'మీ ప్రొఫైల్ చూడటానికి, మార్చడానికి సైన్ ఇన్ చేయండి.', 'अपनी प्रोफ़ाइल देखने और बदलने के लिए साइन इन करें।')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-fadeIn">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-900">{text(language, 'My Account', 'నా ఖాతా', 'मेरा खाता')}</h1>
        <p className="mt-1 text-sm text-slate-600">{text(language, 'Review and update your account profile.', 'మీ ఖాతా ప్రొఫైల్‌ను పరిశీలించి నవీకరించండి.', 'अपनी खाता प्रोफ़ाइल देखें और अपडेट करें।')}</p>
      </header>

      <form onSubmit={save} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-16 w-16 rounded-full bg-slate-100 object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <CircleUserRound className="h-9 w-9" />
            </span>
          )}
          <div>
            <h2 className="font-bold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-600">{user.email}</p>
          </div>
        </div>

        {error && <p role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
        {saved && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{text(language, 'Profile updated.', 'ప్రొఫైల్ నవీకరించబడింది.', 'प्रोफ़ाइल अपडेट की गई।')}</p>}

        <div>
          <label htmlFor="account-name" className="mb-1 block text-sm font-semibold text-slate-800">{text(language, 'Full name', 'పూర్తి పేరు', 'पूरा नाम')}</label>
          <input id="account-name" required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label htmlFor="account-email" className="mb-1 block text-sm font-semibold text-slate-800">{text(language, 'Email address', 'ఇమెయిల్ చిరునామా', 'ईमेल पता')}</label>
          <input id="account-email" type="email" value={user.email} readOnly className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm opacity-80" />
          <p className="mt-1 text-xs text-slate-500">{text(language, 'Email changes are not available here.', 'ఇక్కడ ఇమెయిల్ మార్చడం సాధ్యం కాదు.', 'यहाँ ईमेल बदलना उपलब्ध नहीं है।')}</p>
        </div>
        <div>
          <label htmlFor="account-avatar" className="mb-1 block text-sm font-semibold text-slate-800">{text(language, 'Profile picture URL (HTTPS)', 'ప్రొఫైల్ చిత్ర URL (HTTPS)', 'प्रोफ़ाइल चित्र URL (HTTPS)')}</label>
          <input id="account-avatar" type="url" maxLength={2048} value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://example.com/photo.jpg" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          <p className="mt-1 text-xs text-slate-500">{text(language, 'Leave blank to remove the current picture.', 'ప్రస్తుత చిత్రాన్ని తొలగించడానికి ఖాళీగా ఉంచండి.', 'वर्तमान चित्र हटाने के लिए खाली छोड़ें।')}</p>
        </div>

        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800 sm:grid-cols-2">
          <p><span className="font-semibold">{text(language, 'Created', 'సృష్టించిన తేదీ', 'बनाई गई')}:</span> {new Date(user.created_at).toLocaleDateString()}</p>
          <p><span className="font-semibold">{text(language, 'Sign-in method', 'సైన్ ఇన్ విధానం', 'साइन-इन तरीका')}:</span> {user.login_method}</p>
        </div>
        <p className="flex items-start gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />{text(language, 'Profile updates are saved to your authenticated account. You cannot edit another user’s profile.', 'మీ ధృవీకరించిన ఖాతాలోనే ప్రొఫైల్ మార్పులు భద్రపరచబడతాయి. ఇతరుల ప్రొఫైల్‌ను మార్చలేరు.', 'प्रोफ़ाइल बदलाव आपके प्रमाणित खाते में सहेजे जाते हैं। आप किसी अन्य व्यक्ति की प्रोफ़ाइल नहीं बदल सकते।')}</p>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          <Save className="h-4 w-4" />
          {saving ? text(language, 'Saving…', 'సేవ్ చేస్తోంది…', 'सहेज रहे हैं…') : text(language, 'Save changes', 'మార్పులను సేవ్ చేయండి', 'बदलाव सहेजें')}
        </button>
      </form>
    </div>
  );
};
