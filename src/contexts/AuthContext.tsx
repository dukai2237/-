"use client";
// src/contexts/AuthContext.tsx
import type { User, UserSubscription, UserInvestment, SimulatedTransaction, MangaSeries, MangaInvestor, Chapter, MangaPage, AuthorContactDetails } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateMockMangaData, getMangaById, addMockMangaSeries as globalAddMockManga, deleteMockMangaData as globalDeleteManga, getAuthorById as fetchAuthorDetails, modifiableMockMangaSeries } from '@/lib/mock-data';
import { MAX_WORKS_PER_CREATOR, MAX_SHARES_PER_OFFER } from '@/lib/constants'; // Added MAX_SHARES_PER_OFFER

const PLATFORM_FEE_RATE = 0.10; // 10% platform fee for all transactions benefiting an author
const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

interface ChapterInputForAdd {
  title: string;
  pages: { previewUrl: string }[]; 
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  signup: (name: string, email: string, accountType: 'user' | 'creator') => User | null;
  logout: () => void;
  isSubscribedToManga: (mangaId: string) => boolean;
  subscribeToManga: (mangaId: string, mangaTitle: string, price: number) => Promise<boolean>;
  donateToManga: (mangaId: string, mangaTitle: string, authorId: string, amount: number) => Promise<boolean>;
  investInManga: (mangaId: string, mangaTitle: string, sharesToBuy: number, pricePerShare: number, totalCost: number) => Promise<boolean>;
  rateManga: (mangaId: string, score: 1 | 2 | 3) => Promise<boolean>;
  addMangaSeries: (
    newMangaData: Omit<MangaSeries, 'id' | 'author' | 'publishedDate' | 'averageRating' | 'ratingCount' | 'viewCount' | 'totalRevenueFromSubscriptions' | 'totalRevenueFromDonations' | 'totalRevenueFromMerchandise' | 'investors' | 'chapters' | 'authorDetails' | 'lastUpdatedDate' | 'lastInvestmentDate' | 'lastSubscriptionDate'>
                  & { chaptersInput?: ChapterInputForAdd[], authorDetails?: AuthorContactDetails }
  ) => Promise<MangaSeries | null>;
  deleteMangaSeries: (mangaId: string) => Promise<boolean>;
  viewingHistory: Map<string, { chapterId: string, pageIndex: number, date: Date }>;
  updateViewingHistory: (mangaId: string, chapterId: string, pageIndex: number) => void;
  getViewingHistory: (mangaId: string) => { chapterId: string, pageIndex: number, date: Date } | undefined;
  transactions: SimulatedTransaction[];
  addFunds: (amount: number) => void;
  withdrawFunds: (amount: number) => Promise<boolean>; // Author withdrawing funds
  approveCreatorAccount: (creatorId: string) => void;
  isFavorited: (mangaId: string) => boolean;
  toggleFavorite: (mangaId: string, mangaTitle: string) => void;
  updateUserSearchHistory: (searchTerm: string) => void;
  // Conceptual: processDividendPayouts: (mangaId: string) => Promise<void>;
  // Conceptual: sellSharesOnMarket: (investmentId: string, sharesToSell: number, pricePerShare: number) => Promise<boolean>;
  // Conceptual: buySharesFromMarket: (listingId: string, sharesToBuy: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MOCK_USER_VALID: User = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test Creator',
  avatarUrl: 'https://picsum.photos/100/100?random=creator',
  walletBalance: 1000,
  subscriptions: [],
  investments: [],
  authoredMangaIds: ['manga-4'],
  accountType: 'creator',
  isApproved: true,
  ratingsGiven: {},
  favorites: [],
  searchHistory: [],
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
  }, []);


  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser) as User;
      setUser({
        ...MOCK_USER_VALID, 
        ...parsedUser, 
        accountType: parsedUser.accountType || (parsedUser.id === MOCK_USER_VALID.id ? 'creator' : 'user'),
        subscriptions: parsedUser.subscriptions || [],
        investments: parsedUser.investments || [],
        authoredMangaIds: parsedUser.authoredMangaIds || (parsedUser.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.authoredMangaIds : []),
        walletBalance: parsedUser.walletBalance !== undefined ? parsedUser.walletBalance : MOCK_USER_VALID.walletBalance,
        isApproved: parsedUser.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.isApproved : (parsedUser.accountType === 'creator' ? parsedUser.isApproved || false : undefined),
        ratingsGiven: parsedUser.ratingsGiven || {},
        favorites: parsedUser.favorites || [],
        searchHistory: parsedUser.searchHistory || [],
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
    const accountType = userData.accountType || (userData.id === MOCK_USER_VALID.id ? 'creator' : 'user');

    const fullUserData: User = {
      ...MOCK_USER_VALID,
      ...userData,
      accountType,
      authoredMangaIds: userData.id === MOCK_USER_VALID.id && MOCK_USER_VALID.authoredMangaIds
                        ? MOCK_USER_VALID.authoredMangaIds
                        : (userData.authoredMangaIds || []),
      isApproved: userData.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.isApproved : (accountType === 'creator' ? userData.isApproved || false : undefined),
      ratingsGiven: userData.ratingsGiven || {},
      favorites: userData.favorites || [],
      searchHistory: userData.searchHistory || [],
    };

    if (fullUserData.accountType === 'creator' && !fullUserData.isApproved) {
      toast({
        title: "Account Pending Approval",
        description: "Your creator account is awaiting admin approval. You cannot log in until it's approved.",
        variant: "destructive",
        duration: 7000
      });
      return;
    }

    setUser(fullUserData);
    toast({ title: "Login Successful", description: `Welcome back, ${fullUserData.name}!` });
  };

  const signup = (name: string, email: string, accountType: 'user' | 'creator'): User | null => {
    const storedUsersString = localStorage.getItem('mockUserList');
    const mockUserList: User[] = storedUsersString ? JSON.parse(storedUsersString) : [];
    if (mockUserList.some(u => u.email === email)) {
        toast({ title: "Signup Failed", description: "This email is already registered.", variant: "destructive" });
        return null;
    }

    const newUserId = `user-${Date.now()}-${Math.random().toString(16).slice(4)}`;
    const newUser: User = {
      id: newUserId,
      email,
      name,
      avatarUrl: `https://picsum.photos/100/100?random=${newUserId}`,
      walletBalance: accountType === 'creator' ? 0 : 50, // Creators start with 0, users get some mock funds
      subscriptions: [],
      investments: [],
      authoredMangaIds: [],
      accountType,
      isApproved: accountType === 'user' ? true : false, 
      ratingsGiven: {},
      favorites: [],
      searchHistory: [],
    };

    mockUserList.push(newUser);
    localStorage.setItem('mockUserList', JSON.stringify(mockUserList));

    recordTransaction({
      type: 'account_creation',
      amount: newUser.walletBalance,
      userId: newUser.id,
      description: `Account created: ${name} (${accountType}). ${accountType === 'creator' ? 'Pending approval.' : 'Initial balance: $' + newUser.walletBalance.toFixed(2)}`,
      relatedData: { accountType }
    });

    if (accountType === 'creator') {
      recordTransaction({
        type: 'creator_approval_pending',
        amount: 0,
        userId: newUser.id,
        description: `Creator ${name} account registered, awaiting approval.`,
      });
      toast({
        title: "Creator Account Registered",
        description: `Welcome, ${name}! Your creator account is registered and awaiting admin approval. You will be able to log in and publish once approved.`,
        duration: 10000
      });
      // Simulate auto-approval for the MOCK_USER_VALID email for testing
      if (email === MOCK_USER_VALID.email) {
        setTimeout(() => approveCreatorAccount(newUser.id), 2000); 
      }
    } else {
      setUser(newUser); // Automatically log in regular users
      toast({ title: "Signup Successful!", description: `Welcome, ${name}! Your account has been created.` });
    }
    return newUser;
  };

  const logout = () => {
    setUser(null);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
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
      toast({ title: "Insufficient Balance", description: `Subscription costs $${price.toFixed(2)}. Your balance is $${user.walletBalance.toFixed(2)}.`, variant: "destructive" });
      return false;
    }

    const manga = getMangaById(mangaId);
    if (!manga || !manga.author) {
      toast({ title: "Error", description: "Manga or author details not found.", variant: "destructive" });
      return false;
    }
    
    const platformCut = price * PLATFORM_FEE_RATE;
    const revenueToAuthor = price - platformCut;

    setUser(prevUser => {
      if (!prevUser) return null;
      const newBalance = prevUser.walletBalance - price;
      const newSubscription: UserSubscription = { mangaId, mangaTitle, monthlyPrice: price, subscribedSince: new Date().toISOString() };
      return { ...prevUser, walletBalance: newBalance, subscriptions: [...prevUser.subscriptions, newSubscription] };
    });
    
    updateMockMangaData(mangaId, { 
      totalRevenueFromSubscriptions: (manga.totalRevenueFromSubscriptions || 0) + revenueToAuthor, // Author gets their share
      lastSubscriptionDate: new Date().toISOString() 
    });

    recordTransaction({
      type: 'subscription_payment', amount: -price, userId: user.id, mangaId,
      description: `Subscribed to ${mangaTitle}`,
    });
    recordTransaction({
      type: 'platform_earning', amount: platformCut, mangaId, authorId: manga.author.id,
      description: `Platform fee from ${mangaTitle} subscription`,
      relatedData: { originalAmount: price }
    });
    // Author earning is implicitly part of the manga's totalRevenueFromSubscriptions now.
    // A separate author_earning transaction could be made if direct payout to author wallet happens here.
    // For simplicity, we assume revenue accrues to the manga, then author withdraws.
    
    toast({ title: "Subscription Successful!", description: `You've subscribed to ${mangaTitle} for $${price.toFixed(2)}.` });
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
      toast({ title: "Insufficient Balance", description: `Donation requires $${amount.toFixed(2)}. Your balance is $${user.walletBalance.toFixed(2)}.`, variant: "destructive" });
      return false;
    }
    
    const manga = getMangaById(mangaId);
    if (!manga || manga.author.id !== authorId) {
      toast({ title: "Error", description: "Manga or author details mismatch.", variant: "destructive" });
      return false;
    }

    const platformCut = amount * PLATFORM_FEE_RATE;
    const revenueToAuthor = amount - platformCut;

    setUser(prevUser => {
      if (!prevUser) return null;
      return { ...prevUser, walletBalance: prevUser.walletBalance - amount };
    });

    updateMockMangaData(mangaId, { totalRevenueFromDonations: (manga.totalRevenueFromDonations || 0) + revenueToAuthor });
    
    recordTransaction({
      type: 'donation_payment', amount: -amount, userId: user.id, mangaId, authorId,
      description: `Donated to ${mangaTitle}`,
    });
    recordTransaction({
      type: 'platform_earning', amount: platformCut, mangaId, authorId,
      description: `Platform fee from ${mangaTitle} donation`,
      relatedData: { originalAmount: amount }
    });

    toast({ title: "Donation Successful!", description: `You've donated $${amount.toFixed(2)} to ${mangaTitle}.` });
    return true;
  };

  const investInManga = async (mangaId: string, mangaTitle: string, sharesToBuy: number, pricePerShare: number, totalCost: number): Promise<boolean> => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to invest.", variant: "destructive" });
      return false;
    }
    const manga = getMangaById(mangaId);
    if (!manga || !manga.investmentOffer || !manga.investmentOffer.isActive) {
      toast({ title: "Investment Unavailable", description: "This manga is not currently open for investment.", variant: "destructive" });
      return false;
    }
     if (manga.investmentOffer.totalSharesInOffer > MAX_SHARES_PER_OFFER) {
      toast({ title: "Investment Error", description: `Manga shares offered (${manga.investmentOffer.totalSharesInOffer}) exceed the maximum limit of ${MAX_SHARES_PER_OFFER}.`, variant: "destructive" });
      return false;
    }
    if (manga.investmentOffer.minSubscriptionRequirement && (!user.subscriptions || user.subscriptions.length < manga.investmentOffer.minSubscriptionRequirement)) {
      toast({ title: "Investment Requirement Not Met", description: `You need to subscribe to at least ${manga.investmentOffer.minSubscriptionRequirement} manga series to invest. You have ${user.subscriptions?.length || 0} subscriptions.`, variant: "destructive", duration: 7000 });
      return false;
    }
    if (user.walletBalance < totalCost) {
      toast({ title: "Insufficient Balance", description: `Investment requires $${totalCost.toFixed(2)}. Your balance is $${user.walletBalance.toFixed(2)}.`, variant: "destructive" });
      return false;
    }

    const existingInvestment = user.investments.find(inv => inv.mangaId === mangaId);
    const totalSharesOwnedAfter = (existingInvestment?.sharesOwned || 0) + sharesToBuy;

    if (manga.investmentOffer.maxSharesPerUser && totalSharesOwnedAfter > manga.investmentOffer.maxSharesPerUser) {
       toast({ title: "Share Limit Exceeded", description: `You can own a maximum of ${manga.investmentOffer.maxSharesPerUser} shares for this manga.`, variant: "destructive" });
      return false;
    }

    const totalSharesSoldByAuthor = manga.investors.reduce((sum, inv) => sum + inv.sharesOwned, 0);
    if (totalSharesSoldByAuthor + sharesToBuy > manga.investmentOffer.totalSharesInOffer) {
      toast({ title: "Not Enough Shares", description: `Only ${manga.investmentOffer.totalSharesInOffer - totalSharesSoldByAuthor} shares are available from the author.`, variant: "destructive"});
      return false;
    }
    
    const platformCut = totalCost * PLATFORM_FEE_RATE;
    const capitalToAuthor = totalCost - platformCut;

    setUser(prevUser => {
      if (!prevUser) return null;
      const newBalance = prevUser.walletBalance - totalCost;
      let updatedInvestments = [...prevUser.investments];
      if (existingInvestment) {
        updatedInvestments = updatedInvestments.map(inv =>
          inv.mangaId === mangaId
          ? { ...inv, sharesOwned: inv.sharesOwned + sharesToBuy, amountInvested: inv.amountInvested + totalCost, totalDividendsReceived: inv.totalDividendsReceived || 0 }
          : inv
        );
      } else {
        updatedInvestments.push({ mangaId, mangaTitle, sharesOwned: sharesToBuy, amountInvested: totalCost, investmentDate: new Date().toISOString(), totalDividendsReceived: 0 });
      }
      return { ...prevUser, walletBalance: newBalance, investments: updatedInvestments };
    });

    const newInvestorEntry: MangaInvestor = { userId: user.id, userName: user.name, sharesOwned: sharesToBuy, totalAmountInvested: totalCost, joinedDate: new Date().toISOString() };
    const existingMangaInvestorIndex = manga.investors.findIndex(inv => inv.userId === user.id);
    let updatedMangaInvestors = [...manga.investors];
    if (existingMangaInvestorIndex !== -1) {
      const existing = updatedMangaInvestors[existingMangaInvestorIndex];
      updatedMangaInvestors[existingMangaInvestorIndex] = {
        ...existing, sharesOwned: existing.sharesOwned + sharesToBuy, totalAmountInvested: existing.totalAmountInvested + totalCost,
      };
    } else {
      updatedMangaInvestors.push(newInvestorEntry);
    }

    updateMockMangaData(mangaId, {
        investors: updatedMangaInvestors,
        lastInvestmentDate: new Date().toISOString(),
        investmentOffer: {
            ...manga.investmentOffer,
            totalCapitalRaised: (manga.investmentOffer.totalCapitalRaised || 0) + capitalToAuthor,
        }
    });

    recordTransaction({
        type: 'investment_payment', amount: -totalCost, userId: user.id, mangaId,
        description: `Invested in ${sharesToBuy} shares of ${mangaTitle}`,
        relatedData: { shares: sharesToBuy, pricePerShare }
    });
    recordTransaction({
        type: 'platform_earning', amount: platformCut, mangaId, authorId: manga.author.id,
        description: `Platform fee from ${mangaTitle} investment`,
        relatedData: { originalAmount: totalCost }
    });
    // The capitalToAuthor goes to the author's general ability to withdraw,
    // or contributes to the manga's production.
    // We can also add it to the author's wallet directly if desired.
    // For now, it's part of the manga's `totalCapitalRaised`.
    
    // Conceptual: Add capitalToAuthor to author's wallet if direct payout is desired.
    // For example, if MOCK_USER_VALID is the author:
    // MOCK_USER_VALID.walletBalance += capitalToAuthor; 

    toast({ title: "Investment Successful!", description: `You've invested $${totalCost.toFixed(2)} for ${sharesToBuy} shares in ${mangaTitle}.` });
    return true;
  };

  const rateManga = async (mangaId: string, score: 1 | 2 | 3): Promise<boolean> => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to rate.", variant: "destructive" });
      return false;
    }
    if (!isSubscribedToManga(mangaId)) {
      toast({ title: "Subscription Required", description: "You must be subscribed to this manga to rate it.", variant: "destructive" });
      return false;
    }
    if (user.ratingsGiven && user.ratingsGiven[mangaId]) {
      toast({ title: "Already Rated", description: "You have already rated this manga.", variant: "default" });
      return false;
    }

    const manga = getMangaById(mangaId);
    if (!manga) {
      toast({ title: "Manga Not Found", variant: "destructive" });
      return false;
    }

    const currentTotalScore = (manga.averageRating || 0) * (manga.ratingCount || 0);
    const newRatingCount = (manga.ratingCount || 0) + 1;
    const newAverageRating = (currentTotalScore + score) / newRatingCount;

    updateMockMangaData(mangaId, {
      averageRating: parseFloat(newAverageRating.toFixed(2)),
      ratingCount: newRatingCount,
    });

    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedRatingsGiven = { ...(prevUser.ratingsGiven || {}), [mangaId]: score };
      return { ...prevUser, ratingsGiven: updatedRatingsGiven };
    });

    recordTransaction({
      type: 'rating_update', amount: 0, userId: user.id, mangaId,
      description: `Rated ${manga.title} with score: ${score}`,
      relatedData: { score }
    });

    toast({ title: "Rating Submitted!", description: `You rated ${manga.title}. New average: ${newAverageRating.toFixed(1)}.` });
    return true;
  };

  const addMangaSeries = async (
    newMangaData: Omit<MangaSeries, 'id' | 'author' | 'publishedDate' | 'averageRating' | 'ratingCount' | 'viewCount' | 'totalRevenueFromSubscriptions' | 'totalRevenueFromDonations' | 'totalRevenueFromMerchandise' | 'investors' | 'chapters' | 'authorDetails' | 'lastUpdatedDate' | 'lastInvestmentDate' | 'lastSubscriptionDate'>
                  & { chaptersInput?: ChapterInputForAdd[], authorDetails?: AuthorContactDetails }
  ): Promise<MangaSeries | null> => {
    if (!user || user.accountType !== 'creator') {
      toast({ title: "Permission Denied", description: "Only creators can add new manga series.", variant: "destructive" });
      return null;
    }
    if (!user.isApproved) {
      toast({ title: "Account Not Approved", description: "Your creator account must be approved by an admin to publish manga.", variant: "destructive" });
      return null;
    }
    if (user.authoredMangaIds.length >= MAX_WORKS_PER_CREATOR) {
      toast({ title: "Limit Reached", description: `You can create a maximum of ${MAX_WORKS_PER_CREATOR} manga series.`, variant: "destructive" });
      return null;
    }
     if (newMangaData.investmentOffer && newMangaData.investmentOffer.totalSharesInOffer > MAX_SHARES_PER_OFFER) {
        toast({ title: "Invalid Investment Offer", description: `The total shares offered cannot exceed ${MAX_SHARES_PER_OFFER}.`, variant: "destructive" });
        return null;
    }


    const newMangaId = `manga-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const authorInfoForManga: MangaSeries['author'] = { id: user.id, name: user.name, avatarUrl: user.avatarUrl };
    const mangaAuthorDetails: AuthorContactDetails | undefined = newMangaData.authorDetails || { email: user.email };

    const newManga: MangaSeries = {
      id: newMangaId, author: authorInfoForManga, authorDetails: mangaAuthorDetails, ...newMangaData,
      chapters: (newMangaData.chaptersInput || []).map((chapInput, chapterIndex) => ({
        id: `${newMangaId}-chapter-${chapterIndex + 1}`, title: chapInput.title, chapterNumber: chapterIndex + 1,
        pages: chapInput.pages.map((pageInput, pageIndex) => ({
            id: `${newMangaId}-chapter-${chapterIndex + 1}-page-${pageIndex + 1}`,
            imageUrl: pageInput.previewUrl, altText: `Page ${pageIndex + 1}`,
        })),
      })),
      publishedDate: new Date().toISOString(), lastUpdatedDate: new Date().toISOString(),
      averageRating: undefined, ratingCount: 0, viewCount: 0,
      totalRevenueFromSubscriptions: 0, totalRevenueFromDonations: 0, totalRevenueFromMerchandise: 0,
      investors: [],
      investmentOffer: newMangaData.investmentOffer ? { ...newMangaData.investmentOffer, totalCapitalRaised: 0 } : undefined,
    };

    globalAddMockManga(newManga);
    setUser(prevUser => prevUser ? ({ ...prevUser, authoredMangaIds: [...prevUser.authoredMangaIds, newManga.id] }) : null);

    recordTransaction({
      type: 'manga_creation', amount: 0, userId: user.id, authorId: user.id, mangaId: newManga.id,
      description: `Creator ${user.name} added new manga: ${newManga.title}`
    });

    toast({ title: "Manga Created!", description: `${newManga.title} has been successfully added.` });
    return newManga;
  };

  const deleteMangaSeries = async (mangaId: string): Promise<boolean> => {
    if (!user || user.accountType !== 'creator') {
      toast({ title: "Permission Denied", description: "Only creators can delete manga series.", variant: "destructive" });
      return false;
    }
     if (!user.isApproved) {
      toast({ title: "Account Not Approved", description: "Your creator account must be approved to manage manga.", variant: "destructive" });
      return false;
    }
    const mangaToDelete = getMangaById(mangaId);
    if (!mangaToDelete || mangaToDelete.author.id !== user.id) {
      toast({ title: "Permission Denied", description: "You can only delete your own manga series.", variant: "destructive" });
      return false;
    }

    const hasInvestors = mangaToDelete.investors && mangaToDelete.investors.length > 0;
    const isActivelySubscribed = modifiableMockMangaSeries.some(m => m.id === mangaId && m.subscriptionPrice && m.subscriptionPrice > 0); // Simplified check

    if (hasInvestors || isActivelySubscribed) {
      const lastActivityDate = Math.max(
        new Date(mangaToDelete.publishedDate).getTime(), 
        mangaToDelete.lastInvestmentDate ? new Date(mangaToDelete.lastInvestmentDate).getTime() : 0,
        mangaToDelete.lastSubscriptionDate ? new Date(mangaToDelete.lastSubscriptionDate).getTime() : 0 
      );
      if ((Date.now() - lastActivityDate) < ONE_YEAR_IN_MS) {
        toast({
          title: "Deletion Restricted",
          description: "This manga cannot be deleted yet due to active investments or subscriptions within the last year.",
          variant: "destructive", duration: 7000,
        });
        return false;
      }
    }

    globalDeleteManga(mangaId);
    setUser(prevUser => {
      if (!prevUser) return null;
      return { ...prevUser, authoredMangaIds: prevUser.authoredMangaIds.filter(id => id !== mangaId) };
    });

    recordTransaction({
      type: 'manga_deletion', amount: 0, userId: user.id, authorId: user.id, mangaId: mangaId,
      description: `Creator ${user.name} deleted manga: ${mangaToDelete.title}`
    });
    toast({ title: "Manga Deleted", description: `${mangaToDelete.title} has been removed.` });
    return true;
  };


  const updateViewingHistory = (mangaId: string, chapterId: string, pageIndex: number) => {
    setViewingHistory(prev => new Map(prev).set(mangaId, { chapterId, pageIndex, date: new Date() }));
  };

  const getViewingHistory = (mangaId: string) => {
    return viewingHistory.get(mangaId);
  };

  const addFunds = (amount: number) => {
    if (!user) return;
    if (amount <= 0) {
      toast({ title: "Invalid Amount", description: "Deposit amount must be positive.", variant: "destructive" });
      return;
    }
    setUser(prev => prev ? ({ ...prev, walletBalance: prev.walletBalance + amount }) : null);
    recordTransaction({
      type: 'wallet_deposit', amount: amount, userId: user.id,
      description: `Wallet deposit $${amount.toFixed(2)}`
    });
    toast({ title: "Funds Added", description: `$${amount.toFixed(2)} added to your wallet.` });
  };

  const withdrawFunds = async (amountToWithdraw: number): Promise<boolean> => {
    if (!user || user.accountType !== 'creator') {
      toast({ title: "Permission Denied", description: "Only creators can withdraw funds.", variant: "destructive" });
      return false;
    }
    if (amountToWithdraw <= 0) {
      toast({ title: "Invalid Amount", description: "Withdrawal amount must be positive.", variant: "destructive" });
      return false;
    }
    if (user.walletBalance < amountToWithdraw) {
      toast({ title: "Insufficient Balance", description: `Cannot withdraw $${amountToWithdraw.toFixed(2)}. Current balance: $${user.walletBalance.toFixed(2)}.`, variant: "destructive" });
      return false;
    }

    // Check for pending dividend payouts for crowdfunded manga
    for (const mangaId of user.authoredMangaIds) {
      const manga = getMangaById(mangaId);
      if (manga?.investmentOffer?.isActive && manga.investmentOffer.dividendPayoutCycle && manga.investors.length > 0) {
        const cycleMonths = manga.investmentOffer.dividendPayoutCycle;
        // Use manga's lastDividendPayoutDate if available, otherwise use the investmentOffer's creation date (approximated by lastInvestmentDate or publishedDate)
        const lastPayoutDateForManga = manga.investmentOffer.lastDividendPayoutDate
                                      ? new Date(manga.investmentOffer.lastDividendPayoutDate)
                                      : (manga.lastInvestmentDate ? new Date(manga.lastInvestmentDate) : new Date(manga.publishedDate));
        
        const nextPayoutDueDate = new Date(lastPayoutDateForManga);
        nextPayoutDueDate.setMonth(nextPayoutDueDate.getMonth() + cycleMonths);

        if (new Date() >= nextPayoutDueDate) {
          // Conceptual: Here, we would calculate total earnings for this manga (subs, donations, merch profit)
          // Then calculate total dividends for investors.
          // For this mock, we'll just block withdrawal if a payout seems due.
          const totalEarningsForManga = (manga.totalRevenueFromSubscriptions + manga.totalRevenueFromDonations + manga.totalRevenueFromMerchandise);
          const potentialDividendPool = totalEarningsForManga * (manga.investmentOffer.sharesOfferedTotalPercent / 100);
          
          if (potentialDividendPool > 0) { // Only block if there are earnings to distribute
             toast({
              title: "Withdrawal Blocked",
              description: `Dividends for manga "${manga.title}" are due or pending calculation. Please process investor payouts before withdrawing general funds.`,
              variant: "destructive", duration: 8000,
            });
            return false;
          }
        }
      }
    }
    
    // If all checks pass
    setUser(prev => prev ? { ...prev, walletBalance: prev.walletBalance - amountToWithdraw } : null);
    recordTransaction({
      type: 'wallet_withdrawal', amount: -amountToWithdraw, userId: user.id, authorId: user.id,
      description: `Creator ${user.name} withdrew $${amountToWithdraw.toFixed(2)}`
    });
    toast({ title: "Withdrawal Processed", description: `$${amountToWithdraw.toFixed(2)} has been withdrawn. (Simulated)`});
    return true;
  };
  
  // Conceptual function for processing dividend payouts - to be fully implemented with backend logic
  // const processDividendPayouts = async (mangaId: string): Promise<void> => {
  //   if (!user || user.accountType !== 'creator') return;
  //   const manga = getMangaById(mangaId);
  //   if (!manga || !manga.investmentOffer || !manga.investmentOffer.isActive || manga.investors.length === 0) {
  //     toast({ title: "No Payout Needed", description: "This manga is not eligible for dividend payout or has no investors.", variant: "default"});
  //     return;
  //   }
  //   // 1. Calculate total earnings for this manga (subs, donations, merch profit for THIS manga)
  //   const totalMangaEarnings = manga.totalRevenueFromSubscriptions + manga.totalRevenueFromDonations + manga.totalRevenueFromMerchandise;
  //   // 2. Calculate total dividend pool based on sharesOfferedTotalPercent
  //   const totalDividendPool = totalMangaEarnings * (manga.investmentOffer.sharesOfferedTotalPercent / 100);
  //   if (totalDividendPool <= 0) {
  //     toast({ title: "No Earnings to Distribute", description: "No earnings available for dividend payout for this manga at this time.", variant: "default"});
  //      updateMockMangaData(mangaId, { investmentOffer: { ...manga.investmentOffer, lastDividendPayoutDate: new Date().toISOString() } });
  //     return;
  //   }
  //   // 3. Distribute to investors based on their sharesOwned relative to totalSharesInOffer
  //   manga.investors.forEach(investor => {
  //     const investorShareRatio = investor.sharesOwned / manga.investmentOffer!.totalSharesInOffer;
  //     const investorPayout = totalDividendPool * investorShareRatio;
  //     // Conceptual: Find investor user and update their wallet or send payout
  //     // For mock: record transaction
  //     recordTransaction({
  //       type: 'investor_payout', amount: investorPayout, userId: investor.userId, mangaId, authorId: user.id,
  //       description: `Dividend payout for ${manga.title} to ${investor.userName}`,
  //       relatedData: { shares: investor.sharesOwned, payout: investorPayout }
  //     });
  //   });
  //   // 4. Update manga's lastDividendPayoutDate
  //   updateMockMangaData(mangaId, { 
  //     investmentOffer: { ...manga.investmentOffer, lastDividendPayoutDate: new Date().toISOString() },
  //     // Reset individual manga earnings for the next cycle
  //     totalRevenueFromSubscriptions: 0, 
  //     totalRevenueFromDonations: 0, 
  //     totalRevenueFromMerchandise: 0,
  //   });
  //   toast({ title: "Dividends Processed", description: `Dividends for ${manga.title} have been conceptually distributed.`});
  // };


  const approveCreatorAccount = (creatorId: string) => {
    let userWasUpdated = false;
    if (user && user.id === creatorId && user.accountType === 'creator' && !user.isApproved) {
      setUser(prev => prev ? ({ ...prev, isApproved: true }) : null);
      toast({ title: "Creator Approved", description: `Creator ${user.name} (${user.email}) has been approved.` });
      recordTransaction({ type: 'creator_approved', amount: 0, userId: creatorId, description: `Creator ${user.name} account approved.` });
      userWasUpdated = true;
    } else { // If approving another user (e.g., by an admin, though admin role not fully implemented)
      const storedUsersString = localStorage.getItem('mockUserList');
      if (storedUsersString) {
        let mockUserList: User[] = JSON.parse(storedUsersString);
        const userIndex = mockUserList.findIndex(u => u.id === creatorId && u.accountType === 'creator' && !u.isApproved);
        if (userIndex !== -1) {
          mockUserList[userIndex].isApproved = true;
          localStorage.setItem('mockUserList', JSON.stringify(mockUserList));
          // If the currently logged-in user is the one being approved externally
          if (user && user.id === creatorId) {
             setUser(prev => prev ? ({ ...prev, isApproved: true }) : null);
          }
          toast({ title: "Creator Approved", description: `Creator account ${mockUserList[userIndex].name} has been approved.` });
          recordTransaction({ type: 'creator_approved', amount: 0, userId: creatorId, description: `Creator account ${mockUserList[userIndex].name} approved.`});
          userWasUpdated = true;
        }
      }
    }
    if (!userWasUpdated) {
        console.warn(`approveCreatorAccount: Creator ID ${creatorId} not found, already approved, or not a creator.`);
        toast({title: "Approval Action", description: `Attempted to approve creator ${creatorId}. No change or user not found.`, variant: "default"})
    }
  };

  const isFavorited = (mangaId: string) => {
    return user?.favorites?.includes(mangaId) || false;
  };

  const toggleFavorite = (mangaId: string, mangaTitle: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to favorite manga.", variant: "destructive" });
      return;
    }
    setUser(prevUser => {
      if (!prevUser) return null;
      const currentFavorites = prevUser.favorites || [];
      if (currentFavorites.includes(mangaId)) {
        toast({ title: "Removed from Favorites", description: `${mangaTitle} removed from your favorites.` });
        return { ...prevUser, favorites: currentFavorites.filter(id => id !== mangaId) };
      } else {
        toast({ title: "Added to Favorites!", description: `${mangaTitle} added to your favorites.` });
        return { ...prevUser, favorites: [...currentFavorites, mangaId] };
      }
    });
  };

  const updateUserSearchHistory = (searchTerm: string) => {
    if (!user || !searchTerm.trim()) return; // Don't add empty searches
    setUser(prevUser => {
      if (!prevUser) return null;
      const currentHistory = prevUser.searchHistory || [];
      // Add new term to the beginning, remove duplicates, limit to 10
      const updatedHistory = [searchTerm.trim(), ...currentHistory.filter(term => term !== searchTerm.trim())].slice(0, 10); 
      return { ...prevUser, searchHistory: updatedHistory };
    });
  };


  return (
    <AuthContext.Provider value={{
        user, login, signup, logout,
        isSubscribedToManga, subscribeToManga, donateToManga, investInManga, rateManga,
        addMangaSeries, deleteMangaSeries,
        viewingHistory, updateViewingHistory, getViewingHistory,
        transactions, addFunds, withdrawFunds, approveCreatorAccount,
        isFavorited, toggleFavorite, updateUserSearchHistory,
        // conceptual: processDividendPayouts 
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
