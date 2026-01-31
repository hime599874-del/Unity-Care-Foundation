import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { useAuth } from '../App';
import { UserStatus, User as UserType } from '../types';
import { 
  Phone, User, ShieldCheck, ArrowRight, ArrowLeft, Camera, 
  CheckCircle2, X, Droplets, ChevronDown, Loader2, Globe, Heart
} from 'lucide-react';

const COUNTRY_DIAL_CODES = [
  { name: 'বাংলাদেশ', code: '+880', flag: 'bd' },
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<UserType>>({
    name: '',
    phone: '',
    bloodGroup: '',
    location: 'Bangladesh',
    policyConsent: false
  });

  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();

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

    // Persist session
    localStorage.setItem('current_user_id', user.id);
    setCurrentUser(user);
    navigate('/dashboard');
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.profilePic) return setError('একটি প্রোফাইল ছবি আপলোড করুন।');
      if (!formData.name || !phoneInput || !formData.bloodGroup) return setError('সব তথ্য পূরণ করুন।');
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
      setTimeout(() => {
        setIsLogin(true);
        setStep(1);
        setSuccess('');
        setIsSubmitting(false);
      }, 3000);
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

  const inputClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-teal-500 font-bold text-sm text-black transition-all";

  return (
    <div className="min-h-screen bg-[#F3F6F9] flex items-center justify-center p-6 py-12 font-['Hind_Siliguri']">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
           <div className="w-20 h-20 bg-teal-600 rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-4 border-4 border-white">
              <Heart className="w-10 h-10 text-white fill-current" />
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight premium-text">Unity Care Foundation</h1>
           <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">
             {isLogin ? 'সদস্য লগইন' : `নিবন্ধন - ধাপ ${step}/৩`}
           </p>
        </div>

        <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl border border-white">
          {error && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-bold border border-rose-100 flex items-center gap-3"><X className="w-5 h-5" /> {error}</div>}
          {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[11px] font-bold border border-emerald-100 flex items-center gap-3"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">মোবাইল নম্বর</p>
                <div className="flex gap-2">
                   <button type="button" onClick={() => setShowCountryModal(true)} className="flex items-center gap-2 px-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs">
                      <img src={`https://flagcdn.com/w40/${selectedDialCode.flag}.png`} className="w-5 h-auto rounded-sm" />
                      <span>{selectedDialCode.code}</span>
                   </button>
                   <input type="tel" className={inputClass} placeholder="নম্বর লিখুন..." value={phoneInput} onChange={e => setPhoneInput(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-teal-700 transition-all flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'লগইন করুন'}
              </button>
              <button type="button" onClick={() => { setIsLogin(false); setStep(1); }} className="w-full text-slate-500 font-bold text-xs uppercase tracking-wider mt-6">নতুন সদস্য নিবন্ধন করুন</button>
            </form>
          ) : (
            <div className="space-y-6">
              {step === 1 && (
                <div className="space-y-5">
                   <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-28 h-28 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                          {formData.profilePic ? <img src={formData.profilePic} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-slate-200" />}
                        </div>
                        <label className="absolute -bottom-1 -right-1 bg-teal-600 p-2.5 rounded-xl text-white shadow-lg cursor-pointer">
                          <Camera className="w-5 h-5" />
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'profilePic')} />
                        </label>
                      </div>
                   </div>
                   <input type="text" className={inputClass} placeholder="আপনার পূর্ণ নাম" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   <button onClick={() => setShowBloodModal(true)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-left flex justify-between items-center">
                     <span className={formData.bloodGroup ? 'text-black' : 'text-slate-400'}>{formData.bloodGroup || 'রক্তের গ্রুপ'}</span>
                     <Droplets className="w-5 h-5 text-rose-500" />
                   </button>
                   <button onClick={nextStep} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg">পরবর্তী ধাপ</button>
                </div>
              )}
              {/* Other steps logic follows similarly... */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setFormData({...formData, location: 'Bangladesh'})} className={`py-4 rounded-2xl font-black text-xs border-2 ${formData.location === 'Bangladesh' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>বাংলাদেশ</button>
                    <button onClick={() => setFormData({...formData, location: 'Abroad'})} className={`py-4 rounded-2xl font-black text-xs border-2 ${formData.location === 'Abroad' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>প্রবাস</button>
                  </div>
                  <button onClick={nextStep} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black shadow-lg">পরবর্তী ধাপ</button>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="p-5 bg-teal-50 rounded-[2rem] border border-teal-100">
                    <label className="flex items-start gap-4 cursor-pointer">
                      <input type="checkbox" className="w-6 h-6 mt-1 accent-teal-600" checked={formData.policyConsent} onChange={e => setFormData({...formData, policyConsent: e.target.checked})} />
                      <span className="text-[11px] font-bold text-teal-800">আমি সংগঠনের নীতিমালা মেনে চলার অঙ্গীকার করছি।</span>
                    </label>
                  </div>
                  <button onClick={handleRegister} disabled={isSubmitting} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black shadow-xl flex items-center justify-center">
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'সাবমিট করুন'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;