import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserStatus } from '../types';
import { db } from './db';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  adminUser: User | null;
  setAdminUser: (user: User | null) => void;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setCurrentUserPersisted = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('current_user_id', user.id);
    } else {
      localStorage.removeItem('current_user_id');
    }
  };

  const setAdminUserPersisted = (user: User | null) => {
    setAdminUser(user);
    if (user) {
      localStorage.setItem('admin_user_id', user.id);
    } else {
      localStorage.removeItem('admin_user_id');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Wait for database to sync initial data
        await db.whenReady();
        
        const userId = localStorage.getItem('current_user_id');
        if (userId) {
          const user = db.getUser(userId);
          if (user) {
            setCurrentUser(user);
          }
        }

        const adminId = localStorage.getItem('admin_user_id');
        if (adminId === 'admin') {
          const mockAdmin: User = {
            id: 'admin',
            name: 'Admin',
            phone: '00000000000',
            birthYear: 2000,
            bloodGroup: 'O+',
            location: 'Bangladesh',
            address: { district: '', upazila: '', union: '', ward: '', village: '' },
            profession: 'Admin',
            interests: [],
            isStudent: false,
            isVolunteerInterested: false,
            policyConsent: true,
            status: UserStatus.APPROVED,
            totalDonation: 0,
            yearlyDonation: 0,
            transactionCount: 0,
            registeredAt: Date.now(),
            designation: 'Admin'
          };
          setAdminUser(mockAdmin);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (!currentUser || isLoading) return;

    const unsubscribe = db.subscribe(() => {
      const updatedUser = db.getUser(currentUser.id);
      if (updatedUser) {
        // Update local state if database record changed
        if (JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
          setCurrentUser(updatedUser);
        }
      } else {
        // User was removed from database, log them out
        setCurrentUserPersisted(null);
      }
    });

    return unsubscribe;
  }, [currentUser?.id, isLoading]);

  const isAdmin = adminUser?.designation === 'Admin' || 
                  currentUser?.designation === 'Admin' || 
                  currentUser?.canManageRecipients === true;

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      setCurrentUser: setCurrentUserPersisted, 
      adminUser,
      setAdminUser: setAdminUserPersisted,
      isAdmin, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
