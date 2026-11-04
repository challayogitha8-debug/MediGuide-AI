import React, { useState } from 'react';
import { AlertTriangle, LocateFixed, MapPin, Phone, ShieldAlert } from 'lucide-react';
import { Language } from '../types';
import { findNearbyHospitals, NearbyHospital } from '../services/api';

interface EmergencyPageProps {
  language: Language;
}

const text = (language: Language, en: string, te: string, hi: string) =>
  language === 'te' ? te : language === 'hi' ? hi : en;

export const EmergencyPage: React.FC<EmergencyPageProps> = ({ language }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [manualAddress, setManualAddress] = useState('');
  const [searchMode, setSearchMode] = useState<'nearby' | 'address' | null>(null);

  const callNumber = (phone: string) => {
    const confirmed = window.confirm(
      text(language, `Call ${phone}? Your device will open its phone app.`, `${phone}కు కాల్ చేయాలా? మీ పరికరంలో ఫోన్ యాప్ తెరుచుకుంటుంది.`, `क्या ${phone} पर कॉल करें? आपका फ़ोन ऐप खुलेगा।`),
    );
    if (confirmed) window.location.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
  };

  const showHospitals = async (location: { latitude: number; longitude: number }) => {
    setLoading(true);
    setError(null);
    setSearchMode('nearby');
    try {
      setHospitals(await findNearbyHospitals(location));
    } catch (requestError: unknown) {
      setHospitals([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : text(language, 'Nearby hospital search is unavailable.', 'సమీప ఆసుపత్రుల శోధన అందుబాటులో లేదు.', 'पास के अस्पतालों की खोज उपलब्ध नहीं है।'),
      );
    } finally {
      setLoading(false);
    }
  };

  const findByLocation = () => {
    const confirmed = window.confirm(
      text(language, 'MediGuide will request your current location and send the coordinates to its backend to search nearby hospitals. It will not place a call. Continue?', 'సమీప ఆసుపత్రులను శోధించడానికి MediGuide మీ ప్రస్తుత స్థానాన్ని అడిగి సర్వర్‌కు పంపుతుంది. ఎలాంటి కాల్ చేయదు. కొనసాగించాలా?', 'पास के अस्पताल खोजने के लिए MediGuide आपकी वर्तमान लोकेशन लेकर सर्वर को भेजेगा। कोई कॉल नहीं की जाएगी। जारी रखें?'),
    );
    if (!confirmed) return;
    if (!navigator.geolocation) {
      setError(text(language, 'Location is not supported on this device. Enter a location below.', 'ఈ పరికరంలో లొకేషన్ సౌకర్యం లేదు. క్రింద ప్రదేశాన్ని నమోదు చేయండి.', 'इस डिवाइस पर लोकेशन उपलब्ध नहीं है। नीचे स्थान दर्ज करें।'));
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => void showHospitals({ latitude: coords.latitude, longitude: coords.longitude }),
      (locationError) => {
        setLoading(false);
        setError(
          locationError.code === locationError.PERMISSION_DENIED
            ? text(language, 'Location permission was denied. Enter a city or address to search instead.', 'లొకేషన్ అనుమతి నిరాకరించబడింది. బదులుగా నగరం లేదా చిరునామాను నమోదు చేయండి.', 'लोकेशन अनुमति अस्वीकार हुई। इसके बजाय शहर या पता दर्ज करें।')
            : text(language, 'Could not determine your location. Enter a city or address to search instead.', 'మీ స్థానాన్ని గుర్తించలేకపోయాం. బదులుగా నగరం లేదా చిరునామాను నమోదు చేయండి.', 'आपकी लोकेशन नहीं मिल सकी। इसके बजाय शहर या पता दर्ज करें।'),
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const findByAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    const address = manualAddress.trim();
    if (address.length < 3) {
      setError(text(language, 'Enter a city or address with at least 3 characters.', 'కనీసం 3 అక్షరాల నగరం లేదా చిరునామాను నమోదు చేయండి.', 'कम से कम 3 अक्षरों का शहर या पता दर्ज करें।'));
      return;
    }
    setLoading(true);
    setError(null);
    setSearchMode('address');
    try {
      setHospitals(await findNearbyHospitals({ address }));
    } catch (requestError: unknown) {
      setHospitals([]);
      setError(requestError instanceof Error ? requestError.message : 'Hospital search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fadeIn">
      <header className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30 sm:p-8">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-600" aria-hidden="true" />
        <h1 className="mt-2 text-2xl font-extrabold text-rose-900 dark:text-rose-100">
          {text(language, 'Emergency Help', 'అత్యవసర సహాయం', 'आपातकालीन सहायता')}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-rose-800 dark:text-rose-200">
          {text(language, 'If someone is in immediate danger in India, call the national emergency number 112. This page does not dispatch an ambulance or replace emergency services.', 'భారతదేశంలో తక్షణ ప్రమాదం ఉంటే జాతీయ అత్యవసర నంబర్ 112కు కాల్ చేయండి. ఈ పేజీ అంబులెన్స్‌ను పంపదు లేదా అత్యవసర సేవలకు ప్రత్యామ్నాయం కాదు.', 'भारत में तत्काल खतरे की स्थिति में राष्ट्रीय आपातकालीन नंबर 112 पर कॉल करें। यह पेज एम्बुलेंस नहीं भेजता और आपातकालीन सेवाओं का विकल्प नहीं है।')}
        </p>
        <button
          type="button"
          onClick={() => callNumber('112')}
          className="mx-auto mt-6 flex min-h-20 w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-5 text-2xl font-black text-white shadow-lg shadow-red-900/20 transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
        >
          <Phone className="h-7 w-7" aria-hidden="true" />
          {text(language, 'Call 112', '112కు కాల్ చేయండి', '112 पर कॉल करें')}
        </button>
        <p className="mt-3 text-xs text-rose-700 dark:text-rose-300">
          {text(language, 'Your phone app opens only after you confirm the call.', 'మీరు నిర్ధారించిన తర్వాతే ఫోన్ యాప్ తెరుచుకుంటుంది.', 'आपकी पुष्टि के बाद ही फ़ोन ऐप खुलेगा।')}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900">
              {text(language, 'Nearby hospitals', 'సమీప ఆసుపత్రులు', 'पास के अस्पताल')}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {text(language, 'Hospital details are retrieved from Google Places when configured. Your location is used only for this search.', 'కాన్ఫిగర్ చేసినప్పుడు ఆసుపత్రి వివరాలు Google Places నుండి పొందబడతాయి. మీ స్థానం ఈ శోధన కోసం మాత్రమే ఉపయోగించబడుతుంది.', 'कॉन्फ़िगर होने पर अस्पताल की जानकारी Google Places से ली जाएगी। आपकी लोकेशन केवल इस खोज के लिए उपयोग होगी।')}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={findByLocation}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
        >
          <LocateFixed className="h-4 w-4" />
          {loading && searchMode === 'nearby'
            ? text(language, 'Finding hospitals…', 'ఆసుపత్రులను వెతుకుతున్నాం…', 'अस्पताल खोज रहे हैं…')
            : text(language, 'Use my current location', 'నా ప్రస్తుత స్థానాన్ని ఉపయోగించండి', 'मेरी वर्तमान लोकेशन उपयोग करें')}
        </button>

        <form onSubmit={findByAddress} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="manual-location">
            {text(language, 'City or address', 'నగరం లేదా చిరునామా', 'शहर या पता')}
          </label>
          <input
            id="manual-location"
            value={manualAddress}
            onChange={(event) => setManualAddress(event.target.value)}
            maxLength={200}
            placeholder={text(language, 'Enter a city or address', 'నగరం లేదా చిరునామా నమోదు చేయండి', 'शहर या पता दर्ज करें')}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {text(language, 'Search hospitals', 'ఆసుపత్రులను శోధించండి', 'अस्पताल खोजें')}
          </button>
        </form>

        {loading && <p role="status" className="mt-4 text-sm text-slate-500">{text(language, 'Searching…', 'శోధిస్తోంది…', 'खोज रहे हैं…')}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
        {!loading && searchMode && !error && hospitals.length === 0 && (
          <p className="mt-4 text-sm text-slate-600">{text(language, 'No hospitals with verified listing details were found for this search.', 'ఈ శోధనకు ధృవీకరించిన వివరాలున్న ఆసుపత్రులు కనబడలేదు.', 'इस खोज में सत्यापित विवरण वाले अस्पताल नहीं मिले।')}</p>
        )}
        {hospitals.length > 0 && (
          <ul className="mt-4 space-y-3">
            {hospitals.map((hospital) => (
              <li key={hospital.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900">{hospital.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{hospital.address}</p>
                {hospital.distance_km !== null && <p className="mt-1 text-xs text-slate-500">{hospital.distance_km} km</p>}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {hospital.phone ? (
                    <button type="button" onClick={() => callNumber(hospital.phone!)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                      <Phone className="h-4 w-4" /> {text(language, 'Call hospital', 'ఆసుపత్రికి కాల్ చేయండి', 'अस्पताल को कॉल करें')}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">{text(language, 'No verified phone number is listed.', 'ధృవీకరించిన ఫోన్ నంబర్ జాబితాలో లేదు.', 'कोई सत्यापित फ़ोन नंबर सूचीबद्ध नहीं है।')}</span>
                  )}
                  {hospital.google_maps_url && <a className="text-sm font-medium text-indigo-700 underline dark:text-indigo-300" href={hospital.google_maps_url} target="_blank" rel="noreferrer">{text(language, 'View listing', 'జాబితాను చూడండి', 'लिस्टिंग देखें')}</a>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex gap-2 text-xs text-slate-500">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        {text(language, 'Hospital listings and availability can change. Confirm details directly with the facility. For an emergency, call 112.', 'ఆసుపత్రి వివరాలు, లభ్యత మారవచ్చు. సదుపాయంతో నేరుగా వివరాలు నిర్ధారించుకోండి. అత్యవసర పరిస్థితిలో 112కు కాల్ చేయండి.', 'अस्पताल की जानकारी और उपलब्धता बदल सकती है। सुविधा से सीधे पुष्टि करें। आपात स्थिति में 112 पर कॉल करें।')}
      </p>
    </div>
  );
};
