
import Link from 'next/link';
import type { Chapter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { BookText, ChevronRight } from 'lucide-react';
import React from 'react';

interface ChapterListItemProps {
  mangaId: string;
  chapter: Chapter;
}

export const ChapterListItem = React.memo(function ChapterListItem({ mangaId, chapter }: ChapterListItemProps) {
  return (
    <li className="border-b last:border-b-0">
      <Link href={`/manga/${mangaId}/${chapter.id}`} className="block hover:bg-secondary/50 transition-colors duration-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <BookText className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium text-base" suppressHydrationWarning>Chapter {chapter.chapterNumber}: {chapter.title}</h3>
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>{chapter.pages.length} pages</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary">
            <div><ChevronRight className="h-5 w-5" /></div>
          </Button>
        </div>
      </Link>
    </li>
  );
});
ChapterListItem.displayName = 'ChapterListItem';
    
