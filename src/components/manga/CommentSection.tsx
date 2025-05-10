
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Comment, MangaSeries } from '@/lib/types';
import { getMangaById } from '@/lib/mock-data'; 
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { MessageCircle } from 'lucide-react';

interface CommentSectionProps {
  mangaId: string;
}

export function CommentSection({ mangaId }: CommentSectionProps) {
  const [manga, setManga] = useState<MangaSeries | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMangaAndComments = useCallback(() => {
    setIsLoading(true);
    const currentManga = getMangaById(mangaId);
    setManga(currentManga);
    setComments(currentManga?.comments || []);
    setIsLoading(false);
  }, [mangaId]);

  useEffect(() => {
    fetchMangaAndComments();
  }, [fetchMangaAndComments]);

  const handleCommentInteraction = () => {
    fetchMangaAndComments(); // Re-fetch comments after a new one or a reply is added
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading comments...</p>;
  }

  if (!manga) {
    return <p className="text-muted-foreground">Could not load manga details for comments.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold flex items-center">
        <MessageCircle className="mr-3 h-6 w-6 text-primary" /> Comments ({comments.length})
      </h2>
      
      <CommentForm mangaId={mangaId} onCommentAdded={handleCommentInteraction} />

      {comments.length > 0 ? (
        <div className="space-y-0 divide-y">
          {comments
            .filter(comment => !comment.parentId) // Filter only top-level comments
            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Sort by newest first
            .map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                mangaAuthorId={manga.author.id}
                onCommentInteraction={handleCommentInteraction}
              />
            ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
}
