
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { User, UserStatus, ActivityType } from './types';
import { db } from './services/db';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import UserDashboard from './pages/UserDashboard';
import TransactionPage from './pages/TransactionPage';
import AssistancePage from './pages/AssistancePage';
import HistoryPage from './pages/HistoryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import ExpensePage from './pages/ExpensePage';
import VoucherPage from './pages/VoucherPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminAuth from './pages/AdminAuth';
import ProgressPage from './pages/ProgressPage';
import PublicProfilePage from './pages/PublicProfilePage';
import { Heart, Home, CreditCard, User as UserIcon } from 'lucide-react';

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

const BottomNav: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();
  
  // Hide if not logged in, or if in admin mode, or if not on the dashboard page
  if (!currentUser || isAdmin || location.pathname !== '/dashboard') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-nav px-6 py-3 flex justify-around items-center z-[100] rounded-t-[2.5rem] print:hidden bottom-nav">
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-600 transition-colors">
        <Home className="w-6 h-6 no-glow" />
        <span className="text-[9px] font-black uppercase tracking-widest">হোম</span>
      </Link>
      <Link to="/transaction" className="flex flex-col items-center gap-1 -mt-12">
        <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center shadow-xl shadow-teal-200 border-4 border-white text-white active:scale-90 transition-all">
          <CreditCard className="w-7 h-7 no-glow" />
        </div>
        <span className="text-[9px] font-black text-teal-700 uppercase tracking-widest mt-1">দান করুন</span>
      </Link>
      <Link to="/profile" className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-600 transition-colors">
        <UserIcon className="w-6 h-6 no-glow" />
        <span className="text-[9px] font-black uppercase tracking-widest">প্রোফাইল</span>
      </Link>
    </div>
  );
};

const ActivityTracker: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (currentUser && !isAdmin) {
      const pageName = location.pathname.replace('/', '') || 'home';
      db.logActivity(
        currentUser.id,
        currentUser.name,
        ActivityType.PAGE_VIEW,
        `Accessed ${pageName} page`,
        location.pathname
      );
    }
  }, [location.pathname, currentUser, isAdmin]);

  return null;
};

const AppContent: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const showNav = currentUser && !isAdmin && isDashboard;

  return (
    <div className="min-h-screen flex flex-col">
      <main className={`flex-grow ${showNav ? 'pb-24' : ''}`}>
        <ActivityTracker />
        <Routes>
          <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <WelcomePage />} />
          <Route path="/auth" element={currentUser ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
          <Route path="/dashboard" element={currentUser ? <UserDashboard /> : <Navigate to="/" replace />} />
          <Route path="/transaction" element={currentUser ? <TransactionPage /> : <Navigate to="/" replace />} />
          <Route path="/assistance" element={currentUser ? <AssistancePage /> : <Navigate to="/" replace />} />
          <Route path="/history" element={currentUser ? <HistoryPage /> : <Navigate to="/" replace />} />
          <Route path="/leaderboard" element={currentUser ? <LeaderboardPage /> : <Navigate to="/" replace />} />
          <Route path="/profile" element={currentUser ? <ProfilePage /> : <Navigate to="/" replace />} />
          <Route path="/expenses" element={currentUser ? <ExpensePage /> : <Navigate to="/" replace />} />
          <Route path="/vouchers" element={currentUser ? <VoucherPage /> : <Navigate to="/" replace />} />
          <Route path="/progress" element={currentUser ? <ProgressPage /> : <Navigate to="/" replace />} />
          <Route path="/admin-auth" element={isAdmin ? <Navigate to="/admin-dashboard" replace /> : <AdminAuth />} />
          <Route path="/admin-dashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin-auth" replace />} />
          <Route path="/u/:userId" element={<PublicProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      <BottomNav />

      <footer className={`py-8 text-center bg-white border-t border-slate-200 print:hidden ${showNav ? 'mb-20' : ''}`}>
        <Link to="/admin-auth" className="text-[11px] text-slate-900 hover:text-teal-600 transition-colors uppercase tracking-[0.2em] font-black">
          UNITY CARE - MANAGEMENT
        </Link>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => sessionStorage.getItem('is_admin_active') === 'true');

  useEffect(() => {
    // Listen for database changes to keep the current user state updated in real-time
    const savedId = localStorage.getItem('current_user_id');
    
    const unsubscribe = db.subscribe(() => {
      if (savedId) {
        const user = db.getUser(savedId);
        if (user && user.status === UserStatus.APPROVED) {
          setCurrentUser(prevUser => {
            if (!prevUser) return user;
            const hasChanged = 
              user.totalDonation !== prevUser.totalDonation || 
              user.transactionCount !== prevUser.transactionCount ||
              user.status !== prevUser.status ||
              user.name !== prevUser.name ||
              user.profilePic !== prevUser.profilePic;

            return hasChanged ? user : prevUser;
          });
        }
      }
      if (isLoading) setIsLoading(false);
    });

    if (savedId) {
      const user = db.getUser(savedId);
      if (user && user.status === UserStatus.APPROVED) {
        setCurrentUser(user);
        db.updateLastActive(user.id);
        db.logActivity(user.id, user.name, ActivityType.LOGIN, "Entered the application");
      }
    } else {
      setIsLoading(false);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    sessionStorage.setItem('is_admin_active', isAdmin.toString());
  }, [isAdmin]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-teal-600 flex flex-col items-center justify-center z-[9999]">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center animate-pulse">
          <Heart className="w-12 h-12 text-teal-600 fill-current" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isAdmin, setIsAdmin }}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
