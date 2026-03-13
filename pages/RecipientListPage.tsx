
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { RecipientInfo } from '../types';
import { Heart, ArrowLeft, Search, User as UserIcon, MapPin, Phone, Calendar, DollarSign, Info, Edit, Loader2 } from 'lucide-react';
import { useAuth } from '../App';

const RecipientListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [recipients, setRecipients] = useState<RecipientInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await db.whenReady();
      setRecipients(db.getRecipients().sort((a, b) => b.timestamp - a.timestamp));
      setIsLoading(false);
    };
    init();

    const unsubscribe = db.subscribe(() => {
      setRecipients(db.getRecipients().sort((a, b) => b.timestamp - a.timestamp));
    });
    return unsubscribe;
  }, []);

  const toBengaliNumber = (n: string | number) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return n.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
  };

  const filteredRecipients = recipients.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.phone.includes(searchQuery) ||
    r.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Hind_Siliguri'] pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-14 pb-6 sticky top-0 z-30 shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 text-slate-600 rounded-2xl active:scale-95 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">গৃহীতার তথ্য</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">সাহায্য প্রাপ্তদের তালিকা</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..." 
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-rose-100 rounded-2xl outline-none font-bold text-sm transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">তথ্য লোড হচ্ছে...</p>
          </div>
        ) : filteredRecipients.length === 0 ? (
          <div className="bg-white p-12 rounded-[3rem] text-center border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold">কোন তথ্য পাওয়া যায়নি</p>
          </div>
        ) : (
          filteredRecipients.map(r => (
            <div key={r.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shrink-0 shadow-inner">
                    <UserIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-800 leading-tight">{r.name}</h4>
                      {r.donationNo && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black rounded-full uppercase tracking-widest">
                          #{toBengaliNumber(r.donationNo)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{toBengaliNumber(r.phone)}</p>
                    </div>
                  </div>
                </div>
                {currentUser?.canManageRecipients && (
                  <button 
                    onClick={() => navigate(`/admin-dashboard?tab=recipients&edit=${r.id}`)} 
                    className="p-3 bg-blue-50 text-blue-600 rounded-2xl active:scale-90 transition-all shadow-sm"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-3 h-3 text-rose-500" />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">সাহায্যের পরিমাণ</p>
                  </div>
                  <p className="text-lg font-black text-rose-600 leading-none">৳{toBengaliNumber(r.amount.toLocaleString())}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3 h-3 text-teal-500" />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">প্রদানের তারিখ</p>
                  </div>
                  <p className="text-sm font-black text-slate-700 leading-none">{toBengaliNumber(r.date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">পরিবারের সদস্য</p>
                  <p className="text-xs font-bold text-slate-600">{toBengaliNumber(r.familyMembers || 0)} জন</p>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">উপার্জনকারী</p>
                  <p className="text-xs font-bold text-slate-600">{toBengaliNumber(r.earningMembers || 0)} জন</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-3xl border border-slate-50">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ঠিকানা</p>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                      {r.village ? `${r.village}, ` : ''}
                      {r.wardNo ? `ওয়ার্ড: ${toBengaliNumber(r.wardNo)}, ` : ''}
                      {r.holdingNo ? `হোল্ডিং: ${toBengaliNumber(r.holdingNo)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-rose-50/30 rounded-3xl border border-rose-50">
                  <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-0.5">সাহায্যের কারণ</p>
                    <p className="text-[12px] font-bold text-slate-700 leading-relaxed italic">"{r.reason}"</p>
                  </div>
                </div>
              </div>

              {(r.witness1?.name || r.witness2?.name) && (
                <div className="pt-2 border-t border-slate-50">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 text-center">উপস্থিত সদস্য (সাক্ষী)</p>
                  <div className="flex gap-2">
                    {r.witness1?.name && (
                      <div className="flex-1 bg-slate-50/30 p-2 rounded-xl text-center">
                        <p className="text-[9px] font-bold text-slate-700 truncate">{r.witness1.name}</p>
                        <p className="text-[7px] font-medium text-slate-400">{toBengaliNumber(r.witness1.phone)}</p>
                      </div>
                    )}
                    {r.witness2?.name && (
                      <div className="flex-1 bg-slate-50/30 p-2 rounded-xl text-center">
                        <p className="text-[9px] font-bold text-slate-700 truncate">{r.witness2.name}</p>
                        <p className="text-[7px] font-medium text-slate-400">{toBengaliNumber(r.witness2.phone)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecipientListPage;
