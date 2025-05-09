"use client";
import type { User, UserSubscription, UserInvestment, SimulatedTransaction, MangaSeries, MangaInvestor, MangaRating } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateMockMangaData, getMangaById, addMockMangaSeries as globalAddMockManga } from '@/lib/mock-data'; 

const PLATFORM_FEE_RATE = 0.10; // 10%

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isSubscribedToManga: (mangaId: string) => boolean;
  subscribeToManga: (mangaId: string, mangaTitle: string, price: number) => Promise<boolean>;
  donateToManga: (mangaId: string, mangaTitle: string, authorId: string, amount: number) => Promise<boolean>;
  investInManga: (mangaId: string, mangaTitle: string, sharesToBuy: number, pricePerShare: number, totalCost: number) => Promise<boolean>;
  rateManga: (mangaId: string, score: 1 | 2 | 3) => Promise<boolean>;
  addMangaSeries: (newMangaData: Omit<MangaSeries, 'id' | 'author' | 'publishedDate' | 'averageRating' | 'ratingCount' | 'viewCount' | 'totalRevenueFromSubscriptions' | 'totalRevenueFromDonations' | 'totalRevenueFromMerchandise' | 'investors' | 'chapters'> & { chaptersInput?: {title: string, pageCount: number}[] }) => Promise<MangaSeries | null>;
  viewingHistory: Map<string, { chapterId: string, pageIndex: number, date: Date }>;
  updateViewingHistory: (mangaId: string, chapterId: string, pageIndex: number) => void;
  getViewingHistory: (mangaId: string) => { chapterId: string, pageIndex: number, date: Date } | undefined;
  transactions: SimulatedTransaction[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// MOCK_USER_VALID will be the author of 'manga-4'
const MOCK_USER_VALID: User = { 
  id: 'user-123', 
  email: 'test@example.com', 
  name: 'Test User (Author)', 
  avatarUrl: 'https://picsum.photos/100/100?random=user',
  walletBalance: 1000, 
  subscriptions: [],
  investments: [],
  authoredMangaIds: ['manga-4'], // Designates this user as an author of manga-4
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Map<string, { chapterId: string, pageIndex: number, date: Date }>>(new Map());
  const [transactions, setTransactions] = useState<SimulatedTransaction[]>([]);
  const { toast } = useToast();

  const recordTransaction = useCallback((txData: Omit<SimulatedTransaction, 'id' | 'timestamp'>) => {
    const newTransaction: SimulatedTransaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev].slice(0, 50)); 
    console.log("Mock Transaction Recorded:", newTransaction);
  }, []);


  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({
        ...MOCK_USER_VALID, 
        ...parsedUser,
        subscriptions: parsedUser.subscriptions || [],
        investments: parsedUser.investments || [],
        authoredMangaIds: parsedUser.authoredMangaIds || (parsedUser.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.authoredMangaIds : []), // Ensure authoredMangaIds is part of mock user data
        walletBalance: parsedUser.walletBalance !== undefined ? parsedUser.walletBalance : MOCK_USER_VALID.walletBalance,
      });
    }
    const storedViewingHistory = localStorage.getItem('authViewingHistory');
    if (storedViewingHistory) {
      try {
        const parsedHistory = JSON.parse(storedViewingHistory);
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
     const storedTransactions = localStorage.getItem('authTransactions');
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }
  }, [user]);
  
  useEffect(() => {
    localStorage.setItem('authViewingHistory', JSON.stringify(Array.from(viewingHistory.entries())));
  }, [viewingHistory]);

  useEffect(() => {
    localStorage.setItem('authTransactions', JSON.stringify(transactions));
  }, [transactions]);


  const login = (userData: User) => {
    const fullUserData = { 
      ...MOCK_USER_VALID, // Base defaults
      ...userData, // User specific login data
      // Ensure authoredMangaIds are correctly merged or set if this user is the mock author
      authoredMangaIds: userData.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.authoredMangaIds : (userData.authoredMangaIds || [])
    };
    setUser(fullUserData);
    toast({ title: "Login Successful", description: `Welcome back, ${fullUserData.name}!` });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    // localStorage.removeItem('authTransactions'); // Optionally clear transactions log
    toast({ title: "Logout Successful", description: "You have been logged out." });
  }

  const isSubscribedToManga = (mangaId: string) => {
    return user?.subscriptions.some(sub => sub.mangaId === mangaId) || false;
  };

  const subscribeToManga = async (mangaId: string, mangaTitle: string, price: number): Promise<boolean> => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to subscribe.", variant: "destructive" });
      return false;
    }
    if (user.walletBalance < price) {
      toast({ title: "Insufficient Funds", description: `You need $${price.toFixed(2)} to subscribe. Your balance is $${user.walletBalance.toFixed(2)}.`, variant: "destructive" });
      return false;
    }

    setUser(prevUser => {
      if (!prevUser) return null;
      const newBalance = prevUser.walletBalance - price;
      const newSubscription: UserSubscription = { mangaId, mangaTitle, monthlyPrice: price, subscribedSince: new Date().toISOString() };
      return { ...prevUser, walletBalance: newBalance, subscriptions: [...prevUser.subscriptions, newSubscription] };
    });

    const manga = getMangaById(mangaId);
    if (manga) {
      updateMockMangaData(mangaId, { totalRevenueFromSubscriptions: (manga.totalRevenueFromSubscriptions || 0) + price });
       recordTransaction({
        type: 'subscription_payment',
        amount: price,
        userId: user.id,
        mangaId,
        description: `Subscribed to ${mangaTitle}`,
      });
      const platformCut = price * PLATFORM_FEE_RATE;
      const netAfterPlatformFee = price - platformCut;
      toast({ title: "Subscription Successful!", description: `You've subscribed to ${mangaTitle} for $${price.toFixed(2)}. 
      Conceptual: Platform takes $${platformCut.toFixed(2)}. $${netAfterPlatformFee.toFixed(2)} goes to author/investors.` });
    }
    return true;
  };
  
  const donateToManga = async (mangaId: string, mangaTitle: string, authorId: string, amount: number): Promise<boolean> => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to donate.", variant: "destructive" });
      return false;
    }
    if (amount <= 0) {
       toast({ title: "Invalid Amount", description: "Donation amount must be positive.", variant: "destructive" });
      return false;
    }
    if (user.walletBalance < amount) {
      toast({ title: "Insufficient Funds", description: `You need $${amount.toFixed(2)} to donate. Your balance is $${user.walletBalance.toFixed(2)}.`, variant: "destructive" });
      return false;
    }

    setUser(prevUser => {
      if (!prevUser) return null;
      return { ...prevUser, walletBalance: prevUser.walletBalance - amount };
    });
    
    const manga = getMangaById(mangaId);
    if (manga) {
      updateMockMangaData(mangaId, { totalRevenueFromDonations: (manga.totalRevenueFromDonations || 0) + amount });
      recordTransaction({
        type: 'donation_payment',
        amount: amount,
        userId: user.id,
        mangaId,
        authorId,
        description: `Donated to ${mangaTitle}`,
      });
      const platformCut = amount * PLATFORM_FEE_RATE;
      const netAfterPlatformFee = amount - platformCut;
      toast({ title: "Donation Successful!", description: `You've donated $${amount.toFixed(2)} to ${mangaTitle}.
      Conceptual: Platform takes $${platformCut.toFixed(2)}. $${netAfterPlatformFee.toFixed(2)} goes to author/investors.` });
    }
    return true;
  };

  const investInManga = async (mangaId: string, mangaTitle: string, sharesToBuy: number, pricePerShare: number, totalCost: number): Promise<boolean> => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to invest.", variant: "destructive" });
      return false;
    }
    const manga = getMangaById(mangaId);
    if (!manga || !manga.investmentOffer || !manga.investmentOffer.isActive) {
      toast({ title: "Investment Not Available", description: "This manga is not currently offering investment.", variant: "destructive" });
      return false;
    }
    if (manga.investmentOffer.minSubscriptionRequirement && user.subscriptions.length < manga.investmentOffer.minSubscriptionRequirement) {
      toast({ title: "Investment Requirement Not Met", description: `You need to be subscribed to at least ${manga.investmentOffer.minSubscriptionRequirement} manga series to invest. You are subscribed to ${user.subscriptions.length}.`, variant: "destructive" });
      return false;
    }
    if (user.walletBalance < totalCost) {
      toast({ title: "Insufficient Funds", description: `You need $${totalCost.toFixed(2)} to invest. Your balance is $${user.walletBalance.toFixed(2)}.`, variant: "destructive" });
      return false;
    }

    const existingInvestment = user.investments.find(inv => inv.mangaId === mangaId);
    const totalSharesOwnedAfter = (existingInvestment?.sharesOwned || 0) + sharesToBuy;

    if (manga.investmentOffer.maxSharesPerUser && totalSharesOwnedAfter > manga.investmentOffer.maxSharesPerUser) {
       toast({ title: "Share Limit Exceeded", description: `You cannot own more than ${manga.investmentOffer.maxSharesPerUser} shares for this manga.`, variant: "destructive" });
      return false;
    }
    
    const totalSharesSold = manga.investors.reduce((sum, inv) => sum + inv.sharesOwned, 0);
    if (totalSharesSold + sharesToBuy > manga.investmentOffer.totalSharesInOffer) {
      toast({ title: "Not Enough Shares", description: `Only ${manga.investmentOffer.totalSharesInOffer - totalSharesSold} shares are remaining for this offer.`, variant: "destructive"});
      return false;
    }

    setUser(prevUser => {
      if (!prevUser) return null;
      const newBalance = prevUser.walletBalance - totalCost;
      let updatedInvestments = [...prevUser.investments];
      if (existingInvestment) {
        updatedInvestments = updatedInvestments.map(inv => 
          inv.mangaId === mangaId 
          ? { ...inv, sharesOwned: inv.sharesOwned + sharesToBuy, amountInvested: inv.amountInvested + totalCost, mockCumulativeReturn: inv.mockCumulativeReturn || 0 } 
          : inv
        );
      } else {
        updatedInvestments.push({ mangaId, mangaTitle, sharesOwned: sharesToBuy, amountInvested: totalCost, investmentDate: new Date().toISOString(), mockCumulativeReturn: 0 });
      }
      return { ...prevUser, walletBalance: newBalance, investments: updatedInvestments };
    });

    const newInvestorEntry: MangaInvestor = { userId: user.id, userName: user.name, sharesOwned: sharesToBuy, totalAmountInvested: totalCost, joinedDate: new Date().toISOString() };
    const existingMangaInvestorIndex = manga.investors.findIndex(inv => inv.userId === user.id);
    let updatedMangaInvestors = [...manga.investors];
    if (existingMangaInvestorIndex !== -1) {
      const existing = updatedMangaInvestors[existingMangaInvestorIndex];
      updatedMangaInvestors[existingMangaInvestorIndex] = {
        ...existing,
        sharesOwned: existing.sharesOwned + sharesToBuy,
        totalAmountInvested: existing.totalAmountInvested + totalCost,
      };
    } else {
      updatedMangaInvestors.push(newInvestorEntry);
    }
    updateMockMangaData(mangaId, { investors: updatedMangaInvestors });
    
    recordTransaction({
        type: 'investment_payment',
        amount: totalCost,
        userId: user.id,
        mangaId,
        description: `Invested in ${sharesToBuy} shares of ${mangaTitle}`,
    });

    const platformCut = totalCost * PLATFORM_FEE_RATE; 
    const netToAuthor = totalCost - platformCut;

    toast({ title: "Investment Successful!", description: `You've invested $${totalCost.toFixed(2)} in ${mangaTitle} for ${sharesToBuy} shares.
    Conceptual: This amount (after platform fee of $${platformCut.toFixed(2)}) goes to the author. You now have a stake in future revenues.` });
    return true;
  };

  const rateManga = async (mangaId: string, score: 1 | 2 | 3): Promise<boolean> => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to rate manga.", variant: "destructive" });
      return false;
    }
    const manga = getMangaById(mangaId);
    if (!manga) {
      toast({ title: "Manga Not Found", variant: "destructive" });
      return false;
    }

    // For simplicity, we'll just update average rating and count.
    // A real system might store individual ratings.
    const currentTotalScore = (manga.averageRating || 0) * (manga.ratingCount || 0);
    const newRatingCount = (manga.ratingCount || 0) + 1;
    const newAverageRating = (currentTotalScore + score) / newRatingCount;

    updateMockMangaData(mangaId, {
      averageRating: parseFloat(newAverageRating.toFixed(2)), // Keep it to 2 decimal places
      ratingCount: newRatingCount,
    });

    recordTransaction({
      type: 'rating_update',
      amount: 0, // No monetary value
      userId: user.id,
      mangaId,
      description: `Rated ${manga.title} with score: ${score}`,
      relatedData: { score }
    });
    
    toast({ title: "Rating Submitted!", description: `You rated ${manga.title}. New average: ${newAverageRating.toFixed(1)}.` });
    return true;
  };
  
  const addMangaSeries = async (
    newMangaData: Omit<MangaSeries, 'id' | 'author' | 'publishedDate' | 'averageRating' | 'ratingCount' | 'viewCount' | 'totalRevenueFromSubscriptions' | 'totalRevenueFromDonations' | 'totalRevenueFromMerchandise' | 'investors' | 'chapters'> & { chaptersInput?: {title: string, pageCount: number}[] }
  ): Promise<MangaSeries | null> => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to create manga.", variant: "destructive" });
      return null;
    }

    const newMangaId = `manga-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const newManga: MangaSeries = {
      id: newMangaId,
      author: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        // Potentially fetch/allow author to set contactEmail and socialLinks via profile
      },
      ...newMangaData,
      chapters: (newMangaData.chaptersInput || []).map((chap, index) => ({
        id: `${newMangaId}-chapter-${index + 1}`,
        title: chap.title,
        chapterNumber: index + 1,
        // Placeholder for actual page generation logic
        pages: Array.from({ length: chap.pageCount }, (_, i) => ({
            id: `${newMangaId}-chapter-${index + 1}-page-${i + 1}`,
            imageUrl: `https://picsum.photos/800/1200?random=${newMangaId}c${index+1}p${i+1}`, // Placeholder image
            altText: `Page ${i + 1}`,
        })),
      })),
      publishedDate: new Date().toISOString(),
      averageRating: undefined,
      ratingCount: 0,
      viewCount: 0,
      totalRevenueFromSubscriptions: 0,
      totalRevenueFromDonations: 0,
      totalRevenueFromMerchandise: 0,
      investors: [],
    };

    globalAddMockManga(newManga);
    setUser(prevUser => prevUser ? ({ ...prevUser, authoredMangaIds: [...prevUser.authoredMangaIds, newManga.id] }) : null);

    toast({ title: "Manga Created!", description: `${newManga.title} has been added.` });
    return newManga;
  };


  const updateViewingHistory = (mangaId: string, chapterId: string, pageIndex: number) => {
    setViewingHistory(prev => new Map(prev).set(mangaId, { chapterId, pageIndex, date: new Date() }));
  };

  const getViewingHistory = (mangaId: string) => {
    return viewingHistory.get(mangaId);
  };


  return (
    <AuthContext.Provider value={{ 
        user, 
        login, 
        logout, 
        isSubscribedToManga, 
        subscribeToManga, 
        donateToManga,
        investInManga,
        rateManga,
        addMangaSeries,
        viewingHistory, 
        updateViewingHistory, 
        getViewingHistory,
        transactions
    }}>
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