import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getMangaById } from '@/lib/mock-data';
import { ChapterListItem } from '@/components/manga/ChapterListItem';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

interface MangaDetailPageProps {
  params: { mangaId: string };
}

export async function generateMetadata({ params }: MangaDetailPageProps) {
  const manga = getMangaById(params.mangaId);
  if (!manga) {
    return { title: 'Manga Not Found' };
  }
  return {
    title: `${manga.title} - Chapters | Manga Reader`,
    description: `Browse chapters for ${manga.title}. ${manga.summary}`,
  };
}

export default function MangaDetailPage({ params }: MangaDetailPageProps) {
  const manga = getMangaById(params.mangaId);

  if (!manga) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-0 md:p-6 md:flex md:gap-6">
          <div className="md:w-1/3 aspect-[2/3] md:aspect-auto relative">
            <Image
              src={manga.coverImage}
              alt={`Cover of ${manga.title}`}
              width={400}
              height={600}
              className="w-full h-full object-cover md:rounded-lg"
              data-ai-hint="manga cover"
              priority
            />
          </div>
          <div className="md:w-2/3 p-6 md:p-0">
            <h1 className="text-3xl font-bold mb-2">{manga.title}</h1>
            <p className="text-md text-muted-foreground mb-3">By {manga.author}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {manga.genres.map((genre) => (
                <Badge key={genre} variant="outline">{genre}</Badge>
              ))}
            </div>
            
            <p className="text-sm text-foreground leading-relaxed mb-6">{manga.summary}</p>
            
            <Separator className="my-6" />

            <div>
              <h2 className="text-2xl font-semibold mb-4">Chapters</h2>
              {manga.chapters.length > 0 ? (
                <ul className="border rounded-lg overflow-hidden">
                  {manga.chapters.sort((a,b) => a.chapterNumber - b.chapterNumber).map((chapter) => (
                    <ChapterListItem key={chapter.id} mangaId={manga.id} chapter={chapter} />
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No chapters available yet.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
