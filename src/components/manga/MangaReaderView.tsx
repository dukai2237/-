
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { MangaPage, MangaSeries } from '@/lib/types'; // Added MangaSeries
import { MangaReaderControls } from './MangaReaderControls';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { XCircle, Lock, ShoppingCart } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { getMangaById } from '@/lib/mock-data'; // To fetch manga details for freePreviewPageCount
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


interface MangaReaderViewProps {
  pages: MangaPage[];
  mangaId: string;
  chapterId: string;
}

export function MangaReaderView({ pages, mangaId, chapterId }: MangaReaderViewProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isSubscribed, subscribe: attemptSubscription, updateViewingHistory, getViewingHistory } = useAuth();
  const manga = getMangaById(mangaId); // Fetch manga details
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const history = getViewingHistory(mangaId);
    if (history && history.chapterId === chapterId && history.pageIndex < pages.length) {
      setCurrentPageIndex(history.pageIndex);
    }
  }, [mangaId, chapterId, getViewingHistory, pages.length]);


  useEffect(() => {
    if (user && mangaId && chapterId) { // only update if user is logged in
      updateViewingHistory(mangaId, chapterId, currentPageIndex);
    }
  }, [currentPageIndex, mangaId, chapterId, user, updateViewingHistory]);


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
    if (!currentPageData) {
        setError("Page data not found.");
    }
    // Jump to page from URL hash if present
    const hash = window.location.hash;
    if (hash.startsWith("#page=")) {
      const pageNum = parseInt(hash.substring(6), 10);
      if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
        setCurrentPageIndex(pageNum - 1);
      }
    }

  }, [currentPageIndex, currentPageData, totalPages]);

  // Update URL hash
  useEffect(() => {
    if (totalPages > 0) {
       router.replace(`#page=${currentPageIndex + 1}`, { scroll: false });
    }
  }, [currentPageIndex, router, totalPages]);


  if (!manga) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <XCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Manga Details Not Found</h2>
        <p className="text-muted-foreground">Could not load details for this manga series.</p>
      </div>
    );
  }

  const freePreviewPageCount = manga.freePreviewPageCount || 0;
  const needsSubscription = currentPageIndex >= freePreviewPageCount && !isSubscribed(mangaId);

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

  if (needsSubscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center p-6 bg-card shadow-lg rounded-lg max-w-md mx-auto my-8">
        <Lock className="w-20 h-20 text-primary mb-6" />
        <h2 className="text-3xl font-bold mb-3">Content Locked</h2>
        <p className="text-lg text-muted-foreground mb-2">
          You've reached the end of the free preview for <span className="font-semibold">{manga.title}</span>.
        </p>
        <p className="text-md text-muted-foreground mb-8">
          Subscribe to continue reading this chapter and get access to all chapters.
        </p>
        <Button 
            size="lg" 
            className="text-lg py-6 px-8"
            onClick={() => {
                if (!user) {
                    toast({
                        title: "Login Required",
                        description: "Please log in to subscribe.",
                        variant: "destructive",
                        action: <Button onClick={() => router.push('/login')}>Login</Button>
                    });
                    return;
                }
                if (typeof attemptSubscription === 'function') {
                    attemptSubscription(mangaId, manga.title);
                }
            }}
        >
          <ShoppingCart className="mr-2 h-5 w-5" /> Subscribe for ${manga.subscriptionPrice || 'N/A'}/month
        </Button>
        <Link href={`/manga/${mangaId}`} className="mt-4">
          <Button variant="outline">Back to Manga Details</Button>
        </Link>
      </div>
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
                priority={currentPageIndex < 2} 
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
