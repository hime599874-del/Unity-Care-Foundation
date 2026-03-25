
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useLanguage } from '../services/LanguageContext';
import { useToast } from '../services/ToastContext';
import { db } from '../services/db';
import { Notification, TransactionStatus, Expense, Transaction } from '../types';
import { 
  Wallet, CreditCard, Award, User as UserIcon, 
  List, ArrowUpRight, TrendingUp, Bell, ChevronRight,
  ShieldCheck, X, Clock, Plus, TrendingDown, Receipt, Users, HandHelping,
  Lightbulb, Info, Smartphone, CheckCircle2, Send, Loader2, MessageSquare, MessageCircle, Facebook, Mail, PhoneCall, Copy, Landmark, Building2,
  PieChart, Activity, Fingerprint, ScrollText, AlertCircle, WifiOff
} from 'lucide-react';

const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [appStats, setAppStats] = useState(db.getStats());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [contactConfig, setContactConfig] = useState(db.getContactConfig());
  const [showNotifs, setShowNotifs] = useState(false);
  
  // Modals state
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showPermanentMembersModal, setShowPermanentMembersModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [suggestionText, setSuggestionText] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false);
  const [isSendingComplaint, setIsSendingComplaint] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const navigate = useNavigate();

  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const isAnyModalOpen = showNotifs || showSuggestionModal || showPaymentModal || showContactModal || showPolicyModal || showComplaintModal;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isAnyModalOpen]);

  const cardDesigns = [
    "from-[#0F172A] via-[#1E293B] to-[#0F172A]", // Dark Starry Night
    "from-[#1E40AF] via-[#3B82F6] to-[#10B981]", // Blue/Green
    "from-[#8B5CF6] via-[#A78BFA] to-[#60A5FA]", // Purple/Blue
    "from-[#F97316] via-[#FB923C] to-[#EF4444]", // Orange/Red
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCardIdx((prev) => (prev + 1) % cardDesigns.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const refreshData = () => {
      setAppStats(db.getStats());
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

  // Changed to return English numbers as per user request
  const toBengaliNumber = (num: number | string) => {
    return num.toString();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + strMinutes + ' ' + ampm;
  };

  const handleSendComplaint = async () => {
    if (!complaintText.trim() || !currentUser || isSendingComplaint) return;
    setIsSendingComplaint(true);
    try {
      await db.submitComplaint(currentUser.id, currentUser.name, complaintText.trim());
      setComplaintText('');
      setShowComplaintModal(false);
      showToast(t('complaint_sent'), 'success');
    } catch (e) {
      showToast(t('error_occurred'), 'error');
    } finally {
      setIsSendingComplaint(false);
    }
  };

  const totalFund = appStats.totalCollection - appStats.totalExpense;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpenNotifications = () => {
    setShowNotifs(true);
    setTimeout(() => {
      notifications.filter(n => !n.isRead).forEach(n => db.markNotificationAsRead(n.id));
    }, 1000);
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || !currentUser || isSendingSuggestion) return;
    setIsSendingSuggestion(true);
    try {
      await db.submitSuggestion(currentUser.id, currentUser.name, suggestionText.trim());
      setSuggestionText('');
      setShowSuggestionModal(false);
      showToast(t('suggestion_sent'), 'success');
    } catch (e) { showToast(t('error_occurred'), 'error'); } finally { setIsSendingSuggestion(false); }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-transparent dark:bg-slate-950 min-h-screen pb-32 font-['Hind_Siliguri'] transition-colors duration-300">
      {/* Top Profile Header */}
      <div className="px-6 pt-8 pb-4 flex justify-between items-center glass-nav sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-teal-400 to-emerald-600 relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
            {currentUser?.profilePic ? <img src={currentUser.profilePic} className="w-full h-full object-cover relative z-10" alt="Profile" /> : <UserIcon className="w-6 h-6 text-white relative z-10" />}
            {!db.getIsOnline() && (
              <div className="absolute top-0 right-0 bg-rose-500 p-1 rounded-bl-lg z-20 animate-pulse">
                <WifiOff className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">{t('hello')}, {currentUser?.name?.split(' ')[0]}!</h2>
            <div className="flex items-center gap-1 opacity-80">
               {!db.getIsOnline() ? (
                 <>
                   <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                   <p className="text-base font-black text-rose-500 uppercase tracking-tight">অফলাইন</p>
                 </>
               ) : (
                 <>
                   <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 no-glow" />
                   <p className="text-base font-black text-teal-600 dark:text-teal-400 uppercase tracking-tight">{currentUser?.designation || t('verified_member')}</p>
                 </>
               )}
            </div>
          </div>
        </div>
        <button onClick={handleOpenNotifications} className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-white/50 dark:border-slate-700/50 rounded-2xl text-slate-600 relative active:scale-90 transition-all shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-white/20 dark:bg-slate-900/20 backdrop-blur-[1px]"></div>
          <img src="https://img.icons8.com/fluency/96/appointment-reminders.png" className="w-9 h-9 relative z-10 object-contain" alt="Notification" />
          {unreadCount > 0 && (
            <span className="absolute top-3 right-3 flex h-4 w-4 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white dark:border-slate-900"></span>
            </span>
          )}
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Main Collection Card - Rotating Credit Card Design */}
        <div className={`bg-gradient-to-br ${cardDesigns[currentCardIdx]} p-5 rounded-[2.5rem] text-white relative overflow-hidden transition-all duration-1000 h-60 flex flex-col justify-between group backdrop-blur-md border border-white/20 shadow-2xl shadow-slate-900/40`}>
          {/* Glossy Overlay */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20"></div>
          
          {/* Starry Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Twinkling Stars */}
            {[...Array(40)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-0.5 h-0.5 bg-white rounded-full animate-star-twinkle"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  opacity: Math.random() * 0.6 + 0.2
                }}
              />
            ))}
            
            {/* Moving Light Flow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent w-[200%] h-[200%] animate-flow opacity-20"></div>

            {/* Large Glowing Crescent Moon */}
            <div className="absolute top-4 right-4 opacity-80 animate-moon-glow z-10">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="url(#moon-grad)" />
                <defs>
                  <linearGradient id="moon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF" />
                    <stop offset="100%" stopColor="#FFD700" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Hanging Ornate Lanterns (Fanoos) */}
            <div className="absolute top-0 right-10 flex gap-8 pointer-events-none z-20">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex flex-col items-center animate-swing" style={{ animationDelay: `${i * 1.2}s` }}>
                  {/* Hanging String */}
                  <div className="w-px h-16 bg-gradient-to-b from-white/40 to-white/5"></div>
                  {/* Lantern Body */}
                  <div className="relative w-10 h-16">
                    <svg viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">
                      <path d="M12 0L22 8V32L12 40L2 32V8L12 0Z" fill="url(#lantern-grad)" stroke="white" strokeWidth="1" />
                      <path d="M6 10H18M6 15H18M6 20H18M6 25H18M6 30H18" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
                      <circle cx="12" cy="20" r="6" fill="#FFD700" className="animate-pulse" />
                      <defs>
                        <radialGradient id="lantern-grad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#FFD700" />
                          <stop offset="100%" stopColor="#B45309" />
                        </radialGradient>
                      </defs>
                    </svg>
                    {/* Intense Light Emission */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-amber-400/20 rounded-full blur-3xl animate-pulse-glow-intense"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Subtle Eid Mubarak Text */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
              <span className="text-7xl font-black uppercase tracking-[0.6em] rotate-[-12deg]">EID MUBARAK</span>
            </div>
          </div>

          <div className="relative z-30 flex flex-col h-full justify-between">
            {/* Top Row: Chip and Bank Name */}
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <div className="w-12 h-9 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-200 rounded-lg relative overflow-hidden shadow-inner border border-amber-500/30">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px opacity-40">
                    {[...Array(9)].map((_, i) => <div key={i} className="border border-black/10"></div>)}
                  </div>
                </div>
                <div className="w-9 h-7 bg-gradient-to-tr from-slate-300 via-white/80 to-slate-400 rounded-md opacity-40 rotate-12 shadow-sm flex items-center justify-center">
                  <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-black uppercase tracking-[0.25em] leading-none text-white/90">UNITY CARE</p>
                <p className="text-[7px] font-bold opacity-50 uppercase tracking-widest mt-1">Foundation</p>
              </div>
            </div>

            {/* Middle Row: Balance */}
            <div className="flex flex-col -mt-4">
               <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.35em] mb-1.5">{t('current_balance')}</p>
               <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl font-black text-white/30">৳</span>
                  <h1 className="text-4xl font-black tracking-[0.18em] drop-shadow-2xl">
                    {toBengaliNumber(totalFund.toLocaleString())}
                  </h1>
               </div>
            </div>
            
            {/* Bottom Row: Cardholder, Stats and Logo */}
            <div className="flex justify-between items-end">
              <div className="space-y-4 flex-grow">
                <div className="flex gap-6 items-center">
                  <div>
                    <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">Cardholder Name</p>
                    <p className="text-[11px] font-black uppercase tracking-wider truncate max-w-[140px]">{currentUser?.name || 'MEMBER NAME'}</p>
                  </div>
                  <div>
                    <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">Join Date</p>
                    <p className="text-[11px] font-black tracking-widest">
                      {currentUser?.registeredAt 
                        ? new Date(currentUser.registeredAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) 
                        : '01/02/26'}
                    </p>
                  </div>
                </div>
                
                {/* Stats Badges */}
                <div className="flex gap-3">
                  <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-2.5 shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                    <p className="text-[11px] font-black text-white uppercase tracking-wider">{t('donate')}: ৳{toBengaliNumber(currentUser?.totalDonation?.toLocaleString() || 0)}</p>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-2.5 shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
                    <p className="text-[11px] font-black text-white uppercase tracking-wider">{t('transaction_count')}: {toBengaliNumber(currentUser?.transactionCount || 0)} {language === 'bn' ? 'টি' : ''}</p>
                  </div>
                </div>
              </div>

              {/* Mastercard-style Logo */}
              <div className="flex -space-x-3 opacity-90 scale-90 origin-right mb-1">
                <div className="w-9 h-9 rounded-full bg-[#EB001B] shadow-lg"></div>
                <div className="w-9 h-9 rounded-full bg-[#F79E1B] mix-blend-screen shadow-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight Stats (Compact Design) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div 
            className="p-3 flex items-center gap-3 active:scale-95 transition-all glossy-pill glossy-blue"
          >
             <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 text-white relative z-10 border border-white/30 backdrop-blur-sm shadow-inner">
                <Users className="w-5 h-5" />
             </div>
             <div className="overflow-hidden relative z-10">
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mb-0.5 font-['Baloo_Da_2']">{t('total_members')}</p>
                <h3 className="text-sm font-black text-white truncate drop-shadow-md">{toBengaliNumber(appStats.totalUsers)} {language === 'bn' ? 'জন' : ''}</h3>
             </div>
          </div>
          <button 
            onClick={() => navigate('/expenses')} 
            className="p-3 flex items-center gap-3 active:scale-95 transition-all text-left glossy-pill glossy-pink"
          >
             <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 text-white relative z-10 border border-white/30 backdrop-blur-sm shadow-inner">
                <img src="https://img.icons8.com/fluency/96/receipt.png" className="w-7 h-7 object-contain" alt="Expenses" />
             </div>
             <div className="overflow-hidden relative z-10">
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mb-0.5 font-['Baloo_Da_2']">{t('expenses')}</p>
                <h3 className="text-sm font-black text-white truncate drop-shadow-md">৳{toBengaliNumber((db.getExpenses().length === 0 ? 0 : appStats.totalExpense).toLocaleString())}</h3>
             </div>
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-4 gap-x-3 gap-y-3 px-1">
          {[
            { icon: <img src="https://img.icons8.com/fluency/96/charity.png" className="w-9 h-9 object-contain" alt="Donate" />, label: t('donate_now'), color: 'from-indigo-500 via-blue-500 to-cyan-400', glowColor: '#6366F1', path: '/transaction' },
            { icon: <img src="https://img.icons8.com/fluency/96/handshake.png" className="w-9 h-9 object-contain" alt="Apply" />, label: t('apply'), color: 'from-emerald-400 via-teal-500 to-cyan-500', glowColor: '#10B981', path: '/assistance' },
            { icon: <img src="https://img.icons8.com/fluency/96/trophy.png" className="w-9 h-9 object-contain" alt="Top Donors" />, label: t('top_donors'), color: 'from-amber-400 via-orange-500 to-rose-500', glowColor: '#F59E0B', path: '/leaderboard' },
            { icon: <img src="https://img.icons8.com/fluency/96/groups.png" className="w-9 h-9 object-contain" alt="Members" />, label: t('permanent_members'), color: 'from-blue-400 via-indigo-500 to-purple-600', glowColor: '#3B82F6', action: () => setShowPermanentMembersModal(true) },
            { icon: <img src="https://img.icons8.com/fluency/96/heart-with-pulse.png" className="w-9 h-9 object-contain" alt="Recipients" />, label: 'গৃহীতার তথ্য', color: 'from-rose-400 via-pink-500 to-purple-500', glowColor: '#F43F5E', path: '/recipients' },
            ...(currentUser?.canManageRecipients ? [{ 
              icon: <img src="https://img.icons8.com/fluency/96/edit-user-female.png" className="w-9 h-9 object-contain" alt="Manage Recipients" />, 
              label: 'গৃহীতা ম্যানেজমেন্ট', 
              color: 'from-teal-400 via-emerald-500 to-green-600', 
              glowColor: '#10B981', 
              path: '/manage-recipients' 
            }] : []),
            { icon: <img src="https://img.icons8.com/fluency/96/clipboard.png" className="w-9 h-9 object-contain" alt="History" />, label: t('history'), color: 'from-violet-500 via-purple-600 to-fuchsia-600', glowColor: '#8B5CF6', path: '/history' },
            { icon: <img src="https://img.icons8.com/fluency/96/idea.png" className="w-9 h-9 object-contain" alt="Suggestion" />, label: t('suggestion'), color: 'from-lime-400 via-emerald-500 to-teal-600', glowColor: '#10B981', action: () => setShowSuggestionModal(true) },
            { icon: <img src="https://img.icons8.com/fluency/96/scales.png" className="w-9 h-9 object-contain" alt="Policy" />, label: t('policy'), color: 'from-slate-600 via-slate-700 to-slate-900', glowColor: '#475569', action: () => window.open(contactConfig.policyUrl || 'https://drive.google.com/file/d/13v3j9HdOhmpU3UZ60W9xbGy4C4_lM9S-/view?usp=drivesdk', '_blank') },
            { icon: <img src="https://img.icons8.com/fluency/96/megaphone.png" className="w-9 h-9 object-contain" alt="Complaint" />, label: t('complaint'), color: 'from-rose-500 via-pink-600 to-purple-700', glowColor: '#F43F5E', action: () => setShowComplaintModal(true) },
            { icon: <img src="https://i.ibb.co/Pz0PsqC6/bdace8892d77d0557f2b620e89484dc2-1.jpg" className="w-10 h-10 object-cover rounded-full" alt="Payment" />, label: t('payment'), color: 'from-blue-500 via-indigo-600 to-violet-700', glowColor: '#3B82F6', action: () => setShowPaymentModal(true) },
            { icon: <img src="https://img.icons8.com/fluency/96/receipt.png" className="w-10 h-10 object-contain" alt="Expenses" />, label: t('expenses'), color: 'from-rose-500 via-rose-700 to-purple-900', glowColor: '#E11D48', path: '/expenses' },
            { icon: <img src="https://img.icons8.com/fluency/96/customer-support.png" className="w-9 h-9 object-contain" alt="Contact" />, label: t('contact'), color: 'from-pink-500 via-rose-600 to-orange-600', glowColor: '#EC4899', action: () => setShowContactModal(true) },
            { icon: <img src="https://img.icons8.com/fluency/96/bill.png" className="w-10 h-10 object-contain" alt="Vouchers" />, label: t('vouchers'), color: 'from-blue-500 via-indigo-700 to-purple-800', glowColor: '#2563EB', path: '/vouchers' },
            { icon: <img src="https://img.icons8.com/fluency/96/combo-chart.png" className="w-9 h-9 object-contain" alt="Progress" />, label: t('progress'), color: 'from-indigo-400 via-violet-600 to-purple-700', glowColor: '#6366F1', path: '/progress' },
          ].map((item, idx) => (
            <button 
              key={idx} 
              onClick={item.path ? () => navigate(item.path!) : item.action} 
              className="flex flex-col items-center gap-1.5 active:scale-90 transition-all group"
            >
              <div 
                className={`w-14 h-14 glossy-icon flex items-center justify-center text-white bg-gradient-to-br ${item.color} rounded-2xl`}
              >
                <div className="relative z-10 drop-shadow-lg">
                  {item.icon}
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight h-6 flex items-center justify-center px-0.5 font-['Baloo_Da_2']">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-[0.2em]">{t('recent_activity')}</h3>
              <button onClick={() => navigate('/history')} className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">{t('view_all')}</button>
           </div>
           <div className="space-y-3">
              {allTransactions.filter(t => t.userId === currentUser?.id).slice(0, 3).map((tx, idx) => {
                const glossyColors = ["glossy-pink", "glossy-purple", "glossy-blue"];
                const glossyClass = glossyColors[idx % glossyColors.length];
                
                const getBankLogo = (method: string) => {
                  const m = method.toLowerCase();
                  if (m.includes('bkash')) return { img: 'https://i.ibb.co/93SJDFLT/image-161466-1701693779.jpg', scale: 'scale-110' };
                  if (m.includes('nagad')) return { img: 'https://i.ibb.co/kd64m5t/images-1.png', scale: 'scale-110' };
                  if (m.includes('rocket')) return { img: 'https://i.ibb.co/WWqk4189/images-4.jpg', scale: 'scale-[1.35]' };
                  if (m.includes('dbbl')) return { img: 'https://i.ibb.co/0RtgBg2k/o-Se-SYq-X9crpm-R6n-T9jn-I-24-049b42353edf981f0f6fc7e21ce90af0-jvectors.webp', scale: 'scale-110' };
                  if (m.includes('islami')) return { img: 'https://i.ibb.co/PZKKtNN8/images-7.jpg', scale: 'scale-110' };
                  if (m.includes('midland')) return { img: 'https://i.ibb.co/nq6nb223/images-22.jpg', scale: 'scale-110' };
                  return null;
                };
                const bankLogo = getBankLogo(tx.method);
                
                return (
                  <div 
                    key={tx.id} 
                    onClick={() => navigate('/vouchers', { state: { transactionId: tx.id } })}
                    className="cursor-pointer p-3 bg-white dark:bg-slate-900 rounded-2xl flex justify-between items-center transition-all active:scale-[0.98] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner overflow-hidden ${bankLogo ? 'bg-white border border-slate-100 dark:border-slate-800' : glossyClass}`}>
                        {bankLogo ? (
                          <img src={bankLogo.img} alt={tx.method} className={`h-6 w-auto object-contain mix-blend-multiply dark:mix-blend-normal ${bankLogo.scale}`} />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 stroke-[1.5]" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-wide capitalize">{tx.method === 'Admin Manual' ? 'Manual' : tx.method}</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {toBengaliNumber(tx.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-lg italic leading-none">৳{toBengaliNumber(tx.amount)}</p>
                      <span className={`text-[8px] font-bold uppercase px-2.5 py-0.5 rounded-full mt-1.5 inline-block tracking-wider ${
                        tx.status === TransactionStatus.APPROVED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 
                        tx.status === TransactionStatus.REJECTED ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 
                        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {tx.status === TransactionStatus.APPROVED ? t('status_success') : 
                         tx.status === TransactionStatus.REJECTED ? t('status_cancelled') : 
                         t('status_pending')}
                      </span>
                    </div>
                  </div>
                );
              })}
              {allTransactions.filter(t => t.userId === currentUser?.id).length === 0 && (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] text-center border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">{t('no_transactions')}</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotifs && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 animate-in slide-in-from-bottom duration-300">
           <div className="bg-[#0D9488] dark:bg-[#065F46] pt-10 pb-16 px-6 rounded-b-[4rem] relative overflow-hidden flex items-center gap-4">
              <div className="absolute top-[-20px] left-[-20px] w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/30 relative overflow-hidden shrink-0">
                 <div className="absolute inset-0 bg-white/10"></div>
                 <img src="https://img.icons8.com/fluency/96/appointment-reminders.png" className="w-12 h-12 relative z-10 object-contain" alt="Notification" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">{t('notifications')}</h3>
              <button onClick={() => setShowNotifs(false)} className="ml-auto w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all">
                <X className="w-7 h-7" />
              </button>
           </div>
           <div className="px-6 -mt-8 space-y-4 h-[calc(100vh-140px)] overflow-y-auto no-scrollbar pb-10">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className={`bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border flex flex-col gap-3 transition-all ${!n.isRead ? 'border-teal-100 ring-2 ring-teal-500/5' : 'border-slate-50 opacity-80'}`}>
                     <div className="flex justify-between items-center">
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('admin_message')}</p>
                        <div className="flex items-center gap-1.5 opacity-30"><Clock className="w-3 h-3" /><p className="text-[9px] font-black">{formatTime(n.timestamp)}</p></div>
                     </div>
                     <p className="text-[15px] font-bold text-slate-800 leading-relaxed">{n.message}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-32 opacity-20"><img src="https://img.icons8.com/fluency/96/appointment-reminders.png" className="w-20 h-20 mb-4 object-contain" alt="No Notifications" /><p className="text-sm font-black uppercase tracking-widest">{t('no_notifications')}</p></div>
              )}
           </div>
        </div>
      )}

      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="p-8 bg-emerald-600 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                 <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                       <Lightbulb className="w-6 h-6" />
                    </div>
                    <h3 className="font-black uppercase text-sm tracking-widest">{t('send_suggestion')}</h3>
                 </div>
                 <button onClick={() => setShowSuggestionModal(false)} className="relative z-10 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-90"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <textarea className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-bold text-xs min-h-[150px]" placeholder={t('suggestion_placeholder')} value={suggestionText} onChange={e => setSuggestionText(e.target.value)} />
                 <button onClick={handleSendSuggestion} disabled={!suggestionText.trim() || isSendingSuggestion} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs">
                  {isSendingSuggestion ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t('submit')}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="p-8 bg-[#E91E63] text-white flex justify-between items-center relative overflow-hidden shrink-0">
                 <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                       <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-lg tracking-tight">{t('contact_us')}</h3>
                 </div>
                 <button 
                  onClick={() => setShowContactModal(false)} 
                  className="relative z-10 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Body Content */}
              <div className="p-8 space-y-5 bg-[#F8FAFC]">
                 {/* WhatsApp Card */}
                 <a href={contactConfig.whatsapp} target="_blank" rel="noopener noreferrer" className="block w-full p-4 bg-[#E6FFFA] border border-teal-100 rounded-3xl flex items-center gap-5 active:scale-[0.98] transition-all group shadow-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#00A884] to-[#00695C] text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                       <Smartphone className="w-6 h-6 relative z-10" />
                    </div>
                    <div>
                       <p className="text-[13px] font-black text-[#00695C]">{t('whatsapp_group')}</p>
                       <p className="text-[10px] font-bold text-teal-600/70">{t('join_our_group')}</p>
                    </div>
                 </a>

                 {/* Facebook Card */}
                 <a href={contactConfig.facebook} target="_blank" rel="noopener noreferrer" className="block w-full p-4 bg-[#EBF4FF] border border-blue-100 rounded-3xl flex items-center gap-5 active:scale-[0.98] transition-all group shadow-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1877F2] to-[#1A365D] text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                       <Facebook className="w-6 h-6 relative z-10" />
                    </div>
                    <div>
                       <p className="text-[13px] font-black text-[#1A365D]">{t('facebook_page')}</p>
                       <p className="text-[10px] font-bold text-blue-600/70">{t('visit_our_page')}</p>
                    </div>
                 </a>

                 {/* Messenger Card */}
                 <a href={contactConfig.messenger} target="_blank" rel="noopener noreferrer" className="block w-full p-4 bg-[#F0F2F5] border border-indigo-100 rounded-3xl flex items-center gap-5 active:scale-[0.98] transition-all group shadow-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#0084FF] to-[#004A8F] text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                       <MessageCircle className="w-6 h-6 relative z-10" />
                    </div>
                    <div>
                       <p className="text-[13px] font-black text-[#004A8F]">{t('messenger_title')}</p>
                       <p className="text-[10px] font-bold text-indigo-600/70">{t('connect_on_messenger')}</p>
                    </div>
                 </a>

                 {/* Email Card */}
                 <div className="w-full p-4 bg-white border border-slate-100 rounded-3xl flex items-center gap-5 shadow-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#333333] to-[#000000] text-white rounded-2xl flex items-center justify-center shadow-md relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                       <Mail className="w-6 h-6 relative z-10" />
                    </div>
                    <div className="overflow-hidden">
                       <p className="text-[13px] font-black text-slate-800">{t('official_email')}</p>
                       <p className="text-[10px] font-bold text-slate-400 truncate">{contactConfig.email}</p>
                    </div>
                 </div>

                 {/* Emergency Call Button */}
                 <div className="pt-6 border-t border-slate-100 space-y-4">
                    <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('emergency_contact')}</p>
                    <a href={`tel:${contactConfig.phone}`} className="w-full py-5 bg-gradient-to-br from-[#0D9488] to-[#00695C] text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-teal-100 active:scale-95 transition-all relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                       <PhoneCall className="w-6 h-6 relative z-10" /> <span className="relative z-10">{contactConfig.phone}</span>
                    </a>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
                 <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                       <ScrollText className="w-6 h-6 text-teal-400" />
                    </div>
                    <h3 className="font-black uppercase text-sm tracking-widest">{t('our_policy')}</h3>
                 </div>
                 <button onClick={() => setShowPolicyModal(false)} className="relative z-10 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-90"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-4 overflow-y-auto no-scrollbar">
                 {[
                   t('policy_1'),
                   t('policy_2'),
                   t('policy_3'),
                   t('policy_4'),
                   t('policy_5'),
                   t('policy_6'),
                   t('policy_7')
                 ].map((p, i) => (
                   <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-teal-600 font-black text-[10px] shrink-0 border shadow-sm">{i+1}</div>
                      <p className="text-[12px] font-bold text-slate-700 leading-relaxed">{p}</p>
                   </div>
                 ))}
              </div>
              <div className="p-6 bg-slate-50 border-t shrink-0">
                 <button onClick={() => setShowPolicyModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">{t('close')}</button>
              </div>
           </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="p-8 bg-rose-600 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                 <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                       <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="font-black uppercase text-sm tracking-widest">{t('send_complaint')}</h3>
                 </div>
                 <button onClick={() => setShowComplaintModal(false)} className="relative z-10 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-90"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <textarea 
                   className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-bold text-xs min-h-[150px] focus:border-rose-200 transition-all" 
                   placeholder={t('complaint_placeholder')} 
                   value={complaintText} 
                   onChange={e => setComplaintText(e.target.value)} 
                 />
                 <button 
                   onClick={handleSendComplaint} 
                   disabled={!complaintText.trim() || isSendingComplaint} 
                   className="w-full py-5 bg-rose-600 text-white rounded-3xl font-black uppercase text-xs shadow-lg shadow-rose-100 active:scale-95 transition-all disabled:opacity-50"
                 >
                  {isSendingComplaint ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t('submit')}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Payment Information Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="p-8 bg-[#2563EB] text-white flex justify-between items-center relative overflow-hidden shrink-0">
                 <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                       <Landmark className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-lg tracking-tight">{t('payment_info')}</h3>
                 </div>
                 <button 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedBank(null);
                  }} 
                  className="relative z-10 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Body Content */}
              <div className="p-8 space-y-6 bg-white overflow-y-auto no-scrollbar max-h-[60vh]">
                 {/* Selected Bank Card - Moved to Top */}
                 {selectedBank ? (
                    <div className={`w-full p-6 rounded-[2.5rem] relative overflow-hidden group shadow-sm animate-in zoom-in-95 duration-300 ${
                       selectedBank === 'alrajhi' ? 'bg-[#F1F8FF] border-blue-100' : 
                       selectedBank === 'dbbl' ? 'bg-[#F0FFF4] border-green-100' : 
                       selectedBank === 'midland' ? 'bg-[#FFF1F1] border-red-100' :
                       selectedBank === 'bkash' ? 'bg-[#FFF0F3] border-pink-100' :
                       selectedBank === 'nagad' ? 'bg-[#FFF9F0] border-orange-100' :
                       selectedBank === 'rocket' ? 'bg-[#F9F0FF] border-purple-100' :
                       'bg-[#F0FFF0] border-green-50'
                    } border`}>
                       <div className="flex items-center gap-3 mb-6">
                          <div className={`w-10 h-10 bg-gradient-to-br text-white rounded-xl flex items-center justify-center shadow-md relative overflow-hidden ${
                             selectedBank === 'alrajhi' ? 'from-[#2563EB] to-[#1E40AF]' : 
                             selectedBank === 'dbbl' ? 'from-[#007A33] to-[#004B1C]' : 
                             selectedBank === 'midland' ? 'from-[#E31E24] to-[#A31519]' :
                             selectedBank === 'bkash' ? 'from-[#D12053] to-[#A01840]' :
                             selectedBank === 'nagad' ? 'from-[#F7941D] to-[#C67617]' :
                             selectedBank === 'rocket' ? 'from-[#8C3494] to-[#6A2770]' :
                             'from-[#008000] to-[#004d00]'
                          }`}>
                             <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                             <Building2 className="w-5 h-5 relative z-10" />
                          </div>
                          <h4 className={`text-[10px] font-black uppercase tracking-widest ${
                             selectedBank === 'alrajhi' ? 'text-[#2563EB]' : 
                             selectedBank === 'dbbl' ? 'text-[#007A33]' : 
                             selectedBank === 'midland' ? 'text-[#E31E24]' :
                             selectedBank === 'bkash' ? 'text-[#D12053]' :
                             selectedBank === 'nagad' ? 'text-[#F7941D]' :
                             selectedBank === 'rocket' ? 'text-[#8C3494]' :
                             'text-[#008000]'
                          }`}>
                             {selectedBank === 'alrajhi' ? t('alrajhi_bank_info') : 
                              selectedBank === 'dbbl' ? t('dutch_bangla_bank') : 
                              selectedBank === 'midland' ? t('midland_bank') :
                              selectedBank === 'bkash' ? 'bKash' :
                              selectedBank === 'nagad' ? 'Nagad' :
                              selectedBank === 'rocket' ? 'Rocket' :
                              t('islami_bank')}
                          </h4>
                       </div>
                       <div className="space-y-5">
                          <div className="border-b border-black/5 pb-3">
                             <p className="text-[9px] font-bold opacity-40 uppercase mb-1">
                                {selectedBank === 'dbbl' ? t('beneficiary_name') : t('account_name')}
                             </p>
                             <p className="text-sm font-black text-slate-800">
                                {selectedBank === 'islami' ? 'MD.JAHIDUL ISLAM' : 
                                 selectedBank === 'dbbl' ? 'SHAPIA BEGUM' : 
                                 'MD JAHIDUL ISLAM'}
                             </p>
                          </div>
                          {(selectedBank === 'islami' || selectedBank === 'midland') && (
                             <div className="border-b border-black/5 pb-3">
                                <p className="text-[9px] font-bold opacity-40 uppercase mb-1">{t('branch_name')}</p>
                                <p className="text-sm font-black text-slate-800">
                                   {selectedBank === 'islami' ? 'Savar ashulia dhaka' : 'Zirabo Branch. Savar.Ashulia. Dhaka'}
                                </p>
                             </div>
                          )}
                          {selectedBank === 'dbbl' && (
                             <>
                                <div className="border-b border-black/5 pb-3 flex items-center justify-between">
                                   <div>
                                      <p className="text-[9px] font-bold opacity-40 uppercase mb-1">{t('swift_code')}</p>
                                      <p className="text-sm font-black text-slate-800 tracking-wider">DBBLBDDH</p>
                                   </div>
                                   <button onClick={() => copyToClipboard('DBBLBDDH', 'swift')} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                      {copiedField === 'swift' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                   </button>
                                </div>
                                <div className="border-b border-black/5 pb-3 flex items-center justify-between">
                                   <div>
                                      <p className="text-[9px] font-bold opacity-40 uppercase mb-1">{t('routing_number')}</p>
                                      <p className="text-sm font-black text-slate-800 tracking-wider">090270608</p>
                                   </div>
                                   <button onClick={() => copyToClipboard('090270608', 'routing')} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                      {copiedField === 'routing' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                   </button>
                                </div>
                             </>
                          )}
                          <div className="border-b border-black/5 pb-3 flex items-center justify-between">
                             <div>
                                <p className="text-[9px] font-bold opacity-40 uppercase mb-1">{t('account_number')}</p>
                                <p className="text-sm font-black text-slate-800 tracking-wider">
                                   {selectedBank === 'alrajhi' ? '077040010006087859970' : 
                                    selectedBank === 'dbbl' ? '2647348821808' : 
                                    selectedBank === 'midland' ? '0010-1680000249' :
                                    (selectedBank === 'bkash' || selectedBank === 'nagad' || selectedBank === 'rocket') ? '01777599874' :
                                    '20504436700011315'}
                                </p>
                             </div>
                             <button 
                               onClick={() => copyToClipboard(
                                  selectedBank === 'alrajhi' ? '077040010006087859970' : 
                                  selectedBank === 'dbbl' ? '2647348821808' : 
                                  selectedBank === 'midland' ? '0010-1680000249' :
                                  (selectedBank === 'bkash' || selectedBank === 'nagad' || selectedBank === 'rocket') ? '01777599874' :
                                  '20504436700011315', 
                                  'acc'
                               )} 
                               className="p-2 text-slate-300 hover:text-slate-600 transition-colors"
                             >
                                {copiedField === 'acc' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                             </button>
                          </div>
                          {selectedBank === 'alrajhi' && (
                             <div className="flex items-center justify-between">
                                <div>
                                   <p className="text-[9px] font-bold opacity-40 uppercase mb-1">IBAN</p>
                                   <p className="text-[11px] font-black text-slate-800 tracking-tight">SA17 8000 0859 6080 1785 9970</p>
                                </div>
                                <button onClick={() => copyToClipboard('SA1780000859608017859970', 'iban')} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                   {copiedField === 'iban' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                             </div>
                          )}
                       </div>
                    </div>
                 ) : (
                    <div className="w-full py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 gap-3">
                       <Building2 className="w-10 h-10 opacity-20" />
                       <p className="text-[10px] font-bold uppercase tracking-widest">{t('select_bank')}</p>
                    </div>
                 )}

                 {/* Bank Selection */}
                 <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('select_bank')}</p>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                       {[
                          { id: 'alrajhi', name: 'Al Rajhi', color: 'bg-blue-600' },
                          { id: 'bkash', name: 'bKash', color: 'bg-[#D12053]', img: 'https://i.ibb.co/93SJDFLT/image-161466-1701693779.jpg', imgClass: 'h-6 w-auto object-contain mix-blend-multiply scale-110' },
                          { id: 'nagad', name: 'Nagad', color: 'bg-[#F7941D]', img: 'https://i.ibb.co/kd64m5t/images-1.png', imgClass: 'h-6 w-auto object-contain mix-blend-multiply scale-110' },
                          { id: 'rocket', name: 'Rocket', color: 'bg-[#8C3494]', img: 'https://i.ibb.co/WWqk4189/images-4.jpg', imgClass: 'h-6 w-auto object-contain mix-blend-multiply scale-[1.35]' },
                          { id: 'dbbl', name: 'DBBL', color: 'bg-[#007A33]', img: 'https://i.ibb.co/0RtgBg2k/o-Se-SYq-X9crpm-R6n-T9jn-I-24-049b42353edf981f0f6fc7e21ce90af0-jvectors.webp', imgClass: 'h-6 w-auto object-contain mix-blend-multiply scale-110' },
                          { id: 'islami', name: 'Islami', color: 'bg-[#008000]', img: 'https://i.ibb.co/PZKKtNN8/images-7.jpg', imgClass: 'h-6 w-auto object-contain mix-blend-multiply scale-110' },
                          { id: 'midland', name: 'Midland', color: 'bg-[#E31E24]', img: 'https://i.ibb.co/nq6nb223/images-22.jpg', imgClass: 'h-6 w-auto object-contain mix-blend-multiply scale-110' }
                       ].map(bank => (
                          <button 
                            key={bank.id}
                            onClick={() => setSelectedBank(bank.id)}
                            className={`px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-wider whitespace-nowrap transition-all border-2 flex items-center justify-center min-w-[80px] h-[44px] overflow-hidden ${selectedBank === bank.id ? (bank.img ? 'border-slate-900 bg-white shadow-lg' : `border-slate-900 ${bank.color} text-white shadow-lg`) : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                          >
                             {bank.img ? (
                               <img src={bank.img} alt={bank.name} className={bank.imgClass} />
                             ) : (
                               bank.name
                             )}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Footer Button */}
                 <button 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedBank(null);
                  }} 
                  className="w-full py-5 bg-[#0F172A] text-white rounded-3xl font-black text-sm uppercase shadow-xl active:scale-95 transition-all"
                 >
                    {t('ok')}
                 </button>
              </div>
           </div>
        </div>
      )}
      {/* Permanent Members Modal */}
      {showPermanentMembersModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm tracking-widest">{t('permanent_members_title')} ({toBengaliNumber(db.getUsers().filter(u => u.isPermanentMember).length)})</h3>
                  <p className="text-[9px] font-bold text-blue-100 uppercase tracking-widest mt-0.5">{t('our_proud_members')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPermanentMembersModal(false)} 
                className="relative z-10 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/50">
              {db.getUsers().filter(u => u.isPermanentMember).length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {db.getUsers().filter(u => u.isPermanentMember).map((member) => (
                    <div key={member.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:shadow-md transition-all">
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 p-1 mb-3 shadow-inner relative overflow-hidden border-2 border-slate-50 group-hover:scale-105 transition-transform">
                        {member.profilePic ? (
                          <img src={member.profilePic} className="w-full h-full object-cover rounded-xl" alt={member.name} />
                        ) : (
                          <UserIcon className="w-8 h-8 m-5 text-slate-300" />
                        )}
                        <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-lg shadow-lg">
                          <ShieldCheck className="w-3 h-3" />
                        </div>
                      </div>
                      <h4 className="text-[12px] font-black text-slate-800 uppercase leading-tight line-clamp-1">{member.name}</h4>
                      <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mt-1">{member.designation || (language === 'bn' ? 'স্থায়ী সদস্য' : 'Permanent Member')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center opacity-30">
                  <Award className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <p className="font-black uppercase tracking-widest text-xs">{t('no_permanent_members')}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-white border-t shrink-0">
              <button 
                onClick={() => setShowPermanentMembersModal(false)} 
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
