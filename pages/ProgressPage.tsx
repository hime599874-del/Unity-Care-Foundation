import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { ProjectProgress, TransactionStatus } from '../types';
import { 
  ArrowLeft, TrendingUp, Target, Calendar, 
  CheckCircle2, Clock, AlertCircle, BarChart3,
  Users, DollarSign, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

const ProgressPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectProgress[]>([]);
  const [transactions, setTransactions] = useState(db.getTransactions());
  const [stats, setStats] = useState(db.getStats());
  const [selectedMonth, setSelectedMonth] = useState('2026-02');
  const [tempMonth, setTempMonth] = useState('2026-02');
  const navigate = useNavigate();

  useEffect(() => {
    const refreshData = () => {
      setProjects(db.getProjects());
      setTransactions(db.getTransactions());
      setStats(db.getStats());
    };
    refreshData();
    const unsubscribe = db.subscribe(refreshData);
    return unsubscribe;
  }, []);

  const handleMonthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation for YYYY-MM format
    const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (regex.test(tempMonth)) {
      const [year, month] = tempMonth.split('-').map(Number);
      // Check if it's 2026-02 or later
      if (year > 2026 || (year === 2026 && month >= 2)) {
        setSelectedMonth(tempMonth);
      } else {
        alert('অনুগ্রহ করে ২০২৬-০২ বা তার পরের তারিখ দিন।');
        setTempMonth(selectedMonth);
      }
    } else {
      alert('সঠিক ফরম্যাটে (YYYY-MM) তারিখ লিখুন। যেমন: 2026-03');
      setTempMonth(selectedMonth);
    }
  };

  const toBengaliNumber = (num: number | string) => {
    return num.toString();
  };

  const calculateProgress = (project: ProjectProgress) => {
    if (project.progressType === 'Manual') {
      return project.manualPercentage || 0;
    }
    if (project.targetAmount <= 0) return 0;
    return Math.min(Math.round((project.collectedAmount / project.targetAmount) * 100), 100);
  };

  const totalProgress = useMemo(() => {
    if (projects.length === 0) return 0;
    const sum = projects.reduce((acc, p) => acc + calculateProgress(p), 0);
    return Math.round(sum / projects.length);
  }, [projects]);

  const availableMonths = useMemo(() => {
    const months: { key: string; label: string; year: string }[] = [];
    const now = new Date();
    // Show last 12 months for quick selection
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: d.toISOString().slice(0, 7),
        label: d.toLocaleString('bn-BD', { month: 'short' }),
        year: d.getFullYear().toString()
      });
    }
    return months;
  }, []);

  const chartData = useMemo(() => {
    const monthsData: { [key: string]: number } = {};
    availableMonths.forEach(m => monthsData[m.key] = 0);

    // Also ensure selectedMonth is in chartData if not already
    if (selectedMonth && monthsData[selectedMonth] === undefined) {
      monthsData[selectedMonth] = 0;
    }

    transactions.filter(t => t.status === TransactionStatus.APPROVED).forEach(t => {
      const key = t.date.slice(0, 7);
      if (monthsData[key] !== undefined) {
        monthsData[key] += t.amount;
      }
    });

    return Object.entries(monthsData).sort().map(([key, amount]) => {
      const d = new Date(key + '-01');
      return {
        name: d.toLocaleString('bn-BD', { month: 'short' }),
        key,
        amount
      };
    });
  }, [transactions, availableMonths, selectedMonth]);

  const projectStats = useMemo(() => {
    const total = projects.length;
    if (total === 0) return [];
    const ongoing = projects.filter(p => p.status === 'Ongoing').length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const pending = projects.filter(p => p.status === 'Pending').length;

    return [
      { name: 'চলমান', value: ongoing, color: '#6366F1' },
      { name: 'সম্পন্ন', value: completed, color: '#10B981' },
      { name: 'বাকি', value: pending, color: '#F59E0B' }
    ];
  }, [projects]);

  const selectedMonthData = useMemo(() => {
    const monthTxs = transactions.filter(t => t.status === TransactionStatus.APPROVED && t.date.startsWith(selectedMonth));
    const amount = monthTxs.reduce((acc, t) => acc + t.amount, 0);
    const uniqueDonors = new Set(monthTxs.map(t => t.userId)).size;
    
    const d = new Date(selectedMonth + '-01');
    const label = isNaN(d.getTime()) ? selectedMonth : `${d.toLocaleString('bn-BD', { month: 'long' })} ${toBengaliNumber(d.getFullYear())}`;
    return { amount, label, donorCount: uniqueDonors };
  }, [transactions, selectedMonth]);

  return (
    <div className="bg-[#F4F7FA] min-h-screen pb-24 font-['Hind_Siliguri'] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-rose-500/10 rounded-full blur-[100px]"></div>

      {/* Header */}
      <div className="px-5 py-4 bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200/50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 active:scale-90 transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-none">অগ্রগতি এনালাইটিক্স</h1>
            <p className="text-[7px] font-bold text-indigo-600 uppercase tracking-[0.2em] mt-1">UCF Performance Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-[8px] font-black text-indigo-600 uppercase">{toBengaliNumber(selectedMonth.split('-')[0])}</p>
           </div>
           <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
             <Activity className="w-4 h-4 text-white" />
           </div>
        </div>
      </div>

      <div className="p-4 space-y-5 max-w-lg mx-auto relative z-10">
        {/* Manual Month Selection Input - Beautifully Styled */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">রিপোর্ট পিরিয়ড এনালাইসিস</h3>
            </div>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-200"></div>
            </div>
          </div>

          <form onSubmit={handleMonthSubmit} className="relative flex gap-2">
            <div className="relative flex-grow group">
              <input 
                type="text" 
                placeholder="YYYY-MM (যেমন: 2026-03)"
                value={tempMonth}
                onChange={(e) => setTempMonth(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Clock className="w-4 h-4 text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
              </div>
            </div>
            <button 
              type="submit"
              className="bg-gradient-to-br from-indigo-500 to-violet-700 text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 active:scale-95 transition-all"
            >
              দেখুন
            </button>
          </form>

          <div className="flex items-center gap-2 px-2">
            <div className="w-1 h-1 rounded-full bg-rose-500"></div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              এনালাইসিস শুরু: ২০২৬-০২ থেকে
            </p>
          </div>
        </motion.div>

        {/* Compact Summary Grid */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1e1e2e] p-4 rounded-3xl text-white shadow-xl flex flex-col justify-between h-28 border border-white/5"
          >
            <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">অগ্রগতি</p>
            <h2 className="text-2xl font-black italic">{toBengaliNumber(totalProgress)}%</h2>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-400" style={{ width: `${totalProgress}%` }}></div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-28"
          >
            <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Target className="w-3 h-3 text-indigo-600" />
            </div>
            <div>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">প্রজেক্ট</p>
              <p className="text-base font-black text-slate-800">{toBengaliNumber(projects.length)}টি</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-28"
          >
            <div className="w-6 h-6 bg-rose-50 rounded-lg flex items-center justify-center">
              <Users className="w-3 h-3 text-rose-600" />
            </div>
            <div>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">দাতা</p>
              <p className="text-base font-black text-slate-800">{toBengaliNumber(selectedMonthData.donorCount)}জন</p>
            </div>
          </motion.div>
        </div>

        {/* Project Distribution Chart */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6">
           <div className="w-24 h-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={projectStats}
                       innerRadius={30}
                       outerRadius={45}
                       paddingAngle={5}
                       dataKey="value"
                    >
                       {projectStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Pie>
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="flex-grow space-y-2">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">প্রজেক্ট ডিস্ট্রিবিউশন</h3>
              <div className="grid grid-cols-1 gap-1">
                 {projectStats.map(s => (
                    <div key={s.name} className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                          <span className="text-[10px] font-bold text-slate-600">{s.name}</span>
                       </div>
                       <span className="text-[10px] font-black text-slate-900">{toBengaliNumber(s.value)}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Compact Project List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em]">প্রজেক্ট স্ট্যাটাস</h3>
            <div className="w-8 h-0.5 bg-slate-200 rounded-full"></div>
          </div>

          <div className="space-y-3">
            {projects.map((project, idx) => {
              const progress = calculateProgress(project);
              const statusColors = {
                'Ongoing': 'bg-blue-50 text-blue-600',
                'Completed': 'bg-emerald-50 text-emerald-600',
                'Pending': 'bg-amber-50 text-amber-600'
              };
              const statusLabels = {
                'Ongoing': 'চলমান',
                'Completed': 'সম্পন্ন',
                'Pending': 'বাকি'
              };

              return (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-900 italic truncate max-w-[60%]">{project.name}</h4>
                    <span className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-end">
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">৳{toBengaliNumber(project.collectedAmount.toLocaleString())} / ৳{toBengaliNumber(project.targetAmount.toLocaleString())}</p>
                      <p className="text-[10px] font-black text-slate-900 italic">{toBengaliNumber(progress)}%</p>
                    </div>
                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${progress}%` }}
                        transition={{ duration: 1 }}
                        className={`h-full rounded-full bg-gradient-to-r ${project.status === 'Completed' ? 'from-emerald-400 to-emerald-600' : 'from-indigo-500 to-indigo-700'}`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em]">এনালাইসিস রেজাল্ট</h3>
            <div className="w-8 h-0.5 bg-slate-200 rounded-full"></div>
          </div>

          <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 7, fontWeight: 800, fill: '#94A3B8' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 7, fontWeight: 800, fill: '#94A3B8' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '9px' }}
                  />
                  <Bar 
                    dataKey="amount" 
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => {
                      setSelectedMonth(data.key);
                      setTempMonth(data.key);
                    }}
                    className="cursor-pointer"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.key === selectedMonth ? '#6366F1' : '#E2E8F0'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{selectedMonthData.label}ের আদায়</p>
              <p className="text-xs font-black text-slate-900 italic">৳{toBengaliNumber(selectedMonthData.amount.toLocaleString())}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
