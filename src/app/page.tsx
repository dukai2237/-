
"use client"; // Required for useSearchParams

import { MangaCard } from '@/components/manga/MangaCard';
import { modifiableMockMangaSeries as allMockMangaSeries } from '@/lib/mock-data'; 
import type { MangaSeries } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shuffle, Flame, Zap, AlertCircle, Tag } from 'lucide-react';
import { MANGA_GENRES_DETAILS } from '@/lib/constants';

export default function HomePage() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search');
  const genreFilter = searchParams.get('genre');

  const [filteredManga, setFilteredManga] = useState<MangaSeries[]>(allMockMangaSeries);

  useEffect(() => {
    let mangaToDisplay = [...allMockMangaSeries];

    if (searchTerm) {
      mangaToDisplay = mangaToDisplay.filter(manga =>
        manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manga.author.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (genreFilter) {
      mangaToDisplay = mangaToDisplay.filter(manga =>
        manga.genres.includes(genreFilter)
      );
    }
    
    setFilteredManga(mangaToDisplay);
  }, [searchTerm, genreFilter]);


  const newestManga = useMemo(() => 
    [...filteredManga]
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, 8), [filteredManga]);

  const popularManga = useMemo(() => 
    [...filteredManga]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 8), [filteredManga]);
  
  const randomManga = useMemo(() => 
    [...filteredManga].sort(() => 0.5 - Math.random()).slice(0, 8), 
  [filteredManga]);


  const currentGenreName = genreFilter ? MANGA_GENRES_DETAILS.find(g => g.id === genreFilter)?.name : null;

  if (searchTerm && filteredManga.length === 0 && !genreFilter) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">未找到结果</h2>
        <p className="text-muted-foreground">
          对于 "<span className="font-semibold">{searchTerm}</span>" 没有找到匹配的漫画或作者。
        </p>
        <Button asChild className="mt-6">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="text-center pt-8 pb-4">
        <h1 className="text-4xl font-bold tracking-tight mb-2">探索您喜爱的漫画</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {searchTerm 
            ? <>搜索 "<span className="text-primary font-semibold">{searchTerm}</span>" 的结果 {currentGenreName && <>在类别 "<span className="text-primary font-semibold">{currentGenreName}</span>"</>}:</> 
            : currentGenreName 
            ? <>类别 "<span className="text-primary font-semibold">{currentGenreName}</span>" 下的漫画:</>
            : "浏览我们各类型的精彩漫画系列。"}
        </p>
      </section>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {MANGA_GENRES_DETAILS.map(genre => (
          <Button key={genre.id} variant={genreFilter === genre.id ? "default" : "outline"} size="sm" asChild>
            <Link href={genreFilter === genre.id ? "/" : `/?genre=${genre.id}${searchTerm ? `&search=${searchTerm}` : ''}`}>
              {genre.name}
            </Link>
          </Button>
        ))}
        {(genreFilter || searchTerm) && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">清除筛选</Link>
          </Button>
        )}
      </div>


      {filteredManga.length === 0 && (genreFilter || searchTerm) && (
         <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">该类别下无结果</h2>
          <p className="text-muted-foreground">
            在当前筛选条件下没有找到漫画。
          </p>
        </div>
      )}

      {filteredManga.length > 0 && (
        <>
          {newestManga.length > 0 && (
            <section>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center"><Zap className="mr-3 h-7 w-7 text-yellow-500"/>最新发布</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {newestManga.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </section>
          )}
          
          <Separator />

          {popularManga.length > 0 && (
             <section>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center"><Flame className="mr-3 h-7 w-7 text-red-500"/>热门漫画 (按浏览量)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {popularManga.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </section>
          )}

          <Separator />
          
          {randomManga.length > 0 && (
             <section>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center"><Shuffle className="mr-3 h-7 w-7 text-green-500"/>随机推荐</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {randomManga.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </section>
          )}
        </>
      )}


      {allMockMangaSeries.length === 0 && !searchTerm && !genreFilter && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">目前没有漫画系列。请稍后再回来查看！</p>
        </div>
      )}
    </div>
  );
}
