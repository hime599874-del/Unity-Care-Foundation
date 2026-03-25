
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Transaction } from '../types';
import { CheckCircle2, Building2, Calendar, User, CreditCard, ShieldCheck, ArrowLeft, MapPin, Globe } from 'lucide-react';

const VerifyInvoicePage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransaction = () => {
      if (!transactionId) return;
      const tx = db.getTransactions().find(t => t.id === transactionId || t.transactionId === transactionId);
      setTransaction(tx || null);
      setLoading(false);
    };

    fetchTransaction();
  }, [transactionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="w-10 h-10 text-rose-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Invalid Invoice</h1>
        <p className="text-slate-500 mb-8 max-w-xs">The invoice you are trying to verify could not be found in our records.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-teal-200"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-['Hind_Siliguri']">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-6 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 leading-tight">UNITY CARE</h1>
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Official Verification</p>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full flex items-center gap-2 border border-emerald-100">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto space-y-6">
        {/* Success Banner */}
        <div className="bg-emerald-500 rounded-[2rem] p-8 text-white text-center shadow-xl shadow-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black mb-1">Payment Verified</h2>
            <p className="text-emerald-100 text-xs font-medium">This transaction is authentic and recorded in our foundation database.</p>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-50">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Transaction ID</span>
            <span className="font-black text-slate-800">#{transaction.transactionId.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                <User className="w-3 h-3" /> Donor Name
              </p>
              <p className="font-black text-slate-800 uppercase text-sm">{transaction.userName}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 justify-end">
                <Calendar className="w-3 h-3" /> Date & Time
              </p>
              <p className="font-black text-slate-800 text-sm">
                {transaction.date} | {new Date(transaction.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                <CreditCard className="w-3 h-3" /> Method
              </p>
              <p className="font-black text-slate-800 uppercase text-sm">{transaction.method}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 justify-end">
                <ShieldCheck className="w-3 h-3" /> Fund Type
              </p>
              <p className="font-black text-emerald-600 uppercase text-sm">{transaction.fundType || 'General'}</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
            <span className="text-slate-800 font-black text-lg">Total Amount</span>
            <span className="text-teal-600 font-black text-2xl">৳{transaction.amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Foundation Info */}
        <div className="bg-[#0f172a] rounded-[2rem] p-6 text-white space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wider">UNITY CARE FOUNDATION</h3>
              <p className="text-slate-400 text-[10px] font-bold">Official Humanitarian Organization</p>
            </div>
          </div>
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3 text-slate-400">
              <MapPin className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Bandharia, Telikhali</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">unitycare.org</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div className="text-center py-10 opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.4em]">United for Humanity • Secure Verification System</p>
      </div>
    </div>
  );
};

export default VerifyInvoicePage;
