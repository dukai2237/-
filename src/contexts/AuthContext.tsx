// src/contexts/AuthContext.tsx
"use client";
import type { User, UserSubscription, UserInvestment, SimulatedTransaction, MangaSeries, MangaInvestor, Chapter, MangaPage, AuthorContactDetails, ShareListing, Comment, BankAccountDetails, AuthorInfo as GlobalAuthorInfo } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
    updateMockMangaData, getMangaById, addMockMangaSeries as globalAddMockManga, 
    deleteMockMangaData as globalDeleteManga, getAuthorById as fetchAuthorDetails, 
    updateMockAuthorBalance, mockAuthors,
    addShareListing, updateShareListingOnPurchase, 
    removeShareListing as globalRemoveShareListing, getShareListingById, updateListingFollowerCount,
    addCommentToMockManga
} from '@/lib/mock-data';
import { MAX_WORKS_PER_CREATOR, MAX_SHARES_PER_OFFER } from '@/lib/constants'; 

const PLATFORM_FEE_RATE = 0.10; 
const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;
const MOCK_VERIFICATION_CODE = "123456"; 

const USER_PROFILE_UPDATE_COOLDOWN_DAYS = 30;
const CREATOR_PROFILE_UPDATE_COOLDOWN_DAYS = 90;


interface ChapterInputForAdd {
  title: string;
  pages: { previewUrl: string }[]; 
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  signup: (name: string, email: string, password?: string, accountType?: 'user' | 'creator', verificationCode?: string) => Promise<User | null>;
  logout: () => void;
  updateUserProfile: (newName: string, newAvatarDataUrl: string | null) => Promise<boolean>;
  
  isSubscribedToManga: (mangaId: string) => boolean; 
  hasPurchasedChapter: (mangaId: string, chapterId: string) => boolean; 
  purchaseAccess: (mangaId: string, accessType: 'monthly' | 'chapter', itemId: string, price: number) => Promise<boolean>; 

  donateToManga: (mangaId: string, mangaTitle: string, authorId: string, amount: number) => Promise<boolean>;
  investInManga: (mangaId: string, mangaTitle: string, sharesToBuy: number, pricePerShare: number, totalCost: number) => Promise<boolean>;
  rateManga: (mangaId: string, score: 1 | 2 | 3) => Promise<boolean>;
  
  addMangaSeries: (
    newMangaData: Omit<MangaSeries, 'id' | 'author' | 'publishedDate' | 'averageRating' | 'ratingCount' | 'viewCount' | 'totalRevenueFromSubscriptions' | 'totalRevenueFromDonations' | 'totalRevenueFromMerchandise' | 'investors' | 'chapters' | 'authorDetails' | 'lastUpdatedDate' | 'lastInvestmentDate' | 'lastSubscriptionDate' | 'comments'>
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

  listSharesForSale: (mangaId: string, shares: number, pricePerShare: number, description: string) => Promise<ShareListing | null>;
  delistSharesFromSale: (mangaId: string, listingId: string) => Promise<boolean>;
  purchaseSharesFromListing: (listingId: string, sharesToBuy: number) => Promise<boolean>;
  followShareListing: (listingId: string) => void;
  unfollowShareListing: (listingId: string) => void;
  isShareListingFollowed: (listingId: string) => boolean;

  addCommentToManga: (mangaId: string, text: string, parentId?: string) => Promise<Comment | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MOCK_USER_VALID: User = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test Creator',
  password_hash_mock: 'hashed_password_123', 
  avatarUrl: 'https://picsum.photos/100/100?random=creator',
  walletBalance: 1000,
  subscriptions: [ 
    { mangaId: 'manga-1', mangaTitle: 'The Wandering Blade', type: 'monthly', pricePaid: 5, subscribedSince: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { mangaId: 'manga-2', mangaTitle: 'Cybernetic Heart', type: 'chapter', chapterId: 'manga-2-chapter-1', pricePaid: 1.99, subscribedSince: new Date().toISOString() },
    { mangaId: 'manga-3', mangaTitle: 'Chronicles of Eldoria', type: 'chapter', chapterId: 'manga-3-chapter-1', pricePaid: 0.99, subscribedSince: new Date().toISOString() },
    { mangaId: 'manga-1', mangaTitle: 'The Wandering Blade', type: 'chapter', chapterId: 'manga-1-chapter-2', pricePaid: 0, subscribedSince: new Date().toISOString() }, 
    { mangaId: 'manga-2', mangaTitle: 'Cybernetic Heart', type: 'chapter', chapterId: 'manga-2-chapter-2', pricePaid: 1.99, subscribedSince: new Date().toISOString() },
    { mangaId: 'manga-3', mangaTitle: 'Chronicles of Eldoria', type: 'chapter', chapterId: 'manga-3-chapter-2', pricePaid: 0.99, subscribedSince: new Date().toISOString() },
    { mangaId: 'manga-1', mangaTitle: 'The Wandering Blade', type: 'chapter', chapterId: 'manga-1-chapter-3', pricePaid: 0, subscribedSince: new Date().toISOString() },
    { mangaId: 'manga-4', mangaTitle: 'My Author Adventure', type: 'monthly', pricePaid: 2, subscribedSince: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { mangaId: 'manga-4', mangaTitle: 'My Author Adventure', type: 'chapter', chapterId: 'manga-4-chapter-1', pricePaid: 0, subscribedSince: new Date().toISOString() },
    { mangaId: 'manga-2', mangaTitle: 'Cybernetic Heart', type: 'monthly', pricePaid: 5, subscribedSince: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }, 
  ],
  investments: [{ mangaId: 'manga-1', mangaTitle: 'The Wandering Blade', sharesOwned: 10, amountInvested: 500, investmentDate: new Date(Date.now() - 1000*60*60*24*40).toISOString(), totalDividendsReceived: 25 }],
  authoredMangaIds: ['manga-4'],
  accountType: 'creator',
  isApproved: true,
  ratingsGiven: {},
  favorites: [],
  searchHistory: [],
  followedShareListings: [],
  bankDetails: {
    accountHolderName: "Test Creator",
    bankName: "Bank of Test",
    accountNumber: "1234567890",
    routingNumber: "0987654321",
  },
  donationCount: 0, 
  investmentOpportunitiesAvailable: 2, 
  lastProfileUpdate: new Date(Date.now() - (CREATOR_PROFILE_UPDATE_COOLDOWN_DAYS + 5) * 24 * 60 * 60 * 1000).toISOString(), // Ensure MOCK_USER can update profile
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
        bankDetails: parsedUser.bankDetails || (parsedUser.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.bankDetails : undefined),
        password_hash_mock: parsedUser.password_hash_mock || (parsedUser.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.password_hash_mock : undefined),
        donationCount: parsedUser.donationCount || 0,
        investmentOpportunitiesAvailable: parsedUser.investmentOpportunitiesAvailable || 0,
        lastProfileUpdate: parsedUser.lastProfileUpdate || (parsedUser.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.lastProfileUpdate : undefined),
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
      followedShareListings: userData.followedShareListings || [],
      subscriptions: userData.subscriptions || (userData.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.subscriptions : []),
      bankDetails: userData.bankDetails || (userData.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.bankDetails : undefined),
      password_hash_mock: userData.password_hash_mock || (userData.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.password_hash_mock : undefined),
      donationCount: userData.donationCount || (userData.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.donationCount : 0),
      investmentOpportunitiesAvailable: userData.investmentOpportunitiesAvailable || (userData.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.investmentOpportunitiesAvailable : 0),
      lastProfileUpdate: userData.lastProfileUpdate || (userData.id === MOCK_USER_VALID.id ? MOCK_USER_VALID.lastProfileUpdate : undefined),
    };

    if (fullUserData.accountType === 'creator' && !fullUserData.isApproved) {
      setTimeout(() => toast({
        title: "Account Pending Approval",
        description: "Your creator account is awaiting admin approval. You cannot log in until it's approved.",
        variant: "destructive",
        duration: 7000
      }), 0);
      return;
    }

    setUser(fullUserData);
    setTimeout(() => toast({ title: "Login Successful", description: `Welcome back, ${fullUserData.name}!` }), 0);
  }, [toast]);

  const approveCreatorAccount = useCallback((creatorId: string) => {
    let userWasUpdated = false;
    if (user && user.id === creatorId && user.accountType === 'creator' && !user.isApproved) {
      setUser(prev => prev ? ({ ...prev, isApproved: true }) : null);
      setTimeout(() => toast({ title: "Creator Approved", description: `Creator ${user.name} (${user.email}) has been approved.` }), 0);
      recordTransaction({ type: 'creator_approved', amount: 0, userId: creatorId, description: `Creator ${user.name} account approved.` });
      userWasUpdated = true;
    } else { 
      const storedUsersString = localStorage.getItem('mockUserList');
      if (storedUsersString) {
        let mockUserListFromStorage: User[] = JSON.parse(storedUsersString);
        const userIndex = mockUserListFromStorage.findIndex(u => u.id === creatorId && u.accountType === 'creator' && !u.isApproved);
        if (userIndex !== -1) {
          mockUserListFromStorage[userIndex].isApproved = true;
          localStorage.setItem('mockUserList', JSON.stringify(mockUserListFromStorage));
          if (user && user.id === creatorId) { 
             setUser(prev => prev ? ({ ...prev, isApproved: true }) : null);
          }
          setTimeout(() => toast({ title: "Creator Approved", description: `Creator account ${mockUserListFromStorage[userIndex].name} has been approved.` }), 0);
          recordTransaction({ type: 'creator_approved', amount: 0, userId: creatorId, description: `Creator account ${mockUserListFromStorage[userIndex].name} approved.`});
          userWasUpdated = true;
        }
      }
    }
    if (!userWasUpdated) {
        console.warn(`approveCreatorAccount: Creator ID ${creatorId} not found, already approved, or not a creator.`);
        setTimeout(() => toast({title: "Approval Action", description: `Attempted to approve creator ${creatorId}. No change or user not found.`, variant: "default"}), 0);
    }
  }, [user, toast, recordTransaction]);


  const signup = useCallback(async (name: string, email: string, password?: string, accountType: 'user' | 'creator' = 'user', verificationCode?: string): Promise<User | null> => {
    if (!password) { 
      setTimeout(() => toast({ title: "Signup Failed", description: "Password is required.", variant: "destructive" }), 0);
        return null;
    }

    if (verificationCode !== MOCK_VERIFICATION_CODE) {
      setTimeout(() => toast({ title: "Signup Failed", description: "Invalid verification code. Please try again.", variant: "destructive" }), 0);
      return null;
    }

    const storedUsersString = localStorage.getItem('mockUserList');
    let mockUserListFromStorage: User[] = storedUsersString ? JSON.parse(storedUsersString) : [];
    
    const existingUser = mockUserListFromStorage.find(u => u.email === email);
    const existingAuthor = mockAuthors.find(a => a.contactDetails?.email === email);

    if (existingUser || existingAuthor) {
      setTimeout(() => toast({ title: "Signup Failed", description: "This email is already registered.", variant: "destructive" }), 0);
      return null;
    }


    const newUserId = `user-${Date.now()}-${Math.random().toString(16).slice(4)}`;
    const password_hash_mock = `hashed_${password}_${newUserId}`; 

    const newUserToAdd: User = {
      id: newUserId,
      email,
      name,
      password_hash_mock,
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
      donationCount: 0,
      investmentOpportunitiesAvailable: 0,
      lastProfileUpdate: new Date().toISOString(),
    };

    mockUserListFromStorage.push(newUserToAdd);
    localStorage.setItem('mockUserList', JSON.stringify(mockUserListFromStorage));
    
    if (accountType === 'creator') {
        const newAuthorEntry: GlobalAuthorInfo = {
            id: newUserToAdd.id,
            name: newUserToAdd.name,
            avatarUrl: newUserToAdd.avatarUrl,
            contactDetails: { email: newUserToAdd.email },
            walletBalance: 0,
            isSystemUser: false,
        };
        mockAuthors.push(newAuthorEntry);
    }


    recordTransaction({
      type: 'account_creation',
      amount: newUserToAdd.walletBalance,
      userId: newUserToAdd.id,
      description: `Account created: ${name} (${accountType}). ${accountType === 'creator' ? 'Pending approval.' : 'Initial balance: $' + newUserToAdd.walletBalance.toFixed(2)}`,
      relatedData: { accountType }
    });

    if (accountType === 'creator') {
      recordTransaction({
        type: 'creator_approval_pending',
        amount: 0,
        userId: newUserToAdd.id,
        description: `Creator ${name} account registered, awaiting approval.`,
      });
      setTimeout(() => toast({
        title: "Creator Account Registered",
        description: `Welcome, ${name}! Your creator account is registered and awaiting admin approval. You will be able to log in and publish once approved.`,
        duration: 10000
      }), 0);
      
      if (email === MOCK_USER_VALID.email) { // Auto-approve MOCK_USER_VALID if they re-register as creator
        setTimeout(() => approveCreatorAccount(newUserToAdd.id), 2000); 
      }
    } else {
      setUser(newUserToAdd); 
      setTimeout(() => toast({ title: "Signup Successful!", description: `Welcome, ${name}! Your account has been created.` }), 0);
    }
    return newUserToAdd;
  }, [toast, recordTransaction, approveCreatorAccount]);

  const logout = useCallback(() => {
    setUser(null);
    setTimeout(() => toast({ title: "Logged Out", description: "You have been successfully logged out." }), 0);
  }, [toast]);

  const updateUserProfile = useCallback(async (newName: string, newAvatarDataUrl: string | null): Promise<boolean> => {
    if (!user) {
        setTimeout(()=>toast({ title: "Not Logged In", description: "You must be logged in to update your profile.", variant: "destructive" }), 0);
        return false;
    }

    const cooldownDays = user.accountType === 'creator' ? CREATOR_PROFILE_UPDATE_COOLDOWN_DAYS : USER_PROFILE_UPDATE_COOLDOWN_DAYS;
    if (user.lastProfileUpdate) {
        const lastUpdate = new Date(user.lastProfileUpdate).getTime();
        const now = Date.now();
        const daysSinceLastUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
        if (daysSinceLastUpdate < cooldownDays) {
            setTimeout(()=>toast({
                title: "Update Too Soon",
                description: `You can update your profile again in ${Math.ceil(cooldownDays - daysSinceLastUpdate)} days.`,
                variant: "destructive"
            }), 0);
            return false;
        }
    }

    // Name uniqueness check
    if (newName && newName !== user.name) {
        const storedUsersString = localStorage.getItem('mockUserList');
        const mockUserListFromStorage: User[] = storedUsersString ? JSON.parse(storedUsersString) : [];
        
        let nameExists = false;
        if (user.accountType === 'creator') {
            nameExists = mockAuthors.some(author => author.id !== user.id && author.name === newName);
        } else { // 'user'
            nameExists = mockUserListFromStorage.some(u => u.id !== user.id && u.name === newName) || 
                         mockAuthors.some(author => author.name === newName); // Also check against creator names
        }

        if (nameExists) {
            setTimeout(()=>toast({ title: "Name Taken", description: "This name is already in use. Please choose another.", variant: "destructive" }),0);
            return false;
        }
    }

    const updatedUserData: Partial<User> = {};
    if (newName && newName !== user.name) updatedUserData.name = newName;
    if (newAvatarDataUrl) updatedUserData.avatarUrl = newAvatarDataUrl;
    
    if (Object.keys(updatedUserData).length === 0) {
        setTimeout(()=>toast({title: "No Changes", description: "No changes were made to your profile."}), 0);
        return true; // No actual update needed
    }

    updatedUserData.lastProfileUpdate = new Date().toISOString();

    setUser(prevUser => prevUser ? { ...prevUser, ...updatedUserData } : null);

    // Update mockAuthors if current user is a creator
    if (user.accountType === 'creator') {
        const authorIndex = mockAuthors.findIndex(a => a.id === user.id);
        if (authorIndex !== -1) {
            if(updatedUserData.name) mockAuthors[authorIndex].name = updatedUserData.name;
            if(updatedUserData.avatarUrl) mockAuthors[authorIndex].avatarUrl = updatedUserData.avatarUrl;
            if(updatedUserData.lastProfileUpdate) mockAuthors[authorIndex].lastProfileUpdate = updatedUserData.lastProfileUpdate;
        }
    } else { // Update mockUserList in localStorage for regular users
        const storedUsersString = localStorage.getItem('mockUserList');
        if (storedUsersString) {
            let mockUserListFromStorage: User[] = JSON.parse(storedUsersString);
            const userIndex = mockUserListFromStorage.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                 mockUserListFromStorage[userIndex] = { ...mockUserListFromStorage[userIndex], ...updatedUserData };
                 localStorage.setItem('mockUserList', JSON.stringify(mockUserListFromStorage));
            }
        }
    }
    
    recordTransaction({
        type: 'profile_update',
        amount: 0,
        userId: user.id,
        description: `User ${user.name} updated their profile.`,
        relatedData: { newName: updatedUserData.name, newAvatar: !!updatedUserData.avatarUrl }
    });

    setTimeout(()=>toast({ title: "Profile Updated", description: "Your profile has been successfully updated." }), 0);
    return true;
  }, [user, toast, recordTransaction]);


  const isSubscribedToManga = useCallback((mangaId: string) => {
    if (!user || user.accountType === 'creator') return false;
    return user.subscriptions.some(sub => sub.mangaId === mangaId && sub.type === 'monthly' && (!sub.expiresAt || new Date(sub.expiresAt) > new Date())) || false;
  }, [user]);

  const hasPurchasedChapter = useCallback((mangaId: string, chapterId: string) => {
    if (!user || user.accountType === 'creator') return false;
    return user.subscriptions.some(sub => sub.mangaId === mangaId && sub.type === 'chapter' && sub.chapterId === chapterId) || false;
  }, [user]);

  const purchaseAccess = useCallback(async (mangaId: string, accessType: 'monthly' | 'chapter', itemId: string, price: number): Promise<boolean> => {
    if (!user) {
      setTimeout(() => toast({ title: "Login Required", description: "Please log in to purchase access.", variant: "destructive" }), 0);
      return false;
    }
     if (user.accountType === 'creator') {
      setTimeout(() => toast({ title: "Action Not Allowed", description: "Creators cannot subscribe to or purchase manga.", variant: "destructive" }), 0);
      return false;
    }
    const manga = getMangaById(mangaId);
    if (!manga || !manga.author) {
      setTimeout(() => toast({ title: "Error", description: "Manga or author details not found.", variant: "destructive" }), 0);
      return false;
    }
    
    if (user.walletBalance < price) {
      setTimeout(() => toast({ title: "Insufficient Balance", description: `Purchase costs $${price.toFixed(2)}. Your balance is $${user.walletBalance.toFixed(2)}.`, variant: "destructive" }), 0);
      return false;
    }
    
    const author = fetchAuthorDetails(manga.author.id); 
    if (!author) {
      setTimeout(() => toast({ title: "Author Not Found", description: "Author details not found.", variant: "destructive" }), 0);
      return false;
    }
    
    const platformCut = price * PLATFORM_FEE_RATE;
    const revenueToAuthor = price - platformCut;
    const now = new Date();
    const expiresAt = accessType === 'monthly' ? new Date(now.setMonth(now.getMonth() + 1)).toISOString() : undefined;
    
    let opportunitiesGainedThisTime = 0;
    if (user) {
        const oldTotalCombinedActions = (user.subscriptions.length) + (user.donationCount || 0);
        const newTotalCombinedActions = (user.subscriptions.length + 1) + (user.donationCount || 0);
        opportunitiesGainedThisTime = Math.floor(newTotalCombinedActions / 5) - Math.floor(oldTotalCombinedActions / 5);
    }

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
      
      let newInvestmentOpportunitiesAvailable = prevUser.investmentOpportunitiesAvailable || 0;
      if (opportunitiesGainedThisTime > 0) {
        newInvestmentOpportunitiesAvailable += opportunitiesGainedThisTime;
      }
      
      return { 
        ...prevUser, 
        walletBalance: newBalance, 
        subscriptions: [...prevUser.subscriptions, newSubscription],
        investmentOpportunitiesAvailable: newInvestmentOpportunitiesAvailable,
      };
    });
    
    updateMockAuthorBalance(author.id, author.walletBalance + revenueToAuthor);

    updateMockMangaData(mangaId, { 
      totalRevenueFromSubscriptions: (manga.totalRevenueFromSubscriptions || 0) + revenueToAuthor, 
      lastSubscriptionDate: new Date().toISOString() 
    });

    recordTransaction({
      type: 'author_earning', amount: revenueToAuthor, 
      userId: user.id, mangaId, authorId: manga.author.id, 
      description: `${accessType === 'monthly' ? 'Subscription to' : 'Chapter purchase of'} ${manga.title} for author ${manga.author.name}`,
      relatedData: { chapterId: accessType === 'chapter' ? itemId : undefined, buyerUserId: user.id }
    });
    recordTransaction({
        type: 'user_payment', amount: -price, userId: user.id, mangaId,
        description: `Paid for ${accessType === 'monthly' ? 'subscription to' : 'chapter of'} ${manga.title}`,
        relatedData: { chapterId: accessType === 'chapter' ? itemId : undefined }
    });
    recordTransaction({
      type: 'platform_earning', amount: platformCut, mangaId, authorId: manga.author.id,
      description: `Platform fee from ${manga.title} ${accessType} purchase`,
      relatedData: { originalAmount: price }
    });
     
    setTimeout(() => {
      toast({ title: "Purchase Successful!", description: `You've ${accessType === 'monthly' ? 'subscribed to' : 'purchased chapter of'} ${manga.title} for $${price.toFixed(2)}.` });
      if (opportunitiesGainedThisTime > 0) {
        toast({ title: "Investment Opportunity Unlocked!", description: `You've gained ${opportunitiesGainedThisTime} new investment ${opportunitiesGainedThisTime === 1 ? 'chance' : 'chances'}!` });
      }
    }, 0);
    return true;

  }, [user, toast, recordTransaction]);


  const donateToManga = useCallback(async (mangaId: string, mangaTitle: string, authorId: string, amount: number): Promise<boolean> => {
    if (!user) {
      setTimeout(() => toast({ title: "Login Required", description: "Please log in to donate.", variant: "destructive" }), 0);
      return false;
    }
    if (user.accountType === 'creator') {
      setTimeout(() => toast({ title: "Action Not Allowed", description: "Creators cannot donate.", variant: "destructive" }), 0);
      return false;
    }
    const manga = getMangaById(mangaId);
     if (!manga || manga.author.id !== authorId) {
      setTimeout(() => toast({ title: "Error", description: "Manga or author details mismatch.", variant: "destructive" }), 0);
      return false;
    }
    if (amount <= 0) {
      setTimeout(() => toast({ title: "Invalid Amount", description: "Donation amount must be positive.", variant: "destructive" }), 0);
      return false;
    }
    if (user.walletBalance < amount) {
      setTimeout(() => toast({ title: "Insufficient Balance", description: `Donation requires $${amount.toFixed(2)}. Your balance is $${user.walletBalance.toFixed(2)}.`, variant: "destructive" }), 0);
      return false;
    }
    
    const author = fetchAuthorDetails(authorId);
    if (!author) {
      setTimeout(() => toast({ title: "Author Not Found", description: "Author details not found.", variant: "destructive" }), 0);
      return false;
    }

    const platformCut = amount * PLATFORM_FEE_RATE;
    const revenueToAuthor = amount - platformCut;

    let opportunitiesGainedThisTime = 0;
    if (user) {
        const oldTotalCombinedActions = (user.subscriptions.length) + (user.donationCount || 0);
        const newDonationCountForCalc = (user.donationCount || 0) + 1;
        const newTotalCombinedActionsForCalc = (user.subscriptions.length) + newDonationCountForCalc;
        opportunitiesGainedThisTime = Math.floor(newTotalCombinedActionsForCalc / 5) - Math.floor(oldTotalCombinedActions / 5);
    }

    setUser(prevUser => {
      if (!prevUser) return null;
      const newDonationCount = (prevUser.donationCount || 0) + 1;
      let newInvestmentOpportunitiesAvailable = prevUser.investmentOpportunitiesAvailable || 0;

      if (opportunitiesGainedThisTime > 0) {
        newInvestmentOpportunitiesAvailable += opportunitiesGainedThisTime;
      }

      return { 
        ...prevUser, 
        walletBalance: prevUser.walletBalance - amount,
        donationCount: newDonationCount,
        investmentOpportunitiesAvailable: newInvestmentOpportunitiesAvailable,
      };
    });

    updateMockAuthorBalance(author.id, author.walletBalance + revenueToAuthor);
    
    updateMockMangaData(mangaId, { totalRevenueFromDonations: (manga.totalRevenueFromDonations || 0) + revenueToAuthor });
    
    recordTransaction({
      type: 'author_earning', amount: revenueToAuthor, userId: user.id, mangaId, authorId,
      description: `Donation to ${mangaTitle} for author ${author.name}`,
      relatedData: { buyerUserId: user.id }
    });
     recordTransaction({
        type: 'user_payment', amount: -amount, userId: user.id, mangaId,
        description: `Donated to ${mangaTitle}`,
    });
    recordTransaction({
      type: 'platform_earning', amount: platformCut, mangaId, authorId,
      description: `Platform fee from ${mangaTitle} donation`,
      relatedData: { originalAmount: amount }
    });

    setTimeout(() => {
        toast({ title: "Donation Successful!", description: `You've donated $${amount.toFixed(2)} to ${mangaTitle}.` });
        if (opportunitiesGainedThisTime > 0) {
            toast({ title: "Investment Opportunity Unlocked!", description: `You've gained ${opportunitiesGainedThisTime} new investment ${opportunitiesGainedThisTime === 1 ? 'chance' : 'chances'}!` });
        }
    }, 0);
    return true;
  }, [user, toast, recordTransaction]);

  const investInManga = useCallback(async (mangaId: string, mangaTitle: string, sharesToBuy: number, pricePerShare: number, totalCost: number): Promise<boolean> => {
    if (!user) {
      setTimeout(() => toast({ title: "Login Required", description: "Please log in to invest.", variant: "destructive" }), 0);
      return false;
    }
    if (user.accountType === 'creator') {
      setTimeout(() => toast({ title: "Action Not Allowed", description: "Creators cannot invest.", variant: "destructive" }), 0);
      return false;
    }
    if ((user.investmentOpportunitiesAvailable || 0) <= 0) {
      setTimeout(() => toast({ title: "Investment Locked", description: `You need an available investment opportunity. Earn one by making 5 combined subscriptions or donations. You have ${user.investmentOpportunitiesAvailable || 0} opportunities.`, variant: "destructive", duration: 7000 }), 0);
      return false;
    }
    const manga = getMangaById(mangaId);
    if (!manga || !manga.investmentOffer || !manga.investmentOffer.isActive || !manga.author) {
      setTimeout(() => toast({ title: "Investment Unavailable", description: "This manga is not currently open for investment or author details are missing.", variant: "destructive" }), 0);
      return false;
    }
    
    const author = fetchAuthorDetails(manga.author.id);
    if (!author) {
      setTimeout(() => toast({ title: "Author Not Found", description: "Could not retrieve author details for investment.", variant: "destructive"}), 0);
      return false;
    }

     if (manga.investmentOffer.totalSharesInOffer > MAX_SHARES_PER_OFFER) {
      setTimeout(() => toast({ title: "Invalid Investment Offer", description: `Manga shares offered (${manga.investmentOffer.totalSharesInOffer}) exceed the maximum limit of ${MAX_SHARES_PER_OFFER}.`, variant: "destructive" }), 0);
      return false;
    }
    
    if (manga.investmentOffer.minSubscriptionRequirement && (!user.subscriptions || user.subscriptions.filter(s=>s.type === 'monthly' && s.mangaId === mangaId).length < manga.investmentOffer.minSubscriptionRequirement)) {
      const authorSpecificSubCount = user.subscriptions.filter(s => s.type === 'monthly' && s.mangaId === mangaId).length;
      setTimeout(() => toast({ title: "Author's Investment Requirement Not Met", description: `The author requires you to have at least ${manga.investmentOffer.minSubscriptionRequirement} monthly subscriptions to *this specific manga* to invest. You currently have ${authorSpecificSubCount}.`, variant: "destructive", duration: 8000 }), 0);
      return false;
    }

    if (user.walletBalance < totalCost) {
      setTimeout(() => toast({ title: "Insufficient Balance", description: `Investment requires $${totalCost.toFixed(2)}. Your balance is $${user.walletBalance.toFixed(2)}.`, variant: "destructive" }), 0);
      return false;
    }

    const existingInvestment = user.investments.find(inv => inv.mangaId === mangaId);
    const totalSharesOwnedAfter = (existingInvestment?.sharesOwned || 0) + sharesToBuy;

    if (manga.investmentOffer.maxSharesPerUser && totalSharesOwnedAfter > manga.investmentOffer.maxSharesPerUser) {
      setTimeout(() => toast({ title: "Share Limit Exceeded", description: `You can own a maximum of ${manga.investmentOffer.maxSharesPerUser} shares for this manga.`, variant: "destructive" }), 0);
      return false;
    }

    const totalSharesSoldByAuthor = manga.investors.reduce((sum, inv) => sum + inv.sharesOwned, 0);
    if (totalSharesSoldByAuthor + sharesToBuy > manga.investmentOffer.totalSharesInOffer) {
      setTimeout(() => toast({ title: "Not Enough Shares", description: `Only ${manga.investmentOffer.totalSharesInOffer - totalSharesSoldByAuthor} shares are available from the author.`, variant: "destructive"}), 0);
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
        updatedInvestments.push({ mangaId, mangaTitle, sharesOwned: sharesToBuy, amountInvested: totalCost, investmentDate: new Date().toISOString() });
      }
      return { 
        ...prevUser, 
        walletBalance: newBalance, 
        investments: updatedInvestments,
        investmentOpportunitiesAvailable: (prevUser.investmentOpportunitiesAvailable || 0) - 1,
       };
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
    
    updateMockAuthorBalance(author.id, author.walletBalance + capitalToAuthor);

    updateMockMangaData(mangaId, {
        investors: updatedMangaInvestors,
        lastInvestmentDate: new Date().toISOString(),
        investmentOffer: {
            ...manga.investmentOffer,
            totalCapitalRaised: (manga.investmentOffer.totalCapitalRaised || 0) + capitalToAuthor,
        }
    });

    recordTransaction({
        type: 'author_earning', amount: capitalToAuthor, userId: user.id, mangaId, authorId: manga.author.id, 
        description: `Investment of ${sharesToBuy} shares in ${mangaTitle} for author ${author.name}`,
        relatedData: { shares: sharesToBuy, pricePerShare, buyerUserId: user.id }
    });
    recordTransaction({
        type: 'user_payment', amount: -totalCost, userId: user.id, mangaId,
        description: `Invested in ${sharesToBuy} shares of ${mangaTitle}`,
        relatedData: { shares: sharesToBuy, pricePerShare }
    });
    recordTransaction({
        type: 'platform_earning', amount: platformCut, mangaId, authorId: manga.author.id,
        description: `Platform fee from ${mangaTitle} investment`,
        relatedData: { originalAmount: totalCost }
    });
    
    setTimeout(() => toast({ title: "Investment Successful!", description: `You've invested $${totalCost.toFixed(2)} for ${sharesToBuy} shares in ${mangaTitle}.` }), 0);
    return true;
  }, [user, toast, recordTransaction]);

  const rateManga = useCallback(async (mangaId: string, score: 1 | 2 | 3): Promise<boolean> => {
    if (!user) {
      setTimeout(() => toast({ title: "Login Required", description: "Please log in to rate.", variant: "destructive" }), 0);
      return false;
    }
    if (user.accountType === 'creator') {
      setTimeout(() => toast({ title: "Action Not Allowed", description: "Creators cannot rate manga.", variant: "destructive" }), 0);
      return false;
    }
     const manga = getMangaById(mangaId);
    if (!manga) {
      setTimeout(() => toast({ title: "Manga Not Found", variant: "destructive" }), 0);
      return false;
    }
    
    const hasAccessToRate = isSubscribedToManga(mangaId) || 
                            user.investments.some(inv => inv.mangaId === mangaId) || 
                            user.subscriptions.some(sub => sub.mangaId === mangaId && sub.type === 'chapter');

    if (!hasAccessToRate) {
      setTimeout(() => toast({ title: "Access Required", description: "You must be subscribed to, have purchased a chapter of, or invested in this manga to rate it.", variant: "destructive" }), 0);
      return false;
    }
    if (user.ratingsGiven && user.ratingsGiven[mangaId]) {
      setTimeout(() => toast({ title: "Already Rated", description: "You have already rated this manga.", variant: "default" }), 0);
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

    setTimeout(() => toast({ title: "Rating Submitted!", description: `You rated ${manga.title}. New average: ${newAverageRating.toFixed(1)}.` }), 0);
    return true;
  }, [user, toast, recordTransaction, isSubscribedToManga]);

  const addMangaSeries = useCallback(async (
    newMangaData: Omit<MangaSeries, 'id' | 'author' | 'publishedDate' | 'averageRating' | 'ratingCount' | 'viewCount' | 'totalRevenueFromSubscriptions' | 'totalRevenueFromDonations' | 'totalRevenueFromMerchandise' | 'investors' | 'chapters' | 'authorDetails' | 'lastUpdatedDate' | 'lastInvestmentDate' | 'lastSubscriptionDate' | 'comments'>
                  & { chaptersInput?: ChapterInputForAdd[], authorDetails?: AuthorContactDetails }
  ): Promise<MangaSeries | null> => {
    if (!user || user.accountType !== 'creator') {
      setTimeout(() => toast({ title: "Permission Denied", description: "Only creators can add new manga series.", variant: "destructive" }), 0);
      return null;
    }
    if (!user.isApproved) {
      setTimeout(() => toast({ title: "Account Not Approved", description: "Your creator account must be approved by an admin to publish manga.", variant: "destructive" }), 0);
      return null;
    }
    if (user.authoredMangaIds.length >= MAX_WORKS_PER_CREATOR) {
      setTimeout(() => toast({ title: "Limit Reached", description: `You can create a maximum of ${MAX_WORKS_PER_CREATOR} manga series.`, variant: "destructive" }), 0);
      return null;
    }
     if (newMangaData.investmentOffer && newMangaData.investmentOffer.totalSharesInOffer > MAX_SHARES_PER_OFFER) {
      setTimeout(() => toast({ title: "Invalid Investment Offer", description: `The total shares offered cannot exceed ${MAX_SHARES_PER_OFFER}.`, variant: "destructive" }), 0);
      return null;
    }


    const newMangaId = `manga-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const authorInfo = fetchAuthorDetails(user.id);
    if(!authorInfo) {
      setTimeout(() => toast({title: "Author Error", description: "Could not retrieve author details.", variant: "destructive"}), 0);
      return null;
    }
    const authorInfoForManga: GlobalAuthorInfo = { id: authorInfo.id, name: authorInfo.name, avatarUrl: authorInfo.avatarUrl, walletBalance: authorInfo.walletBalance, bankDetails: authorInfo.bankDetails, lastProfileUpdate: authorInfo.lastProfileUpdate };


    const mangaAuthorDetails: AuthorContactDetails | undefined = newMangaData.authorDetails || { email: user.email };

    const newMangaToAdd: MangaSeries = {
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
      subscriptionModel: newMangaData.subscriptionModel || 'monthly', 
      isPublished: newMangaData.isPublished !== undefined ? newMangaData.isPublished : true,
      freePreviewPageCount: newMangaData.freePreviewPageCount || 0,
      freePreviewChapterCount: newMangaData.freePreviewChapterCount || 0,
      comments: [],
    };

    globalAddMockManga(newMangaToAdd);
    setUser(prevUser => prevUser ? ({ ...prevUser, authoredMangaIds: [...prevUser.authoredMangaIds, newMangaToAdd.id] }) : null);

    recordTransaction({
      type: 'manga_creation', amount: 0, userId: user.id, authorId: user.id, mangaId: newMangaToAdd.id,
      description: `Creator ${user.name} added new manga: ${newMangaToAdd.title}`
    });

    setTimeout(() => toast({ title: "Manga Created!", description: `${newMangaToAdd.title} has been successfully added.` }), 0);
    return newMangaToAdd;
  }, [user, toast, recordTransaction]);

  const deleteMangaSeries = useCallback(async (mangaId: string): Promise<boolean> => {
    if (!user || user.accountType !== 'creator') {
      setTimeout(() => toast({ title: "Permission Denied", description: "Only creators can delete manga series.", variant: "destructive" }), 0);
      return false;
    }
     if (!user.isApproved) {
      setTimeout(() => toast({ title: "Account Not Approved", description: "Your creator account must be approved to manage manga.", variant: "destructive" }), 0);
      return false;
    }
    const mangaToDelete = getMangaById(mangaId);
    if (!mangaToDelete || mangaToDelete.author.id !== user.id) {
      setTimeout(() => toast({ title: "Permission Denied", description: "You can only delete your own manga series.", variant: "destructive" }), 0);
      return false;
    }

    const hasInvestors = mangaToDelete.investors && mangaToDelete.investors.length > 0;
    
    let hasActiveSubscribersOrPurchasers = false;
    const allUsersString = localStorage.getItem('mockUserList');
    if (allUsersString) {
        const allUsersList: User[] = JSON.parse(allUsersString);
        hasActiveSubscribersOrPurchasers = allUsersList.some(u => 
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
        setTimeout(() => toast({
          title: "Deletion Restricted",
          description: "This manga cannot be deleted yet due to active investments or subscriptions/purchases within the last year.",
          variant: "destructive", duration: 7000,
        }), 0);
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
    setTimeout(() => toast({ title: "Manga Deleted", description: `${mangaToDelete.title} has been removed.` }), 0);
    return true;
  }, [user, toast, recordTransaction]);


  const updateViewingHistory = useCallback((mangaId: string, chapterId: string, pageIndex: number) => {
    setViewingHistory(prev => new Map(prev).set(mangaId, { chapterId, pageIndex, date: new Date() }));
  }, []);

  const getViewingHistory = useCallback((mangaId: string) => {
    return viewingHistory.get(mangaId);
  }, [viewingHistory]);

  const addFunds = useCallback((amount: number) => {
    if (!user) return;
    if (amount <= 0) {
      setTimeout(() => toast({ title: "Invalid Amount", description: "Deposit amount must be positive.", variant: "destructive" }), 0);
      return;
    }
    setUser(prev => prev ? ({ ...prev, walletBalance: prev.walletBalance + amount }) : null);
    recordTransaction({
      type: 'wallet_deposit', amount: amount, userId: user.id,
      description: `Wallet deposit $${amount.toFixed(2)}`
    });
    setTimeout(() => toast({ title: "Funds Added", description: `$${amount.toFixed(2)} added to your wallet.` }), 0);
  }, [user, toast, recordTransaction]);

  const withdrawFunds = useCallback(async (amountToWithdraw: number): Promise<boolean> => {
    if (!user) {
      setTimeout(() => toast({ title: "Login Required", description: "Please log in to withdraw funds.", variant: "destructive" }), 0);
      return false;
    }
    if (amountToWithdraw <= 0) {
      setTimeout(() => toast({ title: "Invalid Amount", description: "Withdrawal amount must be positive.", variant: "destructive" }), 0);
      return false;
    }
    
    let currentBalance = 0;
    let isCreatorWithdrawal = false;
    let authorDetailsForWithdrawal: GlobalAuthorInfo | undefined = undefined;


    if (user.accountType === 'creator') {
        authorDetailsForWithdrawal = fetchAuthorDetails(user.id);
        if (!authorDetailsForWithdrawal) {
          setTimeout(() => toast({ title: "Author Error", description: "Could not retrieve author details for withdrawal.", variant: "destructive"}), 0);
          return false;
        }
        currentBalance = authorDetailsForWithdrawal.walletBalance;
        isCreatorWithdrawal = true;
    } else {
        currentBalance = user.walletBalance;
    }


    if (currentBalance < amountToWithdraw) {
      setTimeout(() => toast({ title: "Insufficient Balance", description: `Cannot withdraw $${amountToWithdraw.toFixed(2)}. Current balance: $${currentBalance.toFixed(2)}.`, variant: "destructive" }), 0);
      return false;
    }

    if (isCreatorWithdrawal) {
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
            const totalEarningsForManga = (manga.totalRevenueFromSubscriptions + manga.totalRevenueFromDonations + manga.totalRevenueFromMerchandise);
            const potentialDividendPool = totalEarningsForManga * (manga.investmentOffer.sharesOfferedTotalPercent / 100);
            
            if (potentialDividendPool > 0) { 
              setTimeout(() => toast({
                title: "Withdrawal Blocked for Creator",
                description: `Dividends for manga "${manga.title}" are due or pending calculation. Please process investor payouts before withdrawing general earnings.`,
                variant: "destructive", duration: 8000,
              }), 0);
              return false;
            }
          }
        }
      }
    }
    
    if (isCreatorWithdrawal && authorDetailsForWithdrawal) {
        updateMockAuthorBalance(user.id, currentBalance - amountToWithdraw);
        if (user.id === authorDetailsForWithdrawal.id) { 
             setUser(prev => prev ? { ...prev, walletBalance: prev.walletBalance - amountToWithdraw } : null); 
        }
    } else {
        setUser(prev => prev ? { ...prev, walletBalance: prev.walletBalance - amountToWithdraw } : null);
    }

    recordTransaction({
      type: 'wallet_withdrawal', amount: -amountToWithdraw, userId: user.id,
      description: `${user.accountType === 'creator' ? 'Creator ' : ''}User ${user.name} withdrew $${amountToWithdraw.toFixed(2)}`
    });
    setTimeout(() => toast({ title: "Withdrawal Processed", description: `$${amountToWithdraw.toFixed(2)} has been withdrawn. (Simulated)`}), 0);
    return true;
  }, [user, toast, recordTransaction]);
  
  const isFavorited = useCallback((mangaId: string) => {
    if (!user || user.accountType === 'creator') return false;
    return user.favorites?.includes(mangaId) || false;
  }, [user]);

  const toggleFavorite = useCallback((mangaId: string, mangaTitle: string) => {
    if (!user) {
      setTimeout(() => toast({ title: "Login Required", description: "Please log in to favorite manga.", variant: "destructive" }), 0);
      return;
    }
     if (user.accountType === 'creator') {
      setTimeout(() => toast({ title: "Action Not Allowed", description: "Creators cannot favorite manga.", variant: "destructive" }), 0);
      return;
    }
    
    setUser(prevUser => {
      if (!prevUser) return null;
      const currentFavorites = prevUser.favorites || [];
      if (currentFavorites.includes(mangaId)) {
        setTimeout(() => toast({ title: "Removed from Favorites", description: `${mangaTitle} removed from your favorites.` }), 0);
        return { ...prevUser, favorites: currentFavorites.filter(id => id !== mangaId) };
      } else {
        setTimeout(() => toast({ title: "Added to Favorites!", description: `${mangaTitle} added to your favorites.` }), 0);
        return { ...prevUser, favorites: [...currentFavorites, mangaId] };
      }
    });
  }, [user, toast]);

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
  }, []);

  const listSharesForSale = useCallback(async (mangaId: string, shares: number, pricePerShare: number, description: string): Promise<ShareListing | null> => {
    if (!user) {
      setTimeout(() => toast({ title: "Login Required", description: "Please log in to list shares.", variant: "destructive" }), 0);
      return null;
    }
     if (user.accountType === 'creator') { 
      setTimeout(() => toast({ title: "Action Not Allowed", description: "Creators cannot list shares on the secondary market.", variant: "destructive" }), 0);
      return null;
    }
    const investment = user.investments.find(inv => inv.mangaId === mangaId);
    if (!investment) {
      setTimeout(() => toast({ title: "No Investment Found", description: "You do not own shares in this manga.", variant: "destructive" }), 0);
      return null;
    }
    if (investment.isListedForSale && investment.listingId) {
      setTimeout(() => toast({ title: "Already Listed", description: `You already have ${investment.sharesListed} shares of this manga listed. Please delist first to create a new listing.`, variant: "destructive", duration: 6000}), 0);
      return null;
    }
    if (shares <= 0) {
      setTimeout(() => toast({ title: "Invalid Shares", description: "Number of shares to list must be positive.", variant: "destructive"}), 0);
      return null;
    }
    if (shares > investment.sharesOwned - (investment.sharesListed || 0)) {
      setTimeout(() => toast({ title: "Insufficient Unlisted Shares", description: `You only have ${investment.sharesOwned - (investment.sharesListed || 0)} unlisted shares.`, variant: "destructive" }), 0);
      return null;
    }


    const mangaDetails = getMangaById(mangaId);
    if (!mangaDetails) {
      setTimeout(() => toast({ title: "Manga Not Found", variant: "destructive" }), 0);
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
          ? { ...inv, isListedForSale: true, listingId: newListing.id, sharesListed: (inv.sharesListed || 0) + shares, listedPricePerShare: pricePerShare, listingDescription: description } 
          : inv
        )
      };
    });
    recordTransaction({ type: 'list_shares_for_sale', amount: 0, userId: user.id, mangaId, description: `Listed ${shares} shares of ${mangaDetails.title} for $${pricePerShare.toFixed(2)}/share. Listing ID: ${newListing.id}`, relatedData: { listingId: newListing.id, shares, pricePerShare } });
    setTimeout(() => toast({ title: "Shares Listed!", description: `${shares} shares of ${mangaDetails.title} are now on the market.` }), 0);
    return newListing;
  }, [user, toast, recordTransaction]);

  const delistSharesFromSale = useCallback(async (mangaId: string, listingId: string): Promise<boolean> => {
     if (!user) {
      setTimeout(() => toast({ title: "Login Required", variant: "destructive" }), 0);
      return false;
    }
    if (user.accountType === 'creator') {
      setTimeout(() => toast({ title: "Action Not Allowed", description: "Creators cannot manage secondary market listings.", variant: "destructive" }), 0);
      return false;
    }
    const investment = user.investments.find(inv => inv.mangaId === mangaId && inv.listingId === listingId);
    if (!investment || !investment.isListedForSale) {
      setTimeout(() => toast({ title: "Listing Not Found", description: "No active listing by you for these shares.", variant: "destructive" }), 0);
      return false;
    }
    
    globalRemoveShareListing(listingId); 

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
    setTimeout(() => toast({ title: "Shares Delisted", description: `Your shares of ${investment.mangaTitle} have been removed from the market.` }), 0);
    return true;
  }, [user, toast, recordTransaction]);

  const purchaseSharesFromListing = useCallback(async (listingId: string, sharesToBuy: number): Promise<boolean> => {
    if (!user) {
      setTimeout(() => toast({ title: "Login Required", description: "Please login to purchase shares.", variant: "destructive" }), 0);
      return false;
    }
     if (user.accountType === 'creator') {
      setTimeout(() => toast({ title: "Action Not Allowed", description: "Creators cannot purchase shares from the market.", variant: "destructive" }), 0);
      return false;
    }
    if ((user.investmentOpportunitiesAvailable || 0) <= 0) {
      setTimeout(() => toast({ title: "Investment Locked", description: `You need an available investment opportunity. Earn one by making 5 combined subscriptions or donations. You have ${user.investmentOpportunitiesAvailable || 0} opportunities.`, variant: "destructive", duration: 7000 }), 0);
      return false;
    }

    const listing = getShareListingById(listingId);
    if (!listing || !listing.isActive || listing.sharesOffered < sharesToBuy) {
      setTimeout(() => toast({ title: "Listing Unavailable", description: "This listing is no longer available or doesn't have enough shares.", variant: "destructive" }), 0);
      return false;
    }
    if (user.id === listing.sellerUserId) {
      setTimeout(() => toast({ title: "Cannot Buy Own Shares", variant: "default" }), 0);
      return false;
    }
    const totalCost = sharesToBuy * listing.pricePerShare;
    if (user.walletBalance < totalCost) {
      setTimeout(() => toast({ title: "Insufficient Balance", description: `Purchase requires $${totalCost.toFixed(2)}. Your balance: $${user.walletBalance.toFixed(2)}.`, variant: "destructive" }), 0);
      return false;
    }

    
    setUser(prevUser => {
      if (!prevUser) return null;
      const newBalance = prevUser.walletBalance - totalCost;
      let updatedInvestments = [...prevUser.investments];
      const existingInvestment = updatedInvestments.find(inv => inv.mangaId === listing.mangaId);
      if (existingInvestment) {
        updatedInvestments = updatedInvestments.map(inv => 
          inv.mangaId === listing.mangaId 
          ? { ...inv, sharesOwned: inv.sharesOwned + sharesToBuy, amountInvested: inv.amountInvested + totalCost } 
          : inv
        );
      } else {
        updatedInvestments.push({ mangaId: listing.mangaId, mangaTitle: listing.mangaTitle, sharesOwned: sharesToBuy, amountInvested: totalCost, investmentDate: new Date().toISOString() });
      }
      return { 
        ...prevUser, 
        walletBalance: newBalance, 
        investments: updatedInvestments,
        investmentOpportunitiesAvailable: (prevUser.investmentOpportunitiesAvailable || 0) -1,
      };
    });
    recordTransaction({ type: 'user_payment', amount: -totalCost, userId: user.id, mangaId: listing.mangaId, description: `Purchased ${sharesToBuy} shares of ${listing.mangaTitle} from market. Listing ID: ${listingId}`, relatedData: { listingId, sharesToBuy, pricePerShare: listing.pricePerShare, sellerUserId: listing.sellerUserId } });

    
    const platformCut = totalCost * PLATFORM_FEE_RATE;
    const proceedsToSeller = totalCost - platformCut;

    const sellerDetails = fetchAuthorDetails(listing.sellerUserId); 
    if (sellerDetails) {
      updateMockAuthorBalance(sellerDetails.id, sellerDetails.walletBalance + proceedsToSeller);
    }

    recordTransaction({ type: 'shares_sale_secondary', amount: proceedsToSeller, userId: listing.sellerUserId, mangaId: listing.mangaId, description: `Sold ${sharesToBuy} shares of ${listing.mangaTitle} on market. Listing ID: ${listingId}`, relatedData: { listingId, sharesSold: sharesToBuy, pricePerShare: listing.pricePerShare, buyerUserId: user.id } });
    recordTransaction({ type: 'platform_earning', amount: platformCut, mangaId: listing.mangaId, description: `Platform fee from secondary market sale of ${listing.mangaTitle} shares. Listing ID: ${listingId}`, relatedData: { originalAmount: totalCost, listingId }});
    if(sellerDetails) { 
      recordTransaction({ type: 'author_earning', amount: proceedsToSeller, authorId: sellerDetails.id, mangaId: listing.mangaId, description: `Earnings from selling ${sharesToBuy} shares of ${listing.mangaTitle} on market. Listing ID: ${listingId}`, relatedData: { listingId, sharesSold: sharesToBuy, pricePerShare: listing.pricePerShare, buyerUserId: user.id } });
    }

    updateShareListingOnPurchase(listingId, sharesToBuy);
    
    const mockUserListString = localStorage.getItem('mockUserList');
    if (mockUserListString) {
        let mockUserListFromStorage: User[] = JSON.parse(mockUserListString);
        const sellerIndex = mockUserListFromStorage.findIndex(u => u.id === listing.sellerUserId);
        if (sellerIndex !== -1) {
            const seller = mockUserListFromStorage[sellerIndex];
            const investmentIndex = seller.investments.findIndex(inv => inv.mangaId === listing.mangaId);
            if (investmentIndex !== -1) {
                seller.investments[investmentIndex].sharesOwned -= sharesToBuy;
                if (seller.investments[investmentIndex].listingId === listingId && 
                    ( (seller.investments[investmentIndex].sharesListed || 0) - sharesToBuy <=0) ) {
                     seller.investments[investmentIndex].isListedForSale = false;
                     seller.investments[investmentIndex].listingId = undefined;
                     seller.investments[investmentIndex].sharesListed = 0;
                     seller.investments[investmentIndex].listedPricePerShare = undefined;
                     seller.investments[investmentIndex].listingDescription = undefined;
                } else if (seller.investments[investmentIndex].listingId === listingId) {
                     seller.investments[investmentIndex].sharesListed = (seller.investments[investmentIndex].sharesListed || 0) - sharesToBuy;
                }
            }
            localStorage.setItem('mockUserList', JSON.stringify(mockUserListFromStorage));
        }
    }

    setTimeout(() => toast({ title: "Purchase Successful!", description: `You bought ${sharesToBuy} shares of ${listing.mangaTitle}.`}), 0);
    return true;
  }, [user, toast, recordTransaction]);

  const followShareListing = useCallback((listingId: string) => {
    if (!user) return;
     if (user.accountType === 'creator') {
      setTimeout(() => toast({ title: "Action Not Allowed", description: "Creators cannot follow share listings.", variant: "destructive" }), 0);
      return;
    }
    setUser(prev => prev ? ({ ...prev, followedShareListings: [...(prev.followedShareListings || []), listingId] }) : null);
    updateListingFollowerCount(listingId, true);
    setTimeout(() => toast({title: "Followed Listing", description: "You will now receive updates for this listing."}), 0);
  }, [user, toast]); 

  const unfollowShareListing = useCallback((listingId: string) => {
    if (!user) return;
     if (user.accountType === 'creator') {
      setTimeout(() => toast({ title: "Action Not Allowed", description: "Creators cannot unfollow share listings.", variant: "destructive" }), 0);
      return;
    }
    setUser(prev => prev ? ({ ...prev, followedShareListings: (prev.followedShareListings || []).filter(id => id !== listingId) }) : null);
    updateListingFollowerCount(listingId, false);
    setTimeout(() => toast({title: "Unfollowed Listing", description: "You will no longer receive updates."}), 0);
  }, [user, toast]); 

  const isShareListingFollowed = useCallback((listingId: string) => {
    if (!user || user.accountType === 'creator') return false;
    return user.followedShareListings?.includes(listingId) || false;
  }, [user]);

  const addCommentToManga = useCallback(async (mangaId: string, text: string, parentId?: string): Promise<Comment | null> => {
    if (!user) {
      setTimeout(() => toast({ title: "Login Required", description: "Please log in to add a comment.", variant: "destructive" }), 0);
      return null;
    }
    const currentManga = getMangaById(mangaId);
    // Allow creators to comment on their own manga, but not others. Users can comment on any.
    if (user.accountType === 'creator' && currentManga && currentManga.author.id !== user.id) {
      setTimeout(() => toast({ title: "Action Not Allowed", description: "Creators can only comment on their own works.", variant: "destructive" }), 0);
      return null;
    }
    if (!currentManga) {
      setTimeout(() => toast({ title: "Manga Not Found", variant: "destructive" }), 0);
      return null;
    }
    if (!text.trim()) {
      setTimeout(() => toast({ title: "Empty Comment", description: "Comment cannot be empty.", variant: "destructive" }), 0);
      return null;
    }

    const newCommentData: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      mangaId,
      userId: user.id,
      userName: user.name,
      userAvatarUrl: user.avatarUrl,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      parentId: parentId, // Store parentId if it's a reply
      replies: [], // Initialize replies array
    };

    const addedComment = addCommentToMockManga(mangaId, newCommentData, parentId);
    if (addedComment) {
        recordTransaction({
            type: 'comment_added',
            amount: 0,
            userId: user.id,
            mangaId,
            description: `User ${user.name} ${parentId ? 'replied to a comment on' : 'commented on'} ${currentManga.title}`,
            relatedData: { commentText: text.trim(), parentId }
        });
        setTimeout(() => toast({ title: "Comment Added!", description: `Your ${parentId ? 'reply' : 'comment'} has been posted.` }), 0);
        return addedComment;
    } else {
        setTimeout(() => toast({ title: "Error", description: "Failed to add comment.", variant: "destructive" }), 0);
        return null;
    }
  }, [user, toast, recordTransaction]);


  return (
    <AuthContext.Provider value={{
        user, login, signup, logout, updateUserProfile,
        isSubscribedToManga, hasPurchasedChapter, purchaseAccess, 
        donateToManga, investInManga, rateManga,
        addMangaSeries, deleteMangaSeries,
        viewingHistory, updateViewingHistory, getViewingHistory,
        transactions, addFunds, withdrawFunds, approveCreatorAccount,
        isFavorited, toggleFavorite, updateUserSearchHistory,
        listSharesForSale, delistSharesFromSale, purchaseSharesFromListing,
        followShareListing, unfollowShareListing, isShareListingFollowed,
        addCommentToManga,
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
