"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { MangaPage, MangaSeries } from '@/lib/types';
import { MangaReaderControls } from './MangaReaderControls';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { XCircle, Lock, ShoppingCart } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
// import { getMangaById as fetchMangaById } from '@/lib/mock-data'; // Not needed directly if initialManga is robust
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


interface MangaReaderViewProps {
  pages: MangaPage[];
  mangaId: string;
  chapterId: string;
  initialManga: MangaSeries; 
}

export function MangaReaderView({ pages, mangaId, chapterId, initialManga }: MangaReaderViewProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isSubscribedToManga, subscribeToManga, updateViewingHistory, getViewingHistory } = useAuth(); 
  
  const [manga, setManga] = useState<MangaSeries>(initialManga); 
  const router = useRouter();
  const { toast } = useToast();

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const MIN_SWIPE_DISTANCE = 50;

  useEffect(() => {
    setManga(initialManga);
  }, [initialManga]);

  useEffect(() => {
    const history = getViewingHistory(mangaId);
    if (history && history.chapterId === chapterId && history.pageIndex < pages.length) {
      setCurrentPageIndex(history.pageIndex);
    }
  }, [mangaId, chapterId, getViewingHistory, pages.length]);


  useEffect(() => {
    if (user && mangaId && chapterId) { 
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
    const hash = window.location.hash;
    if (hash.startsWith("#page=")) {
      const pageNum = parseInt(hash.substring(6), 10);
      if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
        setCurrentPageIndex(pageNum - 1);
      }
    }
    // Ensure isLoading is set to false if there's no page data to load an image for.
    if (!currentPageData || totalPages === 0) {
        setIsLoading(false);
    }

  }, [currentPageIndex, currentPageData, totalPages]);

  useEffect(() => {
    if (totalPages > 0) {
       router.replace(`#page=${currentPageIndex + 1}`, { scroll: false });
    }
  }, [currentPageIndex, router, totalPages]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null); 
    setTouchStartX(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;
  
    if (isLeftSwipe) {
      handleNextPage();
    } else if (isRightSwipe) {
      handlePrevPage();
    }
  
    setTouchStartX(null);
    setTouchEndX(null);
  };


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
  const userIsSubscribed = isSubscribedToManga(mangaId); 
  const needsSubscription = currentPageIndex >= freePreviewPageCount && !userIsSubscribed;

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
            onClick={async () => {
                if (!user) {
                    toast({
                        title: "Login Required",
                        description: "Please log in to subscribe.",
                        variant: "destructive",
                        action: <Button onClick={() => router.push('/login')}>Login</Button>
                    });
                    return;
                }
                if (manga.subscriptionPrice) {
                    await subscribeToManga(mangaId, manga.title, manga.subscriptionPrice);
                } else {
                    toast({ title: "Subscription Not Available", description: "This manga does not have a subscription price set.", variant: "destructive"});
                }
            }}
        >
          <ShoppingCart className="mr-2 h-5 w-5" /> Subscribe for ${manga.subscriptionPrice?.toFixed(2) || 'N/A'}/month
        </Button>
        <Link href={`/manga/${mangaId}`} className="mt-4">
          <Button variant="outline">Back to Manga Details</Button>
        </Link>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center pb-24"> 
      <div 
        className="w-full max-w-3xl aspect-[800/1200] relative my-4 bg-muted rounded-md overflow-hidden shadow-lg touch-manipulation select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'pan-y' }} // Allow vertical scroll if content overflows, but prioritize horizontal for swipe
      >
        {isLoading && currentPageData && ( // Only show skeleton if there's a page to load
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
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setError(`Failed to load image for page ${currentPageIndex + 1}.`);
                  setIsLoading(false);
                }}
                className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                data-ai-hint="manga page comic"
            />
        )}
        {!currentPageData && !isLoading && ( // If no page data and not loading, show a message
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <p>Page not available.</p>
            </div>
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
