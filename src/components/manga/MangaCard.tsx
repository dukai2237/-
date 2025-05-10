import Image from 'next/image';
import Link from 'next/link';
import type { MangaSeries } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Star, Heart, Edit2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MANGA_GENRES_DETAILS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext'; 
import { formatDistanceToNowStrict } from 'date-fns';
import React from 'react';

interface MangaCardProps {
  manga: MangaSeries;
  priority?: boolean; // Add priority prop
}

export const MangaCard = React.memo(function MangaCard({ manga, priority = false }: MangaCardProps) {
  const { user, isFavorited, toggleFavorite } = useAuth(); 

  const getGenreName = (genreId: string) => {
    const genreDetail = MANGA_GENRES_DETAILS.find(g => g.id === genreId);
    return genreDetail ? genreDetail.name.split('(')[0].trim() : genreId; 
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (!user || user.accountType === 'creator') { 
        // toast({ title: "Login Required", description: "Please login to favorite manga."});
        return;
    }
    toggleFavorite(manga.id, manga.title);
  };

  const userHasFavorited = user ? isFavorited(manga.id) : false;

  const timeSinceUpdate = manga.lastChapterUpdateInfo?.date 
    ? formatDistanceToNowStrict(new Date(manga.lastChapterUpdateInfo.date), { addSuffix: true })
    : null;
  
  const isRecentUpdate = manga.lastChapterUpdateInfo?.date && (new Date().getTime() - new Date(manga.lastChapterUpdateInfo.date).getTime()) < 7 * 24 * 60 * 60 * 1000; // Within last 7 days


  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 group">
      <CardHeader className="p-0 relative">
        <Link href={`/manga/${manga.id}`} className="block aspect-[2/3] relative overflow-hidden" suppressHydrationWarning>
          <Image
            src={manga.coverImage}
            alt={`Cover of ${manga.title}`}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-300"
            data-ai-hint="manga cover"
            priority={priority} // Use the prop here
          />
        </Link>
        {user && (user.accountType === 'user' || (user.accountType === 'creator' && user.id !== manga.author.id )) && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white hover:text-red-400 rounded-full z-10 h-8 w-8"
            onClick={handleFavoriteToggle}
            title={userHasFavorited ? "Remove from Favorites" : "Add to Favorites"}
            suppressHydrationWarning
          >
            <Heart className={`h-4 w-4 ${userHasFavorited ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </Button>
        )}
         {isRecentUpdate && manga.lastChapterUpdateInfo && (
            <Badge variant="default" className="absolute bottom-2 left-2 z-10 bg-primary/80 text-primary-foreground text-xs" suppressHydrationWarning>
                <Edit2 className="mr-1 h-3 w-3" />
                Updated: Ch. {manga.lastChapterUpdateInfo.chapterNumber}
                {manga.lastChapterUpdateInfo.pagesAdded > 0 ? ` (+${manga.lastChapterUpdateInfo.pagesAdded}p)` : ''}
            </Badge>
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
              <AvatarFallback suppressHydrationWarning>{manga.author.name?.[0]}</AvatarFallback>
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
        <div className="flex flex-wrap gap-1 mb-2">
          {manga.genres.slice(0, 3).map((genreId) => (
            <Badge key={genreId} variant="secondary" className="text-xs" suppressHydrationWarning>{getGenreName(genreId)}</Badge>
          ))}
        </div>
        {timeSinceUpdate && !isRecentUpdate && (
             <p className="text-xs text-muted-foreground" suppressHydrationWarning>Last update: {timeSinceUpdate}</p>
        )}

      </CardContent>
      <CardFooter className="p-4 pt-0 mt-auto">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/manga/${manga.id}`} suppressHydrationWarning>
            <span suppressHydrationWarning>View Details</span> <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
});
MangaCard.displayName = 'MangaCard';

