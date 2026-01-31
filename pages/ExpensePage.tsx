
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Expense } from '../types';
import { ArrowLeft, TrendingDown, Calendar, FileText, ImageIcon, X, Wallet } from 'lucide-react';

const ExpensePage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState(db.getStats());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const refreshData = () => {
      setExpenses(db.getExpenses().sort((a, b) => b.timestamp - a.timestamp));
      setStats(db.getStats());
    };
    refreshData();
    const unsubscribe = db.subscribe(refreshData);
    return unsubscribe;
  }, []);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-['Hind_Siliguri']">
      {/* Header */}
      <div className="px-5 pt-8 pb-6 bg-white rounded-b-[3rem] shadow-sm border-b border-slate-100 flex items-center gap-4 sticky top-0 z-30">
        <button onClick={() => navigate('/dashboard')} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800">ব্যয়ের হিসাব</h1>
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5">সংগঠনের খরচের স্বচ্ছতা</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Total Expense Summary Card */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-6 rounded-[2.5rem] shadow-xl shadow-rose-100 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
           <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mb-1">সর্বমোট ব্যয়</p>
                <h2 className="text-3xl font-black">৳{stats.totalExpense.toLocaleString()}</h2>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <TrendingDown className="w-8 h-8 text-white" />
              </div>
           </div>
        </div>

        {/* Expense List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">খরচের তালিকা</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{expenses.length} টি এন্ট্রি</span>
          </div>

          {expenses.map((exp) => (
            <div key={exp.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm leading-tight mb-1">{exp.reason}</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                        <Calendar className="w-3.5 h-3.5" /> {exp.date}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-rose-600 text-lg">৳{exp.amount.toLocaleString()}</p>
                </div>
              </div>

              {exp.proofImage && (
                <button 
                  onClick={() => setSelectedImage(exp.proofImage!)}
                  className="w-full py-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase hover:bg-slate-100 transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-blue-500" /> ভাউচার/প্রমাণ দেখুন
                </button>
              )}
            </div>
          ))}

          {expenses.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <TrendingDown className="w-12 h-12 text-slate-200 mx-auto mb-3" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">এখনো কোন খরচের হিসাব নেই।</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Organization Quote */}
      <div className="text-center py-10 opacity-30">
         <p className="text-[9px] font-black uppercase tracking-[0.4em]">United for Humanity • Official Records</p>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-3 bg-black/50 text-white rounded-2xl backdrop-blur-md z-10 active:scale-90 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-2">
              <img src={selectedImage} className="w-full h-auto max-h-[70vh] object-contain rounded-[2rem]" alt="Voucher" />
            </div>
            <div className="p-6 text-center bg-slate-50">
               <p className="text-xs font-black text-slate-500 uppercase tracking-widest">খরচের প্রমাণপত্র / ভাউচার</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensePage;
