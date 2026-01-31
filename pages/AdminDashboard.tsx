
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { User, Transaction, UserStatus, TransactionStatus, AppStats, FundType, Expense } from '../types';
import { toPng } from 'html-to-image';
// Fixed: Added 'Phone' to the imports from lucide-react
import { 
  Users, DollarSign, Check, X, Trash2, LayoutDashboard, 
  TrendingUp, TrendingDown, Bell, Search, 
  Calendar, LogOut, Plus, History, 
  MessageCircle, Send, Wallet, Camera, FileText, Hash, Printer, Download, ImageIcon,
  UserCheck, UserCircle, AlertTriangle, Loader2, Droplet, MapPin, Clock, ShieldCheck, BadgeCheck,
  Phone
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { setIsAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState(db.getStats());
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'txs' | 'expense' | 'donors'>('overview');
  
  const currentYear = new Date().getFullYear();
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(currentYear < 2026 ? 2026 : currentYear);

  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [expenseImage, setExpenseImage] = useState<string | null>(null);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userModalTab, setUserModalTab] = useState<'info' | 'history' | 'add' | 'message' | 'settings'>('info');
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  
  const [manualAmount, setManualAmount] = useState('');
  const [manualMethod, setManualMethod] = useState<'Bkash' | 'Nagad' | 'Rocket' | 'Bank'>('Bkash');
  const [manualFund, setManualFund] = useState<FundType>('General');
  const [isAddingTx, setIsAddingTx] = useState(false);

  const [adminMessage, setAdminMessage] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [donorSearchQuery, setDonorSearchQuery] = useState('');

  const txReportRef = useRef<HTMLDivElement>(null);
  const expenseReportRef = useRef<HTMLDivElement>(null);
  const donorReportRef = useRef<HTMLDivElement>(null);

  // Helper function to convert English numbers to Bengali numerals
  const toBengaliNumber = (num: number | string) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
  };

  useEffect(() => {
    const refreshData = () => {
      setUsers(db.getUsers());
      setTransactions(db.getTransactions().sort((a,b) => b.timestamp - a.timestamp));
      setExpenses(db.getExpenses().sort((a,b) => b.timestamp - a.timestamp));
      setStats(db.getStats());
    };
    refreshData();
    const unsubscribe = db.subscribe(refreshData);
    return unsubscribe;
  }, []);

  // Always get the freshest data for the selected user from the master list
  const selectedUser = users.find(u => u.id === selectedUserId) || null;

  const handleLogout = () => {
    setIsAdmin(false);
    navigate('/');
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || isDeletingUser) return;
    const confirmDelete = confirm(`${selectedUser.name}-কে ডিলিট করলে তার সকল তথ্য চিরতরে মুছে যাবে। আপনি কি নিশ্চিত?`);
    if (!confirmDelete) return;
    setIsDeletingUser(true);
    try {
      await db.deleteUser(selectedUser.id);
      setSelectedUserId(null);
      alert('সদস্যকে সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (err) {
      alert('সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    const reportTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() + 1 === reportMonth && tDate.getFullYear() === reportYear && t.status !== TransactionStatus.REJECTED;
    });
    if (reportTransactions.length === 0) {
      alert('এই মাসে কোন লেনদেন নেই।');
      return;
    }
    const headers = ["তারিখ", "নাম", "আইডি", "পদ্ধতি", "টাকা"];
    const rows = reportTransactions.map(t => [t.date, t.userName, t.transactionId.slice(-4), t.method, t.amount]);
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `UCF_Report_${reportMonth}_${reportYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDonorsCSV = () => {
    const approvedDonors = users.filter(u => u.status === UserStatus.APPROVED);
    if (approvedDonors.length === 0) return alert('দাতা নেই।');
    const headers = ["সদস্য আইডি", "নাম", "ফোন নম্বর", "মোট অনুদান", "পেশা", "ঠিকানা"];
    const rows = approvedDonors.map(u => [u.phone.slice(-4), u.name, u.phone, u.totalDonation, u.profession, `${u.address.village}, ${u.address.upazila}`]);
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Donor_Full_Report_${new Date().toLocaleDateString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadImage = async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, { backgroundColor: '#ffffff', cacheBust: true });
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('ছবিটি তৈরি করতে সমস্যা হয়েছে।');
    }
  };

  const handleDownloadExpensesCSV = () => {
    if (expenses.length === 0) return alert('ব্যয়ের তথ্য নেই।');
    const headers = ["তারিখ", "ব্যয়ের কারণ", "টাকার পরিমাণ"];
    const rows = expenses.map(e => [e.date, `"${e.reason.replace(/"/g, '""')}"`, e.amount]);
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Expense_Report_${new Date().toLocaleDateString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddDetailedExpense = async () => {
    const amount = parseFloat(expenseAmount);
    if (amount > 0 && expenseReason.trim() && !isSubmittingExpense) {
      setIsSubmittingExpense(true);
      try {
        await db.addDetailedExpense(amount, expenseReason, expenseImage || undefined);
        setExpenseAmount(''); setExpenseReason(''); setExpenseImage(null);
        alert('সফলভাবে সেভ করা হয়েছে।');
      } finally { setIsSubmittingExpense(false); }
    } else {
      alert('টাকা এবং কারণ দিন।');
    }
  };

  const handleDeleteExpense = async (id: string, amount: number) => {
    if (!confirm('আপনি কি এই খরচটি ডিলিট করতে চান?')) return;
    try {
      await db.deleteExpense(id, amount);
      alert('সফলভাবে ডিলিট করা হয়েছে।');
    } catch (e) { alert('ডিলিট করতে সমস্যা হয়েছে।'); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setExpenseImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleApproveUser = async (id: string) => {
    if (processingItems.has(id)) return;
    setProcessingItems(prev => new Set(prev).add(id));
    try { await db.updateUser(id, { status: UserStatus.APPROVED }); } finally {
      setProcessingItems(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleRejectUser = async (id: string) => {
    if (processingItems.has(id)) return;
    setProcessingItems(prev => new Set(prev).add(id));
    try { await db.updateUser(id, { status: UserStatus.REJECTED }); } finally {
      setProcessingItems(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleApproveTx = async (id: string) => {
    if (processingItems.has(id)) return;
    setProcessingItems(prev => new Set(prev).add(id));
    try { await db.approveTransaction(id); } finally {
      setProcessingItems(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleRejectTx = async (id: string) => {
    if (processingItems.has(id)) return;
    setProcessingItems(prev => new Set(prev).add(id));
    try { await db.rejectTransaction(id); } finally {
      setProcessingItems(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !adminMessage.trim() || isSendingMsg) return;
    setIsSendingMsg(true);
    try {
      await db.sendNotification(selectedUser.id, adminMessage);
      setAdminMessage('');
      alert('মেসেজ পাঠানো হয়েছে!');
    } finally { setIsSendingMsg(false); }
  };

  const handleAddManualTx = async () => {
    if (!selectedUser || !manualAmount || isAddingTx) return;
    setIsAddingTx(true);
    try {
      await db.addManualTransaction({
        userId: selectedUser.id,
        userName: selectedUser.name,
        amount: parseFloat(manualAmount),
        method: manualMethod,
        fundType: manualFund,
        transactionId: 'ADM-' + Date.now().toString().slice(-6),
        date: new Date().toISOString().split('T')[0]
      });
      setManualAmount('');
      setUserModalTab('history');
    } finally { setIsAddingTx(false); }
  };

  const formatLastActive = (ts?: number) => {
    if (!ts) return "কখনো না";
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "এইমাত্র সক্রিয়";
    if (mins < 60) return toBengaliNumber(mins) + " মিনিট আগে";
    const hours = Math.floor(mins / 60);
    if (hours < 24) return toBengaliNumber(hours) + " ঘণ্টা আগে";
    return new Date(ts).toLocaleDateString('bn-BD');
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.phone.slice(-4).includes(q);
  });

  const donorList = users.filter(u => u.status === UserStatus.APPROVED).filter(u => {
    const q = donorSearchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.phone.slice(-4).includes(q);
  }).sort((a, b) => b.totalDonation - a.totalDonation);

  const reportTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() + 1 === reportMonth && tDate.getFullYear() === reportYear && t.status !== TransactionStatus.REJECTED;
  });

  const monthlyTotal = reportTransactions.reduce((acc, t) => acc + (t.status === TransactionStatus.APPROVED ? t.amount : 0), 0);
  const netBalance = stats.totalCollection - stats.totalExpense;

  const years = [];
  for (let y = 2026; y <= Math.max(currentYear + 10, 2030); y++) years.push(y);

  const MONTHS_BN = [
    { id: 1, name: 'জানুয়ারি' }, { id: 2, name: 'ফেব্রুয়ারি' }, { id: 3, name: 'মার্চ' },
    { id: 4, name: 'এপ্রিল' }, { id: 5, name: 'মে' }, { id: 6, name: 'জুন' },
    { id: 7, name: 'জুলাই' }, { id: 8, name: 'আগস্ট' }, { id: 9, name: 'সেপ্টেম্বর' },
    { id: 10, name: 'অক্টোবর' }, { id: 11, name: 'নভেম্বর' }, { id: 12, name: 'ডিসেম্বর' }
  ];

  const userSpecificTxs = selectedUser ? transactions.filter(t => t.userId === selectedUser.id) : [];

  return (
    <div className="bg-[#F1F5F9] min-h-screen text-black font-['Hind_Siliguri'] pb-10 print:bg-white print:p-0">
      <header className="px-4 py-4 bg-white border-b border-slate-300 sticky top-0 z-50 flex justify-between items-center shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-600 rounded-xl"><LayoutDashboard className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-base font-black leading-none uppercase tracking-tighter">কন্ট্রোল প্যানেল</h1>
            <p className="text-[8px] text-teal-700 font-black uppercase tracking-widest mt-0.5">UCF ADMIN</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100 active:scale-90 transition-all"><LogOut className="w-5 h-5" /></button>
      </header>

      <div className="bg-white border-b border-slate-300 px-4 overflow-x-auto flex gap-4 scrollbar-hide print:hidden">
        {[
          { id: 'overview', label: 'ওভারভিউ', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'users', label: 'সদস্য', icon: <Users className="w-4 h-4" /> },
          { id: 'donors', label: 'দাতা রিপোর্ট', icon: <UserCheck className="w-4 h-4" /> },
          { id: 'txs', label: 'লেনদেন', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'expense', label: 'ব্যয়', icon: <TrendingDown className="w-4 h-4" /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-1 border-b-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-400'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <main className="p-4 max-w-4xl mx-auto space-y-6 print:p-0 print:max-w-none">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="মোট সদস্য" value={`${toBengaliNumber(stats.totalUsers)} জন`} icon={<Users className="w-4 h-4" />} color="text-blue-600" />
              <StatCard label="মোট কালেকশন" value={`৳${toBengaliNumber(stats.totalCollection.toLocaleString())}`} icon={<TrendingUp className="w-4 h-4" />} color="text-green-600" />
              <StatCard label="মোট ব্যয়" value={`৳${toBengaliNumber(stats.totalExpense.toLocaleString())}`} icon={<TrendingDown className="w-4 h-4" />} color="text-rose-600" />
              <div className="bg-teal-600 p-4 rounded-2xl text-white shadow-md flex flex-col justify-between">
                 <p className="text-[8px] font-black uppercase tracking-widest opacity-80">বর্তমান ফান্ড</p>
                 <h3 className="text-lg font-black mt-1">৳{toBengaliNumber(netBalance.toLocaleString())}</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <SectionBox title="মেম্বার আবেদন" count={users.filter(u=>u.status===UserStatus.PENDING).length} color="bg-teal-600">
                  {users.filter(u=>u.status===UserStatus.PENDING).map(u => (
                    <div key={u.id} className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                      <div onClick={() => { setSelectedUserId(u.id); setUserModalTab('info'); }} className="flex items-center gap-2 cursor-pointer">
                        <img src={u.profilePic} className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <p className="text-[10px] font-black text-black leading-none mb-1">{u.name}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">ID: {toBengaliNumber(u.phone.slice(-4))}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleApproveUser(u.id)} className="p-1.5 bg-green-600 text-white rounded-lg active:scale-90"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleRejectUser(u.id)} className="p-1.5 bg-white text-red-600 border border-red-100 rounded-lg active:scale-90"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
               </SectionBox>

               <SectionBox title="পেমেন্ট রিকোয়েস্ট" count={transactions.filter(t=>t.status===TransactionStatus.PENDING).length} color="bg-orange-500">
                  {transactions.filter(t=>t.status===TransactionStatus.PENDING).map(t => (
                    <div key={t.id} className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-black text-black leading-none mb-1">{t.userName}</p>
                        <p className="text-[9px] font-black text-orange-700 uppercase">৳{toBengaliNumber(t.amount)} <span className="text-slate-400 font-bold">• {t.method}</span></p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleApproveTx(t.id)} className="p-1.5 bg-green-600 text-white rounded-lg active:scale-90"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleRejectTx(t.id)} className="p-1.5 bg-white text-red-600 border border-red-100 rounded-lg active:scale-90"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
               </SectionBox>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex items-center gap-2">
               <Search className="w-4 h-4 text-slate-400" />
               <input type="text" placeholder="নাম বা ৪ ডিজিটের আইডি দিয়ে খুঁজুন..." className="w-full text-xs font-black outline-none bg-transparent" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="bg-white rounded-xl border border-slate-300 overflow-hidden">
               <table className="w-full text-left text-[11px]">
                 <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50" onClick={() => { setSelectedUserId(u.id); setUserModalTab('info'); }}>
                        <td className="px-4 py-2 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <img src={u.profilePic} className="w-7 h-7 rounded-lg object-cover" />
                            <div><p className="font-black text-black leading-tight">{u.name}</p><p className="text-[9px] text-slate-400 uppercase">ID: {toBengaliNumber(u.phone.slice(-4))}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                           <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                              <button onClick={() => { setSelectedUserId(u.id); setUserModalTab('message'); }} className="p-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100"><MessageCircle className="w-3.5 h-3.5" /></button>
                              <button onClick={() => { setSelectedUserId(u.id); setUserModalTab('add'); }} className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-100"><Plus className="w-3.5 h-3.5" /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'donors' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-300 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-2 flex-grow max-w-md">
                   <div className="bg-slate-50 border border-slate-300 rounded-2xl flex items-center px-4 w-full">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="দাতা খুঁজুন..." className="w-full p-3 text-xs font-black bg-transparent outline-none" value={donorSearchQuery} onChange={e => setDonorSearchQuery(e.target.value)} />
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => handleDownloadImage(donorReportRef, `Donor_Full_Report_${new Date().toLocaleDateString()}`)} className="px-4 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-md">
                      <ImageIcon className="w-4 h-4" /> ইমেজ
                   </button>
                   <button onClick={handleDownloadDonorsCSV} className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2">
                      <Download className="w-4 h-4" /> এক্সেল
                   </button>
                </div>
             </div>
             <div ref={donorReportRef} className="bg-white rounded-[2.5rem] border-2 border-slate-200 overflow-hidden shadow-xl print:border-0 print:shadow-none">
                <div className="p-6 bg-teal-800 text-white flex justify-between items-center">
                   <div>
                      <h3 className="text-[14px] font-black uppercase tracking-widest leading-none">অনুদানকারীদের পূর্ণাঙ্গ রিপোর্ট</h3>
                      <p className="text-[10px] text-teal-300 font-bold uppercase mt-2 tracking-widest">Unity Care Foundation</p>
                   </div>
                   <div className="text-right"><UserCircle className="w-8 h-8 text-teal-300" /></div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-[11px]">
                     <thead className="bg-slate-50 border-b-2 border-slate-100">
                        <tr>
                           <th className="px-6 py-4 font-black uppercase text-slate-500 text-[10px]">সদস্য</th>
                           <th className="px-6 py-4 font-black uppercase text-slate-500 text-[10px]">মোবাইল নম্বর</th>
                           <th className="px-6 py-4 font-black uppercase text-slate-500 text-[10px] text-right">মোট অনুদান</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {donorList.map((donor) => (
                         <tr key={donor.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                 <img src={donor.profilePic} className="w-10 h-10 rounded-xl object-cover border border-slate-200" alt={donor.name} />
                                 <div>
                                    <p className="font-black text-slate-900 leading-none mb-1">{donor.name}</p>
                                    <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest">আইডি: {toBengaliNumber(donor.phone.slice(-4))}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-3 font-black text-slate-600 premium-text">{toBengaliNumber(donor.phone)}</td>
                           <td className="px-6 py-3 text-right font-black text-teal-700 text-[15px] premium-text">৳{toBengaliNumber(donor.totalDonation.toLocaleString())}</td>
                         </tr>
                       ))}
                     </tbody>
                     <tfoot className="bg-slate-900 text-white">
                        <tr>
                           <td colSpan={2} className="px-6 py-5 text-right font-black uppercase text-[10px] tracking-[0.2em]">মোট কালেকশন</td>
                           <td className="px-6 py-5 text-right font-black text-teal-400 text-xl">৳{toBengaliNumber(stats.totalCollection.toLocaleString())}</td>
                        </tr>
                     </tfoot>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'txs' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-300 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-2 flex-wrap">
                   <select className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl font-black text-xs outline-none" value={reportMonth} onChange={e => setReportMonth(parseInt(e.target.value))}>
                      {MONTHS_BN.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                   <select className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl font-black text-xs outline-none" value={reportYear} onChange={e => setReportYear(parseInt(e.target.value))}>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                   </select>
                </div>
                <div className="flex flex-wrap gap-2">
                   <button onClick={() => handleDownloadImage(txReportRef, `Transaction_Report_${reportMonth}_${reportYear}`)} className="px-4 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-md"><ImageIcon className="w-4 h-4" /> ইমেজ</button>
                   <button onClick={handleDownloadCSV} className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2"><Download className="w-4 h-4" /> এক্সেল</button>
                   <button onClick={handlePrint} className="px-4 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-md"><Printer className="w-4 h-4" /> প্রিন্ট</button>
                </div>
             </div>
             <div ref={txReportRef} className="bg-white rounded-[2.5rem] border-2 border-slate-200 overflow-hidden shadow-xl print:border-0 print:shadow-none">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center print:bg-white print:text-black">
                   <div>
                      <h3 className="text-[13px] font-black uppercase tracking-widest leading-none">লেনদেন রিপোর্ট: {MONTHS_BN.find(m=>m.id===reportMonth)?.name} {reportYear}</h3>
                      <p className="text-[9px] text-teal-400 font-bold uppercase mt-1.5 tracking-widest">Unity Care Foundation</p>
                   </div>
                   <div className="text-right"><DollarSign className="w-6 h-6 text-teal-400" /></div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-[11px]">
                     <thead className="bg-slate-50 border-b-2 border-slate-100">
                        <tr>
                           <th className="px-6 py-2.5 font-black uppercase text-slate-500">তারিখ</th>
                           <th className="px-6 py-2.5 font-black uppercase text-slate-500">নাম ও আইডি</th>
                           <th className="px-6 py-2.5 font-black uppercase text-slate-500 text-right">টাকা</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {reportTransactions.map(t => (
                         <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-1.5 font-black text-black">{toBengaliNumber(t.date)}</td>
                           <td className="px-6 py-1.5"><span className="font-black text-black block leading-none mb-0.5">{t.userName}</span><span className="text-teal-600 block text-[8px] font-black uppercase tracking-widest">ID: {toBengaliNumber(t.transactionId.slice(-4))}</span></td>
                           <td className="px-6 py-1.5 text-right font-black text-black">৳{toBengaliNumber(t.amount)}</td>
                         </tr>
                       ))}
                     </tbody>
                     <tfoot className="bg-white border-t-2 border-slate-900">
                        <tr>
                           <td colSpan={2} className="px-6 py-5 text-right font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">সর্বমোট সফল দান</td>
                           <td className="px-6 py-5 text-right font-black text-teal-700 text-xl">৳{toBengaliNumber(monthlyTotal.toLocaleString())}</td>
                        </tr>
                     </tfoot>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'expense' && (
          <div className="space-y-6 animate-in zoom-in-95">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-300 space-y-4 print:hidden">
                <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-5 h-5 text-rose-600" /><h3 className="text-sm font-black text-black uppercase tracking-tight">নতুন ব্যয় যোগ করুন</h3></div>
                <div className="grid grid-cols-1 gap-4">
                   <input type="number" placeholder="৳ ০.০০" className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-teal-600 text-2xl font-black text-black" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} />
                   <textarea rows={2} placeholder="ব্যয়ের কারণ..." className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-teal-600 text-xs font-bold text-black" value={expenseReason} onChange={e => setExpenseReason(e.target.value)} />
                   <div className="flex gap-2">
                      <label className="flex-1 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-100">
                         {expenseImage ? <Check className="w-4 h-4 text-green-600" /> : <Camera className="w-4 h-4 text-slate-400" />}
                         <span className="text-[9px] font-black text-slate-500 uppercase ml-2">{expenseImage ? 'ছবি আপলোড হয়েছে' : 'ছবি যোগ করুন'}</span>
                         <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                      <button onClick={handleAddDetailedExpense} disabled={isSubmittingExpense} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-black text-xs active:scale-95 disabled:opacity-50 transition-all shadow-lg">সাবমিট করুন</button>
                   </div>
                </div>
             </div>
             <div ref={expenseReportRef} className="bg-white rounded-[2.5rem] border-2 border-slate-200 overflow-hidden shadow-xl">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                   <div>
                      <h3 className="text-[13px] font-black uppercase tracking-widest leading-none">ব্যয় রিপোর্ট তালিকা</h3>
                      <p className="text-[9px] text-rose-400 font-bold uppercase mt-1.5 tracking-widest">Unity Care Foundation</p>
                   </div>
                   <TrendingDown className="w-6 h-6 text-rose-400" />
                </div>
                <table className="w-full text-left text-[11px]">
                   <thead className="bg-slate-50 border-b-2 border-slate-100">
                      <tr><th className="px-5 py-2 font-black text-slate-500 uppercase text-[10px]">তারিখ/টাকা</th><th className="px-5 py-2 font-black text-slate-500 uppercase text-[10px]">ব্যয়ের কারণ</th><th className="px-5 py-2 font-black text-slate-500 uppercase text-center text-[10px] no-export print:hidden">অ্যাকশন</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {expenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-5 py-1.5 font-black"><span className="text-rose-600 block text-[13px] leading-none mb-0.5">৳{toBengaliNumber(exp.amount.toLocaleString())}</span><span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{toBengaliNumber(exp.date)}</span></td>
                           <td className="px-5 py-1.5 text-[10px] font-black text-black leading-tight max-w-[220px]">{exp.reason}</td>
                           <td className="px-5 py-1.5 text-center no-export print:hidden"><button onClick={() => handleDeleteExpense(exp.id, exp.amount)} className="p-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100 active:scale-90 transition-all"><Trash2 className="w-3.5 h-3.5" /></button></td>
                        </tr>
                      ))}
                   </tbody>
                   <tfoot className="bg-slate-50">
                      <tr><td colSpan={2} className="px-5 py-5 text-right font-black uppercase text-[10px] tracking-[0.2em] text-slate-900">অবশিষ্ট ফান্ড</td><td className="px-5 py-5 text-right font-black text-blue-700 text-[18px]">৳{toBengaliNumber(netBalance.toLocaleString())}</td></tr>
                   </tfoot>
                </table>
             </div>
          </div>
        )}
      </main>

      {/* User Digital ID Card Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:hidden animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border-4 border-white">
            
            {/* Modal Header Tab Bar */}
            <div className="flex bg-slate-100 p-2 gap-1 overflow-x-auto scrollbar-hide border-b border-slate-200">
               {[
                 { id: 'info', label: 'আইডি কার্ড', icon: <Users className="w-3.5 h-3.5" /> },
                 { id: 'history', label: 'দান তালিকা', icon: <History className="w-3.5 h-3.5" /> },
                 { id: 'add', label: 'দান যোগ', icon: <Plus className="w-3.5 h-3.5" /> },
                 { id: 'message', label: 'মেসেজ', icon: <MessageCircle className="w-3.5 h-3.5" /> },
                 { id: 'settings', label: 'সেটিংস', icon: <Trash2 className="w-3.5 h-3.5" /> }
               ].map(tab => (
                 <button key={tab.id} onClick={() => setUserModalTab(tab.id as any)} className={`px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border-2 ${userModalTab === tab.id ? 'bg-teal-600 text-white border-teal-700 shadow-md scale-105' : 'bg-white text-slate-400 border-slate-200 hover:border-teal-200'}`}>
                   {tab.icon} {tab.label}
                 </button>
               ))}
            </div>

            <div className="flex-grow overflow-y-auto bg-white relative">
               {userModalTab === 'info' && (
                 <div className="animate-in slide-in-from-bottom duration-500">
                    {/* The Digital ID Card Layer */}
                    <div className="p-6">
                       <div className="bg-gradient-to-br from-slate-50 to-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl relative overflow-hidden">
                          {/* Design Accents */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/5 rounded-full -ml-12 -mb-12"></div>
                          
                          {/* Card Header */}
                          <div className="p-5 bg-teal-600 flex justify-between items-center text-white">
                             <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-teal-200" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Unity Care Foundation</h3>
                             </div>
                             <div className="px-3 py-1 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-tighter">Official Member</div>
                          </div>

                          {/* Card Body */}
                          <div className="p-6">
                             <div className="flex flex-col items-center mb-6">
                                <div className="relative group">
                                   <div className="absolute inset-0 bg-teal-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                   <img src={selectedUser.profilePic} className="w-28 h-28 rounded-[2rem] object-cover border-4 border-white shadow-xl relative z-10" alt={selectedUser.name} />
                                   <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-lg z-20 border border-slate-100">
                                      <BadgeCheck className="w-6 h-6 text-teal-600" />
                                   </div>
                                </div>
                                <h2 className="text-xl font-black text-slate-900 mt-4 leading-none">{selectedUser.name}</h2>
                                <p className="text-[10px] font-black text-teal-700 uppercase tracking-[0.2em] mt-2">সদস্য আইডি: {toBengaliNumber(selectedUser.phone.slice(-4))}</p>
                             </div>

                             <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                                   <Droplet className="w-4 h-4 text-rose-500 mb-1" />
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">রক্তের গ্রুপ</p>
                                   <p className="text-sm font-black text-slate-900">{selectedUser.bloodGroup}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                                   <Calendar className="w-4 h-4 text-blue-500 mb-1" />
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">জন্ম সাল</p>
                                   <p className="text-sm font-black text-slate-900">{toBengaliNumber(selectedUser.birthYear)}</p>
                                </div>
                             </div>

                             <div className="space-y-3">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                   <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                                   <div>
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ঠিকানা</p>
                                      <p className="text-[11px] font-black text-slate-800 leading-tight">{selectedUser.address.village}, {selectedUser.address.upazila}, {selectedUser.address.district}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                   <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                                   <div>
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ফোন নম্বর</p>
                                      <p className="text-[11px] font-black text-slate-800 leading-tight">{toBengaliNumber(selectedUser.phone)}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                   <Clock className="w-5 h-5 text-teal-500 shrink-0" />
                                   <div>
                                      <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest">সর্বশেষ সক্রিয় (Live)</p>
                                      <p className="text-[11px] font-black text-teal-900 leading-tight">{formatLastActive(selectedUser.lastActive)}</p>
                                   </div>
                                </div>
                             </div>

                             {/* Live Total Donation - Highlighted with Layering */}
                             <div className="mt-6 p-5 bg-teal-600 rounded-3xl border-b-4 border-teal-800 shadow-xl relative overflow-hidden flex justify-between items-center group">
                                <div className="absolute top-0 left-0 w-full h-full bg-white/5 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                <div>
                                   <p className="text-[9px] font-black text-teal-100 uppercase tracking-[0.2em] mb-1">সর্বমোট অনুদান</p>
                                   <h3 className="text-2xl font-black text-white premium-text">৳{toBengaliNumber(selectedUser.totalDonation.toLocaleString())}</h3>
                                </div>
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                   <Wallet className="w-6 h-6 text-white" />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {userModalTab === 'history' && (
                 <div className="p-6 space-y-4 animate-in fade-in">
                    <div className="p-4 bg-slate-900 text-white rounded-3xl flex justify-between items-center shadow-lg">
                       <div><p className="text-[9px] font-black text-teal-400 uppercase tracking-widest leading-none">মোট সফল দান</p><p className="text-xl font-black mt-1">৳{toBengaliNumber(selectedUser.totalDonation.toLocaleString())}</p></div>
                       <History className="w-6 h-6 text-teal-400 opacity-50" />
                    </div>
                    <div className="space-y-3">
                      {userSpecificTxs.map(tx => (
                        <div key={tx.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center group hover:bg-white hover:border-teal-200 transition-all">
                           <div>
                             <p className="text-[10px] font-black text-slate-800 italic">{tx.method} • {tx.fundType}</p>
                             <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">{toBengaliNumber(tx.date)}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-base font-black text-slate-900 premium-text">৳{toBengaliNumber(tx.amount)}</p>
                             <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest inline-block mt-1 ${
                               tx.status === TransactionStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                               tx.status === TransactionStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                             }`}>
                               {tx.status === TransactionStatus.APPROVED ? 'সফল' : tx.status === TransactionStatus.REJECTED ? 'বাতিল' : 'পেন্ডিং'}
                             </span>
                           </div>
                        </div>
                      ))}
                      {userSpecificTxs.length === 0 && <div className="py-20 text-center opacity-20"><Hash className="w-12 h-12 mx-auto mb-2"/><p className="text-[10px] font-black uppercase tracking-widest">লেনদেন নেই</p></div>}
                    </div>
                 </div>
               )}

               {userModalTab === 'add' && (
                 <div className="p-8 space-y-6 text-center animate-in zoom-in-95">
                    <div className="p-5 bg-teal-50 rounded-3xl border-2 border-dashed border-teal-200">
                       <p className="text-[10px] font-black uppercase text-teal-600 tracking-widest mb-4">অ্যাপ্রুভড অনুদান যোগ করুন (৳)</p>
                       <input type="number" className="w-full p-4 bg-white border border-teal-100 rounded-2xl text-4xl font-black outline-none focus:ring-4 focus:ring-teal-500/10 transition-all text-center text-teal-700 shadow-inner" placeholder="০.০০" value={manualAmount} onChange={e => setManualAmount(e.target.value)} />
                    </div>
                    <button onClick={handleAddManualTx} disabled={isAddingTx} className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black text-sm uppercase active:scale-95 transition-all shadow-xl shadow-teal-100 flex items-center justify-center gap-3">
                       {isAddingTx ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> ফাণ্ডে টাকা যোগ করুন</>}
                    </button>
                    <p className="text-[9px] font-bold text-slate-400 italic">"এটি যোগ করার সাথে সাথে মেম্বারের মোট ডোনেশন ও মেইন কালেকশন আপডেট হয়ে যাবে।"</p>
                 </div>
               )}

               {userModalTab === 'message' && (
                 <div className="p-8 space-y-4 animate-in fade-in">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">মেসেজ লিখুন (In-App Notification)</p>
                    <textarea rows={4} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-blue-500 font-bold text-xs text-black shadow-inner" placeholder="ইউজারকে বিশেষ কোনো বার্তা দিন..." value={adminMessage} onChange={e => setAdminMessage(e.target.value)} />
                    <button onClick={handleSendMessage} disabled={isSendingMsg} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"><Send className="w-4 h-4" /> মেসেজ পাঠান</button>
                 </div>
               )}

               {userModalTab === 'settings' && (
                 <div className="p-8 space-y-8 animate-in fade-in text-center">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm border border-rose-100 animate-bounce">
                       <AlertTriangle className="w-10 h-10" />
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-slate-900 mb-2">ডেঞ্জার জোন</h3>
                       <p className="text-xs font-bold text-slate-500 leading-relaxed px-4">এই মেম্বারকে ডিলিট করলে তার সকল ব্যক্তিগত তথ্য এবং সংগঠনের ফান্ড থেকে তার করা অনুদান চিরতরে মুছে যাবে। এটি পুনরায় ফিরে পাওয়া সম্ভব নয়।</p>
                    </div>
                    <button 
                      onClick={handleDeleteUser}
                      disabled={isDeletingUser}
                      className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black text-sm uppercase flex items-center justify-center gap-2 shadow-xl shadow-rose-100 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isDeletingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Trash2 className="w-5 h-5" /> মেম্বার চিরতরে মুছুন</>}
                    </button>
                 </div>
               )}
            </div>

            {/* Bottom Approval Footer - Only for PENDING users */}
            {selectedUser.status === UserStatus.PENDING && (
              <div className="p-6 bg-slate-100 border-t border-slate-200 flex gap-4">
                 <button onClick={() => handleApproveUser(selectedUser.id)} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-green-100 border-b-4 border-green-800">অনুমোদন করুন</button>
                 <button onClick={() => handleRejectUser(selectedUser.id)} className="flex-1 py-4 bg-white text-red-600 border-2 border-red-200 rounded-2xl font-black text-sm active:scale-95 transition-all">বাতিল করুন</button>
              </div>
            )}

            {/* Close Button Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
               <button onClick={() => setSelectedUserId(null)} className="px-10 py-2.5 bg-slate-200 text-slate-600 rounded-full font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          header, footer, .scrollbar-hide, button, .no-export { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .animate-in { animation: none !important; }
          .shadow-xl, .shadow-md, .shadow-sm { box-shadow: none !important; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <div className="bg-white p-3 rounded-2xl border border-slate-300 shadow-sm flex flex-col justify-between h-24 print:hidden">
    <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 ${color}`}>{icon}</div>
    <div className="mt-2">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
      <h3 className="text-sm font-black text-black mt-1 leading-none">{value}</h3>
    </div>
  </div>
);

const SectionBox = ({ title, count, children, color }: { title: string, count: number, children?: React.ReactNode, color: string }) => {
  const toBengaliNumber = (num: number | string) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-sm flex flex-col print:hidden">
      <div className={`p-2.5 ${color} text-white flex justify-between items-center`}>
        <h4 className="text-[9px] font-black uppercase tracking-widest">{title}</h4>
        <span className="text-[8px] font-black bg-black/20 px-1.5 py-0.5 rounded-full">{toBengaliNumber(count)}</span>
      </div>
      <div className="p-2 space-y-1.5 overflow-y-auto max-h-[250px]">{children}</div>
    </div>
  );
};

export default AdminDashboard;
