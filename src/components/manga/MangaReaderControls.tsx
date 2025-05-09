"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

interface MangaReaderControlsProps {
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onZoomIn?: () => void; // Optional for now
  onZoomOut?: () => void; // Optional for now
  mangaId: string;
  currentChapterId: string; // To construct back link
}

export function MangaReaderControls({
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  onZoomIn,
  onZoomOut,
  mangaId,
}: MangaReaderControlsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-3 shadow-lg z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Button variant="outline" size="icon" asChild>
            <Link href={`/manga/${mangaId}`} title="Back to Chapters">
              <ArrowLeft />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href="/" title="Home">
              <Home />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevPage}
            disabled={currentPage === 1}
            aria-label="Previous Page"
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm font-medium tabular-nums w-20 text-center">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextPage}
            disabled={currentPage === totalPages}
            aria-label="Next Page"
          >
            <ChevronRight />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {onZoomOut && (
            <Button variant="outline" size="icon" onClick={onZoomOut} aria-label="Zoom Out">
              <ZoomOut />
            </Button>
          )}
          {onZoomIn && (
            <Button variant="outline" size="icon" onClick={onZoomIn} aria-label="Zoom In">
              <ZoomIn />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
