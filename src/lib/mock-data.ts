import type { MangaSeries, MangaPage, AuthorInfo, MangaInvestmentOffer } from './types';

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
    // No contact info provided for this author
  },
  { 
    id: 'user-123', // This ID matches MOCK_USER_VALID from AuthContext
    name: 'Test User (Author)', 
    avatarUrl: 'https://picsum.photos/100/100?random=user',
    contactEmail: 'testuser.author@example.com',
    socialLinks: [{ platform: 'Website', url: 'https://testuserauthor.com'}]
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
    coverImage: 'https://picsum.photos/400/600?random=cover1',
    genres: ['Action', 'Adventure', 'Fantasy', 'Samurai'],
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
    publishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // ~2 months ago
    averageRating: 2.8,
    ratingCount: 150,
    viewCount: 12000,
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
    publishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // ~1 month ago
    averageRating: 2.5,
    ratingCount: 95,
    viewCount: 8500,
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
    totalRevenueFromSubscriptions: 0,
    totalRevenueFromDonations: 50,
    totalRevenueFromMerchandise: 0,
    investors: [],
    publishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), // ~3 months ago
    averageRating: 2.2,
    ratingCount: 200,
    viewCount: 15000,
  },
  {
    id: 'manga-4', // This manga will be authored by MOCK_USER_VALID
    title: 'My Author Adventure',
    author: mockAuthors[3], // Corresponds to 'user-123' Test User (Author)
    summary: 'A special manga series created by our platform\'s Test User! Follow their creative journey.',
    coverImage: 'https://picsum.photos/400/600?random=cover-user-author',
    genres: ['Slice of Life', 'Meta', 'Comedy'],
    chapters: [
      { id: 'manga-4-chapter-1', title: 'The First Spark', chapterNumber: 1, pages: generatePages('m4c1', 5) },
    ],
    freePreviewPageCount: 2,
    subscriptionPrice: 2,
    totalRevenueFromSubscriptions: 50,
    totalRevenueFromDonations: 10,
    totalRevenueFromMerchandise: 0,
    investors: [],
    publishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // ~5 days ago
    averageRating: undefined, // No ratings yet
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
    modifiableMockMangaSeries[mangaIndex] = { ...modifiableMockMangaSeries[mangaIndex], ...updates };
    console.log("Mock manga data updated:", modifiableMockMangaSeries[mangaIndex]);
  }
};

export const addMockMangaSeries = (newManga: MangaSeries) => {
  // Check if author exists, if not, add to mockAuthors (simple version)
  const authorExists = mockAuthors.some(a => a.id === newManga.author.id);
  if (!authorExists) {
    mockAuthors.push(newManga.author);
  }
  modifiableMockMangaSeries.unshift(newManga); // Add to the beginning to show it as "newest"
  console.log("New mock manga added:", newManga);
};