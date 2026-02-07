
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { Notification, TransactionStatus, Expense, Transaction } from '../types';
import { 
  Wallet, CreditCard, Award, User as UserIcon, 
  List, ArrowUpRight, TrendingUp, Bell, ChevronRight,
  ShieldCheck, X, Clock, Plus, TrendingDown, Receipt, Users, HandHelping,
  Lightbulb, Info, Smartphone, CheckCircle2, Send, Loader2, MessageSquare, Facebook, Mail, PhoneCall, Copy, Landmark, Building2
} from 'lucide-react';

const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [appStats, setAppStats] = useState(db.getStats());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [contactConfig, setContactConfig] = useState(db.getContactConfig());
  const [showNotifs, setShowNotifs] = useState(false);
  
  // Modals
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const refreshData = () => {
      setAppStats(db.getStats());
      setRecentExpenses(db.getExpenses().slice(0, 2));
      setAllTransactions(db.getTransactions());
      setContactConfig(db.getContactConfig());
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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const totalFund = appStats.totalCollection - (db.getExpenses().length === 0 ? 0 : appStats.totalExpense);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpenNotifications = () => {
    setShowNotifs(true);
    notifications.filter(n => !n.isRead).forEach(n => db.markNotificationAsRead(n.id));
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || !currentUser || isSendingSuggestion) return;
    setIsSendingSuggestion(true);
    try {
      await db.submitSuggestion(currentUser.id, currentUser.name, suggestionText.trim());
      setSuggestionText('');
      setShowSuggestionModal(false);
      alert('আপনার পরামর্শ এডমিন প্যানেলে পাঠানো হয়েছে। ধন্যবাদ!');
    } catch (e) { alert('সমস্যা হয়েছে।'); } finally { setIsSendingSuggestion(false); }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-32 font-['Hind_Siliguri']">
      <div className="px-6 pt-8 pb-4 flex justify-between items-center bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            {currentUser?.profilePic ? <img src={currentUser.profilePic} className="w-full h-full object-cover" alt="Profile" /> : <UserIcon className="w-5 h-5 text-teal-600" />}
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 blur-2xl"></div>
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
          <div className="bg-blue-600 p-6 rounded-[2.5rem] shadow-xl shadow-blue-200 flex flex-col gap-3 text-white border-b-8 border-blue-800 transition-all active:scale-95 group">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black text-white shadow-inner group-hover:scale-110 transition-transform">
               <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] opacity-80 mb-1">মোট সদস্য</p>
              <h3 className="text-2xl font-black">{toBengaliNumber(appStats.totalUsers)} জন</h3>
            </div>
          </div>
          <button onClick={() => navigate('/expenses')} className="bg-rose-600 p-6 rounded-[2.5rem] shadow-xl shadow-rose-200 text-left active:scale-95 transition-all relative overflow-hidden text-white border-b-8 border-rose-800 group">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform"><TrendingDown className="w-6 h-6" /></div>
            <div className="mt-3">
              <p className="text-[10px] font-black text-rose-100 uppercase tracking-[0.2em] opacity-80 mb-1">মোট খরচ</p>
              <h3 className="text-2xl font-black">৳{toBengaliNumber((db.getExpenses().length === 0 ? 0 : appStats.totalExpense).toLocaleString())}</h3>
            </div>
            <ChevronRight className="absolute right-5 bottom-6 w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 px-1">
          {[
            { icon: <CreditCard className="w-5 h-5" />, label: 'দান', color: 'bg-indigo-600', path: '/transaction' },
            { icon: <HandHelping className="w-5 h-5" />, label: 'আবেদন', color: 'bg-teal-600', path: '/assistance' },
            { icon: <Award className="w-5 h-5" />, label: 'সেরা দাতা', color: 'bg-amber-500', path: '/leaderboard' },
            { icon: <List className="w-5 h-5" />, label: 'আপনার হিসাব', color: 'bg-violet-600', path: '/history' },
            { icon: <Lightbulb className="w-5 h-5" />, label: 'পরামর্শ', color: 'bg-emerald-600', action: () => setShowSuggestionModal(true) },
            { icon: <Info className="w-5 h-5" />, label: 'পেমেন্ট তথ্য', color: 'bg-blue-600', action: () => setShowPaymentModal(true) },
            { icon: <MessageSquare className="w-5 h-5" />, label: 'যোগাযোগ', color: 'bg-rose-600', action: () => setShowContactModal(true) },
            { icon: <Receipt className="w-5 h-5" />, label: 'ভাউচার', color: 'bg-slate-700', path: '/expenses' },
          ].map((item, idx) => (
            <button key={idx} onClick={item.path ? () => navigate(item.path!) : item.action} className="flex flex-col items-center gap-1.5 active:scale-90 transition-all group">
              <div className={`w-11 h-11 ${item.color} rounded-2xl flex items-center justify-center shadow-lg text-white transform group-hover:scale-105 transition-transform`}>
                {item.icon}
              </div>
              <span className="text-[8px] font-black text-slate-800 uppercase tracking-tighter leading-none">{item.label}</span>
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
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-teal-600"><ArrowUpRight className="w-5 h-5" /></div>
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
           </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-16 bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200 rounded-full flex items-center justify-around px-6 z-50">
        <button onClick={() => navigate('/dashboard')} className="p-3 text-teal-600 active:scale-90 transition-all"><Wallet className="w-6 h-6" /></button>
        <button onClick={() => navigate('/transaction')} className="p-2 active:scale-90 transition-all -mt-10"><div className="bg-teal-600 text-white rounded-full p-4 border-4 border-white shadow-xl"><Plus className="w-6 h-6" /></div></button>
        <button onClick={() => navigate('/leaderboard')} className="p-3 text-slate-300 active:scale-90 transition-all"><Award className="w-6 h-6" /></button>
        <button onClick={() => navigate('/profile')} className="p-3 text-slate-300 active:scale-90 transition-all"><UserIcon className="w-6 h-6" /></button>
      </div>

      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3"><Lightbulb className="w-6 h-6" /><h3 className="font-black uppercase text-sm tracking-widest">পরামর্শ পাঠান</h3></div>
                 <button onClick={() => setShowSuggestionModal(false)} className="p-2 bg-white/20 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                 <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-xs min-h-[120px]" placeholder="আপনার পরামর্শ লিখুন..." value={suggestionText} onChange={e => setSuggestionText(e.target.value)} />
                 <button onClick={handleSendSuggestion} disabled={!suggestionText.trim() || isSendingSuggestion} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 disabled:opacity-50">{isSendingSuggestion ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'পরামর্শ পাঠান'}</button>
              </div>
           </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="p-6 bg-rose-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3"><MessageSquare className="w-6 h-6" /><h3 className="font-black uppercase text-sm tracking-widest">যোগাযোগ করুন</h3></div>
                 <button onClick={() => setShowContactModal(false)} className="p-2 bg-white/20 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="space-y-3">
                    <a href={contactConfig.whatsapp} target="_blank" rel="noopener noreferrer" className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4 active:scale-95 transition-all group">
                       <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 group-hover:scale-110"><Smartphone className="w-5 h-5" /></div>
                       <div><p className="text-[11px] font-black text-emerald-900">WhatsApp Group</p><p className="text-[9px] font-bold text-emerald-600">আমাদের গ্রুপে জয়েন করুন</p></div>
                    </a>
                    <a href={contactConfig.facebook} target="_blank" rel="noopener noreferrer" className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4 active:scale-95 transition-all group">
                       <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 group-hover:scale-110"><Facebook className="w-5 h-5" /></div>
                       <div><p className="text-[11px] font-black text-blue-900">Facebook Page</p><p className="text-[9px] font-bold text-blue-600">আমাদের পেজ ভিজিট করুন</p></div>
                    </a>
                    <a href={`mailto:${contactConfig.email}`} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4 active:scale-95 transition-all group">
                       <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-100 group-hover:scale-110"><Mail className="w-5 h-5" /></div>
                       <div><p className="text-[11px] font-black text-slate-900">Official Email</p><p className="text-[9px] font-bold text-slate-500">{contactConfig.email}</p></div>
                    </a>
                 </div>
                 <div className="pt-4 border-t border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-3">জরুরি যোগাযোগ</p>
                    <a href={`tel:${contactConfig.phone}`} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                       <PhoneCall className="w-5 h-5" /> {toBengaliNumber(contactConfig.phone)}
                    </a>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Payment Information Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col">
              <div className="p-6 bg-blue-600 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-3"><Landmark className="w-6 h-6" /><h3 className="font-black uppercase text-sm tracking-widest">পেমেন্ট তথ্য</h3></div>
                 <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-white/20 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto no-scrollbar">
                 {/* Alrajhi Bank Details */}
                 <div className="bg-blue-50/80 p-5 rounded-[2rem] border-2 border-blue-100 space-y-4">
                    <div className="flex items-center gap-3 border-b border-blue-100 pb-2">
                       <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center"><Building2 className="w-4 h-4" /></div>
                       <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Alrajhi bank information</h4>
                    </div>
                    
                    <div className="space-y-3">
                       <div className="flex flex-col gap-1">
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Account Name</p>
                          <div className="flex justify-between items-center">
                             <p className="text-xs font-black text-slate-900">MD JAHIDUL ISLAM</p>
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-1">
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Account Number</p>
                          <div className="flex justify-between items-center group cursor-pointer" onClick={() => copyToClipboard('077040010006087859970', 'acc')}>
                             <p className="text-sm font-black text-slate-900">077040010006087859970</p>
                             <div className="flex items-center gap-1">
                                {copiedField === 'acc' && <span className="text-[8px] font-black text-emerald-600 animate-in fade-in">Copied!</span>}
                                <Copy className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600" />
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-1">
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">IBAN</p>
                          <div className="flex justify-between items-center group cursor-pointer" onClick={() => copyToClipboard('SA17 8000 0859 6080 1785 9970', 'iban')}>
                             <p className="text-[10px] font-black text-slate-900 break-all leading-tight">SA17 8000 0859 6080 1785 9970</p>
                             <div className="flex items-center gap-1 shrink-0 ml-2">
                                {copiedField === 'iban' && <span className="text-[8px] font-black text-emerald-600">Copied!</span>}
                                <Copy className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600" />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Mobile Banking Section */}
                 <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 text-center space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">অফিসিয়াল মোবাইল ব্যাংকিং</p>
                    <div className="flex items-center justify-center gap-2 text-xl font-black text-slate-900 group cursor-pointer" onClick={() => copyToClipboard(contactConfig.phone, 'phone')}>
                       {toBengaliNumber(contactConfig.phone)}
                       <div className="relative">
                          {copiedField === 'phone' && <span className="absolute -top-6 left-0 text-[8px] font-black text-emerald-600 whitespace-nowrap">Copied!</span>}
                          <Copy className="w-4 h-4 text-slate-300 group-hover:text-teal-600" />
                       </div>
                    </div>
                    <div className="flex justify-center gap-2 pt-1">
                       {['বিকাশ', 'নগদ', 'রকেট', 'উপায়'].map(tag => (
                         <span key={tag} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black text-slate-600 shadow-sm">{tag}</span>
                       ))}
                    </div>
                 </div>
                 
                 <button onClick={() => setShowPaymentModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-xl shadow-slate-200 mt-2">ঠিক আছে</button>
              </div>
           </div>
        </div>
      )}

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
