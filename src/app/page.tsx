
"use client";

import { MangaCard } from '@/components/manga/MangaCard';
import { getPublishedMangaSeries, getApprovedCreators } from '@/lib/mock-data'; 
import type { MangaSeries, AuthorInfo } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shuffle, Flame, Zap, AlertCircle, Tag, CalendarDays, CalendarClock, Search, Users, ChevronLeft, ChevronRight, Newspaper, ArrowUpDown, SortAsc, SortDesc } from 'lucide-react';
import { MANGA_GENRES_DETAILS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';


const MANGA_PER_PAGE_DESKTOP = 20; 
const CREATORS_PER_PAGE_DESKTOP = 30;
const MAX_FILTERED_ITEMS_DISPLAY = 100; 

type MangaSortOption = "popular" | "newest" | "updated" | "title_asc" | "title_desc";
type CreatorSortOption = "name_asc" | "name_desc";


export default function HomePage() {
  const searchParams = useSearchParams();
  const { user, updateUserSearchHistory } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  const [allPublishedManga, setAllPublishedManga] = useState<MangaSeries[]>([]);
  const [allApprovedCreators, setAllApprovedCreators] = useState<AuthorInfo[]>([]);
  
  const [mangaSort, setMangaSort] = useState<MangaSortOption>("popular");
  const [creatorSort, setCreatorSort] = useState<CreatorSortOption>("name_asc");

  // State for desktop pagination
  const [currentCreatorPageDesktop, setCurrentCreatorPageDesktop] = useState(1);
  const [currentMangaPageDesktop, setCurrentMangaPageDesktop] = useState(1);
  const [dailyNewPageDesktop, setDailyNewPageDesktop] = useState(1);
  const [monthlyNewPageDesktop, setMonthlyNewPageDesktop] = useState(1);
  const [popularPageDesktop, setPopularPageDesktop] = useState(1);
  const [randomRecsPageDesktop, setRandomRecsPageDesktop] = useState(1);


  useEffect(() => {
    setAllPublishedManga(getPublishedMangaSeries());
    setAllApprovedCreators(getApprovedCreators());
  }, []);

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    const currentGenre = searchParams.get('genre') || '';
    setSearchTerm(currentSearch);
    setGenreFilter(currentGenre);
    // Reset desktop pagination on filter change
    setCurrentCreatorPageDesktop(1); 
    setCurrentMangaPageDesktop(1);
    setDailyNewPageDesktop(1);
    setMonthlyNewPageDesktop(1);
    setPopularPageDesktop(1);
    setRandomRecsPageDesktop(1);
  }, [searchParams]);

  const memoizedUpdateUserSearchHistory = useCallback(updateUserSearchHistory, [updateUserSearchHistory]);

  useEffect(() => {
    if (searchTerm && user && user.accountType === 'user') { 
      memoizedUpdateUserSearchHistory(searchTerm);
    }
  }, [searchTerm, user, memoizedUpdateUserSearchHistory]);

  const dailyNewReleases = useMemo(() => {
    if (!allPublishedManga.length) return [];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    return [...allPublishedManga]
      .filter(m => new Date(m.publishedDate) >= twentyFourHoursAgo)
      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
  }, [allPublishedManga]);

  const monthlyNewReleases = useMemo(() => {
    if (!allPublishedManga.length) return [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    return [...allPublishedManga]
      .filter(m => new Date(m.publishedDate) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
  }, [allPublishedManga]);
  
  const [clientRandomManga, setClientRandomManga] = useState<MangaSeries[]>([]);
  useEffect(() => {
    if (allPublishedManga.length > 0) {
      setClientRandomManga(
        [...allPublishedManga].sort(() => 0.5 - Math.random())
      );
    } else {
      setClientRandomManga([]);
    }
  }, [allPublishedManga]);

  const popularMangaOverall = useMemo(() => {
    if (!allPublishedManga.length) return [];
    return [...allPublishedManga].sort((a, b) => b.viewCount - a.viewCount);
  }, [allPublishedManga]);


  const sortedAndFilteredManga = useMemo(() => {
    let baseManga = [...allPublishedManga];

    switch (mangaSort) {
      case "popular":
        baseManga.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case "newest":
        baseManga.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
        break;
      case "updated":
        baseManga.sort((a,b) => {
          const dateA = new Date(a.lastChapterUpdateInfo?.date || a.lastUpdatedDate || a.publishedDate).getTime();
          const dateB = new Date(b.lastChapterUpdateInfo?.date || b.lastUpdatedDate || b.publishedDate).getTime();
          return dateB - dateA;
        });
        break;
      case "title_asc":
        baseManga.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title_desc":
        baseManga.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
    
    if (searchTerm || genreFilter) {
        if (searchTerm) {
          baseManga = baseManga.filter(manga =>
            manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            manga.author.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        if (genreFilter) {
          baseManga = baseManga.filter(manga =>
            manga.genres.includes(genreFilter)
          );
        }
        return baseManga.slice(0, MAX_FILTERED_ITEMS_DISPLAY);
    }
    return baseManga;
  }, [allPublishedManga, mangaSort, searchTerm, genreFilter]);

  const sortedAndFilteredCreators = useMemo(() => {
    let baseCreators = [...allApprovedCreators];
    
    switch (creatorSort) {
      case "name_asc":
        baseCreators.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        baseCreators.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    if (searchTerm) {
        baseCreators = baseCreators.filter(creator =>
            creator.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return baseCreators.slice(0, MAX_FILTERED_ITEMS_DISPLAY);
    }
    return baseCreators;
  }, [allApprovedCreators, creatorSort, searchTerm]);


  const isFiltering = searchTerm || genreFilter;

  const renderPaginatedMangaSection = (title: string, icon: React.ReactNode, mangaList: MangaSeries[], pageStateDesktop: number, setPageStateDesktop: (page: number) => void, sectionId: string, showSort?: boolean, currentSortValue?: MangaSortOption, onSortChange?: (value: MangaSortOption) => void) => {
    const totalPagesDesktop = Math.ceil(mangaList.length / MANGA_PER_PAGE_DESKTOP);
    const startIndexDesktop = (pageStateDesktop - 1) * MANGA_PER_PAGE_DESKTOP;
    const paginatedMangaDesktop = mangaList.slice(startIndexDesktop, startIndexDesktop + MANGA_PER_PAGE_DESKTOP);

    if (mangaList.length === 0 && !(isFiltering && mangaList === sortedAndFilteredManga)) return null;

    return (
      <section key={sectionId} className="py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center" suppressHydrationWarning>{icon}{title} ({mangaList.length})</h2>
          {showSort && onSortChange && currentSortValue && (
            <div className="hidden md:flex items-center gap-2">
              <Label htmlFor={`${sectionId}-sort`} className="text-sm font-medium">Sort by:</Label>
              <Select value={currentSortValue} onValueChange={onSortChange}>
                <SelectTrigger id={`${sectionId}-sort`} className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="Sort manga" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popularity</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="updated">Last Updated</SelectItem>
                  <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title_desc">Title (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Mobile: Horizontal Scroll */}
        <div className="md:hidden -mx-4 px-2"> {/* Negative margin to make scroll area edge-to-edge within container padding */}
          <div className="flex overflow-x-auto space-x-3 pb-4 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-muted">
            {mangaList.map((manga, index) => (
              <MangaCard 
                key={`${sectionId}-mobile-${manga.id}`} 
                manga={manga} 
                priority={index < 3} // Prioritize first 3 images in mobile horizontal scroll
                className="w-36 xs:w-40 shrink-0" // Fixed width for horizontal items
              />
            ))}
            {mangaList.length === 0 && <p className="text-muted-foreground text-center py-4 px-4">No manga found for this section.</p>}
          </div>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
          {paginatedMangaDesktop.map((manga, index) => (
            <MangaCard 
                key={`${sectionId}-desktop-${manga.id}`} 
                manga={manga} 
                priority={index < 5 && pageStateDesktop === 1} 
            />
          ))}
           {paginatedMangaDesktop.length === 0 && <p className="col-span-full text-muted-foreground text-center py-4">No manga found for this section.</p>}
        </div>
        
        {/* Desktop Pagination Controls */}
        {totalPagesDesktop > 1 && (
          <div className="hidden md:flex justify-center items-center mt-6 space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPageStateDesktop(Math.max(1, pageStateDesktop - 1))}
              disabled={pageStateDesktop === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pageStateDesktop} of {totalPagesDesktop}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPageStateDesktop(Math.min(totalPagesDesktop, pageStateDesktop + 1))}
              disabled={pageStateDesktop === totalPagesDesktop}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </section>
    );
  };

  const renderPaginatedCreatorSection = (title: string, icon: React.ReactNode, creatorList: AuthorInfo[], pageStateDesktop: number, setPageStateDesktop: (page:number) => void, sectionId: string, showSort?: boolean, currentSortValue?: CreatorSortOption, onSortChange?: (value: CreatorSortOption) => void) => {
    const totalPagesDesktop = Math.ceil(creatorList.length / CREATORS_PER_PAGE_DESKTOP);
    const startIndexDesktop = (pageStateDesktop - 1) * CREATORS_PER_PAGE_DESKTOP;
    const paginatedCreatorsDesktop = creatorList.slice(startIndexDesktop, startIndexDesktop + CREATORS_PER_PAGE_DESKTOP);

    if (creatorList.length === 0 && !(isFiltering && creatorList === sortedAndFilteredCreators)) return null;

    return (
       <section key={sectionId} className="py-4">
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold tracking-tight flex items-center" suppressHydrationWarning>
                {icon} {title} ({creatorList.length})
            </h2>
            {showSort && onSortChange && currentSortValue && (
                 <div className="hidden md:flex items-center gap-2">
                    <Label htmlFor={`${sectionId}-creator-sort`} className="text-sm font-medium">Sort by:</Label>
                    <Select value={currentSortValue} onValueChange={onSortChange}>
                        <SelectTrigger id={`${sectionId}-creator-sort`} className="w-[180px] h-9 text-sm">
                        <SelectValue placeholder="Sort creators" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>

        {/* Mobile: Horizontal Scroll */}
        <div className="md:hidden -mx-4 px-2">
          <div className="flex overflow-x-auto space-x-3 pb-4 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-muted">
            {creatorList.map((creator) => (
              <Link key={`${sectionId}-mobile-${creator.id}`} href={`/creators/${creator.id}`} className="flex flex-col items-center space-y-1 p-2 hover:bg-secondary rounded-md transition-colors w-24 shrink-0" suppressHydrationWarning>
                <Avatar className="h-16 w-16">
                  <AvatarImage src={creator.avatarUrl} alt={creator.name} data-ai-hint="creator avatar"/>
                  <AvatarFallback suppressHydrationWarning>{creator.name[0]}</AvatarFallback>
                </Avatar>
                <p className="text-xs font-medium truncate w-full text-center" suppressHydrationWarning>{creator.name}</p>
              </Link>
            ))}
            {creatorList.length === 0 &&  <p className="text-muted-foreground text-center py-4 px-4">No creators found for this section.</p>}
          </div>
        </div>
        
        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {paginatedCreatorsDesktop.map((creator) => (
                <Link key={`${sectionId}-desktop-${creator.id}`} href={`/creators/${creator.id}`} className="flex flex-col items-center space-y-1 p-2 hover:bg-secondary rounded-md transition-colors" suppressHydrationWarning>
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarImage src={creator.avatarUrl} alt={creator.name} data-ai-hint="creator avatar"/>
                    <AvatarFallback suppressHydrationWarning>{creator.name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs sm:text-sm font-medium truncate w-20 sm:w-24 text-center" suppressHydrationWarning>{creator.name}</p>
                </Link>
            ))}
            {paginatedCreatorsDesktop.length === 0 && <p className="col-span-full text-muted-foreground text-center py-4">No creators found for this section.</p>}
        </div>
        {totalPagesDesktop > 1 && (
            <div className="hidden md:flex justify-center items-center mt-6 space-x-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPageStateDesktop(p => Math.max(1, p - 1))}
                disabled={pageStateDesktop === 1}
                suppressHydrationWarning
            >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                Page {pageStateDesktop} of {totalPagesDesktop}
            </span>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPageStateDesktop(p => Math.min(totalPagesDesktop, p + 1))}
                disabled={pageStateDesktop === totalPagesDesktop}
                suppressHydrationWarning
            >
                Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            </div>
        )}
      </section>
    );
  };


  const currentGenreName = genreFilter ? MANGA_GENRES_DETAILS.find(g => g.id === genreFilter)?.name : null;

  if (isFiltering && sortedAndFilteredManga.length === 0 && sortedAndFilteredCreators.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2" suppressHydrationWarning>No Results Found</h2>
        <p className="text-muted-foreground" suppressHydrationWarning>
          {searchTerm && currentGenreName 
            ? `No manga or creators matched "${searchTerm}" in category "${currentGenreName}".`
            : searchTerm 
            ? `No manga or creators matched "${searchTerm}".`
            : currentGenreName ? `No manga found in category "${currentGenreName}".` : "No results."
          }
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Clear Filters & Back to Home</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-8">
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
            <Link href={genreFilter === genre.id ? (searchTerm ? `/?search=${searchTerm}` : "/") : `/?genre=${genre.id}${searchTerm ? `&search=${searchTerm}` : ''}`} suppressHydrationWarning>
              <Tag className="mr-1.5 h-3.5 w-3.5"/> {genre.name}
            </Link>
          </Button>
        ))}
        {(genreFilter || searchTerm) && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" suppressHydrationWarning>Clear Filters</Link>
          </Button>
        )}
      </div>

      {isFiltering ? (
        <>
          {renderPaginatedMangaSection(
            `Manga Results`, 
            <Search className="mr-3 h-7 w-7 text-primary"/>, 
            sortedAndFilteredManga, 
            currentMangaPageDesktop, 
            setCurrentMangaPageDesktop,
            "filtered-manga",
            true, 
            mangaSort, 
            (value) => setMangaSort(value as MangaSortOption) 
          )}
           {sortedAndFilteredManga.length >= MAX_FILTERED_ITEMS_DISPLAY && (
                 <p className="text-center text-muted-foreground mt-6">Displaying top {MAX_FILTERED_ITEMS_DISPLAY} manga results. Refine your search for more specific results.</p>
            )}

          {sortedAndFilteredCreators.length > 0 && (
            <>
              <Separator className="my-10" />
              {renderPaginatedCreatorSection(
                "Creator Results",
                <Users className="mr-3 h-7 w-7 text-primary"/>,
                sortedAndFilteredCreators,
                currentCreatorPageDesktop,
                setCurrentCreatorPageDesktop,
                "filtered-creators",
                true, 
                creatorSort, 
                (value) => setCreatorSort(value as CreatorSortOption) 
              )}
               {sortedAndFilteredCreators.length >= MAX_FILTERED_ITEMS_DISPLAY && (
                <p className="text-center text-muted-foreground mt-6">Displaying top {MAX_FILTERED_ITEMS_DISPLAY} creator results. Refine your search for more specific results.</p>
                )}
            </>
          )}
        </>
      ) : (
        <>
          {renderPaginatedMangaSection("Daily New Releases", <CalendarClock className="mr-3 h-7 w-7 text-sky-500"/>, dailyNewReleases, dailyNewPageDesktop, setDailyNewPageDesktop, "daily-new")}
          {dailyNewReleases.length > 0 && <Separator className="my-10" />}
          
          {renderPaginatedMangaSection("Monthly New Releases", <CalendarDays className="mr-3 h-7 w-7 text-blue-500"/>, monthlyNewReleases, monthlyNewPageDesktop, setMonthlyNewPageDesktop, "monthly-new")}
          {monthlyNewReleases.length > 0 && <Separator className="my-10" />}

          {renderPaginatedMangaSection(
            "Browse All Manga", 
            <Newspaper className="mr-3 h-7 w-7 text-yellow-500"/>, 
            sortedAndFilteredManga, 
            currentMangaPageDesktop, 
            setCurrentMangaPageDesktop, 
            "all-manga-browse",
            true,
            mangaSort,
            (value) => setMangaSort(value as MangaSortOption)
          )}
          {sortedAndFilteredManga.length > 0 && <Separator className="my-10" />}
          
          {renderPaginatedMangaSection("Popular Manga (by Views)", <Flame className="mr-3 h-7 w-7 text-red-500"/>, popularMangaOverall, popularPageDesktop, setPopularPageDesktop, "popular-all")}
          {popularMangaOverall.length > 0 && <Separator className="my-10" />}
          
          {renderPaginatedCreatorSection(
            "Browse All Creators",
            <Users className="mr-3 h-7 w-7 text-purple-500"/>,
            sortedAndFilteredCreators, 
            currentCreatorPageDesktop,
            setCurrentCreatorPageDesktop,
            "all-creators-browse",
            true,
            creatorSort,
            (value) => setCreatorSort(value as CreatorSortOption)
          )}
          
          {clientRandomManga.length > 0 && <Separator className="my-10" />}
          {renderPaginatedMangaSection("Random Recommendations", <Shuffle className="mr-3 h-7 w-7 text-green-500"/>, clientRandomManga, randomRecsPageDesktop, setRandomRecsPageDesktop, "random-recs")}
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

