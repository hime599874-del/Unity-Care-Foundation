
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserStatus, ActivityType } from '../types';
import { db } from './db';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAdmin: boolean;
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => sessionStorage.getItem('is_admin_active') === 'true');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem('current_user_id');
    
    const initApp = async () => {
      await db.whenReady();
      
      if (savedId) {
        const user = db.getUser(savedId);
        if (user && user.status === UserStatus.APPROVED) {
          setCurrentUser(user);
          db.updateLastActive(user.id);
          db.logActivity(user.id, user.name, ActivityType.LOGIN, "Entered the application");
        }
      }
      setIsLoading(false);
    };

    initApp();
    
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
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    sessionStorage.setItem('is_admin_active', isAdmin.toString());
  }, [isAdmin]);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isAdmin, setIsAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
