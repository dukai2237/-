
"use client";

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMangaById } from '@/lib/mock-data'; // To check manga author

interface CommentFormProps {
  mangaId: string;
  onCommentAdded: () => void; 
  parentId?: string; // Optional: ID of the comment being replied to
  onCancelReply?: () => void; // Optional: Callback to cancel replying
}

export function CommentForm({ mangaId, onCommentAdded, parentId, onCancelReply }: CommentFormProps) {
  const { user, addCommentToManga } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to post a comment.", variant: "destructive" });
      return;
    }
    
    const currentManga = getMangaById(mangaId);
    if (user.accountType === 'creator' && currentManga && currentManga.author.id !== user.id && !parentId) { // Creators cannot make top-level comments on others' manga
        toast({ title: "Action Not Allowed", description: "Creators cannot comment on other creators' works.", variant: "destructive" });
        return;
    }
     if (user.accountType === 'creator' && currentManga && currentManga.author.id !== user.id && parentId) { // Also prevent creators from replying on other's manga
        toast({ title: "Action Not Allowed", description: "Creators cannot reply to comments on other creators' works.", variant: "destructive" });
        return;
    }


    if (!commentText.trim()) {
      toast({ title: "Empty Comment", description: "Comment cannot be empty.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const newComment = await addCommentToManga(mangaId, commentText.trim(), parentId);
    setIsSubmitting(false);

    if (newComment) {
      setCommentText('');
      onCommentAdded(); 
    }
  };

  if (!user) {
    return (
      <div className="p-4 border-t text-center text-muted-foreground">
        <p>Please <a href="/login" className="text-primary hover:underline">log in</a> to post a comment.</p>
      </div>
    );
  }
  
  const currentManga = getMangaById(mangaId);
  // For top-level comments, creators can only comment on their own manga
  if (!parentId && user.accountType === 'creator' && currentManga && currentManga.author.id !== user.id) {
    return (
      <div className="p-4 border-t text-center text-muted-foreground">
        <p>Creators can only comment on their own manga series.</p>
      </div>
    );
  }
  // For replies, creators can only reply if it's their manga. Users can reply to any.
  if (parentId && user.accountType === 'creator' && currentManga && currentManga.author.id !== user.id) {
     return (
      <div className="p-4 border-t text-center text-muted-foreground">
        <p>Creators can only reply to comments on their own manga series.</p>
      </div>
    );
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        {!parentId && <Label htmlFor={`commentText-${parentId || 'new'}`} className="text-lg font-semibold mb-2 block">Leave a Comment</Label>}
        <Textarea
          id={`commentText-${parentId || 'new'}`}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={parentId ? "Write your reply..." : "Write your comment here..."}
          rows={parentId ? 2 : 4}
          disabled={isSubmitting}
          className="text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting || !commentText.trim()} size={parentId ? "sm" : "default"}>
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? (parentId ? 'Replying...' : 'Posting...') : (parentId ? 'Post Reply' : 'Post Comment')}
        </Button>
        {parentId && onCancelReply && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancelReply} disabled={isSubmitting}>
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
