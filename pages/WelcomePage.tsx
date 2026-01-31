
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, TrendingUp, ShieldCheck, Globe, HandHeart, Sparkles, ChevronRight, ArrowRight } from 'lucide-react';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col overflow-x-hidden">
      
      {/* Hero Section */}
      <div className="relative pt-16 pb-14 px-6 text-center flex flex-col items-center bg-white rounded-b-[5rem] shadow-sm overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-50 rounded-full blur-[120px] -z-10 opacity-70"></div>
        
        <div className="relative mb-12 w-full max-w-sm h-64 flex items-center justify-center animate-in fade-in zoom-in duration-1000">
           <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-[0_35px_35px_rgba(13,148,136,0.15)]">
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#0d9488', stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:'#0f766e', stopOpacity:1}} />
                </linearGradient>
              </defs>
              <circle cx="200" cy="130" r="60" fill="#f0fdfa" />
              <path d="M160,180 Q200,120 240,180 T320,180" fill="none" stroke="url(#grad1)" strokeWidth="15" strokeLinecap="round" opacity="0.3" />
              <g className="animate-pulse">
                <path d="M200,165 C175,140 150,140 150,105 C150,75 180,65 200,90 C220,65 250,75 250,105 C250,140 225,140 200,165 Z" fill="#0d9488" />
              </g>
           </svg>
           <Sparkles className="absolute top-10 right-10 w-10 h-10 text-yellow-400 animate-bounce" />
           <HandHeart className="absolute bottom-5 left-10 w-12 h-12 text-teal-400 animate-pulse" />
        </div>

        <h1 className="text-5xl font-black text-teal-900 mb-4 tracking-tighter leading-none">
          মানবিক সংগঠন
        </h1>
        <p className="text-base font-bold text-slate-400 max-w-[320px] leading-relaxed mx-auto uppercase tracking-widest">
          একসাথে আমরা পারি একটি সুন্দর পৃথিবী গড়তে।
        </p>
      </div>

      {/* Stats Quick View */}
      <div className="px-6 -mt-8 relative z-10">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-around divide-x divide-slate-100">
           <div className="text-center px-4">
              <p className="text-2xl font-black text-teal-600">১০০%</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">স্বচ্ছতা</p>
           </div>
           <div className="text-center px-4">
              <p className="text-2xl font-black text-blue-600">২৪/৭</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">সেবা</p>
           </div>
           <div className="text-center px-4">
              <p className="text-2xl font-black text-rose-500">০%</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ব্যক্তিগত লাভ</p>
           </div>
        </div>
      </div>

      {/* Mission & Features */}
      <div className="px-6 space-y-8 mt-12 mb-40 animate-in slide-in-from-bottom duration-700">
        
        <div className="p-10 bg-gradient-to-br from-teal-600 to-teal-800 rounded-[3.5rem] shadow-2xl shadow-teal-100 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
           <div className="flex items-center gap-5 mb-5">
              <div className="p-4 bg-white/20 rounded-[1.5rem] backdrop-blur-xl border border-white/20 shadow-inner">
                 <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-widest">আমাদের লক্ষ্য</h3>
           </div>
           <p className="text-lg font-bold text-teal-50/80 leading-relaxed">
             সমাজের পিছিয়ে পড়া মানুষের মুখে হাসি ফোটানো এবং প্রতিটি দানে সর্বোচ্চ স্বচ্ছতা বজায় রাখা।
           </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
           {[
             { icon: <Users className="w-7 h-7" />, title: 'সহজ রেজিস্ট্রেশন', desc: 'অত্যন্ত সহজ নিবন্ধন প্রক্রিয়া', color: 'bg-blue-50 text-blue-600' },
             { icon: <ShieldCheck className="w-7 h-7" />, title: 'স্বচ্ছ সেবা', desc: 'প্রতিটি দানের নির্ভুল অনলাইন হিসাব', color: 'bg-teal-50 text-teal-600' }
           ].map((item, idx) => (
             <div key={idx} className="p-8 bg-white border border-slate-100 rounded-[3rem] flex items-center gap-8 shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className={`w-18 h-18 ${item.color} rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                   {item.icon}
                </div>
                <div>
                   <h4 className="font-black text-slate-800 text-xl leading-tight">{item.title}</h4>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{item.desc}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-200 ml-auto group-hover:text-teal-500 transition-colors" />
             </div>
           ))}
        </div>

        {/* Policy Section */}
        <div className="p-10 bg-white border-2 border-slate-100 rounded-[4rem] space-y-8 shadow-inner">
           <div className="text-center relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-4 py-1 bg-teal-100 text-teal-700 rounded-full text-[9px] font-black uppercase tracking-[0.3em]">Organization Code</div>
              <h4 className="text-2xl font-black text-slate-800 pt-2">আমাদের নীতিমালা</h4>
           </div>
           <div className="space-y-5">
              {[
                'তহবিলের সকল হিসাব অ্যাপে সর্বদাই সংরক্ষিত থাকবে।',
                'শুধুমাত্র ভেরিফাইড সদস্যরা সরাসরি দান করতে পারবেন।',
                'যেকোনো ব্যক্তিগত স্বার্থের উর্ধ্বে মানবতার সেবা।'
              ].map((policy, i) => (
                <div key={i} className="flex items-start gap-5 p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                   <div className="w-3 h-3 bg-teal-600 rounded-full mt-2.5 shrink-0 shadow-[0_0_10px_rgba(13,148,136,0.3)]"></div>
                   <p className="text-base font-bold text-slate-600 leading-relaxed">{policy}</p>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent z-50">
        <button
          onClick={() => navigate('/auth')}
          className="w-full py-7 bg-teal-600 text-white rounded-[2.5rem] font-black text-xl shadow-[0_20px_50px_rgba(13,148,136,0.3)] hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-4 border-b-8 border-teal-800"
        >
          শুরু করুন <ArrowRight className="w-7 h-7" strokeWidth={3} />
        </button>
      </div>

    </div>
  );
};

export default WelcomePage;
