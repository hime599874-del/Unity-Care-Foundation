
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { User, UserStatus } from './types';
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
import AdminDashboard from './pages/AdminDashboard';
import AdminAuth from './pages/AdminAuth';
import { Heart } from 'lucide-react';

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
            // Safer comparison to avoid circular JSON error
            // Update if essential stats changed or generic refresh triggered
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

    // Initial check for session
    if (savedId) {
      const user = db.getUser(savedId);
      if (user && user.status === UserStatus.APPROVED) {
        setCurrentUser(user);
        db.updateLastActive(user.id);
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
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
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
              <Route path="/admin-auth" element={isAdmin ? <Navigate to="/admin-dashboard" replace /> : <AdminAuth />} />
              <Route path="/admin-dashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin-auth" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="py-4 text-center bg-white border-t border-slate-200 print:hidden">
            <Link to="/admin-auth" className="text-[11px] text-slate-900 hover:text-teal-600 transition-colors uppercase tracking-[0.2em] font-black">
              UNITY CARE - MANAGEMENT
            </Link>
          </footer>
        </div>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
