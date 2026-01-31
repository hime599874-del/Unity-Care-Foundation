
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { useAuth } from '../App';
import { UserStatus, User as UserType } from '../types';
import { 
  Phone, User, ShieldCheck, ArrowRight, ArrowLeft, Camera, 
  MapPin, GraduationCap, CheckCircle2, X, Droplets, Globe, Briefcase, ChevronDown
} from 'lucide-react';

const BD_DISTRICTS = ["বাগেরহাট", "বান্দরবান", "বরগুনা", "বরিশাল", "ভোলা", "বগুড়া", "ব্রাহ্মণবাড়িয়া", "চাঁদপুর", "চট্টগ্রাম", "চুয়াডাঙ্গা", "কুমিল্লা", "কক্সবাজার", "ঢাকা", "দিনাজপুর", "ফরিদপুর", "ফেনী", "গাইবান্ধা", "গাজীপুর", "গোপালগঞ্জ", "হবিগঞ্জ", "জামালপুর", "যশোর", "ঝালকাঠি", "ঝিনাইদহ", "জয়পুরহাট", "খাগড়াছড়ি", "খুলনা", "কিশোরগঞ্জ", "কুড়িগ্রাম", "কুষ্টিয়া", "লক্ষ্মীপুর", "লালমনিরহাট", "মাদারীপুর", "মাগুরা", "মানিকগঞ্জ", "মেহেরপুর", "মৌলভীবাজার", "মুন্সীগঞ্জ", "ময়মনসিংহ", "নওগাঁ", "নড়াইল", "নারায়ণগঞ্জ", "নরসিংদী", "নাটোর", "নেত্রকোনা", "নীলফামারী", "নোয়াখালী", "পাবনা", "পঞ্চগড়", "পটুয়াখালী", "পিরোজপুর", "রাজবাড়ী", "রাজশাহী", "রাঙামাটি", "রংপুর", "সাতক্ষীরা", "শরীয়তপুর", "শেরপুর", "সিরাজগঞ্জ", "সুনামগঞ্জ", "সিলেট", "টাঙ্গাইল", "ঠাকুরগাঁও"];

const PROFESSIONS = [
  { id: 'Student', label: 'ছাত্র (Student)' },
  { id: 'Job', label: 'চাকুরীজীবী (Job Holder)' },
  { id: 'Expat', label: 'প্রবাসী (Expat)' },
  { id: 'Business', label: 'ব্যবসায়ী (Businessman)' },
  { id: 'Other', label: 'অন্যান্য (Other)' }
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [showBloodModal, setShowBloodModal] = useState(false);

  const [formData, setFormData] = useState<Partial<UserType>>({
    name: '',
    phone: '',
    birthYear: 2000,
    bloodGroup: '',
    location: 'Bangladesh',
    address: { district: '', upazila: '', union: '', ward: '', village: '' },
    profession: '',
    isStudent: false,
    policyConsent: false
  });

  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = db.getUsers();
    const user = users.find(u => u.phone === phoneInput);
    
    if (!user) {
      setError('এই নম্বরটি দিয়ে কোন অ্যাকাউন্ট পাওয়া যায়নি।');
      return;
    }
    
    if (user.status === UserStatus.PENDING) {
      setError('আপনার অ্যাকাউন্ট এখনো এডমিন কর্তৃক অনুমোদিত হয়নি।');
      return;
    }

    setCurrentUser(user);
    navigate('/dashboard');
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.profilePic) return setError('একটি প্রোফাইল ছবি আপলোড করা বাধ্যতামূলক।');
      if (!formData.name || !phoneInput || !formData.bloodGroup) return setError('সব তথ্য সঠিকভাবে পূরণ করুন।');
    }
    if (step === 2) {
      if (formData.location === 'Bangladesh' && !formData.address?.district) return setError('জেলা নির্বাচন করুন।');
    }
    setStep(s => s + 1);
  };

  const handleRegister = async () => {
    setError('');
    if (!formData.profession) return setError('পেশা নির্বাচন করুন।');
    if (!formData.policyConsent) return setError('নীতিমালায় সম্মতি দেওয়া বাধ্যতামূলক।');
    if (formData.isStudent && !formData.studentIdCopy) return setError('ছাত্র হলে আইডি কার্ডের ছবি প্রদান বাধ্যতামূলক।');
    
    try {
      await db.registerUser({ ...formData, phone: phoneInput } as any);
      setSuccess('আবেদন সফল হয়েছে! এডমিন অনুমোদনের পর আপনি লগইন করতে পারবেন।');
      setTimeout(() => {
        setIsLogin(true);
        setStep(1);
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePic' | 'studentIdCopy') => {
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
           <div className="w-20 h-20 bg-[#0d9488] rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-4 border-4 border-white">
              <ShieldCheck className="w-10 h-10 text-white" />
           </div>
           <h1 className="text-3xl font-black text-slate-900">মানবিক সংগঠন</h1>
           <p className="text-slate-400 font-bold text-sm mt-1">
             {isLogin ? 'সদস্য লগইন' : `নিবন্ধন - ধাপ ${step}/৩`}
           </p>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-white relative overflow-hidden">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100 flex items-center gap-3">
              <X className="w-5 h-5 bg-rose-100 p-1 rounded-full" /> {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-bold border border-emerald-100 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 bg-emerald-100 p-1 rounded-full" /> {success}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 ml-2">মোবাইল নম্বর</p>
                <div className="flex gap-2">
                   <div className="flex items-center gap-2 px-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm">
                      <img src="https://flagcdn.com/w40/bd.png" className="w-5 h-auto rounded-sm" />
                      <span>+880</span>
                   </div>
                   <input type="tel" className={inputClass} placeholder="0177599874" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-[#2D7A6D] text-white rounded-2xl font-black text-lg shadow-lg hover:bg-[#235e54] transition-all flex items-center justify-center gap-3 active:scale-95">
                লগইন করুন
              </button>
              <div className="text-center mt-6">
                <button type="button" onClick={() => { setIsLogin(false); setStep(1); }} className="text-slate-500 font-bold text-xs uppercase tracking-wider hover:text-teal-600">
                  নতুন সদস্য হিসেবে আবেদন করুন
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {step === 1 && (
                <div className="space-y-5">
                   <div className="flex flex-col items-center mb-2">
                      <div className="relative">
                        <div className={`w-28 h-28 rounded-[2.5rem] bg-slate-50 border-2 ${!formData.profilePic ? 'border-dashed border-slate-300' : 'border-teal-500'} flex items-center justify-center overflow-hidden transition-all shadow-inner`}>
                          {formData.profilePic ? <img src={formData.profilePic} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-slate-200" />}
                        </div>
                        <label className="absolute -bottom-1 -right-1 bg-teal-600 p-2.5 rounded-xl text-white shadow-lg cursor-pointer border-2 border-white">
                          <Camera className="w-5 h-5" />
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'profilePic')} />
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-400 font-black mt-3 uppercase tracking-widest">ছবি আপলোড করুন (বাধ্যতামূলক)</p>
                   </div>
                   <input type="text" className={inputClass} placeholder="আপনার পূর্ণ নাম" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   <input type="tel" className={inputClass} placeholder="মোবাইল নম্বর" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} />
                   
                   <button 
                    onClick={() => setShowBloodModal(true)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-left flex justify-between items-center"
                   >
                     <span className={formData.bloodGroup ? 'text-black' : 'text-slate-400'}>
                        {formData.bloodGroup ? `রক্তের গ্রুপ: ${formData.bloodGroup}` : 'রক্তের গ্রুপ নির্বাচন করুন'}
                     </span>
                     <Droplets className={`w-5 h-5 ${formData.bloodGroup ? 'text-rose-500' : 'text-slate-300'}`} />
                   </button>

                   <button onClick={nextStep} className="w-full py-5 bg-[#2D7A6D] text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg">
                     পরবর্তী ধাপ <ArrowRight className="w-6 h-6" />
                   </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                   <p className="text-xs font-bold text-slate-500 ml-2">আপনার বর্তমান অবস্থান *</p>
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setFormData({...formData, location: 'Bangladesh'})} className={`py-4 rounded-2xl font-black text-xs border-2 transition-all ${formData.location === 'Bangladesh' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>বাংলাদেশ (BD)</button>
                      <button onClick={() => setFormData({...formData, location: 'Abroad'})} className={`py-4 rounded-2xl font-black text-xs border-2 transition-all ${formData.location === 'Abroad' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>প্রবাস (Abroad)</button>
                   </div>

                   {formData.location === 'Bangladesh' && (
                     <div>
                        <p className="text-xs font-bold text-slate-500 ml-2 mb-2">জেলা নির্বাচন করুন *</p>
                        <select className={inputClass} value={formData.address?.district} onChange={e => setFormData({...formData, address: {...formData.address!, district: e.target.value}})}>
                           <option value="">জেলা নির্বাচন করুন</option>
                           {BD_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                     </div>
                   )}

                   <div className="flex gap-4">
                     <button onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black flex items-center justify-center gap-2"><ArrowLeft className="w-5 h-5" /> পিছে</button>
                     <button onClick={nextStep} className="flex-1 py-5 bg-[#2D7A6D] text-white rounded-2xl font-black shadow-lg">পরবর্তী ধাপ</button>
                   </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                   <div>
                      <p className="text-xs font-bold text-slate-500 ml-2 mb-2">পেশা নির্বাচন করুন *</p>
                      <div className="relative">
                        <select 
                          className={`${inputClass} appearance-none`}
                          value={formData.profession} 
                          onChange={e => {
                            const val = e.target.value;
                            setFormData({...formData, profession: val, isStudent: val === 'Student'});
                          }}
                        >
                           <option value="">পেশা নির্বাচন করুন</option>
                           {PROFESSIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                      </div>
                   </div>

                   {formData.isStudent && (
                      <div className="p-5 bg-blue-50 border-2 border-dashed border-blue-200 rounded-[2rem] space-y-3 text-center">
                         <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">ছাত্র আইডি কার্ডের ছবি (বাধ্যতামূলক)</p>
                         <label className="w-full h-32 bg-white rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden border border-blue-100">
                            {formData.studentIdCopy ? <img src={formData.studentIdCopy} className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-blue-200" />}
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'studentIdCopy')} />
                         </label>
                      </div>
                   )}
                   
                   <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                      <label className="flex items-start gap-4 cursor-pointer">
                        <input type="checkbox" className="w-6 h-6 mt-1 accent-teal-600 rounded-lg" checked={formData.policyConsent} onChange={e => setFormData({...formData, policyConsent: e.target.checked})} />
                        <span className="text-xs font-bold text-teal-800 leading-relaxed">আমি সংগঠনের সকল নীতিমালা পড়েছি এবং আর্তমানবতার সেবায় নিজেকে নিয়োজিত রাখতে অঙ্গীকারবদ্ধ।</span>
                      </label>
                   </div>

                   <div className="flex gap-4">
                     <button onClick={() => setStep(2)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black flex items-center justify-center gap-2"><ArrowLeft className="w-5 h-5" /> পিছে</button>
                     <button onClick={handleRegister} className="flex-1 py-5 bg-[#2D7A6D] text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all">সাবমিট করুন</button>
                   </div>
                </div>
              )}

              <div className="text-center mt-6 border-t border-slate-100 pt-6">
                <button type="button" onClick={() => { setIsLogin(true); setStep(1); }} className="text-slate-500 font-bold text-xs">
                  ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Blood Group Modal Panel */}
      {showBloodModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] p-10 pb-14 animate-in slide-in-from-bottom duration-500 shadow-2xl relative">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 rounded-full"></div>
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900">রক্তের গ্রুপ</h3>
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1">জরুরী প্রয়োজনে কাজে আসবে</p>
                 </div>
                 <button onClick={() => setShowBloodModal(false)} className="p-4 bg-slate-100 rounded-[1.5rem] text-slate-400"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                 {BLOOD_GROUPS.map(bg => (
                   <button
                    key={bg}
                    onClick={() => { setFormData({...formData, bloodGroup: bg}); setShowBloodModal(false); }}
                    className={`py-6 rounded-[2rem] border-2 font-black text-xl transition-all ${formData.bloodGroup === bg ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-rose-200'}`}
                   >
                     {bg}
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
