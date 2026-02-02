
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { AssistanceStatus, AssistanceRequest } from '../types';
import { 
  ArrowLeft, HandHelping, MessageSquare, Send, 
  Clock, CheckCircle2, XCircle, Info, Loader2, AlertCircle, ChevronRight,
  Zap, HeartPulse, GraduationCap, Utensils
} from 'lucide-react';

const AssistancePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<any>('Emergency');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRequests, setUserRequests] = useState<AssistanceRequest[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = () => {
      const reqs = db.getAssistanceRequests().filter(r => r.userId === currentUser?.id);
      setUserRequests(reqs);
    };
    refresh();
    const unsubscribe = db.subscribe(refresh);
    return unsubscribe;
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await db.submitAssistanceRequest({
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        category,
        amount: amount ? parseFloat(amount) : 0,
        reason: reason.trim()
      });
      setReason('');
      setAmount('');
      alert('আপনার আবেদনটি এডমিন প্যানেলে পাঠানো হয়েছে।');
    } catch (err) {
      alert('আবেদন পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toBengaliNumber = (num: number | string) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
  };

  const getStatusStyle = (status: AssistanceStatus) => {
    switch (status) {
      case AssistanceStatus.APPROVED: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case AssistanceStatus.REJECTED: return 'bg-rose-50 text-rose-700 border-rose-100';
      case AssistanceStatus.DISBURSED: return 'bg-blue-50 text-blue-700 border-blue-100';
      case AssistanceStatus.REVIEWING: return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusText = (status: AssistanceStatus) => {
    switch (status) {
      case AssistanceStatus.APPROVED: return 'গৃহীত';
      case AssistanceStatus.REJECTED: return 'বাতিল';
      case AssistanceStatus.DISBURSED: return 'প্রদান করা হয়েছে';
      case AssistanceStatus.REVIEWING: return 'যাচাই চলছে';
      default: return 'পেন্ডিং';
    }
  };

  const CATEGORIES = [
    { id: 'Emergency', label: 'জরুরি', icon: <Zap className="w-6 h-6" />, color: 'bg-amber-50 text-amber-600', active: 'bg-amber-600 text-white' },
    { id: 'Medical', label: 'চিকিৎসা', icon: <HeartPulse className="w-6 h-6" />, color: 'bg-rose-50 text-rose-600', active: 'bg-rose-600 text-white' },
    { id: 'Education', label: 'শিক্ষা', icon: <GraduationCap className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600', active: 'bg-blue-600 text-white' },
    { id: 'Food', label: 'খাদ্য সাহায্য', icon: <Utensils className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600', active: 'bg-emerald-600 text-white' }
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-['Hind_Siliguri']">
      <div className="px-6 pt-8 pb-6 bg-white border-b border-slate-100 sticky top-0 z-30 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">সাহায্যের আবেদন</h1>
          <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mt-0.5">মানবিক প্রয়োজনে আমরা আপনার পাশে</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Request Form */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 {CATEGORIES.map(cat => (
                   <button 
                     key={cat.id} 
                     type="button" 
                     onClick={() => setCategory(cat.id)}
                     className={`group flex flex-col items-center gap-3 p-4 rounded-[2rem] border-2 transition-all active:scale-95 ${category === cat.id ? 'border-slate-800 bg-slate-900 shadow-xl' : 'bg-slate-50 border-slate-100'}`}
                   >
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all ${category === cat.id ? 'bg-white/20 text-white ring-4 ring-white/10' : cat.color}`}>
                        {cat.icon}
                     </div>
                     <span className={`font-black text-[10px] uppercase tracking-wider ${category === cat.id ? 'text-white' : 'text-slate-400'}`}>
                        {cat.label}
                     </span>
                   </button>
                 ))}
              </div>

              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">প্রয়োজনীয় টাকার পরিমাণ (ঐচ্ছিক)</p>
                 <input 
                   type="number" 
                   className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-black text-xl text-teal-700 transition-all" 
                   placeholder="৳ ০.০০" 
                   value={amount} 
                   onChange={e => setAmount(e.target.value)} 
                 />
              </div>

              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">আবেদনের বিস্তারিত কারণ</p>
                 <textarea 
                   rows={4} 
                   className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-xs text-slate-800 transition-all" 
                   placeholder="আপনার সমস্যার কথা বিস্তারিতভাবে এখানে লিখুন যাতে আমাদের যাচাই করতে সুবিধা হয়..."
                   value={reason}
                   onChange={e => setReason(e.target.value)}
                 />
              </div>

              <button 
                type="submit" 
                disabled={!reason.trim() || isSubmitting}
                className="w-full py-5 bg-teal-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-teal-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all border-b-4 border-teal-800"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> আবেদন জমা দিন</>}
              </button>
           </form>
        </div>

        {/* User Requests List */}
        <div className="space-y-4">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> আপনার পূর্ববর্তী আবেদনসমূহ
           </h3>
           <div className="space-y-4">
              {userRequests.map(req => (
                <div key={req.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusStyle(req.status)} border shadow-sm`}>
                            {req.status === AssistanceStatus.APPROVED ? <CheckCircle2 className="w-5 h-5" /> : req.status === AssistanceStatus.REJECTED ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                         </div>
                         <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">{getStatusText(req.status)}</span>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{toBengaliNumber(new Date(req.timestamp).toLocaleDateString('bn-BD'))}</p>
                         </div>
                      </div>
                      {req.amount > 0 && <p className="font-black text-slate-800 text-xl">৳{toBengaliNumber(req.amount.toLocaleString())}</p>}
                   </div>
                   <p className="text-sm font-bold text-slate-600 leading-relaxed mb-4">{req.reason}</p>
                   
                   {req.adminNote && (
                     <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-start">
                        <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-black text-blue-800 italic leading-snug">এডমিন নোট: {req.adminNote}</p>
                     </div>
                   )}
                </div>
              ))}
              {userRequests.length === 0 && (
                <div className="text-center py-12 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                   <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">এখনো কোন আবেদন পাওয়া যায়নি</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AssistancePage;
