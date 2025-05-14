
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { MangaPage, MangaSeries } from '@/lib/types';
import { MangaReaderControls } from './MangaReaderControls';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { XCircle, Lock, ShoppingCart, BookOpen } from "lucide-react";
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
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, purchaseAccess, hasPurchasedChapter, isSubscribedToManga, updateViewingHistory, getViewingHistory } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [manga, setManga] = useState<MangaSeries>(initialManga);
  useEffect(() => {
    setManga(initialManga);
  }, [initialManga]);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const MIN_SWIPE_DISTANCE = 50;

  const totalPages = pages.length;

  // Effect 1: Determine and set the initial page index when critical props change.
  useEffect(() => {
    if (pages.length === 0) {
      setCurrentPageIndex(0);
      setIsImageLoading(false);
      setError(null);
      return;
    }

    let initialTargetPageIndex = 0;
    const history = getViewingHistory(mangaId);

    if (history && history.chapterId === chapterId && history.pageIndex >= 0 && history.pageIndex < pages.length) {
      initialTargetPageIndex = history.pageIndex;
    } else {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash.startsWith("#page=")) {
          const pageNumFromHash = parseInt(hash.substring(6), 10);
          if (!isNaN(pageNumFromHash) && pageNumFromHash > 0 && pageNumFromHash <= pages.length) {
            initialTargetPageIndex = pageNumFromHash - 1;
          }
        }
      }
    }
    
    // Set current page only if it's different, to avoid unnecessary re-renders from this effect
    if (currentPageIndex !== initialTargetPageIndex) {
      setCurrentPageIndex(initialTargetPageIndex);
    }
    
    setIsImageLoading(true); 
    setError(null);

  // getViewingHistory is potentially unstable if it returns new function reference.
  // pages.length is more stable than `pages` object itself.
  }, [mangaId, chapterId, pages.length, getViewingHistory]); // Removed currentPageIndex from deps


  const handleNextPage = useCallback(() => {
    setCurrentPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);

  const handlePrevPage = useCallback(() => {
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Effect for keyboard navigation
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

  // Effect for updating viewing history
  useEffect(() => {
    if (user && mangaId && chapterId && user.accountType === 'user' && totalPages > 0 && currentPageIndex >= 0 && currentPageIndex < totalPages) {
      updateViewingHistory(mangaId, chapterId, currentPageIndex);
    }
  }, [currentPageIndex, mangaId, chapterId, user, updateViewingHistory, totalPages]);

  // Effect for updating URL hash
  useEffect(() => {
    if (totalPages > 0 && typeof window !== 'undefined' && currentPageIndex >= 0 && currentPageIndex < totalPages) {
      const newUrl = `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}#page=${currentPageIndex + 1}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [currentPageIndex, totalPages, pathname, searchParams]);

  // Effect for handling image loading state changes based on currentPageIndex or totalPages
  useEffect(() => {
    if (totalPages === 0) {
      setIsImageLoading(false);
      setError(null);
      return;
    }
    if (currentPageIndex < 0 || currentPageIndex >= totalPages) {
      setError("Invalid page index.");
      setIsImageLoading(false);
      return;
    }
    setIsImageLoading(true); // Assume new page needs loading
    setError(null); 
  }, [currentPageIndex, totalPages]);


  const currentPageData = (totalPages > 0 && currentPageIndex >= 0 && currentPageIndex < totalPages) ? pages[currentPageIndex] : null;

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

  const freePreviewTotalPageCount = manga.freePreviewPageCount || 0;
  const freePreviewChapterCount = manga.freePreviewChapterCount || 0;

  const isChapterWithinFreeChapterLimit = initialChapterNumber <= freePreviewChapterCount;

  const isPageWithinThisChaptersFreePreview = currentPageIndex < freePreviewTotalPageCount;

  const isContentFree = isChapterWithinFreeChapterLimit || isPageWithinThisChaptersFreePreview;


  let needsAccess = false;
  let accessButtonText = "";
  let accessIcon = <ShoppingCart className="mr-2 h-5 w-5" />;
  let accessAction = async () => { };

  if (!isContentFree && user?.accountType !== 'creator') {
    if (manga.subscriptionModel === 'monthly' && manga.subscriptionPrice && !isSubscribedToManga(mangaId)) {
      needsAccess = true;
      accessButtonText = `Subscribe Monthly for $${manga.subscriptionPrice.toFixed(2)}`;
      accessAction = async () => {
        if (!user) {
          toast({ title: "Login Required", description: "Please log in to subscribe.", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=' + pathname + `#page=${currentPageIndex + 1}`)}>Login</Button> });
          return;
        }
        await purchaseAccess(manga.id, 'monthly', manga.id, manga.subscriptionPrice!);
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
        await purchaseAccess(manga.id, 'chapter', chapterId, manga.chapterSubscriptionPrice!);
      };
    }
  }


  if (!totalPages && !isImageLoading) { 
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

  if (error && !isImageLoading) {
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
        className="w-full max-w-3xl aspect-[800/1200] relative my-4 bg-muted rounded-md overflow-hidden shadow-lg touch-manipulation select-none prevent-selection"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onContextMenu={(e) => e.preventDefault()} 
        style={{ touchAction: 'pan-y' }} 
      >
        {isImageLoading && currentPageData && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        {currentPageData && (
          <>
            <Image
              key={currentPageData.id + '-' + currentPageIndex} 
              src={currentPageData.imageUrl}
              alt={currentPageData.altText}
              layout="fill"
              objectFit="contain"
              priority={currentPageIndex < 2}
              onLoad={() => {
                setIsImageLoading(false);
                setError(null);
              }}
              onError={() => {
                setError(`Failed to load image for page ${currentPageIndex + 1}.`);
                setIsImageLoading(false);
              }}
              className={`transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              data-ai-hint="manga page comic"
            />
          </>
        )}
        {!currentPageData && !isImageLoading && totalPages > 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <p>Page {currentPageIndex + 1} not available or error loading.</p>
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

