
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { Notification, TransactionStatus, Expense, Transaction } from '../types';
import { 
  Wallet, CreditCard, Award, User as UserIcon, 
  List, ArrowUpRight, TrendingUp, Bell, ChevronRight,
  ShieldCheck, X, Clock, Plus, TrendingDown, Receipt, Users, HandHelping,
  Lightbulb, Info, Smartphone, CheckCircle2, Send, Loader2, MessageSquare, MessageCircle, Facebook, Mail, PhoneCall, Copy, Landmark, Building2,
  PieChart, Activity, Fingerprint, ScrollText, AlertCircle
} from 'lucide-react';

const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();
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
    "from-[#1E40AF] via-[#3B82F6] to-[#10B981]", // Blue/Green
    "from-[#8B5CF6] via-[#A78BFA] to-[#60A5FA]", // Purple/Blue
    "from-[#F97316] via-[#FB923C] to-[#EF4444]", // Orange/Red
    "from-[#4C1D95] via-[#7C3AED] to-[#DB2777]"  // Deep Purple/Pink
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
      alert('আপনার অভিযোগ জমা দেওয়া হয়েছে। আমরা দ্রুত ব্যবস্থা নেব।');
    } catch (e) {
      alert('ব্যর্থ হয়েছে।');
    } finally {
      setIsSendingComplaint(false);
    }
  };

  const totalFund = appStats.totalCollection - (db.getExpenses().length === 0 ? 0 : appStats.totalExpense);
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
      {/* Top Profile Header */}
      <div className="px-6 pt-10 pb-4 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl border-4 border-white shadow-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-teal-400 to-emerald-600 relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
            {currentUser?.profilePic ? <img src={currentUser.profilePic} className="w-full h-full object-cover relative z-10" alt="Profile" /> : <UserIcon className="w-6 h-6 text-white relative z-10" />}
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight leading-none mb-1">হ্যালো, {currentUser?.name?.split(' ')[0]}!</h2>
            <div className="flex items-center gap-1 opacity-80">
               <ShieldCheck className="w-4 h-4 text-teal-600" />
               <p className="text-base font-black text-teal-600 uppercase tracking-tight">{currentUser?.designation || 'ভেরিফাইড সদস্য'}</p>
            </div>
          </div>
        </div>
        <button onClick={handleOpenNotifications} className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 border border-white/50 rounded-2xl text-slate-600 relative active:scale-90 transition-all shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]"></div>
          <Bell className="w-7 h-7 relative z-10" />
          {unreadCount > 0 && (
            <span className="absolute top-3 right-3 flex h-4 w-4 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white"></span>
            </span>
          )}
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* Main Collection Card - Rotating Credit Card Design */}
        <div className={`bg-gradient-to-br ${cardDesigns[currentCardIdx]} p-5 rounded-[2rem] shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden transition-all duration-1000 h-56 flex flex-col justify-between group`}>
          {/* World Map Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay">
            <svg viewBox="0 0 1000 500" className="w-full h-full object-cover">
              <path d="M150,100 Q200,50 250,100 T350,100 M600,200 Q650,150 700,200 T800,200 M200,350 Q250,300 300,350 T400,350" stroke="white" strokeWidth="2" fill="none" />
              {/* Simplified map shapes */}
              <circle cx="200" cy="150" r="40" />
              <circle cx="450" cy="250" r="60" />
              <circle cx="750" cy="180" r="50" />
              <circle cx="300" cy="380" r="30" />
              <circle cx="850" cy="350" r="45" />
            </svg>
          </div>

          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-16 -mb-16"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Top Row: Chip and Bank Name */}
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-7 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-200 rounded-md relative overflow-hidden shadow-inner border border-amber-500/20">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px opacity-30">
                    {[...Array(9)].map((_, i) => <div key={i} className="border border-black/20"></div>)}
                  </div>
                </div>
                {/* Holographic Sticker */}
                <div className="w-8 h-6 bg-gradient-to-tr from-slate-300 via-white to-slate-400 rounded-sm opacity-60 rotate-12 shadow-sm flex items-center justify-center">
                  <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">UNITY CARE</p>
                <p className="text-[6px] font-bold opacity-60 uppercase tracking-widest mt-1">Foundation</p>
              </div>
            </div>

            {/* Middle Row: Balance */}
            <div className="flex flex-col">
               <p className="text-[7px] font-black text-white/50 uppercase tracking-[0.3em] mb-1">Current Balance</p>
               <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-white/40">৳</span>
                  <h1 className="text-3xl font-black tracking-[0.15em] drop-shadow-lg">
                    {toBengaliNumber(totalFund.toLocaleString())}
                  </h1>
               </div>
            </div>
            
            {/* Bottom Row: Cardholder, Stats and Logo */}
            <div className="flex justify-between items-end">
              <div className="space-y-2 flex-grow">
                <div className="flex gap-4 items-center">
                  <div>
                    <p className="text-[6px] font-black text-white/40 uppercase tracking-widest mb-0.5">Cardholder Name</p>
                    <p className="text-[10px] font-black uppercase tracking-wider truncate max-w-[120px]">{currentUser?.name || 'MEMBER NAME'}</p>
                  </div>
                  <div>
                    <p className="text-[6px] font-black text-white/40 uppercase tracking-widest mb-0.5">Join Date</p>
                    <p className="text-[10px] font-black tracking-widest">
                      {currentUser?.registeredAt 
                        ? new Date(currentUser.registeredAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) 
                        : '00/00/00'}
                    </p>
                  </div>
                </div>
                
                {/* Restored Stats Badges */}
                <div className="flex gap-2">
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    <p className="text-[10px] font-black text-white uppercase tracking-wider">দান: ৳{toBengaliNumber(currentUser?.totalDonation?.toLocaleString() || 0)}</p>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                    <p className="text-[10px] font-black text-white uppercase tracking-wider">লেনদেন: {toBengaliNumber(currentUser?.transactionCount || 0)} টি</p>
                  </div>
                </div>
              </div>

              {/* Mastercard-style Logo */}
              <div className="flex -space-x-2.5 opacity-90 scale-75 origin-right mb-1">
                <div className="w-7 h-7 rounded-full bg-[#EB001B]"></div>
                <div className="w-7 h-7 rounded-full bg-[#F79E1B] mix-blend-screen"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight Stats (Compact Design) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#00F2FE] to-[#4FACFE] p-3.5 rounded-[2rem] shadow-xl shadow-blue-500/20 flex items-center gap-3 active:scale-95 transition-all border border-white/30 relative overflow-hidden group">
             <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
             <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0 shadow-lg text-white relative z-10 border border-white/40">
                <Users className="w-4 h-4" />
             </div>
             <div className="overflow-hidden relative z-10">
                <p className="text-[7px] font-black text-white/80 uppercase tracking-widest mb-0.5">মোট সদস্য</p>
                <h3 className="text-xs font-black text-white truncate">{toBengaliNumber(appStats.totalUsers)} জন</h3>
             </div>
          </div>
          <button onClick={() => navigate('/expenses')} className="bg-gradient-to-br from-[#F093FB] to-[#F5576C] p-3.5 rounded-[2rem] shadow-xl shadow-rose-500/20 flex items-center gap-3 active:scale-95 transition-all text-left border border-white/30 relative overflow-hidden group">
             <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
             <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0 shadow-lg text-white relative z-10 border border-white/40">
                <div className="relative w-5 h-5 flex items-center justify-center">
                  {/* Chair */}
                  <div className="absolute bottom-0.5 w-3 h-2 bg-blue-600 rounded-sm"></div>
                  {/* Person */}
                  <div className="absolute bottom-1 w-2.5 h-3 bg-amber-400 rounded-md"></div>
                  <div className="absolute top-0.5 w-2 h-2 bg-pink-100 rounded-full"></div>
                  {/* Laptop */}
                  <div className="absolute bottom-2 w-3.5 h-2 bg-slate-800 rounded-sm border border-slate-700"></div>
                </div>
             </div>
             <div className="overflow-hidden relative z-10">
                <p className="text-[7px] font-black text-white/80 uppercase tracking-widest mb-0.5">মোট খরচ</p>
                <h3 className="text-xs font-black text-white truncate">৳{toBengaliNumber((db.getExpenses().length === 0 ? 0 : appStats.totalExpense).toLocaleString())}</h3>
             </div>
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-4 gap-x-3 gap-y-6 px-1">
          {[
            { icon: <CreditCard className="w-6 h-6" />, label: 'দান', color: 'from-indigo-500 to-blue-600', path: '/transaction' },
            { icon: <HandHelping className="w-6 h-6" />, label: 'আবেদন', color: 'from-teal-400 to-emerald-600', path: '/assistance' },
            { icon: <Award className="w-6 h-6" />, label: 'সেরা দাতা', color: 'from-amber-400 to-orange-500', path: '/leaderboard' },
            { icon: <Users className="w-6 h-6" />, label: 'স্থায়ী সদস্য', color: 'from-blue-400 to-indigo-600', action: () => setShowPermanentMembersModal(true) },
            { icon: <List className="w-6 h-6" />, label: 'হিসাব', color: 'from-violet-500 to-purple-600', path: '/history' },
            { icon: <Lightbulb className="w-6 h-6" />, label: 'পরামর্শ', color: 'from-emerald-400 to-teal-500', action: () => setShowSuggestionModal(true) },
            { icon: <ScrollText className="w-6 h-6" />, label: 'নীতিমালা', color: 'from-slate-600 to-slate-800', action: () => window.open(contactConfig.policyUrl || 'https://drive.google.com/file/d/13v3j9HdOhmpU3UZ60W9xbGy4C4_lM9S-/view?usp=drivesdk', '_blank') },
            { icon: <AlertCircle className="w-6 h-6" />, label: 'অভিযোগ', color: 'from-rose-500 to-pink-600', action: () => setShowComplaintModal(true) },
            { icon: <Info className="w-6 h-6" />, label: 'পেমেন্ট', color: 'from-blue-500 to-indigo-600', action: () => setShowPaymentModal(true) },
            { icon: <MessageSquare className="w-6 h-6" />, label: 'যোগাযোগ', color: 'from-pink-500 to-rose-600', action: () => setShowContactModal(true) },
            { 
              icon: (
                <div className="relative w-8 h-8 flex items-center justify-center">
                  {/* 3D Character Background Elements */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-amber-200/40 rounded-full blur-sm"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-200/40 rounded-full blur-sm"></div>
                  
                  {/* Chair */}
                  <div className="absolute bottom-1 w-4 h-3 bg-blue-600 rounded-sm shadow-sm"></div>
                  <div className="absolute bottom-0 w-1 h-2 bg-blue-700 left-1/2 -translate-x-1/2"></div>
                  
                  {/* Person Legs */}
                  <div className="absolute bottom-2 w-3 h-2 bg-slate-900 rounded-full"></div>
                  
                  {/* Torso (Yellow) */}
                  <div className="absolute bottom-3 w-4 h-4 bg-amber-400 rounded-lg shadow-inner border border-amber-500/20"></div>
                  
                  {/* Head */}
                  <div className="absolute top-1 w-2.5 h-2.5 bg-[#FFE4E1] rounded-full border border-pink-200 shadow-sm"></div>
                  {/* Hair */}
                  <div className="absolute top-1 w-2.5 h-1 bg-slate-800 rounded-t-full"></div>
                  
                  {/* Laptop (Dark) */}
                  <div className="absolute bottom-4 w-5 h-3 bg-slate-800 rounded-sm transform -rotate-6 border border-slate-700 shadow-md flex items-center justify-center">
                    <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                  </div>
                  
                  {/* Floating Notification Dot */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full shadow-sm border border-rose-400 flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                </div>
              ), 
              label: 'খরচ', 
              color: 'from-rose-500 to-rose-700', 
              path: '/expenses' 
            },
            { 
              icon: (
                <div className="relative w-8 h-8 flex items-center justify-center">
                  {/* 3D Scroll Background */}
                  <div className="absolute inset-0 bg-blue-500 rounded-sm transform -rotate-3 shadow-lg"></div>
                  <div className="absolute inset-0 bg-blue-600 rounded-sm transform rotate-2 shadow-md"></div>
                  <div className="absolute inset-0 bg-blue-500 rounded-sm flex flex-col items-center pt-1 px-1 gap-0.5 border border-blue-400/30">
                    {/* Invoice Label */}
                    <div className="w-full bg-white rounded-[1px] py-0.5 flex items-center justify-center mb-0.5 shadow-sm">
                      <span className="text-[4px] font-black text-blue-700 leading-none tracking-tighter">INVOICE</span>
                    </div>
                    {/* Lines and Dollar Sign */}
                    <div className="w-full flex justify-between items-end px-0.5 pb-0.5">
                      <div className="flex flex-col gap-0.5 w-3">
                        <div className="h-[1.5px] w-full bg-white/60 rounded-full"></div>
                        <div className="h-[1.5px] w-full bg-white/60 rounded-full"></div>
                        <div className="h-[1.5px] w-3/4 bg-white/60 rounded-full"></div>
                      </div>
                      <div className="text-amber-400 font-black text-[10px] leading-none drop-shadow-sm">$</div>
                    </div>
                  </div>
                  {/* Roll Effects */}
                  <div className="absolute -top-1 left-0 right-0 h-1.5 bg-blue-700 rounded-full shadow-inner"></div>
                  <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-blue-700 rounded-full shadow-inner"></div>
                </div>
              ), 
              label: 'ভাউচার', 
              color: 'from-blue-500 to-indigo-700', 
              path: '/vouchers' 
            },
            { icon: <Activity className="w-6 h-6" />, label: 'অগ্রগতি', color: 'from-indigo-400 to-violet-600', path: '/progress' },
          ].map((item, idx) => (
            <button 
              key={idx} 
              onClick={item.path ? () => navigate(item.path!) : item.action} 
              className="flex flex-col items-center gap-2 active:scale-90 transition-all group"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-[1.5rem] flex items-center justify-center shadow-lg text-white relative overflow-hidden transition-transform group-hover:rotate-6`}>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/20 rounded-full blur-xl"></div>
                <div className="relative z-10 drop-shadow-md">
                  {item.icon}
                </div>
              </div>
              <span className="text-[9px] font-black text-slate-800 uppercase tracking-tighter text-center leading-none">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">সাম্প্রতিক লেনদেন</h3>
              <button onClick={() => navigate('/history')} className="text-[9px] font-black text-teal-600 uppercase tracking-widest">সব দেখুন</button>
           </div>
           <div className="space-y-3">
              {allTransactions.filter(t => t.userId === currentUser?.id).slice(0, 3).map((tx, idx) => {
                const gradients = [
                  "from-[#4FACFE] to-[#00F2FE]", // Cyan/Blue
                  "from-[#667EEA] to-[#764BA2]", // Blue/Purple
                  "from-[#F093FB] to-[#F5576C]", // Pink/Rose
                  "from-[#FA709A] to-[#FEE140]"  // Pink/Yellow
                ];
                const gradient = gradients[idx % gradients.length];
                
                return (
                  <div 
                    key={tx.id} 
                    onClick={() => navigate('/vouchers', { state: { transactionId: tx.id } })}
                    className={`cursor-pointer bg-gradient-to-r ${gradient} p-3.5 rounded-[2rem] shadow-lg shadow-slate-200/40 flex justify-between items-center hover:shadow-xl transition-all active:scale-[0.98] border border-white/30 relative overflow-hidden group`}
                  >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white shadow-md border border-white/40">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-white text-[11px] tracking-tight leading-none">{tx.method}</p>
                        <p className="text-[7px] text-white/80 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {toBengaliNumber(tx.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <p className="font-black text-white text-sm italic leading-none">৳{toBengaliNumber(tx.amount)}</p>
                      <span className={`text-[6px] font-black uppercase px-2 py-0.5 rounded-full mt-1.5 inline-block border border-white/30 ${
                        tx.status === TransactionStatus.APPROVED ? 'bg-emerald-400/40 text-white' : 
                        tx.status === TransactionStatus.REJECTED ? 'bg-rose-400/40 text-white' : 
                        'bg-amber-400/40 text-white'
                      }`}>
                        {tx.status === TransactionStatus.APPROVED ? 'সফল' : 
                         tx.status === TransactionStatus.REJECTED ? 'বাতিল' : 
                         'পেন্ডিং'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {allTransactions.filter(t => t.userId === currentUser?.id).length === 0 && (
                <div className="bg-white p-10 rounded-[2.5rem] text-center border border-dashed border-slate-200">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">কোন লেনদেন পাওয়া যায়নি</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotifs && (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-300">
           <div className="bg-[#0D9488] pt-10 pb-16 px-6 rounded-b-[4rem] relative overflow-hidden flex items-center gap-4">
              <div className="absolute top-[-20px] left-[-20px] w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/30 relative overflow-hidden shrink-0">
                 <div className="absolute inset-0 bg-white/10"></div>
                 <Bell className="w-9 h-9 relative z-10" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">নোটিফিকেশন</h3>
              <button onClick={() => setShowNotifs(false)} className="ml-auto w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all">
                <X className="w-7 h-7" />
              </button>
           </div>
           <div className="px-6 -mt-8 space-y-4 h-[calc(100vh-140px)] overflow-y-auto no-scrollbar pb-10">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className={`bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border flex flex-col gap-3 transition-all ${!n.isRead ? 'border-teal-100 ring-2 ring-teal-500/5' : 'border-slate-50 opacity-80'}`}>
                     <div className="flex justify-between items-center">
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">অ্যাডমিন বার্তা</p>
                        <div className="flex items-center gap-1.5 opacity-30"><Clock className="w-3 h-3" /><p className="text-[9px] font-black">{formatTime(n.timestamp)}</p></div>
                     </div>
                     <p className="text-[15px] font-bold text-slate-800 leading-relaxed">{n.message}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-32 opacity-20"><Bell className="w-16 h-16 mb-4" /><p className="text-sm font-black uppercase tracking-widest">কোন নোটিফিকেশন নেই</p></div>
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
                    <h3 className="font-black uppercase text-sm tracking-widest">পরামর্শ পাঠান</h3>
                 </div>
                 <button onClick={() => setShowSuggestionModal(false)} className="relative z-10 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-90"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <textarea className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-bold text-xs min-h-[150px]" placeholder="আপনার পরামর্শ লিখুন..." value={suggestionText} onChange={e => setSuggestionText(e.target.value)} />
                 <button onClick={handleSendSuggestion} disabled={!suggestionText.trim() || isSendingSuggestion} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs">
                  {isSendingSuggestion ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'জমা দিন'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-t-[3.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-500">
              {/* Header */}
              <div className="p-8 bg-[#E91E63] text-white flex justify-between items-center relative overflow-hidden shrink-0">
                 <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                       <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-lg tracking-tight">যোগাযোগ করুন</h3>
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
                       <p className="text-[13px] font-black text-[#00695C]">WhatsApp Group</p>
                       <p className="text-[10px] font-bold text-teal-600/70">আমাদের গ্রুপে জয়েন করুন</p>
                    </div>
                 </a>

                 {/* Facebook Card */}
                 <a href={contactConfig.facebook} target="_blank" rel="noopener noreferrer" className="block w-full p-4 bg-[#EBF4FF] border border-blue-100 rounded-3xl flex items-center gap-5 active:scale-[0.98] transition-all group shadow-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1877F2] to-[#1A365D] text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                       <Facebook className="w-6 h-6 relative z-10" />
                    </div>
                    <div>
                       <p className="text-[13px] font-black text-[#1A365D]">Facebook Page</p>
                       <p className="text-[10px] font-bold text-blue-600/70">আমাদের পেজ ভিজিট করুন</p>
                    </div>
                 </a>

                 {/* Messenger Card */}
                 <a href={contactConfig.messenger} target="_blank" rel="noopener noreferrer" className="block w-full p-4 bg-[#F0F2F5] border border-indigo-100 rounded-3xl flex items-center gap-5 active:scale-[0.98] transition-all group shadow-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#0084FF] to-[#004A8F] text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                       <MessageCircle className="w-6 h-6 relative z-10" />
                    </div>
                    <div>
                       <p className="text-[13px] font-black text-[#004A8F]">Messenger</p>
                       <p className="text-[10px] font-bold text-indigo-600/70">আমাদের মেসেঞ্জারে যুক্ত হোন</p>
                    </div>
                 </a>

                 {/* Email Card */}
                 <div className="w-full p-4 bg-white border border-slate-100 rounded-3xl flex items-center gap-5 shadow-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#333333] to-[#000000] text-white rounded-2xl flex items-center justify-center shadow-md relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                       <Mail className="w-6 h-6 relative z-10" />
                    </div>
                    <div className="overflow-hidden">
                       <p className="text-[13px] font-black text-slate-800">Official Email</p>
                       <p className="text-[10px] font-bold text-slate-400 truncate">{contactConfig.email}</p>
                    </div>
                 </div>

                 {/* Emergency Call Button */}
                 <div className="pt-6 border-t border-slate-100 space-y-4">
                    <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">জরুরি যোগাযোগ</p>
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
                    <h3 className="font-black uppercase text-sm tracking-widest">আমাদের নীতিমালা</h3>
                 </div>
                 <button onClick={() => setShowPolicyModal(false)} className="relative z-10 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-90"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-4 overflow-y-auto no-scrollbar">
                 {[
                   "সংগঠনের সকল কার্যক্রমে পূর্ণ স্বচ্ছতা ও সততা বজায় রাখা আপনার প্রধান নৈতিক দায়িত্ব।",
                   "আপনার ব্যক্তিগত তথ্য সংগঠনের কাজের বাইরে অন্য কোথাও প্রকাশ বা ব্যবহার করা হবে না।",
                   "জমাকৃত প্রতিটি অর্থ শুধুমাত্র আর্তমানবতার সেবা, দুর্যোগ মোকাবিলা ও সমাজকল্যাণে ব্যয় হবে।",
                   "সংগঠনের পরিচয় ব্যবহার করে কোনো ব্যক্তিগত ফায়দা বা রাজনৈতিক কাজ করা সম্পূর্ণ নিষিদ্ধ।",
                   "বিশেষ দুর্যোগে স্বেচ্ছাসেবী হিসেবে সশরীরে কাজ করার মানসিক প্রস্তুতি থাকতে হবে।",
                   "সদস্যপদ সক্রিয় রাখতে মাসিক ফি বা অনুদান নিয়মিত প্রদান করে তহবিলে সহযোগিতা করতে হবে।",
                   "সংগঠনের আদর্শ পরিপন্থী কোনো কাজের প্রমাণ পাওয়া গেলে সদস্যপদ বাতিল হতে পারে।"
                 ].map((p, i) => (
                   <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-teal-600 font-black text-[10px] shrink-0 border shadow-sm">{i+1}</div>
                      <p className="text-[12px] font-bold text-slate-700 leading-relaxed">{p}</p>
                   </div>
                 ))}
              </div>
              <div className="p-6 bg-slate-50 border-t shrink-0">
                 <button onClick={() => setShowPolicyModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">বন্ধ করুন</button>
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
                    <h3 className="font-black uppercase text-sm tracking-widest">অভিযোগ জানান</h3>
                 </div>
                 <button onClick={() => setShowComplaintModal(false)} className="relative z-10 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-90"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <textarea 
                   className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-bold text-xs min-h-[150px] focus:border-rose-200 transition-all" 
                   placeholder="আপনার অভিযোগ বিস্তারিত লিখুন..." 
                   value={complaintText} 
                   onChange={e => setComplaintText(e.target.value)} 
                 />
                 <button 
                   onClick={handleSendComplaint} 
                   disabled={!complaintText.trim() || isSendingComplaint} 
                   className="w-full py-5 bg-rose-600 text-white rounded-3xl font-black uppercase text-xs shadow-lg shadow-rose-100 active:scale-95 transition-all disabled:opacity-50"
                 >
                  {isSendingComplaint ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'জমা দিন'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Payment Information Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-t-[3.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-500">
              {/* Header */}
              <div className="p-8 bg-[#2563EB] text-white flex justify-between items-center relative overflow-hidden shrink-0">
                 <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                       <Landmark className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-lg tracking-tight">পেমেন্ট তথ্য</h3>
                 </div>
                 <button 
                  onClick={() => setShowPaymentModal(false)} 
                  className="relative z-10 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Body Content */}
              <div className="p-8 space-y-6 bg-white">
                 {/* Al Rajhi Bank Card */}
                 <div className="w-full p-6 bg-[#F1F8FF] border border-blue-100 rounded-[2.5rem] relative overflow-hidden group shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-10 h-10 bg-gradient-to-br from-[#2563EB] to-[#1E40AF] text-white rounded-xl flex items-center justify-center shadow-md relative overflow-hidden">
                          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                          <Building2 className="w-5 h-5 relative z-10" />
                       </div>
                       <h4 className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest">ALRAJHI BANK INFORMATION</h4>
                    </div>
                    <div className="space-y-5">
                       <div className="border-b border-blue-50 pb-3">
                          <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">ACCOUNT NAME</p>
                          <p className="text-sm font-black text-slate-800">MD JAHIDUL ISLAM</p>
                       </div>
                       <div className="border-b border-blue-50 pb-3 flex items-center justify-between">
                          <div>
                             <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">ACCOUNT NUMBER</p>
                             <p className="text-sm font-black text-slate-800 tracking-wider">077040010006087859970</p>
                          </div>
                          <button onClick={() => copyToClipboard('077040010006087859970', 'acc')} className="p-2 text-blue-300 hover:text-blue-600 transition-colors">
                             {copiedField === 'acc' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                       </div>
                       <div className="flex items-center justify-between">
                          <div>
                             <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">IBAN</p>
                             <p className="text-[11px] font-black text-slate-800 tracking-tight">SA17 8000 0859 6080 1785 9970</p>
                          </div>
                          <button onClick={() => copyToClipboard('SA1780000859608017859970', 'iban')} className="p-2 text-blue-300 hover:text-blue-600 transition-colors">
                             {copiedField === 'iban' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                       </div>
                    </div>
                 </div>

                 {/* Mobile Banking Section */}
                 <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">অফিসিয়াল মোবাইল ব্যাংকিং</p>
                    <div className="flex items-center justify-center gap-3">
                       <h3 className="text-2xl font-black text-slate-800 tracking-widest">01777599874</h3>
                       <button onClick={() => copyToClipboard('01777599874', 'mobile')} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                          {copiedField === 'mobile' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                       </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                       {['বিকাশ', 'নগদ', 'রকেট', 'উপায়'].map(tag => (
                          <span key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-500 uppercase">{tag}</span>
                       ))}
                    </div>
                 </div>

                 {/* Footer Button */}
                 <button 
                  onClick={() => setShowPaymentModal(false)} 
                  className="w-full py-5 bg-[#0F172A] text-white rounded-3xl font-black text-sm uppercase shadow-xl active:scale-95 transition-all"
                 >
                    ঠিক আছে
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
                  <h3 className="font-black uppercase text-sm tracking-widest">স্থায়ী সদস্য ({toBengaliNumber(db.getUsers().filter(u => u.isPermanentMember).length)})</h3>
                  <p className="text-[9px] font-bold text-blue-100 uppercase tracking-widest mt-0.5">আমাদের গর্বিত সদস্যবৃন্দ</p>
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
                      <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mt-1">{member.designation || 'স্থায়ী সদস্য'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center opacity-30">
                  <Award className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <p className="font-black uppercase tracking-widest text-xs">কোন স্থায়ী সদস্য পাওয়া যায়নি</p>
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
