"use client";

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getAuthorById, getMangaByAuthorId } from '@/lib/mock-data';
import type { AuthorInfo, MangaSeries } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MangaCard } from '@/components/manga/MangaCard';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function CreatorWorksPage() {
  const params = useParams();
  const router = useRouter();
  const authorId = params.authorId as string;

  const [author, setAuthor] = useState<AuthorInfo | null | undefined>(undefined); // undefined for loading, null for not found
  const [mangaSeries, setMangaSeries] = useState<MangaSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authorId) {
      setIsLoading(true);
      const fetchedAuthor = getAuthorById(authorId);
      if (fetchedAuthor) {
        setAuthor(fetchedAuthor);
        const works = getMangaByAuthorId(authorId);
        setMangaSeries(works);
      } else {
        setAuthor(null); // Mark as not found
      }
      setIsLoading(false);
    }
  }, [authorId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (author === null) {
    notFound(); // Triggers Next.js not found page
  }
  
  if (!author) { // Should be covered by isLoading or author === null, but as a fallback
      return <div className="text-center py-10">Author details not available.</div>
  }


  return (
    <div className="space-y-8">
      <section className="pt-8 pb-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft />
          </Button>
          <Avatar className="h-16 w-16 mr-4">
            <AvatarImage src={author.avatarUrl} alt={author.name} data-ai-hint="creator avatar large"/>
            <AvatarFallback className="text-2xl">{author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" suppressHydrationWarning>{author.name}'s Works</h1>
            <p className="text-muted-foreground" suppressHydrationWarning>Browse all manga series created by {author.name}.</p>
          </div>
        </div>
      </section>

      {mangaSeries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
          {mangaSeries.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      ) : (
        <Card className="col-span-full">
          <CardContent className="pt-6 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground" suppressHydrationWarning>
              {author.name} has not published any manga series yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
