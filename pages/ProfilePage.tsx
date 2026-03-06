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

  const inputClass = "w-full pl-12 p-4 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bold text-black transition-all";

  return (
    <div className="bg-transparent min-h-screen pb-20 font-['Hind_Siliguri']">
      <div className="bg-teal-600/90 backdrop-blur-xl text-white p-7 flex items-center justify-between rounded-b-[2.5rem] shadow-xl sticky top-0 z-50">
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
          <div className="w-36 h-36 rounded-[2.5rem] bg-white/40 backdrop-blur-md shadow-2xl border-4 border-white/50 overflow-hidden flex items-center justify-center relative">
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

        <div className="mb-8 flex items-center gap-2 glass-card px-5 py-2.5 rounded-full">
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
          <div className="glass-card p-8 rounded-[2.5rem] space-y-6">
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
            <div className="flex flex-col items-center -mb-6 relative z-50">
              {/* Curved Ribbon Part */}
              <div className="w-20 h-48 bg-gradient-to-r from-rose-600 via-slate-900 to-rose-600 relative flex flex-col items-center shadow-2xl rounded-b-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30"></div>
                <div className="writing-mode-vertical text-[10px] font-black text-white/90 uppercase tracking-[0.4em] mt-8 whitespace-nowrap drop-shadow-lg">
                   UNITY CARE FOUNDATION
                </div>
              </div>
              
              {/* Metal Hook Assembly */}
              <div className="flex flex-col items-center -mt-4">
                {/* Leather/Plastic Holder */}
                <div className="w-16 h-8 bg-slate-900 rounded-t-2xl shadow-2xl border-b border-slate-800 relative">
                   <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-1.5 bg-white/10 rounded-full"></div>
                </div>
                {/* Metal Ring */}
                <div className="w-8 h-8 border-[6px] border-slate-400 rounded-full -mt-1.5 shadow-2xl relative z-10">
                   <div className="absolute inset-0 border border-white/40 rounded-full"></div>
                </div>
                {/* Metal Clip */}
                <div className="w-14 h-18 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-b-3xl shadow-[0_15px_30px_rgba(0,0,0,0.4)] border border-slate-500 flex flex-col items-center pt-2 relative">
                   <div className="w-10 h-2 bg-slate-500 rounded-full mb-1.5 shadow-inner"></div>
                   <div className="w-6 h-12 bg-gradient-to-b from-slate-200 to-slate-300 rounded-full border border-slate-400 shadow-inner"></div>
                   {/* Reflection */}
                   <div className="absolute top-5 left-3 w-1.5 h-10 bg-white/50 rounded-full blur-[1.5px]"></div>
                </div>
              </div>
            </div>

            {/* ID Card Body */}
            <div className="w-full aspect-[2.5/4] bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] overflow-hidden relative border border-slate-200 flex flex-col">
              {/* Geometric Background Patterns - Premium Corporate Layers */}
              <div className="absolute inset-0 z-0 opacity-100 pointer-events-none overflow-hidden">
                {/* Top Dark Navy Layer with V-Cut */}
                <div className="absolute top-0 left-0 w-full h-[35%] bg-[#0f172a] clip-path-id-top-v opacity-100"></div>
                
                {/* Pink/Red Side Polygons */}
                <div className="absolute top-[15%] -left-[15%] w-[45%] h-[45%] bg-[#e91e63] rotate-[15deg] shadow-2xl"></div>
                <div className="absolute top-[15%] -right-[15%] w-[45%] h-[45%] bg-[#e91e63] -rotate-[15deg] shadow-2xl"></div>
                
                {/* White Central Layer (Implicitly the card background, but we can add a subtle gradient) */}
                <div className="absolute top-[30%] left-0 w-full h-full bg-gradient-to-b from-white via-white to-slate-50"></div>

                {/* Dot Patterns on Side Polygons */}
                <div className="absolute top-[25%] left-4 grid grid-cols-3 gap-1.5 opacity-30">
                   {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 bg-white rounded-full"></div>)}
                </div>
                <div className="absolute top-[25%] right-4 grid grid-cols-3 gap-1.5 opacity-30">
                   {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 bg-white rounded-full"></div>)}
                </div>
              </div>

              {/* Card Content */}
              <div className="relative z-10 flex flex-col items-center pt-10 px-8 flex-grow">
                {/* Foundation Logo/Name at Top */}
                <div className="mb-4 text-center">
                   <div className="w-10 h-10 bg-white rounded-full p-1.5 shadow-xl mx-auto mb-2 border border-slate-100 flex items-center justify-center">
                      <Award className="w-6 h-6 text-[#e91e63]" />
                   </div>
                   <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] leading-none mb-1">UNITY CARE</h3>
                   <p className="text-[7px] font-bold text-white/60 uppercase tracking-[0.2em]">Foundation</p>
                </div>

                {/* Profile Picture Circle */}
                <div className="relative mb-5">
                  <div className="w-36 h-36 bg-white rounded-full p-1 shadow-2xl border-4 border-slate-900/5">
                    <div className="w-full h-full bg-slate-100 rounded-full overflow-hidden border-4 border-white">
                      {currentUser.profilePic ? (
                        <img src={currentUser.profilePic} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-16 h-16 m-10 text-slate-200" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Name & Designation */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight leading-none mb-1.5">{currentUser.name}</h2>
                  <p className="text-[12px] font-black text-[#e91e63] uppercase tracking-widest">{currentUser.designation || 'Verified Member'}</p>
                </div>

                {/* Details Section */}
                <div className="w-full space-y-1.5 mb-4 px-2">
                   <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400 uppercase tracking-widest">ID</span>
                      <span className="text-slate-900 font-black tracking-widest">: {memberId}</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400 uppercase tracking-widest">Joining</span>
                      <span className="text-slate-900 font-black tracking-widest">: {currentUser.registeredAt ? new Date(currentUser.registeredAt).toLocaleDateString('en-GB') : '01/02/2026'}</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400 uppercase tracking-widest">Phone</span>
                      <span className="text-slate-900 font-black tracking-widest">: {currentUser.phone}</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400 uppercase tracking-widest">Blood Group</span>
                      <span className="text-[#e91e63] font-black tracking-widest">: {currentUser.bloodGroup || '—'}</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400 uppercase tracking-widest">Expiry</span>
                      <span className="text-rose-600 font-black tracking-widest">: {currentUser.expiryDate || '31/12/2026'}</span>
                   </div>
                </div>

                {/* QR Code Area with Colorful Layers */}
                <div className="mt-auto mb-16 relative w-full flex justify-center">
                  {/* Decorative Bottom Layers within the content flow */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[140%] h-40 bg-[#0f172a] clip-path-id-top-v rotate-180 opacity-100 z-0"></div>
                  <div className="absolute -bottom-6 -left-10 w-48 h-24 bg-[#e91e63] clip-path-id-diagonal-right opacity-80 -rotate-6 z-0"></div>
                  <div className="absolute -bottom-6 -right-10 w-48 h-24 bg-[#e91e63] clip-path-id-diagonal-left opacity-80 rotate-6 z-0"></div>
                  
                  {/* The QR Code itself */}
                  <div className="p-2 bg-white rounded-2xl shadow-2xl border-2 border-slate-100 relative z-10 transform hover:scale-105 transition-transform duration-300">
                    <QRCodeSVG 
                      className="no-glow"
                      value={`${window.location.origin}/#/u/${currentUser.id}`}
                      size={90}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Accent Bar */}
              <div className="h-4 bg-[#0f172a] w-full flex">
                 <div className="h-full w-1/3 bg-[#e91e63]"></div>
                 <div className="h-full w-1/3 bg-[#0f172a]"></div>
                 <div className="h-full w-1/3 bg-[#e91e63]"></div>
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
                className="flex-grow py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-rose-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
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