import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { db } from '../services/db';
import { useToast } from '../services/ToastContext';
import { Transaction, TransactionStatus } from '../types';
import { ArrowLeft, Printer, Download, ChevronLeft, ChevronRight, Hash, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';

const HistoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(Math.max(2026, new Date().getFullYear()));

  useEffect(() => {
    const fetchTxs = () => {
      const all = db.getTransactions();
      const filtered = all.filter(t => {
        const txYear = new Date(t.date).getFullYear();
        return t.userId === currentUser?.id && 
               t.status === TransactionStatus.APPROVED && 
               txYear === selectedYear;
      }).sort((a, b) => a.timestamp - b.timestamp);
      
      setTransactions(filtered);
    };
    fetchTxs();
    const unsubscribe = db.subscribe(fetchTxs);
    return unsubscribe;
  }, [currentUser, selectedYear]);

  const getDayName = (dateStr: string) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date(dateStr);
    return days[d.getDay()];
  };

  const toBengaliNumber = (num: number | string) => {
    return num.toString();
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `Donation_Report_${currentUser?.name}_${selectedYear}.png`;
      link.href = dataUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } catch (err) {
      console.error('Download failed:', err);
      showToast('ডাউনলোড ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen pb-24 font-sans transition-colors duration-300">
      <div className="px-5 pt-6 pb-2 flex items-center justify-between sticky top-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl z-30 border-b border-white/20 dark:border-slate-800/50">
        <button onClick={() => navigate('/dashboard')} className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm text-teal-700 dark:text-teal-400 border border-white dark:border-slate-700 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[9px] font-bold shadow-lg uppercase tracking-wider border border-white/10"
          >
            <Printer className="w-3.5 h-3.5" /> প্রিন্ট
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 dark:bg-teal-700 text-white rounded-xl text-[9px] font-bold shadow-lg shadow-teal-200/50 dark:shadow-teal-900/40 uppercase tracking-wider disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} সেভ
          </button>
        </div>
      </div>

      <div className="px-3 mt-4" ref={reportRef}>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden border border-white dark:border-slate-800 max-w-4xl mx-auto transition-colors duration-300">
          <div className="bg-gradient-to-r from-teal-600 to-teal-800 dark:from-teal-800 dark:to-teal-950 py-7 px-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-400/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
            
            <h1 className="text-white text-xl md:text-2xl font-bold tracking-[0.1em] uppercase leading-tight relative z-10">
              UNITY CARE FOUNDATION
            </h1>
            <div className="inline-block px-4 py-1 mt-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 relative z-10">
              <p className="text-teal-50 text-[9px] font-bold tracking-[0.3em] uppercase">Contribution Report</p>
            </div>
          </div>

          <div className="bg-teal-50/50 dark:bg-slate-800/50 grid grid-cols-2 border-b border-teal-100/50 dark:border-slate-800">
            <div className="p-5 border-r border-teal-100/50 dark:border-slate-800">
              <p className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">Contributor</p>
              <p className="text-sm font-bold text-black dark:text-white uppercase truncate">{currentUser?.name}</p>
            </div>
            
            <div className="p-5 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">Report Year</p>
                <p className="text-sm font-bold text-black dark:text-white">{selectedYear}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  disabled={selectedYear <= 2026}
                  onClick={() => setSelectedYear(prev => Math.max(2026, prev - 1))} 
                  className={`p-2 rounded-xl shadow-sm border transition-all ${selectedYear <= 2026 ? 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-700 border-gray-100 dark:border-slate-800' : 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 border-teal-50 dark:border-slate-800 active:scale-90'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedYear(prev => prev + 1)} 
                  className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-teal-50 dark:border-slate-800 active:scale-90 transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-900 dark:bg-slate-950 text-white font-bold uppercase tracking-wider">
                  <th className="py-4 px-4 border-r border-white/10 text-center w-14">S.L</th>
                  <th className="py-4 px-3 border-r border-white/10 text-center">Date</th>
                  <th className="py-4 px-3 border-r border-white/10 text-center">Day</th>
                  <th className="py-4 px-3 border-r border-white/10 text-center">Emergency</th>
                  <th className="py-4 px-3 border-r border-white/10 text-center">General/Admin</th>
                  <th className="py-4 px-3 border-r border-white/10 text-center bg-teal-600 dark:bg-teal-800 shadow-inner">Total</th>
                  <th className="py-4 px-4 text-left">TX ID</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <tr 
                      key={tx.id} 
                      className={`${
                        index % 2 === 0 ? 'bg-teal-50/60 dark:bg-teal-900/20' : 'bg-blue-50/60 dark:bg-blue-900/20'
                      } border-b border-white dark:border-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors duration-200`}
                    >
                      <td className="py-4 px-4 border-r border-white/50 dark:border-slate-800 font-bold text-black dark:text-slate-200 text-center">{index + 1}</td>
                      <td className="py-4 px-3 border-r border-white/50 dark:border-slate-800 text-center font-bold text-black dark:text-slate-200">
                        {tx.date.split('-').reverse().slice(0, 2).join(' / ')}
                      </td>
                      <td className="py-4 px-3 border-r border-white/50 dark:border-slate-800 text-center font-bold text-black dark:text-slate-200 uppercase">{getDayName(tx.date)}</td>
                      <td className="py-4 px-3 border-r border-white/50 dark:border-slate-800 text-center font-bold text-black dark:text-slate-200">
                        {tx.fundType === 'Emergency' ? <span>৳{tx.amount}</span> : <span>0</span>}
                      </td>
                      <td className="py-4 px-3 border-r border-white/50 dark:border-slate-800 text-center font-bold text-black dark:text-slate-200">
                        {(tx.fundType === 'General' || !tx.fundType) ? <span>৳{tx.amount}</span> : <span>0</span>}
                      </td>
                      <td className="py-4 px-3 border-r border-white/50 dark:border-slate-800 text-center font-bold text-black dark:text-slate-200 bg-teal-200/40 dark:bg-teal-900/40">
                        ৳{tx.amount}
                      </td>
                      <td className="py-4 px-4 font-bold text-black dark:text-slate-200 text-[9px] uppercase tracking-tighter">
                        #{tx.transactionId.slice(-6)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-24 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <Hash className="w-16 h-16 mb-2 text-teal-600 dark:text-teal-400" />
                        <p className="text-[12px] font-bold uppercase tracking-widest text-black dark:text-white">No Records Found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-teal-900 dark:bg-teal-950 text-white">
                  <td className="py-6 px-6 text-right font-bold uppercase text-[10px] tracking-[0.2em] border-r border-white/10 dark:border-slate-800" colSpan={5}>
                    Yearly Total Contribution
                  </td>
                  <td className="py-6 px-3 text-center font-bold text-teal-300 dark:text-teal-400 text-sm shadow-2xl">
                    ৳{transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </td>
                  <td className="py-6 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center pb-8">
           <p className="text-[9px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-[0.4em]">Together for Humanity • Unity Care Foundation</p>
        </div>
      </div>

      <div className="fixed bottom-6 left-10 right-10 h-18 bg-teal-950/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-white/10 dark:border-slate-800 shadow-[0_25px_60px_rgba(13,148,136,0.3)] dark:shadow-none rounded-full flex items-center justify-around px-4 z-50 transition-colors duration-300">
        <button onClick={() => navigate('/dashboard')} className="p-3 text-white/30 dark:text-slate-600 flex flex-col items-center gap-1 active:scale-95 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[7px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => navigate('/history')} className="p-3 text-teal-400 dark:text-teal-500 flex flex-col items-center gap-1 scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <span className="text-[7px] font-bold uppercase tracking-widest">History</span>
        </button>
      </div>
    </div>
  );
};

export default HistoryPage;