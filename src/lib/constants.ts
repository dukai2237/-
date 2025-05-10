// src/lib/constants.ts
export const MAX_WORKS_PER_CREATOR = 20;
export const MAX_CHAPTERS_PER_WORK = 30;
export const MAX_PAGES_PER_CHAPTER = 60;
export const MAX_SHARES_PER_OFFER = 100; // Maximum shares an author can offer for a single manga's crowdfunding
// export const MIN_SUBSCRIPTIONS_FOR_INVESTMENT = 10; // Platform-wide minimum subscriptions/purchases to invest or buy from market - This was moved to AuthContext
export const USER_PROFILE_UPDATE_COOLDOWN_DAYS = 30;
export const CREATOR_PROFILE_UPDATE_COOLDOWN_DAYS = 90;


export interface MangaGenreDetail {
  id: string;
  name: string;
}

export const MANGA_GENRES_DETAILS: MangaGenreDetail[] = [
  { id: 'comedy', name: 'Comedy' },
  { id: 'action', name: 'Action' },
  { id: 'tearjerker', name: 'Tear-jerker' },
  { id: 'healing', name: 'Healing' },
  { id: 'bizarre', name: 'Bizarre' },
  { id: 'inspirational', name: 'Inspirational' },
  { id: 'sci-fi', name: 'Sci-Fi' },
  { id: 'harem', name: 'Harem' },
  { id: 'romance', name: 'Romance' },
  { id: 'fantasy', name: 'Fantasy' },
  { id: 'mystery', name: 'Mystery' },
  { id: 'urban', name: 'Urban' },
  { id: 'sports', name: 'Sports' },
  { id: 'adventure', name: 'Adventure' },
  { id: 'historical', name: 'Historical' },
  { id: 'mafan', name: 'Drama' }, 
];

