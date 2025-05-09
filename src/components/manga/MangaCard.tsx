import Image from 'next/image';
import Link from 'next/link';
import type { MangaSeries } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Star, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MANGA_GENRES_DETAILS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext'; 

interface MangaCardProps {
  manga: MangaSeries;
}

export function MangaCard({ manga }: MangaCardProps) {
  const { user, isFavorited, toggleFavorite } = useAuth(); 

  const getGenreName = (genreId: string) => {
    const genreDetail = MANGA_GENRES_DETAILS.find(g => g.id === genreId);
    return genreDetail ? genreDetail.name.split('(')[0].trim() : genreId; 
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    toggleFavorite(manga.id, manga.title);
  };

  const userHasFavorited = user ? isFavorited(manga.id) : false;

  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 group">
      <CardHeader className="p-0 relative">
        <Link href={`/manga/${manga.id}`} className="block aspect-[2/3] relative overflow-hidden">
          <Image
            src={manga.coverImage}
            alt={`Cover of ${manga.title}`}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-300"
            data-ai-hint="manga cover"
          />
        </Link>
        {user && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white hover:text-red-400 rounded-full z-10"
            onClick={handleFavoriteToggle}
            title={userHasFavorited ? "Remove from Favorites" : "Add to Favorites"}
            suppressHydrationWarning
          >
            <Heart className={`h-5 w-5 ${userHasFavorited ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg mb-1 leading-tight">
          <Link href={`/manga/${manga.id}`} className="hover:text-primary transition-colors" suppressHydrationWarning>
            {manga.title}
          </Link>
        </CardTitle>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={manga.author.avatarUrl} alt={manga.author.name} data-ai-hint="author avatar small" />
              <AvatarFallback suppressHydrationWarning>{manga.author.name[0]}</AvatarFallback>
            </Avatar>
            <span suppressHydrationWarning>{manga.author.name}</span>
          </div>
          {manga.averageRating !== undefined && manga.ratingCount !== undefined && manga.ratingCount > 0 && (
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="font-semibold" suppressHydrationWarning>{manga.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground" suppressHydrationWarning>({manga.ratingCount})</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3" suppressHydrationWarning>
          {manga.summary}
        </p>
        <div className="flex flex-wrap gap-1">
          {manga.genres.slice(0, 3).map((genreId) => (
            <Badge key={genreId} variant="secondary" className="text-xs" suppressHydrationWarning>{getGenreName(genreId)}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/manga/${manga.id}`}>
            <span suppressHydrationWarning>View Details</span> <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

