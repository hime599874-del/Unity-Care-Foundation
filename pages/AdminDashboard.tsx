
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { User, Transaction, UserStatus, TransactionStatus, AppStats, FundType, Expense } from '../types';
import { toPng } from 'html-to-image';
import { 
  Users, DollarSign, Check, X, Trash2, LayoutDashboard, 
  TrendingUp, TrendingDown, Bell, Search, 
  Calendar, LogOut, Plus, History, 
  MessageCircle, Send, Wallet, Camera, FileText, Hash, Printer, Download, ImageIcon,
  UserCheck, UserCircle, AlertTriangle, Loader2
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

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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

  const handleLogout = () => {
    setIsAdmin(false);
    navigate('/');
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || isDeletingUser) return;
    
    const confirmDelete = confirm(`${selectedUser.name}-কে ডিলিট করলে তার সকল ব্যক্তিগত তথ্য এবং সংগঠনের ফান্ড থেকে তার করা অনুদান চিরতরে মুছে যাবে। আপনি কি নিশ্চিত?`);
    if (!confirmDelete) return;

    setIsDeletingUser(true);
    try {
      await db.deleteUser(selectedUser.id);
      setSelectedUser(null);
      alert('সদস্যকে সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (err) {
      alert('মুছে ফেলতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
    const rows = reportTransactions.map(t => [
      t.date,
      t.userName,
      t.transactionId.slice(-4),
      t.method,
      t.amount
    ]);

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
    if (approvedDonors.length === 0) {
      alert('ডাউনলোড করার জন্য কোনো দাতা নেই।');
      return;
    }

    const headers = ["সদস্য আইডি", "নাম", "ফোন নম্বর", "মোট অনুদান", "পেশা", "ঠিকানা"];
    const rows = approvedDonors.map(u => [
      u.phone.slice(-4),
      u.name,
      u.phone,
      u.totalDonation,
      u.profession,
      `${u.address.village}, ${u.address.upazila}`
    ]);

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
      const options = {
        backgroundColor: '#ffffff',
        cacheBust: true,
        fontEmbedCSS: '',
        style: {
          fontFamily: 'Hind Siliguri, sans-serif'
        },
        filter: (node: HTMLElement) => {
          const exclusionClasses = ['no-export'];
          return !exclusionClasses.some(cls => node.classList?.contains(cls));
        }
      };
      
      const dataUrl = await toPng(ref.current, options);
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Image Export Error:', err);
      alert('ছবিটি তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    }
  };

  const handleDownloadExpensesCSV = () => {
    if (expenses.length === 0) {
      alert('ডাউনলোড করার জন্য কোন ব্যয়ের তথ্য নেই।');
      return;
    }
    const headers = ["তারিখ", "ব্যয়ের কারণ", "টাকার পরিমাণ"];
    const rows = expenses.map(e => [
      e.date,
      `"${e.reason.replace(/"/g, '""')}"`,
      e.amount
    ]);
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
        setExpenseAmount('');
        setExpenseReason('');
        setExpenseImage(null);
        alert('সফলভাবে সেভ করা হয়েছে।');
      } catch (e: any) {
        console.error("Expense submit error");
      } finally {
        setIsSubmittingExpense(false);
      }
    } else {
      alert('টাকা এবং কারণ দিন।');
    }
  };

  const handleDeleteExpense = async (id: string, amount: number) => {
    if (!confirm('আপনি কি এই খরচটি ডিলিট করতে চান?')) return;
    try {
      await db.deleteExpense(id, amount);
      alert('সফলভাবে ডিলিট করা হয়েছে।');
    } catch (e: any) {
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
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
        transactionId: 'ADMIN-' + Date.now().toString().slice(-6),
        date: new Date().toISOString().split('T')[0]
      });
      setManualAmount('');
      setUserModalTab('history');
    } finally { setIsAddingTx(false); }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const memberId = u.phone.slice(-4);
    return (
      u.name.toLowerCase().includes(q) || 
      u.phone.includes(q) || 
      memberId.includes(q)
    );
  });

  const donorList = users.filter(u => u.status === UserStatus.APPROVED).filter(u => {
    const q = donorSearchQuery.toLowerCase();
    const memberId = u.phone.slice(-4);
    return u.name.toLowerCase().includes(q) || u.phone.includes(q) || memberId.includes(q);
  }).sort((a, b) => b.totalDonation - a.totalDonation);

  const reportTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() + 1 === reportMonth && tDate.getFullYear() === reportYear && t.status !== TransactionStatus.REJECTED;
  });

  const monthlyTotal = reportTransactions.reduce((acc, t) => acc + (t.status === TransactionStatus.APPROVED ? t.amount : 0), 0);
  const netBalance = stats.totalCollection - stats.totalExpense;

  const years = [];
  for (let y = 2026; y <= Math.max(currentYear + 10, 2030); y++) { years.push(y); }

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
        <button onClick={handleLogout} className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100"><LogOut className="w-5 h-5" /></button>
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
                      <div onClick={() => { setSelectedUser(u); setUserModalTab('info'); }} className="flex items-center gap-2 cursor-pointer">
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
                      <tr key={u.id} className="hover:bg-slate-50" onClick={() => { setSelectedUser(u); setUserModalTab('info'); }}>
                        <td className="px-4 py-2 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <img src={u.profilePic} className="w-7 h-7 rounded-lg object-cover" />
                            <div><p className="font-black text-black leading-tight">{u.name}</p><p className="text-[9px] text-slate-400 uppercase">ID: {toBengaliNumber(u.phone.slice(-4))}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                           <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                              <button onClick={() => { setSelectedUser(u); setUserModalTab('message'); }} className="p-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100"><MessageCircle className="w-3.5 h-3.5" /></button>
                              <button onClick={() => { setSelectedUser(u); setUserModalTab('add'); }} className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-100"><Plus className="w-3.5 h-3.5" /></button>
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
                   <div className="text-right">
                      <UserCircle className="w-8 h-8 text-teal-300" />
                   </div>
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
                           <td className="px-6 py-3">
                              <p className="font-black text-slate-600 premium-text">{toBengaliNumber(donor.phone)}</p>
                           </td>
                           <td className="px-6 py-3 text-right">
                              <p className="font-black text-teal-700 text-[15px] premium-text">৳{toBengaliNumber(donor.totalDonation.toLocaleString())}</p>
                           </td>
                         </tr>
                       ))}
                       {donorList.length === 0 && (
                         <tr>
                           <td colSpan={3} className="py-20 text-center">
                              <Users className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">কোন দাতা খুঁজে পাওয়া যায়নি</p>
                           </td>
                         </tr>
                       )}
                     </tbody>
                     <tfoot className="bg-slate-900 text-white">
                        <tr>
                           <td colSpan={2} className="px-6 py-5 text-right font-black uppercase text-[10px] tracking-[0.2em]">মোট সংরক্ষিত ফান্ড</td>
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
                   <button onClick={() => handleDownloadImage(txReportRef, `Transaction_Report_${reportMonth}_${reportYear}`)} className="px-4 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-indigo-700 shadow-md">
                      <ImageIcon className="w-4 h-4" /> ইমেজ
                   </button>
                   <button onClick={handleDownloadCSV} className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-slate-200">
                      <Download className="w-4 h-4" /> এক্সেল
                   </button>
                   <button onClick={handlePrint} className="px-4 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-teal-700 shadow-md">
                      <Printer className="w-4 h-4" /> প্রিন্ট
                   </button>
                </div>
             </div>

             <div ref={txReportRef} className="bg-white rounded-[2.5rem] border-2 border-slate-200 overflow-hidden shadow-xl print:border-0 print:shadow-none print:rounded-none">
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
                           <th className="px-6 py-2.5 font-black uppercase text-slate-500">পদ্ধতি</th>
                           <th className="px-6 py-2.5 font-black uppercase text-slate-500 text-right">টাকা</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {reportTransactions.map(t => (
                         <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-1.5 font-black text-black">{toBengaliNumber(t.date)}</td>
                           <td className="px-6 py-1.5">
                              <span className="font-black text-black block leading-none mb-0.5">{t.userName}</span>
                              <span className="text-teal-600 block text-[8px] font-black uppercase tracking-widest">ID: {toBengaliNumber(t.transactionId.slice(-4))}</span>
                           </td>
                           <td className="px-6 py-1.5 font-bold text-slate-600">{t.method}</td>
                           <td className="px-6 py-1.5 text-right font-black text-black">৳{toBengaliNumber(t.amount)}</td>
                         </tr>
                       ))}
                       {reportTransactions.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black text-xs uppercase tracking-widest">লেনদেন নেই</td></tr>}
                     </tbody>
                     {reportTransactions.length > 0 && (
                       <tfoot className="bg-white border-t-2 border-slate-900">
                          <tr>
                             <td colSpan={3} className="px-6 py-5 text-right font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">সর্বমোট সফল দান</td>
                             <td className="px-6 py-5 text-right font-black text-teal-700 text-xl">৳{toBengaliNumber(monthlyTotal.toLocaleString())}</td>
                          </tr>
                       </tfoot>
                     )}
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'expense' && (
          <div className="space-y-6 animate-in zoom-in-95">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-300 space-y-4 print:hidden">
                <div className="flex items-center gap-2 mb-2">
                   <TrendingDown className="w-5 h-5 text-rose-600" />
                   <h3 className="text-sm font-black text-black uppercase tracking-tight">নতুন ব্যয় যোগ করুন</h3>
                </div>
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

             <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 overflow-hidden shadow-xl">
                <div className="p-4 bg-rose-600 text-white flex justify-between items-center print:hidden">
                   <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-white" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">ব্যয় রিপোর্ট তালিকা</h3>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => handleDownloadImage(expenseReportRef, `Expense_Report_${new Date().toLocaleDateString()}`)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
                         <ImageIcon className="w-3 h-3" /> ইমেজ
                      </button>
                      <button onClick={handleDownloadExpensesCSV} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all">
                         <Download className="w-3 h-3" /> এক্সেল
                      </button>
                   </div>
                </div>
                
                <div ref={expenseReportRef} className="bg-white">
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                     <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest leading-none">ব্যয় রিপোর্ট তালিকা</h3>
                        <p className="text-[9px] text-rose-400 font-bold uppercase mt-1.5 tracking-widest">Unity Care Foundation</p>
                     </div>
                     <TrendingDown className="w-6 h-6 text-rose-400" />
                  </div>

                  <table className="w-full text-left text-[11px]">
                     <thead className="bg-slate-50 border-b-2 border-slate-100">
                        <tr>
                           <th className="px-5 py-2 font-black text-slate-500 uppercase text-[10px]">তারিখ/টাকা</th>
                           <th className="px-5 py-2 font-black text-slate-500 uppercase text-[10px]">ব্যয়ের কারণ</th>
                           <th className="px-5 py-2 font-black text-slate-500 uppercase text-center text-[10px] no-export print:hidden">অ্যাকশন</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-5 py-1.5 font-black">
                                <span className="text-rose-600 block text-[13px] leading-none mb-0.5">৳{toBengaliNumber(exp.amount.toLocaleString())}</span>
                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{toBengaliNumber(exp.date)}</span>
                             </td>
                             <td className="px-5 py-1.5 text-[10px] font-black text-black leading-tight max-w-[220px]">{exp.reason}</td>
                             <td className="px-5 py-1.5 text-center no-export print:hidden">
                                <button onClick={() => handleDeleteExpense(exp.id, exp.amount)} className="p-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100 active:scale-90 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                             </td>
                          </tr>
                        ))}
                        {expenses.length === 0 && <tr><td colSpan={3} className="p-20 text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest">ব্যয়ের তথ্য নেই</td></tr>}
                     </tbody>
                     {expenses.length > 0 && (
                       <tfoot className="bg-white border-t-2 border-slate-900">
                          <tr className="border-b border-slate-100">
                             <td colSpan={2} className="px-5 py-3 text-right font-black uppercase text-[10px] text-slate-400 tracking-wider">মোট সংগ্রহ (Total Collection)</td>
                             <td className="px-5 py-3 text-right font-black text-teal-700 text-[13px]">৳{toBengaliNumber(stats.totalCollection.toLocaleString())}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                             <td colSpan={2} className="px-5 py-3 text-right font-black uppercase text-[10px] text-slate-400 tracking-wider">মোট ব্যয় (Total Expense)</td>
                             <td className="px-5 py-3 text-right font-black text-rose-600 text-[13px]">৳{toBengaliNumber(stats.totalExpense.toLocaleString())}</td>
                          </tr>
                          <tr className="bg-slate-50">
                             <td colSpan={2} className="px-5 py-5 text-right font-black uppercase text-[10px] tracking-[0.2em] text-slate-900">অবশিষ্ট ফান্ড (Net Balance)</td>
                             <td className="px-5 py-5 text-right font-black text-blue-700 text-[18px]">৳{toBengaliNumber(netBalance.toLocaleString())}</td>
                          </tr>
                       </tfoot>
                     )}
                  </table>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 border-2 border-slate-300">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <img src={selectedUser.profilePic} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-md" />
                 <div><h2 className="text-sm font-black text-black leading-none">{selectedUser.name}</h2><p className="text-[9px] text-teal-700 font-black uppercase mt-1 tracking-widest">ID: {toBengaliNumber(selectedUser.phone.slice(-4))}</p></div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-white text-slate-400 rounded-xl border border-slate-200 active:scale-95 transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex bg-slate-50 px-4 py-1.5 border-b border-slate-200 gap-1.5 overflow-x-auto scrollbar-hide">
               {[
                 { id: 'info', label: 'প্রোফাইল', icon: <Users className="w-3 h-3" /> },
                 { id: 'history', label: 'দান', icon: <History className="w-3 h-3" /> },
                 { id: 'add', label: 'দান যোগ', icon: <Plus className="w-3 h-3" /> },
                 { id: 'message', label: 'মেসেজ', icon: <MessageCircle className="w-3 h-3" /> },
                 { id: 'settings', label: 'সেটিংস', icon: <Trash2 className="w-3 h-3" /> }
               ].map(tab => (
                 <button key={tab.id} onClick={() => setUserModalTab(tab.id as any)} className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1 border ${userModalTab === tab.id ? 'bg-teal-600 text-white border-teal-700 shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}>
                   {tab.icon} {tab.label}
                 </button>
               ))}
            </div>
            <div className="flex-grow p-4 overflow-y-auto bg-white">
               {userModalTab === 'settings' && (
                 <div className="space-y-6 animate-in fade-in py-4 text-center">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                       <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                       <h3 className="text-sm font-black text-slate-900 mb-2">ডেঞ্জার জোন</h3>
                       <p className="text-[10px] font-bold text-slate-500 leading-relaxed">এই মেম্বারকে ডিলিট করলে তার সকল ব্যক্তিগত তথ্য এবং সংগঠনের ফান্ড থেকে তার করা অনুদান চিরতরে মুছে যাবে।</p>
                    </div>
                    <button 
                      onClick={handleDeleteUser}
                      disabled={isDeletingUser}
                      className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-rose-100 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isDeletingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> মেম্বার ডিলিট করুন</>}
                    </button>
                 </div>
               )}
               {userModalTab === 'message' && (
                 <div className="space-y-3 animate-in fade-in">
                    <textarea rows={3} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-teal-600 text-xs font-bold text-black" placeholder="মেসেজ লিখুন..." value={adminMessage} onChange={e => setAdminMessage(e.target.value)} />
                    <button onClick={handleSendMessage} disabled={isSendingMsg} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"><Send className="w-4 h-4" /> ইউজারকে মেসেজ পাঠান</button>
                 </div>
               )}
               {userModalTab === 'add' && (
                 <div className="space-y-4 text-center animate-in fade-in">
                    <p className="text-[9px] font-black uppercase text-black tracking-widest">টাকার পরিমাণ বসান (৳)</p>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-3xl font-black outline-none focus:border-teal-600 transition-all text-center text-black" placeholder="০.০০" value={manualAmount} onChange={e => setManualAmount(e.target.value)} />
                    <button onClick={handleAddManualTx} disabled={isAddingTx} className="w-full py-3 bg-teal-600 text-white rounded-xl font-black text-xs active:scale-95 transition-all shadow-lg shadow-teal-100">অনুমোদিত দান হিসেবে যোগ করুন</button>
                 </div>
               )}
               {userModalTab === 'info' && (
                 <div className="space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-2">
                       <ModalInfoItemSmall label="পেশা" value={selectedUser.profession} />
                       <ModalInfoItemSmall label="জন্ম সাল" value={toBengaliNumber(selectedUser.birthYear)} />
                    </div>
                    <ModalInfoItemSmall label="ঠিকানা" value={`${selectedUser.address.village}, ${selectedUser.address.upazila}`} />
                    <ModalInfoItemSmall label="ফোন নম্বর" value={toBengaliNumber(selectedUser.phone)} />
                    <div className="p-4 bg-teal-600 rounded-xl border-b-4 border-teal-800 flex justify-between items-center shadow-lg mt-4">
                       <div><p className="text-[8px] font-black text-teal-100 uppercase tracking-widest">মোট অনুদান</p><p className="text-xl font-black text-white">৳{toBengaliNumber(selectedUser.totalDonation.toLocaleString())}</p></div>
                       <Wallet className="w-6 h-6 text-white/30" />
                    </div>
                 </div>
               )}
               {userModalTab === 'history' && (
                 <div className="space-y-3 animate-in fade-in">
                   <div className="p-3 bg-slate-900 rounded-xl flex justify-between items-center shadow-lg mb-4">
                      <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">মোট সফল দান</p>
                      <p className="text-sm font-black text-white">৳{toBengaliNumber(selectedUser.totalDonation.toLocaleString())}</p>
                   </div>
                   <div className="space-y-2">
                     {userSpecificTxs.map(tx => (
                       <div key={tx.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-[10px] font-black text-black">{tx.method}</p>
                            <p className="text-[8px] text-slate-500 font-bold tracking-widest">{toBengaliNumber(tx.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-black">৳{toBengaliNumber(tx.amount)}</p>
                            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border tracking-widest ${
                              tx.status === TransactionStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-200' : 
                              tx.status === TransactionStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                            }`}>
                              {tx.status === TransactionStatus.APPROVED ? 'সফল' : tx.status === TransactionStatus.REJECTED ? 'বাতিল' : 'পেন্ডিং'}
                            </span>
                          </div>
                       </div>
                     ))}
                     {userSpecificTxs.length === 0 && <p className="text-[9px] text-center text-slate-300 py-10 uppercase font-black tracking-widest">লেনদেন নেই</p>}
                   </div>
                 </div>
               )}
            </div>
            {selectedUser.status === UserStatus.PENDING && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
                 <button onClick={() => handleApproveUser(selectedUser.id)} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-black text-xs active:scale-95 transition-all shadow-lg shadow-green-100">অনুমোদন</button>
                 <button onClick={() => handleRejectUser(selectedUser.id)} className="flex-1 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-black text-xs active:scale-95 transition-all">বাতিল</button>
              </div>
            )}
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

const ModalInfoItemSmall = ({ label, value }: { label: string, value: string }) => (
  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
    <p className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest">{label}</p>
    <p className="text-black font-black text-[10px] leading-tight">{value}</p>
  </div>
);

export default AdminDashboard;
