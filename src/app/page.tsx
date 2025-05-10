
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


const MANGA_PER_PAGE = 20; 
const MAX_FILTERED_ITEMS_DISPLAY = 100; 
const CREATORS_PER_PAGE = 30;

type MangaSortOption = "popular" | "newest" | "updated" | "title_asc" | "title_desc";
type CreatorSortOption = "name_asc" | "name_desc";


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
  
  const [mangaSort, setMangaSort] = useState<MangaSortOption>("popular");
  const [creatorSort, setCreatorSort] = useState<CreatorSortOption>("name_asc");

  const [currentCreatorPage, setCurrentCreatorPage] = useState(1);
  const [currentMangaPage, setCurrentMangaPage] = useState(1); // Used for generic manga section

  // Specific pagination states for distinct sections
  const [dailyNewPage, setDailyNewPage] = useState(1);
  const [monthlyNewPage, setMonthlyNewPage] = useState(1);
  const [popularPage, setPopularPage] = useState(1);
  const [randomRecsPage, setRandomRecsPage] = useState(1);


  useEffect(() => {
    setAllPublishedManga(getPublishedMangaSeries());
    setAllApprovedCreators(getApprovedCreators());
  }, []);

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    const currentGenre = searchParams.get('genre') || '';
    setSearchTerm(currentSearch);
    setGenreFilter(currentGenre);
    setCurrentCreatorPage(1); 
    setCurrentMangaPage(1);
    setDailyNewPage(1);
    setMonthlyNewPage(1);
    setPopularPage(1);
    setRandomRecsPage(1);
  }, [searchParams]);

  const memoizedUpdateUserSearchHistory = useCallback(updateUserSearchHistory, [updateUserSearchHistory]);

  const sortedAndFilteredManga = useMemo(() => {
    let baseManga = [...allPublishedManga];

    // Apply sorting
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
    
    // Apply filtering if searchTerm or genreFilter is active
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
    return baseManga; // Return all sorted manga if no filter
  }, [allPublishedManga, mangaSort, searchTerm, genreFilter]);

  const sortedAndFilteredCreators = useMemo(() => {
    let baseCreators = [...allApprovedCreators];
    
    // Apply sorting
    switch (creatorSort) {
      case "name_asc":
        baseCreators.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        baseCreators.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    // Apply filtering if searchTerm is active
    if (searchTerm) {
        baseCreators = baseCreators.filter(creator =>
            creator.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return baseCreators.slice(0, MAX_FILTERED_ITEMS_DISPLAY);
    }
    return baseCreators; // Return all sorted creators if no filter
  }, [allApprovedCreators, creatorSort, searchTerm]);


  useEffect(() => {
    if (searchTerm && user && user.accountType === 'user') { 
      memoizedUpdateUserSearchHistory(searchTerm);
    }
    
    // Set processed lists based on whether filtering is active
    if (searchTerm || genreFilter) {
        setProcessedFilteredManga(sortedAndFilteredManga);
        setProcessedFilteredCreators(sortedAndFilteredCreators);
    } else {
        setProcessedFilteredManga([]); // Clear if no filters, main lists will use sortedAndFiltered
        setProcessedFilteredCreators([]);
    }
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    setDailyNewReleases(
      [...allPublishedManga]
        .filter(m => new Date(m.publishedDate) >= twentyFourHoursAgo)
        .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    );

    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    setMonthlyNewReleases(
      [...allPublishedManga]
        .filter(m => new Date(m.publishedDate) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    );
    
    setClientRandomManga(
      [...allPublishedManga].sort(() => 0.5 - Math.random())
    );

  }, [searchTerm, genreFilter, user, memoizedUpdateUserSearchHistory, allPublishedManga, allApprovedCreators, sortedAndFilteredManga, sortedAndFilteredCreators]);


  const renderPaginatedMangaSection = (title: string, icon: React.ReactNode, mangaList: MangaSeries[], pageState: number, setPageState: (page: number) => void, sectionId: string, showSort?: boolean, currentSort?: MangaSortOption, onSortChange?: (value: MangaSortOption) => void) => {
    const totalPages = Math.ceil(mangaList.length / MANGA_PER_PAGE);
    const startIndex = (pageState - 1) * MANGA_PER_PAGE;
    const paginatedManga = mangaList.slice(startIndex, startIndex + MANGA_PER_PAGE);

    if (paginatedManga.length === 0 && !(isFiltering && mangaList === processedFilteredManga)) return null;

    return (
      <section key={sectionId}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-semibold tracking-tight flex items-center" suppressHydrationWarning>{icon}{title} ({mangaList.length})</h2>
          {showSort && onSortChange && currentSort && (
            <div className="flex items-center gap-2">
              <Label htmlFor={`${sectionId}-sort`} className="text-sm font-medium">Sort by:</Label>
              <Select value={currentSort} onValueChange={onSortChange}>
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
        {paginatedManga.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
            {paginatedManga.map((manga, index) => (
              <MangaCard key={`${sectionId}-${manga.id}`} manga={manga} priority={index < 5 && pageState === 1} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No manga found for this section.</p>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPageState(Math.max(1, pageState - 1))}
              disabled={pageState === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pageState} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPageState(Math.min(totalPages, pageState + 1))}
              disabled={pageState === totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </section>
    );
  };

  const renderPaginatedCreatorSection = (title: string, icon: React.ReactNode, creatorList: AuthorInfo[], pageState: number, setPageState: (page:number) => void, sectionId: string, showSort?: boolean, currentSort?: CreatorSortOption, onSortChange?: (value: CreatorSortOption) => void) => {
    const totalPages = Math.ceil(creatorList.length / CREATORS_PER_PAGE);
    const startIndex = (pageState - 1) * CREATORS_PER_PAGE;
    const paginatedCreators = creatorList.slice(startIndex, startIndex + CREATORS_PER_PAGE);

    if (paginatedCreators.length === 0 && !(isFiltering && creatorList === processedFilteredCreators)) return null;

    return (
       <section key={sectionId}>
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold tracking-tight flex items-center" suppressHydrationWarning>
                {icon} {title} ({creatorList.length})
            </h2>
            {showSort && onSortChange && currentSort && (
                 <div className="flex items-center gap-2">
                    <Label htmlFor={`${sectionId}-creator-sort`} className="text-sm font-medium">Sort by:</Label>
                    <Select value={currentSort} onValueChange={onSortChange}>
                        <SelectTrigger id={`${sectionId}-creator-sort`} className="w-[180px] h-9 text-sm">
                        <SelectValue placeholder="Sort creators" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                        {/* Future: <SelectItem value="works_desc">Most Works</SelectItem> */}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
        {paginatedCreators.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {paginatedCreators.map((creator) => (
                <Link key={creator.id} href={`/creators/${creator.id}`} className="flex flex-col items-center space-y-1 p-2 hover:bg-secondary rounded-md transition-colors" suppressHydrationWarning>
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarImage src={creator.avatarUrl} alt={creator.name} data-ai-hint="creator avatar"/>
                    <AvatarFallback suppressHydrationWarning>{creator.name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs sm:text-sm font-medium truncate w-20 sm:w-24 text-center" suppressHydrationWarning>{creator.name}</p>
                </Link>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPageState(p => Math.max(1, p - 1))}
                  disabled={pageState === 1}
                  suppressHydrationWarning
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                  Page {pageState} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPageState(p => Math.min(totalPages, p + 1))}
                  disabled={pageState === totalPages}
                  suppressHydrationWarning
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-center" suppressHydrationWarning>No creators found for this section.</p>
        )}
      </section>
    );
  };


  const currentGenreName = genreFilter ? MANGA_GENRES_DETAILS.find(g => g.id === genreFilter)?.name : null;
  const isFiltering = searchTerm || genreFilter;


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

  const popularMangaOverall = useMemo(() => 
    [...allPublishedManga].sort((a, b) => b.viewCount - a.viewCount), 
    [allPublishedManga]
  );


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
            processedFilteredManga, 
            currentMangaPage, 
            setCurrentMangaPage,
            "filtered-manga",
            true, // showSort
            mangaSort, // currentSort
            (value) => setMangaSort(value as MangaSortOption) // onSortChange
          )}
           {processedFilteredManga.length >= MAX_FILTERED_ITEMS_DISPLAY && (
                 <p className="text-center text-muted-foreground mt-6">Displaying top {MAX_FILTERED_ITEMS_DISPLAY} manga results. Refine your search for more specific results.</p>
            )}

          {processedFilteredCreators.length > 0 && (
            <>
              <Separator className="my-10" />
              {renderPaginatedCreatorSection(
                "Creator Results",
                <Users className="mr-3 h-7 w-7 text-primary"/>,
                processedFilteredCreators,
                currentCreatorPage,
                setCurrentCreatorPage,
                "filtered-creators",
                true, // showSort
                creatorSort, // currentSort
                (value) => setCreatorSort(value as CreatorSortOption) // onSortChange
              )}
            </>
          )}
           {processedFilteredCreators.length >= MAX_FILTERED_ITEMS_DISPLAY && (
             <p className="text-center text-muted-foreground mt-6">Displaying top {MAX_FILTERED_ITEMS_DISPLAY} creator results. Refine your search for more specific results.</p>
          )}
        </>
      ) : (
        <>
          {renderPaginatedMangaSection("Daily New Releases", <CalendarClock className="mr-3 h-7 w-7 text-sky-500"/>, dailyNewReleases, dailyNewPage, setDailyNewPage, "daily-new")}
          {dailyNewReleases.length > 0 && <Separator className="my-10" />}
          
          {renderPaginatedMangaSection("Monthly New Releases", <CalendarDays className="mr-3 h-7 w-7 text-blue-500"/>, monthlyNewReleases, monthlyNewPage, setMonthlyNewPage, "monthly-new")}
          {monthlyNewReleases.length > 0 && <Separator className="my-10" />}

          {renderPaginatedMangaSection(
            "Browse All Manga", 
            <Newspaper className="mr-3 h-7 w-7 text-yellow-500"/>, 
            sortedAndFilteredManga, // Use the master sorted list
            currentMangaPage, 
            setCurrentMangaPage, 
            "all-manga-browse",
            true,
            mangaSort,
            (value) => setMangaSort(value as MangaSortOption)
          )}
          {sortedAndFilteredManga.length > 0 && <Separator className="my-10" />}
          
          {renderPaginatedMangaSection("Popular Manga (by Views)", <Flame className="mr-3 h-7 w-7 text-red-500"/>, popularMangaOverall, popularPage, setPopularPage, "popular-all")}
          {popularMangaOverall.length > 0 && <Separator className="my-10" />}
          
          {renderPaginatedCreatorSection(
            "Browse All Creators",
            <Users className="mr-3 h-7 w-7 text-purple-500"/>,
            sortedAndFilteredCreators, // Use the master sorted list
            currentCreatorPage,
            setCurrentCreatorPage,
            "all-creators-browse",
            true,
            creatorSort,
            (value) => setCreatorSort(value as CreatorSortOption)
          )}
          

          {clientRandomManga.length > 0 && <Separator className="my-10" />}
          {renderPaginatedMangaSection("Random Recommendations", <Shuffle className="mr-3 h-7 w-7 text-green-500"/>, clientRandomManga, randomRecsPage, setRandomRecsPage, "random-recs")}
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

