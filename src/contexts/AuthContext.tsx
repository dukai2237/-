
"use client";
import type { User } from '@/lib/types';
import type { Dispatch, SetStateAction } from 'react';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isSubscribed: (mangaId: string) => boolean;
  subscribe: (mangaId: string, mangaTitle: string) => void;
  viewingHistory: Map<string, { chapterId: string, pageIndex: number, date: Date }>; // mangaId -> {chapterId, pageIndex}
  updateViewingHistory: (mangaId: string, chapterId: string, pageIndex: number) => void;
  getViewingHistory: (mangaId: string) => { chapterId: string, pageIndex: number, date: Date } | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for login
const MOCK_USER_VALID: User = { id: 'user-123', email: 'test@example.com', name: 'Test User', avatarUrl: 'https://picsum.photos/100/100?random=user' };


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  const [viewingHistory, setViewingHistory] = useState<Map<string, { chapterId: string, pageIndex: number, date: Date }>>(new Map());
  const { toast } = useToast();

  // Load state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const storedSubscriptions = localStorage.getItem('authSubscriptions');
    if (storedSubscriptions) {
      setSubscriptions(new Set(JSON.parse(storedSubscriptions)));
    }
    const storedViewingHistory = localStorage.getItem('authViewingHistory');
    if (storedViewingHistory) {
      try {
        const parsedHistory = JSON.parse(storedViewingHistory);
        // Ensure dates are properly parsed back into Date objects
        const historyMap = new Map<string, { chapterId: string, pageIndex: number, date: Date }>();
        if (Array.isArray(parsedHistory)) {
          parsedHistory.forEach(([key, value]) => {
            if (value && typeof value === 'object' && value.date) {
              historyMap.set(key, { ...value, date: new Date(value.date) });
            }
          });
        }
        setViewingHistory(historyMap);
      } catch (e) {
        console.error("Failed to parse viewing history from localStorage", e);
        setViewingHistory(new Map());
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('authSubscriptions', JSON.stringify(Array.from(subscriptions)));
  }, [subscriptions]);
  
  useEffect(() => {
    localStorage.setItem('authViewingHistory', JSON.stringify(Array.from(viewingHistory.entries())));
  }, [viewingHistory]);


  const login = (userData: User) => {
    setUser(userData);
    toast({ title: "Login Successful", description: `Welcome back, ${userData.name}!` });
  };

  const logout = () => {
    setUser(null);
    // setSubscriptions(new Set()); // Optionally clear subscriptions on logout, or keep them if user logs back in
    localStorage.removeItem('authUser'); // Clear user from local storage
    toast({ title: "Logout Successful", description: "You have been logged out." });
  }

  const isSubscribed = (mangaId: string) => subscriptions.has(mangaId);

  const subscribe = (mangaId: string, mangaTitle: string) => {
    if (user) {
      setSubscriptions(prev => {
        const newSubs = new Set(prev);
        if (newSubs.has(mangaId)) {
          // Already subscribed, maybe offer unsubscribe? For now, just a message.
          toast({ title: "Already Subscribed", description: `You are already subscribed to ${mangaTitle}.` });
          return newSubs;
        }
        newSubs.add(mangaId);
        toast({ title: "Subscription Successful!", description: `You've subscribed to ${mangaTitle}.` });
        return newSubs;
      });
    } else {
      toast({
        title: "Login Required",
        description: "Please log in to subscribe to manga.",
        variant: "destructive",
      });
    }
  };

  const updateViewingHistory = (mangaId: string, chapterId: string, pageIndex: number) => {
    setViewingHistory(prev => new Map(prev).set(mangaId, { chapterId, pageIndex, date: new Date() }));
  };

  const getViewingHistory = (mangaId: string) => {
    return viewingHistory.get(mangaId);
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, isSubscribed, subscribe, viewingHistory, updateViewingHistory, getViewingHistory }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { MOCK_USER_VALID };

