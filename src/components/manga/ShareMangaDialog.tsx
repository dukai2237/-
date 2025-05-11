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
import { ClipboardCopy, Share2, MessageSquare } from 'lucide-react';

// Custom SVG for X (formerly Twitter)
const XIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Custom SVG for Instagram
const InstagramIcon = () => (
 <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.27.058 2.166.258 2.913.555.78.32 1.394.73 2.013 1.352.618.62.99 1.272 1.272 2.052.316.808.497 1.736.548 2.97.057 1.208.068 1.51.068 4.678s-.01 3.47-.068 4.678c-.05 1.234-.232 2.162-.548 2.97-.282.82-.653 1.47-1.272 2.052-.618.62-1.233 1.032-2.013 1.352-.747.3-1.643.497-2.913.555-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-1.27-.058-2.166-.258-2.913-.555-.78-.32-1.394-.73-2.013-1.352-.618-.62-.99-1.272-1.272-2.052-.316-.808-.497-1.736-.548-2.97-.057-1.208-.068-1.51-.068-4.678s.01-3.47.068-4.678c.05-1.234.232-2.162.548-2.97.282-.82.653-1.47 1.272-2.052.618-.62 1.233-1.032 2.013-1.352.747-.3 1.643-.497 2.913-.555A15.927 15.927 0 0112 2.163zm0 1.887c-3.163 0-3.502.012-4.73.068-1.17.053-1.88.24-2.412.452-.592.245-1.018.56-1.458 1.002-.44.44-.757.867-1.002 1.458-.21.533-.398 1.242-.452 2.412-.056 1.228-.068 1.567-.068 4.612s.012 3.384.068 4.612c.053 1.17.24 1.88.452 2.412.245.592.56 1.018 1.002 1.458.44.44.867.757 1.458 1.002.533.21 1.242.398 2.412.452 1.228.056 1.567.068 4.73.068 3.163 0 3.502-.012 4.73-.068 1.17-.053 1.88-.24 2.412-.452.592-.245 1.018-.56 1.458-1.002.44-.44.867-.757 1.002-1.458.21-.533.398-1.242-.452-2.412.056-1.228.068-1.567.068-4.612s-.012-3.384-.068-4.612c-.053-1.17-.24-1.88-.452-2.412-.245-.592-.56-1.018-1.002-1.458-.44-.44-.867-.757-1.458-1.002-.533-.21-1.242-.398-2.412-.452C15.502 4.06 15.163 4.05 12 4.05zm0 4.327A5.625 5.625 0 1012 15.32a5.625 5.625 0 000-11.267zm0 9.375A3.75 3.75 0 1112 10a3.75 3.75 0 010 7.5zm5.603-7.88A1.313 1.313 0 1016.29 4.3a1.313 1.313 0 001.313 1.313z"/>
  </svg>
);

// Custom SVG for Threads
const ThreadsIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14.56 19.68h-5.12c-.901 0-1.738-.374-2.34-.988-.604-.613-.94-1.46-.94-2.368V7.667H7.68v8.657c0 .574.228 1.122.63 1.53.402.41.94.645 1.51.645h5.12c.57 0 1.108-.235 1.51-.645.402-.408.63-.956.63-1.53V7.667h1.52v8.657c0 .908-.336 1.755-.94 2.368-.602.614-1.439.988-2.34.988zM8.44 3.6h7.12c.901 0 1.738.374 2.34.988.604.613.94 1.46.94 2.368v.912H4.16v-.912c0-.908.336-1.755.94-2.368.602-.614 1.439-.988 2.34-.988h1z"/>
  </svg>
);

// Custom SVG for Facebook
const FacebookIcon = () => (
  <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.04c-5.52 0-10 4.48-10 10s4.48 10 10 10s10-4.48 10-10S17.52 2.04 12 2.04zm2.75 10.6h-1.87V19h-2.75v-6.36H8.5v-2.32h1.63V8.57c0-1.37.67-2.57 2.57-2.57h1.87v2.32h-1.12c-.5 0-.62.25-.62.62v1.1h1.87l-.25 2.32z"/>
  </svg>
);


interface ShareMangaDialogProps {
  mangaTitle: string;
  mangaUrl: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareMangaDialog({ mangaTitle, mangaUrl, isOpen, onOpenChange }: ShareMangaDialogProps) {
  const { toast } = useToast();

  const handleCopyLink = async (socialMediaName?: string) => {
    try {
      await navigator.clipboard.writeText(mangaUrl);
      toast({
        title: "Link Copied!",
        description: socialMediaName ? `Link for ${socialMediaName} copied to clipboard.` : "Manga link copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to Copy",
        description: "Could not copy link. Please try manually.",
        variant: "destructive",
      });
    }
    onOpenChange(false); 
  };

  const encodedUrl = encodeURIComponent(mangaUrl);
  const encodedTitle = encodeURIComponent(mangaTitle);

  const shareOptions = [
    {
      name: "X (Twitter)",
      icon: <XIcon />,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      isDirectLink: true,
    },
    {
      name: "Facebook",
      icon: <FacebookIcon />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      isDirectLink: true,
    },
    {
      name: "WhatsApp",
      icon: <MessageSquare className="h-5 w-5 text-[#25D366]" />,
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      isDirectLink: true,
    },
    {
      name: "Instagram",
      icon: <InstagramIcon />,
      onClick: () => handleCopyLink("Instagram"),
      isDirectLink: false,
    },
    {
      name: "Threads",
      icon: <ThreadsIcon />,
      onClick: () => handleCopyLink("Threads"),
      isDirectLink: false,
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
            <Button type="button" size="sm" className="px-3" onClick={() => handleCopyLink()}>
              <span className="sr-only">Copy</span>
              <ClipboardCopy className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                variant="outline"
                asChild={option.isDirectLink}
                className="justify-start px-3 py-2 h-auto text-left"
                onClick={option.isDirectLink ? () => onOpenChange(false) : option.onClick}
              >
                {option.isDirectLink ? (
                  <a href={option.url} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                    {option.icon}
                    <span className="ml-2 text-sm truncate">{option.name}</span>
                  </a>
                ) : (
                  <div className="flex items-center w-full cursor-pointer">
                    {option.icon}
                    <span className="ml-2 text-sm truncate">{option.name} (Copy Link)</span>
                  </div>
                )}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
