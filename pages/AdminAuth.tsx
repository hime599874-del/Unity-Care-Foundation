
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

const AdminAuth: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { setIsAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '0000') {
      setIsAdmin(true);
      navigate('/admin-dashboard');
    } else {
      setError('ভুল পিন কোড। আবার চেষ্টা করুন।');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
      <div className="w-full max-w-xs bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 text-center">
        <div className="bg-teal-600 p-4 rounded-3xl w-fit mx-auto mb-6 shadow-lg shadow-teal-100">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-slate-800 text-xl font-black mb-1">এডমিন প্রবেশ</h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Secure Access Only</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoFocus
              placeholder="••••"
              className="w-full text-center tracking-[0.5em] text-3xl font-black bg-slate-50 border border-slate-200 rounded-2xl p-4 text-teal-600 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all placeholder:text-slate-200"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-100 py-2 px-4 rounded-xl">
              <p className="text-red-500 text-[10px] font-bold">{error}</p>
            </div>
          )}
          
          <button
            type="submit"
            className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-sm hover:bg-teal-700 shadow-xl shadow-teal-100 active:scale-95 transition-all"
          >
            প্রবেশ করুন
          </button>
        </form>

        <button 
          onClick={() => navigate('/')}
          className="mt-8 flex items-center justify-center gap-2 text-slate-400 hover:text-teal-600 transition-colors text-[10px] font-black uppercase tracking-widest w-full"
        >
          <ArrowLeft className="w-3 h-3" /> মূল পাতায় ফিরে যান
        </button>
      </div>
    </div>
  );
};

export default AdminAuth;
