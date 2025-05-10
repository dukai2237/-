
"use client";

import { MangaCard } from '@/components/manga/MangaCard';
import { getPublishedMangaSeries, getApprovedCreators } from '@/lib/mock-data'; 
import type { MangaSeries, AuthorInfo } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shuffle, Flame, Zap, AlertCircle, Tag, CalendarDays, CalendarClock, Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { MANGA_GENRES_DETAILS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const ITEMS_PER_SECTION = 20;
const MAX_FILTERED_ITEMS_DISPLAY = 100; 
const CREATORS_PER_PAGE = 30;

export default function HomePage() {
  const searchParams = useSearchParams();
  const { user, updateUserSearchHistory } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  const [allPublishedManga, setAllPublishedManga] = useState<MangaSeries[]>([]);
  const [allApprovedCreators, setAllApprovedCreators] = useState<AuthorInfo[]>([]);
  
  const [processedFilteredManga, setProcessedFilteredManga] = useState<MangaSeries[]>([]); 
  const [processedFilteredCreators, setProcessedFilteredCreators] = useState<AuthorInfo[]>([]);
  
  const [clientRandomManga, setClientRandomManga] = useState<MangaSeries[]>([]);
  const [dailyNewReleases, setDailyNewReleases] = useState<MangaSeries[]>([]);
  const [monthlyNewReleases, setMonthlyNewReleases] = useState<MangaSeries[]>([]);
  const [newestMangaOverall, setNewestMangaOverall] = useState<MangaSeries[]>([]);
  const [popularMangaOverall, setPopularMangaOverall] = useState<MangaSeries[]>([]);

  const [currentCreatorPage, setCurrentCreatorPage] = useState(1);

  useEffect(() => {
    setAllPublishedManga(getPublishedMangaSeries());
    setAllApprovedCreators(getApprovedCreators());
  }, []);

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    const currentGenre = searchParams.get('genre') || '';
    setSearchTerm(currentSearch);
    setGenreFilter(currentGenre);
    setCurrentCreatorPage(1); // Reset creator page on filter change
  }, [searchParams]);

  const memoizedUpdateUserSearchHistory = useCallback(updateUserSearchHistory, [updateUserSearchHistory]);

  useEffect(() => {
    let baseFilteredManga = [...allPublishedManga];
    let baseFilteredCreators = [...allApprovedCreators];

    if (searchTerm) {
      baseFilteredManga = baseFilteredManga.filter(manga =>
        manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manga.author.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      baseFilteredCreators = baseFilteredCreators.filter(creator =>
        creator.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (user && searchTerm) { 
        memoizedUpdateUserSearchHistory(searchTerm);
      }
    }

    if (genreFilter) {
      baseFilteredManga = baseFilteredManga.filter(manga =>
        manga.genres.includes(genreFilter)
      );
      // Genre filter does not apply to creators directly in this setup
    }
    
    if(searchTerm || genreFilter){
        setProcessedFilteredManga(baseFilteredManga.slice(0, MAX_FILTERED_ITEMS_DISPLAY));
        setProcessedFilteredCreators(baseFilteredCreators.slice(0, MAX_FILTERED_ITEMS_DISPLAY)); // Also cap creators for search
    } else {
        setProcessedFilteredManga([]); 
        setProcessedFilteredCreators([]);
    }

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

  }, [searchTerm, genreFilter, user, memoizedUpdateUserSearchHistory, allPublishedManga, allApprovedCreators]);

  const currentGenreName = genreFilter ? MANGA_GENRES_DETAILS.find(g => g.id === genreFilter)?.name : null;
  const isFiltering = searchTerm || genreFilter;

  const paginatedCreators = useMemo(() => {
    const source = isFiltering ? processedFilteredCreators : allApprovedCreators;
    const startIndex = (currentCreatorPage - 1) * CREATORS_PER_PAGE;
    const endIndex = startIndex + CREATORS_PER_PAGE;
    return source.slice(startIndex, endIndex);
  }, [currentCreatorPage, allApprovedCreators, processedFilteredCreators, isFiltering]);

  const totalCreatorPages = useMemo(() => {
    const source = isFiltering ? processedFilteredCreators : allApprovedCreators;
    return Math.ceil(source.length / CREATORS_PER_PAGE);
  }, [allApprovedCreators, processedFilteredCreators, isFiltering]);


  if (isFiltering && processedFilteredManga.length === 0 && processedFilteredCreators.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2" suppressHydrationWarning>No Results Found</h2>
        <p className="text-muted-foreground" suppressHydrationWarning>
          {searchTerm && currentGenreName 
            ? `No manga or creators matched "${searchTerm}" in category "${currentGenreName}".`
            : searchTerm 
            ? `No manga or creators matched "${searchTerm}".`
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
            : "Browse our exciting collection of manga series and creators across various genres."}
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
        <>
          {processedFilteredManga.length > 0 && (
            <section>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center" suppressHydrationWarning>
                <Search className="mr-3 h-7 w-7 text-primary"/>
                Manga Results ({processedFilteredManga.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
                {processedFilteredManga.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
              {processedFilteredManga.length >= MAX_FILTERED_ITEMS_DISPLAY && (
                 <p className="text-center text-muted-foreground mt-6">Displaying top {MAX_FILTERED_ITEMS_DISPLAY} manga results. Refine your search for more specific results.</p>
              )}
            </section>
          )}
          {processedFilteredCreators.length > 0 && (
            <section>
              <Separator className="my-10" />
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center" suppressHydrationWarning>
                <Users className="mr-3 h-7 w-7 text-primary"/>
                Creator Results ({processedFilteredCreators.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {processedFilteredCreators.map((creator) => (
                   <Link key={creator.id} href={`/creators/${creator.id}`} className="flex flex-col items-center space-y-1 p-2 hover:bg-secondary rounded-md transition-colors">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                      <AvatarImage src={creator.avatarUrl} alt={creator.name} data-ai-hint="creator avatar" />
                      <AvatarFallback>{creator.name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs sm:text-sm font-medium truncate w-20 sm:w-24 text-center" suppressHydrationWarning>{creator.name}</p>
                  </Link>
                ))}
              </div>
               {processedFilteredCreators.length >= MAX_FILTERED_ITEMS_DISPLAY && (
                 <p className="text-center text-muted-foreground mt-6">Displaying top {MAX_FILTERED_ITEMS_DISPLAY} creator results. Refine your search for more specific results.</p>
              )}
            </section>
          )}
        </>
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
          
          <Separator className="my-10" />

          <section>
            <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center" suppressHydrationWarning><Users className="mr-3 h-7 w-7 text-purple-500"/>Featured Creators</h2>
            {paginatedCreators.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {paginatedCreators.map((creator) => (
                    <Link key={creator.id} href={`/creators/${creator.id}`} className="flex flex-col items-center space-y-1 p-2 hover:bg-secondary rounded-md transition-colors">
                      <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                        <AvatarImage src={creator.avatarUrl} alt={creator.name} data-ai-hint="creator avatar"/>
                        <AvatarFallback>{creator.name[0]}</AvatarFallback>
                      </Avatar>
                      <p className="text-xs sm:text-sm font-medium truncate w-20 sm:w-24 text-center" suppressHydrationWarning>{creator.name}</p>
                    </Link>
                  ))}
                </div>
                {totalCreatorPages > 1 && (
                  <div className="flex justify-center items-center mt-6 space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentCreatorPage(p => Math.max(1, p - 1))}
                      disabled={currentCreatorPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentCreatorPage} of {totalCreatorPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentCreatorPage(p => Math.min(totalCreatorPages, p + 1))}
                      disabled={currentCreatorPage === totalCreatorPages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-center">No creators found.</p>
            )}
          </section>


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


      {allPublishedManga.length === 0 && allApprovedCreators.length === 0 && !isFiltering && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground" suppressHydrationWarning>No manga series or creators available at the moment. Check back later!</p>
        </div>
      )}
    </div>
  );
}

