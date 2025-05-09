import type { MangaSeries, MangaPage, AuthorInfo, MangaInvestmentOffer } from './types';

const generatePages = (chapterId: string, count: number): MangaPage[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${chapterId}-page-${i + 1}`,
    imageUrl: `https://picsum.photos/800/1200?random=${chapterId}${i + 1}`,
    altText: `Page ${i + 1}`,
  }));
};

const mockAuthors: AuthorInfo[] = [
  { id: 'author-1', name: 'Kenji Tanaka', avatarUrl: 'https://picsum.photos/100/100?random=author1' },
  { id: 'author-2', name: 'Yuki Sato', avatarUrl: 'https://picsum.photos/100/100?random=author2' },
  { id: 'author-3', name: 'Aiko Suzuki', avatarUrl: 'https://picsum.photos/100/100?random=author3' },
  { id: 'author-4', name: 'Haru Yamamoto', avatarUrl: 'https://picsum.photos/100/100?random=author4' },
];

const investmentOffer1: MangaInvestmentOffer = {
  sharesOfferedTotalPercent: 20,
  totalSharesInOffer: 100, // 20% revenue share divided into 100 investable shares
  pricePerShare: 50, // $50 per share
  minSubscriptionRequirement: 5, // Must be subscribed to at least 5 manga
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


export const mockMangaSeries: MangaSeries[] = [
  {
    id: 'manga-1',
    title: 'The Wandering Blade',
    author: mockAuthors[0],
    summary: 'A lone swordsman travels a war-torn land, seeking redemption and a lost artifact of immense power. His journey is filled with perilous encounters and moral dilemmas.',
    coverImage: 'https://picsum.photos/400/600?random=cover1',
    genres: ['Action', 'Adventure', 'Fantasy', 'Samurai'],
    chapters: [
      { id: 'manga-1-chapter-1', title: 'The Crossroads', chapterNumber: 1, pages: generatePages('m1c1', 8) },
      { id: 'manga-1-chapter-2', title: 'Whispers in the Woods', chapterNumber: 2, pages: generatePages('m1c2', 10) },
      { id: 'manga-1-chapter-3', title: 'City of Shadows', chapterNumber: 3, pages: generatePages('m1c3', 12) },
    ],
    freePreviewPageCount: 2,
    subscriptionPrice: 5,
    totalRevenueFromSubscriptions: 1250, // Mock initial revenue
    totalRevenueFromDonations: 350,
    totalRevenueFromMerchandise: 0,
    investmentOffer: investmentOffer1,
    investors: [
      { userId: 'investor-alpha', userName: 'Alpha Investor', sharesOwned: 10, totalAmountInvested: 500, joinedDate: new Date(Date.now() - 1000*60*60*24*30).toISOString()},
      { userId: 'investor-beta', userName: 'Beta Investor', sharesOwned: 5, totalAmountInvested: 250, joinedDate: new Date(Date.now() - 1000*60*60*24*15).toISOString()},
    ],
  },
  {
    id: 'manga-2',
    title: 'Cybernetic Heart',
    author: mockAuthors[1],
    summary: 'In a futuristic city, a detective with cybernetic enhancements uncovers a conspiracy that reaches the highest levels of society while grappling with her own humanity.',
    coverImage: 'https://picsum.photos/400/600?random=cover2',
    genres: ['Sci-Fi', 'Mystery', 'Cyberpunk', 'Action'],
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
  },
  {
    id: 'manga-3',
    title: 'Chronicles of Eldoria',
    author: mockAuthors[2],
    summary: 'A young mage discovers her latent powers and must embark on a quest to save the magical kingdom of Eldoria from an ancient evil. Along the way, she meets brave companions and uncovers forgotten lore.',
    coverImage: 'https://picsum.photos/400/600?random=cover3',
    genres: ['Fantasy', 'Magic', 'Adventure', 'Coming-of-Age'],
    chapters: [
      { id: 'manga-3-chapter-1', title: 'The Awakening', chapterNumber: 1, pages: generatePages('m3c1', 15) },
      { id: 'manga-3-chapter-2', title: 'The Forbidden Forest', chapterNumber: 2, pages: generatePages('m3c2', 11) },
      { id: 'manga-3-chapter-3', title: 'Secrets of the Spire', chapterNumber: 3, pages: generatePages('m3c3', 14) },
      { id: 'manga-3-chapter-4', title: 'The Shadow Council', chapterNumber: 4, pages: generatePages('m3c4', 10) },
    ],
    freePreviewPageCount: 1,
    // No subscription price, implies it might be fully free or has different model
    totalRevenueFromSubscriptions: 0,
    totalRevenueFromDonations: 50,
    totalRevenueFromMerchandise: 0,
    // No investment offer for this one
    investors: [],
  },
  {
    id: 'manga-4',
    title: 'Slice of Life Cafe',
    author: mockAuthors[3],
    summary: 'Warm and heartwarming stories centered around a small, cozy cafe and its regular customers. Each chapter explores the everyday lives, dreams, and relationships of different characters.',
    coverImage: 'https://picsum.photos/400/600?random=cover4',
    genres: ['Slice of Life', 'Comedy', 'Romance', 'Contemporary'],
    chapters: [
      { id: 'manga-4-chapter-1', title: 'The Usual Order', chapterNumber: 1, pages: generatePages('m4c1', 7) },
      { id: 'manga-4-chapter-2', title: 'Rainy Day Musings', chapterNumber: 2, pages: generatePages('m4c2', 8) },
    ],
    freePreviewPageCount: 5,
    subscriptionPrice: 3,
    totalRevenueFromSubscriptions: 300,
    totalRevenueFromDonations: 75,
    totalRevenueFromMerchandise: 0,
    investors: [],
    // No investment details, implying not open for investment
  },
];

// In a real app, manga data including financials would be fetched from a database
// For this mock setup, we'll allow modification of this array by other parts of the app (e.g., AuthContext for simulations)
// This is not ideal for a real app but helps for demonstration.
export let modifiableMockMangaSeries = [...mockMangaSeries];

export const getMangaById = (id: string): MangaSeries | undefined => {
  return modifiableMockMangaSeries.find(manga => manga.id === id);
};

export const getChapterById = (mangaId: string, chapterId: string) => {
  const manga = getMangaById(mangaId);
  return manga?.chapters.find(chapter => chapter.id === chapterId);
};

// Function to update manga data (for simulation purposes)
export const updateMockMangaData = (mangaId: string, updates: Partial<MangaSeries>) => {
  const mangaIndex = modifiableMockMangaSeries.findIndex(m => m.id === mangaId);
  if (mangaIndex !== -1) {
    modifiableMockMangaSeries[mangaIndex] = { ...modifiableMockMangaSeries[mangaIndex], ...updates };
  }
};
