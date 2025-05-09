export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  walletBalance: number;
  subscriptions: UserSubscription[];
  investments: UserInvestment[];
  authoredMangaIds: string[]; // IDs of manga series authored by this user
  accountType: 'creator' | 'user';
  isApproved?: boolean; // For creator accounts, true if approved by admin/founder
  ratingsGiven?: Record<string, 1 | 2 | 3>; // mangaId -> score. Stores the rating a user has given to a manga.
  favorites?: string[]; // mangaIds
  searchHistory?: string[];
}

export interface UserSubscription {
  mangaId: string;
  mangaTitle: string; // For display purposes
  subscribedSince: string; // ISO date string
  monthlyPrice: number;
}

export interface UserInvestment {
  mangaId: string;
  mangaTitle: string; // For display purposes
  sharesOwned: number;
  amountInvested: number; // Total amount user paid for these shares
  investmentDate: string; // ISO date string
  lastDividendReceivedDate?: string; // ISO date string
  totalDividendsReceived?: number;
  isForSale?: boolean; // For secondary market
  sellingPricePerShare?: number; // For secondary market
}

export interface AuthorContactDetails { // New interface for author details embedded in MangaSeries
  email?: string;
  socialLinks?: { platform: string; url: string }[];
}

export interface AuthorInfo { // Existing interface, represents the basic author stub
  id:string;
  name: string;
  avatarUrl: string;
  contactDetails?: AuthorContactDetails; // Added for potential direct use, though primarily via MangaSeries.authorDetails
}

export interface MangaPage {
  id: string;
  imageUrl: string;
  altText: string;
}

export interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
  pages: MangaPage[];
}

export interface MangaInvestmentOffer {
  sharesOfferedTotalPercent: number; // Percentage of manga's earnings allocated to investors
  totalSharesInOffer: number; // Max 100, total shares author makes available for this crowdfunding
  pricePerShare: number; // Price per share set by author
  maxSharesPerUser?: number;
  minSubscriptionRequirement?: number;
  description: string;
  isActive: boolean;
  dividendPayoutCycle?: 1 | 3 | 6 | 12; // Payout cycle in months
  lastDividendPayoutDate?: string; // ISO date string for the entire offer
  totalCapitalRaised?: number; // Sum of (sharesBought * pricePerShare) from initial offerings
}

export interface MangaInvestor { // Tracks who invested in the initial offering by the author
  userId: string;
  userName: string;
  sharesOwned: number; // Shares bought directly from author's offering
  totalAmountInvested: number; // Amount paid to author for these shares
  joinedDate: string; // ISO date string
  lastDividendReceivedDate?: string; // ISO date string
  totalDividendsReceived?: number;
  isForSale?: boolean; // For secondary market
  sellingPricePerShare?: number; // For secondary market
}

export interface MangaSeries {
  id: string;
  title: string;
  author: AuthorInfo;
  authorDetails?: AuthorContactDetails;
  summary: string;
  coverImage: string;
  genres: string[];
  chapters: Chapter[];
  freePreviewPageCount: number;
  freePreviewChapterCount?: number;
  subscriptionPrice?: number;

  totalRevenueFromSubscriptions: number;
  totalRevenueFromDonations: number;
  totalRevenueFromMerchandise: number; // Profit from merchandise sales

  investmentOffer?: MangaInvestmentOffer;
  investors: MangaInvestor[]; // Users who invested directly in the author's offering

  publishedDate: string;
  lastUpdatedDate?: string;
  lastInvestmentDate?: string;
  lastSubscriptionDate?: string;
  averageRating?: number;
  ratingCount?: number;
  viewCount: number;
  isPublished: boolean; // New field to control visibility
  lastChapterUpdateInfo?: { // New field for update notifications
    chapterId: string;
    chapterNumber: number;
    chapterTitle: string;
    pagesAdded: number; // Number of pages added in the last update to this chapter
    newTotalPagesInChapter: number; // Total pages in this chapter after update
    date: string; // ISO date string of the update
  };
}

export interface SimulatedTransaction {
  id: string;
  type:
    | 'subscription_payment'
    | 'donation_payment'
    | 'investment_payment' // User pays author for shares
    | 'merchandise_purchase'
    | 'author_earning' // Generic author earning, or specific if from sub/donation/merch
    | 'investor_payout' // Dividend payout from author to investor
    | 'platform_fee' // Old, to be deprecated
    | 'platform_earning' // Platform's cut from any user payment to author/platform
    | 'rating_update'
    | 'account_creation'
    | 'manga_creation'
    | 'manga_deletion'
    | 'wallet_deposit'
    | 'wallet_withdrawal' // Author withdrawing funds
    | 'creator_approval_pending'
    | 'creator_approved'
    | 'shares_purchase_secondary' // User buys shares from another user
    | 'shares_sale_secondary'; // User sells shares to another user
  amount: number;
  userId?: string; // User initiating or receiving funds
  authorId?: string; // Author involved
  mangaId?: string;
  description: string;
  timestamp: string; // ISO date string
  relatedData?: any; // e.g., { shares: 5, pricePerShare: 10 } for investment
}

export interface MangaRating {
  userId: string;
  mangaId: string;
  score: 1 | 2 | 3;
  timestamp: string;
}

// For the secondary market of shares (Conceptual)
export interface ShareListing {
    id: string;
    mangaId: string;
    sellerUserId: string;
    sharesOffered: number;
    pricePerShare: number;
    listedDate: string;
    isActive: boolean;
}
