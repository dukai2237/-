import { notFound } from 'next/navigation';
import { getChapterById, getMangaById } from '@/lib/mock-data';
import { MangaReaderView } from '@/components/manga/MangaReaderView';

interface MangaReaderPageProps {
  params: { mangaId: string; chapterId: string };
}

export async function generateMetadata({ params }: MangaReaderPageProps) {
  const manga = getMangaById(params.mangaId);
  const chapter = getChapterById(params.mangaId, params.chapterId);
  
  if (!manga || !chapter) {
    return { title: 'Chapter Not Found' };
  }
  return {
    title: `${manga.title} - Chapter ${chapter.chapterNumber} | Manga Reader`,
    description: `Reading ${manga.title}, Chapter ${chapter.chapterNumber}: ${chapter.title}.`,
  };
}

export default function MangaReaderPage({ params }: MangaReaderPageProps) {
  const { mangaId, chapterId } = params;
  const chapter = getChapterById(mangaId, chapterId);
  const manga = getMangaById(mangaId);

  if (!chapter || !manga) {
    notFound();
  }
  
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-center mb-2 mt-0 md:mt-2">
        {manga.title} - Chapter {chapter.chapterNumber}: {chapter.title}
      </h1>
      <MangaReaderView pages={chapter.pages} mangaId={mangaId} chapterId={chapterId} />
    </div>
  );
}
