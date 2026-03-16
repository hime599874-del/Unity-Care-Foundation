import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { db } from './db';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setCurrentUserPersisted = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('current_user_id', user.id);
    } else {
      localStorage.removeItem('current_user_id');
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

  const isAdmin = currentUser?.designation === 'Admin' || currentUser?.canManageRecipients === true;

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser: setCurrentUserPersisted, isAdmin, isLoading }}>
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
