
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { FundType } from '../types';
import { 
  ArrowLeft, Smartphone, Calculator, Calendar, Landmark, 
  Loader2, ChevronDown, DollarSign, Wallet,
  Check, X, Sparkles, Send, CheckCircle2, CreditCard, Landmark as BankIcon, 
  Zap, Receipt, History, Coins, Hash, Building2
} from 'lucide-react';

const BANGLADESHI_BANKS = [
  "সোনালী ব্যাংক", "জনতা ব্যাংক", "অগ্রণী ব্যাংক", "রূপালী ব্যাংক", 
  "ইসলামী ব্যাংক বাংলাদেশ", "ডাচ-বাংলা ব্যাংক", "ব্র্যাক ব্যাংক", 
  "ইস্টার্ন ব্যাংক (EBL)", "সিটি ব্যাংক", "ইউনাইটেড কমার্শিয়াল ব্যাংক (UCB)", 
  "মিউচুয়াল ট্রাস্ট ব্যাংক (MTB)", "প্রাইম ব্যাংক", "পূবালী ব্যাংক", 
  "সোশ্যাল ইসলামী ব্যাংক", "আল-আরাফাহ ইসলামী ব্যাংক", "স্ট্যান্ডার্ড ব্যাংক", 
  "এক্সিম ব্যাংক", "মার্কেটাইল ব্যাংক", "ওয়ান ব্যাংক", "ট্রাস্ট ব্যাংক", 
  "যমুনা ব্যাংক", "সাউথ ইস্ট ব্যাংক", "ন্যাশনাল ব্যাংক"
];

const TransactionPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Bkash' | 'Nagad' | 'Rocket' | 'Bank'>('Bkash');
  const [selectedBank, setSelectedBank] = useState('');
  const [txId, setTxId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const navigate = useNavigate();
  const quickAmounts = [10, 20, 50, 100, 200, 500, 1000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation inside the function
    if (!amount) return alert('টাকার পরিমাণ লিখুন।');
    if (method === 'Bank' && !selectedBank) return alert('ব্যাংকের নাম নির্বাচন করুন।');
    if (txId.length < 4) return alert('লেনদেনের শেষ ৪ ডিজিট লিখুন।');
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await db.submitTransaction({
        userId: currentUser?.id,
        userName: currentUser?.name,
        amount: parseFloat(amount),
        method,
        bankName: method === 'Bank' ? selectedBank : null,
        transactionId: txId.trim(),
        date,
        fundType: 'General'
      });
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccessModal(true);
      }, 800);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert('তথ্য জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const toBengaliNumber = (num: number | string) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
  };

  const inputClass = "w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-teal-500 font-black text-base text-slate-900 transition-all shadow-sm disabled:opacity-50 placeholder:text-slate-400";

  const PAYMENT_METHODS = [
    { id: 'Bkash', label: 'বিকাশ', icon: <Smartphone className="w-6 h-6" />, brandColor: 'bg-[#E2136E]', shadowColor: 'shadow-[#E2136E]/30' },
    { id: 'Nagad', label: 'নগদ', icon: <Coins className="w-6 h-6" />, brandColor: 'bg-[#F26522]', shadowColor: 'shadow-[#F26522]/30' },
    { id: 'Rocket', label: 'রকেট', icon: <Zap className="w-6 h-6" />, brandColor: 'bg-[#8C3294]', shadowColor: 'shadow-[#8C3294]/30' },
    { id: 'Bank', label: 'ব্যাংক', icon: <BankIcon className="w-6 h-6" />, brandColor: 'bg-[#005BAC]', shadowColor: 'shadow-[#005BAC]/30' }
  ];

  const getTxLabel = () => {
    if (method === 'Bank') return "ব্যাংকের লাস্ট 4 ডিজিট লিখুন";
    return "যে নাম্বার দিয়ে টাকা পাঠিয়েছেন সেই নাম্বারের লাস্ট চার ডিজিট এখানে লিখুন";
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-10 relative font-['Hind_Siliguri']">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xl z-40 border-b border-slate-200 shadow-sm">
        <button onClick={() => navigate('/dashboard')} disabled={isSubmitting} className="p-3 bg-white rounded-2xl shadow-sm text-slate-900 border border-slate-200 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
           <h1 className="text-xl font-black text-slate-900 tracking-tight italic">অনুদানের তথ্য</h1>
           <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest mt-0.5">স্বচ্ছতার সাথে মানবতায় অংশ নিন</p>
        </div>
        <div className="w-11"></div>
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Amount Section */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-200">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 text-white">
                   <DollarSign className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">টাকার পরিমাণ</h3>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">কত টাকা পাঠিয়েছেন?</p>
                </div>
             </div>
             
             <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-teal-600 italic">৳</span>
                <input 
                 type="number" 
                 disabled={isSubmitting}
                 className="w-full p-7 pl-14 text-4xl font-black text-center bg-slate-50 border-2 border-slate-200 rounded-[2rem] outline-none focus:border-teal-500 transition-all text-teal-600 placeholder:text-slate-300" 
                 placeholder="০.০০" 
                 value={amount} 
                 onChange={e => setAmount(e.target.value)} 
                />
             </div>

             <div className="flex overflow-x-auto gap-2 mt-4 py-2 no-scrollbar">
                {quickAmounts.map(amt => (
                  <button 
                    key={amt} 
                    type="button" 
                    disabled={isSubmitting} 
                    onClick={() => setAmount(amt.toString())} 
                    className="shrink-0 px-5 py-3 bg-white border-2 border-slate-200 rounded-2xl text-[11px] font-black text-slate-800 active:scale-90 transition-all hover:border-teal-500 hover:text-teal-600 shadow-sm"
                  >
                    ৳{toBengaliNumber(amt)}
                  </button>
                ))}
             </div>
          </div>

          {/* Payment Method Section */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-200 space-y-6">
             <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
                   <Smartphone className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">পেমেন্ট মাধ্যম</h3>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">কোন মাধ্যমে পাঠিয়েছেন?</p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                {PAYMENT_METHODS.map(m => (
                  <button 
                    key={m.id} 
                    type="button" 
                    disabled={isSubmitting}
                    onClick={() => { setMethod(m.id as any); setTxId(''); }}
                    className={`group relative flex flex-col items-center gap-3 p-6 rounded-[2.5rem] border-2 transition-all active:scale-95 ${method === m.id ? `${m.brandColor} ${m.shadowColor} border-transparent shadow-xl` : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all ${method === m.id ? 'bg-white/20 text-white ring-4 ring-white/10' : `bg-white text-slate-400 border border-slate-200`}`}>
                       {React.cloneElement(m.icon as React.ReactElement, { className: method === m.id ? 'w-7 h-7' : 'w-6 h-6' })}
                    </div>
                    <span className={`font-black text-[12px] uppercase tracking-widest ${method === m.id ? 'text-white' : 'text-slate-600'}`}>
                       {m.label}
                    </span>
                    {method === m.id && <div className="absolute top-4 right-4 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-50"><Check className={`w-3.5 h-3.5 ${m.brandColor.replace('bg-', 'text-')}`} strokeWidth={4} /></div>}
                  </button>
                ))}
             </div>

             {method === 'Bank' && (
               <div className="space-y-3 animate-in fade-in zoom-in-95">
                 <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-2">ব্যাংক নির্বাচন করুন</p>
                 <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                    <select 
                      disabled={isSubmitting}
                      className={`${inputClass} pl-12 appearance-none h-16`}
                      value={selectedBank}
                      onChange={e => setSelectedBank(e.target.value)}
                    >
                      <option value="" className="text-slate-400">ব্যাংক লিস্ট</option>
                      {BANGLADESHI_BANKS.map(bank => <option key={bank} value={bank} className="text-slate-900 font-bold">{bank}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                 </div>
               </div>
             )}
          </div>

          {/* Details Section */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-200 space-y-6">
             <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200 text-white">
                   <Hash className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">লেনদেনের প্রমাণ</h3>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ভেরিফিকেশন তথ্য দিন</p>
                </div>
             </div>

             <div className="space-y-6">
                <div>
                   <p className="text-[12px] font-black text-slate-800 leading-relaxed mb-3 ml-2">{getTxLabel()}</p>
                   <div className="relative">
                      <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        inputMode="numeric"
                        maxLength={4}
                        disabled={isSubmitting}
                        className={`${inputClass} pl-12 text-center text-3xl tracking-[0.5em] h-18`} 
                        placeholder="••••" 
                        value={txId} 
                        onChange={e => setTxId(e.target.value.replace(/\D/g, ''))} 
                      />
                   </div>
                </div>
                <div>
                   <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2 ml-2">পাঠানোর তারিখ</p>
                   <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <input 
                        type="date" 
                        disabled={isSubmitting}
                        className={`${inputClass} pl-12 h-16`} 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                      />
                   </div>
                </div>
             </div>
          </div>

          {/* Submit Button - Always Bright as requested */}
          <button 
            type="submit" 
            className={`w-full py-6 rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all border-b-8 ${
              isSuccess 
                ? 'bg-emerald-600 text-white border-emerald-800 shadow-emerald-200' 
                : 'bg-teal-600 text-white border-teal-800 shadow-teal-200'
            }`}
          >
            {isSubmitting && !isSuccess ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : isSuccess ? (
              <><CheckCircle2 className="w-8 h-8" /> সফল হয়েছে!</>
            ) : (
              <><Send className="w-7 h-7" /> সাবমিট করুন</>
            )}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-8">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 text-center shadow-2xl animate-in zoom-in-95 duration-300 border-4 border-teal-50">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100 ring-8 ring-emerald-50">
                 <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4">অভিনন্দন!</h3>
              <p className="text-[15px] font-bold text-slate-800 leading-relaxed mb-10 px-4">আপনার রিকোয়েস্ট সফল হয়েছে। অ্যাকাউন্ট ম্যানেজার যাচাই-বাছাইয়ের পরে অনুমোদন করবেন। ধন্যবাদ।</p>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-base uppercase tracking-widest active:scale-95 transition-all border-b-4 border-black shadow-xl"
              >
                ড্যাশবোর্ডে ফিরে যান
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default TransactionPage;
