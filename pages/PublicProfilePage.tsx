
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { User, Transaction, TransactionStatus } from '../types';
import { 
  User as UserIcon, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Clock, 
  Award, 
  Activity, 
  ShieldCheck, 
  ArrowLeft,
  Heart,
  Droplets,
  Fingerprint
} from 'lucide-react';

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    // Real-time sync for public profile
    const unsubscribe = db.subscribe(() => {
      if (!isMounted) return;
      
      const userData = db.getUser(userId);
      
      if (userData) {
        setUser(userData);
        const userTx = db.getTransactions()
          .filter(t => t.userId === userId && t.status === TransactionStatus.APPROVED)
          .sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(userTx);
        setLoading(false);
      }
    });

    // We give it a generous 6 seconds to sync from Firestore
    // before we decide the user truly doesn't exist.
    const timeout = setTimeout(() => {
      if (isMounted) {
        const finalCheck = db.getUser(userId);
        if (!finalCheck) {
          setLoading(false);
        }
      }
    }, 6000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [userId]);

  const toBengaliNumber = (num: string | number) => {
    return num.toString();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', numberingSystem: 'latn' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-10 h-10 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">ইউজার পাওয়া যায়নি</h2>
        <p className="text-slate-500 mb-6">দুঃখিত, এই কিউআর কোডটি সঠিক নয় অথবা ইউজারটি মুছে ফেলা হয়েছে।</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-teal-200"
        >
          হোমে ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-teal-600 pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-32 bg-white rounded-3xl p-1 shadow-2xl mb-4 relative group">
            {user.profilePic ? (
              <img 
                src={user.profilePic} 
                alt={user.name} 
                className="w-full h-full object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center">
                <UserIcon className="w-16 h-16 text-slate-300" />
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg border-4 border-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{user.name}</h1>
          <p className="text-teal-100 font-bold uppercase tracking-[0.2em] text-xs">
            {user.designation || (user.isPermanentMember ? 'স্থায়ী সদস্য' : 'সাধারণ সদস্য')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 mb-6 border border-slate-100">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">মোট দান</p>
              <p className="text-lg font-bold text-teal-600 italic">৳{toBengaliNumber(user.totalDonation)}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">লেনদেন সংখ্যা</p>
              <p className="text-lg font-bold text-indigo-600 italic">{toBengaliNumber(user.transactionCount)} বার</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">মোবাইল নাম্বার</p>
                <p className="font-bold text-slate-700">{toBengaliNumber(user.phone)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ইমেইল আইডি</p>
                <p className="font-bold text-slate-700">{user.email || 'প্রদান করা হয়নি'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">রক্তের গ্রুপ</p>
                <p className="font-bold text-slate-700">{user.bloodGroup}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">বয়স</p>
                <p className="font-bold text-slate-700">{toBengaliNumber(new Date().getFullYear() - user.birthYear)} বছর</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ঠিকানা</p>
                <p className="font-bold text-slate-700 leading-relaxed">
                  {user.address.village}, {user.address.union}, {user.address.upazila}, {user.address.district}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">যোগদানের তারিখ</p>
                  <p className="text-[11px] font-bold text-slate-700">{formatDate(user.registeredAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">মেয়াদ শেষ</p>
                  <p className="text-[11px] font-bold text-rose-600">
                    {user.expiryDate ? toBengaliNumber(user.expiryDate) : 'নির্ধারিত নয়'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest px-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            লেনদেনের ইতিহাস
          </h3>
          
          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{tx.method}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{toBengaliNumber(tx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm italic">৳{toBengaliNumber(tx.amount)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-slate-200">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">কোন লেনদেনের রেকর্ড নেই</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200/50 rounded-full">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified by Unity Care</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
