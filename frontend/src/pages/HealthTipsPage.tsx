import React from 'react';
import { Activity, Bike, Dumbbell, HeartPulse, Leaf, ShieldCheck, Waves } from 'lucide-react';
import { Language } from '../types';

interface HealthTipsPageProps {
  language: Language;
}

const text = (language: Language, en: string, te: string, hi: string) =>
  language === 'te' ? te : language === 'hi' ? hi : en;

const exerciseGroups = [
  {
    age: ['10–20 years', '10–20 సంవత్సరాలు', '10–20 वर्ष'],
    intro: [
      'Build enjoyable movement habits; prioritize skill, play, and good technique.',
      'ఆనందకరమైన కదలిక అలవాట్లను పెంపొందించండి; ఆట, నైపుణ్యం, సరైన పద్ధతికి ప్రాధాన్యత ఇవ్వండి.',
      'आनंददायक गतिविधियों की आदतें बनाएँ; खेल, कौशल और सही तकनीक को प्राथमिकता दें।',
    ],
    items: [
      ['Walking or outdoor play', 'నడక లేదా బహిరంగ ఆటలు', 'टहलना या बाहर खेलना', 'Supports general fitness and mood.', 'సాధారణ దృఢత్వం మరియు మానసిక స్థితికి తోడ్పడుతుంది.', 'सामान्य फिटनेस और मनोदशा में सहायक।', '20–45 min', 'Easy', 'Wear comfortable shoes; hydrate in heat.'],
      ['Cycling or swimming', 'సైక్లింగ్ లేదా ఈత', 'साइकिल चलाना या तैरना', 'Builds endurance with varied impact.', 'విభిన్న ప్రభావంతో సహనశక్తిని పెంచుతుంది.', 'विविध प्रभाव के साथ सहनशक्ति बढ़ाता है।', '20–40 min', 'Easy–moderate', 'Use a helmet; swim with supervision.'],
      ['Running or team sports', 'పరుగు లేదా జట్టు ఆటలు', 'दौड़ना या टीम खेल', 'Develops coordination and stamina.', 'సమన్వయం మరియు శక్తిని అభివృద్ధి చేస్తుంది.', 'तालमेल और सहनशक्ति विकसित करता है।', '20–45 min', 'Moderate', 'Warm up; increase effort gradually.'],
      ['Basic strength exercises', 'ప్రాథమిక బలవర్ధక వ్యాయామాలు', 'बुनियादी शक्ति व्यायाम', 'Builds movement skills and strength.', 'కదలిక నైపుణ్యాలు, బలాన్ని పెంచుతుంది.', 'गतिशीलता कौशल और शक्ति बढ़ाता है।', '15–25 min', 'Easy–moderate', 'Use body weight and adult/coach guidance.'],
    ],
  },
  {
    age: ['20–30 years', '20–30 సంవత్సరాలు', '20–30 वर्ष'],
    intro: [
      'Combine aerobic activity with strength and mobility; adapt to your starting level.',
      'ఏరోబిక్ వ్యాయామాన్ని బలం, కదలిక సౌలభ్యంతో కలపండి; మీ స్థాయికి తగినట్లు మార్చుకోండి.',
      'एरोबिक गतिविधि को शक्ति और लचीलेपन के साथ मिलाएँ; अपनी क्षमता के अनुसार ढालें।',
    ],
    items: [
      ['Cardio or running', 'కార్డియో లేదా పరుగు', 'कार्डियो या दौड़ना', 'Supports endurance and heart fitness.', 'సహనశక్తి, గుండె దృఢత్వానికి తోడ్పడుతుంది.', 'सहनशक्ति और हृदय फिटनेस में सहायक।', '20–40 min', 'Moderate', 'Build duration gradually; rest if unwell.'],
      ['Strength training', 'బలవర్ధక వ్యాయామం', 'शक्ति प्रशिक्षण', 'Supports strength and daily function.', 'బలం, రోజువారీ పనితీరుకు తోడ్పడుతుంది.', 'शक्ति और दैनिक गतिविधियों में सहायक।', '20–40 min', 'Easy–moderate', 'Use controlled form; avoid painful loads.'],
      ['Yoga and flexibility', 'యోగ మరియు వశ్యత వ్యాయామాలు', 'योग और लचीलेपन के व्यायाम', 'May support mobility and relaxation.', 'కదలిక సౌలభ్యం, విశ్రాంతికి తోడ్పడవచ్చు.', 'गतिशीलता और विश्राम में सहायक हो सकता है।', '15–30 min', 'Easy', 'Modify poses; do not force a stretch.'],
    ],
  },
  {
    age: ['30–40 years', '30–40 సంవత్సరాలు', '30–40 वर्ष'],
    intro: [
      'Balance cardio, strength, mobility, and recovery around work and family routines.',
      'పని, కుటుంబ దినచర్యలకు అనుగుణంగా కార్డియో, బలం, కదలిక, విశ్రాంతిని సమతుల్యం చేయండి.',
      'काम और परिवार की दिनचर्या के अनुसार कार्डियो, शक्ति, गतिशीलता और आराम में संतुलन रखें।',
    ],
    items: [
      ['Brisk walking or cycling', 'వేగంగా నడక లేదా సైక్లింగ్', 'तेज़ चाल से चलना या साइकिल चलाना', 'Convenient aerobic movement for many fitness levels.', 'వివిధ స్థాయిల వారికి అనువైన ఏరోబిక్ కదలిక.', 'कई फिटनेस स्तरों के लिए सुविधाजनक एरोबिक गतिविधि।', '25–40 min', 'Easy–moderate', 'Choose a safe route and comfortable pace.'],
      ['Strength and core exercises', 'బలం మరియు కోర్ వ్యాయామాలు', 'शक्ति और कोर व्यायाम', 'Supports strength, posture, and function.', 'బలం, భంగిమ, పనితీరుకు తోడ్పడుతుంది.', 'शक्ति, मुद्रा और कार्यक्षमता में सहायक।', '20–35 min', 'Moderate', 'Keep good form; scale down if painful.'],
      ['Yoga and mobility', 'యోగ మరియు కదలిక వ్యాయామాలు', 'योग और गतिशीलता अभ्यास', 'Supports flexibility and body awareness.', 'వశ్యత, శరీర అవగాహనకు తోడ్పడుతుంది.', 'लचीलेपन और शरीर की समझ में सहायक।', '15–30 min', 'Easy', 'Use stable support for balance poses.'],
    ],
  },
  {
    age: ['40–50 years', '40–50 సంవత్సరాలు', '40–50 वर्ष'],
    intro: [
      'Favor sustainable activity, gentle progression, strength, and balance.',
      'కొనసాగించగల కార్యకలాపాలు, మెల్లని పురోగతి, బలం, సమతుల్యతకు ప్రాధాన్యత ఇవ్వండి.',
      'टिकाऊ गतिविधि, धीरे-धीरे प्रगति, शक्ति और संतुलन को प्राथमिकता दें।',
    ],
    items: [
      ['Walking or low-impact cardio', 'నడక లేదా తక్కువ ప్రభావ కార్డియో', 'टहलना या कम प्रभाव वाला कार्डियो', 'Supports regular movement with adjustable effort.', 'సర్దుబాటు చేయగల శ్రమతో క్రమమైన కదలికకు తోడ్పడుతుంది.', 'समायोज्य प्रयास के साथ नियमित गतिविधि में सहायक।', '20–40 min', 'Easy–moderate', 'Choose even surfaces; pause for symptoms.'],
      ['Light strength training', 'తేలికపాటి బలవర్ధక వ్యాయామం', 'हल्का शक्ति प्रशिक्षण', 'Helps maintain strength for everyday tasks.', 'రోజువారీ పనులకు అవసరమైన బలాన్ని నిలుపుకోవడంలో సహాయం.', 'रोज़मर्रा के कामों के लिए शक्ति बनाए रखने में मदद।', '15–30 min', 'Easy–moderate', 'Start light; seek guidance for joint concerns.'],
      ['Stretching and balance', 'సాగదీత మరియు సమతుల్యత వ్యాయామాలు', 'स्ट्रेचिंग और संतुलन अभ्यास', 'Supports mobility and steadiness.', 'కదలిక, స్థిరత్వానికి తోడ్పడుతుంది.', 'गतिशीलता और स्थिरता में सहायक।', '10–20 min', 'Easy', 'Use a chair or wall for support if needed.'],
    ],
  },
];

const foodCards = [
  ['Iron intake', 'ఇనుము పోషణ', 'आयरन का सेवन', 'Lentils, beans, leafy greens, fortified cereals; pair plant iron with vitamin-C foods.', 'పప్పులు, బీన్స్, ఆకుకూరలు, ఐరన్ కలిపిన ధాన్యాలు; మొక్కల ఇనుముతో విటమిన్-C ఆహారం తీసుకోండి.', 'दालें, फलियाँ, हरी पत्तेदार सब्ज़ियाँ, आयरन युक्त अनाज; पौधों से मिलने वाले आयरन के साथ विटामिन-C लें।', 'Helps provide dietary iron; food alone may not address a diagnosed deficiency.', 'ఆహార ఇనుమును అందిస్తుంది; నిర్ధారిత లోపానికి ఆహారం మాత్రమే సరిపోకపోవచ్చు.', 'आहार में आयरन देता है; निदान की गई कमी में केवल भोजन पर्याप्त न हो।'],
  ['Calcium intake', 'కాల్షియం పోషణ', 'कैल्शियम का सेवन', 'Milk, yogurt, calcium-set tofu, sesame, or fortified alternatives.', 'పాలు, పెరుగు, కాల్షియం కలిపిన టోఫు, నువ్వులు లేదా పోషకాలు కలిపిన ప్రత్యామ్నాయాలు.', 'दूध, दही, कैल्शियम युक्त टोफू, तिल या फोर्टिफाइड विकल्प।', 'Offers calcium as part of a varied diet.', 'సమతుల్య ఆహారంలో కాల్షియాన్ని అందిస్తుంది.', 'विविध आहार के हिस्से के रूप में कैल्शियम देता है।'],
  ['Low energy', 'తక్కువ శక్తి', 'कम ऊर्जा', 'Pair whole grains or other carbohydrates with protein foods such as eggs, beans, yogurt, or nuts.', 'తృణధాన్యాలు లేదా కార్బోహైడ్రేట్లను గుడ్లు, బీన్స్, పెరుగు లేదా గింజల వంటి ప్రోటీన్‌తో కలపండి.', 'साबुत अनाज या कार्बोहाइड्रेट को अंडे, फलियाँ, दही या मेवों जैसे प्रोटीन के साथ लें।', 'Balanced meals provide energy and nutrients.', 'సమతుల్య భోజనం శక్తి, పోషకాలను అందిస్తుంది.', 'संतुलित भोजन ऊर्जा और पोषक तत्व देता है।'],
  ['Digestive health', 'జీర్ణ ఆరోగ్యం', 'पाचन स्वास्थ्य', 'Vegetables, fruit, beans, oats, and whole grains; increase fiber gradually with fluids.', 'కూరగాయలు, పండ్లు, బీన్స్, ఓట్స్, తృణధాన్యాలు; నీటితో పాటు పీచును క్రమంగా పెంచండి.', 'सब्ज़ियाँ, फल, फलियाँ, ओट्स और साबुत अनाज; पानी के साथ फाइबर धीरे-धीरे बढ़ाएँ।', 'Dietary fiber supports regular digestion.', 'పీచు పదార్థం సాధారణ జీర్ణక్రియకు తోడ్పడుతుంది.', 'आहार फाइबर नियमित पाचन में सहायक है।'],
  ['Heart-friendly choices', 'గుండెకు మేలు చేసే ఎంపికలు', 'हृदय के अनुकूल विकल्प', 'Vegetables, fruit, legumes, whole grains, nuts, and unsaturated oils.', 'కూరగాయలు, పండ్లు, పప్పులు, తృణధాన్యాలు, గింజలు, అసంతృప్త కొవ్వు నూనెలు.', 'सब्ज़ियाँ, फल, दालें, साबुत अनाज, मेवे और असंतृप्त तेल।', 'A varied, minimally processed pattern can support heart health.', 'వైవిధ్యమైన, తక్కువ ప్రాసెసింగ్ ఉన్న ఆహారం గుండె ఆరోగ్యానికి తోడ్పడవచ్చు.', 'विविध और कम प्रसंस्कृत भोजन हृदय स्वास्थ्य में सहायक हो सकता है।'],
  ['Bone health', 'ఎముకల ఆరోగ్యం', 'हड्डियों का स्वास्थ्य', 'Calcium-rich foods; eggs or fortified foods can provide vitamin D.', 'కాల్షియం అధిక ఆహారం; గుడ్లు లేదా పోషకాలు కలిపిన ఆహారం విటమిన్-D అందించవచ్చు.', 'कैल्शियम वाले खाद्य; अंडे या फोर्टिफाइड खाद्य विटामिन-D दे सकते हैं।', 'Calcium and vitamin D are nutrients involved in bone health.', 'కాల్షియం, విటమిన్-D ఎముకల ఆరోగ్యానికి అవసరమైన పోషకాలు.', 'कैल्शियम और विटामिन-D हड्डियों के स्वास्थ्य से जुड़े पोषक तत्व हैं।'],
  ['Eye health', 'కంటి ఆరోగ్యం', 'आँखों का स्वास्थ्य', 'Carrots, pumpkin, sweet potato, spinach, and other colorful vegetables.', 'క్యారెట్, గుమ్మడికాయ, చిలగడదుంప, పాలకూర, ఇతర రంగుల కూరగాయలు.', 'गाजर, कद्दू, शकरकंद, पालक और अन्य रंगीन सब्ज़ियाँ।', 'These foods contain carotenoids, including provitamin-A compounds.', 'ఈ ఆహారాల్లో విటమిన్-Aకు మూలమైన కెరోటినాయిడ్లు ఉంటాయి.', 'इन खाद्य पदार्थों में प्रो-विटामिन-A सहित कैरोटिनॉइड होते हैं।'],
  ['Everyday variety', 'రోజువారీ వైవిధ్యమైన ఆహారం', 'रोज़ाना विविध भोजन', 'Choose a variety of fruits and vegetables, protein foods, and grains.', 'వివిధ పండ్లు, కూరగాయలు, ప్రోటీన్ ఆహారం, ధాన్యాలను ఎంచుకోండి.', 'विभिन्न फल-सब्ज़ियाँ, प्रोटीन खाद्य और अनाज चुनें।', 'Variety helps supply a range of nutrients.', 'వైవిధ్యం అనేక పోషకాలను అందించడంలో సహాయపడుతుంది.', 'विविधता कई पोषक तत्व देने में मदद करती है।'],
];

const difficulty = (language: Language, value: string) =>
  value === 'Easy'
    ? text(language, 'Easy', 'సులభం', 'आसान')
    : value === 'Moderate'
    ? text(language, 'Moderate', 'మధ్యస్థం', 'मध्यम')
    : text(language, 'Easy–moderate', 'సులభం–మధ్యస్థం', 'आसान–मध्यम');

export const HealthTipsPage: React.FC<HealthTipsPageProps> = ({ language }) => (
  <div className="space-y-8 animate-fadeIn">
    <header className="rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-700 p-6 sm:p-8 text-white">
      <div className="flex items-start gap-3">
        <HeartPulse className="mt-1 h-7 w-7 shrink-0" />
        <div>
          <h1 className="text-2xl font-extrabold">{text(language, 'Everyday Health Tips', 'రోజువారీ ఆరోగ్య సూచనలు', 'दैनिक स्वास्थ्य सुझाव')}</h1>
          <p className="mt-2 max-w-3xl text-sm text-emerald-50">
            {text(language, 'General education, not personalized medical advice. Choose activities and foods that suit your health, abilities, culture, and preferences.', 'ఇవి సాధారణ విద్యా సూచనలు మాత్రమే; వ్యక్తిగత వైద్య సలహా కాదు. మీ ఆరోగ్యం, సామర్థ్యం, సంస్కృతి, అభిరుచులకు తగిన వ్యాయామం, ఆహారాన్ని ఎంచుకోండి.', 'ये सामान्य शैक्षिक सुझाव हैं, व्यक्तिगत चिकित्सा सलाह नहीं। अपने स्वास्थ्य, क्षमता, संस्कृति और पसंद के अनुसार गतिविधि और भोजन चुनें।')}
          </p>
        </div>
      </div>
    </header>

    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-emerald-600" />
        <h2 className="text-xl font-bold text-slate-900">{text(language, 'Movement ideas by age group', 'వయస్సు ఆధారిత వ్యాయామ సూచనలు', 'आयु के अनुसार गतिविधि सुझाव')}</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {exerciseGroups.map((group, groupIndex) => (
          <article key={group.age[0]} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">{group.age[['en', 'te', 'hi'].indexOf(language)]}</h3>
            <p className="mt-1 text-sm text-slate-600">{group.intro[['en', 'te', 'hi'].indexOf(language)]}</p>
            <div className="mt-4 space-y-3">
              {group.items.map((item, index) => {
                const Icon = [Activity, Bike, Waves, Dumbbell][(groupIndex + index) % 4];
                const localeIndex = ['en', 'te', 'hi'].indexOf(language);
                return (
                  <div key={item[0]} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-800">{item[localeIndex]}</h4>
                        <p className="mt-1 text-xs text-slate-600">{item[3 + localeIndex]}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                          <span className="rounded-full bg-white px-2 py-1 text-slate-700">{text(language, 'Duration', 'వ్యవధి', 'अवधि')}: {item[6]}</span>
                          <span className="rounded-full bg-white px-2 py-1 text-slate-700">{text(language, 'Level', 'స్థాయి', 'स्तर')}: {difficulty(language, item[7])}</span>
                        </div>
                        <p className="mt-2 flex gap-1.5 text-xs text-amber-800">
                          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{text(language, 'Safety', 'భద్రత', 'सुरक्षा')}: {item[8]}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
      <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        {text(language, 'Start gently and adjust duration to your fitness level. Stop if you feel chest pain, severe dizziness, or unusual shortness of breath; seek appropriate care. Ask a clinician about activity if you have a health condition or concerns.', 'మీ సామర్థ్యానికి అనుగుణంగా మెల్లగా ప్రారంభించి వ్యవధిని మార్చుకోండి. ఛాతి నొప్పి, తీవ్రమైన తలతిరుగుడు లేదా అసాధారణ శ్వాస ఇబ్బంది ఉంటే ఆపి తగిన వైద్య సహాయం పొందండి. ఆరోగ్య సమస్యలు ఉంటే వైద్యుడిని సంప్రదించండి.', 'धीरे शुरू करें और अपनी क्षमता के अनुसार अवधि तय करें। सीने में दर्द, तेज़ चक्कर या असामान्य साँस फूलने पर रुकें और उचित सहायता लें। स्वास्थ्य समस्या होने पर गतिविधि के बारे में चिकित्सक से पूछें।')}
      </p>
    </section>

    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Leaf className="h-5 w-5 text-green-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">{text(language, 'What to Eat for Better Health', 'మెరుగైన ఆరోగ్యానికి ఏమి తినాలి', 'बेहतर स्वास्थ्य के लिए क्या खाएँ')}</h2>
          <p className="text-sm text-slate-600">{text(language, 'Food ideas are educational and do not diagnose or treat deficiencies.', 'ఈ ఆహార సూచనలు విద్యా ప్రయోజనాల కోసం మాత్రమే; లోపాలను నిర్ధారించవు లేదా చికిత్స చేయవు.', 'भोजन सुझाव शैक्षिक हैं; ये कमी का निदान या उपचार नहीं करते।')}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {foodCards.map((food) => {
          const localeIndex = ['en', 'te', 'hi'].indexOf(language);
          return (
            <article key={food[0]} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold text-slate-900">{food[localeIndex]}</h3>
              <p className="mt-2 text-sm text-slate-700"><strong>{text(language, 'Foods', 'ఆహారాలు', 'खाद्य')}:</strong> {food[3 + localeIndex]}</p>
              <p className="mt-2 text-xs text-slate-500"><strong>{text(language, 'Benefit', 'ప్రయోజనం', 'लाभ')}:</strong> {food[6 + localeIndex]}</p>
            </article>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">
        {text(language, 'A suspected deficiency, persistent fatigue, or digestive symptoms should be discussed with a qualified healthcare professional. Do not start supplements based only on this information.', 'లోపం అనుమానం, దీర్ఘకాల అలసట లేదా జీర్ణ సమస్యల గురించి అర్హత గల వైద్య నిపుణుడిని సంప్రదించండి. ఈ సమాచారంతో మాత్రమే సప్లిమెంట్లు ప్రారంభించవద్దు.', 'कमी का संदेह, लगातार थकान या पाचन लक्षण हों तो योग्य स्वास्थ्य पेशेवर से बात करें। केवल इस जानकारी के आधार पर सप्लीमेंट शुरू न करें।')}
      </p>
    </section>
  </div>
);
