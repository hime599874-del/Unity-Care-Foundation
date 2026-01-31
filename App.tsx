
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('current_user_id');
    if (saved) {
      return db.getUser(saved) || null;
    }
    return null;
  });
  
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('is_admin_active') === 'true';
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('current_user_id', currentUser.id);
    } else {
      localStorage.removeItem('current_user_id');
    }
  }, [currentUser]);

  useEffect(() => {
    sessionStorage.setItem('is_admin_active', isAdmin.toString());
  }, [isAdmin]);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      if (currentUser) {
        const freshUser = db.getUser(currentUser.id);
        if (freshUser) {
          setCurrentUser(freshUser);
        } else {
          setCurrentUser(null);
        }
      }
    });
    return unsubscribe;
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isAdmin, setIsAdmin }}>
      <HashRouter>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              
              <Route path="/dashboard" element={
                currentUser?.status === UserStatus.APPROVED ? <UserDashboard /> : <Navigate to="/auth" />
              } />
              <Route path="/transaction" element={
                currentUser?.status === UserStatus.APPROVED ? <TransactionPage /> : <Navigate to="/auth" />
              } />
              <Route path="/history" element={
                currentUser?.status === UserStatus.APPROVED ? <HistoryPage /> : <Navigate to="/auth" />
              } />
              <Route path="/leaderboard" element={
                currentUser?.status === UserStatus.APPROVED ? <LeaderboardPage /> : <Navigate to="/auth" />
              } />
              <Route path="/profile" element={
                currentUser?.status === UserStatus.APPROVED ? <ProfilePage /> : <Navigate to="/auth" />
              } />
              <Route path="/expenses" element={
                currentUser?.status === UserStatus.APPROVED ? <ExpensePage /> : <Navigate to="/auth" />
              } />

              <Route path="/admin-auth" element={isAdmin ? <Navigate to="/admin-dashboard" /> : <AdminAuth />} />
              <Route path="/admin-dashboard" element={
                isAdmin ? <AdminDashboard /> : <Navigate to="/admin-auth" />
              } />
            </Routes>
          </main>

          <footer className="py-2 text-center bg-gray-50 border-t">
            <Link to="/admin-auth" className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors">
              Admin Access
            </Link>
          </footer>
        </div>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
