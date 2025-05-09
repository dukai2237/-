ts

import type { MangaSeries, MangaPage, AuthorInfo, MangaInvestmentOffer, AuthorContactDetails, Chapter } from './types';
import { MANGA_GENRES_DETAILS } from './constants';

const generatePages = (chapterId: string, count: number): MangaPage[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${chapterId}-page-${i + 1}`,
    imageUrl: `https://picsum.photos/800/1200?random=${chapterId}${i + 1}`,
    altText: `Page ${i + 1}`,
  }));
};

const mockAuthors: (AuthorInfo & { contactDetails?: AuthorContactDetails, isSystemUser?: boolean })[] = [
  { 
    id: 'author-1', 
    name: 'Kenji Tanaka', 
    avatarUrl: 'https://picsum.photos/100/100?random=author1',
    contactDetails: {
      email: 'kenji.tanaka@example.com',
      socialLinks: [{ platform: 'Twitter', url: 'https://twitter.com/kenji_manga' }]
    }
  },
  { 
    id: 'author-2', 
    name: 'Yuki Sato', 
    avatarUrl: 'https://picsum.photos/100/100?random=author2',
    contactDetails: {
      email: 'yuki.sato.art@example.com',
      socialLinks: [{ platform: 'Instagram', url: 'https://instagram.com/yuki_draws' }]
    }
  },
  { 
    id: 'author-3', 
    name: 'Aiko Suzuki', 
    avatarUrl: 'https://picsum.photos/100/100?random=author3',
  },
  { 
    id: 'user-123', 
    name: 'Test Creator', 
    avatarUrl: 'https://picsum.photos/100/100?random=creator',
    isSystemUser: true, 
    contactDetails: {
      email: 'test@example.com',
      socialLinks: [{ platform: 'Website', url: 'https://testcreator.com'}]
    }
  },
  {
    id: 'author-pending',
    name: 'Pending Approval Sensei',
    avatarUrl: 'https://picsum.photos/100/100?random=authorpending',
    contactDetails: { email: 'pending@example.com' }
  }
];

const investmentOffer1: MangaInvestmentOffer = {
  sharesOfferedTotalPercent: 20,
  totalSharesInOffer: 100, 
  pricePerShare: 50, 
  minSubscriptionRequirement: 5, 
  description: "投资《流浪之刃》，获得其订阅、打赏和周边销售收入分成。您还将拥有该漫画IP未来改编（如动画、电影等）的一部分权益。",
  isActive: true,
};

const investmentOffer2: MangaInvestmentOffer = {
  sharesOfferedTotalPercent: 15,
  totalSharesInOffer: 150,
  pricePerShare: 25,
  description: "成为《赛博之心》的投资者！获得收入分成和IP所有权。非常适合赛博朋克和悬疑爱好者。",
  isActive: true,
  minSubscriptionRequirement: 3,
};


export const mockMangaSeriesData: MangaSeries[] = [
  {
    id: 'manga-1',
    title: '流浪之刃 (The Wandering Blade)',
    author: mockAuthors[0],
    authorDetails: mockAuthors[0].contactDetails,
    summary: '一位孤独的剑客在饱受战争蹂躏的土地上旅行，寻求救赎和一件失落的强大神器。他的旅程充满了危险的遭遇和道德困境。',
    coverImage: 'https://picsum.photos/400/600?random=manga1',
    genres: [MANGA_GENRES_DETAILS.find(g=>g.id==='action')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='adventure')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='fantasy')!.id],
    chapters: [
      { id: 'manga-1-chapter-1', title: '十字路口', chapterNumber: 1, pages: generatePages('m1c1', 8) },
      { id: 'manga-1-chapter-2', title: '林中低语', chapterNumber: 2, pages: generatePages('m1c2', 10) },
      { id: 'manga-1-chapter-3', title: '暗影之城', chapterNumber: 3, pages: generatePages('m1c3', 12) },
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
    title: '赛博之心 (Cybernetic Heart)',
    author: mockAuthors[1],
    authorDetails: mockAuthors[1].contactDetails,
    summary: '在一个未来城市，一名拥有半机械强化装置的侦探揭露了一个触及社会最高层的阴谋，同时努力应对自己的人性。',
    coverImage: 'https://picsum.photos/400/600?random=manga2',
    genres: [MANGA_GENRES_DETAILS.find(g=>g.id==='sci-fi')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='mystery')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='action')!.id],
    chapters: [
      { id: 'manga-2-chapter-1', title: '霓虹幻梦', chapterNumber: 1, pages: generatePages('m2c1', 10) },
      { id: 'manga-2-chapter-2', title: '数据幽灵', chapterNumber: 2, pages: generatePages('m2c2', 9) },
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
    title: '艾尔多利亚编年史 (Chronicles of Eldoria)',
    author: mockAuthors[2],
    authorDetails: mockAuthors[2].contactDetails,
    summary: '一位年轻的法师发现了自己的潜能，必须踏上拯救魔法王国艾尔多利亚免遭远古邪恶侵害的征途。一路上，她结识了勇敢的同伴，并揭开了被遗忘的传说。',
    coverImage: 'https://picsum.photos/400/600?random=manga3',
    genres: [MANGA_GENRES_DETAILS.find(g=>g.id==='fantasy')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='adventure')!.id],
    chapters: [
      { id: 'manga-3-chapter-1', title: '觉醒', chapterNumber: 1, pages: generatePages('m3c1', 15) },
      { id: 'manga-3-chapter-2', title: '禁忌森林', chapterNumber: 2, pages: generatePages('m3c2', 11) },
      { id: 'manga-3-chapter-3', title: '尖塔秘闻', chapterNumber: 3, pages: generatePages('m3c3', 14) },
      { id: 'manga-3-chapter-4', title: '暗影议会', chapterNumber: 4, pages: generatePages('m3c4', 10) },
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
    title: '我的创作者冒险 (My Author Adventure)',
    author: mockAuthors.find(a => a.id === 'user-123')!,
    authorDetails: mockAuthors.find(a => a.id === 'user-123')?.contactDetails,
    summary: '由我们平台的测试创作者创作的特别漫画系列！跟随他们的创作之旅。',
    coverImage: 'https://picsum.photos/400/600?random=manga4',
    genres: [MANGA_GENRES_DETAILS.find(g=>g.id==='comedy')!.id, MANGA_GENRES_DETAILS.find(g=>g.id==='healing')!.id],
    chapters: [
      { id: 'manga-4-chapter-1', title: '最初的火花', chapterNumber: 1, pages: generatePages('m4c1', 5) },
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

export const getAuthorById = (id: string): (AuthorInfo & { contactDetails?: AuthorContactDetails }) | undefined => {
  return mockAuthors.find(author => author.id === id);
}

export const getChapterById = (mangaId: string, chapterId: string) => {
  const manga = getMangaById(mangaId);
  return manga?.chapters.find(chapter => chapter.id === chapterId);
};

export const updateMockMangaData = (mangaId: string, updates: Partial<MangaSeries>) => {
  const mangaIndex = modifiableMockMangaSeries.findIndex(m => m.id === mangaId);
  if (mangaIndex !== -1) {
    const existingManga = modifiableMockMangaSeries[mangaIndex];
    let updatedChapters: Chapter[] | undefined = updates.chapters;

    if (updates.chapters) {
      updatedChapters = updates.chapters.map((updatedCh, chapterIdx) => {
        const existingChapter = existingManga.chapters.find(c => c.id === updatedCh.id);
        const newPages: MangaPage[] = updatedCh.pages.map((updatedPage, pageIdx) => {
          const existingPage = existingChapter?.pages.find(p => p.id === updatedPage.id);
          return {
            id: existingPage?.id || updatedPage.id || `${updatedCh.id}-page-${Date.now()}-${pageIdx}`,
            imageUrl: updatedPage.imageUrl, // This should now come from previewUrl or existingImageUrl
            altText: updatedPage.altText || `Page ${pageIdx + 1}`,
          };
        });
        return {
          ...updatedCh,
          id: existingChapter?.id || updatedCh.id || `${mangaId}-chapter-${Date.now()}-${chapterIdx}`,
          chapterNumber: updatedCh.chapterNumber || chapterIdx + 1,
          pages: newPages,
        };
      });
    }
    
    modifiableMockMangaSeries[mangaIndex] = { 
      ...existingManga, 
      ...updates,
      chapters: updatedChapters || existingManga.chapters // Use updated or existing chapters
    };
  }
};

export const addMockMangaSeries = (newManga: MangaSeries) => {
  const authorExists = mockAuthors.some(a => a.id === newManga.author.id);
  if (!authorExists) {
    const newAuthorData = { 
        id: newManga.author.id, 
        name: newManga.author.name, 
        avatarUrl: newManga.author.avatarUrl,
        contactDetails: newManga.authorDetails 
    };
    mockAuthors.push(newAuthorData);
  }
  modifiableMockMangaSeries.unshift(newManga); 
};

export const deleteMockMangaData = (mangaId: string) => {
  modifiableMockMangaSeries = modifiableMockMangaSeries.filter(manga => manga.id !== mangaId);
};

    