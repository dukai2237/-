
"use client";

import { MangaCard } from '@/components/manga/MangaCard';
import { getPublishedMangaSeries } from '@/lib/mock-data'; 
import type { MangaSeries } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shuffle, Flame, Zap, AlertCircle, Tag, CalendarDays, CalendarClock, Search } from 'lucide-react';
import { MANGA_GENRES_DETAILS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

const ITEMS_PER_SECTION = 20;
const MAX_FILTERED_ITEMS_DISPLAY = 100; // Cap for displaying filtered results directly

export default function HomePage() {
  const searchParams = useSearchParams();
  const { user, updateUserSearchHistory } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  const [allPublishedManga, setAllPublishedManga] = useState<MangaSeries[]>([]);
  const [processedFilteredManga, setProcessedFilteredManga] = useState<MangaSeries[]>([]); // Manga to display when filters are active
  
  const [clientRandomManga, setClientRandomManga] = useState<MangaSeries[]>([]);
  const [dailyNewReleases, setDailyNewReleases] = useState<MangaSeries[]>([]);
  const [monthlyNewReleases, setMonthlyNewReleases] = useState<MangaSeries[]>([]);
  const [newestMangaOverall, setNewestMangaOverall] = useState<MangaSeries[]>([]);
  const [popularMangaOverall, setPopularMangaOverall] = useState<MangaSeries[]>([]);


  useEffect(() => {
    setAllPublishedManga(getPublishedMangaSeries());
  }, []);

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    const currentGenre = searchParams.get('genre') || '';
    setSearchTerm(currentSearch);
    setGenreFilter(currentGenre);
  }, [searchParams]);

  const memoizedUpdateUserSearchHistory = useCallback(updateUserSearchHistory, [updateUserSearchHistory]);

  useEffect(() => {
    let baseFilteredManga = [...allPublishedManga];

    if (searchTerm) {
      baseFilteredManga = baseFilteredManga.filter(manga =>
        manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manga.author.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (user && searchTerm) { // Only update history if there's a search term
        memoizedUpdateUserSearchHistory(searchTerm);
      }
    }

    if (genreFilter) {
      baseFilteredManga = baseFilteredManga.filter(manga =>
        manga.genres.includes(genreFilter)
      );
    }
    
    // If search or genre filter is active, set processedFilteredManga
    if(searchTerm || genreFilter){
        setProcessedFilteredManga(baseFilteredManga.slice(0, MAX_FILTERED_ITEMS_DISPLAY));
    } else {
        setProcessedFilteredManga([]); // Clear if no filters
    }


    // Calculations for curated sections (only if no active filters, or for general display)
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    setDailyNewReleases(
      [...allPublishedManga]
        .filter(m => new Date(m.publishedDate) >= twentyFourHoursAgo)
        .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
        .slice(0, ITEMS_PER_SECTION)
    );

    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    setMonthlyNewReleases(
      [...allPublishedManga]
        .filter(m => new Date(m.publishedDate) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
        .slice(0, ITEMS_PER_SECTION)
    );
    
    setNewestMangaOverall(
        [...allPublishedManga]
        .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
        .slice(0, ITEMS_PER_SECTION)
    );

    setPopularMangaOverall(
        [...allPublishedManga]
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, ITEMS_PER_SECTION)
    );

    setClientRandomManga(
      [...allPublishedManga].sort(() => 0.5 - Math.random()).slice(0, ITEMS_PER_SECTION)
    );

  }, [searchTerm, genreFilter, user, memoizedUpdateUserSearchHistory, allPublishedManga]);


  const currentGenreName = genreFilter ? MANGA_GENRES_DETAILS.find(g => g.id === genreFilter)?.name : null;
  const isFiltering = searchTerm || genreFilter;

  if (isFiltering && processedFilteredManga.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2" suppressHydrationWarning>No Results Found</h2>
        <p className="text-muted-foreground" suppressHydrationWarning>
          {searchTerm && currentGenreName 
            ? `No manga matched "${searchTerm}" in category "${currentGenreName}".`
            : searchTerm 
            ? `No manga or authors matched "${searchTerm}".`
            : `No manga found in category "${currentGenreName}".`
          }
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Clear Filters & Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="text-center pt-8 pb-4">
        <h1 className="text-4xl font-bold tracking-tight mb-2" suppressHydrationWarning>Explore Your Favorite Manga</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto" suppressHydrationWarning>
          {searchTerm
            ? <>Results for "<span className="text-primary font-semibold">{searchTerm}</span>" {currentGenreName && <>in category "<span className="text-primary font-semibold">{currentGenreName}</span>"</>}:</>
            : currentGenreName
            ? <>Manga in category "<span className="text-primary font-semibold">{currentGenreName}</span>":</>
            : "Browse our exciting collection of manga series across various genres."}
        </p>
      </section>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {MANGA_GENRES_DETAILS.map(genre => (
          <Button key={genre.id} variant={genreFilter === genre.id ? "default" : "outline"} size="sm" asChild>
            <Link href={genreFilter === genre.id ? (searchTerm ? `/?search=${searchTerm}` : "/") : `/?genre=${genre.id}${searchTerm ? `&search=${searchTerm}` : ''}`}>
              <Tag className="mr-1.5 h-3.5 w-3.5"/> {genre.name}
            </Link>
          </Button>
        ))}
        {(genreFilter || searchTerm) && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Clear Filters</Link>
          </Button>
        )}
      </div>

      {isFiltering ? (
        <section>
          <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center" suppressHydrationWarning>
            <Search className="mr-3 h-7 w-7 text-primary"/>
            {searchTerm && currentGenreName 
              ? `Search Results for "${searchTerm}" in ${currentGenreName}`
              : searchTerm 
              ? `Search Results for "${searchTerm}"`
              : `Filtered by ${currentGenreName}`
            } 
             ({processedFilteredManga.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
            {processedFilteredManga.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
          {processedFilteredManga.length >= MAX_FILTERED_ITEMS_DISPLAY && (
             <p className="text-center text-muted-foreground mt-6">Displaying top {MAX_FILTERED_ITEMS_DISPLAY} results. Refine your search for more specific results.</p>
          )}
        </section>
      ) : (
        <>
          {dailyNewReleases.length > 0 && (
            <section>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center" suppressHydrationWarning><CalendarClock className="mr-3 h-7 w-7 text-sky-500"/>Daily New Releases</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
                {dailyNewReleases.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </section>
          )}
          {dailyNewReleases.length > 0 && <Separator className="my-10" />}

          {monthlyNewReleases.length > 0 && (
            <section>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center" suppressHydrationWarning><CalendarDays className="mr-3 h-7 w-7 text-blue-500"/>Monthly New Releases</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
                {monthlyNewReleases.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </section>
          )}
          {monthlyNewReleases.length > 0 && <Separator className="my-10" />}


          {newestMangaOverall.length > 0 && (
            <section>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center" suppressHydrationWarning><Zap className="mr-3 h-7 w-7 text-yellow-500"/>Latest Releases (All Time)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
                {newestMangaOverall.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </section>
          )}

          {popularMangaOverall.length > 0 && newestMangaOverall.length > 0 && <Separator className="my-10" />}


          {popularMangaOverall.length > 0 && (
             <section>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center" suppressHydrationWarning><Flame className="mr-3 h-7 w-7 text-red-500"/>Popular Manga (by Views)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
                {popularMangaOverall.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </section>
          )}

          {clientRandomManga.length > 0 && popularMangaOverall.length > 0 && <Separator className="my-10" />}

          {clientRandomManga.length > 0 && (
             <section>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center" suppressHydrationWarning><Shuffle className="mr-3 h-7 w-7 text-green-500"/>Random Recommendations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
                {clientRandomManga.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </section>
          )}
        </>
      )}


      {allPublishedManga.length === 0 && !isFiltering && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground" suppressHydrationWarning>No manga series available at the moment. Check back later!</p>
        </div>
      )}
    </div>
  );
}

