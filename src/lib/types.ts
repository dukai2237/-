export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  walletBalance: number;
  subscriptions: UserSubscription[];
  investments: UserInvestment[];
  authoredMangaIds: string[]; // IDs of manga series authored by this user
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
  // Conceptual fields for displaying mock returns
  mockCumulativeReturn?: number; 
}

export interface AuthorInfo {
  id:string;
  name: string;
  avatarUrl: string;
  contactEmail?: string;
  socialLinks?: { platform: string; url: string }[];
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
  sharesOfferedTotalPercent: number; // e.g., Author offers 20% of manga's future revenue to investors
  totalSharesInOffer: number; // e.g., That 20% is divided into 100 shares
  pricePerShare: number; // Cost to buy one share
  maxSharesPerUser?: number;
  minSubscriptionRequirement?: number; // e.g., User must be subscribed to 10 mangas
  description: string; // Author's pitch for the investment
  isActive: boolean; // Whether the offer is currently open
}

export interface MangaInvestor {
  userId: string;
  userName: string; // For display
  sharesOwned: number;
  totalAmountInvested: number;
  joinedDate: string; // ISO date string
}

export interface MangaSeries {
  id: string;
  title: string;
  author: AuthorInfo;
  summary: string;
  coverImage: string;
  genres: string[];
  chapters: Chapter[];
  freePreviewPageCount: number;
  subscriptionPrice?: number; // Monthly, set by author

  // Financials for the manga (mocked/accumulated conceptually)
  totalRevenueFromSubscriptions: number;
  totalRevenueFromDonations: number;
  totalRevenueFromMerchandise: number; // Conceptual for now
  
  investmentOffer?: MangaInvestmentOffer;
  investors: MangaInvestor[]; // List of users who have invested

  // New fields for author dashboard and discovery
  publishedDate: string; // ISO date string
  averageRating?: number; // Average score from 1 to 3
  ratingCount?: number;
  viewCount: number; // Mock total views

  // Platform fee rate (e.g., 0.10 for 10%) - this is a global setting but could be here if ever variable
  // For simplicity, we'll assume a global 10% platform fee applied during transactions.
}

// Simplified Transaction type for client-side simulation and logging
export interface SimulatedTransaction {
  id: string;
  type: 'subscription_payment' | 'donation_payment' | 'investment_payment' | 'merchandise_purchase' | 'author_earning' | 'investor_payout' | 'platform_fee' | 'rating_update';
  amount: number;
  userId?: string; 
  authorId?: string;
  mangaId?: string;
  description: string;
  timestamp: string; // ISO date string
  relatedData?: any; // For storing rating score, etc.
}

export interface MangaRating {
  userId: string;
  score: 1 | 2 | 3; // 1: Bad, 2: Neutral, 3: Good
}