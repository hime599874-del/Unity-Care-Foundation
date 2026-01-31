
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { 
  ArrowLeft, Camera, User, Mail, Phone, Save, 
  CheckCircle2, X, Move, Maximize, Hash, ShieldCheck, 
  MessageSquare, ExternalLink, Headset
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Advanced Flexible Crop States
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, w: 150, h: 150 });
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const modalImageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    await db.updateUser(currentUser.id, { name, email });
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setCropBox({ x: 50, y: 50, w: 150, h: 150 });
      };
      reader.readAsDataURL(file);
    }
  };

  const startDraggingBox = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingBox(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragOffset({ x: clientX - cropBox.x, y: clientY - cropBox.y });
  };

  const startResizing = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingBox && !isResizing) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (isDraggingBox) {
      setCropBox(prev => ({
        ...prev,
        x: Math.max(0, clientX - dragOffset.x),
        y: Math.max(0, clientY - dragOffset.y)
      }));
    } else if (isResizing) {
      setCropBox(prev => ({
        ...prev,
        w: Math.max(50, clientX - (containerRef.current?.getBoundingClientRect().left || 0) - prev.x),
        h: Math.max(50, clientY - (containerRef.current?.getBoundingClientRect().top || 0) - prev.y)
      }));
    }
  };

  const stopAction = () => {
    setIsDraggingBox(false);
    setIsResizing(false);
  };

  const performCrop = async () => {
    if (!modalImageRef.current || !currentUser) return;

    const img = modalImageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = img.clientWidth;
    const displayHeight = img.clientHeight;
    const scaleX = img.naturalWidth / displayWidth;
    const scaleY = img.naturalHeight / displayHeight;

    canvas.width = cropBox.w * scaleX;
    canvas.height = cropBox.h * scaleY;

    ctx.drawImage(
      img,
      cropBox.x * scaleX,
      cropBox.y * scaleY,
      cropBox.w * scaleX,
      cropBox.h * scaleY,
      0, 0, canvas.width, canvas.height
    );

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.8);
    await db.updateUser(currentUser.id, { profilePic: croppedBase64 });
    setTempImage(null);
  };

  const memberId = currentUser?.phone?.slice(-4) || '0000';
  const inputClass = "w-full pl-12 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-black text-black transition-all";

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      <div className="bg-teal-600 text-white p-7 flex items-center gap-4 rounded-b-[2.5rem] shadow-xl">
        <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/20 rounded-xl backdrop-blur-md active:scale-90 transition-all"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-xl font-black">প্রোফাইল সেটিংস</h1>
      </div>

      <div className="p-6 flex flex-col items-center">
        <div className="relative mb-6 mt-4">
          <div className="w-36 h-36 rounded-[2.5rem] bg-white shadow-2xl border-4 border-white overflow-hidden flex items-center justify-center">
            {currentUser?.profilePic ? (
              <img src={currentUser.profilePic} className="w-full h-full object-cover" />
            ) : (
              <User className="w-16 h-16 text-gray-200" />
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 bg-teal-600 p-3.5 rounded-2xl shadow-xl cursor-pointer hover:bg-teal-700 transition-all border-4 border-white active:scale-90">
            <Camera className="w-6 h-6 text-white" />
            <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
          </label>
        </div>

        {/* Member ID Badge */}
        <div className="mb-8 flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200">
           <Hash className="w-4 h-4 text-teal-600" />
           <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">সদস্য আইডি: <span className="text-teal-700 text-sm">{memberId}</span></p>
        </div>

        {showSuccess && (
          <div className="w-full max-w-md mb-6 p-4 bg-green-50 text-green-600 rounded-2xl font-black text-[11px] flex items-center gap-2 border border-green-100">
            <CheckCircle2 className="w-5 h-5" /> তথ্য আপডেট হয়েছে!
          </div>
        )}

        <div className="w-full max-w-md space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em] ml-1">পূর্ণ নাম</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input className={inputClass} value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em] ml-1">ইমেইল ঠিকানা</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input className={inputClass} value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-50">
               <div className="flex items-center gap-2 text-teal-600">
                  <ShieldCheck className="w-4 h-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">মোবাইল: {currentUser?.phone}</p>
               </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-5 ${isSaving ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'} text-white rounded-[2rem] font-black text-lg shadow-xl shadow-teal-100 active:scale-95 transition-all`}
          >
            {isSaving ? 'প্রসেসিং...' : 'আপডেট সেভ করুন'}
          </button>

          {/* Contact Us Section */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-3 bg-teal-500/20 rounded-2xl">
                      <Headset className="w-6 h-6 text-teal-400" />
                   </div>
                   <div>
                      <h3 className="text-white font-black text-lg leading-tight">আমাদের সাথে যোগাযোগ করুন</h3>
                      <p className="text-teal-400/60 text-[10px] font-bold uppercase tracking-widest">ম্যানেজমেন্ট সাপোর্ট</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <a 
                     href="tel:+8801234567890" 
                     className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                   >
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-500/20 rounded-xl"><Phone className="w-4 h-4 text-blue-400" /></div>
                         <p className="text-sm font-black text-white">সরাসরি কল করুন</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                   </a>

                   <a 
                     href="https://wa.me/8801234567890" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                   >
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-green-500/20 rounded-xl"><MessageSquare className="w-4 h-4 text-green-400" /></div>
                         <p className="text-sm font-black text-white">হোয়াটসঅ্যাপ মেসেজ</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                   </a>
                </div>

                <div className="mt-6 text-center">
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Together for Humanity</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Flexible Custom Crop Modal */}
      {tempImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase tracking-tight">ছবি সিলেকশন করুন</h3>
              <button onClick={() => setTempImage(null)} className="p-2 text-slate-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            
            <div 
              className="relative flex-grow bg-slate-100 flex items-center justify-center overflow-hidden touch-none"
              onMouseMove={handleMouseMove}
              onMouseUp={stopAction}
              onMouseLeave={stopAction}
              onTouchMove={handleMouseMove}
              onTouchEnd={stopAction}
              ref={containerRef}
            >
              <img 
                ref={modalImageRef}
                src={tempImage} 
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
              
              <div 
                className="absolute border-2 border-teal-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move"
                style={{
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.w,
                  height: cropBox.h
                }}
                onMouseDown={startDraggingBox}
                onTouchStart={startDraggingBox}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                  <Move className="w-6 h-6" />
                </div>
                <div 
                  className="absolute -right-3 -bottom-3 w-8 h-8 bg-teal-500 rounded-full border-4 border-white shadow-lg cursor-nwse-resize flex items-center justify-center"
                  onMouseDown={startResizing}
                  onTouchStart={startResizing}
                >
                   <Maximize className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            <div className="p-8 bg-white border-t border-gray-100">
               <div className="mb-6 flex items-center gap-3 text-slate-400">
                 <div className="p-2 bg-slate-50 rounded-lg"><Move className="w-4 h-4" /></div>
                 <p className="text-[10px] font-black uppercase tracking-widest leading-tight">বক্সটি ড্র্যাগ করুন এবং কোণা ধরে সাইজ এডজাস্ট করুন</p>
               </div>
               
               <div className="flex gap-4">
                  <button onClick={() => setTempImage(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase active:scale-95 transition-all">বাতিল</button>
                  <button onClick={performCrop} className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-teal-100 active:scale-95 transition-all">ক্রপ ও সেভ</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
