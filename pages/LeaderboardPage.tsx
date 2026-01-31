
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { User } from '../types';
import { ArrowLeft, Trophy, Medal, Crown, Hash, Shield } from 'lucide-react';

const LeaderboardPage: React.FC = () => {
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTop = () => {
      const users = db.getUsers().sort((a, b) => b.totalDonation - a.totalDonation);
      setTopUsers(users);
    };
    fetchTop();
    const unsubscribe = db.subscribe(fetchTop);
    return unsubscribe;
  }, []);

  // Helper function to convert English numbers to Bengali numerals
  const toBengaliNumber = (num: number | string) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-['Hind_Siliguri']">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-md z-10">
        <button onClick={() => navigate('/dashboard')} className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 border border-slate-100 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-gray-800 tracking-tight">সেরা দাতা</h1>
        <div className="w-11"></div>
      </div>

      <div className="p-6">
        {/* Top 1 Highlight Card - Private View */}
        {topUsers.length > 0 && (
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-8 rounded-[2.5rem] shadow-2xl shadow-teal-100 mb-8 relative overflow-hidden text-white">
            <Crown className="absolute right-[-20px] top-[-20px] w-40 h-40 text-white/10 -rotate-12" />
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-3xl backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/20">
                 <Shield className="w-10 h-10 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-100 mb-2">শীর্ষ দাতা (গোপনীয়)</p>
              <h2 className="text-3xl font-black mb-4 italic premium-text">
                সদস্য আইডি: {toBengaliNumber(topUsers[0].phone.slice(-4))}
              </h2>
              <div className="bg-white/10 inline-block px-6 py-3 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-100 mb-1">মোট অনুদান</p>
                <p className="text-3xl font-black premium-text">৳{toBengaliNumber(topUsers[0].totalDonation.toLocaleString())}</p>
              </div>
            </div>
          </div>
        )}

        {/* The List - IDs Only */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-5 bg-gray-50/50 border-b border-gray-100 flex justify-between">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">সদস্য আইডি</span>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">মোট দান</span>
          </div>
          
          <div className="divide-y divide-gray-50">
            {topUsers.map((user, index) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-5">
                  <div className="w-10 flex justify-center shrink-0">
                    {index === 0 ? <Medal className="w-7 h-7 text-yellow-500 drop-shadow-sm" /> : 
                     index === 1 ? <Medal className="w-7 h-7 text-gray-300 drop-shadow-sm" /> : 
                     index === 2 ? <Medal className="w-7 h-7 text-orange-400 drop-shadow-sm" /> : 
                     <span className="text-sm font-black text-gray-300 premium-text">{toBengaliNumber(index + 1)}</span>}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-base leading-none premium-text italic">
                      আইডি: {toBengaliNumber(user.phone.slice(-4))}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5 opacity-40">
                       <Hash className="w-3 h-3" />
                       <span className="text-[9px] font-black uppercase tracking-widest">সদস্য পদমর্যাদা</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-black text-teal-600 text-xl premium-text">
                    ৳{toBengaliNumber(user.totalDonation.toLocaleString())}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1 opacity-30">
                    <Trophy className="w-3 h-3 text-teal-600" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Verified Donor</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {topUsers.length === 0 && (
            <div className="p-20 text-center">
              <Trophy className="w-16 h-16 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">কোন তথ্য পাওয়া যায়নি</p>
            </div>
          )}
        </div>

        {/* Footer Privacy Note */}
        <div className="mt-10 bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
           <p className="text-[10px] font-bold text-blue-800 leading-relaxed text-center italic">
             "সদস্যদের গোপনীয়তা রক্ষার স্বার্থে এখানে নাম এবং ছবি প্রদর্শন করা হচ্ছে না। শুধুমাত্র চার ডিজিটের আইডি নাম্বার ব্যবহার করে আপনার অবস্থান যাচাই করুন।"
           </p>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
