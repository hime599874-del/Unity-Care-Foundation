
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { useAuth } from '../App';
import { UserStatus, User as UserType } from '../types';
import { 
  Phone, User, ShieldCheck, ArrowRight, ArrowLeft, Camera, 
  CheckCircle2, X, Droplets, ChevronDown, Loader2, Globe, Search, MapPin, Briefcase, Calendar, Info, ScrollText, Package, HandHelping, 
  FileCheck, ShieldAlert, HeartHandshake, Zap, Scale, Trash2
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
  "কিশোরগঞ্জ": ["সদর", "অষ্টগ্রাম", "বাজিতপুর", "ভৈরব", "হোসেনপুর", "করিমগঞ্জ", "কটিয়াদী", "কুলিয়ারচর", "মিঠামইন", "নিকলী", "তাড়াইল"],
  "চট্টগ্রাম": ["সদর", "সীতাকুণ্ড", "মীরসরাই", "পটিিয়া", "সন্দীপ", "বাঁশখালী", "আনোয়ারা", "চন্দনাইশ", "বোয়ালখালী", "লোহাগাড়া", "রাঙ্গুনিয়া", "রাউজান", "ফটিকছড়ি", "হাটহাজারী"],
  "কক্সবাজার": ["সদর", "চকরিয়া", "উখিয়া", "টেকনাফ", "রামু", "কুতুবদিিয়া", "মহেশখালী", "পেকুয়া"],
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
  "পাবনা": ["সদর", " ঈশ্বরদী", "চাটমোহর", "সাঁথিয়া", "সুজানগর", "বেড়া", "আটঘরিয়া", "ফریدপুর", "ভাঙ্গুড়া"],
  "সিরাজগঞ্জ": ["সদর", "বেলকুচি", "কামারখন্দ", "কাজীপুর", "রায়গঞ্জ", "শাহজাদপুর", "তাড়াশ", "উল্লাপাড়া", "চৌহালী"],
  "নাটোর": ["সদর", "বাগাতিপাড়া", "বড়াইগ্রাম", "লালপুর", "সিংড়া", "গুরুদাসপুর"],
  "নওগাঁ": ["সদর", "আত্রাই", "ধামইরহাট", "মান্দা", "মহাদেবপুর", "পত্নীতলা", "রানীনগর", "সাপাহার", "বদলগাছী", "নিয়ামতপুর", "পোরশা"],
  "চাঁপাইনবাবগঞ্জ": ["সদর", "গোমস্তাপুর", "নাচোল", "ভোলাহাট", "শিবগঞ্জ"],
  "জয়পুরহাট": ["সদর", "আক্কেলপুর", "কালাই", "ক্ষেতলাল", "পাঁচবিবি"],
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
  "দিনাজপুর": ["সদর", "বিরামপুর", "বীরগঞ্জ", "বোচাগঞ্জ", "ফুলবাড়ী", "ঘোড়াঘাট", "হাকিমপুর", "কাহারোল", "খানসামা", "নবাবগঞ্জ", "পার্বতীপুর", "চিরিরবন্দর"],
  "গাইবান্ধা": ["সদর", "ফুলছড়ি", "গোবিন্দগঞ্জ", "পলাশবাড়ী", "সাদুল্লাপুর", "সাঘাটা", "সুন্দরগঞ্জ"],
  "কুড়িগ্রাম": ["সদর", "ভুরুঙ্গামারী", "চিলমারী", "ফুলবাড়ী", "নাগেশ্বরী", "রাজারহাট", "উলিপুর", "রৌমারী", "রাজিবপুর"],
  "নীলফামারী": ["সদর", "ডোমার", "জলঢাকা", "কিশোরগঞ্জ", "সৈয়দপুর", "ডিমলা"],
  "লালমনিরহাট": ["সদর", "আদিতমারী", "কালীগঞ্জ", "হাতীবান্ধা", "পাটগ্রাম"],
  "পঞ্চগড়": ["সদর", "বোদা", "দেবীগঞ্জ", "তেঁতুলিয়া", "আটোয়ারী"],
  "ঠাকুরগাঁও": ["সদর", "বালিয়াডাঙ্গী", "পীরগঞ্জ", "রানীশংকৈল", "হরিপুর"],
  "বরিশাল": ["সদর", "বাকেরগঞ্জ", "মেহেন্দীগঞ্জ", "বাবুগঞ্জ", "গৌরনদী", "বানারীপাড়া", "আগৈলঝাড়া", "হিজলা", "উজিরপুর", "মুলাদী"],
  "ভোলা": ["সদর", "বোরহানউদ্দিন", "চরফ্যাশন", "দৌলতখান", "লালমোহন", "মনপুরা", "তজুমদ্দিন"],
  "পটুয়াখালী": ["সদর", "বাউফল", "দশমিনা", "গলাচিপা", "কলাপাড়া", "মির্জাগঞ্জ", "দুমকি", "রাঙ্গাবালী"],
  "পিরোজপুর": ["সদর", "ভাণ্ডারিিয়া", "মঠবাড়িয়া", "নাজিরপুর", "কাউখালী", "নেছারাবাদ", "ইন্দুরকানী"],
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

const compressImage = (base64Str: string, maxWidth = 400, maxHeight = 400): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => resolve(base64Str);
  });
};

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
    address: { district: '', upazila: '', union: '', ward: '', village: '' } as any
  });

  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (selectedDialCode.code === '+880' && cleaned.length > 11) return;
    setPhoneInput(cleaned);
  };

  const getNormalizedPhone = () => {
    let raw = phoneInput;
    if (selectedDialCode.code === '+880' && raw.startsWith('0')) {
      raw = raw.substring(1);
    }
    return selectedDialCode.code + raw;
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
    
    try {
      const users = db.getUsers();
      const normalizeForMatch = (phone: string) => phone.replace(/\D/g, '').slice(-10);
      const searchDigits = normalizeForMatch(phoneInput);
      
      const user = users.find(u => {
        const userDigits = normalizeForMatch(u.phone);
        return userDigits === searchDigits;
      });
      
      if (!user) {
        setError('এই নম্বরটি দিয়ে কোন অ্যাকাউন্ট পাওয়া যায়নি। সঠিক নম্বর দিন অথবা নতুন নিবন্ধন করুন।');
        setIsSubmitting(false);
        return;
      }
      
      if (user.status === UserStatus.PENDING) {
        setError('আপনার আবেদনটি এখনো এডমিন অনুমোদনের অপেক্ষায় আছে। অনুমোদিত হলে লগইন করতে পারবেন।');
        setIsSubmitting(false);
        return;
      }

      if (user.status === UserStatus.REJECTED) {
        setError('দুঃখিত, আপনার আবেদনটি বাতিল করা হয়েছে। বিস্তারিত জানতে এডমিনের সাথে যোগাযোগ করুন।');
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem('current_user_id', user.id);
      setCurrentUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError('লগইন করতে সমস্যা হয়েছে। দয়া করে ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।');
      setIsSubmitting(false);
    }
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
    
    const fullPhone = getNormalizedPhone();
    
    // CRITICAL: Check for duplicate registration
    const existingUser = db.getUsers().find(u => {
        const normalize = (p: string) => p.replace(/\D/g, '').slice(-10);
        return normalize(u.phone) === normalize(fullPhone);
    });
    
    if (existingUser) {
        setError('এই নম্বরটি দিয়ে ইতিমধ্যে আবেদন করা হয়েছে। অনুগ্রহ করে অনুমোদনের অপেক্ষা করুন বা লগইন করুন।');
        return;
    }

    if (!formData.policyConsent) return setError('নীতিমালায় সম্মতি দেওয়া বাধ্যতামূলক।');
    
    setIsSubmitting(true);
    
    try {
      const registrationData = {
        name: formData.name,
        phone: fullPhone,
        bloodGroup: formData.bloodGroup,
        birthYear: formData.birthYear,
        profession: formData.profession,
        location: formData.location,
        profilePic: formData.profilePic,
        address: {
          district: formData.address?.district || '',
          upazila: formData.address?.upazila || '',
          village: formData.address?.village || ''
        },
        policyConsent: true
      };
      
      await db.registerUser(registrationData);
      setSuccess('আবেদন সফল হয়েছে! এডমিন অনুমোদনের অপেক্ষা করুন।');
      
      setTimeout(() => { 
        setIsLogin(true); 
        setStep(1); 
        setSuccess(''); 
        setIsSubmitting(false); 
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে।');
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePic') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setFormData(prev => ({ ...prev, [field]: compressed }));
        } catch (e) {
          setError('ছবি প্রসেস করতে সমস্যা হয়েছে।');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredDistricts = useMemo(() => Object.keys(BD_LOCATION_DATA).filter(d => d.includes(locationSearch)).sort(), [locationSearch]);
  const filteredUpazilas = useMemo(() => {
    const d = formData.address?.district;
    return d ? BD_LOCATION_DATA[d].filter(u => u.includes(locationSearch)).sort() : [];
  }, [locationSearch, formData.address?.district]);

  const inputClass = "w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-sm text-black transition-all shadow-sm";
  const selectBtnClass = "w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs text-left flex justify-between items-center hover:border-teal-500 transition-all active:scale-95 shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-10 font-['Hind_Siliguri']">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-teal-600 rounded-[1.5rem] shadow-xl flex items-center justify-center mx-auto mb-4 border-4 border-white rotate-3">
              <Package className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-2xl font-black text-slate-900 premium-text italic leading-none">Unity Care Foundation</h1>
           <p className="text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-[0.3em] leading-none">{isLogin ? 'সদস্য লগইন' : `নিবন্ধন - ধাপ ${step}/৩`}</p>
        </div>

        <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
          {error && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100 flex items-center gap-4 animate-in shake duration-500"><X className="w-5 h-5" /> {error}</div>}
          {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-bold border border-emerald-100 flex items-center gap-4"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-4">মোবাইল নম্বর</p>
                <div className="flex gap-3">
                   <button type="button" onClick={() => setShowCountryModal(true)} className="flex items-center gap-3 px-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs shadow-sm hover:border-teal-300">
                      <img src={selectedDialCode.flag === 'un' ? 'https://flagcdn.com/w40/un.png' : `https://flagcdn.com/w40/${selectedDialCode.flag}.png`} className="w-6 h-auto rounded-sm border border-slate-200" alt="Flag" />
                      <span>{selectedDialCode.code}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                   </button>
                   <input type="tel" className={inputClass} placeholder="নম্বর লিখুন..." value={phoneInput} onChange={e => handlePhoneChange(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-teal-700 active:scale-95 transition-all border-b-4 border-teal-800">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'লগইন করুন'}
              </button>
              <button type="button" onClick={() => { setIsLogin(false); setStep(1); }} className="w-full text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-6">নতুন সদস্য নিবন্ধন</button>
            </form>
          ) : (
            <div className="space-y-6">
              {step === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                   <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner ring-4 ring-slate-50">
                          {formData.profilePic ? <img src={formData.profilePic} className="w-full h-full object-cover" alt="Profile" /> : <User className="w-10 h-10 text-slate-200" />}
                        </div>
                        <label className="absolute -bottom-1 -right-1 bg-teal-600 p-2.5 rounded-xl text-white shadow-xl cursor-pointer border-2 border-white active:scale-90 transition-all">
                          <Camera className="w-5 h-5" />
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'profilePic')} />
                        </label>
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4">আপনার ছবি দিন</p>
                   </div>
                   
                   <input type="text" className={inputClass} placeholder="আপনার পূর্ণ নাম" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   
                   <div className="flex gap-3">
                      <button type="button" onClick={() => setShowCountryModal(true)} className="flex items-center gap-3 px-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs active:scale-95 transition-all shadow-sm">
                          <img src={selectedDialCode.flag === 'un' ? 'https://flagcdn.com/w40/un.png' : `https://flagcdn.com/w40/${selectedDialCode.flag}.png`} className="w-6 h-auto rounded-sm border border-slate-200" alt="Flag" />
                          <span>{selectedDialCode.code}</span>
                      </button>
                      <input type="tel" className={inputClass} placeholder="মোবাইল নম্বর" value={phoneInput} onChange={e => handlePhoneChange(e.target.value)} />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => { setShowProfessionModal(true); setProfessionSearch(''); }} className={selectBtnClass}>
                         <span className={`text-[11px] truncate ${formData.profession ? 'text-black' : 'text-slate-400'}`}>{formData.profession || 'পেশা নির্বাচন'}</span>
                         <Briefcase className="w-4 h-4 text-slate-400" />
                      </button>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                        <input type="number" className={`${inputClass} pl-10 text-[11px]`} placeholder="জন্ম সাল (৪ সংখ্যা)" value={formData.birthYear || ''} onChange={e => handleBirthYearChange(e.target.value)} />
                      </div>
                   </div>

                   <button type="button" onClick={() => setShowBloodModal(true)} className={`${selectBtnClass} py-5 border-rose-100 bg-rose-50/20`}>
                     <div className="flex items-center gap-3">
                        <Droplets className="w-7 h-7 text-rose-500 fill-rose-500/10" />
                        <span className={`text-base font-black ${formData.bloodGroup ? 'text-black' : 'text-slate-500'}`}>{formData.bloodGroup || 'রক্তের গ্রুপ'}</span>
                     </div>
                     <ChevronDown className="w-6 h-6 text-slate-400" />
                   </button>

                   <button onClick={nextStep} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black text-lg uppercase shadow-xl border-b-4 border-teal-800 active:scale-95 transition-all">পরবর্তী ধাপ <ArrowRight className="w-6 h-6 inline ml-2" /></button>
                </div>
              )}
              
              {step === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setFormData({...formData, location: 'Bangladesh'})} className={`py-5 rounded-2xl font-black text-xs border-2 transition-all shadow-sm ${formData.location === 'Bangladesh' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>বাংলাদেশ</button>
                    <button onClick={() => setFormData({...formData, location: 'Abroad'})} className={`py-5 rounded-2xl font-black text-xs border-2 transition-all shadow-sm ${formData.location === 'Abroad' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>প্রবাস</button>
                  </div>
                  <div className="space-y-3">
                    <button onClick={() => { setShowDistrictModal(true); setLocationSearch(''); }} className={selectBtnClass}>
                       <span className={`text-base ${formData.address?.district ? 'text-black' : 'text-slate-400'}`}>{formData.address?.district || 'জেলা নির্বাচন করুন'}</span>
                       <MapPin className="w-5 h-5 text-teal-500" />
                    </button>
                    <button onClick={() => { if (!formData.address?.district) return setError('আগে জেলা নির্বাচন করুন।'); setShowUpazilaModal(true); setLocationSearch(''); }} className={selectBtnClass}>
                       <span className={`text-base ${formData.address?.upazila ? 'text-black' : 'text-slate-400'}`}>{formData.address?.upazila || 'উপজেলা নির্বাচন করুন'}</span>
                       <MapPin className="w-5 h-5 text-teal-500" />
                    </button>
                    <input type="text" className={inputClass} placeholder="গ্রাম / মহল্লা" value={formData.address?.village} onChange={e => setFormData({...formData, address: {...formData.address!, village: e.target.value}})} />
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button onClick={() => setStep(1)} className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-all shadow-sm border-2 border-slate-100"><ArrowLeft className="w-7 h-7" /></button>
                    <button onClick={nextStep} className="flex-grow py-5 bg-teal-600 text-white rounded-2xl font-black shadow-2xl uppercase text-lg border-b-4 border-teal-800 active:scale-95 transition-all">পরবর্তী ধাপ</button>
                  </div>
                </div>
              )}
              
              {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                  <div className="bg-white rounded-[2rem] overflow-hidden">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-100 shrink-0">
                        <FileCheck className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 premium-text leading-tight">নীতিমালা ও শর্তাবলী</h3>
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Unity Care Foundation Charter</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 max-h-[24rem] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                      {[
                        { icon: <ShieldCheck className="w-5 h-5" />, text: "সংগঠনের সকল কার্যক্রমে পূর্ণ স্বচ্ছতা ও সততা বজায় রাখা আপনার প্রধান নৈতিক দায়িত্ব।" },
                        { icon: <Info className="w-5 h-5" />, text: "আপনার ব্যক্তিগত তথ্য সংগঠনের কাজের বাইরে অন্য কোথাও প্রকাশ বা ব্যবহার করা হবে না।" },
                        { icon: <HeartHandshake className="w-5 h-5" />, text: "জমাকৃত প্রতিটি অর্থ শুধুমাত্র আর্তমানবতার সেবা, দুর্যোগ মোকাবিলা ও সমাজকল্যাণে ব্যয় হবে।" },
                        { icon: <ShieldAlert className="w-5 h-5" />, text: "সংগঠনের পরিচয় ব্যবহার করে কোনো ব্যক্তিগত ফায়দা বা রাজনৈতিক কাজ করা সম্পূর্ণ নিষিদ্ধ।" },
                        { icon: <Zap className="w-5 h-5" />, text: "বিশেষ দুর্যোগে স্বেচ্ছাসেবী হিসেবে সশরীরে কাজ করার মানসিক প্রস্তুতি থাকতে হবে।" },
                        { icon: <Scale className="w-5 h-5" />, text: "সদস্যপদ সক্রিয় রাখতে মাসিক ফি বা অনুদান নিয়মিত প্রদান করে তহবিলে সহযোগিতা করতে হবে।" },
                        { icon: <Trash2 className="w-5 h-5" />, text: "সংগঠনের আদর্শ পরিপন্থী কোনো কাজের প্রমাণ পাওয়া গেলে সদস্যপদ বাতিল হতে পারে।" }
                      ].map((policy, i) => (
                        <div key={i} className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-teal-50/30 transition-colors group">
                           <div className="shrink-0 w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                              {policy.icon}
                           </div>
                           <p className="text-[13px] font-bold text-slate-700 leading-relaxed pt-1">{policy.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                       <label className="flex items-start gap-4 p-5 bg-teal-600 rounded-3xl cursor-pointer shadow-xl shadow-teal-100 active:scale-[0.98] transition-all border-b-4 border-teal-800 group">
                          <div className="pt-1">
                            <input 
                              type="checkbox" 
                              className="w-6 h-6 rounded-lg accent-white cursor-pointer ring-2 ring-white/20" 
                              checked={formData.policyConsent} 
                              onChange={e => setFormData({...formData, policyConsent: e.target.checked})} 
                            />
                          </div>
                          <span className="text-white font-black text-[13px] leading-tight uppercase group-hover:opacity-90">আমি সংগঠনের সকল নীতিমালা ও শর্তাবলী অত্যন্ত গুরুত্বের সাথে মেনে চলার অঙ্গীকার করছি।</span>
                       </label>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => setStep(2)} className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-all shadow-sm border-2 border-slate-100"><ArrowLeft className="w-8 h-8" /></button>
                    <button onClick={handleRegister} disabled={isSubmitting} className="flex-grow py-5 bg-slate-900 text-white rounded-3xl font-black shadow-2xl text-xl uppercase active:scale-95 transition-all border-b-4 border-black tracking-widest">
                      {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : 'নিবন্ধন সম্পন্ন করুন'}
                    </button>
                  </div>
                </div>
              )}
              <button type="button" onClick={() => { setIsLogin(true); setStep(1); }} className="w-full text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-6">ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন</button>
            </div>
          )}
        </div>
      </div>
      
      {showCountryModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
             <div className="p-6 bg-teal-600 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-sm">দেশ নির্বাচন করুন</h3>
                <button onClick={() => setShowCountryModal(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="max-h-96 overflow-y-auto p-4 space-y-2">
                {COUNTRY_DIAL_CODES.map(c => (
                  <button key={c.code} onClick={() => { setSelectedDialCode(c); setShowCountryModal(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all font-black text-xs text-slate-700">
                    <img src={c.flag === 'un' ? 'https://flagcdn.com/w40/un.png' : `https://flagcdn.com/w40/${c.flag}.png`} className="w-7 h-auto rounded-sm border border-slate-200" alt={c.name} />
                    <span>{c.name}</span>
                    <span className="ml-auto text-teal-600">{c.code}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showBloodModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
             <div className="p-6 bg-rose-600 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-sm">রক্তের গ্রুপ</h3>
                <button onClick={() => setShowBloodModal(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="p-6 grid grid-cols-4 gap-3">
                {BLOOD_GROUPS.map(bg => (
                  <button key={bg} onClick={() => { setFormData({...formData, bloodGroup: bg}); setShowBloodModal(false); }} className={`p-4 rounded-xl font-black text-sm border-2 transition-all ${formData.bloodGroup === bg ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    {bg}
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showDistrictModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col h-[70vh]">
             <div className="p-6 bg-teal-600 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-sm">জেলা নির্বাচন</h3>
                <button onClick={() => setShowDistrictModal(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="p-4 bg-slate-50 border-b">
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                   <Search className="w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="জেলা খুঁজুন..." className="w-full text-xs font-black outline-none" value={locationSearch} onChange={e => setLocationSearch(e.target.value)} />
                </div>
             </div>
             <div className="overflow-y-auto p-4 space-y-1">
                {filteredDistricts.map(d => (
                  <button key={d} onClick={() => { setFormData({...formData, address: {...formData.address!, district: d, upazila: ''}}); setShowDistrictModal(false); }} className="w-full text-left p-4 hover:bg-slate-50 rounded-xl font-black text-xs text-slate-700">
                    {d}
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showUpazilaModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col h-[70vh]">
             <div className="p-6 bg-teal-600 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-sm">উপজেলা নির্বাচন</h3>
                <button onClick={() => setShowUpazilaModal(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="p-4 bg-slate-50 border-b">
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                   <Search className="w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="উপজেলা খুঁজুন..." className="w-full text-xs font-black outline-none" value={locationSearch} onChange={e => setLocationSearch(e.target.value)} />
                </div>
             </div>
             <div className="overflow-y-auto p-4 space-y-1">
                {filteredUpazilas.map(u => (
                  <button key={u} onClick={() => { setFormData({...formData, address: {...formData.address!, upazila: u}}); setShowUpazilaModal(false); }} className="w-full text-left p-4 hover:bg-slate-50 rounded-xl font-black text-xs text-slate-700">
                    {u}
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showProfessionModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col h-[70vh]">
             <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-sm">পেশা নির্বাচন</h3>
                <button onClick={() => setShowProfessionModal(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="p-4 bg-slate-50 border-b">
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                   <Search className="w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="পেশা খুঁজুন..." className="w-full text-xs font-black outline-none" value={professionSearch} onChange={e => setProfessionSearch(e.target.value)} />
                </div>
             </div>
             <div className="overflow-y-auto p-4 space-y-1">
                {PROFESSIONS.filter(p => p.includes(professionSearch)).map(p => (
                  <button key={p} onClick={() => { setFormData({...formData, profession: p}); setShowProfessionModal(false); }} className="w-full text-left p-4 hover:bg-slate-50 rounded-xl font-black text-xs text-slate-700">
                    {p}
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
