import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { User, UserStatus } from './types';
import { db } from './services/db';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import UserDashboard from './pages/UserDashboard';
import TransactionPage from './pages/TransactionPage';
import HistoryPage from './pages/HistoryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import ExpensePage from './pages/ExpensePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminAuth from './pages/AdminAuth';
import { ShieldCheck, Loader2, Heart } from 'lucide-react';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('is_admin_active') === 'true';
  });

  // Initial session restoration
  useEffect(() => {
    const restoreSession = async () => {
      const savedId = localStorage.getItem('current_user_id');
      
      // Give DB a moment to initialize the first snapshot
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (savedId) {
        const user = db.getUser(savedId);
        if (user && user.status === UserStatus.APPROVED) {
          setCurrentUser(user);
        } else {
          localStorage.removeItem('current_user_id');
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  // Sync state with DB changes
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      const savedId = localStorage.getItem('current_user_id');
      if (savedId) {
        const freshUser = db.getUser(savedId);
        if (freshUser) {
          setCurrentUser(freshUser);
        } else if (currentUser) {
          setCurrentUser(null);
          localStorage.removeItem('current_user_id');
        }
      }
    });
    return unsubscribe;
  }, [currentUser]);

  // Sync admin state
  useEffect(() => {
    sessionStorage.setItem('is_admin_active', isAdmin.toString());
  }, [isAdmin]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-teal-600 flex flex-col items-center justify-center z-[9999]">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] absolute inset-0 animate-ping opacity-20"></div>
          <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center relative animate-pulse">
            <Heart className="w-12 h-12 text-teal-600 fill-current" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-white text-3xl font-black tracking-tight mb-2 premium-text">Unity Care Foundation</h1>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
            <p className="text-white/80 font-bold text-xs uppercase tracking-[0.2em]">অপেক্ষা করুন...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isAdmin, setIsAdmin }}>
      <HashRouter>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={currentUser ? <Navigate to="/dashboard" /> : <WelcomePage />} />
              <Route path="/auth" element={currentUser ? <Navigate to="/dashboard" /> : <AuthPage />} />
              
              <Route path="/dashboard" element={
                currentUser?.status === UserStatus.APPROVED ? <UserDashboard /> : <Navigate to="/" />
              } />
              <Route path="/transaction" element={
                currentUser?.status === UserStatus.APPROVED ? <TransactionPage /> : <Navigate to="/" />
              } />
              <Route path="/history" element={
                currentUser?.status === UserStatus.APPROVED ? <HistoryPage /> : <Navigate to="/" />
              } />
              <Route path="/leaderboard" element={
                currentUser?.status === UserStatus.APPROVED ? <LeaderboardPage /> : <Navigate to="/" />
              } />
              <Route path="/profile" element={
                currentUser?.status === UserStatus.APPROVED ? <ProfilePage /> : <Navigate to="/" />
              } />
              <Route path="/expenses" element={
                currentUser?.status === UserStatus.APPROVED ? <ExpensePage /> : <Navigate to="/" />
              } />

              <Route path="/admin-auth" element={isAdmin ? <Navigate to="/admin-dashboard" /> : <AdminAuth />} />
              <Route path="/admin-dashboard" element={
                isAdmin ? <AdminDashboard /> : <Navigate to="/admin-auth" />
              } />
            </Routes>
          </main>

          <footer className="py-2 text-center bg-gray-50 border-t print:hidden">
            <Link to="/admin-auth" className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors uppercase tracking-widest font-bold">
              Unity Care - Management
            </Link>
          </footer>
        </div>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;