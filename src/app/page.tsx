import { MangaCard } from '@/components/manga/MangaCard';
import { mockMangaSeries } from '@/lib/mock-data';
import type { MangaSeries } from '@/lib/types';

export default function HomePage() {
  const mangaList: MangaSeries[] = mockMangaSeries;

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Discover Your Next Favorite Manga</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore our collection of captivating manga series across various genres.
        </p>
      </section>

      {mangaList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mangaList.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No manga series available at the moment. Please check back later!</p>
        </div>
      )}
    </div>
  );
}
