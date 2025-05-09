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
  amountInvested: number;
  investmentDate: string; // ISO date string
  mockCumulativeReturn?: number;
}

export interface AuthorContactDetails { // New interface for author details embedded in MangaSeries
  email?: string;
  socialLinks?: { platform: string; url: string }[];
}

export interface AuthorInfo { // Existing interface, represents the basic author stub
  id:string;
  name: string;
  avatarUrl: string;
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
  sharesOfferedTotalPercent: number;
  totalSharesInOffer: number;
  pricePerShare: number;
  maxSharesPerUser?: number;
  minSubscriptionRequirement?: number;
  description: string;
  isActive: boolean;
  dividendPayoutCycle?: 1 | 3 | 6 | 12; // Payout cycle in months
  lastDividendPayoutDate?: string; // ISO date string
}

export interface MangaInvestor {
  userId: string;
  userName: string;
  sharesOwned: number;
  totalAmountInvested: number;
  joinedDate: string; // ISO date string
}

export interface MangaSeries {
  id: string;
  title: string;
  author: AuthorInfo;
  authorDetails?: AuthorContactDetails; // Optional: more detailed contact info for display
  summary: string;
  coverImage: string;
  genres: string[];
  chapters: Chapter[];
  freePreviewPageCount: number;
  freePreviewChapterCount?: number; // Add this based on previous request, can be 0
  subscriptionPrice?: number;

  totalRevenueFromSubscriptions: number;
  totalRevenueFromDonations: number;
  totalRevenueFromMerchandise: number;

  investmentOffer?: MangaInvestmentOffer;
  investors: MangaInvestor[];

  publishedDate: string;
  lastUpdatedDate?: string; // For tracking content updates
  lastInvestmentDate?: string; // For deletion rule
  lastSubscriptionDate?: string; // For deletion rule (conceptual, as we don't store individual sub dates here)
  averageRating?: number;
  ratingCount?: number;
  viewCount: number;
}

export interface SimulatedTransaction {
  id: string;
  type:
    | 'subscription_payment'
    | 'donation_payment'
    | 'investment_payment'
    | 'merchandise_purchase' // For future e-commerce
    | 'author_earning'
    | 'investor_payout' // Conceptual for investor share distribution
    | 'platform_fee'
    | 'platform_earning' // Specific transaction for platform's cut
    | 'rating_update'
    | 'account_creation'
    | 'manga_creation'
    | 'manga_deletion'
    | 'wallet_deposit'
    | 'wallet_withdrawal'
    | 'creator_approval_pending' // When a creator signs up
    | 'creator_approved' // When an admin approves a creator
    | 'revenue_distribution_to_investors'; // Conceptual transaction for distributing earnings
  amount: number; // Positive for income to user/author, negative for expenses/payments from user
  userId?: string;
  authorId?: string;
  mangaId?: string;
  description: string;
  timestamp: string; // ISO date string
  relatedData?: any;
}

export interface MangaRating { // This interface might be used if ratings are stored in a separate collection.
  userId: string;
  mangaId: string;
  score: 1 | 2 | 3; // 1: Bad, 2: Neutral, 3: Good
  timestamp: string;
}
