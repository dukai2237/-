
"use client";

import type { Comment } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNowStrict } from 'date-fns';
import React from 'react';

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem = React.memo(function CommentItem({ comment }: CommentItemProps) {
  const timeAgo = formatDistanceToNowStrict(new Date(comment.timestamp), { addSuffix: true });

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
        {/* Placeholder for replies if needed in future */}
        {/* {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-4 border-l">
            {comment.replies.map(reply => <CommentItem key={reply.id} comment={reply} />)}
          </div>
        )} */}
      </div>
    </div>
  );
});
CommentItem.displayName = 'CommentItem';
