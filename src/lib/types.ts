export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export interface AuthorInfo {
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

export interface MangaSeries {
  id: string;
  title: string;
  author: AuthorInfo; // Changed from string to AuthorInfo
  summary: string;
  coverImage: string;
  genres: string[];
  chapters: Chapter[];
  freePreviewPageCount: number; // e.g., first 3 pages are free
  subscriptionPrice?: number; // e.g., 5 (USD) per month
  // Placeholder for investment details
  investmentDetails?: {
    sharesOfferedPercent?: number; // e.g., 20 for 20%
    platformCutPercent?: number; // Platform's cut from author's earnings
    description?: string; // Description of investment benefits
  };
}
