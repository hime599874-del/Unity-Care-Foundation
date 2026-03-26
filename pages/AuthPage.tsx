
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { useAuth } from '../services/AuthContext';
import { useLanguage } from '../services/LanguageContext';
import { UserStatus, User as UserType } from '../types';
import { 
  Phone, User, ShieldCheck, ArrowRight, ArrowLeft, Camera, 
  CircleCheck, X, Droplets, ChevronDown, Loader2, Globe, Search, MapPin, Briefcase, Calendar, Info, ScrollText, Package, HandHelping, 
  FileCheck, ShieldAlert, HeartHandshake, Zap, Scale, Trash2, CircleAlert
} from 'lucide-react';

import { BD_LOCATION_DATA, PROFESSIONS, COUNTRY_DIAL_CODES, BLOOD_GROUPS } from '../src/constants/locationData';
import ImageCropper from '../src/components/ImageCropper';

const compressImage = (base64Str: string, size = 400): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate square crop
      const minDimension = Math.min(img.width, img.height);
      const startX = (img.width - minDimension) / 2;
      const startY = (img.height - minDimension) / 2;
      
      canvas.width = size;
      canvas.height = size;
      
      // Draw cropped square image
      ctx?.drawImage(
        img,
        startX, startY, minDimension, minDimension, // Source
        0, 0, size, size // Destination
      );
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const { t, language } = useLanguage();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [selectedDialCode, setSelectedDialCode] = useState(COUNTRY_DIAL_CODES[0]);
  
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showBloodModal, setShowBloodModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showUpazilaModal, setShowUpazilaModal] = useState(false);
  const [showProfessionModal, setShowProfessionModal] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // Debug logs to help identify if modals are being triggered
  const openProfessionModal = () => {
    console.log('Opening Profession Modal');
    setShowProfessionModal(true);
    setProfessionSearch('');
  };

  const openBloodModal = () => {
    console.log('Opening Blood Modal');
    setShowBloodModal(true);
  };
  
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    
    try {
      // Ensure DB is ready before checking
      if (!db.isDbReady()) {
        await db.whenReady();
      }

      const fullPhone = getNormalizedPhone();
      const user = await db.getUserByPhone(fullPhone);
      
      if (!user) {
        setError(t('login_error_no_account'));
        setIsSubmitting(false);
        return;
      }
      
      if (user.status === UserStatus.PENDING) {
        setError(t('login_error_pending'));
        setIsSubmitting(false);
        return;
      }

      if (user.status === UserStatus.REJECTED) {
        setError(t('login_error_rejected'));
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem('current_user_id', user.id);
      setCurrentUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError(t('login_error_general'));
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.profilePic) return setError(t('reg_error_photo'));
      if (!formData.name || !phoneInput || !formData.bloodGroup || !formData.profession || !formData.birthYear) {
        return setError(t('reg_error_fields'));
      }
      if (formData.birthYear && (formData.birthYear < 1920 || formData.birthYear > new Date().getFullYear())) {
        return setError(t('reg_error_birth_year'));
      }
    }
    if (step === 2) {
      if (formData.location === 'Bangladesh' && (!formData.address?.district || !formData.address?.upazila)) {
        return setError(t('reg_error_location'));
      }
    }
    setStep(s => s + 1);
  };

  const handleRegister = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    
    const fullPhone = getNormalizedPhone();
    
    const existingUser = db.getUsers().find(u => {
        const normalize = (p: string) => p.replace(/\D/g, '').slice(-10);
        return normalize(u.phone) === normalize(fullPhone);
    });
    
    if (existingUser) {
        setError(t('reg_error_exists'));
        setIsSubmitting(false);
        return;
    }

    if (!formData.policyConsent) {
        setError(t('reg_error_terms'));
        setIsSubmitting(false);
        return;
    }
    
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
      setSuccess(t('reg_success'));
      
      setTimeout(() => { 
        setIsLogin(true); 
        setStep(1); 
        setSuccess(''); 
        setIsSubmitting(false); 
      }, 3000);
    } catch (err: any) {
      setError(err.message || t('error_occurred'));
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePic') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImage: string) => {
    try {
      const compressed = await compressImage(croppedImage);
      setFormData(prev => ({ ...prev, profilePic: compressed }));
      setShowCropper(false);
      setImageToCrop(null);
    } catch (e) {
      setError(t('image_process_error'));
    }
  };

  const filteredDistricts = useMemo(() => Object.keys(BD_LOCATION_DATA).filter(d => d.includes(locationSearch)).sort(), [locationSearch]);
  const filteredUpazilas = useMemo(() => {
    const d = formData.address?.district;
    return d ? BD_LOCATION_DATA[d].filter(u => u.includes(locationSearch)).sort() : [];
  }, [locationSearch, formData.address?.district]);

  const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800/50 rounded-2xl outline-none focus:border-teal-500 font-bold text-sm text-black dark:text-white transition-all shadow-sm";
  const selectBtnClass = "w-full p-4 bg-slate-50 dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800/50 rounded-2xl font-bold text-xs text-left flex justify-between items-center hover:border-teal-500 transition-all active:scale-95 shadow-sm text-slate-700 dark:text-slate-300";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 py-10 font-['Hind_Siliguri'] transition-colors duration-300">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-teal-600 dark:bg-teal-700 rounded-[1.5rem] shadow-xl flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-800 rotate-3">
              <Package className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 premium-text italic leading-none">Unity Care {t('foundation')}</h1>
           <p className="text-slate-400 dark:text-slate-500 font-bold text-[10px] mt-2 uppercase tracking-[0.3em] leading-none">{isLogin ? t('member_login') : `${t('register')} - ${t('step')} ${step}/3`}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          {error && <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold border border-rose-100 dark:border-rose-800/50 flex items-center gap-4 animate-in shake duration-500"><X className="w-5 h-5" /> {error}</div>}
          {success && <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-4"><CircleCheck className="w-5 h-5" /> {success}</div>}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-4">{t('phone')}</p>
                <div className="flex gap-3">
                   <button type="button" onClick={() => setShowCountryModal(true)} className="flex items-center gap-3 px-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-xs shadow-sm hover:border-teal-300 dark:text-slate-300">
                      <img src={selectedDialCode.flag === 'un' ? 'https://flagcdn.com/w40/un.png' : `https://flagcdn.com/w40/${selectedDialCode.flag}.png`} className="w-6 h-auto rounded-sm border border-slate-200 dark:border-slate-700" alt="Flag" />
                      <span>{selectedDialCode.code}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                   </button>
                   <input 
                    type="tel" 
                    name="phone-login"
                    autoComplete="tel"
                    className={inputClass} 
                    placeholder={t('enter_number')} 
                    value={phoneInput} 
                    onChange={e => handlePhoneChange(e.target.value)} 
                   />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-teal-700 active:scale-95 transition-all border-b-4 border-teal-800">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t('login_title')}
              </button>
              
              <div className="text-center mt-2">
                <p className={`text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 ${!db.getIsOnline() ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                  {!db.getIsOnline() ? (
                    <><CircleAlert className="w-3 h-3" /> ইন্টারনেট কানেকশন নেই!</>
                  ) : (
                    db.isDbReady() ? `ডাটাবেজ সংযুক্ত: ${db.getUsers().length} জন সদস্য লোড হয়েছে` : 'ডাটাবেজ কানেক্ট হচ্ছে...'
                  )}
                </p>
              </div>

              <button type="button" onClick={() => { setIsLogin(false); setStep(1); }} className="w-full text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-4">{t('dont_have_account')} {t('register')}</button>
            </form>
          ) : (
            <div className="space-y-6">
              {step === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                   <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner ring-4 ring-slate-50 dark:ring-slate-800">
                          {formData.profilePic ? <img src={formData.profilePic} className="w-full h-full object-cover" alt="Profile" /> : <User className="w-10 h-10 text-slate-200 dark:text-slate-700" />}
                        </div>
                        <label className="absolute -bottom-1 -right-1 bg-teal-600 dark:bg-teal-700 p-2.5 rounded-xl text-white shadow-xl cursor-pointer border-2 border-white dark:border-slate-800 active:scale-90 transition-all">
                          <Camera className="w-5 h-5" />
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'profilePic')} />
                        </label>
                      </div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-4">{t('upload_photo')}</p>
                   </div>
                   
                   <input 
                    type="text" 
                    name="full-name"
                    autoComplete="name"
                    className={inputClass} 
                    placeholder={t('name')} 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                   />
                   
                   <div className="flex gap-3">
                      <button type="button" onClick={() => setShowCountryModal(true)} className="flex items-center gap-3 px-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-xs active:scale-95 transition-all shadow-sm dark:text-slate-300">
                          <img src={selectedDialCode.flag === 'un' ? 'https://flagcdn.com/w40/un.png' : `https://flagcdn.com/w40/${selectedDialCode.flag}.png`} className="w-6 h-auto rounded-sm border border-slate-200 dark:border-slate-700" alt="Flag" />
                          <span>{selectedDialCode.code}</span>
                      </button>
                      <input 
                        type="tel" 
                        name="user-phone"
                        autoComplete="tel"
                        className={inputClass} 
                        placeholder={t('phone')} 
                        value={phoneInput} 
                        onChange={e => handlePhoneChange(e.target.value)} 
                      />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={openProfessionModal} className={selectBtnClass}>
                         <span className={`text-[11px] truncate ${formData.profession ? 'text-black dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{formData.profession || t('select_profession')}</span>
                         <Briefcase className="w-4 h-4 text-slate-400" />
                      </button>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600 pointer-events-none" />
                        <input type="number" name="birth-year" autoComplete="bday-year" className={`${inputClass} pl-10 text-[11px]`} placeholder={t('birth_year')} value={formData.birthYear || ''} onChange={e => handleBirthYearChange(e.target.value)} />
                      </div>
                   </div>

                   <button type="button" onClick={openBloodModal} className={`${selectBtnClass} py-5 border-rose-100 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-900/10`}>
                     <div className="flex items-center gap-3">
                        <Droplets className="w-7 h-7 text-rose-500 fill-rose-500/10" />
                        <span className={`text-base font-black ${formData.bloodGroup ? 'text-black dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{formData.bloodGroup || t('blood_group')}</span>
                     </div>
                     <ChevronDown className="w-6 h-6 text-slate-400" />
                   </button>

                   <button onClick={nextStep} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black text-lg uppercase shadow-xl border-b-4 border-teal-800 active:scale-95 transition-all">{t('next_step')} <ArrowRight className="w-6 h-6 inline ml-2" /></button>
                </div>
              )}
              
              {step === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setFormData({...formData, location: 'Bangladesh'})} className={`py-5 rounded-2xl font-black text-xs border-2 transition-all shadow-sm ${formData.location === 'Bangladesh' ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-500 text-teal-700 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>{t('bangladesh')}</button>
                    <button onClick={() => setFormData({...formData, location: 'Abroad'})} className={`py-5 rounded-2xl font-black text-xs border-2 transition-all shadow-sm ${formData.location === 'Abroad' ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-500 text-teal-700 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>{t('abroad')}</button>
                  </div>
                  <div className="space-y-3">
                    <button onClick={() => { setShowDistrictModal(true); setLocationSearch(''); }} className={selectBtnClass}>
                       <span className={`text-base ${formData.address?.district ? 'text-black dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{formData.address?.district || t('select_district')}</span>
                       <MapPin className="w-5 h-5 text-teal-500" />
                    </button>
                    <button onClick={() => { if (!formData.address?.district) return setError(t('select_district_first')); setShowUpazilaModal(true); setLocationSearch(''); }} className={selectBtnClass}>
                       <span className={`text-base ${formData.address?.upazila ? 'text-black dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{formData.address?.upazila || t('select_upazila')}</span>
                       <MapPin className="w-5 h-5 text-teal-500" />
                    </button>
                    <input type="text" className={inputClass} placeholder={t('village_area')} value={formData.address?.village} onChange={e => setFormData({...formData, address: {...formData.address!, village: e.target.value}})} />
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button onClick={() => setStep(1)} className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 active:scale-90 transition-all shadow-sm border-2 border-slate-100 dark:border-slate-700"><ArrowLeft className="w-7 h-7" /></button>
                    <button onClick={nextStep} className="flex-grow py-5 bg-teal-600 text-white rounded-2xl font-black shadow-2xl uppercase text-lg border-b-4 border-teal-800 active:scale-95 transition-all">{t('next_step')}</button>
                  </div>
                </div>
              )}
              
              {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-teal-600 dark:bg-teal-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-100 dark:shadow-teal-900/20 shrink-0">
                        <FileCheck className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 premium-text leading-tight">{t('terms_conditions')}</h3>
                        <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Unity Care Foundation Charter</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 max-h-[24rem] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                      {[
                        { 
                          icon: <ShieldCheck className="w-5 h-5" />, 
                          text: t('policy_1')
                        },
                        { 
                          icon: <Info className="w-5 h-5" />, 
                          text: t('policy_2')
                        },
                        { 
                          icon: <HeartHandshake className="w-5 h-5" />, 
                          text: t('policy_3')
                        },
                        { 
                          icon: <ShieldAlert className="w-5 h-5" />, 
                          text: t('policy_4')
                        },
                        { 
                          icon: <Zap className="w-5 h-5" />, 
                          text: t('policy_5')
                        },
                        { 
                          icon: <Scale className="w-5 h-5" />, 
                          text: t('policy_6')
                        },
                        { 
                          icon: <Trash2 className="w-5 h-5" />, 
                          text: t('policy_7')
                        }
                      ].map((policy, i) => (
                        <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-teal-50/30 dark:hover:bg-teal-900/20 transition-colors group">
                           <div className="shrink-0 w-10 h-10 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                              {policy.icon}
                           </div>
                           <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed pt-1">{policy.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                       <label className={`flex items-start gap-4 p-5 rounded-3xl cursor-pointer shadow-xl transition-all border-b-4 group ${formData.policyConsent ? 'bg-emerald-600 dark:bg-emerald-700 border-emerald-800 dark:border-emerald-900 shadow-emerald-100 dark:shadow-emerald-900/20' : 'bg-teal-600 dark:bg-teal-700 border-teal-800 dark:border-teal-900 shadow-teal-100 dark:shadow-teal-900/20'}`}>
                          <div className="pt-1">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.policyConsent ? 'bg-white border-white' : 'bg-transparent border-white/40'}`}>
                              {formData.policyConsent && <CircleCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />}
                            </div>
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={formData.policyConsent} 
                              onChange={e => setFormData({...formData, policyConsent: e.target.checked})} 
                            />
                          </div>
                          <span className="text-white font-black text-[13px] leading-tight uppercase group-hover:opacity-90">
                            {t('terms_agreement_text')}
                          </span>
                       </label>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => setStep(2)} className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 active:scale-90 transition-all shadow-sm border-2 border-slate-100 dark:border-slate-700"><ArrowLeft className="w-8 h-8" /></button>
                    <button 
                      onClick={handleRegister} 
                      disabled={isSubmitting || !formData.policyConsent} 
                      className={`flex-grow py-5 rounded-3xl font-black shadow-2xl text-xl uppercase active:scale-95 transition-all border-b-4 tracking-widest disabled:opacity-50 ${formData.policyConsent ? 'bg-emerald-600 dark:bg-emerald-700 border-emerald-800 dark:border-emerald-900 text-white shadow-emerald-100 dark:shadow-emerald-900/20' : 'bg-slate-900 dark:bg-slate-800 border-black dark:border-slate-700 text-white'}`}
                    >
                      {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : t('complete_registration')}
                    </button>
                  </div>
                </div>
              )}
              <button type="button" onClick={() => { setIsLogin(true); setStep(1); }} className="w-full text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-6">{t('already_have_account')} {t('login')}</button>
            </div>
          )}
        </div>
      </div>
      
      {showCountryModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
             <div className="p-6 bg-teal-600 dark:bg-teal-700 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-sm">{t('select_country')}</h3>
                <button onClick={() => setShowCountryModal(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="max-h-96 overflow-y-auto p-4 space-y-2">
                {COUNTRY_DIAL_CODES.length > 0 ? COUNTRY_DIAL_CODES.map(c => (
                  <button key={c.code} onClick={() => { setSelectedDialCode(c); setShowCountryModal(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all font-black text-xs text-slate-700 dark:text-slate-300">
                    <img src={c.flag === 'un' ? 'https://flagcdn.com/w40/un.png' : `https://flagcdn.com/w40/${c.flag}.png`} className="w-7 h-auto rounded-sm border border-slate-200 dark:border-slate-700" alt={c.name} />
                    <span>{language === 'bn' ? c.name : (c.name === 'বাংলাদেশ' ? 'Bangladesh' : c.name === 'ভারত' ? 'India' : c.name === 'সৌদি আরব' ? 'Saudi Arabia' : c.name === 'ইউএই' ? 'UAE' : c.name === 'যুক্তরাজ্য' ? 'UK' : c.name === 'যুক্তরাষ্ট্র' ? 'USA' : c.name === 'মালয়েশিয়া' ? 'Malaysia' : c.name === 'ইতালি' ? 'Italy' : c.name === 'কাতার' ? 'Qatar' : c.name === 'কুয়েত' ? 'Kuwait' : c.name === 'সিঙ্গাপুর' ? 'Singapore' : c.name === 'ওমান' ? 'Oman' : 'Other')}</span>
                    <span className="ml-auto text-teal-600 dark:text-teal-400">{c.code}</span>
                  </button>
                )) : <p className="text-center p-4 text-slate-400 dark:text-slate-500">No countries found</p>}
             </div>
          </div>
        </div>
      )}

      {showBloodModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
             <div className="p-6 bg-rose-600 dark:bg-rose-700 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-sm">{t('blood_group')}</h3>
                <button onClick={() => setShowBloodModal(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="p-6 grid grid-cols-4 gap-3">
                {BLOOD_GROUPS.length > 0 ? BLOOD_GROUPS.map(bg => (
                  <button key={bg} onClick={() => { setFormData({...formData, bloodGroup: bg}); setShowBloodModal(false); }} className={`p-4 rounded-xl font-black text-sm border-2 transition-all ${formData.bloodGroup === bg ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-600 dark:text-rose-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>
                    {bg}
                  </button>
                )) : <p className="col-span-4 text-center p-4 text-slate-400 dark:text-slate-500">No blood groups found</p>}
             </div>
          </div>
        </div>
      )}

      {showDistrictModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col h-[70vh]">
             <div className="p-6 bg-teal-600 dark:bg-teal-700 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-sm">{t('select_district')}</h3>
                <button onClick={() => setShowDistrictModal(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                   <Search className="w-4 h-4 text-slate-400" />
                   <input type="text" placeholder={t('search_district')} className="w-full text-xs font-black outline-none bg-transparent dark:text-white" value={locationSearch} onChange={e => setLocationSearch(e.target.value)} />
                </div>
             </div>
             <div className="overflow-y-auto p-4 space-y-1">
                {filteredDistricts.map(d => (
                  <button key={d} onClick={() => { setFormData({...formData, address: {...formData.address!, district: d, upazila: ''}}); setShowDistrictModal(false); }} className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-black text-xs text-slate-700 dark:text-slate-300">
                    {d}
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showUpazilaModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col h-[70vh]">
             <div className="p-6 bg-teal-600 dark:bg-teal-700 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-sm">{t('select_upazila')}</h3>
                <button onClick={() => setShowUpazilaModal(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                   <Search className="w-4 h-4 text-slate-400" />
                   <input type="text" placeholder={t('search_upazila')} className="w-full text-xs font-black outline-none bg-transparent dark:text-white" value={locationSearch} onChange={e => setLocationSearch(e.target.value)} />
                </div>
             </div>
             <div className="overflow-y-auto p-4 space-y-1">
                {filteredUpazilas.map(u => (
                  <button key={u} onClick={() => { setFormData({...formData, address: {...formData.address!, upazila: u}}); setShowUpazilaModal(false); }} className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-black text-xs text-slate-700 dark:text-slate-300">
                    {u}
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showProfessionModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col h-[70vh]">
             <div className="p-6 bg-indigo-600 dark:bg-indigo-700 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-sm">{t('select_profession')}</h3>
                <button onClick={() => setShowProfessionModal(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                   <Search className="w-4 h-4 text-slate-400" />
                   <input type="text" placeholder={t('search_profession')} className="w-full text-xs font-black outline-none bg-transparent dark:text-white" value={professionSearch} onChange={e => setProfessionSearch(e.target.value)} />
                </div>
             </div>
             <div className="overflow-y-auto p-4 space-y-1">
                {PROFESSIONS.filter(p => p.includes(professionSearch)).length > 0 ? PROFESSIONS.filter(p => p.includes(professionSearch)).map(p => (
                  <button key={p} onClick={() => { setFormData({...formData, profession: p}); setShowProfessionModal(false); }} className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-black text-xs text-slate-700 dark:text-slate-300">
                    {p}
                  </button>
                )) : <p className="text-center p-4 text-slate-400 dark:text-slate-500">No professions found</p>}
             </div>
          </div>
        </div>
      )}

      {showCropper && imageToCrop && (
        <ImageCropper 
          image={imageToCrop} 
          onCropComplete={handleCropComplete} 
          onCancel={() => { setShowCropper(false); setImageToCrop(null); }} 
        />
      )}
    </div>
  );
};

export default AuthPage;
