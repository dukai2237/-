"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { MangaPage } from '@/lib/types';
import { MangaReaderControls } from './MangaReaderControls';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle } from "lucide-react";

interface MangaReaderViewProps {
  pages: MangaPage[];
  mangaId: string;
  chapterId: string;
}

export function MangaReaderView({ pages, mangaId, chapterId }: MangaReaderViewProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = pages.length;
  const currentPageData = pages[currentPageIndex];

  const handleNextPage = useCallback(() => {
    setCurrentPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);

  const handlePrevPage = useCallback(() => {
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        handleNextPage();
      } else if (event.key === 'ArrowLeft') {
        handlePrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPage, handlePrevPage]);
  
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // Simulate image loading if needed, or rely on Image component's onLoad
    // For now, just ensure currentPageData is valid
    if (!currentPageData) {
        setError("Page data not found.");
    }
  }, [currentPageIndex, currentPageData]);

  if (!totalPages) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <XCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Pages Available</h2>
        <p className="text-muted-foreground">This chapter doesn't seem to have any pages.</p>
      </div>
    );
  }
  
  if (error) {
    return (
         <Alert variant="destructive" className="max-w-lg mx-auto my-8">
          <XCircle className="h-5 w-5" />
          <AlertTitle>Error Loading Page</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="flex flex-col items-center pb-24"> {/* Added pb-24 for controls space */}
      <div className="w-full max-w-3xl aspect-[800/1200] relative my-4 bg-muted rounded-md overflow-hidden shadow-lg">
        {isLoading && (
            <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        {currentPageData && (
            <Image
                key={currentPageData.id}
                src={currentPageData.imageUrl}
                alt={currentPageData.altText}
                layout="fill"
                objectFit="contain"
                priority={currentPageIndex < 2} // Prioritize loading for first few pages
                onLoadingComplete={() => setIsLoading(false)}
                onError={() => {
                  setError(`Failed to load image for page ${currentPageIndex + 1}.`);
                  setIsLoading(false);
                }}
                className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                data-ai-hint="manga page comic"
            />
        )}
      </div>

      <MangaReaderControls
        currentPage={currentPageIndex + 1}
        totalPages={totalPages}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        mangaId={mangaId}
        currentChapterId={chapterId}
      />
    </div>
  );
}
