
import { MangaCard } from '@/components/manga/MangaCard';
import { modifiableMockMangaSeries as mockMangaSeries } from '@/lib/mock-data'; // Use modifiable for updates
import type { MangaSeries } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  // In a real app, this data would be fetched and could be dynamic.
  // For mock, we use the modifiable list which might get new entries from author dashboard.
  const allManga: MangaSeries[] = [...mockMangaSeries]; 

  const newestManga = allManga
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, 8); // Show latest 8

  const popularManga = allManga // Placeholder for popularity, using viewCount for now
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 8);


  return (
    <div className="space-y-12">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Discover Your Next Favorite Manga</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore our collection of captivating manga series across various genres.
        </p>
      </section>

      {newestManga.length > 0 && (
        <section>
          <h2 className="text-3xl font-semibold mb-6 tracking-tight">Newly Published</h2>
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
          <h2 className="text-3xl font-semibold mb-6 tracking-tight">Popular Manga (By Views)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {popularManga.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        </section>
      )}


      {allManga.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No manga series available at the moment. Please check back later!</p>
        </div>
      )}
    </div>
  );
}