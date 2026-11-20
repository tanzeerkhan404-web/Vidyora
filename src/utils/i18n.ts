export type AppLanguage =
  | 'en'
  | 'hi'
  | 'kn'
  | 'ta'
  | 'te'
  | 'ml'
  | 'mr'
  | 'bn'
  | 'gu'
  | 'pa'
  | 'ur'
  | 'or'
  | 'as'
  | 'sa'
  | 'es'
  | 'fr'
  | 'ar'
  | 'pt'
  | 'de'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'ru'
  | 'it';

export interface LanguageDefinition {
  code: AppLanguage;
  name: string;
  nativeName: string;
  group: 'indian' | 'international';
  dir: 'ltr' | 'rtl';
  speechLang: string;
  scriptFamily: string;
  uiCoverage: 'full-core' | 'core-ui';
}

export const SUPPORTED_LANGUAGES: LanguageDefinition[] = [
  // 14 Indian Languages
  { code: 'en', name: 'English', nativeName: 'English', group: 'indian', dir: 'ltr', speechLang: 'en-IN', scriptFamily: 'Latin', uiCoverage: 'full-core' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', group: 'indian', dir: 'ltr', speechLang: 'hi-IN', scriptFamily: 'Devanagari', uiCoverage: 'full-core' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', group: 'indian', dir: 'ltr', speechLang: 'kn-IN', scriptFamily: 'Kannada', uiCoverage: 'full-core' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', group: 'indian', dir: 'ltr', speechLang: 'ta-IN', scriptFamily: 'Tamil', uiCoverage: 'core-ui' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', group: 'indian', dir: 'ltr', speechLang: 'te-IN', scriptFamily: 'Telugu', uiCoverage: 'core-ui' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', group: 'indian', dir: 'ltr', speechLang: 'ml-IN', scriptFamily: 'Malayalam', uiCoverage: 'core-ui' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', group: 'indian', dir: 'ltr', speechLang: 'mr-IN', scriptFamily: 'Devanagari', uiCoverage: 'core-ui' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', group: 'indian', dir: 'ltr', speechLang: 'bn-IN', scriptFamily: 'Bengali', uiCoverage: 'core-ui' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', group: 'indian', dir: 'ltr', speechLang: 'gu-IN', scriptFamily: 'Gujarati', uiCoverage: 'core-ui' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', group: 'indian', dir: 'ltr', speechLang: 'pa-IN', scriptFamily: 'Gurmukhi', uiCoverage: 'core-ui' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', group: 'indian', dir: 'rtl', speechLang: 'ur-IN', scriptFamily: 'Perso-Arabic (RTL)', uiCoverage: 'core-ui' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', group: 'indian', dir: 'ltr', speechLang: 'or-IN', scriptFamily: 'Odia', uiCoverage: 'core-ui' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', group: 'indian', dir: 'ltr', speechLang: 'as-IN', scriptFamily: 'Bengali-Assamese', uiCoverage: 'core-ui' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', group: 'indian', dir: 'ltr', speechLang: 'sa-IN', scriptFamily: 'Devanagari', uiCoverage: 'core-ui' },

  // 10 International Languages
  { code: 'es', name: 'Spanish', nativeName: 'Español', group: 'international', dir: 'ltr', speechLang: 'es-ES', scriptFamily: 'Latin', uiCoverage: 'core-ui' },
  { code: 'fr', name: 'French', nativeName: 'Français', group: 'international', dir: 'ltr', speechLang: 'fr-FR', scriptFamily: 'Latin', uiCoverage: 'core-ui' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', group: 'international', dir: 'rtl', speechLang: 'ar-SA', scriptFamily: 'Arabic (RTL)', uiCoverage: 'core-ui' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', group: 'international', dir: 'ltr', speechLang: 'pt-BR', scriptFamily: 'Latin', uiCoverage: 'core-ui' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', group: 'international', dir: 'ltr', speechLang: 'de-DE', scriptFamily: 'Latin', uiCoverage: 'core-ui' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', group: 'international', dir: 'ltr', speechLang: 'ja-JP', scriptFamily: 'CJK', uiCoverage: 'core-ui' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', group: 'international', dir: 'ltr', speechLang: 'ko-KR', scriptFamily: 'Hangul', uiCoverage: 'core-ui' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', group: 'international', dir: 'ltr', speechLang: 'zh-CN', scriptFamily: 'Han', uiCoverage: 'core-ui' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', group: 'international', dir: 'ltr', speechLang: 'ru-RU', scriptFamily: 'Cyrillic', uiCoverage: 'core-ui' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', group: 'international', dir: 'ltr', speechLang: 'it-IT', scriptFamily: 'Latin', uiCoverage: 'core-ui' },
];

export type TranslationKey =
  | 'nav.home'
  | 'nav.explore'
  | 'nav.lectures'
  | 'nav.aiBuddy'
  | 'nav.ecosystem'
  | 'nav.community'
  | 'nav.lab'
  | 'nav.plans'
  | 'nav.packages'
  | 'nav.charity'
  | 'nav.notes'
  | 'nav.dashboard'
  | 'nav.signIn'
  | 'nav.search'
  | 'nav.allApps'
  | 'banner.translationNote';

type TranslationDict = Record<TranslationKey, string>;

const EN_DICT: TranslationDict = {
  'nav.home': 'Home',
  'nav.explore': 'Explore',
  'nav.lectures': 'Lectures',
  'nav.aiBuddy': 'AI Tutor',
  'nav.ecosystem': 'Exams & Skills',
  'nav.community': 'Community',
  'nav.lab': 'Labs & Voice',
  'nav.plans': 'Plans',
  'nav.packages': 'Packages',
  'nav.charity': 'Charity Pledge',
  'nav.notes': 'Free Notes',
  'nav.dashboard': 'Dashboard',
  'nav.signIn': 'Sign In',
  'nav.search': 'Search lessons, notes, concepts...',
  'nav.allApps': 'All Apps',
  'banner.translationNote':
    'Interface language is active. Core textbook terms stay accurate in their original academic terminology.',
};

const TRANSLATIONS: Record<AppLanguage, Partial<TranslationDict>> = {
  en: EN_DICT,
  hi: {
    'nav.home': 'होम',
    'nav.explore': 'सीखें',
    'nav.lectures': 'लेक्चर्स',
    'nav.aiBuddy': 'AI ट्यूटर',
    'nav.ecosystem': 'परीक्षा व कौशल',
    'nav.community': 'कम्युनिटी',
    'nav.lab': 'लैब व वॉइस',
    'nav.plans': 'प्लान्स',
    'nav.packages': 'पैकेज',
    'nav.charity': 'चैरिटी रिपोर्ट',
    'nav.notes': 'फ्री नोट्स',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.signIn': 'साइन इन',
    'nav.search': 'लेसन, नोट्स या विषय खोजें...',
    'nav.allApps': 'मेनू',
    'banner.translationNote':
      'मुख्य इंटरफ़ेस हिन्दी में है। वैज्ञानिक/गणितीय शब्दावली सटीक रखने के लिए मूल शैक्षणिक रूप में सुरक्षित है।',
  },
  kn: {
    'nav.home': 'ಮುಖಪುಟ',
    'nav.explore': 'ಕಲಿಯಿರಿ',
    'nav.lectures': 'ಉಪನ್ಯಾಸಗಳು',
    'nav.aiBuddy': 'AI ಟ್ಯೂಟರ್',
    'nav.ecosystem': 'ಪರೀಕ್ಷೆ & ಕೌಶಲ್ಯ',
    'nav.community': 'ಸಮುದಾಯ',
    'nav.lab': 'ಲ್ಯಾಬ್ & ಧ್ವನಿ',
    'nav.plans': 'ಪ್ಲಾನ್‌ಗಳು',
    'nav.packages': 'ಪ್ಯಾಕೇಜ್‌ಗಳು',
    'nav.charity': 'ದಾನ ಪಾರದರ್ಶಕತೆ',
    'nav.notes': 'ಉಚಿತ ನೋಟ್ಸ್',
    'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'nav.signIn': 'ಸೈನ್ ಇನ್',
    'nav.search': 'ಪಾಠಗಳು, ನೋಟ್ಸ್ ಹುಡುಕಿ...',
    'nav.allApps': 'ಮೆನು',
    'banner.translationNote':
      'ಪ್ರಮುಖ ನ್ಯಾವಿಗೇಶನ್ ಕನ್ನಡದಲ್ಲಿದೆ. ಶೈಕ್ಷಣಿಕ ಪದಗಳು ಮತ್ತು ಮೂಲ ಪಾಠಗಳು ನಿಖರತೆಗಾಗಿ ಮೂಲ ಭಾಷೆಯಲ್ಲಿವೆ.',
  },
  ta: {
    'nav.home': 'முகப்பு',
    'nav.explore': 'ஆராய்க',
    'nav.lectures': 'விரிவுரைகள்',
    'nav.aiBuddy': 'AI ஆசிரியர்',
    'nav.ecosystem': 'தேர்வு & திறன்',
    'nav.community': 'சமூகம்',
    'nav.lab': 'ஆய்வகம்',
    'nav.plans': 'திட்டங்கள்',
    'nav.packages': 'தொகுப்புகள்',
    'nav.charity': 'அறக்கொடை',
    'nav.notes': 'குறிப்புகள்',
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.signIn': 'உள்நுழைக',
    'nav.search': 'பாடங்கள், குறிப்புகளைத் தேடுங்கள்...',
    'nav.allApps': 'பட்டியல்',
  },
  te: {
    'nav.home': 'హోమ్',
    'nav.explore': 'నేర్చుకోండి',
    'nav.lectures': 'లెక్చర్లు',
    'nav.aiBuddy': 'AI ట్యూటర్',
    'nav.ecosystem': 'పరీక్షలు & నైపుణ్యాలు',
    'nav.community': 'కమ్యూనిటీ',
    'nav.lab': 'ల్యాబ్ & వాయిస్',
    'nav.plans': 'ప్లాన్‌లు',
    'nav.packages': 'ప్యాకేజీలు',
    'nav.charity': 'దాన నివేదిక',
    'nav.notes': 'ఉచిత నోట్స్',
    'nav.dashboard': 'డ్యాష్‌బోర్డ్',
    'nav.signIn': 'సైన్ ఇన్',
    'nav.search': 'పాఠాలు, నోట్స్ వెతకండి...',
    'nav.allApps': 'మెనూ',
  },
  ml: {
    'nav.home': 'ഹോം',
    'nav.explore': 'പഠിക്കുക',
    'nav.lectures': 'ക്ലാസുകൾ',
    'nav.aiBuddy': 'AI ട്യൂട്ടർ',
    'nav.ecosystem': 'പരീക്ഷ & നൈപുണ്യം',
    'nav.community': 'സമൂഹം',
    'nav.lab': 'ലാബ്',
    'nav.plans': 'പ്ലാനുകൾ',
    'nav.packages': 'പാക്കേജുകൾ',
    'nav.charity': 'ചാരിറ്റി',
    'nav.notes': 'സൗജന്യ നോട്ടുകൾ',
    'nav.dashboard': 'ഡാഷ്ബോർഡ്',
    'nav.signIn': 'സൈൻ ഇൻ',
    'nav.search': 'പാഠങ്ങൾ തിരയുക...',
    'nav.allApps': 'മെനു',
  },
  mr: {
    'nav.home': 'मुख्यपृष्ठ',
    'nav.explore': 'शिका',
    'nav.lectures': 'व्याख्याने',
    'nav.aiBuddy': 'AI शिक्षक',
    'nav.ecosystem': 'परीक्षा व कौशल्य',
    'nav.community': 'समुदाय',
    'nav.lab': 'लॅब व व्हॉइस',
    'nav.plans': 'योजना',
    'nav.packages': 'पॅकेजेस',
    'nav.charity': 'दान पारदर्शकता',
    'nav.notes': 'मोफत नोट्स',
    'nav.dashboard': 'डॅशबोर्ड',
    'nav.signIn': 'साइन इन',
    'nav.search': 'धडे, नोट्स शोधा...',
    'nav.allApps': 'मेनू',
  },
  bn: {
    'nav.home': 'হোম',
    'nav.explore': 'শিখুন',
    'nav.lectures': 'লেকচার',
    'nav.aiBuddy': 'AI টিউটর',
    'nav.ecosystem': 'পরীক্ষা ও দক্ষতা',
    'nav.community': 'কমিউনিটি',
    'nav.lab': 'ল্যাব ও ভয়েস',
    'nav.plans': 'প্ল্যান',
    'nav.packages': 'প্যাকেজ',
    'nav.charity': 'দান প্রতিবেদন',
    'nav.notes': 'ফ্রি নোটস',
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.signIn': 'সাইন ইন',
    'nav.search': 'পাঠ ও নোট খুঁজুন...',
    'nav.allApps': 'মেনু',
  },
  gu: {
    'nav.home': 'હોમ',
    'nav.explore': 'શીખો',
    'nav.lectures': 'લેક્ચર્સ',
    'nav.aiBuddy': 'AI ટ્યુટર',
    'nav.ecosystem': 'પરીક્ષા અને કૌશલ્ય',
    'nav.community': 'સમુદાય',
    'nav.lab': 'લેબ અને વૉઇસ',
    'nav.plans': 'પ્લાન્સ',
    'nav.packages': 'પેકેજ',
    'nav.charity': 'દાન અહેવાલ',
    'nav.notes': 'ફ્રી નોટ્સ',
    'nav.dashboard': 'ડેશબોર્ડ',
    'nav.signIn': 'સાઇન ઇન',
    'nav.search': 'પાઠ અને નોટ્સ શોધો...',
    'nav.allApps': 'મેનુ',
  },
  pa: {
    'nav.home': 'ਹੋਮ',
    'nav.explore': 'ਸਿੱਖੋ',
    'nav.lectures': 'ਲੈਕਚਰ',
    'nav.aiBuddy': 'AI ਟਿਊਟਰ',
    'nav.ecosystem': 'ਪ੍ਰੀਖਿਆ ਅਤੇ ਹੁਨਰ',
    'nav.community': 'ਭਾਈਚਾਰਾ',
    'nav.lab': 'ਲੈਬ',
    'nav.plans': 'ਪਲਾਨ',
    'nav.packages': 'ਪੈਕੇਜ',
    'nav.charity': 'ਦਾਨ ਰਿਪੋਰਟ',
    'nav.notes': 'ਮੁਫ਼ਤ ਨੋਟਸ',
    'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ',
    'nav.signIn': 'ਸਾਈਨ ਇਨ',
    'nav.search': 'ਪਾਠ ਅਤੇ ਨੋਟਸ ਖੋਜੋ...',
    'nav.allApps': 'ਮੇਨੂ',
  },
  ur: {
    'nav.home': 'ہوم',
    'nav.explore': 'سیکھیں',
    'nav.lectures': 'لیکچرز',
    'nav.aiBuddy': 'AI ٹیوٹر',
    'nav.ecosystem': 'امتحانات اور ہنر',
    'nav.community': 'کمیونٹی',
    'nav.lab': 'لیب اور آواز',
    'nav.plans': 'پلانز',
    'nav.packages': 'پیکجز',
    'nav.charity': 'خیراتی شفافیت',
    'nav.notes': 'مفت نوٹس',
    'nav.dashboard': 'ڈیش بورڈ',
    'nav.signIn': 'سائن ان',
    'nav.search': 'اسباق اور نوٹس تلاش کریں...',
    'nav.allApps': 'مینو',
    'banner.translationNote':
      'اردو (دائیں سے بائیں RTL) انٹرفیس فعال ہے۔ تعلیمی اصطلاحات درستگی کے لیے اصل زبان میں محفوظ ہیں۔',
  },
  or: {
    'nav.home': 'ମୁଖ୍ୟ ପୃଷ୍ଠା',
    'nav.explore': 'ଶିଖନ୍ତୁ',
    'nav.lectures': 'ଲେକଚର୍',
    'nav.aiBuddy': 'AI ଶିକ୍ଷକ',
    'nav.ecosystem': 'ପରୀକ୍ଷା ଓ ଦକ୍ଷତା',
    'nav.community': 'ସମ୍ପ୍ରଦାୟ',
    'nav.lab': 'ଲ୍ୟାବ୍',
    'nav.plans': 'ଯୋଜନା',
    'nav.packages': 'ପ୍ୟାକେଜ୍',
    'nav.charity': 'ଦାନ ବିବରଣୀ',
    'nav.notes': 'ମାଗଣା ନୋଟ୍',
    'nav.dashboard': 'ଡ୍ୟାସବୋର୍ଡ',
    'nav.signIn': 'ସାଇନ୍ ଇନ୍',
    'nav.search': 'ପାଠ ଖୋଜନ୍ତୁ...',
    'nav.allApps': 'ମେନୁ',
  },
  as: {
    'nav.home': 'মূল পৃষ্ঠা',
    'nav.explore': 'শিকক',
    'nav.lectures': 'বক্তৃতা',
    'nav.aiBuddy': 'AI শিক্ষক',
    'nav.ecosystem': 'পৰীক্ষা আৰু দক্ষতা',
    'nav.community': 'সমাজ',
    'nav.lab': 'লেব',
    'nav.plans': 'পৰিকল্পনা',
    'nav.packages': 'পেকেজ',
    'nav.charity': 'দান প্ৰতিবেদন',
    'nav.notes': 'বিনামূলীয়া নোট',
    'nav.dashboard': 'ডেশ্ববৰ্ড',
    'nav.signIn': 'চাইন ইন',
    'nav.search': 'পাঠ বিচাৰক...',
    'nav.allApps': 'মেনু',
  },
  sa: {
    'nav.home': 'गृहम्',
    'nav.explore': 'अन्वेषणम्',
    'nav.lectures': 'व्याख्यानानि',
    'nav.aiBuddy': 'AI गुरुः',
    'nav.ecosystem': 'परीक्षा कौशलम्',
    'nav.community': 'समुदायः',
    'nav.lab': 'प्रयोगशाला',
    'nav.plans': 'योजनाः',
    'nav.packages': 'पाठ्यक्रमाः',
    'nav.charity': 'दानपारदर्शिता',
    'nav.notes': 'निःशुल्कटिप्पण्याः',
    'nav.dashboard': 'नियन्त्रणफलकम्',
    'nav.signIn': 'प्रवेशः',
    'nav.search': 'पाठान् अन्विष्यतु...',
    'nav.allApps': 'सूची',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.explore': 'Explorar',
    'nav.lectures': 'Clases',
    'nav.aiBuddy': 'Tutor IA',
    'nav.ecosystem': 'Exámenes y Habilidades',
    'nav.community': 'Comunidad',
    'nav.lab': 'Laboratorio',
    'nav.plans': 'Planes',
    'nav.packages': 'Paquetes',
    'nav.charity': 'Transparencia',
    'nav.notes': 'Apuntes Gratis',
    'nav.dashboard': 'Panel',
    'nav.signIn': 'Iniciar Sesión',
    'nav.search': 'Buscar lecciones, apuntes...',
    'nav.allApps': 'Menú',
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.explore': 'Explorer',
    'nav.lectures': 'Cours',
    'nav.aiBuddy': 'Tuteur IA',
    'nav.ecosystem': 'Examens & Compétences',
    'nav.community': 'Communauté',
    'nav.lab': 'Labo & Voix',
    'nav.plans': 'Forfaits',
    'nav.packages': 'Parcours',
    'nav.charity': 'Impact Caritatif',
    'nav.notes': 'Notes Gratuites',
    'nav.dashboard': 'Tableau de bord',
    'nav.signIn': 'Connexion',
    'nav.search': 'Rechercher des cours...',
    'nav.allApps': 'Menu',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.explore': 'استكشف',
    'nav.lectures': 'المحاضرات',
    'nav.aiBuddy': 'المعلم الذكي',
    'nav.ecosystem': 'الاختبارات والمهارات',
    'nav.community': 'المجتمع',
    'nav.lab': 'المختبر والصوت',
    'nav.plans': 'الخطط',
    'nav.packages': 'الباقات',
    'nav.charity': 'الشفافية الخيرية',
    'nav.notes': 'ملخصات مجانية',
    'nav.dashboard': 'لوحة الطالب',
    'nav.signIn': 'تسجيل الدخول',
    'nav.search': 'ابحث عن الدروس والملخصات...',
    'nav.allApps': 'القائمة',
    'banner.translationNote':
      'تم تفعيل الواجهة العربية (من اليمين إلى اليسار RTL). المصطلحات العلمية محفوظة بدقة.',
  },
  pt: {
    'nav.home': 'Início',
    'nav.explore': 'Explorar',
    'nav.lectures': 'Aulas',
    'nav.aiBuddy': 'Tutor IA',
    'nav.ecosystem': 'Exames e Habilidades',
    'nav.community': 'Comunidade',
    'nav.lab': 'Laboratório',
    'nav.plans': 'Planos',
    'nav.packages': 'Pacotes',
    'nav.charity': 'Transparência',
    'nav.notes': 'Notas Grátis',
    'nav.dashboard': 'Painel',
    'nav.signIn': 'Entrar',
    'nav.search': 'Pesquisar aulas e notas...',
    'nav.allApps': 'Menu',
  },
  de: {
    'nav.home': 'Start',
    'nav.explore': 'Entdecken',
    'nav.lectures': 'Vorlesungen',
    'nav.aiBuddy': 'KI-Tutor',
    'nav.ecosystem': 'Prüfungen & Skills',
    'nav.community': 'Community',
    'nav.lab': 'Labor & Sprache',
    'nav.plans': 'Tarife',
    'nav.packages': 'Pakete',
    'nav.charity': 'Spendenbericht',
    'nav.notes': 'Gratis Notizen',
    'nav.dashboard': 'Dashboard',
    'nav.signIn': 'Anmelden',
    'nav.search': 'Lektionen, Notizen suchen...',
    'nav.allApps': 'Menü',
  },
  ja: {
    'nav.home': 'ホーム',
    'nav.explore': '探す',
    'nav.lectures': '講義',
    'nav.aiBuddy': 'AIチューター',
    'nav.ecosystem': '試験とスキル',
    'nav.community': 'コミュニティ',
    'nav.lab': '実験室・音声',
    'nav.plans': 'プラン',
    'nav.packages': 'パッケージ',
    'nav.charity': '寄付の透明性',
    'nav.notes': '無料ノート',
    'nav.dashboard': 'ダッシュボード',
    'nav.signIn': 'ログイン',
    'nav.search': 'レッスンやノートを検索...',
    'nav.allApps': 'メニュー',
  },
  ko: {
    'nav.home': '홈',
    'nav.explore': '탐색',
    'nav.lectures': '강의',
    'nav.aiBuddy': 'AI 튜터',
    'nav.ecosystem': '시험 및 스킬',
    'nav.community': '커뮤니티',
    'nav.lab': '실험실 & 음성',
    'nav.plans': '요금제',
    'nav.packages': '패키지',
    'nav.charity': '기부 투명성',
    'nav.notes': '무료 노트',
    'nav.dashboard': '대시보드',
    'nav.signIn': '로그인',
    'nav.search': '수업, 노트 검색...',
    'nav.allApps': '메뉴',
  },
  zh: {
    'nav.home': '首页',
    'nav.explore': '探索',
    'nav.lectures': '课程讲座',
    'nav.aiBuddy': 'AI 导师',
    'nav.ecosystem': '考试与技能',
    'nav.community': '学习社区',
    'nav.lab': '实验室与语音',
    'nav.plans': '会员方案',
    'nav.packages': '学习包',
    'nav.charity': '公益透明',
    'nav.notes': '免费笔记',
    'nav.dashboard': '学习看板',
    'nav.signIn': '登录',
    'nav.search': '搜索课程、笔记...',
    'nav.allApps': '菜单',
  },
  ru: {
    'nav.home': 'Главная',
    'nav.explore': 'Обзор',
    'nav.lectures': 'Лекции',
    'nav.aiBuddy': 'ИИ-репетитор',
    'nav.ecosystem': 'Экзамены и навыки',
    'nav.community': 'Сообщество',
    'nav.lab': 'Лаборатория',
    'nav.plans': 'Тарифы',
    'nav.packages': 'Пакеты',
    'nav.charity': 'Благотворительность',
    'nav.notes': 'Заметки',
    'nav.dashboard': 'Кабинет',
    'nav.signIn': 'Войти',
    'nav.search': 'Поиск уроков и заметок...',
    'nav.allApps': 'Меню',
  },
  it: {
    'nav.home': 'Home',
    'nav.explore': 'Esplora',
    'nav.lectures': 'Lezioni',
    'nav.aiBuddy': 'Tutor IA',
    'nav.ecosystem': 'Esami e Competenze',
    'nav.community': 'Comunità',
    'nav.lab': 'Laboratorio',
    'nav.plans': 'Piani',
    'nav.packages': 'Pacchetti',
    'nav.charity': 'Trasparenza',
    'nav.notes': 'Appunti Gratis',
    'nav.dashboard': 'Dashboard',
    'nav.signIn': 'Accedi',
    'nav.search': 'Cerca lezioni, appunti...',
    'nav.allApps': 'Menu',
  },
};

export function getLanguageMeta(code: string): LanguageDefinition {
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0]
  );
}

export function isSupportedLanguage(code: string): code is AppLanguage {
  return SUPPORTED_LANGUAGES.some((l) => l.code === code);
}

export function filterLanguages(
  query: string,
  group: 'all' | 'indian' | 'international' = 'all'
): LanguageDefinition[] {
  const q = query.trim().toLowerCase();
  return SUPPORTED_LANGUAGES.filter((l) => {
    if (group !== 'all' && l.group !== group) return false;
    if (!q) return true;
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });
}

export function t(lang: AppLanguage, key: TranslationKey): string {
  return TRANSLATIONS[lang]?.[key] ?? EN_DICT[key];
}

export const APP_LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES.map((l) => ({
  code: l.code,
  label: l.name,
  nativeLabel: l.nativeName,
  dir: l.dir,
}));
