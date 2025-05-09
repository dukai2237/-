// src/lib/constants.ts
export const MAX_WORKS_PER_CREATOR = 20;
export const MAX_CHAPTERS_PER_WORK = 30;
export const MAX_PAGES_PER_CHAPTER = 60;

export interface MangaGenreDetail {
  id: string;
  name: string;
}

export const MANGA_GENRES_DETAILS: MangaGenreDetail[] = [
  { id: 'comedy', name: '搞笑 (Comedy)' },
  { id: 'action', name: '热血 (Action)' },
  { id: 'tearjerker', name: '催泪 (Tear-jerker)' },
  { id: 'healing', name: '治愈 (Healing)' },
  { id: 'bizarre', name: '猎奇 (Bizarre)' },
  { id: 'inspirational', name: '励志 (Inspirational)' },
  { id: 'sci-fi', name: '科幻 (Sci-Fi)' },
  { id: 'harem', name: '后宫 (Harem)' },
  { id: 'romance', name: '恋爱 (Romance)' },
  { id: 'fantasy', name: '奇幻 (Fantasy)' },
  { id: 'mystery', name: '推理 (Mystery)' },
  { id: 'urban', name: '都市 (Urban)' },
  { id: 'sports', name: '竞技 (Sports)' },
  { id: 'adventure', name: '冒险 (Adventure)' },
  { id: 'historical', name: '历史 (Historical)' },
  { id: 'mafan', name: '麻烦 (Trouble/Drama)' },
];
