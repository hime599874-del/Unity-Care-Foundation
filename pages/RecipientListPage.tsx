
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { RecipientInfo } from '../types';
import { Heart, ArrowLeft, Search, User as UserIcon, MapPin, Phone, Calendar, DollarSign, Info, Edit, Loader2 } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

const RecipientListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
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
    return n.toString();
  };

  const maskPhone = (phone: string) => {
    if (phone.length < 11) return toBengaliNumber(phone);
    const masked = phone.substring(0, 6) + '***' + phone.substring(phone.length - 2);
    return toBengaliNumber(masked);
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

      <div className="p-6 space-y-6">
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
            <div key={r.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
              {/* Top Section */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shrink-0 shadow-inner">
                    <UserIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-800 leading-tight">{r.name}</h4>
                      {r.donationNo && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded-full uppercase tracking-widest">
                          #{toBengaliNumber(r.donationNo.toString().padStart(2, '0'))}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <p className="text-[10px] font-bold text-slate-500 tracking-widest">{maskPhone(r.phone)}</p>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => navigate(`/manage-recipients?edit=${r.id}`)} 
                    className="p-3 bg-blue-500 text-white rounded-2xl active:scale-90 transition-all shadow-lg shadow-blue-200"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-3 h-3 text-rose-500" />
                    <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest">সাহায্যের পরিমাণ</p>
                  </div>
                  <p className="text-lg font-black text-rose-600 leading-none">{toBengaliNumber(r.amount)}</p>
                </div>
                <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">প্রদানের তারিখ</p>
                  </div>
                  <p className="text-xs font-black text-slate-700 leading-none">{toBengaliNumber(r.date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className="w-3 h-3 text-indigo-500" />
                    <p className="text-[7px] font-bold text-indigo-500 uppercase tracking-widest">পরিবারের সদস্য</p>
                  </div>
                  <p className="text-base font-black text-slate-700 leading-none">{toBengaliNumber(r.familyMembers || 0)} জন</p>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className="w-3 h-3 text-emerald-500" />
                    <p className="text-[7px] font-bold text-emerald-500 uppercase tracking-widest">উপার্জনকারী</p>
                  </div>
                  <p className="text-base font-black text-slate-700 leading-none">{toBengaliNumber(r.earningMembers || 0)} জন</p>
                </div>
              </div>

              {/* Address Section */}
              <div className="bg-blue-50/30 p-4 rounded-3xl border border-blue-100/30 flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-md">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-0.5">ঠিকানা</p>
                  <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
                    {r.village ? `${r.village}, ` : ''}
                    {r.wardNo ? `ওয়ার্ড: ${toBengaliNumber(r.wardNo)}, ` : ''}
                    {r.holdingNo ? `হোল্ডিং: ${toBengaliNumber(r.holdingNo)}` : ''}
                  </p>
                </div>
              </div>

              {/* Reason Section */}
              <div className="bg-orange-50/50 p-4 rounded-3xl border border-orange-100/50 relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-sm">
                    <Info className="w-3 h-3" />
                  </div>
                  <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest">সাহায্যের কারণ</p>
                </div>
                <div className="pl-3 border-l-2 border-orange-500/50">
                  <p className="text-[13px] font-bold text-slate-800 leading-relaxed italic">
                    “{r.reason}”
                  </p>
                </div>
                {/* Decorative dots */}
                <div className="absolute bottom-3 right-3 opacity-20">
                  <div className="grid grid-cols-3 gap-0.5">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-0.5 h-0.5 bg-orange-500 rounded-full"></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Witnesses Section */}
              {(r.witness1?.name || r.witness2?.name) && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">উপস্থিত সদস্য (সাক্ষী)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {r.witness1?.name && (
                      <div className="bg-emerald-50/30 p-2 px-3 rounded-full flex items-center gap-2 border border-emerald-100/30">
                        <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-800 truncate">{r.witness1.name}</p>
                          <p className="text-[8px] font-bold text-emerald-600">{toBengaliNumber(r.witness1.phone)}</p>
                        </div>
                      </div>
                    )}
                    {r.witness2?.name && (
                      <div className="bg-blue-50/30 p-2 px-3 rounded-full flex items-center gap-2 border border-blue-100/30">
                        <Phone className="w-3 h-3 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-800 truncate">{r.witness2.name}</p>
                          <p className="text-[8px] font-bold text-blue-600">{toBengaliNumber(r.witness2.phone)}</p>
                        </div>
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
