// src/lib/mock-data.ts
import type { MangaSeries, MangaPage, AuthorInfo, MangaInvestmentOffer, AuthorContactDetails, Chapter, ShareListing, UserInvestment, Comment, BankAccountDetails } from './types';
import { MANGA_GENRES_DETAILS, MAX_SHARES_PER_OFFER } from './constants';

const generatePages = (chapterId: string, count: number): MangaPage[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${chapterId}-page-${i + 1}`,
    imageUrl: `https://picsum.photos/800/1200?random=${chapterId}${i + 1}`,
    altText: `Page ${i + 1}`,
  }));
};

export let mockAuthors: (AuthorInfo & { contactDetails?: AuthorContactDetails, isSystemUser?: boolean, walletBalance: number, bankDetails?: BankAccountDetails, donationCount?: number, investmentOpportunitiesAvailable?: number, lastProfileUpdate?: string })[] = [
  {
    id: 'author-1',
    name: 'Kenji Tanaka',
    avatarUrl: 'https://picsum.photos/100/100?random=author1',
    contactDetails: {
      email: 'kenji.tanaka@example.com',
      socialLinks: [{ platform: 'Twitter', url: 'https://twitter.com/kenji_manga' }]
    },
    walletBalance: 1500,
    bankDetails: { accountHolderName: 'Kenji Tanaka', bankName: 'Sumitomo Mitsui Banking Corporation', accountNumber: '123456789', routingNumber: '021000021' },
    isSystemUser: false,
    donationCount: 0,
    investmentOpportunitiesAvailable: 0,
    lastProfileUpdate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // More than 90 days ago
  },
  {
    id: 'author-2',
    name: 'Yuki Sato',
    avatarUrl: 'https://picsum.photos/100/100?random=author2',
    contactDetails: {
      email: 'yuki.sato.art@example.com',
      socialLinks: [{ platform: 'Instagram', url: 'https://instagram.com/yuki_draws' }]
    },
    walletBalance: 800,
    bankDetails: { accountHolderName: 'Yuki Sato', bankName: 'Mizuho Bank', accountNumber: '987654321', routingNumber: '021000089' },
    isSystemUser: false,
    donationCount: 0,
    investmentOpportunitiesAvailable: 0,
    lastProfileUpdate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Less than 90 days ago
  },
  {
    id: 'author-3',
    name: 'Aiko Suzuki',
    avatarUrl: 'https://picsum.photos/100/100?random=author3',
    walletBalance: 300,
    isSystemUser: false,
    donationCount: 0,
    investmentOpportunitiesAvailable: 0,
  },
  {
    id: 'user-123', // This is also MOCK_USER_VALID.id from AuthContext
    name: 'Test Creator',
    avatarUrl: 'https://picsum.photos/100/100?random=creator',
    isSystemUser: true, 
    contactDetails: {
      email: 'test@example.com',
      socialLinks: [{ platform: 'Website', url: 'https://testcreator.com'}]
    },
    walletBalance: 500, 
    bankDetails: { accountHolderName: 'Test Creator', bankName: 'Bank of America', accountNumber: '1122334455', routingNumber: '026009593' },
    donationCount: 0, 
    investmentOpportunitiesAvailable: 2, 
    lastProfileUpdate: new Date(Date.now() - (90 + 5) * 24 * 60 * 60 * 1000).toISOString(), // More than 90 days ago
  },
  {
    id: 'author-pending',
    name: 'Pending Approval Sensei',
    avatarUrl: 'https://picsum.photos/100/100?random=authorpending',
    contactDetails: { email: 'pending@example.com' },
    walletBalance: 0,
    isSystemUser: false,
    donationCount: 0,
    investmentOpportunitiesAvailable: 0,
  }
];

const investmentOffer1: MangaInvestmentOffer = {
  sharesOfferedTotalPercent: 20,
  totalSharesInOffer: Math.min(100, MAX_SHARES_PER_OFFER),
  pricePerShare: 50,
  minSubscriptionRequirement: 5,
  description: "Invest in 'The Wandering Blade' and share in its subscription, donation, and merchandise revenue. You'll also own a piece of the IP for future adaptations (anime, movies, etc.).",
  isActive: true,
  dividendPayoutCycle: 3, // Quarterly
  totalCapitalRaised: 750, // Example: 15 shares * $50
};

const investmentOffer2: MangaInvestmentOffer = {
  sharesOfferedTotalPercent: 15,
  totalSharesInOffer: Math.min(80, MAX_SHARES_PER_OFFER),
  pricePerShare: 25,
  description: "Become an investor in 'Cybernetic Heart'! Share in revenue and IP ownership. Perfect for cyberpunk and mystery fans.",
  isActive: true,
  minSubscriptionRequirement: 3,
  dividendPayoutCycle: 6, // Semi-annually
  totalCapitalRaised: 0,
};


export const mockMangaSeriesData: MangaSeries[] = [
  {
    id: 'manga-1',
    title: 'The Wandering Blade',
    author: mockAuthors[0],
    authorDetails: mockAuthors[0].contactDetails,
    summary: 'A lone swordsman travels a war-torn land, seeking redemption and a lost, powerful artifact. His journey is fraught with perilous encounters and moral dilemmas.',
    coverImage: 'https://picsum.photos/400/600?random=manga1',
    genres: [MANGA_GENRES_DETAILS.find(g=>g.id==='action')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='adventure')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='fantasy')!.id],
    chapters: [
      { id: 'manga-1-chapter-1', title: 'Crossroads', chapterNumber: 1, pages: generatePages('m1c1', 8) },
      { id: 'manga-1-chapter-2', title: 'Whispers in the Woods', chapterNumber: 2, pages: generatePages('m1c2', 10) },
      { id: 'manga-1-chapter-3', title: 'City of Shadows', chapterNumber: 3, pages: generatePages('m1c3', 12) },
    ],
    subscriptionModel: 'monthly',
    subscriptionPrice: 5,
    freePreviewPageCount: 2,
    freePreviewChapterCount: 0,
    totalRevenueFromSubscriptions: 1250,
    totalRevenueFromDonations: 350,
    totalRevenueFromMerchandise: 120,
    investmentOffer: investmentOffer1,
    investors: [
      { userId: 'investor-alpha', userName: 'Alpha Investor', sharesOwned: 10, totalAmountInvested: 500, joinedDate: new Date(Date.now() - 1000*60*60*24*30).toISOString()},
      { userId: 'investor-beta', userName: 'Beta Investor', sharesOwned: 5, totalAmountInvested: 250, joinedDate: new Date(Date.now() - 1000*60*60*24*15).toISOString()},
    ],
    publishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    lastUpdatedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    lastInvestmentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    lastSubscriptionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    averageRating: 2.8,
    ratingCount: 150,
    viewCount: 12000,
    isPublished: true,
    comments: [
      { id: 'comment-1-1', mangaId: 'manga-1', userId: 'user-generic', userName: 'Generic User', userAvatarUrl: 'https://picsum.photos/50/50?random=generic', text: 'Great first chapter!', timestamp: new Date(Date.now() - 1000*60*60*24*2).toISOString()},
      { id: 'comment-1-2', mangaId: 'manga-1', userId: 'user-another', userName: 'Another Reader', userAvatarUrl: 'https://picsum.photos/50/50?random=another', text: 'Looking forward to more!', timestamp: new Date(Date.now() - 1000*60*60*20).toISOString()},
    ],
  },
  {
    id: 'manga-2',
    title: 'Cybernetic Heart',
    author: mockAuthors[1],
    authorDetails: mockAuthors[1].contactDetails,
    summary: 'In a futuristic city, a detective with cybernetic enhancements uncovers a conspiracy reaching the highest echelons of society, all while struggling with his own humanity.',
    coverImage: 'https://picsum.photos/400/600?random=manga2',
    genres: [MANGA_GENRES_DETAILS.find(g=>g.id==='sci-fi')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='mystery')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='action')!.id],
    chapters: [
      { id: 'manga-2-chapter-1', title: 'Neon Illusions', chapterNumber: 1, pages: generatePages('m2c1', 10) },
      { id: 'manga-2-chapter-2', title: 'Data Ghosts', chapterNumber: 2, pages: generatePages('m2c2', 9) },
    ],
    subscriptionModel: 'per_chapter',
    chapterSubscriptionPrice: 1.99,
    freePreviewPageCount: 3,
    freePreviewChapterCount: 1, // First chapter is free
    totalRevenueFromSubscriptions: 2100, 
    totalRevenueFromDonations: 150,
    totalRevenueFromMerchandise: 0,
    investmentOffer: investmentOffer2,
    investors: [],
    publishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    lastUpdatedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    averageRating: 2.5,
    ratingCount: 95,
    viewCount: 8500,
    isPublished: true,
    comments: [],
  },
  {
    id: 'manga-3',
    title: 'Chronicles of Eldoria',
    author: mockAuthors[2],
    authorDetails: mockAuthors[2].contactDetails,
    summary: 'A young mage discovers her latent powers and must embark on a quest to save the magical kingdom of Eldoria from an ancient evil. Along the way, she meets brave companions and uncovers forgotten legends.',
    coverImage: 'https://picsum.photos/400/600?random=manga3',
    genres: [MANGA_GENRES_DETAILS.find(g=>g.id==='fantasy')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='adventure')!.id],
    chapters: [
      { id: 'manga-3-chapter-1', title: 'The Awakening', chapterNumber: 1, pages: generatePages('m3c1', 15) },
      { id: 'manga-3-chapter-2', title: 'Forbidden Forest', chapterNumber: 2, pages: generatePages('m3c2', 11) },
      { id: 'manga-3-chapter-3', title: 'Secrets of the Spire', chapterNumber: 3, pages: generatePages('m3c3', 14) },
      { id: 'manga-3-chapter-4', title: 'Council of Shadows', chapterNumber: 4, pages: generatePages('m3c4', 10) },
    ],
    subscriptionModel: 'none', 
    freePreviewPageCount: 1,
    freePreviewChapterCount: 0,
    totalRevenueFromSubscriptions: 0, 
    totalRevenueFromDonations: 50,
    totalRevenueFromMerchandise: 0,
    investors: [],
    publishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    lastUpdatedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    averageRating: 2.2,
    ratingCount: 200,
    viewCount: 15000,
    isPublished: true,
    comments: [],
  },
  {
    id: 'manga-4',
    title: 'My Author Adventure',
    author: mockAuthors.find(a => a.id === 'user-123')!,
    authorDetails: mockAuthors.find(a => a.id === 'user-123')?.contactDetails,
    summary: 'A special manga series created by our platform\'s test creator! Follow their journey in creation.',
    coverImage: 'https://picsum.photos/400/600?random=manga4',
    genres: [MANGA_GENRES_DETAILS.find(g=>g.id==='comedy')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='healing')!.id],
    chapters: [
      { id: 'manga-4-chapter-1', title: 'The First Spark', chapterNumber: 1, pages: generatePages('m4c1', 5) },
    ],
    subscriptionModel: 'monthly',
    subscriptionPrice: 2,
    freePreviewPageCount: 2,
    freePreviewChapterCount: 1,
    totalRevenueFromSubscriptions: 50,
    totalRevenueFromDonations: 10,
    totalRevenueFromMerchandise: 0,
    investors: [],
    publishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    lastUpdatedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    averageRating: undefined,
    ratingCount: 0,
    viewCount: 100,
    isPublished: true,
    comments: [],
  },
];

export let modifiableMockMangaSeries = [...mockMangaSeriesData];

export let mockShareListingsData: ShareListing[] = [
  {
    id: 'listing-1',
    mangaId: 'manga-1',
    mangaTitle: 'The Wandering Blade',
    coverImage: 'https://picsum.photos/400/600?random=manga1',
    authorName: 'Kenji Tanaka',
    sellerUserId: 'investor-alpha',
    sellerName: 'Alpha Investor',
    sharesOffered: 3,
    pricePerShare: 60, 
    description: "Selling a small portion of my 'The Wandering Blade' shares. Great series with huge potential!",
    listedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    isActive: true,
    followersCount: 5,
  },
];


export const getPublishedMangaSeries = (): MangaSeries[] => {
  return modifiableMockMangaSeries.filter(manga => manga.isPublished);
};

export const getMangaById = (id: string): MangaSeries | undefined => {
  return modifiableMockMangaSeries.find(manga => manga.id === id);
};

export const getAuthorById = (id: string): (AuthorInfo & { contactDetails?: AuthorContactDetails, walletBalance: number, bankDetails?: BankAccountDetails, isSystemUser?: boolean, donationCount?:number, investmentOpportunitiesAvailable?:number, lastProfileUpdate?: string }) | undefined => {
  return mockAuthors.find(author => author.id === id);
}

export const getApprovedCreators = (): AuthorInfo[] => {
  return mockAuthors.filter(author => {
    const isActualCreator = author.id.startsWith('author-') || (author.id === 'user-123'); 
    return isActualCreator && !author.isSystemUser && author.id !== 'author-pending'; 
  });
};


export const getMangaByAuthorId = (authorId: string): MangaSeries[] => {
  return modifiableMockMangaSeries.filter(manga => manga.author.id === authorId && manga.isPublished);
};


export const updateMockAuthorBalance = (authorId: string, newBalance: number) => {
  const authorIndex = mockAuthors.findIndex(author => author.id === authorId);
  if (authorIndex !== -1) {
    mockAuthors[authorIndex].walletBalance = parseFloat(newBalance.toFixed(2));
  }
};


export const getChapterById = (mangaId: string, chapterId: string) => {
  const manga = getMangaById(mangaId);
  return manga?.chapters.find(chapter => chapter.id === chapterId);
};

export const updateMockMangaData = (mangaId: string, updates: Partial<MangaSeries>) => {
  const mangaIndex = modifiableMockMangaSeries.findIndex(m => m.id === mangaId);
  if (mangaIndex !== -1) {
    const existingManga = modifiableMockMangaSeries[mangaIndex];
    let updatedChapters: Chapter[] | undefined = updates.chapters;
    let lastChapterUpdateInfo: MangaSeries['lastChapterUpdateInfo'] = existingManga.lastChapterUpdateInfo;

    if (updates.chapters) {
      let lastUpdatedEffectiveChapter: Chapter | undefined = undefined;

      if (existingManga.chapters.length > 0 && updates.chapters.length > 0) {
        const lastExistingChapter = existingManga.chapters[existingManga.chapters.length -1];
        const lastUpdatedChapter = updates.chapters.find(uc => uc.id === lastExistingChapter.id) || updates.chapters[updates.chapters.length -1];
        
        if (lastUpdatedChapter) {
          const oldPagesCount = lastExistingChapter?.pages.length || 0;
          const newPagesCount = lastUpdatedChapter.pages.length;
          const isNewChapter = !existingManga.chapters.some(ch => ch.id === lastUpdatedChapter.id);
          if (isNewChapter || newPagesCount !== oldPagesCount) {
             lastUpdatedEffectiveChapter = lastUpdatedChapter;
             lastChapterUpdateInfo = {
                chapterId: lastUpdatedEffectiveChapter.id,
                chapterNumber: lastUpdatedEffectiveChapter.chapterNumber,
                chapterTitle: lastUpdatedEffectiveChapter.title,
                pagesAdded: newPagesCount - (isNewChapter ? 0 : oldPagesCount), 
                newTotalPagesInChapter: newPagesCount,
                date: new Date().toISOString(),
             };
          }
        }
      } else if (updates.chapters.length > 0) { 
        lastUpdatedEffectiveChapter = updates.chapters[updates.chapters.length -1];
        lastChapterUpdateInfo = {
            chapterId: lastUpdatedEffectiveChapter.id,
            chapterNumber: lastUpdatedEffectiveChapter.chapterNumber,
            chapterTitle: lastUpdatedEffectiveChapter.title,
            pagesAdded: lastUpdatedEffectiveChapter.pages.length,
            newTotalPagesInChapter: lastUpdatedEffectiveChapter.pages.length,
            date: new Date().toISOString(),
        };
      }


      updatedChapters = updates.chapters.map((updatedCh, chapterIdx) => {
        const existingChapter = existingManga.chapters.find(c => c.id === updatedCh.id);
        const newPages: MangaPage[] = updatedCh.pages.map((updatedPage, pageIdx) => {
          return {
            id: updatedPage.id || `${updatedCh.id}-page-${Date.now()}-${pageIdx}`, 
            imageUrl: updatedPage.imageUrl,
            altText: updatedPage.altText || `Page ${pageIdx + 1}`,
          };
        });
        return {
          ...updatedCh,
          id: existingChapter?.id || updatedCh.id || `${mangaId}-chapter-${Date.now()}-${chapterIdx}`,
          chapterNumber: updatedCh.chapterNumber || chapterIdx + 1,
          pages: newPages,
        };
      });
    }

    let mergedInvestmentOffer = existingManga.investmentOffer;
    if (updates.investmentOffer) {
        mergedInvestmentOffer = {
            ...(existingManga.investmentOffer || {} as MangaInvestmentOffer),
            ...updates.investmentOffer,
        };
    }


    modifiableMockMangaSeries[mangaIndex] = {
      ...existingManga,
      ...updates,
      chapters: updatedChapters || existingManga.chapters,
      investmentOffer: mergedInvestmentOffer,
      lastUpdatedDate: new Date().toISOString(),
      lastChapterUpdateInfo: updates.chapters ? lastChapterUpdateInfo : existingManga.lastChapterUpdateInfo, 
    };
  }
};

export const addMockMangaSeries = (newManga: MangaSeries) => {
  const authorExists = mockAuthors.some(a => a.id === newManga.author.id);
  if (!authorExists && !mockAuthors.find(a => a.isSystemUser && a.id === newManga.author.id)) {
    const newAuthorData: AuthorInfo = {
        id: newManga.author.id,
        name: newManga.author.name,
        avatarUrl: newManga.author.avatarUrl,
        contactDetails: newManga.authorDetails,
        walletBalance: 0, // Initialize wallet for new author
        isSystemUser: false, 
        // donationCount: 0, // These are User specific, not AuthorInfo specific
        // investmentOpportunitiesAvailable: 0,
    };
    mockAuthors.push(newAuthorData);
  }
  
  const mangaWithDefaults: MangaSeries = {
    ...newManga,
    isPublished: newManga.isPublished !== undefined ? newManga.isPublished : true,
    subscriptionModel: newManga.subscriptionModel || 'monthly', 
    comments: newManga.comments || [], 
  };
  modifiableMockMangaSeries.unshift(mangaWithDefaults);
};

export const deleteMockMangaData = (mangaId: string) => {
  modifiableMockMangaSeries = modifiableMockMangaSeries.filter(manga => manga.id !== mangaId);
  mockShareListingsData = mockShareListingsData.filter(listing => listing.mangaId !== mangaId);
};


export const getActiveShareListings = (): ShareListing[] => {
  return mockShareListingsData.filter(listing => listing.isActive && listing.sharesOffered > 0);
};

export const getShareListingById = (listingId: string): ShareListing | undefined => {
  return mockShareListingsData.find(listing => listing.id === listingId);
};

export const addShareListing = (listingData: Omit<ShareListing, 'id' | 'listedDate' | 'isActive' | 'followersCount'>): ShareListing => {
  const mangaDetails = getMangaById(listingData.mangaId);
  const newListing: ShareListing = {
    ...listingData,
    id: `listing-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    listedDate: new Date().toISOString(),
    isActive: true,
    coverImage: mangaDetails?.coverImage || `https://picsum.photos/400/600?random=${listingData.mangaId}`,
    mangaTitle: mangaDetails?.title || 'Unknown Manga',
    authorName: mangaDetails?.author.name || 'Unknown Author',
    followersCount: 0,
  };
  mockShareListingsData.unshift(newListing);
  return newListing;
};

export const updateShareListingOnPurchase = (listingId: string, sharesBought: number): ShareListing | undefined => {
  const listingIndex = mockShareListingsData.findIndex(l => l.id === listingId);
  if (listingIndex !== -1) {
    mockShareListingsData[listingIndex].sharesOffered -= sharesBought;
    if (mockShareListingsData[listingIndex].sharesOffered <= 0) {
      mockShareListingsData[listingIndex].isActive = false; 
    }
    return mockShareListingsData[listingIndex];
  }
  return undefined;
};

export const removeShareListing = (listingId: string): boolean => {
  const initialLength = mockShareListingsData.length;
  mockShareListingsData = mockShareListingsData.filter(listing => listing.id !== listingId);
  return mockShareListingsData.length < initialLength;
};

export const updateListingFollowerCount = (listingId: string, increment: boolean) => {
  const listingIndex = mockShareListingsData.findIndex(l => l.id === listingId);
  if (listingIndex !== -1) {
    const currentFollowers = mockShareListingsData[listingIndex].followersCount || 0;
    mockShareListingsData[listingIndex].followersCount = Math.max(0, currentFollowers + (increment ? 1 : -1));
  }
};

export const addCommentToMockManga = (mangaId: string, newComment: Comment): Comment | null => {
  const mangaIndex = modifiableMockMangaSeries.findIndex(m => m.id === mangaId);
  if (mangaIndex !== -1) {
    const manga = modifiableMockMangaSeries[mangaIndex];
    if (!manga.comments) {
      manga.comments = [];
    }
    manga.comments.push(newComment);
    modifiableMockMangaSeries[mangaIndex] = manga;
    return newComment;
  }
  return null;
};
