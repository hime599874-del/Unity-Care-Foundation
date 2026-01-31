import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Globe, HandHeart, Sparkles, ArrowRight } from 'lucide-react';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col overflow-x-hidden">
      <div className="relative pt-20 pb-16 px-6 text-center flex flex-col items-center bg-white rounded-b-[4rem] shadow-sm overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-teal-50 rounded-full blur-[100px] -z-10 opacity-60 animate-pulse"></div>
        
        <div className="relative mb-10 w-full max-w-sm h-64 flex items-center justify-center animate-in fade-in zoom-in duration-1000">
           <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-[0_25px_25px_rgba(13,148,136,0.1)]">
              <circle cx="200" cy="130" r="70" fill="#f0fdfa" />
              <g className="animate-bounce" style={{ animationDuration: '3s' }}>
                <path d="M200,165 C175,140 150,140 150,105 C150,75 180,65 200,90 C220,65 250,75 250,105 C250,140 225,140 200,165 Z" fill="#0d9488" className="drop-shadow-lg" />
              </g>
           </svg>
           <Sparkles className="absolute top-8 right-12 w-8 h-8 text-amber-400 animate-pulse" />
           <HandHeart className="absolute bottom-4 left-12 w-10 h-10 text-teal-400 opacity-60" />
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight premium-text">
          Unity Care Foundation
        </h1>
        <p className="text-sm md:text-base font-bold text-slate-400 max-w-[340px] leading-relaxed mx-auto uppercase tracking-[0.2em]">
          একসাথে আমরা পারি একটি সুন্দর পৃথিবী গড়তে
        </p>
      </div>

      <div className="px-6 -mt-10 relative z-20">
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white flex items-center justify-around divide-x divide-slate-100 max-w-lg mx-auto">
           <div className="text-center px-4 flex-1">
              <p className="text-2xl font-black text-teal-600 premium-text">১০০%</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">স্বচ্ছতা</p>
           </div>
           <div className="text-center px-4 flex-1">
              <p className="text-2xl font-black text-blue-600 premium-text">২৪/৭</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">সেবা</p>
           </div>
           <div className="text-center px-4 flex-1">
              <p className="text-2xl font-black text-rose-500 premium-text">০%</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">লাভ</p>
           </div>
        </div>
      </div>

      <div className="px-6 space-y-8 mt-16 mb-44 max-w-2xl mx-auto">
        <div className="p-10 bg-slate-900 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group">
           <div className="flex items-center gap-5 mb-6">
              <div className="p-4 bg-teal-500/20 rounded-[1.5rem] backdrop-blur-xl border border-white/10 shadow-inner">
                 <Globe className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-[0.1em]">আমাদের লক্ষ্য</h3>
           </div>
           <p className="text-lg font-medium text-slate-200 leading-relaxed">
             সমাজের অবহেলিত মানুষের পাশে দাঁড়ানো এবং প্রতিটি অর্থ সাহায্যের সর্বোচ্চ সদ্ব্যবহার নিশ্চিত করা আমাদের মূল লক্ষ্য।
           </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent z-50">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-6 bg-teal-600 text-white rounded-full font-black text-xl shadow-xl hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-4 border-b-4 border-teal-800"
          >
            এগিয়ে যান <ArrowRight className="w-7 h-7" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;