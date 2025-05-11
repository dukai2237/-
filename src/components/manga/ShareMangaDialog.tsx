"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCopy, Twitter, Facebook, Share2, MessageSquare } from 'lucide-react';

interface ShareMangaDialogProps {
  mangaTitle: string;
  mangaUrl: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareMangaDialog({ mangaTitle, mangaUrl, isOpen, onOpenChange }: ShareMangaDialogProps) {
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(mangaUrl);
      toast({
        title: "Link Copied!",
        description: "Manga link copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to Copy",
        description: "Could not copy link. Please try manually.",
        variant: "destructive",
      });
    }
    onOpenChange(false); // Close dialog after action
  };

  const encodedUrl = encodeURIComponent(mangaUrl);
  const encodedTitle = encodeURIComponent(mangaTitle);

  const shareOptions = [
    {
      name: "Twitter",
      icon: <Twitter className="h-5 w-5 text-[#1DA1F2]" />,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "Facebook",
      icon: <Facebook className="h-5 w-5 text-[#1877F2]" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "WhatsApp",
      icon: <MessageSquare className="h-5 w-5 text-[#25D366]" />, // Using MessageSquare as a generic messaging icon
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="mr-2 h-5 w-5 text-primary" /> Share Manga
          </DialogTitle>
          <DialogDescription>
            Share "{mangaTitle}" with your friends!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="share-link-manga" className="sr-only">
                Link
              </Label>
              <Input
                id="share-link-manga"
                defaultValue={mangaUrl}
                readOnly
                className="h-9 text-sm"
              />
            </div>
            <Button type="button" size="sm" className="px-3" onClick={handleCopyLink}>
              <span className="sr-only">Copy</span>
              <ClipboardCopy className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                variant="outline"
                asChild
                className="justify-start px-3 py-2 h-auto text-left"
                onClick={() => onOpenChange(false)} // Close dialog after action
              >
                <a href={option.url} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                  {option.icon}
                  <span className="ml-2 text-sm truncate">{option.name}</span>
                </a>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}