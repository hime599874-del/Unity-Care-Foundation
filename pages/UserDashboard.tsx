
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { Notification, TransactionStatus, Expense, Transaction } from '../types';
import { 
  Wallet, CreditCard, Award, User as UserIcon, 
  List, ArrowUpRight, TrendingUp, Bell, ChevronRight,
  ShieldCheck, X, Clock, Plus, TrendingDown, Receipt, Users, HandHelping
} from 'lucide-react';

const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [appStats, setAppStats] = useState(db.getStats());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const refreshData = () => {
      setAppStats(db.getStats());
      setRecentExpenses(db.getExpenses().slice(0, 2));
      setAllTransactions(db.getTransactions());
    };
    refreshData();
    const unsubscribe = db.subscribe(refreshData);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentUser) {
      const unsubscribeNotifs = db.subscribeToNotifications(currentUser.id, (notifs) => {
        setNotifications(notifs);
      });
      return unsubscribeNotifs;
    }
  }, [currentUser]);

  const toBengaliNumber = (num: number | string) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
  };

  const actualExpenses = db.getExpenses();
  const approvedTxs = allTransactions.filter(t => t.status === TransactionStatus.APPROVED);
  const effectiveExpense = actualExpenses.length === 0 ? 0 : appStats.totalExpense;
  const effectiveCollection = approvedTxs.length === 0 ? 0 : appStats.totalCollection;
  const totalFund = effectiveCollection - effectiveExpense;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpenNotifications = () => {
    setShowNotifs(true);
    notifications.filter(n => !n.isRead).forEach(n => db.markNotificationAsRead(n.id));
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) + ' ' + 
           date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-32 font-['Hind_Siliguri']">
      <div className="px-6 pt-8 pb-4 flex justify-between items-center bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            {currentUser?.profilePic ? (
              <img src={currentUser.profilePic} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <UserIcon className="w-5 h-5 text-teal-600" />
            )}
          </div>
          <div className="leading-tight">
            <h2 className="text-sm font-black text-slate-800 tracking-tight">হ্যালো, {currentUser?.name?.split(' ')[0]}!</h2>
            <div className="flex items-center gap-1 mt-0.5 opacity-60">
               <ShieldCheck className="w-3 h-3 text-teal-600" />
               <p className="text-[9px] font-bold text-teal-600 uppercase tracking-widest">ভেরিফাইড সদস্য</p>
            </div>
          </div>
        </div>
        <button onClick={handleOpenNotifications} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 relative active:scale-90 transition-all">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-8 rounded-[2.5rem] shadow-2xl shadow-teal-900/10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <p className="text-teal-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">সংগঠনের বর্তমান তহবিল</p>
            <div className="flex items-baseline gap-2">
               <span className="text-2xl font-black text-teal-200">৳</span>
               <h1 className="text-4xl font-black tracking-tight">{toBengaliNumber(totalFund.toLocaleString())}</h1>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
               <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/5">
                  <p className="text-[8px] font-black text-teal-100 uppercase tracking-widest mb-1">আপনার মোট দান</p>
                  <p className="text-sm font-black">৳{toBengaliNumber(currentUser?.totalDonation?.toLocaleString() || 0)}</p>
               </div>
               <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/5">
                  <p className="text-[8px] font-black text-teal-100 uppercase tracking-widest mb-1">মোট লেনদেন</p>
                  <p className="text-sm font-black">{toBengaliNumber(currentUser?.transactionCount || 0)} টি</p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">#</div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">মোট সদস্য</p>
              <h3 className="text-lg font-black text-slate-800">{toBengaliNumber(appStats.totalUsers)} জন</h3>
            </div>
          </div>
          <button onClick={() => navigate('/expenses')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-left active:scale-95 transition-all relative overflow-hidden">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
               <TrendingDown className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">মোট খরচ</p>
              <h3 className="text-lg font-black text-slate-800">৳{toBengaliNumber(effectiveExpense.toLocaleString())}</h3>
            </div>
            <ChevronRight className="absolute right-4 bottom-5 w-4 h-4 text-slate-200" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: <CreditCard className="w-5 h-5" />, label: 'দান পাঠান', color: 'bg-white text-indigo-600', path: '/transaction' },
            { icon: <HandHelping className="w-5 h-5" />, label: 'আবেদন', color: 'bg-white text-teal-600', path: '/assistance' },
            { icon: <Award className="w-5 h-5" />, label: 'সেরা দাতা', color: 'bg-white text-amber-500', path: '/leaderboard' },
            { icon: <List className="w-5 h-5" />, label: 'ইতিহাস', color: 'bg-white text-violet-500', path: '/history' },
          ].map((item, idx) => (
            <button key={idx} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-2 active:scale-90 transition-all">
              <div className={`w-14 h-14 ${item.color} rounded-[1.8rem] flex items-center justify-center shadow-sm border border-slate-100`}>{item.icon}</div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
           <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">সাম্প্রতিক লেনদেন</h3>
              <button onClick={() => navigate('/history')} className="text-[10px] font-black text-teal-600 uppercase">সব দেখুন</button>
           </div>
           <div className="space-y-3">
              {allTransactions.filter(t => t.userId === currentUser?.id).slice(0, 3).map((tx) => (
                <div key={tx.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-teal-600">
                       <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">{tx.method}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{toBengaliNumber(tx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-base">৳{toBengaliNumber(tx.amount)}</p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${tx.status === TransactionStatus.APPROVED ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {tx.status === TransactionStatus.APPROVED ? 'সফল' : 'পেন্ডিং'}
                    </span>
                  </div>
                </div>
              ))}
              {allTransactions.filter(t => t.userId === currentUser?.id).length === 0 && (
                <div className="py-10 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">কোন লেনদেন নেই</p>
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-16 bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200 rounded-full flex items-center justify-around px-6 z-50">
        <button onClick={() => navigate('/dashboard')} className="p-3 text-teal-600 active:scale-90 transition-all"><Wallet className="w-6 h-6" /></button>
        <button onClick={() => navigate('/transaction')} className="p-2 active:scale-90 transition-all -mt-10"><div className="bg-teal-600 text-white rounded-full p-4 border-4 border-white shadow-xl"><Plus className="w-6 h-6" /></div></button>
        <button onClick={() => navigate('/leaderboard')} className="p-3 text-slate-300 active:scale-90 transition-all"><Award className="w-6 h-6" /></button>
        <button onClick={() => navigate('/profile')} className="p-3 text-slate-300 active:scale-90 transition-all"><UserIcon className="w-6 h-6" /></button>
      </div>

      {showNotifs && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-sm h-full shadow-2xl animate-in slide-in-from-right flex flex-col rounded-l-[3rem]">
            <div className="p-8 bg-teal-600 text-white flex justify-between items-center rounded-bl-[3rem]">
              <div className="flex items-center gap-3 font-black text-lg uppercase tracking-widest"><Bell className="w-6 h-6" /> নোটিফিকেশন</div>
              <button onClick={() => setShowNotifs(false)} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {notifications.map(notif => (
                <div key={notif.id} className={`p-5 rounded-3xl border-2 transition-all ${notif.isRead ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-teal-100 shadow-md'}`}>
                  <p className="text-[13px] font-bold text-slate-800 leading-snug">{notif.message}</p>
                  <div className="flex items-center gap-2 mt-3 text-slate-400 font-bold text-[8px] uppercase tracking-widest"><Clock className="w-3 h-3" /> {toBengaliNumber(formatTime(notif.timestamp))}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
