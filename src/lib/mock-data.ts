import type { MangaSeries, MangaPage, AuthorInfo, MangaInvestmentOffer } from './types';
import { MANGA_GENRES_DETAILS } from './constants'; // Import genres

const generatePages = (chapterId: string, count: number): MangaPage[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${chapterId}-page-${i + 1}`,
    imageUrl: `https://picsum.photos/800/1200?random=${chapterId}${i + 1}`,
    altText: `Page ${i + 1}`,
  }));
};

const mockAuthors: AuthorInfo[] = [
  { 
    id: 'author-1', 
    name: 'Kenji Tanaka', 
    avatarUrl: 'https://picsum.photos/100/100?random=author1',
    contactEmail: 'kenji.tanaka@example.com',
    socialLinks: [{ platform: 'Twitter', url: 'https://twitter.com/kenji_manga' }]
  },
  { 
    id: 'author-2', 
    name: 'Yuki Sato', 
    avatarUrl: 'https://picsum.photos/100/100?random=author2',
    contactEmail: 'yuki.sato.art@example.com',
    socialLinks: [{ platform: 'Instagram', url: 'https://instagram.com/yuki_draws' }]
  },
  { 
    id: 'author-3', 
    name: 'Aiko Suzuki', 
    avatarUrl: 'https://picsum.photos/100/100?random=author3' 
  },
  { 
    id: 'user-123', 
    name: 'Test Creator', // Matched MOCK_USER_VALID name
    avatarUrl: 'https://picsum.photos/100/100?random=creator', // Matched MOCK_USER_VALID avatar
    contactEmail: 'test@example.com', // Matched MOCK_USER_VALID email
    socialLinks: [{ platform: 'Website', url: 'https://testcreator.com'}]
  },
];

const investmentOffer1: MangaInvestmentOffer = {
  sharesOfferedTotalPercent: 20,
  totalSharesInOffer: 100, 
  pricePerShare: 50, 
  minSubscriptionRequirement: 5, 
  description: "Invest in 'The Wandering Blade' and receive a share of its revenue from subscriptions, donations, and merchandise sales. You'll also own a part of the manga's IP for future adaptations (anime, movies, etc.).",
  isActive: true,
};

const investmentOffer2: MangaInvestmentOffer = {
  sharesOfferedTotalPercent: 15,
  totalSharesInOffer: 150,
  pricePerShare: 25,
  description: "Become an investor in 'Cybernetic Heart'! Get a share of revenue and IP ownership. Ideal for fans of cyberpunk and mystery.",
  isActive: true,
  minSubscriptionRequirement: 3,
};


export const mockMangaSeriesData: MangaSeries[] = [
  {
    id: 'manga-1',
    title: 'The Wandering Blade',
    author: mockAuthors[0],
    summary: 'A lone swordsman travels a war-torn land, seeking redemption and a lost artifact of immense power. His journey is filled with perilous encounters and moral dilemmas.',
    coverImage: 'https://picsum.photos/400/600?random=manga1',
    genres: [MANGA_GENRES_DETAILS.find(g=>g.id==='action')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='adventure')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='fantasy')!.id],
    chapters: [
      { id: 'manga-1-chapter-1', title: 'The Crossroads', chapterNumber: 1, pages: generatePages('m1c1', 8) },
      { id: 'manga-1-chapter-2', title: 'Whispers in the Woods', chapterNumber: 2, pages: generatePages('m1c2', 10) },
      { id: 'manga-1-chapter-3', title: 'City of Shadows', chapterNumber: 3, pages: generatePages('m1c3', 12) },
    ],
    freePreviewPageCount: 2,
    subscriptionPrice: 5,
    totalRevenueFromSubscriptions: 1250, 
    totalRevenueFromDonations: 350,
    totalRevenueFromMerchandise: 0,
    investmentOffer: investmentOffer1,
    investors: [
      { userId: 'investor-alpha', userName: 'Alpha Investor', sharesOwned: 10, totalAmountInvested: 500, joinedDate: new Date(Date.now() - 1000*60*60*24*30).toISOString()},
      { userId: 'investor-beta', userName: 'Beta Investor', sharesOwned: 5, totalAmountInvested: 250, joinedDate: new Date(Date.now() - 1000*60*60*24*15).toISOString()},
    ],
    publishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), 
    averageRating: 2.8,
    ratingCount: 150,
    viewCount: 12000,
  },
  {
    id: 'manga-2',
    title: 'Cybernetic Heart',
    author: mockAuthors[1],
    summary: 'In a futuristic city, a detective with cybernetic enhancements uncovers a conspiracy that reaches the highest levels of society while grappling with her own humanity.',
    coverImage: 'https://picsum.photos/400/600?random=manga2',
    genres: [MANGA_GENRES_DETAILS.find(g=>g.id==='sci-fi')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='mystery')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='action')!.id],
    chapters: [
      { id: 'manga-2-chapter-1', title: 'Neon Dreams', chapterNumber: 1, pages: generatePages('m2c1', 10) },
      { id: 'manga-2-chapter-2', title: 'Data Ghost', chapterNumber: 2, pages: generatePages('m2c2', 9) },
    ],
    freePreviewPageCount: 3,
    subscriptionPrice: 7,
    totalRevenueFromSubscriptions: 2100,
    totalRevenueFromDonations: 150,
    totalRevenueFromMerchandise: 0,
    investmentOffer: investmentOffer2,
    investors: [],
    publishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), 
    averageRating: 2.5,
    ratingCount: 95,
    viewCount: 8500,
  },
  {
    id: 'manga-3',
    title: 'Chronicles of Eldoria',
    author: mockAuthors[2],
    summary: 'A young mage discovers her latent powers and must embark on a quest to save the magical kingdom of Eldoria from an ancient evil. Along the way, she meets brave companions and uncovers forgotten lore.',
    coverImage: 'https://picsum.photos/400/600?random=manga3',
    genres: [MANGA_GENRES_DETAILS.find(g=>g.id==='fantasy')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='adventure')!.id],
    chapters: [
      { id: 'manga-3-chapter-1', title: 'The Awakening', chapterNumber: 1, pages: generatePages('m3c1', 15) },
      { id: 'manga-3-chapter-2', title: 'The Forbidden Forest', chapterNumber: 2, pages: generatePages('m3c2', 11) },
      { id: 'manga-3-chapter-3', title: 'Secrets of the Spire', chapterNumber: 3, pages: generatePages('m3c3', 14) },
      { id: 'manga-3-chapter-4', title: 'The Shadow Council', chapterNumber: 4, pages: generatePages('m3c4', 10) },
    ],
    freePreviewPageCount: 1,
    totalRevenueFromSubscriptions: 0,
    totalRevenueFromDonations: 50,
    totalRevenueFromMerchandise: 0,
    investors: [],
    publishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), 
    averageRating: 2.2,
    ratingCount: 200,
    viewCount: 15000,
  },
  {
    id: 'manga-4',
    title: 'My Author Adventure',
    author: mockAuthors[3], 
    summary: 'A special manga series created by our platform\'s Test Creator! Follow their creative journey.',
    coverImage: 'https://picsum.photos/400/600?random=manga4',
    genres: [MANGA_GENRES_DETAILS.find(g=>g.id==='comedy')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='healing')!.id],
    chapters: [
      { id: 'manga-4-chapter-1', title: 'The First Spark', chapterNumber: 1, pages: generatePages('m4c1', 5) },
    ],
    freePreviewPageCount: 2,
    subscriptionPrice: 2,
    totalRevenueFromSubscriptions: 50,
    totalRevenueFromDonations: 10,
    totalRevenueFromMerchandise: 0,
    investors: [],
    publishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), 
    averageRating: undefined, 
    ratingCount: 0,
    viewCount: 100,
  },
];

export let modifiableMockMangaSeries = [...mockMangaSeriesData];

export const getMangaById = (id: string): MangaSeries | undefined => {
  return modifiableMockMangaSeries.find(manga => manga.id === id);
};

export const getAuthorById = (id: string): AuthorInfo | undefined => {
  return mockAuthors.find(author => author.id === id);
}

export const getChapterById = (mangaId: string, chapterId: string) => {
  const manga = getMangaById(mangaId);
  return manga?.chapters.find(chapter => chapter.id === chapterId);
};

export const updateMockMangaData = (mangaId: string, updates: Partial<MangaSeries>) => {
  const mangaIndex = modifiableMockMangaSeries.findIndex(m => m.id === mangaId);
  if (mangaIndex !== -1) {
    // If chapters are being updated, ensure page arrays are correctly generated
    if (updates.chapters) {
      updates.chapters = updates.chapters.map((ch, index) => {
        // If pages are passed directly, use them. Otherwise, generate based on a pageCount if provided.
        // This assumes the update structure for chapters might change page counts or titles.
        // For simplicity, if `ch.pages` is not provided or is just a number (pageCount), regenerate.
        let pagesArray: MangaPage[];
        if (Array.isArray(ch.pages) && ch.pages.every(p => typeof p === 'object' && p.id && p.imageUrl)) {
          pagesArray = ch.pages; // Use existing pages array if valid
        } else {
          // Assume ch.pages might be a pageCount or needs regeneration
          // If pages is a number, it means pageCount. Otherwise, it's an array of MangaPage.
          const pageCount = Array.isArray(ch.pages) ? ch.pages.length : (typeof (ch as any).pageCount === 'number' ? (ch as any).pageCount : 10);
          pagesArray = generatePages(ch.id || `${mangaId}-chapter-${index + 1}-regen`, pageCount);
        }
        return {
          ...ch,
          id: ch.id || `${mangaId}-chapter-${index + 1}-updated-${Date.now()}`, // Ensure ID
          chapterNumber: ch.chapterNumber || index + 1, // Ensure chapter number
          pages: pagesArray,
        };
      });
    }
    modifiableMockMangaSeries[mangaIndex] = { ...modifiableMockMangaSeries[mangaIndex], ...updates };
    console.log("Mock manga data updated:", modifiableMockMangaSeries[mangaIndex]);
  }
};

export const addMockMangaSeries = (newManga: MangaSeries) => {
  const authorExists = mockAuthors.some(a => a.id === newManga.author.id);
  if (!authorExists) {
    mockAuthors.push(newManga.author);
  }
  modifiableMockMangaSeries.unshift(newManga); 
  console.log("New mock manga added:", newManga);
};

export const deleteMockMangaData = (mangaId: string) => {
  modifiableMockMangaSeries = modifiableMockMangaSeries.filter(manga => manga.id !== mangaId);
  console.log(`Mock manga data deleted: ${mangaId}`);
};
