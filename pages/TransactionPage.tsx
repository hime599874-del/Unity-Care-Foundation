import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { FundType } from '../types';
import { 
  ArrowLeft, Smartphone, Calculator, Calendar, Landmark, 
  Loader2, ChevronDown, DollarSign, Wallet,
  Check, X, Sparkles, Send, CheckCircle2
} from 'lucide-react';

const TransactionPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Bkash' | 'Nagad' | 'Rocket' | 'Bank'>('Bkash');
  const [fundType, setFundType] = useState<FundType>('General');
  const [txId, setTxId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const navigate = useNavigate();
  const quickAmounts = [10, 20, 50, 100, 200, 500, 1000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !txId || !currentUser || isSubmitting) return;

    // Set submitting instantly to block clicks
    setIsSubmitting(true);
    
    try {
      await db.submitTransaction({
        userId: currentUser.id,
        userName: currentUser.name,
        amount: parseFloat(amount),
        method,
        fundType,
        transactionId: txId.trim(),
        date
      });
      
      // Delay success modal slightly for better UX feel
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccessModal(true);
        setAmount('');
        setTxId('');
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert('তথ্য জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const inputClass = "w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-teal-500 font-bold text-sm text-black transition-all shadow-sm disabled:opacity-50";

  return (
    <div className="bg-[#EDF2F7] min-h-screen pb-10 relative font-['Hind_Siliguri']">
      <div className="px-6 pt-6 pb-2 flex items-center justify-between sticky top-0 bg-[#EDF2F7]/95 backdrop-blur-xl z-40 border-b border-slate-300">
        <button onClick={() => navigate('/dashboard')} disabled={isSubmitting} className="p-3 bg-white rounded-2xl shadow-sm text-teal-700 border border-slate-200 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" strokeWidth={3} />
        </button>
        <h1 className="text-lg font-black text-slate-800 tracking-tight italic">অনুদানের তথ্য</h1>
        <div className="w-11"></div>
      </div>

      <div className="p-6 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-teal-50 rounded-2xl text-teal-600"><DollarSign className="w-6 h-6" /></div>
                <h3 className="font-black text-slate-800">টাকার পরিমাণ</h3>
             </div>
             <input 
              type="number" 
              disabled={isSubmitting}
              className="w-full p-4 text-4xl font-black text-center bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-teal-500 transition-all text-teal-600 mb-6 placeholder:text-slate-200" 
              placeholder="৳ ০.০০" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
             />
             <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map(amt => (
                  <button key={amt} type="button" disabled={isSubmitting} onClick={() => setAmount(amt.toString())} className="py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 active:scale-90 transition-all">৳{amt}</button>
                ))}
             </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Smartphone className="w-6 h-6" /></div>
                <h3 className="font-black text-slate-800">পেমেন্ট মাধ্যম</h3>
             </div>
             <div className="grid grid-cols-2 gap-3">
                {['Bkash', 'Nagad', 'Rocket', 'Bank'].map(m => (
                  <button 
                    key={m} 
                    type="button" 
                    disabled={isSubmitting}
                    onClick={() => setMethod(m as any)}
                    className={`py-4 rounded-2xl font-black text-xs border-2 transition-all ${method === m ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    {m}
                  </button>
                ))}
             </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">ট্রানজেকশন আইডি (TxID)</p>
                <input 
                  type="text" 
                  disabled={isSubmitting}
                  className={inputClass} 
                  placeholder="XXX-XXXXXX" 
                  value={txId} 
                  onChange={e => setTxId(e.target.value)} 
                />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">তারিখ নির্বাচন করুন</p>
                <input 
                  type="date" 
                  disabled={isSubmitting}
                  className={inputClass} 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                />
             </div>
          </div>

          <button 
            type="submit" 
            disabled={!amount || !txId || isSubmitting}
            className={`w-full py-5 rounded-3xl font-black text-lg shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all ${!amount || !txId || isSubmitting ? 'bg-slate-300 text-slate-500 shadow-none' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-200'}`}
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> সাবমিট করুন</>}
          </button>
        </form>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">সফল হয়েছে!</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">আপনার অনুদানের তথ্যটি এডমিন প্যানেলে পাঠানো হয়েছে। যাচাইয়ের পর আপনার প্রোফাইলে যুক্ত হবে।</p>
              <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all">ফিরে যান</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default TransactionPage;