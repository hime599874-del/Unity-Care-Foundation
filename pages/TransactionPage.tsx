
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
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  const quickAmounts = [10, 20, 50, 100, 200, 500, 1000];
  const isBank = method === 'Bank';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !txId || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await db.submitTransaction({
        userId: currentUser.id,
        userName: currentUser.name,
        amount: parseFloat(amount),
        method,
        fundType,
        transactionId: txId,
        date
      });
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccessModal(true);
        setAmount('');
        setTxId('');
      }, 800);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#EDF2F7] min-h-screen pb-10 relative font-['Hind_Siliguri']">
      {/* High-Contrast Header */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between sticky top-0 bg-[#EDF2F7]/95 backdrop-blur-xl z-40 border-b border-slate-300">
        <button onClick={() => navigate('/dashboard')} className="p-2.5 bg-white rounded-xl shadow-md text-black border-2 border-slate-300 active:scale-90 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-black">দান পাঠান</h1>
        <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border-2 border-slate-300 shadow-sm">
           <DollarSign className="w-6 h-6 text-teal-700" />
        </div>
      </div>

      <div className="px-5 py-4 max-w-md mx-auto space-y-4">
        {/* Main Content Card with High Contrast Border */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-300 overflow-hidden">
          <div className="p-6 space-y-5">
            
            {/* 1. Method Selection - Darker Border */}
            <div className="p-4 rounded-3xl border-2 border-slate-200 bg-slate-50">
               <p className="text-[11px] font-black uppercase text-black mb-3 tracking-widest text-center">পেমেন্ট মেথড নির্বাচন করুন</p>
               <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'Bkash', color: 'border-[#E2136E] text-[#E2136E]' },
                  { id: 'Nagad', color: 'border-[#F7941E] text-[#F7941E]' },
                  { id: 'Rocket', color: 'border-[#8C3494] text-[#8C3494]' },
                  { id: 'Bank', color: 'border-blue-700 text-blue-700' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id as any)}
                    className={`py-3 rounded-2xl border-2 font-black text-[10px] transition-all flex flex-col items-center gap-1 active:scale-95 ${
                      method === m.id ? m.color + ' bg-white border-2 shadow-inner' : 'border-slate-300 bg-white/50 text-slate-400 opacity-60'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    {m.id}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Fund Selection */}
            <div className="p-4 rounded-3xl border-2 border-slate-200 bg-white">
                <p className="text-[11px] font-black uppercase text-black mb-2 tracking-widest text-center">ফান্ড নির্বাচন</p>
                <div className="relative">
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 font-black text-black text-sm appearance-none"
                    value={fundType}
                    onChange={(e) => setFundType(e.target.value as FundType)}
                  >
                    <option value="General">জেনারেল ফান্ড (General)</option>
                    <option value="Special">স্পেশাল ফান্ড (Special)</option>
                    <option value="Emergency">জরুরী ফান্ড (Emergency)</option>
                    <option value="Other">অন্যান্য (Other)</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
                </div>
            </div>

            {/* 3. Amount Section - Highly Clear */}
            <div className="p-5 rounded-3xl border-2 border-slate-200 text-center bg-slate-50">
                <p className="text-[11px] font-black uppercase text-black mb-3 tracking-widest">টাকার পরিমাণ</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                   <span className="text-3xl font-black text-teal-700">৳</span>
                   <input
                    type="number"
                    className="w-full text-5xl font-black text-black outline-none placeholder:text-slate-300 bg-transparent text-center max-w-[180px]"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                   {quickAmounts.map(val => (
                     <button 
                       key={val}
                       onClick={() => setAmount(val.toString())}
                       className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 active:scale-90 ${amount === val.toString() ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-black border-slate-300 hover:border-black'}`}
                     >
                       ৳{val}
                     </button>
                   ))}
                </div>
            </div>

            {/* 4. Detail Inputs */}
            <div className="grid grid-cols-1 gap-3">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 p-1.5 bg-slate-200 rounded-lg group-focus-within:bg-black transition-colors">
                    <Calculator className="w-4 h-4 text-black group-focus-within:text-white" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-300 rounded-[1.8rem] outline-none focus:border-black font-black text-black text-sm transition-all"
                    placeholder={isBank ? "অ্যাকাউন্টের শেষ ৪ ডিজিট" : "নাম্বারের শেষ ৪ ডিজিট"}
                    value={txId}
                    onChange={e => setTxId(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 p-1.5 bg-slate-200 rounded-lg group-focus-within:bg-black transition-colors">
                    <Calendar className="w-4 h-4 text-black group-focus-within:text-white" />
                  </div>
                  <input
                    type="date"
                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-300 rounded-[1.8rem] outline-none focus:border-black font-black text-black text-sm transition-all"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
            </div>

            {/* 5. Thick High-Impact Button */}
            <button
                onClick={handleSubmit}
                disabled={!amount || !txId || isSubmitting}
                className={`w-full py-6 rounded-[2.2rem] font-black text-lg text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 border-b-8 ${
                  isSuccess ? 'bg-green-600 border-green-800 shadow-green-200' : 
                  isSubmitting ? 'bg-slate-400 border-slate-600' : 'bg-teal-700 border-teal-900 shadow-teal-100 hover:bg-teal-800'
                }`}
              >
                {isSubmitting && !isSuccess ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <>
                    <Send className={`w-7 h-7 ${isSuccess ? 'animate-bounce' : ''}`} />
                    {isSuccess ? 'দান সফলভাবে পাঠানো হয়েছে' : 'দান নিশ্চিত করুন'}
                  </>
                )}
              </button>
          </div>
        </div>

        {/* Informational Layer with Border */}
        <div className="bg-blue-50 p-5 rounded-[2rem] border-2 border-blue-200 flex items-start gap-4 shadow-sm">
           <div className="p-2.5 bg-white rounded-xl border border-blue-100 text-blue-600 shadow-sm">
             <Landmark className="w-5 h-5" />
           </div>
           <p className="text-[11px] font-black text-blue-900 leading-relaxed">
             আপনার পাঠানো তথ্যের সত্যতা এডমিন প্যানেল থেকে যাচাই করে অনুমোদন দেওয়া হবে। অনুমোদনের পর এটি আপনার ইতিহাস ও মেইন ফান্ডের সাথে যুক্ত হবে।
           </p>
        </div>
      </div>

      {/* Large Success Modal - Maximum Contrast */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-12 text-center shadow-2xl border-4 border-green-500 animate-in zoom-in-95 duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-green-500"></div>
              
              <div className="w-28 h-28 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-4 border-green-100">
                 <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping"></div>
                 <CheckCircle2 className="w-16 h-16 relative z-10" />
              </div>
              
              <h2 className="text-3xl font-black text-black mb-3 leading-tight">অভিনন্দন!<br/>দান সফল হয়েছে</h2>
              <p className="text-[12px] text-slate-600 font-bold mb-10 leading-relaxed">
                আপনার ৳{amount} এর অনুদানের রিকোয়েস্টটি আমরা পেয়েছি। এডমিন এটি যাচাই করে অনুমোদন করবেন।
              </p>
              
              <div className="space-y-4">
                 <button 
                   onClick={() => navigate('/history')}
                   className="w-full py-5 bg-black text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
                 >
                   ইতিহাস দেখুন <ArrowLeft className="w-5 h-5 rotate-180" />
                 </button>
                 <button 
                   onClick={() => setShowSuccessModal(false)}
                   className="w-full py-5 bg-slate-100 text-black rounded-[2rem] font-black text-xs border-2 border-slate-300"
                 >
                   বন্ধ করুন
                 </button>
              </div>

              <Sparkles className="absolute top-10 right-10 w-8 h-8 text-yellow-400 animate-pulse" />
              <Sparkles className="absolute bottom-40 left-10 w-6 h-6 text-teal-300 animate-pulse delay-75" />
           </div>
        </div>
      )}
    </div>
  );
};

export default TransactionPage;
