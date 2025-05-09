"use client";
// src/contexts/AuthContext.tsx
import type { User, UserSubscription, UserInvestment, SimulatedTransaction, MangaSeries, MangaInvestor, Chapter, MangaPage, AuthorContactDetails } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateMockMangaData, getMangaById, addMockMangaSeries as globalAddMockManga, deleteMockMangaData as globalDeleteManga, getAuthorById as fetchAuthorDetails, modifiableMockMangaSeries } from '@/lib/mock-data';
import { MAX_WORKS_PER_CREATOR } from '@/lib/constants';

const PLATFORM_FEE_RATE = 0.10; // 10% platform fee
const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

// Define the structure for chapter input when adding a new manga series
interface ChapterInputForAdd {
  title: string;
  pages: { previewUrl: string }[]; // Each page will have a preview URL (base64 data URI for mock)
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
  withdrawFunds: (amount: number) => Promise<boolean>;
  approveCreatorAccount: (creatorId: string) => void;
  isFavorited: (mangaId: string) => boolean;
  toggleFavorite: (mangaId: string, mangaTitle: string) => void;
  updateUserSearchHistory: (searchTerm: string) => void;
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
    setTransactions(prev => [newTransaction, ...prev].slice(0, 50)); // Keep last 50 transactions
  }, []);


  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser) as User;
      setUser({
        ...MOCK_USER_VALID, // Default values
        ...parsedUser, // Overwrite with stored values
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
        title: "账号待审批",
        description: "您的创作者账号正在等待平台管理员审批。在此之前您无法登录。",
        variant: "destructive",
        duration: 7000
      });
      return;
    }

    setUser(fullUserData);
    toast({ title: "登录成功", description: `欢迎回来, ${fullUserData.name}!` });
  };

  const signup = (name: string, email: string, accountType: 'user' | 'creator'): User | null => {
    const storedUsersString = localStorage.getItem('mockUserList');
    const mockUserList: User[] = storedUsersString ? JSON.parse(storedUsersString) : [];
    if (mockUserList.some(u => u.email === email)) {
        toast({ title: "注册失败", description: "该邮箱已被注册。", variant: "destructive" });
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
      isApproved: accountType === 'user' ? true : false, // Creators start as not approved
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
      description: `账号创建: ${name} (${accountType}). ${accountType === 'creator' ? '待审批.' : '初始余额: $' + newUser.walletBalance.toFixed(2)}`,
      relatedData: { accountType }
    });

    if (accountType === 'creator') {
      recordTransaction({
        type: 'creator_approval_pending',
        amount: 0,
        userId: newUser.id,
        description: `创作者 ${name} 账号注册，等待审批。`,
      });
      toast({
        title: "创作者账号已注册",
        description: `欢迎, ${name}! 您的创作者账号已注册，并等待管理员审批。审批通过后即可登录和发布作品。`,
        duration: 10000
      });
      if (email === MOCK_USER_VALID.email) {
        setTimeout(() => approveCreatorAccount(newUser.id), 2000);
      }
    } else {
      setUser(newUser);
      toast({ title: "注册成功!", description: `欢迎, ${name}! 您的账号已创建。` });
    }
    return newUser;
  };

  const logout = () => {
    setUser(null);
    toast({ title: "登出成功", description: "您已成功登出。" });
  }

  const isSubscribedToManga = (mangaId: string) => {
    return user?.subscriptions.some(sub => sub.mangaId === mangaId) || false;
  };

  const subscribeToManga = async (mangaId: string, mangaTitle: string, price: number): Promise<boolean> => {
    if (!user) {
      toast({ title: "需要登录", description: "请登录后订阅。", variant: "destructive" });
      return false;
    }
    if (user.walletBalance < price) {
      toast({ title: "余额不足", description: `订阅需要 $${price.toFixed(2)}。您的余额为 $${user.walletBalance.toFixed(2)}。`, variant: "destructive" });
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
      const platformCut = price * PLATFORM_FEE_RATE;
      const revenueToAuthor = price - platformCut;
      updateMockMangaData(mangaId, { 
        totalRevenueFromSubscriptions: (manga.totalRevenueFromSubscriptions || 0) + revenueToAuthor,
        lastSubscriptionDate: new Date().toISOString() 
      });
       recordTransaction({
        type: 'subscription_payment',
        amount: -price,
        userId: user.id,
        mangaId,
        description: `订阅漫画: ${mangaTitle}`,
      });
       recordTransaction({ // Platform Earning
        type: 'platform_earning',
        amount: platformCut,
        mangaId,
        description: `平台佣金 (订阅 ${mangaTitle})`,
         relatedData: { from: 'user_payment', originalAmount: price }
      });
       recordTransaction({
        type: 'author_earning',
        amount: revenueToAuthor,
        authorId: manga.author.id,
        mangaId,
        description: `来自 ${mangaTitle} 的订阅收益`,
      });
      toast({ title: "订阅成功!", description: `您已成功订阅 ${mangaTitle}，费用 $${price.toFixed(2)}。` });
    }
    return true;
  };

  const donateToManga = async (mangaId: string, mangaTitle: string, authorId: string, amount: number): Promise<boolean> => {
    if (!user) {
      toast({ title: "需要登录", description: "请登录后打赏。", variant: "destructive" });
      return false;
    }
    if (amount <= 0) {
       toast({ title: "金额无效", description: "打赏金额必须为正数。", variant: "destructive" });
      return false;
    }
    if (user.walletBalance < amount) {
      toast({ title: "余额不足", description: `打赏需要 $${amount.toFixed(2)}。您的余额为 $${user.walletBalance.toFixed(2)}。`, variant: "destructive" });
      return false;
    }

    setUser(prevUser => {
      if (!prevUser) return null;
      return { ...prevUser, walletBalance: prevUser.walletBalance - amount };
    });

    const manga = getMangaById(mangaId);
    if (manga) {
      const platformCut = amount * PLATFORM_FEE_RATE;
      const revenueToAuthor = amount - platformCut;
      updateMockMangaData(mangaId, { totalRevenueFromDonations: (manga.totalRevenueFromDonations || 0) + revenueToAuthor });
      recordTransaction({
        type: 'donation_payment',
        amount: -amount,
        userId: user.id,
        mangaId,
        authorId,
        description: `打赏漫画: ${mangaTitle}`,
      });
      recordTransaction({ // Platform Earning
        type: 'platform_earning',
        amount: platformCut,
        mangaId,
        authorId,
        description: `平台佣金 (打赏 ${mangaTitle})`,
        relatedData: { from: 'user_payment', originalAmount: amount }
      });
      recordTransaction({
        type: 'author_earning',
        amount: revenueToAuthor,
        authorId,
        mangaId,
        description: `来自 ${mangaTitle} 的打赏收益`,
      });
      toast({ title: "打赏成功!", description: `您已成功向 ${mangaTitle} 打赏 $${amount.toFixed(2)}。` });
    }
    return true;
  };

  const investInManga = async (mangaId: string, mangaTitle: string, sharesToBuy: number, pricePerShare: number, totalCost: number): Promise<boolean> => {
    if (!user) {
      toast({ title: "需要登录", description: "请登录后投资。", variant: "destructive" });
      return false;
    }
    const manga = getMangaById(mangaId);
    if (!manga || !manga.investmentOffer || !manga.investmentOffer.isActive) {
      toast({ title: "投资不可用", description: "此漫画目前不开放投资。", variant: "destructive" });
      return false;
    }
    if (manga.investmentOffer.minSubscriptionRequirement && (!user.subscriptions || user.subscriptions.length < manga.investmentOffer.minSubscriptionRequirement)) {
      toast({ title: "未满足投资要求", description: `您需要至少订阅 ${manga.investmentOffer.minSubscriptionRequirement} 部漫画才能投资。您当前已订阅 ${user.subscriptions?.length || 0} 部。`, variant: "destructive", duration: 7000 });
      return false;
    }
    if (user.walletBalance < totalCost) {
      toast({ title: "余额不足", description: `投资需要 $${totalCost.toFixed(2)}。您的余额为 $${user.walletBalance.toFixed(2)}。`, variant: "destructive" });
      return false;
    }

    const existingInvestment = user.investments.find(inv => inv.mangaId === mangaId);
    const totalSharesOwnedAfter = (existingInvestment?.sharesOwned || 0) + sharesToBuy;

    if (manga.investmentOffer.maxSharesPerUser && totalSharesOwnedAfter > manga.investmentOffer.maxSharesPerUser) {
       toast({ title: "超出持股上限", description: `您最多能持有此漫画 ${manga.investmentOffer.maxSharesPerUser} 份股份。`, variant: "destructive" });
      return false;
    }

    const totalSharesSold = manga.investors.reduce((sum, inv) => sum + inv.sharesOwned, 0);
    if (totalSharesSold + sharesToBuy > manga.investmentOffer.totalSharesInOffer) {
      toast({ title: "股份不足", description: `此众筹项目仅剩 ${manga.investmentOffer.totalSharesInOffer - totalSharesSold} 份股份。`, variant: "destructive"});
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

    const platformCut = totalCost * PLATFORM_FEE_RATE;
    const authorGets = totalCost - platformCut;
    updateMockMangaData(mangaId, {
        investors: updatedMangaInvestors,
        lastInvestmentDate: new Date().toISOString(),
    });

    recordTransaction({
        type: 'investment_payment',
        amount: -totalCost,
        userId: user.id,
        mangaId,
        description: `投资 ${mangaTitle} ${sharesToBuy} 份股份`,
    });
     recordTransaction({ // Platform Earning
        type: 'platform_earning',
        amount: platformCut,
        mangaId,
        authorId: manga.author.id,
        description: `平台佣金 (投资 ${mangaTitle})`,
        relatedData: { from: 'user_payment', originalAmount: totalCost }
    });
    recordTransaction({
        type: 'author_earning',
        amount: authorGets,
        authorId: manga.author.id,
        mangaId,
        description: `收到 ${mangaTitle} 的投资款`,
    });
    toast({ title: "投资成功!", description: `您已成功向 ${mangaTitle} 投资 $${totalCost.toFixed(2)}，获得 ${sharesToBuy} 份股份。` });
    return true;
  };

  const rateManga = async (mangaId: string, score: 1 | 2 | 3): Promise<boolean> => {
    if (!user) {
      toast({ title: "需要登录", description: "请登录后评分。", variant: "destructive" });
      return false;
    }

    if (!isSubscribedToManga(mangaId)) {
      toast({ title: "需要订阅", description: "您需要先订阅这部漫画才能评价。", variant: "destructive" });
      return false;
    }

    if (user.ratingsGiven && user.ratingsGiven[mangaId]) {
      toast({ title: "已评价", description: "您已经评价过这部漫画了。", variant: "default" });
      return false;
    }

    const manga = getMangaById(mangaId);
    if (!manga) {
      toast({ title: "漫画未找到", variant: "destructive" });
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
      type: 'rating_update',
      amount: 0, 
      userId: user.id,
      mangaId,
      description: `评价漫画 ${manga.title} 分数: ${score}`,
      relatedData: { score }
    });

    toast({ title: "评价已提交!", description: `您评价了 ${manga.title}。新的平均分: ${newAverageRating.toFixed(1)}。` });
    return true;
  };

  const addMangaSeries = async (
    newMangaData: Omit<MangaSeries, 'id' | 'author' | 'publishedDate' | 'averageRating' | 'ratingCount' | 'viewCount' | 'totalRevenueFromSubscriptions' | 'totalRevenueFromDonations' | 'totalRevenueFromMerchandise' | 'investors' | 'chapters' | 'authorDetails' | 'lastUpdatedDate' | 'lastInvestmentDate' | 'lastSubscriptionDate'>
                  & { chaptersInput?: ChapterInputForAdd[], authorDetails?: AuthorContactDetails }
  ): Promise<MangaSeries | null> => {
    if (!user || user.accountType !== 'creator') {
      toast({ title: "权限不足", description: "仅创作者可添加新漫画系列。", variant: "destructive" });
      return null;
    }
    if (!user.isApproved) {
      toast({ title: "账号未审批", description: "您的创作者账号需经管理员审批后才能发布漫画。", variant: "destructive" });
      return null;
    }
    if (user.authoredMangaIds.length >= MAX_WORKS_PER_CREATOR) {
      toast({ title: "已达上限", description: `您最多能创建 ${MAX_WORKS_PER_CREATOR} 部漫画系列。`, variant: "destructive" });
      return null;
    }

    const newMangaId = `manga-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const authorInfoForManga: MangaSeries['author'] = {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };

    const mangaAuthorDetails: AuthorContactDetails | undefined = newMangaData.authorDetails
        ? newMangaData.authorDetails
        : { email: user.email };


    const newManga: MangaSeries = {
      id: newMangaId,
      author: authorInfoForManga,
      authorDetails: mangaAuthorDetails,
      ...newMangaData,
      chapters: (newMangaData.chaptersInput || []).map((chapInput, chapterIndex) => ({
        id: `${newMangaId}-chapter-${chapterIndex + 1}`,
        title: chapInput.title,
        chapterNumber: chapterIndex + 1,
        pages: chapInput.pages.map((pageInput, pageIndex) => ({
            id: `${newMangaId}-chapter-${chapterIndex + 1}-page-${pageIndex + 1}`,
            imageUrl: pageInput.previewUrl, // This is the base64 data URI from preview
            altText: `Page ${pageIndex + 1}`,
        })),
      })),
      publishedDate: new Date().toISOString(),
      lastUpdatedDate: new Date().toISOString(),
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

    recordTransaction({
      type: 'manga_creation',
      amount: 0,
      userId: user.id,
      authorId: user.id,
      mangaId: newManga.id,
      description: `创作者 ${user.name} 添加新漫画: ${newManga.title}`
    });

    toast({ title: "漫画已创建!", description: `${newManga.title} 已成功添加。` });
    return newManga;
  };

  const deleteMangaSeries = async (mangaId: string): Promise<boolean> => {
    if (!user || user.accountType !== 'creator') {
      toast({ title: "权限不足", description: "仅创作者可删除漫画系列。", variant: "destructive" });
      return false;
    }
     if (!user.isApproved) {
      toast({ title: "账号未审批", description: "您的创作者账号需经管理员审批才能管理漫画。", variant: "destructive" });
      return false;
    }
    const mangaToDelete = getMangaById(mangaId);
    if (!mangaToDelete || mangaToDelete.author.id !== user.id) {
      toast({ title: "权限不足", description: "您只能删除自己的漫画系列。", variant: "destructive" });
      return false;
    }

    // Deletion restriction logic
    const hasInvestors = mangaToDelete.investors && mangaToDelete.investors.length > 0;
    const hasPotentialSubscribers = mangaToDelete.subscriptionPrice !== undefined && mangaToDelete.subscriptionPrice > 0; // Simplified check
    
    if (hasInvestors || hasPotentialSubscribers) {
      const publishedDate = new Date(mangaToDelete.publishedDate).getTime();
      const lastActivityDate = Math.max(
        publishedDate, 
        mangaToDelete.lastInvestmentDate ? new Date(mangaToDelete.lastInvestmentDate).getTime() : 0,
        mangaToDelete.lastSubscriptionDate ? new Date(mangaToDelete.lastSubscriptionDate).getTime() : 0 
      );

      if ((Date.now() - lastActivityDate) < ONE_YEAR_IN_MS) {
        toast({
          title: "删除受限",
          description: "由于该作品存在活跃投资者或订阅者，且距离上次相关活动未满一年，暂时无法删除。",
          variant: "destructive",
          duration: 7000,
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
      type: 'manga_deletion',
      amount: 0,
      userId: user.id,
      authorId: user.id,
      mangaId: mangaId,
      description: `创作者 ${user.name} 删除漫画: ${mangaToDelete.title}`
    });
    toast({ title: "漫画已删除", description: `${mangaToDelete.title} 已被移除。` });
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
      toast({ title: "金额无效", description: "充值金额必须为正数。", variant: "destructive" });
      return;
    }
    setUser(prev => prev ? ({ ...prev, walletBalance: prev.walletBalance + amount }) : null);
    recordTransaction({
      type: 'wallet_deposit',
      amount: amount,
      userId: user.id,
      description: `钱包充值 $${amount.toFixed(2)}`
    });
    toast({ title: "充值成功", description: `$${amount.toFixed(2)} 已添加到您的钱包。` });
  };

  const withdrawFunds = async (amount: number): Promise<boolean> => {
    if (!user || user.accountType !== 'creator') {
      toast({ title: "权限不足", description: "仅创作者可提现资金。", variant: "destructive" });
      return false;
    }
    if (amount <= 0) {
      toast({ title: "金额无效", description: "提现金额必须为正数。", variant: "destructive" });
      return false;
    }
    if (user.walletBalance < amount) {
      toast({ title: "余额不足", description: `您的钱包余额不足以提现 $${amount.toFixed(2)}。`, variant: "destructive" });
      return false;
    }

    // Conceptual dividend check for each authored manga with an active investment offer
    for (const mangaId of user.authoredMangaIds) {
      const manga = getMangaById(mangaId);
      if (manga?.investmentOffer?.isActive && manga.investmentOffer.dividendPayoutCycle) {
        const cycleMonths = manga.investmentOffer.dividendPayoutCycle;
        const lastPayout = manga.investmentOffer.lastDividendPayoutDate 
                            ? new Date(manga.investmentOffer.lastDividendPayoutDate)
                            : new Date(manga.publishedDate); // If never paid, use published date as start
        
        const nextPayoutDate = new Date(lastPayout);
        nextPayoutDate.setMonth(nextPayoutDate.getMonth() + cycleMonths);

        if (new Date() >= nextPayoutDate) {
          toast({
            title: "提现受限",
            description: `漫画 "${manga.title}" 的投资者分红尚未结清。请先处理分红后再尝试提现。`,
            variant: "destructive",
            duration: 7000,
          });
          return false;
        }
      }
    }
    
    setUser(prev => prev ? { ...prev, walletBalance: prev.walletBalance - amount } : null);
    recordTransaction({
      type: 'wallet_withdrawal',
      amount: -amount, // Negative as it's an expense from user's wallet
      userId: user.id,
      authorId: user.id,
      description: `创作者 ${user.name} 提现 $${amount.toFixed(2)}`
    });
    toast({ title: "提现请求已提交", description: `已提交 $${amount.toFixed(2)} 的提现请求。实际处理需后端支持。`});
    return true;
  };

  const approveCreatorAccount = (creatorId: string) => {
    let userWasUpdated = false;
    if (user && user.id === creatorId && user.accountType === 'creator' && !user.isApproved) {
      setUser(prev => prev ? ({ ...prev, isApproved: true }) : null);
      toast({ title: "创作者已审批", description: `创作者 ${user.name} (${user.email}) 已被批准。` });
      recordTransaction({ type: 'creator_approved', amount: 0, userId: creatorId, description: `创作者 ${user.name} 账号已批准。` });
      userWasUpdated = true;
    } else {
      const storedUsersString = localStorage.getItem('mockUserList');
      if (storedUsersString) {
        let mockUserList: User[] = JSON.parse(storedUsersString);
        const userIndex = mockUserList.findIndex(u => u.id === creatorId && u.accountType === 'creator' && !u.isApproved);
        if (userIndex !== -1) {
          mockUserList[userIndex].isApproved = true;
          localStorage.setItem('mockUserList', JSON.stringify(mockUserList));
          if (user && user.id === creatorId && user.accountType === 'creator' && !user.isApproved) {
             setUser(prev => prev ? ({ ...prev, isApproved: true }) : null);
          }
          toast({ title: "创作者已审批", description: `创作者账号 ${mockUserList[userIndex].name} 已被批准。` });
          recordTransaction({ type: 'creator_approved', amount: 0, userId: creatorId, description: `创作者账号 ${mockUserList[userIndex].name} 已批准。`});
          userWasUpdated = true;
        }
      }
    }
    if (!userWasUpdated) {
        console.warn(`approveCreatorAccount: Creator ID ${creatorId} not found, already approved, or not a creator.`);
        toast({title: "审批操作", description: `尝试批准创作者 ${creatorId}。未找到或状态无变化。`, variant: "default"})
    }
  };

  const isFavorited = (mangaId: string) => {
    return user?.favorites?.includes(mangaId) || false;
  };

  const toggleFavorite = (mangaId: string, mangaTitle: string) => {
    if (!user) {
      toast({ title: "需要登录", description: "请登录后收藏漫画。", variant: "destructive" });
      return;
    }
    setUser(prevUser => {
      if (!prevUser) return null;
      const currentFavorites = prevUser.favorites || [];
      if (currentFavorites.includes(mangaId)) {
        toast({ title: "已取消收藏", description: `已将 ${mangaTitle} 从收藏中移除。` });
        return { ...prevUser, favorites: currentFavorites.filter(id => id !== mangaId) };
      } else {
        toast({ title: "已收藏!", description: `${mangaTitle} 已添加到您的收藏。` });
        return { ...prevUser, favorites: [...currentFavorites, mangaId] };
      }
    });
  };

  const updateUserSearchHistory = (searchTerm: string) => {
    if (!user) return;
    setUser(prevUser => {
      if (!prevUser) return null;
      const currentHistory = prevUser.searchHistory || [];
      const updatedHistory = [searchTerm, ...currentHistory.filter(term => term !== searchTerm)].slice(0, 10); // Keep last 10 unique
      return { ...prevUser, searchHistory: updatedHistory };
    });
  };


  return (
    <AuthContext.Provider value={{
        user,
        login,
        signup,
        logout,
        isSubscribedToManga,
        subscribeToManga,
        donateToManga,
        investInManga,
        rateManga,
        addMangaSeries,
        deleteMangaSeries,
        viewingHistory,
        updateViewingHistory,
        getViewingHistory,
        transactions,
        addFunds,
        withdrawFunds,
        approveCreatorAccount,
        isFavorited,
        toggleFavorite,
        updateUserSearchHistory,
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
