
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { Notification, TransactionStatus, Expense, Transaction } from '../types';
import { 
  Wallet, CreditCard, Award, User as UserIcon, 
  List, ArrowUpRight, TrendingUp, Bell, ChevronRight,
  ShieldCheck, X, Clock, Plus, TrendingDown, Receipt
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
      setRecentExpenses(db.getExpenses().slice(0, 3));
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

  // Helper function to convert English numbers to Bengali numerals
  const toBengaliNumber = (num: number | string) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
  };

  // Dynamically filter approved transactions for current user to ensure live count
  const approvedTransactions = useMemo(() => {
    return allTransactions.filter(t => 
      t.userId === currentUser?.id && 
      t.status === TransactionStatus.APPROVED
    );
  }, [allTransactions, currentUser?.id]);

  const totalFund = appStats.totalCollection - appStats.totalExpense;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpenNotifications = () => {
    setShowNotifs(true);
    notifications.filter(n => !n.isRead).forEach(n => {
      db.markNotificationAsRead(n.id);
    });
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) + ' ' + 
           date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-32 font-['Hind_Siliguri']">
      {/* Header - Compact */}
      <div className="px-5 pt-8 pb-5 flex justify-between items-center bg-white rounded-b-[3rem] shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            {currentUser?.profilePic ? (
              <img src={currentUser.profilePic} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <UserIcon className="w-6 h-6 text-teal-600" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 leading-none italic">হ্যালো, {currentUser?.name?.split(' ')[0]}!</h2>
            <div className="flex items-center gap-1 mt-1">
               <ShieldCheck className="w-3 h-3 text-teal-600" />
               <p className="text-[9px] font-black text-teal-700 uppercase tracking-widest">ভেরিফাইড সদস্য</p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleOpenNotifications}
          className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 relative active:scale-90 transition-all"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && <span className="absolute top-3.5 right-3.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
        </button>
      </div>

      {/* Main Balance Card */}
      <div className="px-5 -mt-6">
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-7 rounded-[2.5rem] shadow-xl shadow-teal-100 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          
          <div className="relative z-10">
            <p className="text-teal-100 text-[10px] font-black uppercase tracking-widest mb-1">সংগঠনের বর্তমান তহবিল</p>
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-black flex items-center gap-1.5 premium-text">
                <span className="text-xl text-teal-200">৳</span>
                {toBengaliNumber(totalFund.toLocaleString())}
              </h1>
              <div className="p-2.5 bg-white/20 rounded-xl">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10">
                <p className="text-teal-100 text-[8px] uppercase font-black mb-0.5">আপনার মোট দান</p>
                <p className="text-xl font-black premium-text">৳{toBengaliNumber(currentUser?.totalDonation?.toLocaleString() || 0)}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10">
                <p className="text-teal-100 text-[8px] uppercase font-black mb-0.5">মোট লেনদেন</p>
                <p className="text-xl font-black premium-text">{toBengaliNumber(approvedTransactions.length)} টি</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-5 mt-6 grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
             <div className="font-en font-black text-xl italic">#</div>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">মোট সদস্য</p>
            <h3 className="text-xl font-black text-slate-800 premium-text">{toBengaliNumber(appStats.totalUsers)}</h3>
          </div>
        </div>
        <button 
          onClick={() => navigate('/expenses')}
          className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-3 active:scale-95 transition-all text-left group"
        >
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
             <TrendingDown className="w-5 h-5" />
          </div>
          <div className="flex-grow">
            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">মোট খরচ</p>
            <h3 className="text-xl font-black text-slate-800 flex items-center justify-between premium-text">
              ৳{toBengaliNumber(appStats.totalExpense.toLocaleString())}
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-400 transition-colors" />
            </h3>
          </div>
        </button>
      </div>

      {/* Quick Menu */}
      <div className="px-5 mt-8">
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: <CreditCard className="w-5 h-5" />, label: 'দান পাঠান', color: 'bg-indigo-50 text-indigo-600', path: '/transaction' },
            { icon: <Award className="w-5 h-5" />, label: 'সেরা দাতা', color: 'bg-amber-50 text-amber-600', path: '/leaderboard' },
            { icon: <List className="w-5 h-5" />, label: 'ইতিহাস', color: 'bg-violet-50 text-violet-600', path: '/history' },
            { icon: <UserIcon className="w-5 h-5" />, label: 'প্রোফাইল', color: 'bg-teal-50 text-teal-600', path: '/profile' },
          ].map((item, idx) => (
            <button key={idx} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-2 group">
              <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shadow-sm group-active:scale-90 transition-all border border-white`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold text-slate-600 text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity Sections */}
      <div className="px-5 mt-10 space-y-10">
        {/* Recent Transactions */}
        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-lg font-black text-slate-800">সাম্প্রতিক লেনদেন</h3>
            <button onClick={() => navigate('/history')} className="text-[10px] font-black text-teal-600 uppercase tracking-widest">সব দেখুন</button>
          </div>
          <div className="space-y-3">
            {allTransactions.filter(t => t.userId === currentUser?.id).slice(0, 3).map((tx) => (
              <div key={tx.id} className="bg-white p-4 rounded-[2rem] flex justify-between items-center border border-slate-50 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-teal-600">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-xs leading-tight italic">{tx.method}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase premium-text">{toBengaliNumber(tx.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 text-base premium-text">৳{toBengaliNumber(tx.amount)}</p>
                  <div className={`mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block ${
                    tx.status === TransactionStatus.APPROVED ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {tx.status === TransactionStatus.APPROVED ? 'সফল' : 'পেন্ডিং'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-lg font-black text-slate-800">সাম্প্রতিক খরচসমূহ</h3>
            <button onClick={() => navigate('/expenses')} className="text-[10px] font-black text-rose-600 uppercase tracking-widest">বিস্তারিত দেখুন</button>
          </div>
          <div className="space-y-3">
            {recentExpenses.length > 0 ? recentExpenses.map((exp) => (
              <div key={exp.id} className="bg-white p-4 rounded-[2rem] flex justify-between items-center border border-slate-50 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="max-w-[150px]">
                    <p className="font-black text-slate-800 text-xs leading-tight truncate">{exp.reason}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest premium-text">{toBengaliNumber(exp.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-rose-600 text-base premium-text">৳{toBengaliNumber(exp.amount)}</p>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter mt-1 italic">Verified Cost</p>
                </div>
              </div>
            )) : (
              <div className="bg-white p-10 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">এখনো কোন খরচ এন্ট্রি নেই</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="fixed bottom-6 left-8 right-8 h-18 bg-white/90 backdrop-blur-xl shadow-xl rounded-full flex items-center justify-around px-4 z-50 border border-slate-100">
        <button onClick={() => navigate('/dashboard')} className="p-3 text-teal-600"><Wallet className="w-6 h-6" /></button>
        <button onClick={() => navigate('/transaction')} className="p-3 text-slate-300"><CreditCard className="w-6 h-6" /></button>
        <button onClick={() => navigate('/transaction')} className="w-14 h-14 bg-teal-600 rounded-full text-white shadow-lg -mt-10 border-4 border-white flex items-center justify-center active:scale-90 transition-all"><Plus className="w-7 h-7" /></button>
        <button onClick={() => navigate('/leaderboard')} className="p-3 text-slate-300"><Award className="w-6 h-6" /></button>
        <button onClick={() => navigate('/profile')} className="p-3 text-slate-300"><UserIcon className="w-6 h-6" /></button>
      </div>

      {/* Notifications Drawer */}
      {showNotifs && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-sm h-full shadow-2xl animate-in slide-in-from-right flex flex-col">
            <div className="p-8 bg-teal-600 text-white flex justify-between items-center rounded-bl-[3rem]">
              <div className="flex items-center gap-3"><Bell className="w-6 h-6" /><h3 className="font-black text-lg">আপডেটসমূহ</h3></div>
              <button onClick={() => setShowNotifs(false)} className="p-2 bg-white/20 rounded-xl"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {notifications.map(notif => (
                <div key={notif.id} className={`p-5 rounded-2xl border-2 ${notif.isRead ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-teal-100'}`}>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-2 mt-3 text-slate-400 font-bold text-[10px]">
                     <Clock className="w-3.5 h-3.5" /> <span className="premium-text">{toBengaliNumber(formatTime(notif.timestamp))}</span>
                  </div>
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
