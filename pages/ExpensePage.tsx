import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Expense } from '../types';
import { ArrowLeft, Calendar, FileText, TrendingDown, Wallet, Receipt, Info, X } from 'lucide-react';

const ExpensePage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState(db.getStats());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const refreshData = () => {
      const allExpenses = db.getExpenses().sort((a, b) => b.timestamp - a.timestamp);
      setExpenses(allExpenses);
      setStats(db.getStats());
    };
    refreshData();
    const unsubscribe = db.subscribe(refreshData);
    return unsubscribe;
  }, []);

  const toBengaliNumber = (num: number | string) => {
    return num.toLocaleString();
  };

  const remainingFund = stats.totalCollection - stats.totalExpense;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-['Hind_Siliguri']">
      {/* Header */}
      <div className="px-5 pt-8 pb-6 bg-white rounded-b-[3rem] shadow-sm border-b border-slate-100 flex items-center gap-4 sticky top-0 z-30">
        <button onClick={() => navigate('/dashboard')} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800">ব্যয়ের হিসাব</h1>
          <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mt-0.5">সংগঠনের খরচের স্বচ্ছতা</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Total Expense Card */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-8 rounded-[2.5rem] shadow-xl shadow-rose-100 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
           <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mb-1">সর্বমোট ব্যয়</p>
                <h2 className="text-4xl font-black">৳{toBengaliNumber(stats.totalExpense)}</h2>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative w-10 h-10 flex items-center justify-center scale-125">
                  {/* Chair */}
                  <div className="absolute bottom-1 w-5 h-4 bg-blue-600 rounded-sm shadow-lg"></div>
                  <div className="absolute bottom-0 w-1.5 h-3 bg-blue-700 left-1/2 -translate-x-1/2"></div>
                  
                  {/* Person Legs */}
                  <div className="absolute bottom-2.5 w-4 h-3 bg-slate-900 rounded-full"></div>
                  
                  {/* Torso */}
                  <div className="absolute bottom-4 w-6 h-6 bg-amber-400 rounded-xl shadow-inner border border-amber-500/20"></div>
                  
                  {/* Head */}
                  <div className="absolute top-0.5 w-4 h-4 bg-[#FFE4E1] rounded-full border border-pink-200 shadow-md"></div>
                  {/* Hair */}
                  <div className="absolute top-0.5 w-4 h-1.5 bg-slate-800 rounded-t-full"></div>
                  
                  {/* Laptop */}
                  <div className="absolute bottom-5 w-7 h-4 bg-slate-800 rounded-sm transform -rotate-6 border border-slate-700 shadow-xl flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full shadow-lg border border-white/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* Remaining Fund Card */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-slate-500">অবশিষ্ট ফান্ড</p>
          </div>
          <p className="text-xl font-black text-blue-600">৳{toBengaliNumber(remainingFund)}</p>
        </div>

        {/* Expense List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">খরচের তালিকা</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {toBengaliNumber(expenses.length)} টি এন্ট্রি
            </span>
          </div>

          {expenses.map((expense) => (
            <div key={expense.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-rose-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">
                      {expense.reason}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                      <Calendar className="w-3.5 h-3.5" /> {expense.date}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-rose-600 text-lg">৳{toBengaliNumber(expense.amount)}</p>
                </div>
              </div>

              {expense.proofImage && (
                <div className="space-y-3">
                  <div 
                    onClick={() => setSelectedImage(expense.proofImage || null)}
                    className="relative w-full h-48 bg-slate-100 rounded-[1.5rem] overflow-hidden cursor-pointer group border border-slate-100"
                  >
                    <img 
                      src={expense.proofImage} 
                      alt="Proof" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100">
                        <Info className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedImage(expense.proofImage || null)}
                    className="w-full py-4 bg-teal-50 border border-teal-100 rounded-3xl flex items-center justify-center gap-3 text-[11px] font-black text-teal-700 uppercase hover:bg-teal-100 transition-all active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <Info className="w-4 h-4" />
                    </div>
                    <span>খরচের বিস্তারিত</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {expenses.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <div className="relative w-12 h-12 mx-auto mb-3 flex items-center justify-center opacity-20">
                  {/* 3D Scroll Background */}
                  <div className="absolute inset-0 bg-blue-500 rounded-sm transform -rotate-3 shadow-lg"></div>
                  <div className="absolute inset-0 bg-blue-600 rounded-sm transform rotate-2 shadow-md"></div>
                  <div className="absolute inset-0 bg-blue-500 rounded-sm flex flex-col items-center pt-1 px-1 gap-0.5 border border-blue-400/30">
                    <div className="w-full bg-white rounded-[1px] py-0.5 flex items-center justify-center mb-0.5 shadow-sm">
                      <span className="text-[6px] font-black text-blue-700 leading-none tracking-tighter">INVOICE</span>
                    </div>
                    <div className="w-full flex justify-between items-end px-0.5 pb-0.5">
                      <div className="flex flex-col gap-0.5 w-4">
                        <div className="h-[2px] w-full bg-white/60 rounded-full"></div>
                        <div className="h-[2px] w-full bg-white/60 rounded-full"></div>
                      </div>
                      <div className="text-amber-400 font-black text-[14px] leading-none drop-shadow-sm">$</div>
                    </div>
                  </div>
                  <div className="absolute -top-1.5 left-0 right-0 h-2 bg-blue-700 rounded-full shadow-inner"></div>
                  <div className="absolute -bottom-1.5 left-0 right-0 h-2 bg-blue-700 rounded-full shadow-inner"></div>
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">এখনো কোন খরচের তথ্য পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-pointer"
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[60]"
          >
            <X className="w-6 h-6" />
          </button>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl cursor-default"
          >
            <img 
              src={selectedImage} 
              alt="Proof" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center py-10 opacity-30">
         <p className="text-[9px] font-black uppercase tracking-[0.4em]">United for Humanity • Transparency Report</p>
      </div>
    </div>
  );
};

export default ExpensePage;

