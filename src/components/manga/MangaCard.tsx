
import Image from 'next/image';
import Link from 'next/link';
import type { MangaSeries } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Added Avatar

interface MangaCardProps {
  manga: MangaSeries;
}

export function MangaCard({ manga }: MangaCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <Link href={`/manga/${manga.id}`} className="block aspect-[2/3] relative overflow-hidden">
          <Image
            src={manga.coverImage}
            alt={`Cover of ${manga.title}`}
            layout="fill"
            objectFit="cover"
            className="hover:scale-105 transition-transform duration-300"
            data-ai-hint="manga cover"
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg mb-1 leading-tight">
          <Link href={`/manga/${manga.id}`} className="hover:text-primary transition-colors">
            {manga.title}
          </Link>
        </CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={manga.author.avatarUrl} alt={manga.author.name} data-ai-hint="author avatar small" />
            <AvatarFallback>{manga.author.name[0]}</AvatarFallback>
          </Avatar>
          <span>{manga.author.name}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {manga.summary}
        </p>
        <div className="flex flex-wrap gap-1">
          {manga.genres.slice(0, 3).map((genre) => (
            <Badge key={genre} variant="secondary" className="text-xs">{genre}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/manga/${manga.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
