
import { notFound } from 'next/navigation';
import { getChapterById, getMangaById } from '@/lib/mock-data';
import { MangaReaderView } from '@/components/manga/MangaReaderView';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

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
    title: `${manga.title} - Chapter ${chapter.chapterNumber} by ${manga.author.name} | Manga Platform`,
    description: `Reading ${manga.title}, Chapter ${chapter.chapterNumber}: ${chapter.title}. Authored by ${manga.author.name}.`,
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
      <div className="text-center mb-4 mt-0 md:mt-2">
        <h1 className="text-2xl md:text-3xl font-bold ">
          <Link href={`/manga/${manga.id}`} className="hover:text-primary transition-colors">
            {manga.title}
          </Link>
        </h1>
        <h2 className="text-lg md:text-xl font-semibold text-muted-foreground">
          Chapter {chapter.chapterNumber}: {chapter.title}
        </h2>
        <Link href={`/manga/${manga.id}`} className="inline-flex items-center gap-2 mt-2 text-sm hover:text-primary transition-colors">
            <Avatar className="h-6 w-6">
                <AvatarImage src={manga.author.avatarUrl} alt={manga.author.name} data-ai-hint="author avatar small"/>
                <AvatarFallback>{manga.author.name[0]}</AvatarFallback>
            </Avatar>
            <span>{manga.author.name}</span>
        </Link>
      </div>
      <MangaReaderView 
        pages={chapter.pages} 
        mangaId={mangaId} 
        chapterId={chapterId} 
        initialManga={manga}
        initialChapterNumber={chapter.chapterNumber}
      />
    </div>
  );
}
