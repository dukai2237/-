export interface User {
  id: string;
  email: string;
  name: string;
  password_hash_mock?: string; // For mock password storage/check
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
  followedShareListings?: string[]; // IDs of share listings the user is following
  bankDetails?: BankAccountDetails;
  donationCount?: number; // Number of donations made
  investmentOpportunitiesAvailable?: number; // Number of investment chances unlocked
}

export interface BankAccountDetails {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
}

export interface UserSubscription {
  mangaId: string;
  mangaTitle: string; 
  type: 'monthly' | 'chapter'; // Indicates if it's a monthly subscription or a single chapter purchase
  chapterId?: string; // Only present if type is 'chapter'
  pricePaid: number; // The amount paid for this specific subscription/purchase
  subscribedSince: string; // ISO date string of initial subscription or chapter purchase
  expiresAt?: string; // ISO date string, only for 'monthly' type
}

export interface UserInvestment {
  mangaId: string;
  mangaTitle: string; 
  sharesOwned: number;
  amountInvested: number; 
  investmentDate: string; 
  lastDividendReceivedDate?: string; 
  totalDividendsReceived?: number;
  
  // Fields for when user lists their shares for sale on the secondary market
  isListedForSale?: boolean;
  listingId?: string; // ID of the ShareListing on the market
  sharesListed?: number;
  listedPricePerShare?: number;
  listingDescription?: string;
}

export interface AuthorContactDetails { 
  email?: string;
  socialLinks?: { platform: string; url: string }[];
}

export interface AuthorInfo { 
  id:string;
  name: string;
  avatarUrl: string;
  contactDetails?: AuthorContactDetails; 
  walletBalance: number;
  bankDetails?: BankAccountDetails;
  isSystemUser?: boolean; // To differentiate system users from actual creators
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
  minSubscriptionRequirement?: number; // This was the old creator-specific subscription requirement, might deprecate or adjust if MIN_SUBSCRIPTIONS_FOR_INVESTMENT from constants.ts is the main global one.
  description: string;
  isActive: boolean;
  dividendPayoutCycle?: 1 | 3 | 6 | 12; 
  lastDividendPayoutDate?: string; 
  totalCapitalRaised?: number; 
}

export interface MangaInvestor { 
  userId: string;
  userName: string;
  sharesOwned: number; 
  totalAmountInvested: number; 
  joinedDate: string; 
  lastDividendReceivedDate?: string; 
  totalDividendsReceived?: number;
}

export interface Comment {
  id: string;
  mangaId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  text: string;
  timestamp: string;
  replies?: Comment[]; // Optional: for nested comments
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
  
  subscriptionModel: 'monthly' | 'per_chapter' | 'none'; 
  subscriptionPrice?: number; 
  chapterSubscriptionPrice?: number; 

  freePreviewPageCount: number;
  freePreviewChapterCount?: number;

  totalRevenueFromSubscriptions: number;
  totalRevenueFromDonations: number;
  totalRevenueFromMerchandise: number; 

  investmentOffer?: MangaInvestmentOffer;
  investors: MangaInvestor[]; 

  publishedDate: string;
  lastUpdatedDate?: string;
  lastInvestmentDate?: string;
  lastSubscriptionDate?: string;
  averageRating?: number;
  ratingCount?: number;
  viewCount: number;
  isPublished: boolean; 
  lastChapterUpdateInfo?: { 
    chapterId: string;
    chapterNumber: number;
    chapterTitle: string;
    pagesAdded: number; 
    newTotalPagesInChapter: number; 
    date: string; 
  };
  comments?: Comment[];
}

export interface SimulatedTransaction {
  id: string;
  type:
    | 'subscription_payment'
    | 'chapter_purchase' 
    | 'donation_payment'
    | 'investment_payment' 
    | 'merchandise_purchase'
    | 'author_earning' 
    | 'investor_payout' 
    | 'platform_earning' 
    | 'rating_update'
    | 'account_creation'
    | 'manga_creation'
    | 'manga_deletion'
    | 'wallet_deposit'
    | 'wallet_withdrawal' 
    | 'creator_approval_pending'
    | 'creator_approved'
    | 'shares_purchase_secondary' 
    | 'shares_sale_secondary'
    | 'list_shares_for_sale' 
    | 'delist_shares_from_sale'
    | 'user_payment' // Generic payment made by a user
    | 'comment_added'; // For comment transaction
  amount: number; 
  userId?: string; 
  authorId?: string; 
  mangaId?: string;
  description: string;
  timestamp: string; 
  relatedData?: any; 
}

export interface MangaRating {
  userId: string;
  mangaId: string;
  score: 1 | 2 | 3;
  timestamp: string;
}

// For the secondary market of shares
export interface ShareListing {
  id: string;
  mangaId: string;
  mangaTitle: string;
  coverImage: string; 
  authorName: string; 
  sellerUserId: string;
  sellerName: string; 
  sharesOffered: number;
  pricePerShare: number;
  description: string; 
  listedDate: string; 
  isActive: boolean; 
  followersCount?: number; 
}

// Represents a user's intent to buy shares from a listing
export interface UserShareTradeRequest {
    listingId: string;
    buyerUserId: string;
    sharesToBuy: number;
}
