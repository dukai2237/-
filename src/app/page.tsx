
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
  const searchTerm = searchParams.get('search') || '';
  const genreFilter = searchParams.get('genre') || '';
  const { updateUserSearchHistory, user } = useAuth(); // Assume useAuth is available

  const [filteredManga, setFilteredManga] = useState<MangaSeries[]>(allMockMangaSeries);

  useEffect(() => {
    let mangaToDisplay = [...allMockMangaSeries];

    if (searchTerm) {
      mangaToDisplay = mangaToDisplay.filter(manga =>
        manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manga.author.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (user) { // Only update search history if a user is logged in
        updateUserSearchHistory(searchTerm);
      }
    }

    if (genreFilter) {
      mangaToDisplay = mangaToDisplay.filter(manga =>
        manga.genres.includes(genreFilter)
      );
    }
    
    setFilteredManga(mangaToDisplay);
  }, [searchTerm, genreFilter, user, updateUserSearchHistory]);


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
        <h2 className="text-2xl font-semibold mb-2" suppressHydrationWarning>No Results Found</h2>
        <p className="text-muted-foreground" suppressHydrationWarning>
          No manga or authors matched "<span className="font-semibold">{searchTerm}</span>".
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Back to Home</Link>
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
            <Link href={genreFilter === genre.id ? "/" : `/?genre=${genre.id}${searchTerm ? `&search=${searchTerm}` : ''}`}>
              <Tag className="mr-1.5 h-3.5 w-3.5"/> {genre.name.split('(')[0].trim()}
            </Link>
          </Button>
        ))}
        {(genreFilter || searchTerm) && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Clear Filters</Link>
          </Button>
        )}
      </div>


      {filteredManga.length === 0 && (genreFilter || searchTerm) && (
         <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2" suppressHydrationWarning>No Results in this Category</h2>
          <p className="text-muted-foreground" suppressHydrationWarning>
            No manga found with the current filters.
          </p>
        </div>
      )}

      {filteredManga.length > 0 && (
        <>
          {newestManga.length > 0 && (
            <section>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center" suppressHydrationWarning><Zap className="mr-3 h-7 w-7 text-yellow-500"/>Latest Releases</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                {newestManga.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </section>
          )}
          
          {popularManga.length > 0 && newestManga.length > 0 && <Separator className="my-10" />}


          {popularManga.length > 0 && (
             <section>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center" suppressHydrationWarning><Flame className="mr-3 h-7 w-7 text-red-500"/>Popular Manga (by Views)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                {popularManga.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </section>
          )}

          {randomManga.length > 0 && popularManga.length > 0 && <Separator className="my-10" />}
          
          {randomManga.length > 0 && (
             <section>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight flex items-center" suppressHydrationWarning><Shuffle className="mr-3 h-7 w-7 text-green-500"/>Random Recommendations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
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
          <p className="text-lg text-muted-foreground" suppressHydrationWarning>No manga series available at the moment. Check back later!</p>
        </div>
      )}
    </div>
  );
}

// Mock useAuth hook if not available globally, for standalone testing of this component
// In a real app, this would come from your AuthContext
const useAuth = () => ({
  user: null, // Or a mock user object
  updateUserSearchHistory: (term: string) => console.log("Search term:", term)
});
