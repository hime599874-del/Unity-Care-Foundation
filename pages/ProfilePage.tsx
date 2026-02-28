import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { 
  ArrowLeft, Camera, User, Mail, Phone, Save, 
  CheckCircle2, Hash, LogOut, Loader2, Award, QrCode, X, Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

const ProfilePage: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);

  const navigate = useNavigate();

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await db.updateUser(currentUser.id, { name, email });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert('তথ্য সেভ করতে সমস্যা হয়েছে।');
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
          alert('ছবি আপলোড করতে সমস্যা হয়েছে।');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const memberId = currentUser?.phone?.slice(-4) || '0000';
  const toBengaliNumber = (num: number | string) => {
    return num.toString();
  };

  const inputClass = "w-full pl-12 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bold text-black transition-all";

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-['Hind_Siliguri']">
      <div className="bg-teal-600 text-white p-7 flex items-center justify-between rounded-b-[2.5rem] shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/20 rounded-xl backdrop-blur-md active:scale-90 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black italic">প্রোফাইল সেটিংস</h1>
        </div>
        <button 
          onClick={handleLogout} 
          className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg active:scale-90 hover:bg-rose-600 transition-all border border-rose-400 flex items-center gap-2"
          title="লগ আউট"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest hidden xs:inline">বিদায়</span>
        </button>
      </div>

      <div className="p-6 flex flex-col items-center">
        <div className="relative mb-6 mt-4">
          <div className="w-36 h-36 rounded-[2.5rem] bg-white shadow-2xl border-4 border-white overflow-hidden flex items-center justify-center relative">
            {currentUser?.profilePic ? (
              <img src={currentUser.profilePic} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <User className="w-16 h-16 text-gray-200" />
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 bg-teal-600 p-3.5 rounded-2xl shadow-xl cursor-pointer active:scale-90 transition-all">
            <Camera className="w-6 h-6 text-white" />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
          </label>
        </div>

        <div className="mb-8 flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200">
           <Hash className="w-4 h-4 text-teal-600" />
           <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">
             সদস্য আইডি: <span className="text-teal-700 text-sm">{toBengaliNumber(memberId)}</span>
           </p>
        </div>

        {showSuccess && (
          <div className="w-full max-w-md mb-6 p-4 bg-green-50 text-green-600 rounded-2xl font-black text-[11px] flex items-center gap-3 border border-green-100 animate-in fade-in zoom-in">
            <CheckCircle2 className="w-5 h-5" /> তথ্য সফলভাবে আপডেট হয়েছে!
          </div>
        )}

        <div className="w-full max-w-md space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em] ml-1">পূর্ণ নাম</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input 
                  id="profile-display-name"
                  name="user-full-name"
                  autoComplete="name"
                  className={inputClass} 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="আপনার নাম" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em] ml-1">ইমেইল</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input 
                  id="profile-user-email"
                  name="user-email-address"
                  autoComplete="email"
                  className={inputClass} 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="example@mail.com" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em] ml-1">মোবাইল নম্বর</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 z-10" />
                <input className={`${inputClass} bg-slate-100 text-slate-400 border-transparent cursor-not-allowed`} value={toBengaliNumber(currentUser?.phone || '')} disabled />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> তথ্য সেভ করুন</>}
          </button>

          {currentUser?.isIdCardEnabled && (
            <button 
              onClick={() => setShowIdCard(true)}
              className="w-full py-5 bg-white text-teal-700 border-2 border-teal-600 rounded-[2rem] font-black text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all mt-4"
            >
              <Award className="w-6 h-6" /> সাংগঠনিক আইডি কার্ড
            </button>
          )}
        </div>
      </div>

      {showIdCard && currentUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 overflow-y-auto no-scrollbar">
          <div className="w-full max-w-sm animate-in zoom-in-95 duration-500 flex flex-col items-center">
            {/* Lanyard/Ribbon */}
            <div className="flex flex-col items-center -mb-1">
              <div className="w-10 h-32 bg-[#0D9488] relative flex flex-col items-center shadow-2xl">
                <div className="absolute top-4 w-8 h-8 bg-white/20 rounded-full border border-white/30 flex items-center justify-center overflow-hidden">
                   <img src="https://i.ibb.co/v4mYpXW/logo.png" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "https://picsum.photos/seed/logo/40/40")} />
                </div>
                <div className="absolute -bottom-2 w-12 h-4 bg-slate-300 rounded-full border-2 border-slate-400 shadow-inner"></div>
              </div>
              <div className="w-14 h-4 bg-slate-400 rounded-t-lg shadow-md z-10"></div>
            </div>

            {/* ID Card Body */}
            <div className="w-full aspect-[2.5/4] bg-white rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative border border-slate-200 flex flex-col">
              {/* Geometric Background Patterns */}
              <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
                {/* Top Teal Pattern */}
                <div className="absolute top-0 left-0 right-0 h-40 bg-[#0D9488] clip-path-id-top"></div>
                {/* Darker Geometric Accents */}
                <div className="absolute top-0 left-0 w-full h-48 bg-[#064E3B] clip-path-id-accent-1 opacity-90"></div>
                <div className="absolute top-0 right-0 w-full h-48 bg-[#064E3B] clip-path-id-accent-2 opacity-90"></div>
                
                {/* Bottom Patterns */}
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0D9488] clip-path-id-bottom-left opacity-80"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#064E3B] clip-path-id-bottom-right opacity-80"></div>
              </div>

              {/* Card Content */}
              <div className="relative z-10 flex flex-col items-center pt-12 px-6 flex-grow">
                {/* Profile Picture */}
                <div className="w-36 h-36 rounded-full bg-white p-1.5 shadow-xl mb-6 border-4 border-white/50 overflow-hidden">
                  {currentUser.profilePic ? (
                    <img src={currentUser.profilePic} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-16 h-16 m-10 text-slate-200" />
                  )}
                </div>

                {/* Name Pill */}
                <div className="bg-[#0D9488] px-8 py-2 rounded-full shadow-lg mb-4">
                  <h2 className="text-xl font-black text-white uppercase tracking-wider text-center">{currentUser.name}</h2>
                </div>

                {/* Info Section */}
                <div className="text-center space-y-1 mb-6">
                  <p className="text-lg font-black text-slate-800 uppercase tracking-widest">ID {currentUser.phone.slice(-4)}</p>
                  <p className="text-sm font-bold text-slate-600">Phone : {currentUser.phone}</p>
                  <p className="text-sm font-bold text-slate-600">Blood group : <span className="text-rose-600">{currentUser.bloodGroup || '—'}</span></p>
                  <p className="text-[10px] font-bold text-slate-400 italic mt-2">check expiry date and more information</p>
                </div>

                {/* QR Code */}
                <div className="mt-auto mb-8">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                    <QRCodeSVG 
                      value={`${window.location.origin}/#/u/${currentUser.id}`}
                      size={120}
                      level="M"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 w-full">
              <button 
                onClick={() => setShowIdCard(false)}
                className="flex-grow py-4 bg-white/10 text-white rounded-2xl font-black uppercase text-xs backdrop-blur-md border border-white/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> বন্ধ করুন
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-grow py-4 bg-teal-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-teal-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> প্রিন্ট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;