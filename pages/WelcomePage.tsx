
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Users, Globe2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center overflow-hidden relative font-['Hind_Siliguri']">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-teal-100/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-100/20 rounded-full blur-[120px] -z-10"></div>
      
      <div className="w-full max-w-md px-8 flex flex-col items-center">
        <div className="relative mb-10 animate-in fade-in zoom-in duration-1000">
           <div className="relative bg-white p-8 rounded-[3.5rem] shadow-xl border-2 border-white flex items-center justify-center">
              <div className="bg-teal-600 p-6 rounded-[2.5rem]">
                <Heart className="w-14 h-14 text-white" />
              </div>
              <Sparkles className="absolute -top-3 -right-3 w-10 h-10 text-amber-400" />
           </div>
        </div>

        <div className="text-center space-y-4 mb-12 animate-in slide-in-from-bottom duration-1000 delay-200">
           <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
             Unity Care <span className="text-teal-600">{t('foundation')}</span>
           </h1>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em]">
             {t('slogan')}
           </p>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full mb-12 animate-in slide-in-from-bottom duration-1000 delay-400">
           {[
             { title: t('transparency'), icon: <ShieldCheck className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600' },
             { title: t('service'), icon: <Globe2 className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
             { title: t('humanity'), icon: <Users className="w-6 h-6" />, color: 'bg-amber-50 text-amber-600' }
           ].map((card, i) => (
             <div key={i} className="bg-white p-4 rounded-[2rem] shadow-sm flex flex-col items-center text-center">
                <div className={`${card.color} p-3 rounded-xl mb-2`}>
                   {card.icon}
                </div>
                <h3 className="text-[9px] font-black text-slate-800 uppercase">{card.title}</h3>
             </div>
           ))}
        </div>

        <div className="w-full space-y-6 animate-in slide-in-from-bottom duration-1000 delay-600">
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-5 bg-teal-600 text-white rounded-full font-black text-xl shadow-xl hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-4 border-b-4 border-teal-800"
          >
            {t('get_started')} <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center gap-2 opacity-30">
             <CheckCircle2 className="w-4 h-4 text-teal-600" />
             <p className="text-[9px] font-black uppercase tracking-[0.3em]">{t('non_political')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
