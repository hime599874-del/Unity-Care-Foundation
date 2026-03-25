import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../services/db';
import { Transaction, TransactionStatus } from '../types';
import { useAuth } from '../services/AuthContext';
import { ArrowLeft, Calendar, FileText, X, Wallet, Receipt, ArrowUpRight, Clock, Download, ShieldCheck, CircleCheck, Building2, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { toPng } from 'html-to-image';

const VoucherPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser) return;
    
    const refreshData = () => {
      const userTxs = db.getTransactions()
        .filter(t => t.userId === currentUser.id && t.status === TransactionStatus.APPROVED)
        .sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(userTxs);
    };
    
    refreshData();
    const unsubscribe = db.subscribe(refreshData);
    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    const state = location.state as { transactionId?: string };
    if (state?.transactionId) {
      const tx = db.getTransactions().find(t => t.id === state.transactionId);
      if (tx) {
        setSelectedTx(tx);
        // Clear state to prevent re-opening on back/forward
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  const toBengaliNumber = (num: number | string) => {
    return num.toString();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    
    try {
      setIsDownloading(true);
      // Create a clone for high quality capture
      const dataUrl = await toPng(invoiceRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2, // Higher quality
        filter: (node) => {
          const exclusionClasses = ['download-exclude'];
          return !exclusionClasses.some(className => 
            (node instanceof HTMLElement) && node.classList.contains(className)
          );
        },
        style: {
          borderRadius: '0px',
          margin: '0',
          padding: '0',
        }
      });
      
      const link = document.createElement('a');
      link.download = `Voucher-${selectedTx?.transactionId.slice(-8).toUpperCase()}.png`;
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
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-transparent min-h-screen pb-20 font-['Hind_Siliguri']">
      <div className="px-5 pt-8 pb-6 glass-nav rounded-b-[3rem] flex items-center gap-4 sticky top-0 z-30">
        <button onClick={() => navigate('/dashboard')} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800">আমার ভাউচার</h1>
          <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mt-0.5">আপনার সফল দানের রিসিট</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <div className="bg-gradient-to-br from-teal-600/90 to-teal-700/90 p-5 rounded-[2rem] text-white relative overflow-hidden border border-white/20 backdrop-blur-md">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
           <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-teal-100 text-[9px] font-black uppercase tracking-widest mb-1">মোট দান</p>
                <h2 className="text-2xl font-black">৳{toBengaliNumber(currentUser?.totalDonation.toLocaleString() || '0')}</h2>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <div className="relative w-8 h-8 flex items-center justify-center scale-110">
                  {/* 3D Scroll Background */}
                  <div className="absolute inset-0 bg-blue-500 rounded-sm transform -rotate-3 shadow-lg"></div>
                  <div className="absolute inset-0 bg-blue-600 rounded-sm transform rotate-2 shadow-md"></div>
                  <div className="absolute inset-0 bg-blue-500 rounded-sm flex flex-col items-center pt-1 px-1 gap-0.5 border border-blue-400/30">
                    <div className="w-full bg-white rounded-[1px] py-0.5 flex items-center justify-center mb-0.5 shadow-sm">
                      <span className="text-[4px] font-black text-blue-700 leading-none tracking-tighter">INVOICE</span>
                    </div>
                    <div className="w-full flex justify-between items-end px-0.5 pb-0.5">
                      <div className="flex flex-col gap-0.5 w-3">
                        <div className="h-[1.5px] w-full bg-white/60 rounded-full"></div>
                        <div className="h-[1.5px] w-full bg-white/60 rounded-full"></div>
                        <div className="h-[1.5px] w-3/4 bg-white/60 rounded-full"></div>
                      </div>
                      <div className="text-amber-400 font-black text-[10px] leading-none drop-shadow-sm">$</div>
                    </div>
                  </div>
                  <div className="absolute -top-1 left-0 right-0 h-1.5 bg-blue-700 rounded-full shadow-inner"></div>
                  <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-blue-700 rounded-full shadow-inner"></div>
                </div>
              </div>
           </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">পেমেন্ট ইনভয়েস</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {toBengaliNumber(transactions.length)} টি এন্ট্রি
            </span>
          </div>

          {transactions.map((tx) => (
            <div key={tx.id} className="glass-card p-4 rounded-[1.5rem] flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-xs leading-tight mb-0.5">{tx.userName}</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                        <Clock className="w-3 h-3" /> {toBengaliNumber(tx.date)} | {formatTime(tx.timestamp)}
                      </div>
                      <span className="text-[8px] font-black text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">{tx.method === 'Admin Manual' ? 'Manual' : tx.method}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-teal-600 text-base">৳{toBengaliNumber(tx.amount.toLocaleString())}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTx(tx)}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 border-none rounded-[1.5rem] flex items-center justify-center gap-3 text-[11px] font-black text-white uppercase hover:shadow-teal-200/50 transition-all active:scale-[0.98] shadow-lg shadow-teal-100 group"
              >
                <div className="w-7 h-7 bg-white/20 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    {/* 3D Scroll Background */}
                    <div className="absolute inset-0 bg-blue-500 rounded-sm transform -rotate-3 shadow-lg"></div>
                    <div className="absolute inset-0 bg-blue-600 rounded-sm transform rotate-2 shadow-md"></div>
                    <div className="absolute inset-0 bg-blue-500 rounded-sm flex flex-col items-center pt-0.5 px-0.5 gap-0.5 border border-blue-400/30">
                      <div className="w-full bg-white rounded-[1px] py-0.2 flex items-center justify-center mb-0.2 shadow-sm">
                        <span className="text-[2px] font-black text-blue-700 leading-none tracking-tighter">INVOICE</span>
                      </div>
                      <div className="w-full flex justify-between items-end px-0.2 pb-0.2">
                        <div className="flex flex-col gap-0.2 w-2">
                          <div className="h-[1px] w-full bg-white/60 rounded-full"></div>
                          <div className="h-[1px] w-full bg-white/60 rounded-full"></div>
                        </div>
                        <div className="text-amber-400 font-black text-[6px] leading-none drop-shadow-sm">$</div>
                      </div>
                    </div>
                    <div className="absolute -top-0.5 left-0 right-0 h-1 bg-blue-700 rounded-full shadow-inner"></div>
                    <div className="absolute -bottom-0.5 left-0 right-0 h-1 bg-blue-700 rounded-full shadow-inner"></div>
                  </div>
                </div>
                <span>আপনার ভাউচার দেখুন</span>
              </button>
            </div>
          ))}

          {transactions.length === 0 && (
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
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">এখনো কোন তথ্য পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      </div>

      <div className="text-center py-10 opacity-30">
         <p className="text-[9px] font-black uppercase tracking-[0.4em]">United for Humanity • Official Records</p>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
          <div className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col my-auto">
            {/* Premium Invoice Header */}
            <div ref={invoiceRef} className="bg-white flex flex-col w-full">
              <div className="bg-[#0F172A] text-white relative shrink-0 overflow-hidden">
                {/* Diagonal Shape with better positioning */}
                <div className="absolute top-0 right-0 w-[42%] h-full bg-rose-600 transform skew-x-[-10deg] translate-x-10"></div>
                
                <div className="p-4 sm:p-5 flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-[#0F172A] no-glow" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <h3 className="text-sm sm:text-lg font-black uppercase tracking-tight leading-none truncate">UNITY CARE</h3>
                      <p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1 truncate">unitycarefoundation07@gmail.com</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter italic leading-none">INVOICE</h2>
                    <div className="mt-1 text-[8px] sm:text-[9px] font-bold text-rose-100 flex flex-col items-end gap-0.5">
                      <p className="whitespace-nowrap">NO: #{selectedTx.transactionId.slice(-8).toUpperCase()}</p>
                      <p className="whitespace-nowrap">DATE: {selectedTx.date} | TIME: {formatTime(selectedTx.timestamp)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                {/* Info Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-[8px] sm:text-[9px] font-black text-rose-600 uppercase tracking-widest border-b border-rose-100 pb-0.5 inline-block">INVOICE TO:</h4>
                    <div className="space-y-0.5">
                      <p className="text-sm sm:text-base font-black text-slate-800 uppercase truncate">{selectedTx.userName}</p>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 truncate">Verified Member, UCF</p>
                      <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] text-slate-400 font-bold mt-1">
                         <Phone className="w-2.5 h-2.5 no-glow" /> +880 1777-599874
                      </div>
                      <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] text-slate-400 font-bold">
                         <Mail className="w-2.5 h-2.5 no-glow" /> unitycarefoundation07@gmail.com
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[8px] sm:text-[9px] font-black text-rose-600 uppercase tracking-widest border-b border-rose-100 pb-0.5 inline-block">PAYMENT INFO:</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">Method:</p>
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-800 uppercase">{selectedTx.method === 'Admin Manual' ? 'Manual' : selectedTx.method}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">TX ID:</p>
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-800 uppercase tracking-tighter">#{selectedTx.transactionId.slice(-10)}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">Fund:</p>
                        <p className="text-[9px] sm:text-[10px] font-black text-teal-600 uppercase">{selectedTx.fundType}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Section */}
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0F172A] text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                        <th className="p-2 sm:p-3">Description</th>
                        <th className="p-2 sm:p-3 text-center">Amount</th>
                        <th className="p-2 sm:p-3 text-center">Qty</th>
                        <th className="p-2 sm:p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] sm:text-[11px] font-bold text-slate-700">
                      <tr className="border-b border-slate-50">
                        <td className="p-2 sm:p-3">
                          <p className="font-black text-slate-800">General Donation</p>
                        </td>
                        <td className="p-2 sm:p-3 text-center">৳{toBengaliNumber(selectedTx.amount)}</td>
                        <td className="p-2 sm:p-3 text-center">1</td>
                        <td className="p-2 sm:p-3 text-right font-black">৳{toBengaliNumber(selectedTx.amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="flex justify-end">
                  <div className="w-full max-w-[140px] sm:max-w-[200px] space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">
                      <p>Subtotal:</p>
                      <p>৳{toBengaliNumber(selectedTx.amount)}</p>
                    </div>
                    <div className="bg-rose-600 p-2 sm:p-3 rounded-xl text-white flex justify-between items-center">
                      <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest">Total:</p>
                      <p className="text-sm sm:text-lg font-black">৳{toBengaliNumber(selectedTx.amount)}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 relative">
                  {/* Stamp SVG */}
                  <div className="absolute -top-20 left-1/4 transform -translate-x-1/2 opacity-90 pointer-events-none select-none">
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 rotate-[-15deg]">
                      <svg viewBox="0 0 200 200" className="w-full h-full no-glow">
                        {/* Outer Circles */}
                        <circle cx="100" cy="100" r="95" fill="none" stroke="#E11D48" strokeWidth="2" strokeDasharray="4 2" />
                        <circle cx="100" cy="100" r="90" fill="none" stroke="#E11D48" strokeWidth="4" />
                        <circle cx="100" cy="100" r="65" fill="none" stroke="#E11D48" strokeWidth="2" />
                        
                        {/* Curved Text */}
                        <path id="curveTop" d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
                        <text className="text-[16px] font-black fill-rose-600 uppercase tracking-[0.15em]">
                          <textPath href="#curveTop" startOffset="50%" textAnchor="middle">
                            Donation Received
                          </textPath>
                        </text>
                        
                        <path id="curveBottom" d="M 170,100 A 70,70 0 0,1 30,100" fill="none" />
                        <text className="text-[16px] font-black fill-rose-600 uppercase tracking-[0.15em]">
                          <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">
                            Donation Received
                          </textPath>
                        </text>

                        {/* Center Text */}
                        <g transform="translate(100, 100)">
                          <line x1="-75" y1="-22" x2="75" y2="-22" stroke="#E11D48" strokeWidth="2.5" />
                          <text y="-2" textAnchor="middle" className="text-[16px] font-black fill-rose-600 uppercase tracking-tight">
                            Unity Care
                          </text>
                          <text y="16" textAnchor="middle" className="text-[12px] font-bold fill-rose-600 uppercase tracking-[0.2em]">
                            Foundation
                          </text>
                          <line x1="-75" y1="25" x2="75" y2="25" stroke="#E11D48" strokeWidth="2.5" />
                        </g>

                        {/* Stars */}
                        <text x="35" y="105" className="text-[12px] fill-rose-600">★</text>
                        <text x="165" y="105" className="text-[12px] fill-rose-600">★</text>
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[8px] sm:text-[9px] font-black text-slate-800 uppercase tracking-widest">Terms:</h4>
                    <p className="text-[7px] sm:text-[8px] text-slate-400 leading-relaxed italic">
                      This receipt is issued for humanitarian projects of Unity Care Foundation.
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-end">
                    <div className="relative mb-0 h-8 sm:h-10 flex items-center justify-center">
                      <span className="signature-text text-sm sm:text-xl text-slate-800 select-none transform -rotate-1">
                        IT Accountant
                      </span>
                    </div>
                    <div className="w-20 sm:w-28 h-px bg-slate-300 mb-1"></div>
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-800 uppercase tracking-widest">Authorized</p>
                  </div>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="bg-[#0F172A] p-3 sm:p-4 flex justify-between items-center shrink-0">
                 <div className="flex gap-2 sm:gap-4">
                   <div className="flex items-center gap-1 text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase">
                     <Globe className="w-2.5 h-2.5 text-rose-500 no-glow" /> unitycare.org
                   </div>
                   <div className="flex items-center gap-1 text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase">
                     <MapPin className="w-2.5 h-2.5 text-rose-500 no-glow" /> Bandharia.Telikhali
                   </div>
                 </div>
                 <div className="flex gap-2">
                   {!isDownloading && (
                     <button 
                       onClick={handleDownload}
                       className="px-2 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[7px] sm:text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95"
                     >
                       <Download className="w-3 h-3 no-glow" /> Download
                     </button>
                   )}
                 </div>
              </div>
            </div>

            {/* Close Button Overlay */}
            <button 
              onClick={() => setSelectedTx(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-lg backdrop-blur-md flex items-center justify-center active:scale-90 transition-all z-50 print:hidden"
            >
              <X className="w-5 h-5 no-glow" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherPage;
