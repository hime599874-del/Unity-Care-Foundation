
import React, { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { User, UserStatus, ActivityType } from './types';
import { db } from './services/db';
import { Heart, Home, CreditCard, User as UserIcon, Loader2 } from 'lucide-react';
import { LanguageProvider, useLanguage } from './services/LanguageContext';

// Lazy load pages
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const TransactionPage = lazy(() => import('./pages/TransactionPage'));
const AssistancePage = lazy(() => import('./pages/AssistancePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ExpensePage = lazy(() => import('./pages/ExpensePage'));
const VoucherPage = lazy(() => import('./pages/VoucherPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminAuth = lazy(() => import('./pages/AdminAuth'));
const RecipientListPage = lazy(() => import('./pages/RecipientListPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const VerifyInvoicePage = lazy(() => import('./pages/VerifyInvoicePage'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
  </div>
);

import { AuthProvider, useAuth } from './services/AuthContext';
import { ToastProvider } from './services/ToastContext';

const BottomNav: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  
  // Hide if not logged in, or if in admin mode, or if not on the dashboard page
  if (!currentUser || isAdmin || location.pathname !== '/dashboard') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-nav px-6 py-3 flex justify-around items-center z-[100] rounded-t-[2.5rem] print:hidden bottom-nav">
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-600 transition-colors">
        <Home className="w-6 h-6 no-glow" />
        <span className="text-[11px] font-bold uppercase tracking-wider font-['Baloo_Da_2']">{t('home')}</span>
      </Link>
      <Link to="/transaction" className="flex flex-col items-center gap-1 -mt-12">
        <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center shadow-xl shadow-teal-200 border-4 border-white text-white active:scale-90 transition-all">
          <CreditCard className="w-7 h-7 no-glow" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider font-['Baloo_Da_2']">{t('donate_now')}</span>
      </Link>
      <Link to="/profile" className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-600 transition-colors">
        <UserIcon className="w-6 h-6 no-glow" />
        <span className="text-[11px] font-bold uppercase tracking-wider font-['Baloo_Da_2']">{t('profile')}</span>
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
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/recipients" element={currentUser ? <RecipientListPage /> : <Navigate to="/" replace />} />
            <Route path="/progress" element={currentUser ? <ProgressPage /> : <Navigate to="/" replace />} />
            <Route path="/admin-auth" element={isAdmin ? <Navigate to="/admin-dashboard" replace /> : <AdminAuth />} />
            <Route path="/admin-dashboard" element={isAdmin || currentUser?.canManageRecipients ? <AdminDashboard /> : <Navigate to="/admin-auth" replace />} />
            <Route path="/u/:userId" element={<PublicProfilePage />} />
            <Route path="/verify/:transactionId" element={<VerifyInvoicePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
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
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <AppWrapper />
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

const AppWrapper: React.FC = () => {
  const { isLoading } = useAuth();

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
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
