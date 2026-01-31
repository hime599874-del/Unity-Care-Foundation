import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { useAuth } from '../App';
import { UserStatus, User as UserType } from '../types';
import { 
  Phone, User, ShieldCheck, ArrowRight, ArrowLeft, Camera, 
  CheckCircle2, X, Droplets, ChevronDown, Loader2, Globe, Search, MapPin, Briefcase, Calendar, Info, ScrollText, Package, HandHelping
} from 'lucide-react';

const BD_LOCATION_DATA: Record<string, string[]> = {
  "ঢাকা": ["সদর", "সাভার", "ধামরাই", "কেরানীগঞ্জ", "নবাবগঞ্জ", "দোহার"],
  "গাজীপুর": ["সদর", "কালিয়াকৈর", "শ্রীপুর", "কাপাসিয়া", "কালিগঞ্জ"],
  "নারায়ণগঞ্জ": ["সদর", "আড়াইহাজার", "বন্দর", "রূপগঞ্জ", "সোনারগাঁও"],
  "নরসিংদী": ["সদর", "বেলাবো", "মনোহরদী", "পলাশ", "রায়পুরা", "শিবপুর"],
  "মানিকগঞ্জ": ["সদর", "সিংগাইর", "শিবালয়", "সাটুরিয়া", "হরিরামপুর", "ঘিওর", "দৌলতপুর"],
  "মুন্সীগঞ্জ": ["সদর", "শ্রীনগর", "সিরাজদিখান", "লৌহজং", "গজারিয়া", "টঙ্গীবাড়ী"],
  "রাজবাড়ী": ["সদর", "গোয়ালন্দ", "পাংশা", "বালিয়াকান্দি", "কালুখালী"],
  "মাদারীপুর": ["সদর", "শিবচর", "কালকিনি", "রাজৈর"],
  "গোপালগঞ্জ": ["সদর", "কোটালীপাড়া", "কাশিয়ানী", "মুকসুদপুর", "টুঙ্গিপাড়া"],
  "ফরিদপুর": ["সদর", "আলফাডাঙ্গা", "ভাঙ্গা", "বোয়ালমারী", "চরভদ্রাসন", "মধুখালী", "নগরকান্দা", "সদপুর"],
  "শরীয়তপুর": ["সদর", "ডামুড্যা", "জাজিরা", "নড়িয়া", "ভেদরগঞ্জ", "গোসাইরহাট"],
  "টাঙ্গাইল": ["সদর", "বাসাইল", "ভূঞাপুর", "দেলদুয়ার", "ঘাটাইল", "গোপালপুর", "কালিহাতী", "মধুপুর", "মির্জাপুর", "নাগরপুর", "সখীপুর"],
  "কিশোরগঞ্জ": ["সদর", "অষ্টগ্রাম", "বাজিতপুর", "ভৈরব", "হোসেনপুর", "イトナ", "করিমগঞ্জ", "কটিয়াদী", "কুলিয়ারচর", "মিঠামইন", "নিকলী", "তাড়াইল"],
  "চট্টগ্রাম": ["সদর", "সীতাকুণ্ড", "মীরসরাই", "পটিয়া", "সন্দীপ", "বাঁশখালী", "আনোয়ারা", "চন্দনাইশ", "বোয়ালখালী", "লোহাগাড়া", "রাঙ্গুনিয়া", "রাউজান", "ফটিকছড়ি", "হাটহাজারী"],
  "কক্সবাজার": ["সদর", "চকরিয়া", "উখিয়া", "টেকনাফ", "রামু", "কুতুবদিয়া", "মহেশখালী", "পেকুয়া"],
  "কুমিল্লা": ["সদর", "চৌদ্দগ্রাম", "লাকসাম", "দেবিদ্বার", "দাউদকান্দি", "বুড়িচং", "বরুড়া", "ব্রাহ্মণপাড়া", "চাঁদপুর", "হোমনা", "লাঙ্গলকোট", "মেঘনা", "মুরাদনগর", "নাঙ্গলকোট", "তিটাস"],
  "ব্রাহ্মণবাড়িয়া": ["সদর", "আশুগঞ্জ", "বাঞ্ছারামপুর", "কসবা", "নবীনগর", "নাসিরনগর", "সরাইল", "বিজয়নগর"],
  "চাঁদপুর": ["সদর", "হাইমচর", "কচুয়া", "মতলব উত্তর", "মতলব দক্ষিণ", "শাহরাস্তি", "হাজীগঞ্জ"],
  "নোয়াখালী": ["সদর", "বেগমগঞ্জ", "হাতিয়া", "সেনবাগ", "চাটখিল", "সোনাইমুড়ী", "সুবর্ণচর", "কবিরহাট"],
  "লক্ষ্মীপুর": ["সদর", "রায়পুর", "রামগঞ্জ", "রামগতি", "কমলনগর"],
  "ফেনী": ["সদর", "দাগনভূঞা", "ছাগলনাইয়া", "পরশুরাম", "ফুলগাজী", "সোনাগাজী"],
  "খাগড়াছড়ি": ["সদর", "দীঘিনালা", "লক্ষ্মীছড়ি", "মহালছড়ি", "মানিকছড়ি", "মাটিরাঙ্গা", "পানছড়ি", "রামগড়"],
  "রাঙ্গামাটি": ["সদর", "বাঘাইছড়ি", "বরকল", "কাউখালী", "বিলাইছড়ি", "কাপ্তাই", "জুরাছড়ি", "লংগদু", "নানিয়ারচর", "রাজস্থলী"],
  "বান্দরবান": ["সদর", "আলীকদম", "নাইক্ষ্যংছড়ি", "রোয়াংছড়ি", "রুমা", "থানচি", "লামা"],
  "সিলেট": ["সদর", "বিয়ানীবাজার", "গোলাপগঞ্জ", "ফেঞ্চুগঞ্জ", "বালাগঞ্জ", "জৈন্তাপুর", "কানাইঘাট", "কোম্পানীগঞ্জ", "জকিগঞ্জ", "বিশ্বনাথ", "দক্ষিণ সুরমা"],
  "সুনামগঞ্জ": ["সদর", "ছাতক", "দোয়ারাবাজার", "দিরাই", "ধর্মপাশা", "জগন্নাথপুর", "জামালগঞ্জ", "তাহিরপুর", "বিশ্বম্ভরপুর", "শাল্লা"],
  "হবিগঞ্জ": ["সদর", "নবীগঞ্জ", "বাহুবল", " আজমিরীগঞ্জ", "বানিয়াচং", "মাধবপুর", "চুনারুঘাট", "লাখাই"],
  "মৌলভীবাজার": ["সদর", "শ্রীমঙ্গল", "কুলাউড়া", "রাজনগর", "কমলগঞ্জ", "জুড়ী", "বড়লেখা"],
  "রাজশাহী": ["সদর", "বাঘা", "পুঠিয়া", "দুর্গাপুর", "মোহনপুর", "তানোর", "পবা", "বাগমারা", "গোদাগাড়ী"],
  "বগুড়া": ["সদর", "শেরপুর", "শিবগঞ্জ", "ধুনট", "নন্দীগ্রাম", "সারিয়াকান্দি", "আদমদীঘি", "গাবতলী", "কাহালু", "শাহজাহানপুর", "সোনাতলা"],
  "পাবনা": ["সদর", "ঈশ্বরদী", "চাটমোহর", "সাঁথিয়া", "সুজানগর", "বেড়া", "আটঘরিয়া", "ফরিদপুর", "ভাঙ্গুড়া"],
  "সিরাজগঞ্জ": ["সদর", "বেলকুচি", "কামারখন্দ", "কাজীপুর", "রায়গঞ্জ", "শাহজাদপুর", "তাড়াশ", "উল্লাপাড়া", "চৌহালী"],
  "নাটোর": ["সদর", "বাগাতিপাড়া", "বড়াইগ্রাম", "লালপুর", "সিংড়া", "গুরুদাসপুর"],
  "নওগাঁ": ["সদর", "আত্রাই", "ধামইরহাট", "মান্দা", "মহাদেবপুর", "পত্নীতলা", "রানীনগর", "সাপাহার", "বদলগাছী", "নিয়ামতপুর", "পোরশা"],
  "চাঁপাইনবাবগঞ্জ": ["সদর", "গোমস্তাপুর", "নাচোল", "ভোলাহাট", "শিবগঞ্জ"],
  "জয়পুরহাট": ["সদর", "আক্কেলপুর", "কালাই", "ক্ষেতলাল", "পাঁচবিবি"],
  "খুলনা": ["সদর", "ডুমুরিয়া", "পাইকগাছা", "কয়রা", "দাকোপ", "ফুলতলা", "দিঘলিয়া", "রূপসা", "তেরখাদা"],
  "যশোর": ["সদর", "বাঘারপাড়া", "চৌগাছা", "ঝিকরগাছা", "কেশবপুর", "মণিরামপুর", "শার্শা", "অভয়নগর"],
  "সাতক্ষীরা": ["সদর", "আশাশুনি", "দেবহাটা", "কলারোয়া", "কালিগঞ্জ", "শ্যামনগর", "তালা"],
  "বাগেরহাট": ["সদর", "ফকিরহাট", "মোল্লাহাট", "চিতলমারী", "কচুয়া", "শরণখোলা", "মোড়েলগঞ্জ", "রামপাল", "মোংলা"],
  "কুষ্টিয়া": ["সদর", "কুমারখালী", "খোকসা", "মিরপুর", "দৌলতপুর", "ভেড়ামারা"],
  "মেহেরপুর": ["সদর", "গাংনী", "মুজিবনগর"],
  "চুয়াডাঙ্গা": ["সদর", "আলমডাঙ্গা", "দামুড়হুদা", "জীবননগর"],
  "ঝিনাইদহ": ["সদর", "হরিণাকুণ্ডু", "কালীগঞ্জ", "কোটচাঁদপুর", "মহেশপুর", "শৈলকুপা"],
  "মাগুরা": ["সদর", "শ্রীপুর", "শালিখা", "মহম্মদপুর"],
  "নড়াইল": ["সদর", "লোহাগড়া", "কালিয়া"],
  "রংপুর": ["সদর", "মিঠাপুকুর", "পীরগঞ্জ", "কাউনিয়া", "গঙ্গাচড়া", "বদরগঞ্জ", "পীরগাছা", "তারাগঞ্জ"],
  "দিনাজপুর": ["সদর", "বিরামপুর", "বীরগঞ্জ", "বোচাগঞ্জ", "ফুলবাড়ী", "ঘোড়াঘাট", "হাকিমপুর", "কাহারোল", "خانসামা", "নবাবগঞ্জ", "পার্বতীপুর", "চিরিরবন্দর"],
  "গাইবান্ধা": ["সদর", "ফুলছড়ি", "গোবিন্দগঞ্জ", "পলাশবাড়ী", "সাদুল্লাপুর", "সাঘাটা", "সুন্দরগঞ্জ"],
  "কুড়িগ্রাম": ["সদর", "ভুরুঙ্গামারী", "চিলমারী", "ফুলবাড়ী", "নাগেশ্বরী", "রাজারহাট", "উলিপুর", "রৌমারী", "রাজিবপুর"],
  "নীলফামারী": ["সদর", "ডোমার", "জলঢাকা", "কিশোরগঞ্জ", "সৈয়দপুর", "ডিমলা"],
  "লালমনিরহাট": ["সদর", "আদিতমারী", "কালীগঞ্জ", "হাতীবান্ধা", "পাটগ্রাম"],
  "পঞ্চগড়": ["সদর", "বোদা", "দেবীগঞ্জ", "তেঁতুলিয়া", "আটোয়ারী"],
  "ঠাকুরগাঁও": ["সদর", "বালিয়াডাঙ্গী", "পীরগঞ্জ", "রানীশংকৈল", "হরিপুর"],
  "বরিশাল": ["সদর", "বাকেরগঞ্জ", "মেহেন্দীগঞ্জ", "বাবুগগঞ্জ", "গৌরনদী", "বানারীপাড়া", "আগৈলঝাড়া", "হিজলা", "উজিরপুর", "মুলাদী"],
  "ভোলা": ["সদর", "বোরহানউদ্দিন", "চরফ্যাশন", "দৌলতখান", "লালমোহন", "মনপুরা", "তজুমদ্দিন"],
  "পটুয়াখালী": ["সদর", "বাউফল", "দশমিনা", "গলাচিপা", "কলাপাড়া", "মির্জাগঞ্জ", "দুমকি", "রাঙ্গাবালী"],
  "পিরোজপুর": ["সদর", "ভাণ্ডারিয়া", "মঠবাড়িয়া", "নাজিরপুর", "কাউখালী", "নেছারাবাদ", "ইন্দুরকানী"],
  "বরগুনা": ["সদর", "আমতলী", "বামনা", "পাথরঘাটা", "বেতাগী", "তালতলী"],
  "ঝালকাঠি": ["সদর", "কাঠালিয়া", "নলছিটি", "রাজাপুর"],
  "ময়মনসিংহ": ["সদর", "মুক্তাগাছা", "ফুলবাড়িয়া", "ত্রিশাল", "ভালুকা", "গফরগাঁও", "ঈশ্বরগঞ্জ", "নান্দাইল", "গৌরীপুর", "ফুলপুর", "তারাকান্দা", "হালুয়াঘাট", "ধোবাউড়া"],
  "জামালপুর": ["সদর", "সরিষাবাড়ী", "মেলান্দহ", "ইসলামপুর", "মাদারগঞ্জ", "বকশীগঞ্জ", "দেওয়ানগঞ্জ"],
  "নেত্রকোণা": ["সদর", "বারহাট্টা", "দুর্গাপুর", "কলমাকান্দা", "কেন্দুয়া", "মদন", "মোহনগঞ্জ", "পূর্বধলা", "খালিয়াজুরী", "আটপাড়া"],
  "শেরপুর": ["সদর", "নালিতাবাড়ী", "শ্রীবরদী", "ঝিনাইগাতী", "নকলা"]
};

const PROFESSIONS = ["ছাত্র", "শিক্ষক", "ডাক্তার", "ইঞ্জিনিয়ার", "ব্যবসায়ী", "সরকারি চাকরিজীবী", "বেসরকারি চাকরিজীবী", "ফ্রিল্যান্সার", "প্রবাসী", "গৃহিণী", "কৃষক", "শ্রমিক", "অন্যান্য"];

const COUNTRY_DIAL_CODES = [
  { name: 'বাংলাদেশ', code: '+880', flag: 'bd' },
  { name: 'ভারত', code: '+91', flag: 'in' },
  { name: 'সৌদি আরব', code: '+966', flag: 'sa' },
  { name: 'ইউএই', code: '+971', flag: 'ae' },
  { name: 'যুক্তরাজ্য', code: '+44', flag: 'gb' },
  { name: 'যুক্তরাষ্ট্র', code: '+1', flag: 'us' },
  { name: 'মালয়েশিয়া', code: '+60', flag: 'my' },
  { name: 'ইতালি', code: '+39', flag: 'it' },
  { name: 'কাতার', code: '+974', flag: 'qa' },
  { name: 'কুয়েত', code: '+965', flag: 'kw' },
  { name: 'সিঙ্গাপুর', code: '+65', flag: 'sg' },
  { name: 'ওমান', code: '+968', flag: 'om' },
  { name: 'অন্যান্য', code: '+', flag: 'un' }
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [selectedDialCode, setSelectedDialCode] = useState(COUNTRY_DIAL_CODES[0]);
  
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showBloodModal, setShowBloodModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showUpazilaModal, setShowUpazilaModal] = useState(false);
  const [showProfessionModal, setShowProfessionModal] = useState(false);
  
  const [locationSearch, setLocationSearch] = useState('');
  const [professionSearch, setProfessionSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<UserType>>({
    name: '',
    phone: '',
    bloodGroup: '',
    birthYear: undefined,
    profession: '',
    location: 'Bangladesh',
    policyConsent: false,
    address: { district: '', upazila: '', village: '' } as any
  });

  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (selectedDialCode.code === '+880' && cleaned.length > 11) return;
    setPhoneInput(cleaned);
  };

  const handleBirthYearChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 4) return;
    setFormData({...formData, birthYear: cleaned ? parseInt(cleaned) : undefined});
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    
    const fullPhone = selectedDialCode.code + phoneInput;
    const users = db.getUsers();
    const user = users.find(u => u.phone === fullPhone || u.phone === phoneInput);
    
    if (!user) {
      setError('এই নম্বরটি দিয়ে কোন অ্যাকাউন্ট পাওয়া যায়নি।');
      setIsSubmitting(false);
      return;
    }
    
    if (user.status !== UserStatus.APPROVED) {
      setError('আপনার অ্যাকাউন্ট এখনো এডমিন কর্তৃক অনুমোদিত হয়নি।');
      setIsSubmitting(false);
      return;
    }

    localStorage.setItem('current_user_id', user.id);
    setCurrentUser(user);
    navigate('/dashboard');
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.profilePic) return setError('একটি প্রোফাইল ছবি আপলোড করুন।');
      if (!formData.name || !phoneInput || !formData.bloodGroup || !formData.profession || !formData.birthYear) {
        return setError('রক্তের গ্রুপ ও জন্ম সালসহ সব তথ্য পূরণ করুন।');
      }
      if (formData.birthYear && (formData.birthYear < 1920 || formData.birthYear > new Date().getFullYear())) {
        return setError('সঠিক জন্ম সাল প্রদান করুন (যেমন: ১৯৯৫)।');
      }
    }
    if (step === 2) {
      if (formData.location === 'Bangladesh' && (!formData.address?.district || !formData.address?.upazila)) {
        return setError('জেলা এবং উপজেলা নির্বাচন করুন।');
      }
    }
    setStep(s => s + 1);
  };

  const handleRegister = async () => {
    if (isSubmitting) return;
    setError('');
    if (!formData.policyConsent) return setError('নীতিমালায় সম্মতি দেওয়া বাধ্যতামূলক।');
    setIsSubmitting(true);
    const fullPhone = selectedDialCode.code + phoneInput;
    try {
      await db.registerUser({ ...formData, phone: fullPhone } as any);
      setSuccess('আবেদন সফল হয়েছে! এডমিন অনুমোদনের অপেক্ষা করুন।');
      setTimeout(() => { setIsLogin(true); setStep(1); setSuccess(''); setIsSubmitting(false); }, 3000);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePic') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, [field]: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const filteredDistricts = useMemo(() => Object.keys(BD_LOCATION_DATA).filter(d => d.includes(locationSearch)).sort(), [locationSearch]);
  const filteredUpazilas = useMemo(() => {
    const d = formData.address?.district;
    return d ? BD_LOCATION_DATA[d].filter(u => u.includes(locationSearch)).sort() : [];
  }, [locationSearch, formData.address?.district]);

  const inputClass = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-teal-500 font-bold text-sm text-black transition-all";
  const selectBtnClass = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-left flex justify-between items-center hover:border-teal-500 transition-all active:scale-95 shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-4 font-['Hind_Siliguri']">
      <div className="w-full max-w-lg">
        <div className="text-center mb-4">
           <div className="w-14 h-14 bg-teal-600 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-2 border-4 border-white">
              <Package className="w-7 h-7 text-white" />
           </div>
           <h1 className="text-xl font-black text-slate-900 premium-text italic leading-none">Unity Care Foundation</h1>
           <p className="text-slate-400 font-bold text-[9px] mt-1.5 uppercase tracking-widest leading-none">{isLogin ? 'সদস্য লগইন' : `নিবন্ধন - ধাপ ${step}/৩`}</p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-white relative overflow-hidden">
          {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-bold border border-rose-100 flex items-center gap-3 animate-in shake duration-500"><X className="w-4 h-4" /> {error}</div>}
          {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-bold border border-emerald-100 flex items-center gap-3"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">মোবাইল নম্বর</p>
                <div className="flex gap-2">
                   <button type="button" onClick={() => setShowCountryModal(true)} className="flex items-center gap-2 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs">
                      <img src={selectedDialCode.flag === 'un' ? 'https://flagcdn.com/w40/un.png' : `https://flagcdn.com/w40/${selectedDialCode.flag}.png`} className="w-5 h-auto rounded-sm border border-slate-200" alt="Flag" />
                      <span>{selectedDialCode.code}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                   </button>
                   <input type="tel" className={inputClass} placeholder="নম্বর লিখুন..." value={phoneInput} onChange={e => handlePhoneChange(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-teal-700 active:scale-95 transition-all">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'লগইন করুন'}
              </button>
              <button type="button" onClick={() => { setIsLogin(false); setStep(1); }} className="w-full text-slate-500 font-bold text-[10px] uppercase tracking-wider mt-4">নতুন সদস্য নিবন্ধন</button>
            </form>
          ) : (
            <div className="space-y-4">
              {step === 1 && (
                <div className="space-y-3.5 animate-in slide-in-from-right duration-300">
                   <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                          {formData.profilePic ? <img src={formData.profilePic} className="w-full h-full object-cover" alt="Profile" /> : <User className="w-7 h-7 text-slate-200" />}
                        </div>
                        <label className="absolute -bottom-1 -right-1 bg-teal-600 p-2 rounded-xl text-white shadow-lg cursor-pointer border-2 border-white active:scale-90 transition-all">
                          <Camera className="w-4 h-4" />
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'profilePic')} />
                        </label>
                      </div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">প্রোফাইল ছবি</p>
                   </div>
                   
                   <input type="text" className={inputClass} placeholder="আপনার পূর্ণ নাম" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   
                   <div className="flex gap-2">
                      <button type="button" onClick={() => setShowCountryModal(true)} className="flex items-center gap-2 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs active:scale-95 transition-all">
                          <img src={selectedDialCode.flag === 'un' ? 'https://flagcdn.com/w40/un.png' : `https://flagcdn.com/w40/${selectedDialCode.flag}.png`} className="w-4 h-auto rounded-sm border border-slate-200" alt="Flag" />
                          <span>{selectedDialCode.code}</span>
                      </button>
                      <input type="tel" className={inputClass} placeholder="মোবাইল নম্বর" value={phoneInput} onChange={e => handlePhoneChange(e.target.value)} />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => { setShowProfessionModal(true); setProfessionSearch(''); }} className={selectBtnClass}>
                         <span className={`text-[10px] truncate ${formData.profession ? 'text-black' : 'text-slate-400'}`}>{formData.profession || 'পেশা নির্বাচন'}</span>
                         <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                        <input type="number" className={`${inputClass} pl-10 text-[10px]`} placeholder="জন্ম সাল (৪ সংখ্যা)" value={formData.birthYear || ''} onChange={e => handleBirthYearChange(e.target.value)} />
                      </div>
                   </div>

                   <button type="button" onClick={() => setShowBloodModal(true)} className={`${selectBtnClass} py-4 border-teal-100 bg-teal-50/30`}>
                     <div className="flex items-center gap-2">
                        <Droplets className="w-4.5 h-4.5 text-rose-500 fill-rose-500/20" />
                        <span className={`text-[10px] font-black ${formData.bloodGroup ? 'text-black' : 'text-slate-500'}`}>{formData.bloodGroup || 'রক্তের গ্রুপ নির্বাচন করুন'}</span>
                     </div>
                     <ChevronDown className="w-4 h-4 text-slate-400" />
                   </button>

                   <button onClick={nextStep} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-sm uppercase shadow-lg active:scale-95 transition-all">পরবর্তী ধাপ <ArrowRight className="w-4 h-4 inline ml-1" /></button>
                </div>
              )}
              
              {step === 2 && (
                <div className="space-y-3.5 animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setFormData({...formData, location: 'Bangladesh'})} className={`py-3 rounded-2xl font-black text-[10px] border-2 transition-all ${formData.location === 'Bangladesh' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>বাংলাদেশ</button>
                    <button onClick={() => setFormData({...formData, location: 'Abroad'})} className={`py-3 rounded-2xl font-black text-[10px] border-2 transition-all ${formData.location === 'Abroad' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>প্রবাস</button>
                  </div>
                  <div className="space-y-2.5">
                    <button onClick={() => { setShowDistrictModal(true); setLocationSearch(''); }} className={selectBtnClass}>
                       <span className={`text-[10px] ${formData.address?.district ? 'text-black' : 'text-slate-400'}`}>{formData.address?.district || 'জেলা নির্বাচন করুন'}</span>
                       <MapPin className="w-4 h-4 text-teal-500" />
                    </button>
                    <button onClick={() => { if (!formData.address?.district) return setError('আগে জেলা নির্বাচন করুন।'); setShowUpazilaModal(true); setLocationSearch(''); }} className={selectBtnClass}>
                       <span className={`text-[10px] ${formData.address?.upazila ? 'text-black' : 'text-slate-400'}`}>{formData.address?.upazila || 'উপজেলা নির্বাচন করুন'}</span>
                       <MapPin className="w-4 h-4 text-teal-500" />
                    </button>
                    <input type="text" className={inputClass} placeholder="গ্রাম / মহল্লা" value={formData.address?.village} onChange={e => setFormData({...formData, address: {...formData.address!, village: e.target.value}})} />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setStep(1)} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-all"><ArrowLeft className="w-5 h-5" /></button>
                    <button onClick={nextStep} className="flex-grow py-4 bg-teal-600 text-white rounded-2xl font-black shadow-lg uppercase text-sm active:scale-95 transition-all">পরবর্তী ধাপ</button>
                  </div>
                </div>
              )}
              
              {step === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="relative">
                    {/* Decorative Background Layer */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-[2.2rem] blur opacity-10"></div>
                    
                    <div className="relative p-5 bg-teal-50/80 backdrop-blur-sm rounded-[2rem] border border-teal-100 shadow-xl overflow-hidden">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-teal-600 text-white rounded-xl shadow-lg ring-2 ring-white"><ScrollText className="w-4 h-4" /></div>
                        <h3 className="text-teal-950 font-black text-xs uppercase tracking-wider leading-none">সংগঠনের মানবিক নীতিমালা ও শর্তাবলী</h3>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto pr-3 mb-5 space-y-3.5 text-[13px] font-bold text-slate-700 leading-relaxed custom-scrollbar">
                        <div className="flex gap-3 items-start group">
                           <span className="shrink-0 w-6 h-6 bg-teal-600 text-white text-[11px] flex items-center justify-center rounded-full font-black">১</span>
                           <p>সংগঠনের সকল কার্যক্রমে পূর্ণ স্বচ্ছতা ও আর্থিক সততা বজায় রাখা সদস্যদের প্রধান নৈতিক দায়িত্ব।</p>
                        </div>
                        <div className="flex gap-3 items-start group">
                           <span className="shrink-0 w-6 h-6 bg-teal-600 text-white text-[11px] flex items-center justify-center rounded-full font-black">২</span>
                           <p>সদস্যদের ব্যক্তিগত তথ্য নিরাপদ রাখা হবে এবং সংগঠনের প্রশাসনিক কাজ ব্যতীত অন্য কোথাও প্রকাশ করা হবে না।</p>
                        </div>
                        <div className="flex gap-3 items-start group">
                           <span className="shrink-0 w-6 h-6 bg-teal-600 text-white text-[11px] flex items-center justify-center rounded-full font-black">৩</span>
                           <p>জমাকৃত প্রতিটি অর্থ শুধুমাত্র আর্তমানবতার সেবা, দুর্যোগ মোকাবিলা ও সমাজকল্যাণমূলক খাতে ব্যয় করা হবে।</p>
                        </div>
                        <div className="flex gap-3 items-start group">
                           <span className="shrink-0 w-6 h-6 bg-teal-600 text-white text-[11px] flex items-center justify-center rounded-full font-black">৪</span>
                           <p>সংগঠনের নাম বা পরিচয় ব্যবহার করে ব্যক্তিগত ফায়দা বা কোনো রাজনৈতিক উস্কানিমূলক কাজ করা সম্পূর্ণ নিষিদ্ধ।</p>
                        </div>
                        <div className="flex gap-3 items-start group">
                           <span className="shrink-0 w-6 h-6 bg-teal-600 text-white text-[11px] flex items-center justify-center rounded-full font-black">৫</span>
                           <p>বিশেষ দুর্যোগকালীন সময়ে সাধ্য অনুযায়ী স্বেচ্ছাসেবী হিসেবে সশরীরে কাজ করার মানসিকতা থাকতে হবে।</p>
                        </div>
                        <div className="flex gap-3 items-start group">
                           <span className="shrink-0 w-6 h-6 bg-teal-600 text-white text-[11px] flex items-center justify-center rounded-full font-black">৬</span>
                           <p>সংগঠনের মাসিক ফি বা অনুদান নিয়মিত প্রদান করে সদস্যপদ সক্রিয় রাখতে হবে এবং সংগঠনের তহবিল বৃদ্ধিতে সহযোগিতা করতে হবে।</p>
                        </div>
                        <div className="flex gap-3 items-start group">
                           <span className="shrink-0 w-6 h-6 bg-teal-600 text-white text-[11px] flex items-center justify-center rounded-full font-black">৭</span>
                           <p>সংগঠনের শৃঙ্খলা পরিপন্থী বা মানবিক আদর্শের বাইরের কোনো কাজ প্রমাণিত হলে সদস্যপদ বাতিল করার অধিকার এডমিন প্যানেল রাখে।</p>
                        </div>
                        <div className="flex gap-3 items-start group">
                           <span className="shrink-0 w-6 h-6 bg-teal-600 text-white text-[11px] flex items-center justify-center rounded-full font-black">৮</span>
                           <p>যেকোনো মানবিক সমস্যায় অন্য সদস্যদের সাথে সমন্বয় করে দ্রুত ব্যবস্থা গ্রহণের মানসিকতা থাকতে হবে।</p>
                        </div>
                        <div className="flex gap-3 items-start group">
                           <span className="shrink-0 w-6 h-6 bg-teal-600 text-white text-[11px] flex items-center justify-center rounded-full font-black">৯</span>
                           <p>সংগঠনের তহবিলের অপচয় রোধ করতে হবে এবং প্রতিটি ব্যয়ের ভাউচার বা প্রমাণ সংরক্ষণ করতে হবে।</p>
                        </div>
                        <div className="flex gap-3 items-start group">
                           <span className="shrink-0 w-6 h-6 bg-teal-600 text-white text-[11px] flex items-center justify-center rounded-full font-black">১০</span>
                           <p>সংগঠনের সকল সিদ্ধান্ত গণতান্ত্রিক পদ্ধতিতে সদস্যদের মতামতের ভিত্তিতে এডমিন প্যানেল চূড়ান্ত করবে।</p>
                        </div>
                      </div>
                      
                      <label className="flex items-center gap-4 cursor-pointer p-4 bg-white rounded-2xl border-2 border-teal-100 shadow-md group active:scale-95 transition-all">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 rounded-md accent-teal-600 cursor-pointer shrink-0" 
                          checked={formData.policyConsent} 
                          onChange={e => setFormData({...formData, policyConsent: e.target.checked})} 
                        />
                        <span className="text-[11px] font-black text-teal-950 leading-tight uppercase tracking-tight">আমি সংগঠনের উপরের সকল নীতিমালা ও শর্তাবলী অত্যন্ত গুরুত্বের সাথে মেনে চলার অঙ্গীকার করছি।</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-all shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
                    <button onClick={handleRegister} disabled={isSubmitting} className="flex-grow py-4 bg-teal-600 text-white rounded-2xl font-black shadow-xl text-sm uppercase active:scale-95 transition-all ring-offset-2 ring-teal-500 hover:ring-2">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'নিবন্ধন সম্পন্ন করুন'}
                    </button>
                  </div>
                </div>
              )}
              <button type="button" onClick={() => { setIsLogin(true); setStep(1); }} className="w-full text-slate-500 font-bold text-[9px] uppercase tracking-widest mt-3 hover:text-teal-600 transition-colors">ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন</button>
            </div>
          )}
        </div>
      </div>
      
      {/* Blood Group Modal */}
      {showBloodModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xs rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-5 bg-rose-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3"><Droplets className="w-5 h-5 text-rose-200" /><h3 className="font-black text-lg">রক্তের গ্রুপ</h3></div>
                 <button onClick={() => setShowBloodModal(false)} className="p-1.5 bg-white/20 rounded-lg active:scale-90"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 grid grid-cols-2 gap-3">
                 {BLOOD_GROUPS.map(group => (
                   <button key={group} onClick={() => { setFormData({...formData, bloodGroup: group}); setShowBloodModal(false); }} className={`py-4 rounded-xl font-black text-lg border-2 transition-all active:scale-95 ${formData.bloodGroup === group ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}>
                      {group}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Country Modal */}
      {showCountryModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-300">
              <div className="p-5 bg-teal-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3"><Globe className="w-5 h-5 text-teal-200" /><h3 className="font-black text-lg">দেশ নির্বাচন করুন</h3></div>
                 <button onClick={() => setShowCountryModal(false)} className="p-1.5 bg-white/20 rounded-lg active:scale-90 transition-all"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-grow overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                 {COUNTRY_DIAL_CODES.map(country => (
                   <button 
                    key={country.code + country.name}
                    onClick={() => { setSelectedDialCode(country); setPhoneInput(''); setShowCountryModal(false); }}
                    className="w-full p-3.5 rounded-xl flex items-center justify-between hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group active:scale-95"
                   >
                      <div className="flex items-center gap-3">
                         <img src={country.flag === 'un' ? 'https://flagcdn.com/w40/un.png' : `https://flagcdn.com/w40/${country.flag}.png`} className="w-8 h-auto rounded border border-slate-100 shadow-sm" alt={country.name} />
                         <span className="font-black text-slate-800 text-sm">{country.name}</span>
                      </div>
                      <span className="font-black text-slate-400 group-hover:text-teal-600 transition-colors">{country.code}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* District Modal */}
      {showDistrictModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-300">
              <div className="p-5 bg-teal-600 text-white flex justify-between items-center">
                 <h3 className="font-black text-lg">জেলা নির্বাচন</h3>
                 <button onClick={() => setShowDistrictModal(false)} className="p-1.5 bg-white/20 rounded-lg active:scale-90 transition-all"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center shadow-inner">
                   <Search className="w-4 h-4 text-slate-400"/>
                   <input type="text" className="w-full p-3 text-xs font-bold bg-transparent outline-none placeholder:text-slate-300" placeholder="জেলা খুঁজুন..." value={locationSearch} onChange={e => setLocationSearch(e.target.value)}/>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto p-3 space-y-1 custom-scrollbar">
                 {filteredDistricts.map(d => (
                   <button key={d} onClick={() => { setFormData({...formData, address: {...formData.address!, district: d, upazila: ''}}); setShowDistrictModal(false); }} className={`w-full p-4 rounded-xl text-left font-black text-sm transition-all active:scale-95 ${formData.address?.district === d ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'hover:bg-slate-50'}`}>{d}</button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Upazila Modal */}
      {showUpazilaModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-300">
              <div className="p-5 bg-teal-600 text-white flex justify-between items-center">
                 <h3 className="font-black text-lg">উপজেলা ({formData.address?.district})</h3>
                 <button onClick={() => setShowUpazilaModal(false)} className="p-1.5 bg-white/20 rounded-lg active:scale-90 transition-all"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center shadow-inner">
                   <Search className="w-4 h-4 text-slate-400"/>
                   <input type="text" className="w-full p-3 text-xs font-bold bg-transparent outline-none placeholder:text-slate-300" placeholder="উপজেলা খুঁজুন..." value={locationSearch} onChange={e => setLocationSearch(e.target.value)}/>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto p-3 space-y-1 custom-scrollbar">
                 {filteredUpazilas.map(u => (
                   <button key={u} onClick={() => { setFormData({...formData, address: {...formData.address!, upazila: u}}); setShowUpazilaModal(false); }} className={`w-full p-4 rounded-xl text-left font-black text-sm transition-all active:scale-95 ${formData.address?.upazila === u ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'hover:bg-slate-50'}`}>{u}</button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Profession Modal */}
      {showProfessionModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-300">
              <div className="p-5 bg-teal-600 text-white flex justify-between items-center">
                 <h3 className="font-black text-lg">পেশা নির্বাচন</h3>
                 <button onClick={() => setShowProfessionModal(false)} className="p-1.5 bg-white/20 rounded-lg active:scale-90 transition-all"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center shadow-inner">
                   <Search className="w-4 h-4 text-slate-400"/>
                   <input type="text" className="w-full p-3 text-xs font-bold bg-transparent outline-none placeholder:text-slate-300" placeholder="পেশা খুঁজুন..." value={professionSearch} onChange={e => setProfessionSearch(e.target.value)}/>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto p-3 space-y-1 custom-scrollbar">
                 {PROFESSIONS.filter(p => p.includes(professionSearch)).map(p => (
                   <button key={p} onClick={() => { setFormData({...formData, profession: p}); setShowProfessionModal(false); }} className={`w-full p-4 rounded-xl text-left font-black text-sm transition-all active:scale-95 ${formData.profession === p ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'hover:bg-slate-50'}`}>{p}</button>
                 ))}
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #0d9488; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};

export default AuthPage;