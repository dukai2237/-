// src/lib/constants.ts
export const MAX_WORKS_PER_CREATOR = 20;
export const MAX_CHAPTERS_PER_WORK = 30;
export const MAX_PAGES_PER_CHAPTER = 60;
export const MAX_SHARES_PER_OFFER = 100; // Maximum shares an author can offer for a single manga's crowdfunding

export interface MangaGenreDetail {
  id: string;
  name: string;
}

export const MANGA_GENRES_DETAILS: MangaGenreDetail[] = [
  { id: 'comedy', name: 'Comedy (搞笑)' },
  { id: 'action', name: 'Action (热血)' },
  { id: 'tearjerker', name: 'Tear-jerker (催泪)' },
  { id: 'healing', name: 'Healing (治愈)' },
  { id: 'bizarre', name: 'Bizarre (猎奇)' },
  { id: 'inspirational', name: 'Inspirational (励志)' },
  { id: 'sci-fi', name: 'Sci-Fi (科幻)' },
  { id: 'harem', name: 'Harem (后宫)' },
  { id: 'romance', name: 'Romance (恋爱)' },
  { id: 'fantasy', name: 'Fantasy (奇幻)' },
  { id: 'mystery', name: 'Mystery (推理)' },
  { id: 'urban', name: 'Urban (都市)' },
  { id: 'sports', name: 'Sports (竞技)' },
  { id: 'adventure', name: 'Adventure (冒险)' },
  { id: 'historical', name: 'Historical (历史)' },
  { id: 'mafan', name: 'Drama (麻烦)' }, // Changed to Drama for better English understanding
];
