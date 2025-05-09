import type { MangaSeries } from './types';

const generatePages = (chapterId: string, count: number): MangaPage[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${chapterId}-page-${i + 1}`,
    imageUrl: `https://picsum.photos/800/1200?random=${chapterId}${i + 1}`,
    altText: `Page ${i + 1}`,
  }));
};

export const mockMangaSeries: MangaSeries[] = [
  {
    id: 'manga-1',
    title: 'The Wandering Blade',
    author: 'Kenji Tanaka',
    summary: 'A lone swordsman travels a war-torn land, seeking redemption and a lost artifact of immense power. His journey is filled with perilous encounters and moral dilemmas.',
    coverImage: 'https://picsum.photos/400/600?random=cover1',
    genres: ['Action', 'Adventure', 'Fantasy', 'Samurai'],
    chapters: [
      { id: 'manga-1-chapter-1', title: 'The Crossroads', chapterNumber: 1, pages: generatePages('m1c1', 8) },
      { id: 'manga-1-chapter-2', title: 'Whispers in the Woods', chapterNumber: 2, pages: generatePages('m1c2', 10) },
      { id: 'manga-1-chapter-3', title: 'City of Shadows', chapterNumber: 3, pages: generatePages('m1c3', 12) },
    ],
  },
  {
    id: 'manga-2',
    title: 'Cybernetic Heart',
    author: 'Yuki Sato',
    summary: 'In a futuristic city, a detective with cybernetic enhancements uncovers a conspiracy that reaches the highest levels of society while grappling with her own humanity.',
    coverImage: 'https://picsum.photos/400/600?random=cover2',
    genres: ['Sci-Fi', 'Mystery', 'Cyberpunk', 'Action'],
    chapters: [
      { id: 'manga-2-chapter-1', title: 'Neon Dreams', chapterNumber: 1, pages: generatePages('m2c1', 10) },
      { id: 'manga-2-chapter-2', title: 'Data Ghost', chapterNumber: 2, pages: generatePages('m2c2', 9) },
    ],
  },
  {
    id: 'manga-3',
    title: 'Chronicles of Eldoria',
    author: 'Aiko Suzuki',
    summary: 'A young mage discovers her latent powers and must embark on a quest to save the magical kingdom of Eldoria from an ancient evil. Along the way, she meets brave companions and uncovers forgotten lore.',
    coverImage: 'https://picsum.photos/400/600?random=cover3',
    genres: ['Fantasy', 'Magic', 'Adventure', 'Coming-of-Age'],
    chapters: [
      { id: 'manga-3-chapter-1', title: 'The Awakening', chapterNumber: 1, pages: generatePages('m3c1', 15) },
      { id: 'manga-3-chapter-2', title: 'The Forbidden Forest', chapterNumber: 2, pages: generatePages('m3c2', 11) },
      { id: 'manga-3-chapter-3', title: 'Secrets of the Spire', chapterNumber: 3, pages: generatePages('m3c3', 14) },
      { id: 'manga-3-chapter-4', title: 'The Shadow Council', chapterNumber: 4, pages: generatePages('m3c4', 10) },
    ],
  },
  {
    id: 'manga-4',
    title: 'Slice of Life Cafe',
    author: 'Haru Yamamoto',
    summary: 'Warm and heartwarming stories centered around a small, cozy cafe and its regular customers. Each chapter explores the everyday lives, dreams, and relationships of different characters.',
    coverImage: 'https://picsum.photos/400/600?random=cover4',
    genres: ['Slice of Life', 'Comedy', 'Romance', 'Contemporary'],
    chapters: [
      { id: 'manga-4-chapter-1', title: 'The Usual Order', chapterNumber: 1, pages: generatePages('m4c1', 7) },
      { id: 'manga-4-chapter-2', title: 'Rainy Day Musings', chapterNumber: 2, pages: generatePages('m4c2', 8) },
    ],
  },
];

export const getMangaById = (id: string): MangaSeries | undefined => {
  return mockMangaSeries.find(manga => manga.id === id);
};

export const getChapterById = (mangaId: string, chapterId: string) => {
  const manga = getMangaById(mangaId);
  return manga?.chapters.find(chapter => chapter.id === chapterId);
};
