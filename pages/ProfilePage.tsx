import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../services/ToastContext';
import { db } from '../services/db';
import { 
  ArrowLeft, Camera, User, Mail, Phone, Save, 
  CircleCheck, Hash, LogOut, Loader2, Award, QrCode, X, Download,
  Languages, Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../services/LanguageContext';
import { useTheme } from '../services/ThemeContext';
import { toPng } from 'html-to-image';
import { Moon, Sun } from 'lucide-react';

const compressImage = (base64Str: string, size = 400): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;
      
      if (img.width > img.height) {
        sourceWidth = img.height;
        sourceX = (img.width - img.height) / 2;
      } else {
        sourceHeight = img.width;
        sourceY = (img.height - img.width) / 2;
      }
      
      ctx?.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

const ProfilePage: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [whatsapp, setWhatsapp] = useState(currentUser?.whatsapp || '');
  const [facebook, setFacebook] = useState(currentUser?.facebook || '');
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = 
    email !== (currentUser?.email || '') ||
    whatsapp !== (currentUser?.whatsapp || '') ||
    facebook !== (currentUser?.facebook || '');

  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const idCardRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await db.updateUser(currentUser.id, { name, email, whatsapp, facebook });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      showToast('তথ্য সেভ করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('current_user_id');
    sessionStorage.clear();
    setCurrentUser(null);
    navigate('/', { replace: true });
    setTimeout(() => {
      if (localStorage.getItem('current_user_id') === null) {
        window.location.hash = '#/';
      }
    }, 100);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          await db.updateUser(currentUser.id, { profilePic: compressed });
        } catch (err) {
          showToast('ছবি আপলোড করতে সমস্যা হয়েছে।', 'error');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadIdCard = async () => {
    if (!idCardRef.current) return;
    
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(idCardRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 3, // Higher quality for ID card
      });
      
      const link = document.createElement('a');
      link.download = `ID_Card_${currentUser?.name}.png`;
      link.href = dataUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } catch (err) {
      console.error('Download failed:', err);
      showToast('ডাউনলোড ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const memberId = currentUser?.phone?.slice(-4) || '0000';
  const toBengaliNumber = (num: number | string) => {
    return num.toString();
  };

  const inputClass = "w-full pl-12 p-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-800/50 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bold text-black dark:text-white transition-all";

  return (
    <div className="bg-transparent dark:bg-slate-950 min-h-screen pb-20 font-['Hind_Siliguri'] transition-colors duration-300">
      <div className="bg-teal-600/90 dark:bg-teal-900/90 backdrop-blur-xl text-white p-7 flex items-center justify-between rounded-b-3xl shadow-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/20 rounded-xl backdrop-blur-md active:scale-90 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold italic">{t('edit_profile')}</h1>
        </div>
        <button 
          onClick={handleLogout} 
          className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg active:scale-90 hover:bg-rose-600 transition-all border border-rose-400 flex items-center gap-2"
          title={t('logout')}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest hidden xs:inline">{t('logout')}</span>
        </button>
      </div>

      <div className="p-6 flex flex-col items-center">
        <div className="relative mb-6 mt-4">
          <div className="w-36 h-36 rounded-3xl glass-card overflow-hidden relative border-4 border-white/50 dark:border-slate-800/50 shadow-2xl">
            {currentUser?.profilePic ? (
              <img src={currentUser.profilePic} className="w-full h-full object-cover block aspect-square" alt="Profile" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                <User className="w-16 h-16 text-gray-300 dark:text-slate-700" />
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 bg-teal-600 p-3.5 rounded-2xl shadow-xl cursor-pointer active:scale-90 transition-all">
            <Camera className="w-6 h-6 text-white" />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
          </label>
        </div>

        <div className="mb-8 flex items-center gap-2 glass-card px-5 py-2.5 rounded-full border-none shadow-lg">
           <Hash className="w-4 h-4 text-teal-600" />
           <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">
             {language === 'bn' ? 'সদস্য আইডি:' : 'Member ID:'} <span className="text-teal-700 dark:text-teal-400 text-sm">{toBengaliNumber(memberId)}</span>
           </p>
        </div>

        {showSuccess && (
          <div className="w-full max-w-md mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl font-bold text-[11px] flex items-center gap-3 border border-green-100 dark:border-green-900/30 animate-in fade-in zoom-in">
            <CircleCheck className="w-5 h-5" /> {t('success')}!
          </div>
        )}

        <div className="w-full max-w-md space-y-2">
          <div className="glass-card p-4 rounded-3xl space-y-2">
            {/* Existing fields */}
            <div>
              <label className="block text-[9px] font-bold text-gray-400 dark:text-slate-500 mb-0.5 uppercase tracking-[0.1em] ml-1">{t('name')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600 w-4 h-4 z-10" />
                <input 
                  id="profile-display-name"
                  name="user-full-name"
                  autoComplete="name"
                  className={`${inputClass} pl-10 p-2.5 bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-transparent cursor-not-allowed`} 
                  value={name} 
                  disabled
                  placeholder={t('name')} 
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 dark:text-slate-500 mb-0.5 uppercase tracking-[0.1em] ml-1">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600 w-4 h-4 z-10" />
                <input 
                  id="profile-user-email"
                  name="user-email-address"
                  autoComplete="email"
                  className={`${inputClass} pl-10 p-2.5`} 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="example@mail.com" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 dark:text-slate-500 mb-0.5 uppercase tracking-[0.1em] ml-1">{t('phone')}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-slate-700 w-4 h-4 z-10" />
                <input className={`${inputClass} pl-10 p-2.5 bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-transparent cursor-not-allowed`} value={toBengaliNumber(currentUser?.phone || '')} disabled />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 dark:text-slate-500 mb-0.5 uppercase tracking-[0.1em] ml-1">WhatsApp / Imo</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600 w-4 h-4 z-10" />
                <input 
                  className={`${inputClass} pl-10 p-2.5`} 
                  value={whatsapp} 
                  onChange={e => setWhatsapp(e.target.value)} 
                  placeholder="WhatsApp / Imo Number" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 dark:text-slate-500 mb-0.5 uppercase tracking-[0.1em] ml-1">Facebook Profile Link</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600 w-4 h-4 z-10" />
                <input 
                  className={`${inputClass} pl-10 p-2.5`} 
                  value={facebook} 
                  onChange={e => setFacebook(e.target.value)} 
                  placeholder="Facebook Profile Link" 
                />
              </div>
            </div>

            {/* New section for full user info */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <h3 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">{language === 'bn' ? 'অন্যান্য তথ্য' : 'Other Information'}</h3>
              <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                <div><p className="uppercase">{language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</p><p className="text-slate-800 dark:text-slate-200 text-[10px]">{currentUser?.bloodGroup || 'N/A'}</p></div>
                <div><p className="uppercase">{language === 'bn' ? 'পেশা' : 'Profession'}</p><p className="text-slate-800 dark:text-slate-200 text-[10px]">{currentUser?.profession || 'N/A'}</p></div>
                <div><p className="uppercase">{language === 'bn' ? 'জেলা' : 'District'}</p><p className="text-slate-800 dark:text-slate-200 text-[10px]">{currentUser?.address?.district || 'N/A'}</p></div>
                <div><p className="uppercase">{language === 'bn' ? 'উপজেলা' : 'Upazila'}</p><p className="text-slate-800 dark:text-slate-200 text-[10px]">{currentUser?.address?.upazila || 'N/A'}</p></div>
                <div><p className="uppercase">{language === 'bn' ? 'ইউনিয়ন' : 'Union'}</p><p className="text-slate-800 dark:text-slate-200 text-[10px]">{currentUser?.address?.union || 'N/A'}</p></div>
                <div><p className="uppercase">{language === 'bn' ? 'গ্রাম' : 'Village'}</p><p className="text-slate-800 dark:text-slate-200 text-[10px]">{currentUser?.address?.village || 'N/A'}</p></div>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-[0.2em] ml-1">{t('language')}</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setLanguage('bn')}
                  className={`flex-1 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    language === 'bn' 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Languages className="w-4 h-4" />
                  {t('bangla')}
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    language === 'en' 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Languages className="w-4 h-4" />
                  {t('english')}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-[0.2em] ml-1">
                {language === 'bn' ? 'থিম' : 'THEME'}
              </label>
              <div className="flex gap-3">
                <button
                  onClick={toggleTheme}
                  className={`flex-1 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    theme === 'light' 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  {language === 'bn' ? 'লাইট মোড' : 'Light Mode'}
                </button>
                <button
                  onClick={toggleTheme}
                  className={`flex-1 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    theme === 'dark' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  {language === 'bn' ? 'ডার্ক মোড' : 'Dark Mode'}
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full py-5 bg-teal-600 text-white rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> {t('save')}</>}
          </button>

          {currentUser?.isIdCardEnabled && (
            <button 
              onClick={() => setShowIdCard(true)}
              className="w-full py-5 bg-white text-teal-700 border-2 border-teal-600 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all mt-4"
            >
              <Award className="w-6 h-6" /> {language === 'bn' ? 'সাংগঠনিক আইডি কার্ড' : 'Organizational ID Card'}
            </button>
          )}
        </div>
      </div>

      {showIdCard && currentUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 overflow-y-auto no-scrollbar">
          <div className="w-full max-w-sm animate-in zoom-in-95 duration-500 flex flex-col items-center">
            {/* Lanyard/Ribbon */}
            <div className="flex flex-col items-center -mb-6 relative z-50">
              {/* Curved Ribbon Part */}
              <div className="w-20 h-48 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative flex flex-col items-center shadow-2xl rounded-b-3xl overflow-hidden border-x border-white/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent)]"></div>
                <div className="writing-mode-vertical text-[9px] font-bold text-white/90 uppercase tracking-[0.5em] mt-10 whitespace-nowrap drop-shadow-lg">
                   OFFICIAL MEMBER
                </div>
              </div>
              
              {/* Metal Hook Assembly */}
              <div className="flex flex-col items-center -mt-4">
                {/* Leather/Plastic Holder */}
                <div className="w-16 h-8 bg-slate-950 rounded-t-2xl shadow-2xl border-b border-white/5 relative">
                   <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-1.5 bg-white/5 rounded-full"></div>
                </div>
                {/* Metal Ring */}
                <div className="w-8 h-8 border-[6px] border-slate-300 rounded-full -mt-1.5 shadow-2xl relative z-10 bg-slate-400">
                   <div className="absolute inset-0 border border-white/60 rounded-full"></div>
                </div>
                {/* Metal Clip */}
                <div className="w-14 h-18 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300 rounded-b-3xl shadow-[0_15px_30px_rgba(0,0,0,0.4)] border border-slate-400 flex flex-col items-center pt-2 relative">
                   <div className="w-10 h-2 bg-slate-400 rounded-full mb-1.5 shadow-inner"></div>
                   <div className="w-6 h-12 bg-gradient-to-b from-slate-100 to-slate-200 rounded-full border border-slate-300 shadow-inner"></div>
                   {/* Reflection */}
                   <div className="absolute top-5 left-3 w-1.5 h-10 bg-white/60 rounded-full blur-[1.5px]"></div>
                </div>
              </div>
            </div>

            {/* ID Card Body */}
            <div ref={idCardRef} className="w-full aspect-[2.5/4] bg-white rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden relative border border-slate-200 flex flex-col">
              {/* Premium Corporate Background */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-slate-50">
                {/* Top Header Section */}
                <div className="absolute top-0 left-0 w-full h-[32%] bg-[#0f172a] overflow-hidden">
                   {/* Subtle Grid Pattern */}
                   <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
                   {/* Abstract Shapes */}
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl"></div>
                   <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900/40"></div>
                </div>
                
                {/* Diagonal Accent */}
                <div className="absolute top-[28%] -left-[10%] w-[120%] h-12 bg-teal-600 -rotate-3 shadow-lg z-10"></div>
                <div className="absolute top-[29%] -left-[10%] w-[120%] h-12 bg-slate-900 -rotate-3 shadow-lg z-0"></div>
              </div>

              {/* Card Content */}
              <div className="relative z-20 flex flex-col items-center pt-8 px-6 flex-grow">
                {/* Foundation Logo/Name at Top */}
                <div className="mb-6 text-center">
                   <div className="w-12 h-12 bg-white rounded-2xl p-2 shadow-xl mx-auto mb-3 border border-slate-100 flex items-center justify-center rotate-3">
                      <Award className="w-8 h-8 text-teal-600" />
                   </div>
                   <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.4em] leading-none mb-1 drop-shadow-md">UNITY CARE</h3>
                   <p className="text-[8px] font-bold text-teal-400 uppercase tracking-[0.2em]">Foundation</p>
                </div>

                {/* Profile Picture with Premium Frame */}
                <div className="relative mb-6">
                  <div className="w-36 h-36 bg-white rounded-3xl p-1 shadow-2xl border border-slate-200 rotate-2">
                    <div className="w-full h-full bg-slate-100 rounded-2xl overflow-hidden border-2 border-white -rotate-2">
                      {currentUser.profilePic ? (
                        <img src={currentUser.profilePic} className="w-full h-full object-cover aspect-square" alt="Profile" />
                      ) : (
                        <User className="w-16 h-16 m-10 text-slate-200" />
                      )}
                    </div>
                  </div>
                  {/* Verified Badge */}
                  <div className="absolute -bottom-2 -right-2 bg-teal-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                    <CircleCheck className="w-4 h-4" />
                  </div>
                </div>

                {/* Name & Designation */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight leading-none mb-2">{currentUser.name}</h2>
                  <div className="inline-block px-4 py-1 bg-slate-900 rounded-full">
                    <p className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.2em]">{currentUser.designation || (language === 'bn' ? 'ভেরিফাইড সদস্য' : 'Verified Member')}</p>
                  </div>
                </div>

                {/* Details Section - Structured Grid */}
                <div className="w-full grid grid-cols-2 gap-x-4 gap-y-3 mb-6 px-2">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{language === 'bn' ? 'সদস্য আইডি' : 'Member ID'}</span>
                      <span className="text-[11px] text-slate-900 font-bold tracking-widest">{memberId}</span>
                   </div>
                   <div className="flex flex-col text-right">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</span>
                      <span className="text-[11px] text-rose-600 font-bold tracking-widest">{currentUser.bloodGroup || '—'}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{language === 'bn' ? 'যোগদানের তারিখ' : 'Joining Date'}</span>
                      <span className="text-[11px] text-slate-900 font-bold tracking-widest">{currentUser.registeredAt ? new Date(currentUser.registeredAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { numberingSystem: 'latn' }) : '01/02/2026'}</span>
                   </div>
                   <div className="flex flex-col text-right">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{language === 'bn' ? 'মেয়াদ শেষ' : 'Expiry Date'}</span>
                      <span className="text-[11px] text-rose-600 font-bold tracking-widest">{currentUser.expiryDate || '31/12/2026'}</span>
                   </div>
                </div>

                 {/* QR Code Area - Restored per user request */}
                 <div className="mt-auto mb-6 relative w-full flex flex-col items-center">
                   {currentUser.isQrEnabled && (
                     <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 mb-3">
                       <QRCodeSVG 
                         value={currentUser.id} 
                         size={60} 
                         level="H"
                         includeMargin={false}
                         fgColor="#0D9488"
                       />
                     </div>
                   )}
                   <div className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em] italic">
                     {language === 'bn' ? 'ইউনিটি কেয়ার ফাউন্ডেশন' : 'Unity Care Foundation'}
                   </div>
                 </div>
              </div>

              {/* Bottom Brand Bar */}
              <div className="h-2 bg-teal-600 w-full"></div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 w-full">
              <button 
                onClick={() => setShowIdCard(false)}
                className="flex-grow py-4 bg-white/10 text-white rounded-2xl font-bold uppercase text-xs backdrop-blur-md border border-white/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button 
                onClick={handleDownloadIdCard}
                disabled={isDownloading}
                className="flex-grow py-4 bg-teal-600 text-white rounded-2xl font-bold uppercase text-xs shadow-lg shadow-teal-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {language === 'bn' ? 'ডাউনলোড' : 'Download'}
              </button>
              <button 
                onClick={() => window.print()}
                className="p-4 bg-slate-800 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center"
                title={language === 'bn' ? 'প্রিন্ট' : 'Print'}
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;