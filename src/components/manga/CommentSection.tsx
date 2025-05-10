
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Comment } from '@/lib/types';
import { getMangaById } from '@/lib/mock-data'; // Assuming comments are part of MangaSeries from mock-data
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { MessageCircle } from 'lucide-react';

interface CommentSectionProps {
  mangaId: string;
}

export function CommentSection({ mangaId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(() => {
    setIsLoading(true);
    const manga = getMangaById(mangaId);
    setComments(manga?.comments || []);
    setIsLoading(false);
  }, [mangaId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCommentAdded = () => {
    fetchComments(); // Re-fetch comments after a new one is added
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold flex items-center">
        <MessageCircle className="mr-3 h-6 w-6 text-primary" /> Comments ({comments.length})
      </h2>
      
      <CommentForm mangaId={mangaId} onCommentAdded={handleCommentAdded} />

      {isLoading ? (
        <p className="text-muted-foreground">Loading comments...</p>
      ) : comments.length > 0 ? (
        <div className="space-y-0 divide-y">
          {comments.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((comment) => ( // Sort by newest first
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
}