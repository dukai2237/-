
"use client";

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMangaById } from '@/lib/mock-data'; // To check manga author

interface CommentFormProps {
  mangaId: string;
  onCommentAdded: () => void; 
}

export function CommentForm({ mangaId, onCommentAdded }: CommentFormProps) {
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
    // Additional check for creator restriction, though AuthContext should be primary guard
    const currentManga = getMangaById(mangaId);
    if (user.accountType === 'creator' && currentManga && currentManga.author.id !== user.id) {
        toast({ title: "Action Not Allowed", description: "Creators cannot comment on other creators' works.", variant: "destructive" });
        return;
    }

    if (!commentText.trim()) {
      toast({ title: "Empty Comment", description: "Comment cannot be empty.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const newComment = await addCommentToManga(mangaId, commentText.trim());
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
  
  // UI check for creator restriction
  const currentManga = getMangaById(mangaId);
  if (user.accountType === 'creator' && currentManga && currentManga.author.id !== user.id) {
    return (
      <div className="p-4 border-t text-center text-muted-foreground">
        <p>Creators cannot comment on other creators' works.</p>
      </div>
    );
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border-t">
      <div>
        <Label htmlFor="commentText" className="text-lg font-semibold mb-2 block">Leave a Comment</Label>
        <Textarea
          id="commentText"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write your comment here..."
          rows={4}
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" disabled={isSubmitting || !commentText.trim()} className="w-full sm:w-auto">
        <Send className="mr-2 h-4 w-4" />
        {isSubmitting ? 'Posting...' : 'Post Comment'}
      </Button>
    </form>
  );
}
