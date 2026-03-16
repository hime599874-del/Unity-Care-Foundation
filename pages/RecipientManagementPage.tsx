import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { db } from '../services/db';
import { RecipientInfo } from '../types';
import { 
  Check, X, Trash2, LayoutDashboard, 
  TrendingUp, Home,
  Loader2, User as UserIcon,
  Heart, Edit, ArrowLeft
} from 'lucide-react';

const toBengaliNumber = (num: number | string | undefined | null) => {
  if (num === undefined || num === null) return '';
  return num.toString();
};

const RecipientManagementPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [recipients, setRecipients] = useState<RecipientInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Recipient form states
  const [recipientDonationNo, setRecipientDonationNo] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientVillage, setRecipientVillage] = useState('');
  const [recipientWardNo, setRecipientWardNo] = useState('');
  const [recipientHoldingNo, setRecipientHoldingNo] = useState('');
  const [recipientFamilyMembers, setRecipientFamilyMembers] = useState('');
  const [recipientEarningMembers, setRecipientEarningMembers] = useState('');
  const [recipientReceivedBefore, setRecipientReceivedBefore] = useState(false);
  const [recipientWitness1Name, setRecipientWitness1Name] = useState('');
  const [recipientWitness1Phone, setRecipientWitness1Phone] = useState('');
  const [recipientWitness2Name, setRecipientWitness2Name] = useState('');
  const [recipientWitness2Phone, setRecipientWitness2Phone] = useState('');
  const [recipientAmount, setRecipientAmount] = useState('');
  const [recipientDate, setRecipientDate] = useState(new Date().toISOString().split('T')[0]);
  const [recipientReason, setRecipientReason] = useState('');
  const [recipientNote, setRecipientNote] = useState('');
  const [editingRecipient, setEditingRecipient] = useState<RecipientInfo | null>(null);

  const getNextDonationNo = (allRecipients: RecipientInfo[]) => {
    if (allRecipients.length === 0) return '1';
    const nos = allRecipients
      .map(r => parseInt(r.donationNo))
      .filter(n => !isNaN(n));
    if (nos.length === 0) return '1';
    return (Math.max(...nos) + 1).toString();
  };

  useEffect(() => {
    if (!currentUser?.canManageRecipients && !isAdmin) {
      navigate('/dashboard');
      return;
    }

    const refreshData = () => {
      const allRecipients = db.getRecipients().sort((a,b) => b.timestamp - a.timestamp);
      setRecipients(allRecipients);
      
      const editId = searchParams.get('edit');
      if (editId && isAdmin) {
        const recipient = allRecipients.find(r => r.id === editId);
        if (recipient) {
          handleEditRecipient(recipient);
        }
      } else {
        // Auto-fill next donation number for new entries
        setRecipientDonationNo(getNextDonationNo(allRecipients));
      }
    };

    const init = async () => {
      await db.whenReady();
      refreshData();
    };
    
    init();
    return db.subscribe(refreshData);
  }, [currentUser, isAdmin, navigate, searchParams]);

  const handleAddRecipient = async () => {
    if (!recipientName || !recipientAmount || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const amount = parseFloat(recipientAmount);
      const data = {
        donationNo: recipientDonationNo,
        name: recipientName,
        phone: recipientPhone,
        village: recipientVillage,
        wardNo: recipientWardNo,
        holdingNo: recipientHoldingNo,
        familyMembers: parseInt(recipientFamilyMembers) || 0,
        earningMembers: parseInt(recipientEarningMembers) || 0,
        date: recipientDate,
        receivedBefore: recipientReceivedBefore,
        witness1: {
          name: recipientWitness1Name,
          phone: recipientWitness1Phone
        },
        witness2: {
          name: recipientWitness2Name,
          phone: recipientWitness2Phone
        },
        amount: amount,
        reason: recipientReason,
        note: recipientNote,
        addedBy: currentUser?.name || 'Admin'
      };

      if (editingRecipient) {
        await db.updateRecipient(editingRecipient.id, data);
        alert('তথ্য সফলভাবে আপডেট করা হয়েছে।');
      } else {
        await db.addRecipient(data);
        alert('তথ্য সফলভাবে যোগ করা হয়েছে।');
      }

      resetForm();
    } catch (e) {
      alert('তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRecipientDonationNo(getNextDonationNo(recipients));
    setRecipientName('');
    setRecipientPhone('');
    setRecipientVillage('');
    setRecipientWardNo('');
    setRecipientHoldingNo('');
    setRecipientFamilyMembers('');
    setRecipientEarningMembers('');
    setRecipientReceivedBefore(false);
    setRecipientWitness1Name('');
    setRecipientWitness1Phone('');
    setRecipientWitness2Name('');
    setRecipientWitness2Phone('');
    setRecipientAmount('');
    setRecipientDate(new Date().toISOString().split('T')[0]);
    setRecipientReason('');
    setRecipientNote('');
    setEditingRecipient(null);
  };

  const handleEditRecipient = (r: RecipientInfo) => {
    if (!isAdmin) return;
    setEditingRecipient(r);
    setRecipientDonationNo(r.donationNo || '');
    setRecipientName(r.name);
    setRecipientPhone(r.phone);
    setRecipientVillage(r.village || '');
    setRecipientWardNo(r.wardNo || '');
    setRecipientHoldingNo(r.holdingNo || '');
    setRecipientFamilyMembers(r.familyMembers?.toString() || '');
    setRecipientEarningMembers(r.earningMembers?.toString() || '');
    setRecipientReceivedBefore(r.receivedBefore || false);
    setRecipientWitness1Name(r.witness1?.name || '');
    setRecipientWitness1Phone(r.witness1?.phone || '');
    setRecipientWitness2Name(r.witness2?.name || '');
    setRecipientWitness2Phone(r.witness2?.phone || '');
    setRecipientAmount(r.amount.toString());
    setRecipientDate(r.date);
    setRecipientReason(r.reason);
    setRecipientNote(r.note || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecipient = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('আপনি কি নিশ্চিত যে এই তথ্যটি মুছে ফেলতে চান?')) return;
    try {
      await db.deleteRecipient(id);
      alert('তথ্যটি সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (e) {
      alert('মুছে ফেলতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-['Baloo_Da_2'] pb-20">
      <header className="px-6 py-5 bg-white sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2.5 bg-slate-100 rounded-xl text-slate-600 active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-black uppercase leading-none">গৃহীতা ম্যানেজমেন্ট</h1>
            <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Unity Care Foundation</p>
          </div>
        </div>
        <button onClick={() => navigate('/dashboard')} className="p-3 bg-teal-50 text-teal-600 rounded-2xl active:scale-95 transition-all">
          <Home className="w-6 h-6" />
        </button>
      </header>

      <main className="p-5 max-w-lg mx-auto space-y-6">
        <div className="bg-white p-8 rounded-[3rem] border shadow-xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-2 mb-4">
            <div className="p-4 bg-rose-50 rounded-full text-rose-600 shadow-inner">
              <Heart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">ইউনিটি কেয়ার ফাউন্ডেশন</h2>
              <p className="text-xs font-bold text-rose-600">সহায়তা / অনুদান গ্রহণকারী ফরম</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ইনসাফের পথে, মানবতার সাথে</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">১️⃣ ব্যক্তিগত তথ্য</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">অনুদান নং</label>
                <input type="text" readOnly className="w-full p-5 bg-slate-100 border-2 rounded-[1.8rem] outline-none font-bold text-xs cursor-not-allowed opacity-70" placeholder="অনুদান নম্বর" value={recipientDonationNo} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">👤 পূর্ণ নাম</label>
                <input type="text" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs focus:border-rose-200 transition-all" placeholder="গৃহীতার নাম লিখুন..." value={recipientName} onChange={e => setRecipientName(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">📱 মোবাইল নম্বর</label>
                <input type="text" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs focus:border-rose-200 transition-all" placeholder="০১৭xxxxxxxx" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">📍 গ্রাম / এলাকা</label>
                <input type="text" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs focus:border-rose-200 transition-all" placeholder="গ্রাম বা এলাকার নাম..." value={recipientVillage} onChange={e => setRecipientVillage(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">🏠 ওয়ার্ড নং</label>
                  <input type="text" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs focus:border-rose-200 transition-all" placeholder="ওয়ার্ড নং" value={recipientWardNo} onChange={e => setRecipientWardNo(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">🏡 হোল্ডিং নং</label>
                  <input type="text" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs focus:border-rose-200 transition-all" placeholder="হোল্ডিং নং" value={recipientHoldingNo} onChange={e => setRecipientHoldingNo(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Section 2: Assistance Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">২️⃣ সহায়তার তথ্য</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">👨‍👩‍👧‍👦 পরিবারের সদস্য</label>
                  <input type="number" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs focus:border-rose-200 transition-all" placeholder="মোট সদস্য" value={recipientFamilyMembers} onChange={e => setRecipientFamilyMembers(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">💼 উপার্জনকারী</label>
                  <input type="number" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs focus:border-rose-200 transition-all" placeholder="উপার্জনকারী" value={recipientEarningMembers} onChange={e => setRecipientEarningMembers(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">💰 টাকার পরিমাণ</label>
                  <input type="number" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs focus:border-rose-200 transition-all" placeholder="৳০০০" value={recipientAmount} onChange={e => setRecipientAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">📅 তারিখ</label>
                  <input type="date" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs focus:border-rose-200 transition-all" value={recipientDate} onChange={e => setRecipientDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">❓ আগে সহায়তা পেয়েছেন?</label>
                <div className="flex gap-4 ml-4">
                  <button onClick={() => setRecipientReceivedBefore(true)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-bold text-xs ${recipientReceivedBefore ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${recipientReceivedBefore ? 'border-rose-500' : 'border-slate-300'}`}>
                      {recipientReceivedBefore && <div className="w-2 h-2 bg-rose-500 rounded-full"></div>}
                    </div>
                    হ্যাঁ
                  </button>
                  <button onClick={() => setRecipientReceivedBefore(false)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-bold text-xs ${!recipientReceivedBefore ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!recipientReceivedBefore ? 'border-slate-500' : 'border-slate-300'}`}>
                      {!recipientReceivedBefore && <div className="w-2 h-2 bg-slate-500 rounded-full"></div>}
                    </div>
                    না
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">সাহায্যের কারণ</label>
                <input type="text" className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs focus:border-rose-200 transition-all" placeholder="যেমন: চিকিৎসা, শিক্ষা..." value={recipientReason} onChange={e => setRecipientReason(e.target.value)} />
              </div>
            </div>

            {/* Section 3: Witnesses */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">৩️⃣ উপস্থিত সদস্য (সাক্ষী)</span>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-[2rem] border border-slate-100 space-y-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">১ম সদস্য</p>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" className="w-full p-4 bg-white border-2 rounded-2xl outline-none font-bold text-xs focus:border-rose-100 transition-all" placeholder="নাম" value={recipientWitness1Name} onChange={e => setRecipientWitness1Name(e.target.value)} />
                  <input type="text" className="w-full p-4 bg-white border-2 rounded-2xl outline-none font-bold text-xs focus:border-rose-100 transition-all" placeholder="মোবাইল" value={recipientWitness1Phone} onChange={e => setRecipientWitness1Phone(e.target.value)} />
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-[2rem] border border-slate-100 space-y-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">২য় সদস্য</p>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" className="w-full p-4 bg-white border-2 rounded-2xl outline-none font-bold text-xs focus:border-rose-100 transition-all" placeholder="নাম" value={recipientWitness2Name} onChange={e => setRecipientWitness2Name(e.target.value)} />
                  <input type="text" className="w-full p-4 bg-white border-2 rounded-2xl outline-none font-bold text-xs focus:border-rose-100 transition-all" placeholder="মোবাইল" value={recipientWitness2Phone} onChange={e => setRecipientWitness2Phone(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">অতিরিক্ত নোট (ঐচ্ছিক)</label>
              <textarea className="w-full p-5 bg-slate-50 border-2 rounded-[1.8rem] outline-none font-bold text-xs min-h-[100px] focus:border-rose-200 transition-all" placeholder="বিস্তারিত তথ্য..." value={recipientNote} onChange={e => setRecipientNote(e.target.value)} />
            </div>

            <div className="flex gap-3 pt-4">
              {editingRecipient && (
                <button 
                  onClick={resetForm} 
                  className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black uppercase text-xs active:scale-95 transition-all"
                >
                  বাতিল
                </button>
              )}
              <button 
                onClick={handleAddRecipient} 
                disabled={isSubmitting} 
                className="flex-[2] py-5 bg-rose-600 text-white rounded-3xl font-black uppercase text-xs shadow-xl active:scale-95 border-b-4 border-rose-800 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingRecipient ? 'আপডেট করুন' : 'তথ্য সেভ করুন')}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest ml-6">গৃহীতাদের তালিকা ({toBengaliNumber(recipients.length)})</h3>
          {recipients.length === 0 ? (
            <div className="bg-white p-12 rounded-[3rem] text-center border border-dashed border-slate-300">
              <p className="text-slate-400 font-bold">কোন তথ্য পাওয়া যায়নি</p>
            </div>
          ) : (
            recipients.map(r => (
              <div key={r.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-4 group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{r.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{toBengaliNumber(r.phone)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <>
                        <button onClick={() => handleEditRecipient(r)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteRecipient(r.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">পরিমাণ</p>
                    <p className="text-xs font-black text-rose-600">৳{toBengaliNumber(r.amount.toLocaleString())}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">তারিখ</p>
                    <p className="text-xs font-black text-slate-700">{toBengaliNumber(r.date)}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">কারণ</p>
                  <p className="text-[11px] font-bold text-slate-700">{r.reason}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default RecipientManagementPage;
