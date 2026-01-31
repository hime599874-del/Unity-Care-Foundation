
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { User, Transaction, UserStatus, TransactionStatus, FundType, Expense, AssistanceRequest, AssistanceStatus } from '../types';
import { toPng } from 'html-to-image';
import { 
  Users, DollarSign, Check, X, Trash2, LayoutDashboard, 
  TrendingUp, TrendingDown, Search, 
  Calendar, LogOut, Plus, 
  MessageCircle, Send, Wallet, Camera, FileText, Hash, Printer, Download, ImageIcon,
  UserCheck, UserCircle, AlertTriangle, Loader2, Droplet, MapPin, Clock, ShieldCheck,
  Phone, RotateCcw, HandHelping, Info, ChevronRight
} from 'lucide-react';

const compressImage = (base64Str: string, maxWidth = 600, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
      } else {
        if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
  });
};

const toBengaliNumber = (num: number | string) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
};

const AdminDashboard: React.FC = () => {
  const { setIsAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState(db.getStats());
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'users' | 'donors' | 'txs' | 'expense'>('overview');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [expenseImage, setExpenseImage] = useState<string | null>(null);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refreshData = () => {
      setUsers(db.getUsers());
      setTransactions(db.getTransactions().sort((a,b) => b.timestamp - a.timestamp));
      setAssistanceRequests(db.getAssistanceRequests());
      setExpenses(db.getExpenses().sort((a,b) => b.timestamp - a.timestamp));
      setStats(db.getStats());
    };
    refreshData();
    const unsubscribe = db.subscribe(refreshData);
    return unsubscribe;
  }, []);

  const handleLogout = () => { setIsAdmin(false); navigate('/'); };

  const handleApproveUser = async (id: string) => { await db.updateUser(id, { status: UserStatus.APPROVED }); };
  const handleRejectUser = async (id: string) => { if(confirm("নিবন্ধনটি বাতিল করবেন?")) await db.updateUser(id, { status: UserStatus.REJECTED }); };
  const handleDeleteUser = async (id: string) => { if(confirm("সদস্যটি স্থায়ীভাবে মুছে ফেলবেন?")) await db.deleteUser(id); };

  const handleApproveTx = async (id: string) => { await db.approveTransaction(id); };
  const handleRejectTx = async (id: string) => { if(confirm("লেনদেনটি বাতিল করবেন?")) await db.rejectTransaction(id); };

  const handleUpdateAssistance = async (reqId: string, status: AssistanceStatus) => {
    const statusText = status === AssistanceStatus.REJECTED ? "বাতিল" : status === AssistanceStatus.APPROVED ? "অনুমোদন" : "যাচাই";
    if (status === AssistanceStatus.REJECTED && !confirm("আপনি কি নিশ্চিত যে আবেদনটি বাতিল করতে চান?")) return;
    
    const note = prompt(`আবেদনকারীর জন্য একটি নোট লিখুন (ঐচ্ছিক):`);
    try {
      await db.updateAssistanceStatus(reqId, status, note || undefined);
      alert(`আবেদনটি সফলভাবে ${statusText} করা হয়েছে।`);
    } catch (e) {
      alert("সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    }
  };

  const handleDeleteAssistance = async (id: string) => {
    if (confirm("আবেদনটি কি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।")) {
      try {
        await db.deleteAssistanceRequest(id);
        alert("আবেদনটি মুছে ফেলা হয়েছে।");
      } catch (e) {
        alert("মুছে ফেলতে সমস্যা হয়েছে।");
      }
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseReason || isSubmittingExpense) return;
    setIsSubmittingExpense(true);
    try {
      await db.addDetailedExpense(parseFloat(expenseAmount), expenseReason, expenseImage || undefined);
      setExpenseAmount(''); setExpenseReason(''); setExpenseImage(null);
      alert("খরচের হিসাব যুক্ত হয়েছে।");
    } finally { setIsSubmittingExpense(false); }
  };

  const downloadReport = async () => {
    if (!reportRef.current) return;
    const dataUrl = await toPng(reportRef.current, { backgroundColor: '#fff' });
    const link = document.createElement('a');
    link.download = `report-${activeTab}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone.includes(searchQuery));
  const netBalance = stats.totalCollection - stats.totalExpense;

  return (
    <div className="bg-[#F1F5F9] min-h-screen text-black font-['Hind_Siliguri'] pb-10">
      <header className="px-6 py-5 bg-white border-b border-slate-200 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-600 rounded-2xl shadow-lg shadow-teal-100"><LayoutDashboard className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-lg font-black leading-none uppercase tracking-tighter">এডমিন প্যানেল</h1>
            <p className="text-[9px] text-teal-600 font-black uppercase tracking-widest mt-1">Unity Care Foundation</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 active:scale-90 transition-all"><LogOut className="w-5 h-5" /></button>
      </header>

      <div className="bg-white border-b border-slate-200 px-6 overflow-x-auto flex gap-6 scrollbar-hide no-scrollbar">
        {[
          { id: 'overview', label: 'ওভারভিউ', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'requests', label: 'আবেদন', icon: <HandHelping className="w-4 h-4" /> },
          { id: 'users', label: 'সদস্য', icon: <Users className="w-4 h-4" /> },
          { id: 'donors', label: 'দাতা', icon: <UserCheck className="w-4 h-4" /> },
          { id: 'txs', label: 'লেনদেন', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'expense', label: 'ব্যয়', icon: <TrendingDown className="w-4 h-4" /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-4 px-1 border-b-2 text-[11px] font-black uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-400'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="মোট সদস্য" value={`${toBengaliNumber(stats.totalUsers)} জন`} icon={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
              <StatCard label="মোট আদায়" value={`৳${toBengaliNumber(stats.totalCollection.toLocaleString())}`} icon={<TrendingUp className="w-5 h-5" />} color="bg-emerald-50 text-emerald-600" />
              <StatCard label="মোট ব্যয়" value={`৳${toBengaliNumber(stats.totalExpense.toLocaleString())}`} icon={<TrendingDown className="w-5 h-5" />} color="bg-rose-50 text-rose-600" />
              <div className="bg-teal-600 p-5 rounded-[2rem] text-white shadow-xl shadow-teal-100 flex flex-col justify-between">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-80">বর্তমান ফান্ড</p>
                 <h3 className="text-xl font-black mt-2">৳{toBengaliNumber(netBalance.toLocaleString())}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <SectionBox title="নতুন সদস্য আবেদন" count={users.filter(u=>u.status===UserStatus.PENDING).length} color="bg-teal-600">
                  {users.filter(u=>u.status===UserStatus.PENDING).map(u => (
                    <div key={u.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl overflow-hidden flex items-center justify-center font-black text-teal-600 border border-teal-100 shadow-sm">
                             {u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : u.name[0]}
                          </div>
                          <div>
                            <p className="text-xs font-black">{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.phone}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => handleApproveUser(u.id)} className="p-2 bg-emerald-600 text-white rounded-xl shadow-md"><Check className="w-4 h-4" /></button>
                          <button onClick={() => handleRejectUser(u.id)} className="p-2 bg-rose-600 text-white rounded-xl shadow-md"><X className="w-4 h-4" /></button>
                       </div>
                    </div>
                  ))}
               </SectionBox>

               <SectionBox title="পেমেন্ট রিকোয়েস্ট" count={transactions.filter(t=>t.status===TransactionStatus.PENDING).length} color="bg-amber-500">
                  {transactions.filter(t=>t.status===TransactionStatus.PENDING).map(t => (
                    <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                       <div>
                          <p className="text-xs font-black">{t.userName}</p>
                          <p className="text-lg font-black text-amber-600 leading-none mt-1">৳{toBengaliNumber(t.amount)}</p>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => handleApproveTx(t.id)} className="p-2 bg-emerald-600 text-white rounded-xl shadow-md"><Check className="w-4 h-4" /></button>
                          <button onClick={() => handleRejectTx(t.id)} className="p-2 bg-rose-600 text-white rounded-xl shadow-md"><X className="w-4 h-4" /></button>
                       </div>
                    </div>
                  ))}
               </SectionBox>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2">
                   <HandHelping className="w-5 h-5 text-teal-600" /> সাহয্যের আবেদনসমূহ
                </h3>
             </div>
             <div className="grid grid-cols-1 gap-4">
                {assistanceRequests.map(req => {
                  const applicant = users.find(u => u.id === req.userId);
                  return (
                    <div key={req.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl overflow-hidden flex items-center justify-center border border-teal-100">
                                {applicant?.profilePic ? (
                                  <img src={applicant.profilePic} className="w-full h-full object-cover" />
                                ) : (
                                  <UserCircle className="w-8 h-8" />
                                )}
                             </div>
                             <div>
                                <p className="font-black text-slate-900 text-sm">{req.userName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{toBengaliNumber(req.userPhone)}</p>
                             </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                             <button onClick={() => handleDeleteAssistance(req.id)} className="p-2 text-slate-300 hover:text-rose-500 mb-2 transition-colors">
                                <Trash2 className="w-4 h-4" />
                             </button>
                             {req.amount > 0 && <p className="font-black text-slate-900 text-xl">৳{toBengaliNumber(req.amount.toLocaleString())}</p>}
                             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-tighter mt-1 inline-block ${
                               req.status === AssistanceStatus.PENDING ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                               req.status === AssistanceStatus.REJECTED ? 'bg-rose-50 text-rose-600 border-rose-100' :
                               req.status === AssistanceStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                               'bg-blue-50 text-blue-600 border-blue-100'
                             }`}>
                                {req.status === AssistanceStatus.PENDING ? 'নতুন আবেদন' : req.status === AssistanceStatus.REJECTED ? 'বাতিলকৃত' : req.status === AssistanceStatus.APPROVED ? 'অনুমোদিত' : 'যাচাই চলছে'}
                             </span>
                          </div>
                       </div>
                       <div className="p-5 bg-slate-50 rounded-3xl mb-5 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">আবেদনের কারণ:</p>
                          <p className="text-xs font-bold text-slate-700 leading-relaxed">{req.reason}</p>
                       </div>
                       <div className="flex gap-3">
                          <button 
                            onClick={() => handleUpdateAssistance(req.id, AssistanceStatus.REVIEWING)} 
                            disabled={req.status === AssistanceStatus.REJECTED}
                            className="flex-1 py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-black text-[11px] uppercase transition-all active:scale-95 disabled:opacity-30"
                          >
                            যাচাই শুরু
                          </button>
                          <button 
                            onClick={() => handleUpdateAssistance(req.id, AssistanceStatus.APPROVED)} 
                            className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg shadow-emerald-100 transition-all active:scale-95"
                          >
                            অনুমোদন
                          </button>
                          <button 
                            onClick={() => handleUpdateAssistance(req.id, AssistanceStatus.REJECTED)} 
                            className="flex-1 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-[11px] uppercase transition-all active:scale-95"
                          >
                            বাতিল
                          </button>
                       </div>
                    </div>
                  );
                })}
                {assistanceRequests.length === 0 && (
                  <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                     <HandHelping className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">আবেদনের তালিকা খালি</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in">
             <div className="flex items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <Search className="w-5 h-5 text-slate-400" />
                <input type="text" placeholder="সদস্য খুঁজুন (নাম বা নম্বর)..." className="w-full bg-transparent outline-none font-black text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
             </div>
             <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="px-6 py-4">নাম ও নম্বর</th>
                      <th className="px-6 py-4">ঠিকানা</th>
                      <th className="px-6 py-4">রক্তের গ্রুপ</th>
                      <th className="px-6 py-4">স্ট্যাটাস</th>
                      <th className="px-6 py-4">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                 {u.profilePic ? (
                                   <img src={u.profilePic} className="w-full h-full object-cover" alt={u.name} />
                                 ) : (
                                   <UserCircle className="w-6 h-6 text-slate-300" />
                                 )}
                              </div>
                              <div>
                                 <p className="font-black text-xs text-slate-800">{u.name}</p>
                                 <p className="text-[10px] text-slate-400">{u.phone}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-[11px] font-bold text-slate-600">{u.address?.district}, {u.address?.upazila}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className="p-2 bg-rose-50 text-rose-600 rounded-lg font-black text-[10px] border border-rose-100">{u.bloodGroup}</span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${u.status === UserStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>{u.status}</span>
                        </td>
                        <td className="px-6 py-4">
                           <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-rose-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'donors' && (
           <div className="space-y-6 animate-in fade-in" ref={reportRef}>
              <div className="flex justify-between items-center px-2">
                 <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <UserCheck className="w-5 h-5 text-teal-600" /> দাতা তালিকা ও রিপোর্ট
                 </h3>
                 <button onClick={downloadReport} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-teal-100 active:scale-95 transition-all">
                   <Download className="w-4 h-4" /> ডাউনলোড
                 </button>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <th className="px-6 py-4">নাম</th>
                        <th className="px-6 py-4">মোট দান</th>
                        <th className="px-6 py-4">লেনদেন সংখ্যা</th>
                        <th className="px-6 py-4">পদমর্যাদা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {users.filter(u=>u.totalDonation > 0).sort((a,b)=>b.totalDonation - a.totalDonation).map((u, i) => (
                         <tr key={u.id} className="hover:bg-teal-50/30 transition-colors">
                            <td className="px-6 py-5">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-black text-xs text-teal-600 border border-slate-200">
                                     {u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : i+1}
                                  </div>
                                  <p className="font-black text-xs text-slate-800">{u.name}</p>
                               </div>
                            </td>
                            <td className="px-6 py-5 font-black text-teal-600">৳{toBengaliNumber(u.totalDonation.toLocaleString())}</td>
                            <td className="px-6 py-5 font-bold text-xs">{toBengaliNumber(u.transactionCount)} বার</td>
                            <td className="px-6 py-5">
                               <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {i === 0 ? 'প্লাটিনাম' : i === 1 ? 'গোল্ডেন' : i === 2 ? 'সিলভার' : 'সদস্য'}
                               </span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'txs' && (
          <div className="space-y-4 animate-in fade-in">
             <div className="grid grid-cols-1 gap-4">
                {transactions.map(t => (
                  <div key={t.id} className={`bg-white p-5 rounded-[2rem] border shadow-sm flex items-center justify-between group ${t.status === TransactionStatus.PENDING ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'}`}>
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${t.status === TransactionStatus.APPROVED ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                           {t.status === TransactionStatus.APPROVED ? <Check className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                        <div>
                           <p className="font-black text-slate-800 text-sm">{t.userName}</p>
                           <div className="flex items-center gap-3 mt-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-lg">{t.method}</span>
                              <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">{toBengaliNumber(t.date)}</span>
                           </div>
                           <p className="text-[9px] font-bold text-slate-300 mt-1">TxID: {t.transactionId}</p>
                        </div>
                     </div>
                     <div className="text-right flex items-center gap-6">
                        <div>
                           <p className="font-black text-slate-900 text-xl">৳{toBengaliNumber(t.amount.toLocaleString())}</p>
                           <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">{t.fundType}</p>
                        </div>
                        {t.status === TransactionStatus.PENDING && (
                          <div className="flex gap-2">
                             <button onClick={() => handleApproveTx(t.id)} className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg active:scale-90 transition-all"><Check className="w-5 h-5" /></button>
                             <button onClick={() => handleRejectTx(t.id)} className="p-2.5 bg-rose-600 text-white rounded-xl shadow-lg active:scale-90 transition-all"><X className="w-5 h-5" /></button>
                          </div>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'expense' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-4 mb-8">
                   <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Plus className="w-6 h-6" /></div>
                   <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">নতুন ব্যয়ের হিসাব</h3>
                </div>
                <form onSubmit={handleAddExpense} className="space-y-5">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <input 
                        type="number" 
                        placeholder="টাকার পরিমাণ (৳)" 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-rose-500 font-black text-sm" 
                        value={expenseAmount} 
                        onChange={e => setExpenseAmount(e.target.value)} 
                      />
                      <input 
                        type="text" 
                        placeholder="ব্যয়ের কারণ লিখুন..." 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-rose-500 font-black text-sm" 
                        value={expenseReason} 
                        onChange={e => setExpenseReason(e.target.value)} 
                      />
                   </div>
                   <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-colors relative">
                      {expenseImage ? (
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-md">
                           <img src={expenseImage} className="w-full h-full object-cover" alt="Expense Proof" />
                           <button onClick={() => setExpenseImage(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center gap-3 cursor-pointer">
                           <ImageIcon className="w-10 h-10 text-slate-300" />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ভাউচার বা প্রমানপত্রের ছবি যোগ করুন</p>
                           <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onloadend = async () => setExpenseImage(await compressImage(reader.result as string));
                               reader.readAsDataURL(file);
                             }
                           }} />
                        </label>
                      )}
                   </div>
                   <button 
                     type="submit" 
                     disabled={!expenseAmount || !expenseReason || isSubmittingExpense} 
                     className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-rose-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all"
                   >
                     {isSubmittingExpense ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> খরচ এন্ট্রি করুন</>}
                   </button>
                </form>
             </div>

             <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">সাম্প্রতিক ব্যয়</h3>
                <div className="space-y-3">
                   {expenses.map(exp => (
                     <div key={exp.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5" /></div>
                           <div>
                              <p className="font-black text-slate-800 text-xs">{exp.reason}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{toBengaliNumber(exp.date)}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-rose-600 text-base">৳{toBengaliNumber(exp.amount.toLocaleString())}</p>
                           <button onClick={async () => { if(confirm("মুছে ফেলবেন?")) await db.deleteExpense(exp.id, exp.amount); }} className="text-rose-300 hover:text-rose-600 mt-1"><Trash2 className="w-3.5 h-3.5 ml-auto" /></button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <div className="bg-white p-5 rounded-[2rem] border border-slate-200 h-28 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm ${color}`}>{icon}</div>
    <div className="mt-2">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-sm font-black text-slate-900 mt-0.5">{value}</h3>
    </div>
  </div>
);

const SectionBox = ({ title, count, children, color }: { title: string, count: number, children?: React.ReactNode, color: string }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
    <div className={`p-4 ${color} text-white flex justify-between items-center`}>
      <h4 className="text-[10px] font-black uppercase tracking-widest">{title}</h4>
      <span className="text-[9px] font-black bg-black/20 px-3 py-1 rounded-full">{toBengaliNumber(count)}</span>
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

export default AdminDashboard;
