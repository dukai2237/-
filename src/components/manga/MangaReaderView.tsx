
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { MangaPage, MangaSeries, Chapter } from '@/lib/types'; // Added Chapter
import { MangaReaderControls } from './MangaReaderControls';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { XCircle, Lock, ShoppingCart, BookOpen } from "lucide-react"; // Added BookOpen
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


interface MangaReaderViewProps {
  pages: MangaPage[];
  mangaId: string;
  chapterId: string;
  initialManga: MangaSeries; 
  initialChapterNumber: number;
}

export function MangaReaderView({ pages, mangaId, chapterId, initialManga, initialChapterNumber }: MangaReaderViewProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, purchaseAccess, hasPurchasedChapter, isSubscribedToManga, updateViewingHistory, getViewingHistory } = useAuth(); 
  
  const [manga, setManga] = useState<MangaSeries>(initialManga); 
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const MIN_SWIPE_DISTANCE = 50;

  useEffect(() => {
    setManga(initialManga);
  }, [initialManga]);

  useEffect(() => {
    const history = getViewingHistory(mangaId);
    let initialPageIdx = 0;
    if (history && history.chapterId === chapterId && history.pageIndex < pages.length) {
      initialPageIdx = history.pageIndex;
    } else {
      const hash = window.location.hash;
      if (hash.startsWith("#page=")) {
        const pageNum = parseInt(hash.substring(6), 10);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= pages.length) {
          initialPageIdx = pageNum - 1;
        }
      }
    }
    setCurrentPageIndex(initialPageIdx);
    setIsLoading(pages.length > 0);
  }, [mangaId, chapterId, getViewingHistory, pages.length]);


  useEffect(() => {
    if (user && mangaId && chapterId && user.accountType === 'user') { 
      updateViewingHistory(mangaId, chapterId, currentPageIndex);
    }
  }, [currentPageIndex, mangaId, chapterId, user, updateViewingHistory]);


  const totalPages = pages.length;
  const currentPageData = pages[currentPageIndex];

  const handleNextPage = useCallback(() => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  }, [currentPageIndex, totalPages]);

  const handlePrevPage = useCallback(() => {
     if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  }, [currentPageIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return; 
      }
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
    
    if (!currentPageData || totalPages === 0) {
        setIsLoading(false);
    }

  }, [currentPageIndex, currentPageData, totalPages]);

  useEffect(() => {
    if (totalPages > 0) {
      const newUrl = `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}#page=${currentPageIndex + 1}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [currentPageIndex, router, totalPages, pathname, searchParams]);

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
  
    if (isLeftSwipe && currentPageIndex < totalPages -1) {
      handleNextPage();
    } else if (isRightSwipe && currentPageIndex > 0) {
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

  const freePreviewTotalPageCount = manga.freePreviewPageCount || 0;
  const freePreviewChapterCount = manga.freePreviewChapterCount || 0;

  const isChapterWithinFreeChapterLimit = initialChapterNumber <= freePreviewChapterCount;
  
  // If chapter is free, all its pages are free.
  // Otherwise, check if current page is within general free page limit for *this specific chapter*.
  const isPageWithinThisChaptersFreePreview = currentPageIndex < freePreviewTotalPageCount;
  
  const isContentFree = isChapterWithinFreeChapterLimit || isPageWithinThisChaptersFreePreview;


  let needsAccess = false;
  let accessButtonText = "";
  let accessIcon = <ShoppingCart className="mr-2 h-5 w-5" />;
  let accessAction = async () => {};

  if (!isContentFree && user?.accountType !== 'creator') { // Creators have full access to all content
    if (manga.subscriptionModel === 'monthly' && manga.subscriptionPrice && !isSubscribedToManga(mangaId)) {
        needsAccess = true;
        accessButtonText = `Subscribe Monthly for $${manga.subscriptionPrice.toFixed(2)}`;
        accessAction = async () => {
            if (!user) {
                 toast({ title: "Login Required", description: "Please log in to subscribe.", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=' + pathname + `#page=${currentPageIndex + 1}`)}>Login</Button> });
                 return;
            }
            await purchaseAccess(mangaId, 'monthly', mangaId, manga.subscriptionPrice!);
        };
    } else if (manga.subscriptionModel === 'per_chapter' && manga.chapterSubscriptionPrice && !hasPurchasedChapter(mangaId, chapterId)) {
        needsAccess = true;
        accessButtonText = `Buy Chapter for $${manga.chapterSubscriptionPrice.toFixed(2)}`;
        accessIcon = <BookOpen className="mr-2 h-5 w-5" />;
        accessAction = async () => {
            if (!user) {
                 toast({ title: "Login Required", description: "Please log in to purchase this chapter.", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=' + pathname + `#page=${currentPageIndex + 1}`)}>Login</Button> });
                 return;
            }
            await purchaseAccess(mangaId, 'chapter', chapterId, manga.chapterSubscriptionPrice!);
        };
    }
  }


  if (!totalPages) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <XCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Pages Available</h2>
        <p className="text-muted-foreground">This chapter doesn't seem to have any pages.</p>
         <Link href={`/manga/${mangaId}`} className="mt-4">
          <Button variant="outline">Back to Manga Details</Button>
        </Link>
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

  if (needsAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center p-6 bg-card shadow-lg rounded-lg max-w-md mx-auto my-8">
        <Lock className="w-20 h-20 text-primary mb-6" />
        <h2 className="text-3xl font-bold mb-3">Content Locked</h2>
        <p className="text-lg text-muted-foreground mb-2">
          You've reached the end of the free preview for <span className="font-semibold">{manga.title}</span>.
        </p>
        <p className="text-md text-muted-foreground mb-8">
          {manga.subscriptionModel === 'monthly' ? "Subscribe monthly to continue reading this chapter and get access to all chapters." : "Purchase this chapter to continue reading."}
        </p>
        <Button 
            size="lg" 
            className="text-lg py-6 px-8"
            onClick={accessAction}
        >
          {accessIcon} {accessButtonText}
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
        className="w-full max-w-3xl aspect-[800/1200] relative my-4 bg-muted rounded-md overflow-hidden shadow-lg touch-manipulation select-none prevent-selection prevent-right-click"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'pan-y' }} 
      >
        {isLoading && currentPageData && ( 
            <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        {currentPageData && (
          <>
            <Image
                key={currentPageData.id + currentPageIndex} 
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
                className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} `}
                data-ai-hint="manga page comic"
            />
            <div className="absolute inset-0 w-full h-full z-10"></div>
          </>
        )}
        {!currentPageData && !isLoading && ( 
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

