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
  author: string;
  summary: string;
  coverImage: string;
  genres: string[];
  chapters: Chapter[];
}
