
"use client";

import { useState, useEffect, type FormEvent, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { MangaSeries, MangaInvestmentOffer, Chapter, MangaPage, AuthorContactDetails } from '@/lib/types';
import { getMangaById, updateMockMangaData } from '@/lib/mock-data';
import { Edit3, BookUp, PlusCircle, Trash2, AlertTriangle, UploadCloud, Mail, Link as LinkIcon, FileImage, RotateCcw, Images, Edit2, Save, ScrollText } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { MANGA_GENRES_DETAILS, MAX_CHAPTERS_PER_WORK, MAX_PAGES_PER_CHAPTER } from '@/lib/constants';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

interface EditablePageState {
  id: string;
  file?: File;
  previewUrl?: string | null;
  existingImageUrl?: string;
  altText: string;
  _isNew?: boolean;
  _toBeDeleted?: boolean;
  order: number;
}

interface EditableChapterState {
  id: string;
  title: string;
  pages: EditablePageState[];
  _isNew?: boolean;
  _toBeDeleted?: boolean;
}

export default function EditMangaPage() {
  const { user, deleteMangaSeries } = useAuth();
  const router = useRouter();
  const params = useParams();
  const mangaId = params.mangaId as string;
  const { toast } = useToast();

  const [mangaToEdit, setMangaToEdit] = useState<MangaSeries | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletionAllowed, setIsDeletionAllowed] = useState(false);


  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const coverImageFileRef = useRef<File | null>(null);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [editableChapters, setEditableChapters] = useState<EditableChapterState[]>([]);

  const [subscriptionModel, setSubscriptionModel] = useState<MangaSeries['subscriptionModel']>('monthly');
  const [monthlySubscriptionPrice, setMonthlySubscriptionPrice] = useState('');
  const [chapterSubscriptionPrice, setChapterSubscriptionPrice] = useState('');
  
  const [freePreviewPageCount, setFreePreviewPageCount] = useState('0');
  const [freePreviewChapterCount, setFreePreviewChapterCount] = useState('0');
  const [isPublished, setIsPublished] = useState(true);

  const [enableCrowdfunding, setEnableCrowdfunding] = useState(false);
  const [sharesOfferedTotalPercent, setSharesOfferedTotalPercent] = useState('');
  const [totalSharesInOffer, setTotalSharesInOffer] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [crowdfundingDescription, setCrowdfundingDescription] = useState('');
  const [minSubscriptionRequirement, setMinSubscriptionRequirement] = useState('');
  const [maxSharesPerUser, setMaxSharesPerUser] = useState('');
  const [dividendPayoutCycle, setDividendPayoutCycle] = useState<MangaInvestmentOffer['dividendPayoutCycle']>(3);

  const [authorContactEmail, setAuthorContactEmail] = useState('');
  const [authorSocialLinkPlatform, setAuthorSocialLinkPlatform] = useState('');
  const [authorSocialLinkUrl, setAuthorSocialLinkUrl] = useState('');
  const [authorSocialLinks, setAuthorSocialLinks] = useState<{platform: string, url: string}[]>([]);

  const pageUploadInputRefEdit = useRef<HTMLInputElement>(null);
  const singlePageUploadRefsEdit = useRef<Record<string, HTMLInputElement | null>>({});
  const [targetChapterForPageUploadEdit, setTargetChapterForPageUploadEdit] = useState<string | null>(null);

  const investmentOfferFieldsLocked = useMemo(() => {
    return mangaToEdit?.investors && mangaToEdit.investors.length > 0 && mangaToEdit.investmentOffer?.isActive;
  }, [mangaToEdit]);


  const totalPagesInManga = useMemo(() => {
    return editableChapters
      .filter(ch => !ch._toBeDeleted)
      .reduce((sum, ch) => sum + ch.pages.filter(p => !p._toBeDeleted).length, 0);
  }, [editableChapters]);

  const totalActiveChapters = useMemo(() => {
    return editableChapters.filter(ch => !ch._toBeDeleted).length;
  }, [editableChapters]);

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/creator/edit-manga/${mangaId}`);
      return;
    }
    if (user.accountType !== 'creator') {
      toast({ title: "Access Restricted", description: "Only creators can edit manga.", variant: "destructive" });
      router.push('/');
      return;
    }
    if (!user.isApproved) {
      toast({
        title: "Account Pending Approval",
        description: "Your creator account must be approved by an admin to edit manga.",
        variant: "default",
        duration: 7000
      });
      router.push('/creator/dashboard');
      setIsLoading(false);
      return;
    }

    if (mangaId) {
      const fetchedManga = getMangaById(mangaId);
      if (fetchedManga) {
        if (fetchedManga.author.id !== user.id) {
          toast({ title: "Access Restricted", description: "You can only edit your own manga series.", variant: "destructive" });
          router.push('/creator/dashboard');
          return;
        }
        setMangaToEdit(fetchedManga);
        setTitle(fetchedManga.title);
        setSummary(fetchedManga.summary);
        setCoverImagePreview(fetchedManga.coverImage);
        setSelectedGenres(fetchedManga.genres);
        setEditableChapters(fetchedManga.chapters.map((ch, chapterIndex) => ({
          id: ch.id,
          title: ch.title,
          pages: ch.pages.map((p, pageIndex) => ({
            id: p.id,
            existingImageUrl: p.imageUrl,
            previewUrl: p.imageUrl,
            altText: p.altText || `Page ${pageIndex + 1}`,
            order: pageIndex,
          })).sort((a,b) => a.order - b.order),
        })));
        
        setSubscriptionModel(fetchedManga.subscriptionModel || 'monthly');
        setMonthlySubscriptionPrice(fetchedManga.subscriptionPrice?.toString() || '');
        setChapterSubscriptionPrice(fetchedManga.chapterSubscriptionPrice?.toString() || '');
        
        setFreePreviewPageCount(fetchedManga.freePreviewPageCount.toString());
        setFreePreviewChapterCount(fetchedManga.freePreviewChapterCount?.toString() || '0');
        setIsPublished(fetchedManga.isPublished !== undefined ? fetchedManga.isPublished : true); 
        setAuthorContactEmail(fetchedManga.authorDetails?.email || user.email || '');
        setAuthorSocialLinks(fetchedManga.authorDetails?.socialLinks || []);

        if (fetchedManga.investmentOffer) {
          setEnableCrowdfunding(fetchedManga.investmentOffer.isActive);
          setSharesOfferedTotalPercent(fetchedManga.investmentOffer.sharesOfferedTotalPercent.toString());
          setTotalSharesInOffer(fetchedManga.investmentOffer.totalSharesInOffer.toString());
          setPricePerShare(fetchedManga.investmentOffer.pricePerShare.toString());
          setCrowdfundingDescription(fetchedManga.investmentOffer.description);
          setMinSubscriptionRequirement(fetchedManga.investmentOffer.minSubscriptionRequirement?.toString() || '');
          setMaxSharesPerUser(fetchedManga.investmentOffer.maxSharesPerUser?.toString() || '');
          setDividendPayoutCycle(fetchedManga.investmentOffer.dividendPayoutCycle || 3);
        } else {
          setEnableCrowdfunding(false);
        }

        const hasInvestors = fetchedManga.investors && fetchedManga.investors.length > 0;
        // Simplified check for active subscriptions (replace with actual check if available)
        const hasActiveSubscribers = user.subscriptions.some(sub => sub.mangaId === fetchedManga.id && (sub.type === 'monthly' && (!sub.expiresAt || new Date(sub.expiresAt) > new Date())));

        if (hasInvestors || hasActiveSubscribers ) { 
          const lastActivityDate = Math.max(
            new Date(fetchedManga.publishedDate).getTime(),
            fetchedManga.lastInvestmentDate ? new Date(fetchedManga.lastInvestmentDate).getTime() : 0,
            fetchedManga.lastSubscriptionDate ? new Date(fetchedManga.lastSubscriptionDate).getTime() : 0
          );
          setIsDeletionAllowed((Date.now() - lastActivityDate) >= ONE_YEAR_IN_MS);
        } else {
          setIsDeletionAllowed(true);
        }

      } else {
        toast({ title: "Manga Not Found", description: "Could not find the manga to edit.", variant: "destructive" });
        router.push('/creator/dashboard');
        return;
      }
    }
    setIsLoading(false);
  }, [mangaId, user, router, toast]);


  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      coverImageFileRef.current = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSocialLink = () => {
    if (authorSocialLinkPlatform && authorSocialLinkUrl) {
        setAuthorSocialLinks([...authorSocialLinks, { platform: authorSocialLinkPlatform, url: authorSocialLinkUrl }]);
        setAuthorSocialLinkPlatform('');
        setAuthorSocialLinkUrl('');
      } else {
        toast({ title: "Incomplete Information", description: "Please enter platform and URL.", variant: "destructive" });
      }
  };
  const removeSocialLink = (index: number) => {
    setAuthorSocialLinks(authorSocialLinks.filter((_, i) => i !== index));
  };
  const handleGenreChange = (genreId: string) => {
    setSelectedGenres(prev =>
        prev.includes(genreId) ? prev.filter(g => g !== genreId) : [...prev, genreId]
      );
  };


  const addChapter = () => {
    const activeChapters = editableChapters.filter(ch => !ch._toBeDeleted);
    if (activeChapters.length >= MAX_CHAPTERS_PER_WORK) {
      toast({ title: "Chapter Limit Reached", variant: "destructive" });
      return;
    }
    const newChapterId = `new-chapter-${Date.now()}`;
    setEditableChapters([...editableChapters, {
      id: newChapterId,
      title: `New Chapter ${activeChapters.length + 1}`,
      pages: [],
      _isNew: true,
    }]);
  };

  const updateChapterTitle = (chapterId: string, title: string) => {
    setEditableChapters(prev => prev.map(ch =>
      ch.id === chapterId ? { ...ch, title } : ch
    ));
  };

  const markChapterForDeletion = (chapterId: string) => {
    setEditableChapters(prev => prev.map(ch =>
      ch.id === chapterId ? { ...ch, _toBeDeleted: true } : ch
    ).filter(ch => !(ch._isNew && ch._toBeDeleted))
    );
  };

  const unmarkChapterForDeletion = (chapterId: string) => {
     setEditableChapters(prev => prev.map(ch =>
      ch.id === chapterId ? { ...ch, _toBeDeleted: false } : ch
    ));
  };

  const triggerPageUploadEdit = (chapterId: string) => {
    setTargetChapterForPageUploadEdit(chapterId);
    pageUploadInputRefEdit.current?.click();
  };

  const triggerSinglePageImageChangeEdit = (pageId: string) => {
    singlePageUploadRefsEdit.current[pageId]?.click();
  };

  const handleMultiplePageImagesUploadEdit = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!targetChapterForPageUploadEdit) return;
    const files = event.target.files;

    if (files && files.length > 0) {
      const chapterToUpdate = editableChapters.find(ch => ch.id === targetChapterForPageUploadEdit);
      if (!chapterToUpdate) {
        if (event.target) event.target.value = "";
        setTargetChapterForPageUploadEdit(null);
        return;
      }

      const activePagesCount = chapterToUpdate.pages.filter(p => !p._toBeDeleted).length;
      const filesToProcess = Array.from(files);
      const remainingPageSlots = MAX_PAGES_PER_CHAPTER - activePagesCount;

      if (filesToProcess.length > remainingPageSlots) {
         toast({
          title: "Page Limit Exceeded",
          description: `You tried to upload ${filesToProcess.length} images, but this chapter only has ${remainingPageSlots} slots left (max ${MAX_PAGES_PER_CHAPTER} pages). Allowed images added.`,
          variant: "destructive",
          duration: 7000
        });
        filesToProcess.splice(remainingPageSlots);
      }

      if (filesToProcess.length === 0) {
        if (event.target) event.target.value = "";
        setTargetChapterForPageUploadEdit(null);
        return;
      }

      const newPagePromises = filesToProcess.map((file, index) => {
          return new Promise<EditablePageState>((resolve) => {
            const reader = new FileReader();
            const pageLocalId = `new-page-${Date.now()}-${Math.random().toString(16).slice(2)}`;
            reader.onloadend = () => {
              resolve({
                id: pageLocalId,
                file: file,
                previewUrl: reader.result as string,
                altText: `Page ${activePagesCount + index + 1}`,
                order: activePagesCount + index,
                _isNew: true
              });
            };
            reader.readAsDataURL(file);
          });
        });
        const newPages = await Promise.all(newPagePromises);
        setEditableChapters(prev => prev.map(ch =>
          ch.id === targetChapterForPageUploadEdit
            ? { ...ch, pages: [...ch.pages, ...newPages].sort((a,b) => a.order - b.order) }
            : ch
        ));
    }
    if (event.target) {
      event.target.value = "";
    }
    setTargetChapterForPageUploadEdit(null);
  };

  const markPageForDeletion = (chapterId: string, pageId: string) => {
    setEditableChapters(prev => prev.map(ch =>
      ch.id === chapterId
        ? { ...ch, pages: ch.pages.map(p => p.id === pageId ? { ...p, _toBeDeleted: true } : p)
                          .filter(p => !(p._isNew && p._toBeDeleted))
          }
        : ch
    ));
  };

  const unmarkPageForDeletion = (chapterId: string, pageId: string) => {
    setEditableChapters(prev => prev.map(ch =>
      ch.id === chapterId
        ? { ...ch, pages: ch.pages.map(p => p.id === pageId ? { ...p, _toBeDeleted: false } : p) }
        : ch
    ));
  };

  const handleSinglePageImageChangeForEdit = (chapterId: string, pageId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditableChapters(prev => prev.map(ch =>
          ch.id === chapterId
            ? { ...ch, pages: ch.pages.map(p =>
                p.id === pageId
                  ? { ...p, file: file, previewUrl: reader.result as string, existingImageUrl: undefined }
                  : p
              ).sort((a,b)=>a.order - b.order) }
            : ch
        ));
      };
      reader.readAsDataURL(file);
    }
     if (event.target) {
      event.target.value = "";
    }
  };


  if (isLoading) return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /></div>;
  if (!mangaToEdit) return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Manga Not Found</h2>
        <p className="text-muted-foreground">
          Could not load manga data or the specified manga does not exist.
        </p>
        <Button onClick={() => router.push('/creator/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
   );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !summary || (!coverImagePreview && !mangaToEdit.coverImage) || selectedGenres.length === 0) {
      toast({ title: "Missing Required Fields", description: "Title, summary, cover image, and genres are required.", variant: "destructive" });
      return;
    }
    const finalChaptersState = editableChapters.filter(ch => !ch._toBeDeleted);
    if (finalChaptersState.length === 0) {
      toast({ title: "No Chapters", description: "Manga series must have at least one chapter.", variant: "destructive" });
      return;
    }
    if (finalChaptersState.some(ch => ch.pages.filter(p => !p._toBeDeleted).length === 0 || ch.pages.filter(p => !p._toBeDeleted).some(p => !p.previewUrl && !p.existingImageUrl))) {
      toast({ title: "Incomplete Chapters", description: "All chapters must have at least one page, and all active pages must have an image.", variant: "destructive" });
      return;
    }
    if (subscriptionModel === 'monthly' && (isNaN(parseFloat(monthlySubscriptionPrice)) || parseFloat(monthlySubscriptionPrice) <= 0)) {
        toast({ title: "Invalid Monthly Price", description: "Monthly subscription price must be a positive number.", variant: "destructive"});
        return;
    }
    if (subscriptionModel === 'per_chapter' && (isNaN(parseFloat(chapterSubscriptionPrice)) || parseFloat(chapterSubscriptionPrice) <= 0)) {
        toast({ title: "Invalid Per-Chapter Price", description: "Per-chapter subscription price must be a positive number.", variant: "destructive"});
        return;
    }
    const parsedFreePageCount = parseInt(freePreviewPageCount, 10);
    const parsedFreeChapterCount = parseInt(freePreviewChapterCount, 10);

    if (isNaN(parsedFreePageCount) || parsedFreePageCount < 0) {
        toast({ title: "Invalid Free Preview Pages", description: "Free preview pages must be a non-negative number.", variant: "destructive" });
        return;
    }
    if (isNaN(parsedFreeChapterCount) || parsedFreeChapterCount < 0) {
        toast({ title: "Invalid Free Preview Chapters", description: "Free preview chapters must be a non-negative number.",variant: "destructive" });
        return;
    }


    let updatedInvestmentOfferData: MangaInvestmentOffer | undefined = mangaToEdit.investmentOffer;
     if (enableCrowdfunding) {
        if (!sharesOfferedTotalPercent || !totalSharesInOffer || !pricePerShare || !crowdfundingDescription) {
            toast({ title: "Crowdfunding Info Incomplete", description: "Please fill all crowdfunding details or disable the feature.", variant: "destructive" });
            return;
        }
        updatedInvestmentOfferData = {
            ...(mangaToEdit.investmentOffer || {} as MangaInvestmentOffer), // Ensure base object if new
            sharesOfferedTotalPercent: parseFloat(sharesOfferedTotalPercent),
            totalSharesInOffer: parseInt(totalSharesInOffer, 10),
            pricePerShare: parseFloat(pricePerShare),
            description: crowdfundingDescription,
            minSubscriptionRequirement: minSubscriptionRequirement ? parseInt(minSubscriptionRequirement, 10) : undefined,
            maxSharesPerUser: maxSharesPerUser ? parseInt(maxSharesPerUser, 10) : undefined,
            isActive: true,
            dividendPayoutCycle: dividendPayoutCycle,
        };
     } else if (mangaToEdit.investmentOffer) { // if crowdfunding was enabled and is now disabled
        updatedInvestmentOfferData = { ...mangaToEdit.investmentOffer, isActive: false };
     }


    const authorDetailsPayload: AuthorContactDetails = {
        email: authorContactEmail || undefined,
        socialLinks: authorSocialLinks.length > 0 ? authorSocialLinks : undefined,
     };

    const processedChapters: Chapter[] = finalChaptersState.map((editCh, chapterIndex) => {
      const activePages = editCh.pages.filter(p => !p._toBeDeleted).sort((a, b) => a.order - b.order);
      return {
        id: editCh._isNew ? `ch-${Date.now()}-${chapterIndex}` : editCh.id,
        title: editCh.title,
        chapterNumber: chapterIndex + 1,
        pages: activePages.map((editPage, pageIndex) => ({
          id: editPage._isNew || !mangaToEdit.chapters.flatMap(c => c.pages).find(p => p.id === editPage.id)
            ? `${editCh.id.replace('new-chapter-', 'ch-')}-page-${Date.now()}-${pageIndex}`
            : editPage.id,
          imageUrl: editPage.previewUrl || editPage.existingImageUrl || `https://picsum.photos/800/1200?error&text=Page+${pageIndex+1}`, 
          altText: editPage.altText || `Page ${pageIndex + 1}`,
        })),
      };
    });
    
    let calculatedLastChapterUpdateInfo: MangaSeries['lastChapterUpdateInfo'] = mangaToEdit.lastChapterUpdateInfo;
    if (mangaToEdit.chapters && processedChapters) {
        const oldLastChapter = mangaToEdit.chapters[mangaToEdit.chapters.length - 1];
        const newLastChapter = processedChapters[processedChapters.length - 1];

        if (newLastChapter && (!oldLastChapter || oldLastChapter.id !== newLastChapter.id || oldLastChapter.pages.length !== newLastChapter.pages.length)) {
            calculatedLastChapterUpdateInfo = {
                chapterId: newLastChapter.id,
                chapterNumber: newLastChapter.chapterNumber,
                chapterTitle: newLastChapter.title,
                pagesAdded: newLastChapter.pages.length - (oldLastChapter && oldLastChapter.id === newLastChapter.id ? oldLastChapter.pages.length : 0),
                newTotalPagesInChapter: newLastChapter.pages.length,
                date: new Date().toISOString(),
            };
        }
    }


    const updatedMangaData: Partial<MangaSeries> = {
      title,
      summary,
      coverImage: coverImagePreview || mangaToEdit.coverImage,
      genres: selectedGenres,
      chapters: processedChapters,
      subscriptionModel: subscriptionModel,
      subscriptionPrice: subscriptionModel === 'monthly' ? parseFloat(monthlySubscriptionPrice) : undefined,
      chapterSubscriptionPrice: subscriptionModel === 'per_chapter' ? parseFloat(chapterSubscriptionPrice) : undefined,
      freePreviewPageCount: parsedFreePageCount || 0,
      freePreviewChapterCount: parsedFreeChapterCount || 0,
      investmentOffer: updatedInvestmentOfferData,
      authorDetails: authorDetailsPayload,
      lastUpdatedDate: new Date().toISOString(),
      isPublished: isPublished, 
      lastChapterUpdateInfo: calculatedLastChapterUpdateInfo,
    };

    try {
      updateMockMangaData(mangaId, updatedMangaData);
      toast({ title: "Manga Updated!", description: `${title} has been successfully updated.` });
      router.push('/creator/dashboard');
    } catch (error) {
      console.error("Failed to update manga:", error);
      toast({ title: "Update Failed", description: "Error saving manga changes.", variant: "destructive" });
    }
  };

  const handleDeleteManga = async () => {
      if (!mangaToEdit || !isDeletionAllowed) {
        toast({
          title: "Deletion Failed",
          description: !mangaToEdit ? "Manga not found." : "This manga cannot be deleted currently (active investments/subscriptions less than a year old).",
          variant: "destructive"
        });
        return;
      }
      const success = await deleteMangaSeries(mangaToEdit.id);
      if (success) {
        router.push('/creator/dashboard');
      }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Input
        id="page-image-multi-upload-edit"
        type="file"
        multiple
        accept="image/*"
        ref={pageUploadInputRefEdit}
        onChange={handleMultiplePageImagesUploadEdit}
        className="hidden"
      />
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center" suppressHydrationWarning><Edit3 className="mr-3 h-7 w-7 text-primary"/>Edit Manga Series</CardTitle>
            <CardDescription suppressHydrationWarning>
              Modify details for "{mangaToEdit?.title}". Max {MAX_CHAPTERS_PER_WORK} chapters, {MAX_PAGES_PER_CHAPTER} pages/chapter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center space-x-3 justify-between p-3 border rounded-md bg-secondary/20">
                <Label htmlFor="isPublished-edit" className="text-base font-medium cursor-pointer flex items-center" suppressHydrationWarning>
                  <Save className="mr-2 h-5 w-5"/> Manga Status: {isPublished ? "Published (Live)" : "Unpublished (Draft)"}
                </Label>
                <Switch id="isPublished-edit" checked={isPublished} onCheckedChange={setIsPublished} aria-label="Publish Manga"/>
             </div>
             <div className="space-y-2">
              <Label htmlFor="title-edit" suppressHydrationWarning>Title *</Label>
              <Input id="title-edit" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary-edit" suppressHydrationWarning>Summary *</Label>
              <Textarea id="summary-edit" value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImageFile-edit" suppressHydrationWarning>Cover Image * (Local Upload)</Label>
              <Input id="coverImageFile-edit" type="file" accept="image/*" onChange={handleCoverImageChange} className="text-sm"/>
              {coverImagePreview && (
                <div className="mt-2 relative aspect-[2/3] w-full max-w-[200px] rounded-md overflow-hidden border">
                  <Image src={coverImagePreview} alt="Cover preview" layout="fill" objectFit="cover" data-ai-hint="manga cover preview edit"/>
                </div>
              )}
               {!coverImagePreview && mangaToEdit?.coverImage && (
                 <div className="mt-2 relative aspect-[2/3] w-full max-w-[200px] rounded-md overflow-hidden border">
                    <Image src={mangaToEdit.coverImage} alt="Current cover" layout="fill" objectFit="cover" data-ai-hint="manga cover current"/>
                 </div>
              )}
            </div>

            <div className="space-y-2">
              <Label suppressHydrationWarning>Genres * (Select at least one)</Label>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MANGA_GENRES_DETAILS.map(genre => (
                    <div key={genre.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`genre-edit-${genre.id}`}
                        checked={selectedGenres.includes(genre.id)}
                        onCheckedChange={() => handleGenreChange(genre.id)}
                      />
                      <Label htmlFor={`genre-edit-${genre.id}`} className="font-normal text-sm cursor-pointer" suppressHydrationWarning>{genre.name}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
               {selectedGenres.length === 0 && <p className="text-xs text-destructive">Please select at least one genre.</p>}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold" suppressHydrationWarning>Author Contact (Optional)</h3>
              <div className="space-y-2">
                <Label htmlFor="authorContactEmail-edit" suppressHydrationWarning>Contact Email</Label>
                <Input id="authorContactEmail-edit" type="email" value={authorContactEmail} onChange={(e) => setAuthorContactEmail(e.target.value)} placeholder="Author's public contact email" />
              </div>
              <div className="space-y-3">
                <Label suppressHydrationWarning>Social Media Links</Label>
                {authorSocialLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-secondary/30">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium flex-grow">{link.platform}: <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{link.url}</a></span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(index)} className="text-destructive h-6 w-6">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-end gap-2">
                  <div className="flex-grow space-y-1">
                    <Label htmlFor="socialPlatform-edit" className="text-xs">Platform Name</Label>
                    <Input id="socialPlatform-edit" value={authorSocialLinkPlatform} onChange={(e) => setAuthorSocialLinkPlatform(e.target.value)} placeholder="e.g., Twitter, Instagram" />
                  </div>
                  <div className="flex-grow space-y-1">
                     <Label htmlFor="socialUrl-edit" className="text-xs">Link URL</Label>
                    <Input id="socialUrl-edit" value={authorSocialLinkUrl} onChange={(e) => setAuthorSocialLinkUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="shrink-0">
                    <PlusCircle className="mr-1.5 h-4 w-4" /> Add Link
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold" suppressHydrationWarning>Chapters ({totalActiveChapters}/{MAX_CHAPTERS_PER_WORK})</h3>
                <Button type="button" variant="outline" size="sm" onClick={addChapter} disabled={totalActiveChapters >= MAX_CHAPTERS_PER_WORK}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Chapter
                </Button>
              </div>
              {totalActiveChapters === 0 && <p className="text-sm text-muted-foreground">No active chapters.</p>}
              <ScrollArea className="max-h-[600px] space-y-3 pr-3">
                {editableChapters.map((chapter, chapterIndex) => {
                  if (chapter._toBeDeleted && !chapter._isNew) {
                    return (
                      <Card key={chapter.id} className="p-3 bg-red-100 dark:bg-red-900/30 opacity-70">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-red-700 dark:text-red-300">
                            Chapter {mangaToEdit?.chapters.find(c => c.id === chapter.id)?.chapterNumber || chapterIndex + 1}: {chapter.title} (Marked for deletion)
                          </span>
                          <Button type="button" variant="outline" size="sm" onClick={() => unmarkChapterForDeletion(chapter.id)}>
                            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Undo Delete
                          </Button>
                        </div>
                      </Card>
                    );
                  }
                  if (chapter._toBeDeleted && chapter._isNew) return null;

                  const activePages = chapter.pages.filter(p => !p._toBeDeleted);
                  return (
                    <Card key={chapter.id} className="p-4 bg-secondary/30 space-y-3">
                      <div className="flex justify-between items-center">
                        <Label htmlFor={`edit-chapter-title-${chapter.id}`} className="text-base font-medium">
                          {chapter._isNew ? `New Chapter` : `Chapter ${mangaToEdit?.chapters.find(c=>c.id===chapter.id)?.chapterNumber || chapterIndex+1}`} Title
                        </Label>
                        <Button type="button" variant="ghost" size="icon" onClick={() => markChapterForDeletion(chapter.id)} className="text-destructive hover:bg-destructive/10 h-7 w-7">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        id={`edit-chapter-title-${chapter.id}`}
                        value={chapter.title}
                        onChange={(e) => updateChapterTitle(chapter.id, e.target.value)}
                        placeholder="Chapter Title"
                      />
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">
                          Pages ({activePages.length}/{MAX_PAGES_PER_CHAPTER})
                        </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => triggerPageUploadEdit(chapter.id)}
                            disabled={activePages.length >= MAX_PAGES_PER_CHAPTER}
                          >
                            <Images className="mr-1 h-3 w-3.5" /> Batch Add Page Images
                          </Button>
                      </div>
                      {activePages.length === 0 && <p className="text-xs text-muted-foreground">No pages in this chapter. Click to add images.</p>}
                      <ScrollArea className="max-h-[300px] border rounded-md p-2 space-y-3 bg-background/50"> {/* Scroll for pages */}
                        {chapter.pages.sort((a,b)=> a.order - b.order).map((page) => {
                          if (page._toBeDeleted && !page._isNew) {
                            return (
                              <Card key={page.id} className="p-2 bg-red-100 dark:bg-red-900/40 opacity-70">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium text-red-600 dark:text-red-300">
                                    Page {page.order + 1} (Marked for deletion)
                                  </span>
                                  <Button type="button" variant="outline" size="xs" onClick={() => unmarkPageForDeletion(chapter.id, page.id)}>
                                     <RotateCcw className="mr-1 h-3 w-3" /> Undo
                                  </Button>
                                </div>
                              </Card>
                            );
                          }
                          if (page._toBeDeleted && page._isNew) return null;

                          return (
                            <Card key={page.id} className="p-3 bg-background/70 shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                <Label className="text-xs font-medium">Page {page.order + 1} Image</Label>
                                <div className="flex items-center gap-1">
                                   <Button type="button" variant="outline" size="xs" onClick={() => triggerSinglePageImageChangeEdit(page.id)}>
                                    <Edit2 className="mr-1 h-3 w-3" /> Change Image
                                   </Button>
                                   <Input
                                    id={`single-page-upload-edit-${page.id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={el => singlePageUploadRefsEdit.current[page.id] = el}
                                    onChange={(e) => handleSinglePageImageChangeForEdit(chapter.id, page.id, e)}
                                   />
                                  <Button type="button" variant="ghost" size="icon" onClick={() => markPageForDeletion(chapter.id, page.id)} className="text-destructive hover:bg-destructive/10 h-6 w-6">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              {(page.previewUrl || page.existingImageUrl) && (
                                <div className="relative aspect-[2/3] w-full max-w-[150px] rounded border overflow-hidden mx-auto">
                                  <Image src={page.previewUrl || page.existingImageUrl!} alt={page.altText || `Page ${page.order + 1}`} layout="fill" objectFit="contain" data-ai-hint="manga page edit"/>
                                </div>
                              )}
                              {!(page.previewUrl || page.existingImageUrl) && (
                                <div className="flex items-center justify-center aspect-[2/3] w-full max-w-[150px] rounded border border-dashed bg-muted/30 mx-auto">
                                  <FileImage className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </ScrollArea>
                    </Card>
                  );
                })}
              </ScrollArea>
            </div>

             <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold" suppressHydrationWarning>Subscription Model *</h3>
                 <RadioGroup value={subscriptionModel} onValueChange={(value: MangaSeries['subscriptionModel']) => setSubscriptionModel(value)} className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="edit-sub-monthly" />
                        <Label htmlFor="edit-sub-monthly" className="font-normal">Monthly Subscription</Label>
                    </div>
                    {subscriptionModel === 'monthly' && (
                         <div className="pl-6 space-y-2">
                            <Label htmlFor="monthlySubscriptionPrice-edit" suppressHydrationWarning>Monthly Price (USD) *</Label>
                            <Input id="monthlySubscriptionPrice-edit" type="number" value={monthlySubscriptionPrice} onChange={(e) => setMonthlySubscriptionPrice(e.target.value)} placeholder="e.g., 4.99" step="0.01" min="0.01" required={subscriptionModel === 'monthly'} />
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="per_chapter" id="edit-sub-per-chapter" />
                        <Label htmlFor="edit-sub-per-chapter" className="font-normal">Per-Chapter Purchase</Label>
                    </div>
                     {subscriptionModel === 'per_chapter' && (
                         <div className="pl-6 space-y-2">
                            <Label htmlFor="chapterSubscriptionPrice-edit" suppressHydrationWarning>Price Per Chapter (USD) *</Label>
                            <Input id="chapterSubscriptionPrice-edit" type="number" value={chapterSubscriptionPrice} onChange={(e) => setChapterSubscriptionPrice(e.target.value)} placeholder="e.g., 0.99" step="0.01" min="0.01" required={subscriptionModel === 'per_chapter'} />
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="edit-sub-none" />
                        <Label htmlFor="edit-sub-none" className="font-normal">None (Free or Donation/Investment Only)</Label>
                    </div>
                </RadioGroup>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="freePreviewChapterCount-edit" suppressHydrationWarning>Free Preview Chapters *</Label>
                <Input id="freePreviewChapterCount-edit" type="number" value={freePreviewChapterCount} onChange={(e) => setFreePreviewChapterCount(e.target.value)} min="0" required />
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>Number of initial chapters readable for free.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="freePreviewPageCount-edit" suppressHydrationWarning>Free Preview Total Pages *</Label>
                <Input id="freePreviewPageCount-edit" type="number" value={freePreviewPageCount} onChange={(e) => setFreePreviewPageCount(e.target.value)} min="0" required />
                 <p className="text-xs text-muted-foreground" suppressHydrationWarning>Additional total pages (from start of paid chapters) readable for free.</p>
              </div>
            </div>


            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-3">
                <Switch id="enableCrowdfunding-edit" checked={enableCrowdfunding} onCheckedChange={setEnableCrowdfunding} aria-label="Enable Manga Crowdfunding"/>
                <Label htmlFor="enableCrowdfunding-edit" className="text-base font-medium cursor-pointer" suppressHydrationWarning>Enable Manga Crowdfunding?</Label>
              </div>
              {enableCrowdfunding && (
                <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                   <h3 className="text-lg font-semibold" suppressHydrationWarning>Crowdfunding Details</h3>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>Allow readers to invest in your manga and share its success.</p>
                  <div className="space-y-2">
                    <Label htmlFor="crowdfundingDescription-edit" suppressHydrationWarning>Crowdfunding Description *</Label>
                    <Textarea id="crowdfundingDescription-edit" value={crowdfundingDescription} onChange={(e) => setCrowdfundingDescription(e.target.value)} placeholder="Describe the crowdfunding goals and investor benefits (e.g., revenue share, IP rights)." rows={3} required={enableCrowdfunding} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sharesOfferedTotalPercent-edit" suppressHydrationWarning>Investor Total Revenue Share (%) *</Label>
                      <Input id="sharesOfferedTotalPercent-edit" type="number" value={sharesOfferedTotalPercent} onChange={(e) => setSharesOfferedTotalPercent(e.target.value)} placeholder="e.g.: 20" min="1" max="100" required={enableCrowdfunding} disabled={investmentOfferFieldsLocked} />
                       <p className="text-xs text-muted-foreground">Portion of manga's total revenue allocated to investors. {investmentOfferFieldsLocked && "(Locked due to active investors)"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalSharesInOffer-edit" suppressHydrationWarning>Total Shares in Crowdfunding *</Label>
                      <Input id="totalSharesInOffer-edit" type="number" value={totalSharesInOffer} onChange={(e) => setTotalSharesInOffer(e.target.value)} placeholder="e.g.: 100" min="1" required={enableCrowdfunding} disabled={investmentOfferFieldsLocked} />
                      <p className="text-xs text-muted-foreground">Number of shares the above revenue share is divided into. {investmentOfferFieldsLocked && "(Locked due to active investors)"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerShare-edit" suppressHydrationWarning>Investment Amount per Share (USD) *</Label>
                      <Input id="pricePerShare-edit" type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} placeholder="e.g.: 10" step="0.01" min="0.01" required={enableCrowdfunding} disabled={investmentOfferFieldsLocked} />
                       <p className="text-xs text-muted-foreground">Cost for an investor to purchase one share. {investmentOfferFieldsLocked && "(Locked due to active investors)"}</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dividendPayoutCycle-edit">Dividend Payout Cycle *</Label>
                        <Select
                            value={dividendPayoutCycle?.toString()}
                            onValueChange={(value) => setDividendPayoutCycle(parseInt(value,10) as MangaInvestmentOffer['dividendPayoutCycle'])}
                            required={enableCrowdfunding}
                        >
                            <SelectTrigger id="dividendPayoutCycle-edit">
                                <SelectValue placeholder="Select payout cycle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Monthly</SelectItem>
                                <SelectItem value="3">Quarterly (3 months)</SelectItem>
                                <SelectItem value="6">Semi-Annually (6 months)</SelectItem>
                                <SelectItem value="12">Annually (12 months)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Frequency of investor profit distribution.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minSubscriptionRequirement-edit" suppressHydrationWarning>Min. Subscription Requirement (Optional)</Label>
                      <Input id="minSubscriptionRequirement-edit" type="number" value={minSubscriptionRequirement} onChange={(e) => setMinSubscriptionRequirement(e.target.value)} placeholder="e.g.: 5" min="0" />
                       <p className="text-xs text-muted-foreground">Number of manga series an investor must subscribe to, to be eligible to invest.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSharesPerUser-edit" suppressHydrationWarning>Max Shares per Investor (Optional)</Label>
                      <Input id="maxSharesPerUser-edit" type="number" value={maxSharesPerUser} onChange={(e) => setMaxSharesPerUser(e.target.value)} placeholder="e.g.: 10" min="1" />
                      <p className="text-xs text-muted-foreground">Limit on shares a single investor can buy.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" className="w-full" disabled={!isDeletionAllowed}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Manga Series
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 text-destructive"/>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the manga series
                        "{mangaToEdit?.title}" and all its data.
                         {!isDeletionAllowed && <span className="block mt-2 text-destructive font-semibold">This manga cannot be deleted (active investments/subscriptions less than a year old).</span>}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteManga} disabled={!isDeletionAllowed} className="bg-destructive hover:bg-destructive/90">
                        Yes, delete manga
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                 {!isDeletionAllowed && <p className="text-xs text-muted-foreground mt-2 text-center">Deletion restricted due to active investments/subscriptions within the last year.</p>}
            </div>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" className="text-lg py-3 w-full sm:w-auto">
              <Save className="mr-2 h-5 w-5" /> Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
