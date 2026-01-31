import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, HandHelping, Sparkles, ArrowRight, ShieldCheck, Package, Users } from 'lucide-react';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* Hero Section - Matching User's Image Theme (Compact) */}
      <div className="relative pt-4 pb-4 px-6 text-center flex flex-col items-center bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-teal-50 rounded-full blur-[80px] -z-10 opacity-60"></div>
        
        <div className="relative mb-0 w-full max-w-[280px] h-40 flex items-center justify-center animate-in fade-in zoom-in duration-700">
           {/* Custom SVG mimicking the aid bag handover image */}
           <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-xl">
              {/* Receiver (Left - Dark Blue Coat) */}
              <circle cx="120" cy="110" r="30" fill="#E2E8F0" />
              <path d="M80,150 Q120,130 140,150 L140,220 L80,220 Z" fill="#1E293B" />
              <path d="M140,155 L180,175" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
              
              {/* Giver (Right - Brown/Tan Coat) */}
              <circle cx="280" cy="110" r="30" fill="#E2E8F0" />
              <path d="M240,150 Q280,130 320,150 L320,220 L240,220 Z" fill="#D97706" />
              <path d="M260,155 L220,175" stroke="#D97706" strokeWidth="8" strokeLinecap="round" />

              {/* Gift/Aid Bag in the middle */}
              <path d="M175,165 L225,165 L235,225 Q200,245 165,225 Z" fill="#FDE68A" className="animate-pulse" />
              <path d="M190,165 L210,165 L200,155 Z" fill="#B45309" />
              <text x="193" y="200" fill="#B45309" fontSize="18" fontWeight="bold">#</text>
           </svg>
           <Sparkles className="absolute top-4 right-4 w-5 h-5 text-amber-400 animate-pulse" />
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-0 tracking-tight premium-text leading-none">
          Unity Care Foundation
        </h1>
        <p className="text-[9px] font-black text-slate-400 max-w-[280px] leading-relaxed mx-auto uppercase tracking-[0.25em] mt-2">
          একসাথে আমরা পারি একটি সুন্দর পৃথিবী গড়তে
        </p>
      </div>

      {/* Stats Section - Compact & Humanitarian Themed */}
      <div className="px-6 relative z-20 mt-2">
        <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 flex items-center justify-around divide-x divide-slate-200 max-w-lg mx-auto shadow-sm">
           <div className="text-center px-2 flex-1">
              <p className="text-xl font-black text-teal-600 premium-text leading-none">১০০%</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">স্বচ্ছতা</p>
           </div>
           <div className="text-center px-2 flex-1">
              <p className="text-xl font-black text-blue-600 premium-text leading-none">২৪/৭</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">সেবা</p>
           </div>
           <div className="text-center px-2 flex-1 flex flex-col items-center">
              <Package className="w-5 h-5 text-amber-600 mb-0.5" />
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">মানবতা</p>
           </div>
        </div>
      </div>

      {/* Goals Section - Tight Margins */}
      <div className="px-6 space-y-3 mt-6 mb-32 max-w-2xl mx-auto">
        <div className="p-5 bg-slate-900 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-teal-500/20 rounded-xl border border-white/10">
                 <Globe className="w-4 h-4 text-teal-400" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.1em]">আমাদের লক্ষ্য</h3>
           </div>
           <p className="text-[10px] font-medium text-slate-300 leading-relaxed italic">
             সমাজের অবহেলিত মানুষের পাশে দাঁড়িয়ে প্রতিটি সাহায্যের স্বচ্ছ ব্যবহার নিশ্চিত করা আমাদের মূল লক্ষ্য। আপনার সামান্য দানে ফুটতে পারে অন্যের মুখে হাসি।
           </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1" />
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ভেরিফাইড সদস্য</p>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
              <HandHelping className="w-5 h-5 text-teal-500 mb-1" />
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">নিরাপদ অনুদান</p>
           </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-50">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-4 bg-teal-600 text-white rounded-full font-black text-lg shadow-xl hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-4 border-b-4 border-teal-800"
          >
            এগিয়ে যান <ArrowRight className="w-6 h-6" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;