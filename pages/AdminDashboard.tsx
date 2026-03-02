import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { User, Transaction, UserStatus, TransactionStatus, Expense, AssistanceRequest, AssistanceStatus, Suggestion, Complaint, ContactConfig, ProjectProgress, MemberActivity } from '../types';
import { 
  Users, DollarSign, Check, X, Trash2, LayoutDashboard, 
  TrendingUp, TrendingDown, Search, 
  LogOut, Plus, 
  MessageCircle, Send, Wallet,
  Loader2, Phone, User as UserIcon, ShieldCheck,
  MapPin, Calendar, Briefcase, Droplets, Info, RefreshCw, HandHelping, Settings,
  Lightbulb, FileSpreadsheet, Image as LucideImageIcon, Clock, AlertCircle,
  Download, Smartphone, Landmark, Award, Activity, QrCode
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';

const toBengaliNumber = (num: number | string) => {
  return num.toString();
};

const AdminDashboard: React.FC = () => {
  const { setIsAdmin } = useAuth();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assistance, setAssistance] = useState<AssistanceRequest[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<ProjectProgress[]>([]);
  const [activities, setActivities] = useState<MemberActivity[]>(db.getActivities());
  const [stats, setStats] = useState(db.getStats());
  const [contactConfig, setContactConfig] = useState<ContactConfig>(db.getContactConfig());
  const [settingsForm, setSettingsForm] = useState<ContactConfig>(db.getContactConfig());
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'assistance' | 'txs' | 'expense' | 'suggestions' | 'complaints' | 'settings' | 'progress' | 'qr' | 'activities'>('overview');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [qrSearchQuery, setQrSearchQuery] = useState('');
  const [editingExpiry, setEditingExpiry] = useState<{ userId: string, date: string } | null>(null);
  const [editingJoining, setEditingJoining] = useState<{ userId: string, date: string } | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [expenseImage, setExpenseImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const [projectName, setProjectName] = useState('');
  const [projectTarget, setProjectTarget] = useState('');
  const [projectCollected, setProjectCollected] = useState('');
  const [projectProgressType, setProjectProgressType] = useState<'Auto' | 'Manual'>('Auto');
  const [projectManualPercent, setProjectManualPercent] = useState('');
  const [projectStatus, setProjectStatus] = useState<'Ongoing' | 'Completed' | 'Pending'>('Ongoing');
  const [projectDeadline, setProjectDeadline] = useState('');
  
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewingAssistance, setViewingAssistance] = useState<AssistanceRequest | null>(null);
  const [notifMessage, setNotifMessage] = useState('');
  const [adminNote, setAdminNote] = useState('');
  
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [userDesignation, setUserDesignation] = useState('');

  useEffect(() => {
    const refreshData = () => {
      setUsers(db.getUsers());
      setTransactions(db.getTransactions().sort((a,b) => b.timestamp - a.timestamp));
      setAssistance(db.getAssistanceRequests().sort((a,b) => b.timestamp - a.timestamp));
      setSuggestions(db.getSuggestions().sort((a,b) => b.timestamp - a.timestamp));
      setComplaints(db.getComplaints().sort((a,b) => b.timestamp - a.timestamp));
      setExpenses(db.getExpenses().sort((a,b) => b.timestamp - a.timestamp));
      setProjects(db.getProjects().sort((a,b) => b.timestamp - a.timestamp));
      setActivities(db.getActivities().sort((a,b) => b.timestamp - a.timestamp));
      setStats(db.getStats());
      const latestConfig = db.getContactConfig();
      setContactConfig(latestConfig);
      // Only update settings form if the user isn't currently editing it
      // or if they just switched to the settings tab
    };
    refreshData();
    return db.subscribe(refreshData);
  }, []);

  useEffect(() => {
    if (activeTab === 'settings') {
      setSettingsForm(db.getContactConfig());
    }
  }, [activeTab]);

  useEffect(() => {
    if (viewingUser) {
      setUserDesignation(viewingUser.designation || 'ভেরিফাইড সদস্য');
    }
  }, [viewingUser]);

  const handleAddProject = async () => {
    if (!projectName || !projectTarget || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await db.addProject({
        name: projectName,
        targetAmount: parseFloat(projectTarget),
        collectedAmount: parseFloat(projectCollected || '0'),
        progressType: projectProgressType,
        manualPercentage: projectProgressType === 'Manual' ? parseFloat(projectManualPercent || '0') : undefined,
        status: projectStatus,
        deadline: projectDeadline
      });
      setProjectName(''); setProjectTarget(''); setProjectCollected('');
      setProjectManualPercent(''); setProjectDeadline('');
      alert('প্রজেক্ট সফলভাবে যোগ করা হয়েছে।');
    } catch (e: any) { alert(e.message); } finally { setIsSubmitting(false); }
  };

  const handleUpdateDesignation = async () => {
    if (!viewingUser || !userDesignation.trim()) return;
    setIsSubmitting(true);
    try {
      await db.updateUser(viewingUser.id, { designation: userDesignation.trim() });
      setViewingUser({ ...viewingUser, designation: userDesignation.trim() });
      alert('পদবী সফলভাবে আপডেট করা হয়েছে।');
    } catch (e) {
      alert('আপডেট ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePermanentMember = async () => {
    if (!viewingUser) return;
    setIsSubmitting(true);
    try {
      const newStatus = !viewingUser.isPermanentMember;
      await db.updateUser(viewingUser.id, { isPermanentMember: newStatus });
      setViewingUser({ ...viewingUser, isPermanentMember: newStatus });
    } catch (e) {
      alert('আপডেট ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateContactConfig = async () => {
    setIsSubmitting(true);
    try {
      await db.updateContactConfig(settingsForm);
      alert('কন্টাক্ট সেটিংস সফলভাবে সেভ করা হয়েছে।');
    } catch (e) {
      alert('সেভিংস ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleIdCard = async (userId: string, currentStatus: boolean) => {
    try {
      await db.updateUser(userId, { isIdCardEnabled: !currentStatus });
      alert(`আইডি কার্ড ${!currentStatus ? 'এনাবেল' : 'ডিজেবল'} করা হয়েছে।`);
    } catch (e) { alert('ব্যর্থ হয়েছে।'); }
  };

  const handleUpdateExpiry = async (userId: string, date: string) => {
    try {
      await db.updateUser(userId, { expiryDate: date });
      setEditingExpiry(null);
      alert('মেয়াদ শেষ হওয়ার তারিখ আপডেট হয়েছে।');
    } catch (e) { alert('ব্যর্থ হয়েছে।'); }
  };

  const handleUpdateJoining = async (userId: string, date: string) => {
    try {
      const timestamp = new Date(date).getTime();
      await db.updateUser(userId, { registeredAt: timestamp });
      setEditingJoining(null);
      alert('যোগদানের তারিখ আপডেট হয়েছে।');
    } catch (e) { alert('ব্যর্থ হয়েছে।'); }
  };

  const downloadQRCode = (userId: string, userName: string) => {
    const svg = document.getElementById(`qr-${userId}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 100;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        ctx.fillStyle = "black";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(userName, canvas.width / 2, img.height + 60);
        ctx.font = "14px Arial";
        ctx.fillText("Unity Care Foundation", canvas.width / 2, img.height + 85);
      }
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${userName}_${userId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleLogout = () => { setIsAdmin(false); navigate('/'); };

  const handleUpdateStatus = async (id: string, type: 'user' | 'tx' | 'assistance', status: any) => {
    try {
      if (type === 'user') await db.updateUser(id, { status });
      if (type === 'tx') status === TransactionStatus.APPROVED ? await db.approveTransaction(id) : await db.rejectTransaction(id);
      if (type === 'assistance') {
        await db.updateAssistanceStatus(id, status, adminNote);
        setViewingAssistance(null);
        setAdminNote('');
      }
    } catch (e) { alert('সমস্যা হয়েছে।'); }
  };

  const handleAddExpense = async () => {
    if (!expenseAmount || !expenseReason || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await db.addDetailedExpense(parseFloat(expenseAmount), expenseReason, expenseImage || undefined);
      setExpenseAmount(''); setExpenseReason(''); setExpenseImage(null);
      alert('ব্যয় সফলভাবে যোগ করা হয়েছে।');
    } catch (e: any) { alert(e.message); } finally { setIsSubmitting(false); }
  };

  const handleExpenseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > height) {
            if (width > maxDim) { height *= maxDim / width; width = maxDim; }
          } else {
            if (height > maxDim) { width *= maxDim / height; height = maxDim; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setExpenseImage(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!viewingUser || !notifMessage.trim()) return;
    try {
      await db.sendNotification(viewingUser.id, notifMessage.trim());
      setNotifMessage('');
      alert('বার্তা পাঠানো হয়েছে।');
    } catch (e) { alert('ব্যর্থ হয়েছে।'); }
  };

  const handleAddManualFunds = async () => {
    if (!viewingUser || !manualAmount) return;
    try {
      await db.addManualTransaction(viewingUser.id, viewingUser.name, parseFloat(manualAmount), 'Admin Manual', manualDate);
      setManualAmount('');
      alert('সফলভাবে যোগ হয়েছে।');
    } catch (e) { alert('ব্যর্থ হয়েছে।'); }
  };

  const downloadTransactionsAsImage = async () => {
    if (!reportRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      const dataUrl = await toPng(reportRef.current, { backgroundColor: '#F1F5F9', pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `Ledger_Report_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } finally { setIsCapturing(false); }
  };

  const downloadAsExcel = () => {
    const approvedTxs = transactions.filter(t => t.status === TransactionStatus.APPROVED);
    const headers = ['SL', 'Date', 'Name', 'Phone', 'Amount', 'Method', 'Transaction ID'];
    const rows = approvedTxs.map((t, index) => [
      index + 1,
      t.date,
      t.userName,
      db.getUser(t.userId)?.phone || 'N/A',
      t.amount,
      t.method,
      t.transactionId
    ]);
    
    const csvRows = [headers, ...rows];
    const csvString = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Donation_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadMonthlyExcelReport = () => {
    const [year, month] = reportMonth.split('-').map(Number);
    const monthName = new Date(year, month - 1).toLocaleString('bn-BD', { month: 'long', year: 'numeric' });
    
    // Filter transactions for the selected month
    const monthlyTxs = transactions.filter(t => {
      const d = new Date(t.timestamp);
      return d.getFullYear() === year && (d.getMonth() + 1) === month && t.status === TransactionStatus.APPROVED;
    });

    // Filter expenses for the selected month
    const monthlyExpenses = expenses.filter(e => {
      const d = new Date(e.timestamp);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });

    const totalCollection = monthlyTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const donorIds = new Set(monthlyTxs.map(t => t.userId));
    const donorCount = donorIds.size;
    const netBalance = stats.totalCollection - stats.totalExpense;

    // Find members who haven't paid this month
    const approvedUsers = users.filter(u => u.status === UserStatus.APPROVED);
    const unpaidMembers = approvedUsers.filter(u => !donorIds.has(u.id));

    const csvRows = [
      ['ইউনিটি কেয়ার ফাউন্ডেশন - মাসিক রিপোর্ট (Monthly Report)'],
      ['মাসের নাম', monthName],
      ['এই মাসে মোট আদায়', `৳${totalCollection}`],
      ['মোট দাতা সংখ্যা', `${donorCount} জন`],
      ['এই মাসে মোট ব্যয়', `৳${totalExpense}`],
      ['বর্তমান মোট তহবিল (Total Balance)', `৳${netBalance}`],
      [],
      ['আদায়ের তালিকা (Donation List)'],
      ['SL', 'তারিখ (Date)', 'সদস্যের নাম (Name)', 'পরিচয় (ID)', 'পরিমাণ (Amount)', 'মাধ্যম (Method)'],
    ];

    monthlyTxs.forEach((t, index) => {
      const user = db.getUser(t.userId);
      csvRows.push([
        index + 1,
        t.date,
        t.userName,
        user?.phone?.slice(-4) || '0000',
        t.amount,
        t.method
      ]);
    });

    csvRows.push([], ['বকেয়া সদস্যদের তালিকা (Unpaid Members List)'], ['SL', 'নাম (Name)', 'পরিচয় (ID)', 'মোবাইল (Mobile)', 'ঠিকানা (Address)']);

    unpaidMembers.forEach((m, index) => {
      csvRows.push([
        index + 1,
        m.name,
        m.phone.slice(-4),
        m.phone,
        `${m.address?.district || ''}, ${m.address?.upazila || ''}`
      ]);
    });

    const csvString = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Monthly_Report_${reportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPermanentMembersMonthlyReport = () => {
    const [year, month] = reportMonth.split('-').map(Number);
    const monthName = new Date(year, month - 1).toLocaleString('bn-BD', { month: 'long', year: 'numeric' });
    
    const permanentUserIds = new Set(users.filter(u => u.isPermanentMember).map(u => u.id));
    
    // Filter transactions for the selected month and permanent members
    const monthlyTxs = transactions.filter(t => {
      const d = new Date(t.timestamp);
      return d.getFullYear() === year && (d.getMonth() + 1) === month && t.status === TransactionStatus.APPROVED && permanentUserIds.has(t.userId);
    });

    const totalCollection = monthlyTxs.reduce((sum, t) => sum + t.amount, 0);
    const donorIds = new Set(monthlyTxs.map(t => t.userId));
    const donorCount = donorIds.size;

    // Find permanent members who haven't paid this month
    const permanentMembers = users.filter(u => u.isPermanentMember && u.status === UserStatus.APPROVED);
    const unpaidPermanentMembers = permanentMembers.filter(u => !donorIds.has(u.id));

    const csvRows = [
      ['ইউনিটি কেয়ার ফাউন্ডেশন - স্থায়ী সদস্য মাসিক রিপোর্ট'],
      ['মাসের নাম', monthName],
      ['এই মাসে মোট আদায় (স্থায়ী সদস্য)', `৳${totalCollection}`],
      ['মোট দাতা সংখ্যা (স্থায়ী সদস্য)', `${donorCount} জন`],
      [],
      ['স্থায়ী সদস্যদের আদায়ের তালিকা'],
      ['SL', 'তারিখ (Date)', 'সদস্যের নাম (Name)', 'পরিচয় (ID)', 'পরিমাণ (Amount)', 'মাধ্যম (Method)'],
    ];

    monthlyTxs.forEach((t, index) => {
      const user = db.getUser(t.userId);
      csvRows.push([
        index + 1,
        t.date,
        t.userName,
        user?.phone?.slice(-4) || '0000',
        t.amount,
        t.method
      ]);
    });

    csvRows.push([], ['বকেয়া স্থায়ী সদস্যদের তালিকা'], ['SL', 'নাম (Name)', 'পরিচয় (ID)', 'মোবাইল (Mobile)', 'ঠিকানা (Address)']);

    unpaidPermanentMembers.forEach((m, index) => {
      csvRows.push([
        index + 1,
        m.name,
        m.phone.slice(-4),
        m.phone,
        `${m.address?.district || ''}, ${m.address?.upazila || ''}`
      ]);
    });

    const csvString = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Permanent_Members_Report_${reportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredUsers = useMemo(() => users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone.includes(searchQuery)), [users, searchQuery]);
  const netBalance = stats.totalCollection - (expenses.length === 0 ? 0 : stats.totalExpense);

  return (
    <div className="bg-[#F1F5F9] min-h-screen font-['Hind_Siliguri'] pb-20">
      <header className="px-6 py-5 bg-white border-b sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0D9488] rounded-xl text-white shadow-lg"><LayoutDashboard className="w-5 h-5" /></div>
          <div><h1 className="text-base font-black uppercase leading-none">এডমিন প্যানেল</h1><p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Unity Care Foundation</p></div>
        </div>
        <button onClick={handleLogout} className="p-3 bg-rose-50 text-rose-600 rounded-2xl active:scale-95 transition-all"><LogOut className="w-6 h-6" /></button>
      </header>

      <div className="bg-white border-b px-6 overflow-x-auto flex gap-6 sticky top-[73px] z-40 no-scrollbar shadow-sm">
        {[
          { id: 'overview', label: 'ওভারভিউ', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'users', label: 'সদস্য তালিকা', icon: <Users className="w-4 h-4" /> },
          { id: 'assistance', label: 'আবেদন', icon: <HandHelping className="w-4 h-4" /> },
          { id: 'txs', label: 'লেনদেন', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'expense', label: 'ব্যয়', icon: (
            <div className="relative w-4 h-4 flex items-center justify-center">
              <div className="absolute bottom-0 w-2.5 h-1.5 bg-blue-600 rounded-sm"></div>
              <div className="absolute bottom-0.5 w-2 h-2 bg-amber-400 rounded-sm"></div>
              <div className="absolute top-0 w-1.5 h-1.5 bg-pink-100 rounded-full"></div>
            </div>
          ) },
          { id: 'suggestions', label: 'পরামর্শ', icon: <Lightbulb className="w-4 h-4" /> },
          { id: 'complaints', label: 'অভিযোগ', icon: <AlertCircle className="w-4 h-4" /> },
          { id: 'progress', label: 'অগ্রগতি', icon: <Activity className="w-4 h-4" /> },
          { id: 'activities', label: 'মেম্বার অ্যাক্টিভিটি', icon: <Clock className="w-4 h-4" /> },
          { id: 'qr', label: 'ইউজার আইডি QR', icon: <QrCode className="w-4 h-4" /> },
          { id: 'settings', label: 'সেটিংস', icon: <Settings className="w-4 h-4" /> }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-5 px-1 border-b-[3px] text-[10px] font-black uppercase flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-[#0D9488] text-[#0D9488]' : 'border-transparent text-slate-400'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <main className="p-5 max-w-lg mx-auto space-y-6 md:max-w-4xl">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in max-w-lg mx-auto">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="মোট সদস্য" value={`${toBengaliNumber(stats.totalUsers)} জন`} icon={<Users className="w-6 h-6" />} color="bg-blue-50 text-blue-600" />
              <StatCard label="স্থায়ী সদস্য" value={`${toBengaliNumber(users.filter(u => u.isPermanentMember).length)} জন`} icon={<Award className="w-6 h-6" />} color="bg-amber-50 text-amber-600" />
              <StatCard label="মোট আদায়" value={`৳${toBengaliNumber(stats.totalCollection.toLocaleString())}`} icon={<TrendingUp className="w-6 h-6" />} color="bg-emerald-50 text-emerald-600" />
              <StatCard label="মোট ব্যয়" value={`৳${toBengaliNumber(stats.totalExpense.toLocaleString())}`} icon={
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <div className="absolute bottom-0.5 w-4 h-3 bg-blue-600 rounded-sm shadow-sm"></div>
                  <div className="absolute bottom-1 w-3.5 h-4 bg-amber-400 rounded-md shadow-inner"></div>
                  <div className="absolute top-0.5 w-2.5 h-2.5 bg-[#FFE4E1] rounded-full border border-pink-200"></div>
                  <div className="absolute bottom-2 w-4.5 h-2.5 bg-slate-800 rounded-sm border border-slate-700"></div>
                </div>
              } color="bg-rose-50 text-rose-600" />
              <div className="bg-[#0D9488] p-5 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between h-28 border border-white/20 col-span-2">
                <p className="text-[9px] font-black uppercase opacity-80 leading-none tracking-widest">বর্তমান তহবিল</p>
                <h3 className="text-2xl font-black leading-none italic">৳{toBengaliNumber(netBalance.toLocaleString())}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionBox title="মেম্বার রিকোয়েস্ট" count={users.filter(u=>u.status===UserStatus.PENDING).length} color="bg-indigo-600">
                {users.filter(u=>u.status===UserStatus.PENDING).map(u => (
                  <div key={u.id} className="p-4 bg-white border rounded-[1.8rem] flex items-center justify-between shadow-sm hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black truncate">{u.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{u.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleUpdateStatus(u.id, 'user', UserStatus.APPROVED)} className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md active:scale-90 transition-all"><Check className="w-5 h-5" /></button>
                       <button onClick={() => { if(confirm("এই মেম্বার রিকোয়েস্টটি বাতিল করবেন?")) db.deleteUser(u.id); }} className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md active:scale-90 transition-all"><X className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
                {users.filter(u=>u.status===UserStatus.PENDING).length === 0 && (
                  <p className="text-center py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">কোন মেম্বার রিকোয়েস্ট নেই</p>
                )}
              </SectionBox>

              <SectionBox title="লেনদেন রিকোয়েস্ট" count={transactions.filter(t=>t.status===TransactionStatus.PENDING).length} color="bg-amber-500">
                {transactions.filter(t=>t.status===TransactionStatus.PENDING).map(t => (
                  <div key={t.id} className="p-4 bg-white border rounded-[1.8rem] flex items-center justify-between shadow-sm hover:border-amber-200 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black truncate">{t.userName}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">৳{toBengaliNumber(t.amount)} • {t.method}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleUpdateStatus(t.id, 'tx', TransactionStatus.APPROVED)} className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md active:scale-90 transition-all"><Check className="w-5 h-5" /></button>
                       <button onClick={() => handleUpdateStatus(t.id, 'tx', TransactionStatus.REJECTED)} className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md active:scale-90 transition-all"><X className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
                {transactions.filter(t=>t.status===TransactionStatus.PENDING).length === 0 && (
                  <p className="text-center py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">কোন লেনদেন রিকোয়েস্ট নেই</p>
                )}
              </SectionBox>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in">
             <div className="flex items-center gap-3 bg-white p-4 rounded-3xl border shadow-sm max-w-lg mx-auto">
                <Search className="w-5 h-5 text-slate-400" />
                <input type="text" placeholder="সদস্য খুঁজুন..." className="w-full outline-none font-bold text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
             </div>
             
             <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead className="bg-slate-50 border-b">
                         <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <th className="px-6 py-4">সদস্য</th>
                            <th className="px-6 py-4">ঠিকানা</th>
                            <th className="px-6 py-4 text-center">রক্তের গ্রুপ</th>
                            <th className="px-6 py-4 text-center">অ্যাকশন</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y">
                         {filteredUsers.map(u => (
                           <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-4" onClick={() => setViewingUser(u)}>
                                 <div className="flex items-center gap-4 cursor-pointer">
                                    <div className="w-12 h-12 rounded-[1.2rem] bg-slate-100 overflow-hidden shrink-0 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                                       {u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-3 text-slate-300" />}
                                    </div>
                                    <div>
                                       <p className="font-black text-sm text-slate-800">{u.name}</p>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{u.phone}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="text-[11px] font-bold text-slate-500 leading-tight">
                                    <p className="text-slate-800 font-black mb-0.5 uppercase">{u.address?.district || '—'}</p>
                                    <p>{u.address?.upazila || '—'}</p>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 {u.bloodGroup && (
                                   <span className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[11px] font-black border border-rose-100/50">
                                      {u.bloodGroup}
                                   </span>
                                 )}
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center justify-center gap-3">
                                    <button onClick={() => setViewingUser(u)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm">
                                       <MessageCircle className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { if(confirm("মুছে ফেলবেন?")) db.deleteUser(u.id); }} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors shadow-sm">
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'assistance' && (
          <div className="space-y-4 animate-in fade-in max-w-lg mx-auto">
             <div className="bg-[#0D9488] p-6 rounded-[2.5rem] text-white shadow-xl mb-4">
                <h3 className="text-xl font-black italic">সাহায্যের আবেদনসমূহ</h3>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">সব আবেদনের তালিকা</p>
             </div>
             <div className="space-y-4">
                {assistance.map(req => (
                  <div key={req.id} onClick={() => setViewingAssistance(req)} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col gap-3 group active:scale-[0.98] transition-all cursor-pointer">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center"><HandHelping className="w-6 h-6" /></div>
                           <div><p className="text-xs font-black">{req.userName}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{req.category}</p></div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${req.status === AssistanceStatus.APPROVED ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                           {req.status}
                        </div>
                     </div>
                     <p className="text-[11px] font-bold text-slate-600 line-clamp-2">{req.reason}</p>
                     {req.amount > 0 && <p className="text-sm font-black text-rose-600">৳{toBengaliNumber(req.amount.toLocaleString())}</p>}
                  </div>
                ))}
                {assistance.length === 0 && <div className="text-center py-20 opacity-20"><AlertCircle className="w-16 h-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest">কোন আবেদন নেই</p></div>}
             </div>
          </div>
        )}

        {activeTab === 'txs' && (
           <div className="space-y-4 animate-in fade-in max-w-lg mx-auto">
              <div className="bg-white p-5 rounded-[2rem] shadow-sm border space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">মাসিক রিপোর্ট (Excel)</h3>
                    <FileSpreadsheet className="w-5 h-5 text-[#0D9488]" />
                 </div>
                 <div className="flex flex-col gap-3">
                    <input 
                      type="month" 
                      className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-black text-sm" 
                      value={reportMonth} 
                      onChange={e => setReportMonth(e.target.value)} 
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button 
                        onClick={downloadMonthlyExcelReport}
                        className="w-full py-4 bg-[#0D9488] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" /> সাধারণ রিপোর্ট
                      </button>
                      <button 
                        onClick={downloadPermanentMembersMonthlyReport}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Award className="w-4 h-4" /> স্থায়ী সদস্য রিপোর্ট
                      </button>
                    </div>
                 </div>
              </div>

              <div className="bg-white p-3 rounded-2xl shadow-sm border flex gap-2 justify-end items-center">
                 <button onClick={downloadAsExcel} className="p-2 bg-slate-100 text-slate-600 rounded-lg" title="Excel"><FileSpreadsheet className="w-4 h-4" /></button>
                 <button onClick={downloadTransactionsAsImage} disabled={isCapturing} className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] text-white rounded-xl text-[9px] font-black uppercase shadow-md active:scale-95 transition-all">
                   <LucideImageIcon className="w-3.5 h-3.5" /> ছবি ডাউনলোড
                 </button>
              </div>

              <div ref={reportRef} className="bg-[#F8FAFC] rounded-[3.5rem] shadow-2xl overflow-hidden border border-white max-w-[420px] mx-auto pb-10">
                <div className="bg-[#0D9488] pt-12 pb-10 px-8 text-center relative overflow-hidden rounded-b-[3.5rem]">
                   <h2 className="text-2xl font-black text-white italic tracking-tight">UNITY CARE FOUNDATION</h2>
                   <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-teal-100 mt-2 opacity-80 italic">লে ন দে ন  রি পো র্ট</p>
                   <h1 className="text-6xl font-black text-white italic mt-6 leading-none drop-shadow-2xl">
                     ৳{toBengaliNumber(stats.totalCollection.toLocaleString())}
                   </h1>
                </div>

                <div className="p-2 pt-4">
                  <div className="bg-white rounded-[2.5rem] overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/80 border-b border-slate-100">
                        <tr className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">
                          <th className="px-5 py-3">তারিখ</th>
                          <th className="px-2 py-3">সদস্যের তথ্য</th>
                          <th className="px-5 py-3 text-right">পরিমাণ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {transactions.filter(t => t.status === TransactionStatus.APPROVED).map(t => {
                          const user = db.getUser(t.userId);
                          return (
                            <tr key={t.id} className="group hover:bg-slate-50/40 transition-colors">
                              <td className="px-5 py-2.5 align-middle">
                                <p className="text-[9px] font-bold text-slate-400">
                                  {toBengaliNumber(t.date)}
                                </p>
                              </td>
                              <td className="px-2 py-2.5 align-middle">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                    {user?.profilePic ? (
                                      <img src={user.profilePic} className="w-full h-full object-cover" />
                                    ) : (
                                      <UserIcon className="w-4 h-4 m-2.5 text-slate-300" />
                                    )}
                                  </div>
                                  <div className="overflow-hidden leading-none">
                                    <p className="text-[12px] font-black text-slate-800 uppercase italic truncate">{t.userName}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {toBengaliNumber(user?.phone?.slice(-4) || '0000')}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-2.5 text-right align-middle">
                                <p className="text-[17px] font-black text-[#0D9488] italic">৳{toBengaliNumber(t.amount.toLocaleString())}</p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
           </div>
        )}

        {activeTab === 'expense' && (
          <div className="space-y-6 animate-in fade-in max-w-lg mx-auto">
             <div className="bg-white p-8 rounded-[3rem] border shadow-xl space-y-6">
                <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">নতুন ব্যয় হিসাব</h3>
                <div className="space-y-4">
                   <input type="number" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-black text-2xl text-rose-600" placeholder="৳ 0.00" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} />
                   <input type="text" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs" placeholder="ব্যয়ের কারণ..." value={expenseReason} onChange={e => setExpenseReason(e.target.value)} />
                   
                   <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleExpenseImageChange} 
                        className="hidden" 
                        id="expense-image-upload" 
                      />
                      <label 
                        htmlFor="expense-image-upload"
                        className="w-full p-5 bg-slate-50 border-2 border-dashed rounded-[1.8rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all"
                      >
                        {expenseImage ? (
                          <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                            <img src={expenseImage} className="w-full h-full object-cover" alt="Expense proof" />
                            <button 
                              onClick={(e) => { e.preventDefault(); setExpenseImage(null); }}
                              className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-full shadow-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <LucideImageIcon className="w-8 h-8 text-slate-300" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ব্যয়ের প্রমাণপত্র / ছবি যোগ করুন</p>
                          </>
                        )}
                      </label>
                   </div>
                </div>
                <button onClick={handleAddExpense} disabled={isSubmitting} className="w-full py-5 bg-rose-600 text-white rounded-3xl font-black uppercase text-xs shadow-xl active:scale-95 border-b-4 border-rose-800">ব্যয় যোগ করুন</button>
             </div>
             <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                   <tbody className="divide-y">
                      {expenses.map(e => (
                        <tr key={e.id} className="text-[11px] font-bold hover:bg-slate-50">
                           <td className="px-6 py-4 text-slate-400">{toBengaliNumber(e.date)}</td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                 {e.reason}
                                 {e.proofImage && <LucideImageIcon className="w-3.5 h-3.5 text-teal-500" />}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-rose-600 text-right font-black">৳{toBengaliNumber(e.amount)}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-[#6366F1] to-[#4F46E5] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="p-4 bg-white/20 backdrop-blur-xl rounded-3xl shadow-inner">
                  <Lightbulb className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">পরামর্শ বক্স</h2>
                  <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest mt-1">সদস্যদের ফিডব্যাক</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="bg-white p-12 rounded-[3rem] text-center border border-dashed border-slate-300">
                  <p className="text-slate-400 font-bold">কোন পরামর্শ পাওয়া যায়নি</p>
                </div>
              ) : (
                suggestions.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xs">
                          {s.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.userName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(s.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-50">
                      <p className="text-[13px] font-bold text-slate-700 leading-relaxed italic">"{s.message}"</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-rose-600 to-pink-700 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="p-4 bg-white/20 backdrop-blur-xl rounded-3xl shadow-inner">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">অভিযোগ বক্স</h2>
                  <p className="text-xs font-bold text-rose-100 uppercase tracking-widest mt-1">সদস্যদের অভিযোগ</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {complaints.length === 0 ? (
                <div className="bg-white p-12 rounded-[3rem] text-center border border-dashed border-slate-300">
                  <p className="text-slate-400 font-bold">কোন অভিযোগ পাওয়া যায়নি</p>
                </div>
              ) : (
                complaints.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 font-black text-xs">
                          {c.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{c.userName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(c.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-rose-50/30 p-5 rounded-3xl border border-rose-50">
                      <p className="text-[13px] font-bold text-slate-700 leading-relaxed italic">"{c.message}"</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6 animate-in fade-in max-w-lg mx-auto">
             <div className="bg-white p-8 rounded-[3rem] border shadow-xl space-y-6">
                <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">নতুন প্রজেক্ট যোগ করুন</h3>
                <div className="space-y-4">
                   <input type="text" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs" placeholder="প্রজেক্টের নাম..." value={projectName} onChange={e => setProjectName(e.target.value)} />
                   <div className="grid grid-cols-2 gap-4">
                      <input type="number" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs" placeholder="লক্ষ্য অর্থ (Target)" value={projectTarget} onChange={e => setProjectTarget(e.target.value)} />
                      <input type="number" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs" placeholder="সংগৃহীত (Collected)" value={projectCollected} onChange={e => setProjectCollected(e.target.value)} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <select className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs" value={projectProgressType} onChange={e => setProjectProgressType(e.target.value as any)}>
                         <option value="Auto">অটোমেটিক (Auto)</option>
                         <option value="Manual">ম্যানুয়াল (Manual)</option>
                      </select>
                      {projectProgressType === 'Manual' && (
                        <input type="number" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs" placeholder="অগ্রগতি (%)" value={projectManualPercent} onChange={e => setProjectManualPercent(e.target.value)} />
                      )}
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <select className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs" value={projectStatus} onChange={e => setProjectStatus(e.target.value as any)}>
                         <option value="Ongoing">চলমান</option>
                         <option value="Completed">সম্পন্ন</option>
                         <option value="Pending">বাকি</option>
                      </select>
                      <input type="date" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs" value={projectDeadline} onChange={e => setProjectDeadline(e.target.value)} />
                   </div>
                </div>
                <button onClick={handleAddProject} disabled={isSubmitting} className="w-full py-5 bg-[#0D9488] text-white rounded-3xl font-black uppercase text-xs shadow-xl active:scale-95 border-b-4 border-teal-800">প্রজেক্ট যোগ করুন</button>
             </div>

             <div className="space-y-4">
                {projects.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col gap-4 group">
                     <div className="flex justify-between items-start">
                        <div>
                           <h4 className="text-sm font-black text-slate-800 italic">{p.name}</h4>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">লক্ষ্য: ৳{toBengaliNumber(p.targetAmount.toLocaleString())}</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => db.deleteProject(p.id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <span>{p.status}</span>
                        <span>{p.progressType}</span>
                     </div>
                  </div>
                ))}
                {projects.length === 0 && <div className="text-center py-20 opacity-20"><AlertCircle className="w-16 h-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest">কোন প্রজেক্ট নেই</p></div>}
             </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="p-4 bg-white/20 backdrop-blur-xl rounded-3xl shadow-inner">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">মেম্বার অ্যাক্টিভিটি</h2>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1">সদস্যদের সাম্প্রতিক কার্যক্রম</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="bg-white p-12 rounded-[3rem] text-center border border-dashed border-slate-300">
                  <p className="text-slate-400 font-bold">কোন অ্যাক্টিভিটি পাওয়া যায়নি</p>
                </div>
              ) : (
                activities.map(act => (
                  <div key={act.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      act.type === 'LOGIN' ? 'bg-emerald-50 text-emerald-600' : 
                      act.type === 'PAGE_VIEW' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {act.type === 'LOGIN' ? <LogOut className="w-5 h-5 rotate-180" /> : 
                       act.type === 'PAGE_VIEW' ? <Search className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                    </div>
                    <div className="flex-grow overflow-hidden">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-black text-slate-800 truncate">{act.userName}</p>
                        <p className="text-[9px] font-bold text-slate-400 whitespace-nowrap ml-2">
                          {new Date(act.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 truncate">{act.description}</p>
                      {act.path && <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mt-0.5">{act.path}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="space-y-6 animate-in fade-in max-w-lg mx-auto">
            <div className="bg-white p-4 rounded-3xl border shadow-sm flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="সদস্য খুঁজুন (নাম বা মোবাইল)..." 
                className="w-full outline-none font-bold text-sm" 
                value={qrSearchQuery} 
                onChange={e => setQrSearchQuery(e.target.value)} 
              />
            </div>

            <div className="space-y-4">
              {users.filter(u => u.status === UserStatus.APPROVED && (u.name.toLowerCase().includes(qrSearchQuery.toLowerCase()) || u.phone.includes(qrSearchQuery))).map(u => (
                <div key={u.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                      {u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : <UserIcon className="w-8 h-8 m-3 text-slate-300" />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800">{u.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.phone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">যোগদানের তারিখ</p>
                      {editingJoining?.userId === u.id ? (
                        <div className="flex gap-2">
                          <input 
                            type="date" 
                            className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-bold"
                            value={editingJoining.date}
                            onChange={e => setEditingJoining({ ...editingJoining, date: e.target.value })}
                          />
                          <button onClick={() => handleUpdateJoining(u.id, editingJoining.date)} className="p-2 bg-emerald-600 text-white rounded-xl"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingJoining(null)} className="p-2 bg-slate-200 text-slate-600 rounded-xl"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-700">{new Date(u.registeredAt).toISOString().split('T')[0]}</span>
                          <button onClick={() => setEditingJoining({ userId: u.id, date: new Date(u.registeredAt).toISOString().split('T')[0] })} className="text-teal-600"><Calendar className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">মেয়াদ শেষ</p>
                      {editingExpiry?.userId === u.id ? (
                        <div className="flex gap-2">
                          <input 
                            type="date" 
                            className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-bold"
                            value={editingExpiry.date}
                            onChange={e => setEditingExpiry({ ...editingExpiry, date: e.target.value })}
                          />
                          <button onClick={() => handleUpdateExpiry(u.id, editingExpiry.date)} className="p-2 bg-emerald-600 text-white rounded-xl"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingExpiry(null)} className="p-2 bg-slate-200 text-slate-600 rounded-xl"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-700">{u.expiryDate || 'নির্ধারিত নয়'}</span>
                          <button onClick={() => setEditingExpiry({ userId: u.id, date: u.expiryDate || new Date().toISOString().split('T')[0] })} className="text-rose-600"><Calendar className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-teal-50/50 p-4 rounded-3xl border border-teal-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Award className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-teal-800 uppercase tracking-widest">সাংগঠনিক আইডি কার্ড</p>
                        <p className="text-[8px] font-bold text-teal-600 uppercase tracking-widest mt-0.5">ইউজার প্রোফাইলে দেখা যাবে</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleIdCard(u.id, !!u.isIdCardEnabled)}
                      className={`w-12 h-6 rounded-full relative transition-all duration-300 ${u.isIdCardEnabled ? 'bg-teal-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${u.isIdCardEnabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-4 pt-4 border-t border-slate-100">
                    <div className="p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-inner">
                      <QRCodeSVG 
                        id={`qr-${u.id}`}
                        value={`নাম: ${u.name}\nমোবাইল: ${u.phone}\nরক্তের গ্রুপ: ${u.bloodGroup}\n\nলাইভ প্রোফাইল ও হিস্ট্রি দেখতে নিচের লিঙ্কে ক্লিক করুন:\n${window.location.origin}/#/u/${u.id}`} 
                        size={220}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                    <button 
                      onClick={() => downloadQRCode(u.id, u.name)}
                      className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-teal-200 active:scale-95 transition-all"
                    >
                      <Download className="w-4 h-4" /> কিউআর ডাউনলোড করুন
                    </button>
                    <p className="text-[9px] font-bold text-slate-400 uppercase text-center">
                      অফলাইনে নাম/মোবাইল এবং অনলাইনে লাইভ প্রোফাইল দেখার জন্য এই কিউআর কোডটি ব্যবহার করুন।
                    </p>
                  </div>
                </div>
              ))}
              {users.filter(u => u.status === UserStatus.APPROVED).length === 0 && (
                <div className="text-center py-20 opacity-20">
                  <QrCode className="w-16 h-16 mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest">কোন সদস্য নেই</p>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6 animate-in fade-in max-w-lg mx-auto">
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">কন্টাক্ট সেটিংস</p>
                <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none text-xs font-bold" placeholder="WhatsApp Group Link" value={settingsForm.whatsapp} onChange={e => setSettingsForm({...settingsForm, whatsapp: e.target.value})} />
                <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none text-xs font-bold" placeholder="Facebook Page Link" value={settingsForm.facebook} onChange={e => setSettingsForm({...settingsForm, facebook: e.target.value})} />
                <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none text-xs font-bold" placeholder="Messenger Link" value={settingsForm.messenger} onChange={e => setSettingsForm({...settingsForm, messenger: e.target.value})} />
                <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none text-xs font-bold" placeholder="Official Email" value={settingsForm.email} onChange={e => setSettingsForm({...settingsForm, email: e.target.value})} />
                <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none text-xs font-bold" placeholder="Phone Number" value={settingsForm.phone} onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})} />
                <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none text-xs font-bold" placeholder="নীতিমালা লিঙ্ক (Google Drive PDF)" value={settingsForm.policyUrl || ''} onChange={e => setSettingsForm({...settingsForm, policyUrl: e.target.value})} />
             </div>
             <button 
               onClick={handleUpdateContactConfig} 
               disabled={isSubmitting}
               className="w-full py-5 bg-[#0D9488] text-white rounded-3xl font-black uppercase text-xs shadow-lg active:scale-95 border-b-4 border-teal-800 disabled:opacity-50 disabled:scale-100"
             >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'সেটিংস সেভ করুন'}
             </button>
             <button onClick={() => db.recalculateStats()} className="w-full py-5 bg-indigo-50 text-indigo-600 rounded-3xl font-black uppercase text-[10px] flex items-center justify-center gap-3 active:scale-95 border border-indigo-100"><RefreshCw className="w-5 h-5" /> ডাটা হিসাব রিসেট করুন</button>
          </div>
        )}
      </main>

      {viewingUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 h-[94vh]">
              <div className="relative bg-[#0D9488] pt-10 pb-12 px-8 text-center shrink-0">
                 <div className="absolute top-6 left-6">
                    <button onClick={() => setViewingUser(null)} className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md text-white active:scale-90 transition-all">
                       <X className="w-5 h-5" />
                    </button>
                 </div>
                 <div className="absolute top-6 right-6">
                    <button className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md text-white active:scale-90 transition-all">
                       <Download className="w-5 h-5" />
                    </button>
                 </div>
                 <div className="flex flex-col items-center">
                    <div className="w-28 h-28 rounded-3xl bg-white p-1 mb-4 shadow-2xl relative overflow-hidden border-4 border-white/20">
                       {viewingUser.profilePic ? <img src={viewingUser.profilePic} className="w-full h-full object-cover rounded-2xl" /> : <UserIcon className="w-12 h-12 m-7 text-slate-200" />}
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">{viewingUser.name}</h2>
                    <p className="text-[11px] font-bold text-teal-50 uppercase tracking-[0.1em] mt-1 opacity-90">সদস্য আইডি: {toBengaliNumber(viewingUser.phone.slice(-4))}</p>
                    
                    <div className="flex items-center justify-center gap-4 mt-4 text-white/90">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <Phone className="w-3.5 h-3.5" /> {toBengaliNumber(viewingUser.phone)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <MapPin className="w-3.5 h-3.5" /> {viewingUser.address?.district || '—'}
                      </div>
                    </div>
                 </div>
              </div>

              <div className="flex-grow overflow-y-auto bg-[#F8FAFC] p-6 space-y-5 no-scrollbar">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                       <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Briefcase className="w-4 h-4" /></div>
                       <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">পেশা</p>
                         <p className="text-[11px] font-black text-slate-800 truncate max-w-[80px]">{viewingUser.profession}</p>
                       </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                       <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign className="w-4 h-4" /></div>
                       <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">মোট দান</p>
                         <p className="text-[11px] font-black text-slate-800">৳{toBengaliNumber(viewingUser.totalDonation || 0)}</p>
                       </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                       <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><RefreshCw className="w-4 h-4" /></div>
                       <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">লেনদেন</p>
                         <p className="text-[11px] font-black text-slate-800">{toBengaliNumber(viewingUser.transactionCount || 0)} টি</p>
                       </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                       <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Calendar className="w-4 h-4" /></div>
                       <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">যোগদান</p>
                         <p className="text-[11px] font-black text-slate-800">{new Date(viewingUser.registeredAt).toLocaleDateString('bn-BD')}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">স্থায়ী ঠিকানা</p>
                    </div>
                    <p className="text-[12px] font-bold text-slate-800">
                      {viewingUser.address?.village}, {viewingUser.address?.ward} নং ওয়ার্ড, {viewingUser.address?.union}, {viewingUser.address?.upazila}, {viewingUser.address?.district}।
                    </p>
                 </div>

                  <div className="bg-amber-50/50 p-5 rounded-[2.5rem] border border-amber-100 flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-white rounded-2xl shadow-sm">
                           <Award className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest leading-none">স্থায়ী সদস্য</p>
                           <p className="text-[8px] font-bold text-amber-600 uppercase tracking-widest mt-1">হোমপেজে প্রদর্শিত হবে</p>
                        </div>
                     </div>
                     <button 
                        onClick={handleTogglePermanentMember}
                        disabled={isSubmitting}
                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${viewingUser.isPermanentMember ? 'bg-amber-500' : 'bg-slate-200'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${viewingUser.isPermanentMember ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>

                 <div className="bg-teal-50/50 p-5 rounded-[2.5rem] border border-teal-100 space-y-3">
                     <div className="flex items-center gap-2 ml-1">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <p className="text-[10px] font-black text-teal-800 uppercase tracking-widest">সদস্য পদবী (Designation)</p>
                    </div>
                    <div className="flex gap-2">
                       <input type="text" className="flex-grow p-4 bg-white border border-teal-100 rounded-2xl outline-none text-[12px] font-bold shadow-sm" placeholder="যেমন: চেয়ারম্যান, সদস্য..." value={userDesignation} onChange={e => setUserDesignation(e.target.value)} />
                       <button onClick={handleUpdateDesignation} disabled={isSubmitting} className="p-4 bg-teal-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center">
                         {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                       </button>
                    </div>
                 </div>

                 <div className="bg-indigo-50/50 p-5 rounded-[2.5rem] border border-indigo-100 space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                      <MessageCircle className="w-4 h-4 text-indigo-600" />
                      <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">বার্তা পাঠান</p>
                    </div>
                    <div className="flex gap-2">
                       <input type="text" className="flex-grow p-4 bg-white border border-indigo-100 rounded-2xl outline-none text-[12px] font-bold shadow-sm" placeholder="বার্তা লিখুন..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} />
                       <button onClick={handleSendMessage} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all"><Send className="w-5 h-5" /></button>
                    </div>
                 </div>

                 <div className="bg-emerald-50/50 p-5 rounded-[2.5rem] border border-emerald-100 space-y-4">
                    <div className="flex items-center gap-2 ml-1">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">ফান্ড যোগ করুন</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <input type="number" className="p-4 bg-white border border-emerald-100 rounded-2xl outline-none font-black text-sm shadow-sm" placeholder="টাকা..." value={manualAmount} onChange={e => setManualAmount(e.target.value)} />
                       <input type="date" className="p-4 bg-white border border-emerald-100 rounded-2xl outline-none font-bold text-[10px] shadow-sm" value={manualDate} onChange={e => setManualDate(e.target.value)} />
                    </div>
                    <button onClick={handleAddManualFunds} className="w-full py-4 bg-[#0D9488] text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-[0.98] transition-all">টাকা যোগ করুন</button>
                 </div>

                 <button onClick={() => { if(confirm("মুছে ফেলবেন?")) { db.deleteUser(viewingUser.id); setViewingUser(null); } }} className="w-full py-4 bg-rose-50 text-rose-600 rounded-[2rem] font-black text-[10px] uppercase flex items-center justify-center gap-3 border border-rose-100 active:scale-95 transition-all">
                    <Trash2 className="w-4 h-4" /> ডিলিট মেম্বার
                 </button>
              </div>
           </div>
        </div>
      )}

      {viewingAssistance && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-8 bg-teal-600 text-white flex justify-between items-center">
                 <h3 className="font-black uppercase text-sm tracking-widest">আবেদন বিস্তারিত</h3>
                 <button onClick={() => setViewingAssistance(null)}><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">আবেদনকারীর নাম</p>
                    <p className="text-lg font-black text-slate-800">{viewingAssistance.userName}</p>
                 </div>
                 <div className="p-5 bg-slate-50 rounded-2xl border">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">আবেদনের কারণ</p>
                    <p className="text-[13px] font-bold text-slate-700 leading-relaxed italic">"{viewingAssistance.reason}"</p>
                 </div>
                 {viewingAssistance.amount > 0 && (
                   <div className="flex justify-between items-center px-4">
                      <p className="text-xs font-black text-slate-400 uppercase">প্রার্থিত অর্থ</p>
                      <p className="text-2xl font-black text-rose-600">৳{toBengaliNumber(viewingAssistance.amount.toLocaleString())}</p>
                   </div>
                 )}
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">এডমিন নোট</p>
                    <textarea className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-xs" placeholder="মতামত লিখুন..." value={adminNote} onChange={e => setAdminNote(e.target.value)} />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleUpdateStatus(viewingAssistance.id, 'assistance', AssistanceStatus.APPROVED)} className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">অ্যাপ্রুভ</button>
                    <button onClick={() => handleUpdateStatus(viewingAssistance.id, 'assistance', AssistanceStatus.REJECTED)} className="py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">রিজেক্ট</button>
                    <button onClick={() => handleUpdateStatus(viewingAssistance.id, 'assistance', AssistanceStatus.DISBURSED)} className="col-span-2 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">পেমেন্ট কমপ্লিট</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <div className="bg-white p-5 rounded-[2.5rem] border h-28 flex flex-col justify-between shadow-sm">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${color}`}>{icon}</div>
    <div className="mt-1"><p className="text-[9px] font-black text-slate-400 uppercase leading-none">{label}</p><h3 className="text-sm font-black text-slate-900 leading-none mt-2">{value}</h3></div>
  </div>
);

const SectionBox = ({ title, count, children, color }: { title: string, count: number, children?: React.ReactNode, color: string }) => (
  <div className="bg-white rounded-[3rem] border overflow-hidden shadow-sm flex flex-col">
    <div className={`p-5 ${color} text-white flex justify-between items-center shadow-inner`}><h4 className="text-[10px] font-black uppercase tracking-widest">{title}</h4><span className="text-[10px] font-black bg-black/20 px-3 py-1 rounded-full">{toBengaliNumber(count)}</span></div>
    <div className="p-4 space-y-4 bg-slate-50/10">{children}</div>
  </div>
);

export default AdminDashboard;