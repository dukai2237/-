"use client";
// src/contexts/AuthContext.tsx
import type { User, UserSubscription, UserInvestment, SimulatedTransaction, MangaSeries, MangaInvestor, Chapter, MangaPage, AuthorContactDetails, ShareListing } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
    updateMockMangaData, getMangaById, addMockMangaSeries as globalAddMockManga, 
    deleteMockMangaData as globalDeleteManga, getAuthorById as fetchAuthorDetails, 
    modifiableMockMangaSeries, addShareListing, updateShareListingOnPurchase, 
    removeShareListing as globalRemoveShareListing, getShareListingById, updateListingFollowerCount
} from '@/lib/mock-data';
import { MAX_WORKS_PER_CREATOR, MAX_SHARES_PER_OFFER } from '@/lib/constants'; 

const PLATFORM_FEE_RATE = 0.10; 
const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;
const MIN_SUBSCRIPTIONS_FOR_INVESTMENT = 10; // Hard requirement for investment/market purchase

interface ChapterInputForAdd {
  title: string;
  pages: { previewUrl: string }[]; 
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  signup: (name: string, email: string, accountType: 'user' | 'creator') => User | null;
  logout: () => void;
  
  // Subscription and Access
  isSubscribedToManga: (mangaId: string) => boolean; // Checks for active monthly subscription
  hasPurchasedChapter: (mangaId: string, chapterId: string) => boolean; // Checks for per-chapter purchase
  purchaseAccess: (mangaId: string, accessType: 'monthly' | 'chapter', itemId: string, price: number) => Promise<boolean>; // Combined purchase function

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
  withdrawFunds: (amount: number) => Promise<boolean>; 
  approveCreatorAccount: (creatorId: string) => void;
  
  isFavorited: (mangaId: string) => boolean;
  toggleFavorite: (mangaId: string, mangaTitle: string) => void;
  updateUserSearchHistory: (searchTerm: string) => void;

  // Share Market Functions
  listSharesForSale: (mangaId: string, shares: number, pricePerShare: number, description: string) => Promise<ShareListing | null>;
  delistSharesFromSale: (mangaId: string, listingId: string) => Promise<boolean>;
  purchaseSharesFromListing: (listingId: string, sharesToBuy: number) => Promise<boolean>;
  followShareListing: (listingId: string) => void;
  unfollowShareListing: (listingId: string) => void;
  isShareListingFollowed: (listingId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MOCK_USER_VALID: User = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test Creator',
  avatarUrl: 'https://picsum.photos/100/100?random=creator',
  walletBalance: 1000,
  subscriptions: [ // Example subscriptions to meet the 10 count requirement for testing
    { mangaId: 'manga-1', mangaTitle: 'The Wandering Blade', type: 'monthly', pricePaid: 5, subscribedSince: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { mangaId: 'manga-2', mangaTitle: 'Cybernetic Heart', type: 'chapter', chapterId: 'manga-2-chapter-1', pricePaid: 1.99, subscribedSince: new Date().toISOString() },
    { mangaId: 'manga-3', mangaTitle: 'Chronicles of Eldoria', type: 'chapter', chapterId: 'manga-3-chapter-1', pricePaid: 0.99, subscribedSince: new Date().toISOString() },
    { mangaId: 'manga-1', mangaTitle: 'The Wandering Blade', type: 'chapter', chapterId: 'manga-1-chapter-2', pricePaid: 0, subscribedSince: new Date().toISOString() }, // Assuming some free chapters might be 'purchased' for $0
    { mangaId: 'manga-2', mangaTitle: 'Cybernetic Heart', type: 'chapter', chapterId: 'manga-2-chapter-2', pricePaid: 1.99, subscribedSince: new Date().toISOString() },
    { mangaId: 'manga-3', mangaTitle: 'Chronicles of Eldoria', type: 'chapter', chapterId: 'manga-3-chapter-2', pricePaid: 0.99, subscribedSince: new Date().toISOString() },
    { mangaId: 'manga-1', mangaTitle: 'The Wandering Blade', type: 'chapter', chapterId: 'manga-1-chapter-3', pricePaid: 0, subscribedSince: new Date().toISOString() },
    { mangaId: 'manga-4', mangaTitle: 'My Author Adventure', type: 'monthly', pricePaid: 2, subscribedSince: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { mangaId: 'manga-4', mangaTitle: 'My Author Adventure', type: 'chapter', chapterId: 'manga-4-chapter-1', pricePaid: 0, subscribedSince: new Date().toISOString() },
    { mangaId: 'manga-2', mangaTitle: 'Cybernetic Heart', type: 'monthly', pricePaid: 5, subscribedSince: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }, // 10th one
  ],
  investments: [{ mangaId: 'manga-1', mangaTitle: 'The Wandering Blade', sharesOwned: 10, amountInvested: 500, investmentDate: new Date(Date.now() - 1000*60*60*24*40).toISOString(), totalDividendsReceived: 25 }],
  authoredMangaIds: ['manga-4'],
  accountType: 'creator',
  isApproved: true,
  ratingsGiven: {},
  favorites: [],
  searchHistory: [],
  followedShareListings: [],
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
        followedShareListings: parsedUser.followedShareListings || [],
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


  const login = useCallback((userData: User) => {
    const accountType = userData.accountType || (userData.id === MOCK_USER_VALID.id ? 'creator' : 'user');

    const fullUserData: User = {
      ...MOCK_USER_VALID, // Base defaults
      ...userData, // User specific data from login
      accountType,
      authoredMangaIds: userData.id === MOCK_USER_VALID.id && MOCK_USER_VALID.authoredMangaIds
                        ? MOCK_USER_VALID.authoredMangaIds
                        : (userData.authoredMangaIds || []),
      isApproved: userData.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.isApproved : (accountType === 'creator' ? userData.isApproved || false : undefined),
      ratingsGiven: userData.ratingsGiven || {},
      favorites: userData.favorites || [],
      searchHistory: userData.searchHistory || [],
      followedShareListings: userData.followedShareListings || [],
      subscriptions: userData.subscriptions || (userData.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.subscriptions : []), // Ensure subscriptions are loaded
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
  }, [setUser, toast]);

  const approveCreatorAccount = useCallback((creatorId: string) => {
    let userWasUpdated = false;
    if (user && user.id === creatorId && user.accountType === 'creator' && !user.isApproved) {
      setUser(prev => prev ? ({ ...prev, isApproved: true }) : null);
      toast({ title: "Creator Approved", description: `Creator ${user.name} (${user.email}) has been approved.` });
      recordTransaction({ type: 'creator_approved', amount: 0, userId: creatorId, description: `Creator ${user.name} account approved.` });
      userWasUpdated = true;
    } else { 
      const storedUsersString = localStorage.getItem('mockUserList');
      if (storedUsersString) {
        let mockUserList: User[] = JSON.parse(storedUsersString);
        const userIndex = mockUserList.findIndex(u => u.id === creatorId && u.accountType === 'creator' && !u.isApproved);
        if (userIndex !== -1) {
          mockUserList[userIndex].isApproved = true;
          localStorage.setItem('mockUserList', JSON.stringify(mockUserList));
          if (user && user.id === creatorId) { // if the admin is approving their own pending account from another session
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
  }, [user, setUser, toast, recordTransaction]);


  const signup = useCallback((name: string, email: string, accountType: 'user' | 'creator'): User | null => {
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
      walletBalance: accountType === 'creator' ? 0 : 50, 
      subscriptions: [],
      investments: [],
      authoredMangaIds: [],
      accountType,
      isApproved: accountType === 'user' ? true : false, 
      ratingsGiven: {},
      favorites: [],
      searchHistory: [],
      followedShareListings: [],
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
      // Auto-approve if it's the MOCK_USER_VALID email for easier testing
      if (email === MOCK_USER_VALID.email) {
        // Simulate admin approval after a short delay
        setTimeout(() => approveCreatorAccount(newUser.id), 2000); 
      }
    } else {
      setUser(newUser); // Auto-login user type accounts
      toast({ title: "Signup Successful!", description: `Welcome, ${name}! Your account has been created.` });
    }
    return newUser;
  }, [toast, recordTransaction, setUser, approveCreatorAccount]);

  const logout = useCallback(() => {
    setUser(null);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  }, [setUser, toast]);

  const isSubscribedToManga = useCallback((mangaId: string) => {
    return user?.subscriptions.some(sub => sub.mangaId === mangaId && sub.type === 'monthly' && (!sub.expiresAt || new Date(sub.expiresAt) > new Date())) || false;
  }, [user]);

  const hasPurchasedChapter = useCallback((mangaId: string, chapterId: string) => {
    return user?.subscriptions.some(sub => sub.mangaId === mangaId && sub.type === 'chapter' && sub.chapterId === chapterId) || false;
  }, [user]);

  const purchaseAccess = useCallback(async (mangaId: string, accessType: 'monthly' | 'chapter', itemId: string, price: number): Promise<boolean> => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to purchase access.", variant: "destructive" });
      return false;
    }
    if (user.walletBalance < price) {
      toast({ title: "Insufficient Balance", description: `Purchase costs $${price.toFixed(2)}. Your balance is $${user.walletBalance.toFixed(2)}.`, variant: "destructive" });
      return false;
    }
    const manga = getMangaById(mangaId);
    if (!manga || !manga.author) {
      toast({ title: "Error", description: "Manga or author details not found.", variant: "destructive" });
      return false;
    }
    
    const platformCut = price * PLATFORM_FEE_RATE;
    const revenueToAuthor = price - platformCut;
    const now = new Date();
    const expiresAt = accessType === 'monthly' ? new Date(now.setMonth(now.getMonth() + 1)).toISOString() : undefined;

    setUser(prevUser => {
      if (!prevUser) return null;
      const newBalance = prevUser.walletBalance - price;
      const newSubscription: UserSubscription = { 
        mangaId, 
        mangaTitle: manga.title, 
        type: accessType,
        chapterId: accessType === 'chapter' ? itemId : undefined,
        pricePaid: price, 
        subscribedSince: new Date().toISOString(),
        expiresAt: expiresAt
      };
      return { ...prevUser, walletBalance: newBalance, subscriptions: [...prevUser.subscriptions, newSubscription] };
    });
    
    updateMockMangaData(mangaId, { 
      totalRevenueFromSubscriptions: (manga.totalRevenueFromSubscriptions || 0) + revenueToAuthor, 
      lastSubscriptionDate: new Date().toISOString() 
    });

    const transactionType = accessType === 'monthly' ? 'subscription_payment' : 'chapter_purchase';
    recordTransaction({
      type: transactionType, amount: -price, userId: user.id, mangaId,
      description: `${accessType === 'monthly' ? 'Subscribed to' : 'Purchased chapter of'} ${manga.title}`,
      relatedData: { chapterId: accessType === 'chapter' ? itemId : undefined }
    });
    recordTransaction({
      type: 'platform_earning', amount: platformCut, mangaId, authorId: manga.author.id,
      description: `Platform fee from ${manga.title} ${accessType} purchase`,
      relatedData: { originalAmount: price }
    });
    
    toast({ title: "Purchase Successful!", description: `You've ${accessType === 'monthly' ? 'subscribed to' : 'purchased chapter of'} ${manga.title} for $${price.toFixed(2)}.` });
    return true;

  }, [user, toast, recordTransaction]);


  const donateToManga = useCallback(async (mangaId: string, mangaTitle: string, authorId: string, amount: number): Promise<boolean> => {
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
  }, [user, setUser, toast, recordTransaction]);

  const investInManga = useCallback(async (mangaId: string, mangaTitle: string, sharesToBuy: number, pricePerShare: number, totalCost: number): Promise<boolean> => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to invest.", variant: "destructive" });
      return false;
    }
    if ((user.subscriptions?.length || 0) < MIN_SUBSCRIPTIONS_FOR_INVESTMENT) {
      toast({ title: "Investment Requirement Not Met", description: `You need to subscribe to or purchase at least ${MIN_SUBSCRIPTIONS_FOR_INVESTMENT} manga/chapters to invest. You currently have ${user.subscriptions?.length || 0}.`, variant: "destructive", duration: 7000 });
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
    // Author-specific minSubscriptionRequirement check
    if (manga.investmentOffer.minSubscriptionRequirement && (!user.subscriptions || user.subscriptions.filter(s=>s.type === 'monthly' && s.mangaId === mangaId).length < manga.investmentOffer.minSubscriptionRequirement)) {
      // This checks if the user has a specific number of subscriptions TO THIS MANGA if the author set it.
      // This can be confusing with the global 10 subscriptions rule.
      // For now, let's assume the global rule is primary, and this is an *additional* author-set rule *for this specific manga's crowdfunding*.
      // The prompt implies the global rule is the "hard requirement".
      // Let's keep the author-specific rule, but ensure the toast message is clear.
      const authorSpecificSubCount = user.subscriptions.filter(s => s.type === 'monthly' && s.mangaId === mangaId).length;
      toast({ title: "Author's Investment Requirement Not Met", description: `The author requires you to have at least ${manga.investmentOffer.minSubscriptionRequirement} monthly subscriptions to *this specific manga* to invest. You currently have ${authorSpecificSubCount}.`, variant: "destructive", duration: 8000 });
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
    
    toast({ title: "Investment Successful!", description: `You've invested $${totalCost.toFixed(2)} for ${sharesToBuy} shares in ${mangaTitle}.` });
    return true;
  }, [user, setUser, toast, recordTransaction]);

  const rateManga = useCallback(async (mangaId: string, score: 1 | 2 | 3): Promise<boolean> => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to rate.", variant: "destructive" });
      return false;
    }
    if (!isSubscribedToManga(mangaId) && !user.investments.some(inv => inv.mangaId === mangaId) && !user.subscriptions.some(sub => sub.mangaId === mangaId && sub.type === 'chapter') ) {
      toast({ title: "Access Required", description: "You must be subscribed to, have purchased a chapter of, or invested in this manga to rate it.", variant: "destructive" });
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
  }, [user, setUser, toast, recordTransaction, isSubscribedToManga]);

  const addMangaSeries = useCallback(async (
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
      subscriptionModel: newMangaData.subscriptionModel || 'monthly', // Default to monthly
      isPublished: newMangaData.isPublished !== undefined ? newMangaData.isPublished : true,
      freePreviewPageCount: newMangaData.freePreviewPageCount || 0,
      freePreviewChapterCount: newMangaData.freePreviewChapterCount || 0,
    };

    globalAddMockManga(newManga);
    setUser(prevUser => prevUser ? ({ ...prevUser, authoredMangaIds: [...prevUser.authoredMangaIds, newManga.id] }) : null);

    recordTransaction({
      type: 'manga_creation', amount: 0, userId: user.id, authorId: user.id, mangaId: newManga.id,
      description: `Creator ${user.name} added new manga: ${newManga.title}`
    });

    toast({ title: "Manga Created!", description: `${newManga.title} has been successfully added.` });
    return newManga;
  }, [user, setUser, toast, recordTransaction]);

  const deleteMangaSeries = useCallback(async (mangaId: string): Promise<boolean> => {
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
    
    let hasActiveSubscribersOrPurchasers = false;
    const allUsersString = localStorage.getItem('mockUserList');
    if (allUsersString) {
        const allUsers: User[] = JSON.parse(allUsersString);
        hasActiveSubscribersOrPurchasers = allUsers.some(u => 
            u.subscriptions.some(sub => 
                sub.mangaId === mangaId && 
                (
                    (sub.type === 'monthly' && (!sub.expiresAt || new Date(sub.expiresAt) > new Date())) || 
                    sub.type === 'chapter'
                )
            )
        );
    }


    if (hasInvestors || hasActiveSubscribersOrPurchasers) {
      const lastActivityDate = Math.max(
        new Date(mangaToDelete.publishedDate).getTime(), 
        mangaToDelete.lastInvestmentDate ? new Date(mangaToDelete.lastInvestmentDate).getTime() : 0,
        mangaToDelete.lastSubscriptionDate ? new Date(mangaToDelete.lastSubscriptionDate).getTime() : 0 
      );
      if ((Date.now() - lastActivityDate) < ONE_YEAR_IN_MS) {
        toast({
          title: "Deletion Restricted",
          description: "This manga cannot be deleted yet due to active investments or subscriptions/purchases within the last year.",
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
  }, [user, setUser, toast, recordTransaction]);


  const updateViewingHistory = useCallback((mangaId: string, chapterId: string, pageIndex: number) => {
    setViewingHistory(prev => new Map(prev).set(mangaId, { chapterId, pageIndex, date: new Date() }));
  }, [setViewingHistory]);

  const getViewingHistory = useCallback((mangaId: string) => {
    return viewingHistory.get(mangaId);
  }, [viewingHistory]);

  const addFunds = useCallback((amount: number) => {
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
  }, [user, setUser, toast, recordTransaction]);

  const withdrawFunds = useCallback(async (amountToWithdraw: number): Promise<boolean> => {
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

    for (const mangaId of user.authoredMangaIds) {
      const manga = getMangaById(mangaId);
      if (manga?.investmentOffer?.isActive && manga.investmentOffer.dividendPayoutCycle && manga.investors.length > 0) {
        const cycleMonths = manga.investmentOffer.dividendPayoutCycle;
        const lastPayoutDateForManga = manga.investmentOffer.lastDividendPayoutDate
                                      ? new Date(manga.investmentOffer.lastDividendPayoutDate)
                                      : (manga.lastInvestmentDate ? new Date(manga.lastInvestmentDate) : new Date(manga.publishedDate));
        
        const nextPayoutDueDate = new Date(lastPayoutDateForManga);
        nextPayoutDueDate.setMonth(nextPayoutDueDate.getMonth() + cycleMonths);

        if (new Date() >= nextPayoutDueDate) {
          // Simplified check: if dividends are due, block withdrawal. Real app would calculate actual dividend amount.
          const totalEarningsForManga = (manga.totalRevenueFromSubscriptions + manga.totalRevenueFromDonations + manga.totalRevenueFromMerchandise);
          const potentialDividendPool = totalEarningsForManga * (manga.investmentOffer.sharesOfferedTotalPercent / 100);
          
          if (potentialDividendPool > 0) { 
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
    
    setUser(prev => prev ? { ...prev, walletBalance: prev.walletBalance - amountToWithdraw } : null);
    recordTransaction({
      type: 'wallet_withdrawal', amount: -amountToWithdraw, userId: user.id, authorId: user.id,
      description: `Creator ${user.name} withdrew $${amountToWithdraw.toFixed(2)}`
    });
    toast({ title: "Withdrawal Processed", description: `$${amountToWithdraw.toFixed(2)} has been withdrawn. (Simulated)`});
    return true;
  }, [user, setUser, toast, recordTransaction]);
  
  const isFavorited = useCallback((mangaId: string) => {
    return user?.favorites?.includes(mangaId) || false;
  }, [user]);

  const toggleFavorite = useCallback((mangaId: string, mangaTitle: string) => {
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
  }, [user, setUser, toast]);

  const updateUserSearchHistory = useCallback((searchTerm: string) => {
    setUser(prevUser => {
      if (!prevUser || !searchTerm.trim()) {
        return prevUser; 
      }
      
      const currentHistory = prevUser.searchHistory || [];
      
      if (currentHistory.length > 0 && currentHistory[0] === searchTerm.trim()) {
        return prevUser; 
      }
      
      const updatedHistory = [searchTerm.trim(), ...currentHistory.filter(term => term !== searchTerm.trim())].slice(0, 10);
      
      return { ...prevUser, searchHistory: updatedHistory };
    });
  }, [setUser]);

  // Share Market Functions
  const listSharesForSale = useCallback(async (mangaId: string, shares: number, pricePerShare: number, description: string): Promise<ShareListing | null> => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to list shares.", variant: "destructive" });
      return null;
    }
    const investment = user.investments.find(inv => inv.mangaId === mangaId);
    if (!investment) {
      toast({ title: "No Investment Found", description: "You do not own shares in this manga.", variant: "destructive" });
      return null;
    }
    if (investment.isListedForSale && investment.listingId) {
        toast({ title: "Already Listed", description: `You already have ${investment.sharesListed} shares of this manga listed. Please delist first to create a new listing.`, variant: "destructive", duration: 6000});
        return null;
    }
    if (shares > investment.sharesOwned) {
      toast({ title: "Insufficient Shares", description: `You only own ${investment.sharesOwned} shares.`, variant: "destructive" });
      return null;
    }

    const mangaDetails = getMangaById(mangaId);
    if (!mangaDetails) {
      toast({ title: "Manga Not Found", variant: "destructive" });
      return null;
    }

    const newListing = addShareListing({
      mangaId,
      sellerUserId: user.id,
      sellerName: user.name,
      sharesOffered: shares,
      pricePerShare,
      description,
      mangaTitle: mangaDetails.title,
      coverImage: mangaDetails.coverImage,
      authorName: mangaDetails.author.name,
    });

    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        investments: prev.investments.map(inv => 
          inv.mangaId === mangaId 
          ? { ...inv, isListedForSale: true, listingId: newListing.id, sharesListed: shares, listedPricePerShare: pricePerShare, listingDescription: description } 
          : inv
        )
      };
    });
    recordTransaction({ type: 'list_shares_for_sale', amount: 0, userId: user.id, mangaId, description: `Listed ${shares} shares of ${mangaDetails.title} for $${pricePerShare.toFixed(2)}/share. Listing ID: ${newListing.id}`, relatedData: { listingId: newListing.id, shares, pricePerShare } });
    toast({ title: "Shares Listed!", description: `${shares} shares of ${mangaDetails.title} are now on the market.` });
    return newListing;
  }, [user, toast, recordTransaction]);

  const delistSharesFromSale = useCallback(async (mangaId: string, listingId: string): Promise<boolean> => {
     if (!user) {
      toast({ title: "Login Required", variant: "destructive" });
      return false;
    }
    const investment = user.investments.find(inv => inv.mangaId === mangaId && inv.listingId === listingId);
    if (!investment || !investment.isListedForSale) {
        toast({ title: "Listing Not Found", description: "No active listing by you for these shares.", variant: "destructive" });
        return false;
    }
    
    globalRemoveShareListing(listingId); // Remove from global mock listings

    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        investments: prev.investments.map(inv => 
          inv.mangaId === mangaId 
          ? { ...inv, isListedForSale: false, listingId: undefined, sharesListed: 0, listedPricePerShare: undefined, listingDescription: undefined } 
          : inv
        )
      };
    });
    recordTransaction({ type: 'delist_shares_from_sale', amount: 0, userId: user.id, mangaId, description: `Delisted shares of ${investment.mangaTitle}. Listing ID: ${listingId}`, relatedData: { listingId } });
    toast({ title: "Shares Delisted", description: `Your shares of ${investment.mangaTitle} have been removed from the market.` });
    return true;
  }, [user, toast, recordTransaction]);

  const purchaseSharesFromListing = useCallback(async (listingId: string, sharesToBuy: number): Promise<boolean> => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to purchase shares.", variant: "destructive" });
      return false;
    }
    if ((user.subscriptions?.length || 0) < MIN_SUBSCRIPTIONS_FOR_INVESTMENT) {
      toast({ title: "Purchase Requirement Not Met", description: `You need to subscribe to or purchase at least ${MIN_SUBSCRIPTIONS_FOR_INVESTMENT} manga/chapters to buy shares. You currently have ${user.subscriptions?.length || 0}.`, variant: "destructive", duration: 7000 });
      return false;
    }

    const listing = getShareListingById(listingId);
    if (!listing || !listing.isActive || listing.sharesOffered < sharesToBuy) {
      toast({ title: "Listing Unavailable", description: "This listing is no longer available or doesn't have enough shares.", variant: "destructive" });
      return false;
    }
    if (user.id === listing.sellerUserId) {
      toast({ title: "Cannot Buy Own Shares", variant: "default" });
      return false;
    }
    const totalCost = sharesToBuy * listing.pricePerShare;
    if (user.walletBalance < totalCost) {
      toast({ title: "Insufficient Balance", description: `Purchase requires $${totalCost.toFixed(2)}. Your balance: $${user.walletBalance.toFixed(2)}.`, variant: "destructive" });
      return false;
    }

    // Simulate transaction
    // 1. Update buyer's wallet and investments
    setUser(prevUser => {
      if (!prevUser) return null;
      const newBalance = prevUser.walletBalance - totalCost;
      let updatedInvestments = [...prevUser.investments];
      const existingInvestment = updatedInvestments.find(inv => inv.mangaId === listing.mangaId);
      if (existingInvestment) {
        updatedInvestments = updatedInvestments.map(inv => 
          inv.mangaId === listing.mangaId 
          ? { ...inv, sharesOwned: inv.sharesOwned + sharesToBuy, amountInvested: inv.amountInvested + totalCost } // Note: amountInvested should reflect what buyer paid
          : inv
        );
      } else {
        updatedInvestments.push({ mangaId: listing.mangaId, mangaTitle: listing.mangaTitle, sharesOwned: sharesToBuy, amountInvested: totalCost, investmentDate: new Date().toISOString() });
      }
      return { ...prevUser, walletBalance: newBalance, investments: updatedInvestments };
    });
    recordTransaction({ type: 'shares_purchase_secondary', amount: -totalCost, userId: user.id, mangaId: listing.mangaId, description: `Purchased ${sharesToBuy} shares of ${listing.mangaTitle} from market. Listing ID: ${listingId}`, relatedData: { listingId, sharesToBuy, pricePerShare: listing.pricePerShare, sellerUserId: listing.sellerUserId } });

    // 2. Update seller's wallet (This needs a way to update another user's data in mock, complex for now. Assume backend handles)
    // For mock, we'll just log a transaction for the seller receiving funds
    const platformCut = totalCost * PLATFORM_FEE_RATE;
    const proceedsToSeller = totalCost - platformCut;
    recordTransaction({ type: 'shares_sale_secondary', amount: proceedsToSeller, userId: listing.sellerUserId, mangaId: listing.mangaId, description: `Sold ${sharesToBuy} shares of ${listing.mangaTitle} on market. Listing ID: ${listingId}`, relatedData: { listingId, sharesSold: sharesToBuy, pricePerShare: listing.pricePerShare, buyerUserId: user.id } });
    recordTransaction({ type: 'platform_earning', amount: platformCut, mangaId: listing.mangaId, description: `Platform fee from secondary market sale of ${listing.mangaTitle} shares. Listing ID: ${listingId}`, relatedData: { originalAmount: totalCost, listingId }});


    // 3. Update the listing in mock-data
    updateShareListingOnPurchase(listingId, sharesToBuy);
    
    // 4. Update seller's UserInvestment in localStorage (if they are the current user, this would be handled by setUser)
    // This is tricky with mock data if seller is not current user.
    // For now, assume the `updateMockMangaData` or similar would adjust seller's investment record if needed by a backend.

    toast({ title: "Purchase Successful!", description: `You bought ${sharesToBuy} shares of ${listing.mangaTitle}.`});
    return true;
  }, [user, toast, recordTransaction]);

  const followShareListing = useCallback((listingId: string) => {
    if (!user) return;
    setUser(prev => prev ? ({ ...prev, followedShareListings: [...(prev.followedShareListings || []), listingId] }) : null);
    updateListingFollowerCount(listingId, true);
    toast({title: "Followed Listing", description: "You will now receive updates for this listing."});
  }, [user, toast]);

  const unfollowShareListing = useCallback((listingId: string) => {
    if (!user) return;
    setUser(prev => prev ? ({ ...prev, followedShareListings: (prev.followedShareListings || []).filter(id => id !== listingId) }) : null);
    updateListingFollowerCount(listingId, false);
    toast({title: "Unfollowed Listing", description: "You will no longer receive updates."});
  }, [user, toast]);

  const isShareListingFollowed = useCallback((listingId: string) => {
    return user?.followedShareListings?.includes(listingId) || false;
  }, [user]);


  return (
    <AuthContext.Provider value={{
        user, login, signup, logout,
        isSubscribedToManga, hasPurchasedChapter, purchaseAccess, 
        donateToManga, investInManga, rateManga,
        addMangaSeries, deleteMangaSeries,
        viewingHistory, updateViewingHistory, getViewingHistory,
        transactions, addFunds, withdrawFunds, approveCreatorAccount,
        isFavorited, toggleFavorite, updateUserSearchHistory,
        listSharesForSale, delistSharesFromSale, purchaseSharesFromListing,
        followShareListing, unfollowShareListing, isShareListingFollowed,
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
