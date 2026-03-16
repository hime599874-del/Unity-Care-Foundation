import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../services/ToastContext';
import { db } from '../services/db';
import { FundType } from '../types';
import { 
  ArrowLeft, Smartphone, ChevronDown, DollarSign, Wallet,
  Check, X, Send, CheckCircle2, Landmark as BankIcon, 
  Zap, Receipt, Coins, Hash, Building2, Loader2
} from 'lucide-react';

const BANGLADESHI_BANKS = [
  "সোনালী ব্যাংক", "জনতা ব্যাংক", "অগ্রণী ব্যাংক", "রূপালী ব্যাংক", 
  "ইসলামী ব্যাংক বাংলাদেশ", "ডাচ-বাংলা ব্যাংক", "ব্র্যাক ব্যাংক", 
  "সিটি ব্যাংক", "ইউসিবি ব্যাংক", "মিউচুয়াল ট্রাস্ট ব্যাংক", "প্রাইম ব্যাংক"
];

const TransactionPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Bkash' | 'Nagad' | 'Rocket' | 'Bank'>('Bkash');
  const [selectedBank, setSelectedBank] = useState('');
  const [fundType, setFundType] = useState<FundType>('General');
  const [txId, setTxId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const navigate = useNavigate();
  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return showToast('টাকার পরিমাণ লিখুন।', 'error');
    if (method === 'Bank' && !selectedBank) return showToast('ব্যাংকের নাম নির্বাচন করুন।', 'error');
    if (txId.length < 4) return showToast('লেনদেনের শেষ 4 ডিজিট লিখুন।', 'error');
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
          fundType
        });
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccessModal(true);
      }, 800);
    } catch (err) {
      setIsSubmitting(false);
      showToast('তথ্য জমা দিতে সমস্যা হয়েছে।', 'error');
    }
  };

  const toBengaliNumber = (num: number | string) => {
    return num.toString();
  };

  const inputClass = "w-full p-4 bg-white/40 backdrop-blur-md border-2 border-white/50 rounded-2xl outline-none focus:border-teal-500 font-bold text-sm text-slate-800 transition-all";

  return (
    <div className="bg-transparent min-h-screen pb-20 font-['Hind_Siliguri']">
      <div className="px-6 pt-8 pb-4 flex items-center gap-4 sticky top-0 glass-nav z-10">
        <button onClick={() => navigate('/dashboard')} disabled={isSubmitting} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black text-slate-800">দান করুন</h1>
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card p-6 rounded-[2.5rem]">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><DollarSign className="w-6 h-6" /></div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">টাকার পরিমাণ</h3>
             </div>
             <input type="number" disabled={isSubmitting} className="w-full p-6 text-4xl font-black text-center bg-white/40 backdrop-blur-md border-2 border-white/50 rounded-3xl outline-none focus:border-teal-500 transition-all text-teal-600 mb-6" placeholder="৳ 0" value={amount} onChange={e => setAmount(e.target.value)} />
             <div className="grid grid-cols-3 gap-3">
                {quickAmounts.map(amt => (
                  <button 
                    key={amt} 
                    type="button" 
                    disabled={isSubmitting} 
                    onClick={() => setAmount(amt.toString())} 
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 active:scale-95 transition-all hover:bg-white hover:border-teal-200 shadow-sm"
                  >
                    ৳{toBengaliNumber(amt)}
                  </button>
                ))}
             </div>
          </div>

          <div className="glass-card p-6 rounded-[2.5rem] space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Coins className="w-6 h-6" /></div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">ফান্ড টাইপ</h3>
             </div>
             <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'General', label: 'সাধারণ' },
                  { id: 'AppProblem', label: 'অ্যাপ প্রবলেম' },
                  { id: 'Special', label: 'বিশেষ' },
                  { id: 'Emergency', label: 'জরুরী' }
                ].map(f => (
                  <button 
                    key={f.id} 
                    type="button" 
                    disabled={isSubmitting} 
                    onClick={() => setFundType(f.id as any)} 
                    className={`p-4 rounded-2xl border-2 transition-all ${fundType === f.id ? 'bg-amber-50 border-amber-500' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <span className={`font-black text-[10px] ${fundType === f.id ? 'text-amber-700' : 'text-slate-400'}`}>{f.label}</span>
                  </button>
                ))}
             </div>
          </div>

          <div className="glass-card p-6 rounded-[2.5rem] space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Wallet className="w-6 h-6" /></div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">পেমেন্ট মেথড</h3>
             </div>
             <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'Bkash', label: 'বিকাশ', color: 'bg-[#D12053]', icon: <span className="text-white font-black italic">b</span> },
                  { id: 'Nagad', label: 'নগদ', color: 'bg-[#F7941D]', icon: <span className="text-white font-black">n</span> },
                  { id: 'Rocket', label: 'রকেট', color: 'bg-[#8C3494]', icon: <Zap className="w-4 h-4 text-white fill-current" /> },
                  { id: 'Bank', label: 'ব্যাংক', color: 'bg-blue-600', icon: <BankIcon className="w-4 h-4 text-white" /> }
                ].map(m => (
                  <button 
                    key={m.id} 
                    type="button" 
                    disabled={isSubmitting} 
                    onClick={() => setMethod(m.id as any)} 
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${method === m.id ? 'bg-teal-50 border-teal-500' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <div className={`w-10 h-10 ${m.color} rounded-xl flex items-center justify-center shadow-sm`}>
                       {m.icon}
                    </div>
                    <span className={`font-black text-[10px] ${method === m.id ? 'text-teal-700' : 'text-slate-400'}`}>{m.label}</span>
                  </button>
                ))}
             </div>
             {method === 'Bank' && (
               <select disabled={isSubmitting} className={inputClass} value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                  <option value="">ব্যাংক নির্বাচন করুন</option>
                  {BANGLADESHI_BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
               </select>
             )}
          </div>

          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-3">
             <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Hash className="w-5 h-5" /></div>
                <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">ভেরিফিকেশন</h3>
             </div>
             <input type="text" maxLength={4} disabled={isSubmitting} className={`${inputClass} !p-3 text-center tracking-widest text-base shadow-inner`} placeholder="নম্বরের শেষ 4 ডিজিট" value={txId} onChange={e => setTxId(e.target.value.replace(/\D/g, ''))} />
             <input type="date" disabled={isSubmitting} className={`${inputClass} !p-3 text-xs shadow-inner`} value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all border-b-8 border-teal-800">
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'জমা দিন'}
          </button>
        </form>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-8">
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center shadow-2xl animate-in zoom-in-95">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-800 mb-2">সফল হয়েছে!</h3>
              <p className="text-sm font-bold text-slate-500 mb-8">তথ্য যাচাইয়ের পর আপনার একাউন্টে ব্যালেন্স যোগ হবে।</p>
              <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl">ঠিক আছে</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default TransactionPage;