
import React, { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { User, UserStatus, ActivityType } from './types';
import { db } from './services/db';
import { Heart, Home, CreditCard, User as UserIcon, Loader2 } from 'lucide-react';
import { LanguageProvider, useLanguage } from './services/LanguageContext';
import { ThemeProvider } from './services/ThemeContext';

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
const RecipientManagementPage = lazy(() => import('./pages/RecipientManagementPage'));
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
  
  // Hide if not logged in, or if not on the dashboard page
  if (!currentUser || location.pathname !== '/dashboard') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-nav px-6 py-3 flex justify-around items-center z-[100] rounded-t-[2.5rem] print:hidden bottom-nav transition-colors duration-300">
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
        <Home className="w-6 h-6 no-glow" strokeWidth={2.5} />
        <span className="text-[11px] font-bold uppercase tracking-wider font-['Baloo_Da_2']">{t('home')}</span>
      </Link>
      <Link to="/transaction" className="flex flex-col items-center gap-1 -mt-12">
        <div className="w-16 h-16 bg-teal-600 dark:bg-teal-700 rounded-full flex items-center justify-center shadow-xl shadow-teal-200 dark:shadow-teal-900/40 border-4 border-white dark:border-slate-900 text-white active:scale-90 transition-all">
          <CreditCard className="w-7 h-7 no-glow" strokeWidth={2.5} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider font-['Baloo_Da_2'] text-slate-400 dark:text-slate-500">{t('donate_now')}</span>
      </Link>
      <Link to="/profile" className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
        <UserIcon className="w-6 h-6 no-glow" strokeWidth={2.5} />
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
  const { currentUser, adminUser, isAdmin, isOnline } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const showNav = currentUser && isDashboard;
  const effectiveUser = adminUser || currentUser;

  return (
    <div className="min-h-screen flex flex-col">
      {!isOnline && (
        <div className="bg-red-500 text-white text-[10px] py-1 text-center font-bold uppercase tracking-widest animate-pulse z-[200]">
          অফলাইন - ইন্টারনেট কানেকশন চেক করুন
        </div>
      )}
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
            <Route path="/manage-recipients" element={isAdmin ? <RecipientManagementPage /> : <Navigate to="/" replace />} />
            <Route path="/progress" element={currentUser ? <ProgressPage /> : <Navigate to="/" replace />} />
            <Route path="/admin-auth" element={isAdmin ? <Navigate to="/admin-dashboard" replace /> : <AdminAuth />} />
            <Route path="/admin-dashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin-auth" replace />} />
            <Route path="/u/:userId" element={<PublicProfilePage />} />
            <Route path="/verify/:transactionId" element={<VerifyInvoicePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      
      <BottomNav />

      <footer className={`py-8 text-center bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 print:hidden transition-colors duration-300 ${showNav ? 'mb-20' : ''}`}>
        <Link to="/admin-auth" className="text-[11px] text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors uppercase tracking-[0.2em] font-black">
          UNITY CARE - MANAGEMENT
        </Link>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppWrapper />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

import { motion, AnimatePresence } from 'motion/react';

const AppWrapper: React.FC = () => {
  const { isLoading, loadingStep } = useAuth();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 99) return prev;
          return prev + Math.random() * 25; // Even larger increment
        });
      }, 40); // Even faster interval
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [isLoading]);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div 
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02, filter: 'blur(5px)' }}
          transition={{ duration: 0.25, ease: "easeOut" }} // Ultra fast exit
          className="fixed inset-0 bg-[#009688] flex flex-col items-center justify-center z-[9999] overflow-hidden"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: Math.random() * window.innerHeight,
                  opacity: Math.random() * 0.3 + 0.1,
                  scale: Math.random() * 0.5 + 0.5
                }}
                animate={{ 
                  y: [null, Math.random() * -200 - 100],
                  opacity: [null, 0]
                }}
                transition={{ 
                  duration: Math.random() * 5 + 5, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 5
                }}
                className="absolute"
              >
                <Heart className="text-white/20 fill-current w-6 h-6" />
              </motion.div>
            ))}
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                damping: 15,
                delay: 0.2
              }}
              className="relative"
            >
              {/* Glow Effect */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-white blur-3xl rounded-full"
              />
              
              <div className="relative w-32 h-32 bg-white rounded-[2.8rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center overflow-hidden group">
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Heart className="w-16 h-16 text-[#009688] fill-current drop-shadow-lg" />
                </motion.div>
                
                {/* Shine Effect */}
                <motion.div 
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                />
              </div>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center"
            >
              <h1 className="text-white text-3xl font-black tracking-[0.2em] mb-2 drop-shadow-md font-['Baloo_Da_2']">
                UNITY CARE
              </h1>
              <div className="flex items-center gap-2 justify-center">
                <div className="h-[1px] w-8 bg-white/30" />
                <p className="text-white/80 text-xs font-bold uppercase tracking-[0.3em]">
                  Humanitarian
                </p>
                <div className="h-[1px] w-8 bg-white/30" />
              </div>
            </motion.div>

            {/* Progress Section */}
            <div className="mt-16 w-64">
              <div className="flex justify-between items-end mb-2">
                <motion.p 
                  key={loadingStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white/70 text-[10px] font-bold uppercase tracking-widest"
                >
                  {loadingStep}
                </motion.p>
                <p className="text-white text-[10px] font-black">
                  {Math.round(progress)}%
                </p>
              </div>
              <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                  className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                />
              </div>
              
              {progress > 80 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => window.location.reload()}
                  className="mt-6 w-full py-2 text-[10px] text-white/50 hover:text-white border border-white/20 hover:border-white/40 rounded-full transition-all uppercase tracking-widest font-bold"
                >
                  কানেকশন সমস্যা? রিলোড করুন
                </motion.button>
              )}
            </div>
          </div>

          {/* Bottom Branding */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1 }}
            className="absolute bottom-10 text-white text-[9px] font-bold tracking-[0.5em] uppercase"
          >
            Powered by Manobik Team
          </motion.div>
        </motion.div>
      ) : (
        <HashRouter>
          <AppContent />
        </HashRouter>
      )}
    </AnimatePresence>
  );
};

export default App;
