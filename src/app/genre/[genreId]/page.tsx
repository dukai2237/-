"use client";

import { MangaCard } from '@/components/manga/MangaCard';
import { modifiableMockMangaSeries as allMockMangaSeries } from '@/lib/mock-data';
import type { MangaSeries } from '@/lib/types';
import { MANGA_GENRES_DETAILS } from '@/lib/constants';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Tag } from 'lucide-react';

export default function GenrePage() {
  const params = useParams();
  const router = useRouter();
  const genreId = params.genreId as string;

  const [genreName, setGenreName] = useState<string | null>(null);
  const [mangaInGenre, setMangaInGenre] = useState<MangaSeries[]>([]);

  useEffect(() => {
    if (genreId) {
      const genreDetail = MANGA_GENRES_DETAILS.find(g => g.id === genreId);
      setGenreName(genreDetail ? genreDetail.name : '未知类型');

      const filtered = allMockMangaSeries.filter(manga => manga.genres.includes(genreId));
      setMangaInGenre(filtered);
    }
  }, [genreId]);

  if (!genreId) {
    return (
      <div className="text-center py-10">
        <p>未指定漫画类型。</p>
        <Button asChild className="mt-4">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="pt-8 pb-4">
        <div className="flex items-center mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                <ArrowLeft />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Tag className="mr-3 h-7 w-7 text-primary" /> 漫画类型: {genreName}
            </h1>
        </div>
      </section>

      {mangaInGenre.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mangaInGenre.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">该类型下暂无漫画作品。</p>
        </div>
      )}
    </div>
  );
}
