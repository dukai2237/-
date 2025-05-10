
"use client";

import type { Comment } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNowStrict } from 'date-fns';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquareReply, X } from 'lucide-react';
import { CommentForm } from './CommentForm';
import { useAuth } from '@/contexts/AuthContext';
import { getMangaById } from '@/lib/mock-data';

interface CommentItemProps {
  comment: Comment;
  mangaAuthorId: string; // To check if the current user is the author of the manga
  onCommentInteraction: () => void; // To trigger refresh in CommentSection
}

export const CommentItem = React.memo(function CommentItem({ comment, mangaAuthorId, onCommentInteraction }: CommentItemProps) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const timeAgo = formatDistanceToNowStrict(new Date(comment.timestamp), { addSuffix: true });

  const canReply = user && (user.accountType === 'user' || (user.accountType === 'creator' && mangaAuthorId === user.id));

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    onCommentInteraction(); // Notify parent to refresh comments
  };

  return (
    <div className="flex gap-3 py-4 border-b last:border-b-0">
      <Avatar className="h-10 w-10">
        <AvatarImage src={comment.userAvatarUrl} alt={comment.userName} data-ai-hint="user avatar comment" />
        <AvatarFallback>{comment.userName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm">{comment.userName}</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {comment.text}
        </p>
        
        {canReply && (
          <Button 
            variant="ghost" 
            size="xs" 
            onClick={() => setShowReplyForm(prev => !prev)} 
            className="text-xs text-muted-foreground hover:text-primary mt-1"
          >
            {showReplyForm ? <X className="mr-1 h-3 w-3" /> : <MessageSquareReply className="mr-1 h-3 w-3" />}
            {showReplyForm ? 'Cancel' : 'Reply'}
          </Button>
        )}

        {showReplyForm && (
          <div className="mt-3 ml-0 pl-0 pt-2 border-t border-dashed">
            <CommentForm
              mangaId={comment.mangaId}
              parentId={comment.id}
              onCommentAdded={handleReplySuccess}
              onCancelReply={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-3 pl-4 border-l border-border/50 ml-2">
            {comment.replies.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(reply => ( // Sort replies by oldest first for chronological order
              <CommentItem key={reply.id} comment={reply} mangaAuthorId={mangaAuthorId} onCommentInteraction={onCommentInteraction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
CommentItem.displayName = 'CommentItem';
