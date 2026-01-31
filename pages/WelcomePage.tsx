import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Users, CheckCircle2, Globe2 } from 'lucide-react';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative">
      {/* Subtle Background Gradients */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-teal-100/30 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] -z-10"></div>
      
      <div className="w-full max-w-md px-6 flex flex-col items-center">
        
        {/* Branding Section - Reduced Spacing */}
        <div className="relative mb-6 animate-in fade-in zoom-in duration-700">
           <div className="absolute inset-0 bg-teal-500/15 rounded-[2.5rem] blur-xl transform rotate-3"></div>
           <div className="relative bg-white p-6 rounded-[2.8rem] shadow-xl border-2 border-white flex items-center justify-center">
              <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-5 rounded-[2.2rem] shadow-inner">
                <Heart className="w-12 h-12 text-white fill-white/10" strokeWidth={2.5} />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-amber-400 animate-pulse" />
           </div>
        </div>

        {/* Title & Tagline - Tighter Typography */}
        <div className="text-center space-y-2 mb-8 animate-in slide-in-from-bottom duration-700 delay-150">
           <h1 className="text-4xl font-black text-slate-900 tracking-tight premium-text leading-none">
             Unity Care <span className="text-teal-600">Foundation</span>
           </h1>
           <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-4 bg-slate-200"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                মানবিকতায় আমরা এক
              </p>
              <div className="h-[1px] w-4 bg-slate-200"></div>
           </div>
        </div>

        {/* Compact Impact Cards Grid */}
        <div className="grid grid-cols-3 gap-3 w-full mb-10 animate-in slide-in-from-bottom duration-700 delay-300">
           {[
             { title: 'স্বচ্ছতা', icon: <ShieldCheck className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
             { title: 'সেবা', icon: <Globe2 className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
             { title: 'মানবতা', icon: <Users className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' }
           ].map((card, i) => (
             <div key={i} className="bg-white/70 backdrop-blur-sm p-4 rounded-[2rem] border border-white shadow-sm flex flex-col items-center text-center transition-all hover:bg-white active:scale-95 group">
                <div className={`${card.color} p-3 rounded-2xl mb-2 transition-transform shadow-sm`}>
                   {card.icon}
                </div>
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{card.title}</h3>
             </div>
           ))}
        </div>

        {/* Action Section - Modern & Clean */}
        <div className="w-full max-w-[280px] space-y-6 animate-in slide-in-from-bottom duration-700 delay-450">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            <button
              onClick={() => navigate('/auth')}
              className="relative w-full py-4 bg-teal-600 text-white rounded-full font-black text-lg shadow-xl hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-4 border-b-4 border-teal-800"
            >
              এগিয়ে যান 
              <ArrowRight className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-2 opacity-40">
             <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
             <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">একটি অরাজনৈতিক সংগঠন</p>
          </div>
        </div>

      </div>
      
      {/* Decorative Bottom Pattern (Optional, subtle) */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-5">
         <div className="flex gap-1">
            {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-1 bg-teal-900 rounded-full"></div>)}
         </div>
      </div>
    </div>
  );
};

export default WelcomePage;