
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { User, Transaction, UserStatus, TransactionStatus, Expense, AssistanceRequest, AssistanceStatus, Suggestion, ContactConfig } from '../types';
import { toPng } from 'html-to-image';
import { 
  Users, DollarSign, Check, X, Trash2, LayoutDashboard, 
  TrendingUp, TrendingDown, Search, 
  Calendar, LogOut, Plus, 
  MessageCircle, Send, Wallet, Camera, FileText, Hash, Download, ImageIcon,
  UserCheck, UserCircle, Loader2, Droplet, MapPin, Clock, 
  Phone, User as UserIcon, Coins, PlusCircle, CreditCard, UserPlus, Printer,
  ShieldCheck, History as HistoryIcon, RefreshCw, HandHelping, Info, AlertCircle, Briefcase, Home, Lightbulb, Settings, Facebook, Smartphone, Mail
} from 'lucide-react';

const toBengaliNumber = (num: number | string) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
};

const AdminDashboard: React.FC = () => {
  const { setIsAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [assistanceReqs, setAssistanceReqs] = useState<AssistanceRequest[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState(db.getStats());
  const [contactConfig, setContactConfig] = useState<ContactConfig>(db.getContactConfig());
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'assistance' | 'txs' | 'expense' | 'suggestions' | 'settings'>('overview');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [expenseImage, setExpenseImage] = useState<string | null>(null);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [isFixingStats, setIsFixingStats] = useState(false);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [notifMessage, setNotifMessage] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingFunds, setIsAddingFunds] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const profileCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refreshData = () => {
      setUsers(db.getUsers());
      setTransactions(db.getTransactions().sort((a,b) => b.timestamp - a.timestamp));
      setExpenses(db.getExpenses().sort((a,b) => b.timestamp - a.timestamp));
      setAssistanceReqs(db.getAssistanceRequests().sort((a,b) => b.timestamp - a.timestamp));
      setSuggestions(db.getSuggestions().sort((a,b) => b.timestamp - a.timestamp));
      setStats(db.getStats());
      setContactConfig(db.getContactConfig());
      
      if (viewingUser) {
        const updated = db.getUsers().find(u => u.id === viewingUser.id);
        if (updated) setViewingUser(updated);
      }
    };
    refreshData();
    const unsubscribe = db.subscribe(refreshData);
    return unsubscribe;
  }, [viewingUser?.id]);

  const handleLogout = () => { setIsAdmin(false); navigate('/'); };

  const trackProcess = async (id: string, action: () => Promise<void>) => {
    if (processingIds.has(id)) return;
    setProcessingIds(prev => new Set(prev).add(id));
    try { await action(); } catch (e) { console.error(e); } finally {
      setProcessingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleApproveUser = (id: string) => trackProcess(id, () => db.updateUser(id, { status: UserStatus.APPROVED }));
  const handleRejectUser = (id: string) => trackProcess(id, async () => { if(confirm("নিবন্ধনটি বাতিল করবেন?")) await db.updateUser(id, { status: UserStatus.REJECTED }); });
  const handleDeleteUser = (id: string) => trackProcess(id, async () => { if(confirm("সদস্যটি স্থায়ীভাবে মুছে ফেলবেন?")) { await db.deleteUser(id); setViewingUser(null); } });
  const handleApproveTx = (id: string) => trackProcess(id, () => db.approveTransaction(id));
  const handleRejectTx = (id: string) => trackProcess(id, async () => { if(confirm("লেনদেনটি বাতিল করবেন?")) await db.rejectTransaction(id); });

  const handleFixStats = async () => {
    if (isFixingStats) return;
    setIsFixingStats(true);
    try {
      const results = await db.recalculateStats();
      alert(`হিসাব ঠিক করা হয়েছে। বর্তমান মোট সংগ্রহ: ৳${results.totalCol}`);
    } catch (e) { alert('সমস্যা হয়েছে।'); } finally { setIsFixingStats(false); }
  };

  const handleUpdateContactConfig = async () => {
    setIsUpdatingConfig(true);
    try {
      await db.updateContactConfig(contactConfig);
      alert('যোগাযোগ তথ্য আপডেট করা হয়েছে। এটি সকল ইউজারের কাছে সাথে সাথেই কার্যকর হবে।');
    } catch (e) { alert('আপডেট করতে সমস্যা হয়েছে।'); } finally { setIsUpdatingConfig(false); }
  };

  const handleDownloadProfile = async () => {
    if (!profileCardRef.current) return;
    try {
      const dataUrl = await toPng(profileCardRef.current, { quality: 1, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Profile-${viewingUser?.name}-${Date.now()}.png`;
      link.href = dataUrl; link.click();
    } catch (err) { alert('ডাউনলোড করতে সমস্যা হয়েছে।'); }
  };

  const handleExpenseImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setExpenseImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddExpense = async () => {
    const amountNum = parseFloat(expenseAmount);
    if (!expenseAmount || !expenseReason || isSubmittingExpense) return;
    const currentBalance = stats.totalCollection - (expenses.length === 0 ? 0 : stats.totalExpense);
    if (amountNum > currentBalance) return alert("তহবিলে পর্যাপ্ত টাকা নেই!");
    setIsSubmittingExpense(true);
    try {
      await db.addDetailedExpense(amountNum, expenseReason, expenseImage || undefined);
      setExpenseAmount(''); setExpenseReason(''); setExpenseImage(null);
      alert('ব্যয় সফলভাবে যোগ করা হয়েছে।');
    } catch (e: any) { alert(e.message); } finally { setIsSubmittingExpense(false); }
  };

  const handleDeleteExpense = (id: string, amount: number) => trackProcess(id, async () => {
    if (confirm("এই ব্যয়ের হিসাবটি স্থায়ীভাবে মুছে ফেলবেন? এটি ডাটাবেস থেকে মুছে যাবে এবং তহবিলের হিসাব আপডেট হবে।")) {
      await db.deleteExpense(id, amount);
      alert('ব্যয়ের হিসাবটি মুছে ফেলা হয়েছে।');
    }
  });

  const handleSendMessage = async () => {
    if (!viewingUser || !notifMessage.trim() || isSendingNotif) return;
    setIsSendingNotif(true);
    try {
      await db.sendNotification(viewingUser.id, notifMessage.trim());
      setNotifMessage('');
      alert('বার্তা পাঠানো হয়েছে।');
    } catch (e) { alert('বার্তা পাঠানো যায়নি।'); } finally { setIsSendingNotif(false); }
  };

  const handleDownloadReport = async () => {
    if (!reportRef.current) return;
    try {
      const dataUrl = await toPng(reportRef.current, { 
        quality: 1, 
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      const link = document.createElement('a');
      link.download = `Ledger-${Date.now()}.png`;
      link.href = dataUrl; link.click();
    } catch (err) { alert('ডাউনলোড করতে সমস্যা হয়েছে।'); }
  };

  const handleAddManualFunds = async () => {
    if (!viewingUser || !manualAmount || parseFloat(manualAmount) <= 0 || isAddingFunds) return;
    if (!confirm(`${toBengaliNumber(manualAmount)} টাকা সরাসরি সদস্যের একাউন্টে যোগ করতে চান?`)) return;
    setIsAddingFunds(true);
    try {
      await db.addManualTransaction(viewingUser.id, viewingUser.name, parseFloat(manualAmount), 'Admin Manual', manualDate);
      setManualAmount('');
      alert('সফলভাবে টাকা যোগ করা হয়েছে।');
    } catch (e) { alert('সমস্যা হয়েছে।'); } finally { setIsAddingFunds(false); }
  };

  const filteredUsers = useMemo(() => users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone.includes(searchQuery)), [users, searchQuery]);
  const netBalance = stats.totalCollection - (expenses.length === 0 ? 0 : stats.totalExpense);

  return (
    <div className="bg-[#F1F5F9] min-h-screen font-['Hind_Siliguri'] pb-10">
      <header className="px-6 py-5 bg-white border-b border-slate-200 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-600 rounded-xl shadow-lg"><LayoutDashboard className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-base font-black tracking-tighter">এডমিন প্যানেল</h1><p className="text-[8px] text-teal-600 font-black uppercase tracking-widest mt-1">Unity Care Foundation</p></div>
        </div>
        <button onClick={handleLogout} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100"><LogOut className="w-5 h-5" /></button>
      </header>

      {/* Tabs Menu */}
      <div className="bg-white border-b border-slate-200 px-6 overflow-x-auto flex gap-6 scrollbar-hide no-scrollbar sticky top-[72px] z-40 shadow-sm">
        {[
          { id: 'overview', label: 'ওভারভিউ', icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { id: 'users', label: 'সদস্য তালিকা', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'assistance', label: 'আবেদন', icon: <HandHelping className="w-3.5 h-3.5" /> },
          { id: 'txs', label: 'লেনদেন', icon: <DollarSign className="w-3.5 h-3.5" /> },
          { id: 'expense', label: 'ব্যয়', icon: <TrendingDown className="w-3.5 h-3.5" /> },
          { id: 'suggestions', label: 'পরামর্শ', icon: <Lightbulb className="w-3.5 h-3.5" /> },
          { id: 'settings', label: 'সেটিংস', icon: <Settings className="w-3.5 h-3.5" /> }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-4 px-1 border-b-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-400'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <main className="p-4 max-w-4xl mx-auto space-y-5">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
               <div className="flex flex-col"><h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">গ্লোবাল সামারি</h3><p className="text-[8px] text-rose-500 font-bold uppercase mt-1">হিসাব আপডেট করতে পাশের বাটনে চাপুন</p></div>
               <button onClick={handleFixStats} disabled={isFixingStats} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">{isFixingStats ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} হিসাব ঠিক করুন</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="মোট সদস্য" value={`${toBengaliNumber(stats.totalUsers)} জন`} icon={<Users className="w-4 h-4" />} color="bg-blue-50 text-blue-600" />
              <StatCard label="মোট আদায়" value={`৳${toBengaliNumber(stats.totalCollection.toLocaleString())}`} icon={<TrendingUp className="w-4 h-4" />} color="bg-emerald-50 text-emerald-600" />
              <StatCard label="মোট ব্যয়" value={`৳${toBengaliNumber((expenses.length === 0 ? 0 : stats.totalExpense).toLocaleString())}`} icon={<TrendingDown className="w-4 h-4" />} color="bg-rose-50 text-rose-600" />
              <div className="bg-teal-600 p-4 rounded-3xl text-white shadow-xl flex flex-col justify-between"><p className="text-[8px] font-black uppercase tracking-widest opacity-80">বর্তমান ফান্ড</p><h3 className="text-lg font-black">৳{toBengaliNumber(netBalance.toLocaleString())}</h3></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <SectionBox title="নতুন মেম্বার রিকোয়েস্ট" count={users.filter(u=>u.status===UserStatus.PENDING).length} color="bg-teal-600">
                  {users.filter(u=>u.status===UserStatus.PENDING).map(u => (
                    <div key={u.id} className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                       <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center font-black text-teal-600 border border-teal-100">{u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : u.name[0]}</div><div><p className="text-[11px] font-black">{u.name}</p><p className="text-[9px] text-slate-400 font-bold">{u.phone}</p></div></div>
                       <div className="flex gap-1.5"><button disabled={processingIds.has(u.id)} onClick={() => handleApproveUser(u.id)} className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-sm">{processingIds.has(u.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}</button><button onClick={() => handleRejectUser(u.id)} className="p-1.5 bg-rose-600 text-white rounded-lg"><X className="w-3.5 h-3.5" /></button></div>
                    </div>
                  ))}
               </SectionBox>
               <SectionBox title="পেমেন্ট রিকোয়েস্ট" count={transactions.filter(t=>t.status===TransactionStatus.PENDING).length} color="bg-amber-500">
                  {transactions.filter(t=>t.status===TransactionStatus.PENDING).map(t => (
                    <div key={t.id} className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                       <div><p className="text-[11px] font-black">{t.userName}</p><p className="text-sm font-black text-amber-600">৳{toBengaliNumber(t.amount)}</p></div>
                       <div className="flex gap-1.5"><button disabled={processingIds.has(t.id)} onClick={() => handleApproveTx(t.id)} className="p-1.5 bg-emerald-600 text-white rounded-lg">{processingIds.has(t.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}</button><button onClick={() => handleRejectTx(t.id)} className="p-1.5 bg-rose-600 text-white rounded-lg"><X className="w-3.5 h-3.5" /></button></div>
                    </div>
                  ))}
               </SectionBox>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-3 animate-in fade-in">
             <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm"><Search className="w-4 h-4 text-slate-400" /><input type="text" placeholder="সদস্য খুঁজুন..." className="w-full outline-none font-bold text-xs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 border-b"><tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest"><th className="px-5 py-3">সদস্য</th><th className="px-5 py-3">ঠিকানা</th><th className="px-5 py-3">রক্তের গ্রুপ</th><th className="px-5 py-3">অ্যাকশন</th></tr></thead><tbody className="divide-y">{filteredUsers.map(u => (<tr key={u.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setViewingUser(u)}><td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">{u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : <UserCircle className="w-5 h-5 text-slate-300" />}</div><div><p className="font-black text-[11px] text-slate-800">{u.name}</p><p className="text-[9px] text-slate-400 font-bold">{u.phone}</p></div></div></td><td className="px-5 py-3 text-[10px] font-bold text-slate-600">{u.address?.district}, {u.address?.upazila}</td><td className="px-5 py-3"><span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg font-black text-[9px] border border-rose-100">{u.bloodGroup}</span></td><td className="px-5 py-3 flex gap-2"><button onClick={(e) => { e.stopPropagation(); setViewingUser(u); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shadow-sm"><MessageCircle className="w-4 h-4" /></button><button onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }} className="p-2 text-rose-400"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* ASSISTANCE TAB */}
        {activeTab === 'assistance' && (
           <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xs font-black uppercase tracking-widest ml-2">সাহায্যের আবেদনসমূহ</h3>
              {assistanceReqs.map(req => (
                <div key={req.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-3">
                   <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                         <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><HandHelping className="w-6 h-6" /></div>
                         <div>
                            <h4 className="font-black text-sm">{req.userName}</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{req.category} • {toBengaliNumber(new Date(req.timestamp).toLocaleDateString('bn-BD'))}</p>
                         </div>
                      </div>
                      <p className="font-black text-indigo-600 text-lg">৳{toBengaliNumber(req.amount || 0)}</p>
                   </div>
                   <p className="text-[11px] font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">"{req.reason}"</p>
                   {req.status === AssistanceStatus.PENDING && (
                     <div className="flex gap-3 pt-2">
                        <button onClick={() => trackProcess(req.id, () => db.updateAssistanceStatus(req.id, AssistanceStatus.APPROVED, "Approved by Admin"))} className="flex-grow py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">অনুমোদন</button>
                        <button onClick={() => trackProcess(req.id, () => db.updateAssistanceStatus(req.id, AssistanceStatus.REJECTED, "Rejected by Admin"))} className="flex-grow py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black text-[10px] uppercase tracking-widest">বাতিল</button>
                     </div>
                   )}
                </div>
              ))}
           </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'txs' && (
           <div className="space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                 <h3 className="text-xs font-black uppercase tracking-widest">সকল লেনদেন লেজার</h3>
                 <button onClick={handleDownloadReport} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"><Download className="w-3.5 h-3.5" /> রিপোর্ট সেভ</button>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden" ref={reportRef}>
                 <div className="p-8 bg-teal-600 text-white flex justify-between items-center">
                    <div><h2 className="text-xl font-black italic uppercase">UNITY CARE FOUNDATION</h2><p className="text-[10px] font-black uppercase opacity-80 mt-1">সফল লেনদেন রিপোর্ট</p></div>
                    <div className="text-right"><p className="text-2xl font-black">৳{toBengaliNumber(stats.totalCollection.toLocaleString())}</p></div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-black">
                        <thead className="bg-slate-50 border-b">
                          <tr className="text-[9px] font-black uppercase tracking-widest">
                              <th className="px-6 py-4">তারিখ</th>
                              <th className="px-6 py-4">সদস্যের ছবি ও নাম</th>
                              <th className="px-6 py-4">পরিমাণ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {transactions.filter(t => t.status === TransactionStatus.APPROVED).map(t => {
                             const user = users.find(u => u.id === t.userId);
                             return (
                               <tr key={t.id}>
                                   <td className="px-6 py-4 text-[11px] font-bold text-slate-500">{toBengaliNumber(t.date)}</td>
                                   <td className="px-6 py-4 font-black text-[11px] flex items-center gap-2">
                                      <div className="w-6 h-6 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                         {user?.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : <UserIcon className="w-3 h-3 m-auto text-slate-300" />}
                                      </div>
                                      {t.userName}
                                   </td>
                                   <td className="px-6 py-4 font-black text-teal-600 text-base italic">৳{toBengaliNumber(t.amount.toLocaleString())}</td>
                               </tr>
                             );
                          })}
                        </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {/* EXPENSE TAB */}
        {activeTab === 'expense' && (
          <div className="space-y-5 animate-in fade-in">
             <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-md space-y-4">
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-3"><div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-100"><TrendingDown className="w-5 h-5" /></div><h3 className="text-[10px] font-black uppercase tracking-widest">নতুন ব্যয়ের হিসাব যোগ করুন</h3></div>
                   <div className="bg-teal-50 px-4 py-2 rounded-2xl border border-teal-100"><p className="text-[8px] font-black text-teal-600 uppercase tracking-widest leading-none mb-1">অবশিষ্ট ফান্ড</p><p className="text-xs font-black text-teal-900 leading-none">৳{toBengaliNumber(netBalance.toLocaleString())}</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-rose-600">৳</span><input type="number" className="w-full p-4 pl-8 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-lg shadow-inner" placeholder="টাকা..." value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} /></div>
                   <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm shadow-inner" placeholder="ব্যয়ের কারণ..." value={expenseReason} onChange={e => setExpenseReason(e.target.value)} />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-3">
                   {expenseImage ? <img src={expenseImage} className="w-full max-h-40 object-contain rounded-xl" /> : <ImageIcon className="w-10 h-10 text-slate-300" />}
                   <label className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase cursor-pointer hover:bg-slate-50">ভাউচার ছবি আপলোড<input type="file" className="hidden" accept="image/*" onChange={handleExpenseImage} /></label>
                </div>
                <button onClick={handleAddExpense} disabled={!expenseAmount || !expenseReason || isSubmittingExpense} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 disabled:opacity-50">{isSubmittingExpense ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'হিসাব যোগ করুন'}</button>
             </div>
             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b"><tr className="text-[8px] font-black uppercase text-slate-400 tracking-widest"><th className="px-5 py-3">তারিখ</th><th className="px-5 py-3">বিবরণ</th><th className="px-5 py-3">টাকা</th><th className="px-5 py-3">অ্যাকশন</th></tr></thead><tbody className="divide-y">{expenses.map(e => (<tr key={e.id}><td className="px-5 py-4 text-[10px] font-bold text-slate-500">{toBengaliNumber(e.date)}</td><td className="px-5 py-4 font-black text-slate-800 text-[11px]">{e.reason}</td><td className="px-5 py-4 font-black text-rose-600 text-sm">৳{toBengaliNumber(e.amount.toLocaleString())}</td><td className="px-5 py-4 flex gap-2">{e.proofImage && <button onClick={() => window.open(e.proofImage)} className="text-teal-600 underline font-black text-[9px]">ভাউচার</button>}<button onClick={() => handleDeleteExpense(e.id, e.amount)} disabled={processingIds.has(e.id)} className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors ml-auto">{processingIds.has(e.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button></td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* SUGGESTIONS TAB */}
        {activeTab === 'suggestions' && (
           <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xs font-black uppercase tracking-widest ml-2">মেম্বারদের পরামর্শ</h3>
              {suggestions.map(s => (
                 <div key={s.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-center"><h4 className="text-[11px] font-black text-slate-800">{s.userName}</h4><span className="text-[8px] font-bold text-slate-400 uppercase">{toBengaliNumber(new Date(s.timestamp).toLocaleDateString('bn-BD'))}</span></div>
                    <p className="text-[12px] font-bold text-slate-600 leading-relaxed italic">"{s.message}"</p>
                 </div>
              ))}
              {suggestions.length === 0 && <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100"><Lightbulb className="w-12 h-12 text-slate-100 mx-auto mb-2" /><p className="text-[10px] font-black text-slate-300 uppercase">কোন পরামর্শ নেই</p></div>}
           </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-5 animate-in fade-in">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3"><div className="p-2.5 bg-slate-800 text-white rounded-2xl"><Settings className="w-6 h-6" /></div><div><h3 className="text-sm font-black uppercase tracking-widest">গ্লোবাল সেটিংস</h3><p className="text-[9px] font-black text-teal-600 uppercase tracking-widest">যোগাযোগ লিঙ্ক পরিবর্তন করুন</p></div></div>
                <div className="space-y-4">
                   <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Group Link</label><div className="relative"><Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" /><input type="text" className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs" value={contactConfig.whatsapp} onChange={e => setContactConfig({...contactConfig, whatsapp: e.target.value})} /></div></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Facebook Page Link</label><div className="relative"><Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" /><input type="text" className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs" value={contactConfig.facebook} onChange={e => setContactConfig({...contactConfig, facebook: e.target.value})} /></div></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" /><input type="text" className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs" value={contactConfig.email} onChange={e => setContactConfig({...contactConfig, email: e.target.value})} /></div></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emergency Phone Number</label><div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" /><input type="text" className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs" value={contactConfig.phone} onChange={e => setContactConfig({...contactConfig, phone: e.target.value})} /></div></div>
                </div>
                <button onClick={handleUpdateContactConfig} disabled={isUpdatingConfig} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 disabled:opacity-50">{isUpdatingConfig ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'সব আপডেট করুন'}</button>
             </div>
          </div>
        )}
      </main>

      {/* MEMBER PROFILE MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div ref={profileCardRef} className="bg-white overflow-hidden">
                <div className="bg-teal-600 p-6 flex flex-col items-center text-white relative">
                   <button onClick={() => setViewingUser(null)} className="absolute top-4 left-4 p-2 bg-white/20 rounded-xl md:hidden z-10"><X className="w-4 h-4" /></button>
                   <button onClick={handleDownloadProfile} className="absolute top-4 right-4 p-2 bg-white/20 rounded-xl z-10 hover:bg-white/30 transition-all"><Download className="w-4 h-4" /></button>
                   <div className="w-20 h-20 rounded-[1.8rem] bg-white border-4 border-white shadow-xl overflow-hidden mb-3">{viewingUser.profilePic ? <img src={viewingUser.profilePic} className="w-full h-full object-cover" /> : <UserIcon className="w-8 h-8 text-teal-100 m-6" />}</div>
                   <h2 className="text-lg font-black italic text-center leading-tight">{viewingUser.name}</h2>
                   <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 mt-1 italic">সদস্য আইডি: {toBengaliNumber(viewingUser.phone.slice(-4))}</p>
                   <div className="flex gap-4 mt-4 w-full justify-center"><div className="flex items-center gap-1.5"><Phone className="w-3 h-3 opacity-70" /><p className="text-[9px] font-bold">{toBengaliNumber(viewingUser.phone)}</p></div><div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 opacity-70" /><p className="text-[9px] font-bold">{viewingUser.address?.district}</p></div></div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                   {[
                      { label: 'পেশা', val: viewingUser.profession || 'নেই', icon: <Briefcase className="w-3 h-3 text-indigo-500" /> },
                      { label: 'মোট দান', val: `৳${toBengaliNumber(viewingUser.totalDonation?.toLocaleString() || 0)}`, icon: <DollarSign className="w-3 h-3 text-emerald-500" /> },
                      { label: 'লেনদেন', val: `${toBengaliNumber(viewingUser.transactionCount || 0)} টি`, icon: <HistoryIcon className="w-3 h-3 text-amber-500" /> },
                      { label: 'যোগদান', val: toBengaliNumber(new Date(viewingUser.registeredAt).toLocaleDateString('bn-BD')), icon: <Calendar className="w-3 h-3 text-blue-500" /> },
                   ].map((item, i) => (
                      <div key={i} className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center"><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p><div className="flex items-center gap-1.5">{item.icon}<span className="text-[10px] font-black">{item.val}</span></div></div>
                   ))}
                   <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 col-span-2"><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">স্থায়ী ঠিকানা</p><div className="flex items-center gap-1.5"><Home className="w-3 h-3 text-rose-500" /><span className="text-[10px] font-black">{viewingUser.address?.village}, {viewingUser.address?.upazila}</span></div></div>
                </div>
              </div>
              <div className="flex-grow p-4 space-y-3 overflow-y-auto no-scrollbar">
                 <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100"><h4 className="text-[8px] font-black text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MessageCircle className="w-3 h-3" /> বার্তা পাঠান</h4><div className="flex gap-2"><input type="text" className="w-full p-2.5 bg-white border border-indigo-100 rounded-xl outline-none font-bold text-[10px]" placeholder="বার্তা লিখুন..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} /><button onClick={handleSendMessage} disabled={!notifMessage.trim() || isSendingNotif} className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md active:scale-95">{isSendingNotif ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}</button></div></div>
                 <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100"><h4 className="text-[8px] font-black text-emerald-900 uppercase tracking-widest mb-2 flex items-center gap-1.5"><PlusCircle className="w-3 h-3" /> ফান্ড যোগ করুন</h4><div className="grid grid-cols-2 gap-2 mb-2"><input type="number" className="p-2.5 bg-white border border-emerald-100 rounded-xl outline-none font-black text-[11px]" placeholder="টাকা..." value={manualAmount} onChange={e => setManualAmount(e.target.value)} /><input type="date" className="p-2.5 bg-white border border-emerald-100 rounded-xl outline-none font-black text-[9px]" value={manualDate} onChange={e => setManualDate(e.target.value)} /></div><button onClick={handleAddManualFunds} disabled={!manualAmount || isAddingFunds} className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-black uppercase text-[9px] shadow-sm active:scale-95">{isAddingFunds ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'টাকা যোগ করুন'}</button></div>
              </div>
              <button onClick={() => setViewingUser(null)} className="p-4 text-slate-400 font-black text-[10px] uppercase border-t hover:bg-slate-50 hidden md:block">বন্ধ করুন</button>
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <div className="bg-white p-4 rounded-3xl border border-slate-200 h-24 flex flex-col justify-between shadow-sm"><div className={`w-8 h-8 rounded-xl flex items-center justify-center border border-white shadow-md ${color}`}>{icon}</div><div className="mt-1"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p><h3 className="text-[13px] font-black text-slate-900 leading-none mt-1.5 italic">{value}</h3></div></div>
);

const SectionBox = ({ title, count, children, color }: { title: string, count: number, children?: React.ReactNode, color: string }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full"><div className={`p-4 ${color} text-white flex justify-between items-center`}><h4 className="text-[10px] font-black uppercase tracking-widest">{title}</h4><span className="text-[9px] font-black bg-black/20 px-3 py-1 rounded-full">{toBengaliNumber(count)}</span></div><div className="p-4 space-y-3 flex-grow bg-slate-50/20">{children}</div></div>
);

export default AdminDashboard;
