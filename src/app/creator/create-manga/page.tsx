
"use client";

import { useState, type FormEvent, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { MangaInvestmentOffer, AuthorContactDetails, MangaSeries } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { BookUp, PlusCircle, Trash2, AlertTriangle, UploadCloud, Mail, Link as LinkIcon, FileImage, Images, Edit2, ScrollText } from 'lucide-react';
import { MANGA_GENRES_DETAILS, MAX_CHAPTERS_PER_WORK, MAX_PAGES_PER_CHAPTER, MAX_WORKS_PER_CREATOR } from '@/lib/constants';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


interface EditablePageInput {
  localId: string;
  file: File | null;
  previewUrl: string | null;
}

interface EditableChapterInput {
  localId: string; 
  title: string;
  pages: EditablePageInput[];
}

export default function CreateMangaPage() {
  const { user, addMangaSeries } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const coverImageFileRef = useRef<File | null>(null);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  
  const [subscriptionModel, setSubscriptionModel] = useState<MangaSeries['subscriptionModel']>('monthly');
  const [monthlySubscriptionPrice, setMonthlySubscriptionPrice] = useState('');
  const [chapterSubscriptionPrice, setChapterSubscriptionPrice] = useState('');

  const [freePreviewPageCount, setFreePreviewPageCount] = useState('2');
  const [freePreviewChapterCount, setFreePreviewChapterCount] = useState('0');
  

  const [chaptersInput, setChaptersInput] = useState<EditableChapterInput[]>([]);

  const [enableCrowdfunding, setEnableCrowdfunding] = useState(false);
  const [sharesOfferedTotalPercent, setSharesOfferedTotalPercent] = useState('20');
  const [totalSharesInOffer, setTotalSharesInOffer] = useState('100');
  const [pricePerShare, setPricePerShare] = useState('10');
  const [crowdfundingDescription, setCrowdfundingDescription] = useState('');
  const [minSubscriptionRequirement, setMinSubscriptionRequirement] = useState('');
  const [maxSharesPerUser, setMaxSharesPerUser] = useState('');
  const [dividendPayoutCycle, setDividendPayoutCycle] = useState<MangaInvestmentOffer['dividendPayoutCycle']>(3);


  const [authorContactEmail, setAuthorContactEmail] = useState(user?.email || '');
  const [authorSocialLinkPlatform, setAuthorSocialLinkPlatform] = useState('');
  const [authorSocialLinkUrl, setAuthorSocialLinkUrl] = useState('');
  const [authorSocialLinks, setAuthorSocialLinks] = useState<{platform: string, url: string}[]>([]);

  const pageUploadInputRef = useRef<HTMLInputElement>(null);
  const singlePageUploadRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [targetChapterForPageUpload, setTargetChapterForPageUpload] = useState<string | null>(null);

  const totalPagesInManga = useMemo(() => {
    return chaptersInput.reduce((sum, ch) => sum + ch.pages.length, 0);
  }, [chaptersInput]);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/creator/create-manga');
      return;
    }
    if (user.accountType !== 'creator') {
      toast({ title: "Access Restricted", description: "Only creators can access this page.", variant: "destructive" });
      router.push('/');
      return;
    }
    if (!user.isApproved) {
      toast({ 
        title: "Account Pending Approval", 
        description: "Your creator account needs admin approval to create manga.", 
        variant: "default",
        duration: 7000
      });
      router.push('/creator/dashboard'); 
      return;
    }
    setAuthorContactEmail(user.email || '');
  }, [user, router, toast]);

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      coverImageFileRef.current = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      coverImageFileRef.current = null;
      setCoverImagePreview(null);
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

  const addChapterInput = () => {
    if (chaptersInput.length >= MAX_CHAPTERS_PER_WORK) {
      toast({ title: "Chapter Limit Reached", description: `A manga can have a maximum of ${MAX_CHAPTERS_PER_WORK} chapters.`, variant: "destructive" });
      return;
    }
    setChaptersInput([...chaptersInput, { 
      localId: `new-chapter-${Date.now()}`, 
      title: `Chapter ${chaptersInput.length + 1}`, 
      pages: [] 
    }]);
  };

  const updateChapterTitleInput = (chapterLocalId: string, title: string) => {
    setChaptersInput(chaptersInput.map(ch =>
      ch.localId === chapterLocalId ? { ...ch, title } : ch
    ));
  };

  const removeChapterInput = (chapterLocalId: string) => {
    setChaptersInput(chaptersInput.filter(ch => ch.localId !== chapterLocalId));
  };
  
  const triggerPageUpload = (chapterLocalId: string) => {
    setTargetChapterForPageUpload(chapterLocalId);
    pageUploadInputRef.current?.click();
  };
  
  const triggerSinglePageImageChange = (pageLocalId: string) => {
    singlePageUploadRefs.current[pageLocalId]?.click();
  };


  const handleMultiplePageImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!targetChapterForPageUpload) return;
    const files = event.target.files;
  
    if (files && files.length > 0) {
      const chapterToUpdate = chaptersInput.find(ch => ch.localId === targetChapterForPageUpload);
      if (!chapterToUpdate) {
        if (event.target) event.target.value = "";
        setTargetChapterForPageUpload(null);
        return;
      }
  
      const filesToProcess = Array.from(files);
      const remainingPageSlots = MAX_PAGES_PER_CHAPTER - chapterToUpdate.pages.length;
      
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
        setTargetChapterForPageUpload(null);
        return;
      }
  
      const newPagePromises = filesToProcess.map(file => {
          return new Promise<EditablePageInput>((resolve) => {
            const reader = new FileReader();
            const pageLocalId = `new-page-${Date.now()}-${Math.random().toString(16).slice(2)}`;
            reader.onloadend = () => {
              resolve({ localId: pageLocalId, file: file, previewUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
          });
        });
    
        const newPages = await Promise.all(newPagePromises);
    
        setChaptersInput(prevChapters => prevChapters.map(ch =>
          ch.localId === targetChapterForPageUpload
            ? { ...ch, pages: [...ch.pages, ...newPages] }
            : ch
        ));
    }
  
    if (event.target) {
      event.target.value = ""; 
    }
    setTargetChapterForPageUpload(null);
  };


  const removePageFromChapterInput = (chapterLocalId: string, pageLocalId: string) => {
    setChaptersInput(chaptersInput.map(ch =>
      ch.localId === chapterLocalId 
        ? { ...ch, pages: ch.pages.filter(p => p.localId !== pageLocalId) } 
        : ch
    ));
  };

  const handleSinglePageImageChange = (chapterLocalId: string, pageLocalId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChaptersInput(prevChapters => prevChapters.map(ch => 
          ch.localId === chapterLocalId 
            ? { 
                ...ch, 
                pages: ch.pages.map(p => 
                  p.localId === pageLocalId 
                    ? { ...p, file: file, previewUrl: reader.result as string } 
                    : p
                ) 
              } 
            : ch
        ));
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };


  if (!user || user.accountType !== 'creator' || !user.isApproved) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Access Restricted or Account Pending Approval</h2>
        <p className="text-muted-foreground">
          {user && user.accountType === 'creator' && !user.isApproved 
            ? "Your creator account is awaiting approval to create manga." 
            : "Redirecting..."}
        </p>
         <Button onClick={() => router.push(user && user.accountType === 'creator' && !user.isApproved ? '/creator/dashboard' : '/')} className="mt-4">
          Go to {user && user.accountType === 'creator' && !user.isApproved ? 'Dashboard' : 'Homepage'}
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !coverImageFileRef.current || selectedGenres.length === 0) {
      toast({ title: "Missing Required Fields", description: "Please fill title, summary, upload cover image, and select at least one genre.", variant: "destructive" });
      return;
    }
    if (chaptersInput.length === 0) {
      toast({ title: "No Chapters", description: "Please add at least one chapter.", variant: "destructive" });
      return;
    }
    if (chaptersInput.some(ch => ch.pages.length === 0 || ch.pages.some(p => !p.previewUrl))) {
      toast({ title: "Incomplete Chapters", description: "All chapters must have at least one page, and all pages must have an image uploaded.", variant: "destructive" });
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
        toast({ title: "Invalid Free Preview Chapters", description: "Free preview chapters must be a non-negative number.", variant: "destructive" });
        return;
    }


    let investmentOfferData: MangaInvestmentOffer | undefined = undefined;
    if (enableCrowdfunding) {
      if (!sharesOfferedTotalPercent || !totalSharesInOffer || !pricePerShare || !crowdfundingDescription) {
        toast({ title: "Crowdfunding Info Incomplete", description: "Please fill all crowdfunding details or disable the feature.", variant: "destructive" });
        return;
      }
      investmentOfferData = {
        sharesOfferedTotalPercent: parseFloat(sharesOfferedTotalPercent),
        totalSharesInOffer: parseInt(totalSharesInOffer, 10),
        pricePerShare: parseFloat(pricePerShare),
        description: crowdfundingDescription,
        minSubscriptionRequirement: minSubscriptionRequirement ? parseInt(minSubscriptionRequirement, 10) : undefined,
        maxSharesPerUser: maxSharesPerUser ? parseInt(maxSharesPerUser, 10) : undefined,
        isActive: true,
        dividendPayoutCycle: dividendPayoutCycle,
      };
    }
    
    const authorDetailsPayload: AuthorContactDetails = {
        email: authorContactEmail || undefined,
        socialLinks: authorSocialLinks.length > 0 ? authorSocialLinks : undefined,
    };

    let coverImageDataUrl = coverImagePreview; 
    if (coverImageFileRef.current && !coverImagePreview) { 
      coverImageDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(coverImageFileRef.current!);
      });
    }
    if (!coverImageDataUrl) {
        toast({ title: "Cover Image Error", description: "Failed to process cover image. Please re-select.", variant: "destructive" });
        return;
    }


    const newManga = await addMangaSeries({
      title,
      summary,
      coverImage: coverImageDataUrl, 
      genres: selectedGenres,
      subscriptionModel: subscriptionModel,
      subscriptionPrice: subscriptionModel === 'monthly' ? parseFloat(monthlySubscriptionPrice) : undefined,
      chapterSubscriptionPrice: subscriptionModel === 'per_chapter' ? parseFloat(chapterSubscriptionPrice) : undefined,
      freePreviewPageCount: parsedFreePageCount || 0,
      freePreviewChapterCount: parsedFreeChapterCount || 0,
      investmentOffer: investmentOfferData,
      chaptersInput: chaptersInput.map(ch => ({ 
        title: ch.title, 
        pages: ch.pages.map(p => ({ previewUrl: p.previewUrl! }))
      })),
      authorDetails: authorDetailsPayload,
    });

    if (newManga) {
      router.push('/creator/dashboard');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Input 
        id="page-image-multi-upload-create"
        type="file" 
        multiple 
        accept="image/*" 
        ref={pageUploadInputRef}
        onChange={handleMultiplePageImagesUpload}
        className="hidden" 
      />
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center" suppressHydrationWarning><BookUp className="mr-3 h-7 w-7 text-primary" />Create New Manga Series</CardTitle>
            <CardDescription suppressHydrationWarning>
              Fill in the details for your new manga series. Fields marked with * are required.
              Max {MAX_WORKS_PER_CREATOR} works, {MAX_CHAPTERS_PER_WORK} chapters/work, {MAX_PAGES_PER_CHAPTER} pages/chapter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" suppressHydrationWarning>Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Galactic Adventures" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary" suppressHydrationWarning>Summary *</Label>
              <Textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="A brief description of your manga." rows={4} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImageFile" suppressHydrationWarning>Cover Image * (Local Upload)</Label>
              <Input id="coverImageFile" type="file" accept="image/*" onChange={handleCoverImageChange} className="text-sm"/>
              {coverImagePreview && (
                <div className="mt-2 relative aspect-[2/3] w-full max-w-[200px] rounded-md overflow-hidden border">
                  <Image src={coverImagePreview} alt="Cover preview" layout="fill" objectFit="cover" data-ai-hint="manga cover preview"/>
                </div>
              )}
              {!coverImagePreview && (
                 <div className="mt-2 flex items-center justify-center aspect-[2/3] w-full max-w-[200px] rounded-md border border-dashed bg-muted/50">
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
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
                        id={`genre-${genre.id}`}
                        checked={selectedGenres.includes(genre.id)}
                        onCheckedChange={() => handleGenreChange(genre.id)}
                      />
                      <Label htmlFor={`genre-${genre.id}`} className="font-normal text-sm cursor-pointer" suppressHydrationWarning>{genre.name}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedGenres.length === 0 && <p className="text-xs text-destructive">Please select at least one genre.</p>}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold" suppressHydrationWarning>Author Contact (Optional)</h3>
              <div className="space-y-2">
                <Label htmlFor="authorContactEmail" suppressHydrationWarning>Contact Email</Label>
                <Input id="authorContactEmail" type="email" value={authorContactEmail} onChange={(e) => setAuthorContactEmail(e.target.value)} placeholder="Author's public contact email" />
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
                    <Label htmlFor="socialPlatform" className="text-xs">Platform Name</Label>
                    <Input id="socialPlatform" value={authorSocialLinkPlatform} onChange={(e) => setAuthorSocialLinkPlatform(e.target.value)} placeholder="e.g., Twitter, Instagram" />
                  </div>
                  <div className="flex-grow space-y-1">
                     <Label htmlFor="socialUrl" className="text-xs">Link URL</Label>
                    <Input id="socialUrl" value={authorSocialLinkUrl} onChange={(e) => setAuthorSocialLinkUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="shrink-0">
                    <PlusCircle className="mr-1.5 h-4 w-4" /> Add Link
                  </Button>
                </div>
                 <p className="text-xs text-muted-foreground">This information will be displayed on your manga details page for readers to connect with you.</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold" suppressHydrationWarning>Chapters ({chaptersInput.length}/{MAX_CHAPTERS_PER_WORK})</h3>
                <Button type="button" variant="outline" size="sm" onClick={addChapterInput} disabled={chaptersInput.length >= MAX_CHAPTERS_PER_WORK}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Chapter
                </Button>
              </div>
              {chaptersInput.length === 0 && <p className="text-sm text-muted-foreground">No chapters added yet. Click "Add Chapter" to start.</p>}
              <ScrollArea className="max-h-[500px] space-y-3 pr-3"> {/* Outer ScrollArea for chapters list */}
                {chaptersInput.map((chapter, chapterIndex) => (
                  <Card key={chapter.localId} className="p-4 bg-secondary/30 space-y-3">
                    <div className="flex justify-between items-center">
                       <Label htmlFor={`chapter-title-${chapter.localId}`} className="text-base font-medium" suppressHydrationWarning>Chapter {chapterIndex + 1} Title</Label>
                       <Button type="button" variant="ghost" size="icon" onClick={() => removeChapterInput(chapter.localId)} className="text-destructive hover:bg-destructive/10 h-7 w-7">
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                    <Input
                      id={`chapter-title-${chapter.localId}`}
                      value={chapter.title}
                      onChange={(e) => updateChapterTitleInput(chapter.localId, e.target.value)}
                      placeholder="e.g., The Beginning"
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium" suppressHydrationWarning>Pages ({chapter.pages.length}/{MAX_PAGES_PER_CHAPTER})</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="xs" 
                          onClick={() => triggerPageUpload(chapter.localId)}
                          disabled={chapter.pages.length >= MAX_PAGES_PER_CHAPTER}
                        >
                          <Images className="mr-1 h-3 w-3.5" /> Batch Add Page Images
                        </Button>
                    </div>
                     {chapter.pages.length === 0 && <p className="text-xs text-muted-foreground">No pages in this chapter. Click button to add images.</p>}
                     <ScrollArea className="max-h-[300px] border rounded-md p-2 space-y-3 bg-background/50"> {/* ScrollArea for pages within a chapter */}
                      {chapter.pages.map((page, pageIndex) => (
                        <Card key={page.localId} className="p-3 bg-background/70 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <Label className="text-xs font-medium" suppressHydrationWarning>Page {pageIndex + 1} Image</Label>
                            <div className="flex items-center gap-1">
                               <Button type="button" variant="outline" size="xs" onClick={() => triggerSinglePageImageChange(page.localId)}>
                                <Edit2 className="mr-1 h-3 w-3" /> Change Image
                               </Button>
                               <Input
                                id={`single-page-upload-${page.localId}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={el => singlePageUploadRefs.current[page.localId] = el}
                                onChange={(e) => handleSinglePageImageChange(chapter.localId, page.localId, e)}
                               />
                              <Button type="button" variant="ghost" size="icon" onClick={() => removePageFromChapterInput(chapter.localId, page.localId)} className="text-destructive hover:bg-destructive/10 h-6 w-6">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {page.previewUrl && (
                            <div className="relative aspect-[2/3] w-full max-w-[150px] rounded border overflow-hidden mx-auto">
                              <Image src={page.previewUrl} alt={`Page ${pageIndex + 1} preview`} layout="fill" objectFit="contain" data-ai-hint="manga page create"/>
                            </div>
                          )}
                          {!page.previewUrl && ( 
                            <div className="flex items-center justify-center aspect-[2/3] w-full max-w-[150px] rounded border border-dashed bg-muted/30 mx-auto">
                              <FileImage className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </Card>
                      ))}
                    </ScrollArea>
                  </Card>
                ))}
              </ScrollArea>
            </div>
            
             <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold" suppressHydrationWarning>Subscription Model *</h3>
                 <RadioGroup value={subscriptionModel} onValueChange={(value: MangaSeries['subscriptionModel']) => setSubscriptionModel(value)} className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="sub-monthly" />
                        <Label htmlFor="sub-monthly" className="font-normal">Monthly Subscription</Label>
                    </div>
                    {subscriptionModel === 'monthly' && (
                         <div className="pl-6 space-y-2">
                            <Label htmlFor="monthlySubscriptionPrice" suppressHydrationWarning>Monthly Price (USD) *</Label>
                            <Input id="monthlySubscriptionPrice" type="number" value={monthlySubscriptionPrice} onChange={(e) => setMonthlySubscriptionPrice(e.target.value)} placeholder="e.g., 4.99" step="0.01" min="0.01" required={subscriptionModel === 'monthly'} />
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="per_chapter" id="sub-per-chapter" />
                        <Label htmlFor="sub-per-chapter" className="font-normal">Per-Chapter Purchase</Label>
                    </div>
                     {subscriptionModel === 'per_chapter' && (
                         <div className="pl-6 space-y-2">
                            <Label htmlFor="chapterSubscriptionPrice" suppressHydrationWarning>Price Per Chapter (USD) *</Label>
                            <Input id="chapterSubscriptionPrice" type="number" value={chapterSubscriptionPrice} onChange={(e) => setChapterSubscriptionPrice(e.target.value)} placeholder="e.g., 0.99" step="0.01" min="0.01" required={subscriptionModel === 'per_chapter'} />
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="sub-none" />
                        <Label htmlFor="sub-none" className="font-normal">None (Free or Donation/Investment Only)</Label>
                    </div>
                </RadioGroup>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
               <div className="space-y-2">
                <Label htmlFor="freePreviewChapterCount" suppressHydrationWarning>Free Preview Chapters *</Label>
                <Input id="freePreviewChapterCount" type="number" value={freePreviewChapterCount} onChange={(e) => setFreePreviewChapterCount(e.target.value)} min="0" required />
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>Number of initial chapters readable for free.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="freePreviewPageCount" suppressHydrationWarning>Free Preview Total Pages *</Label>
                <Input id="freePreviewPageCount" type="number" value={freePreviewPageCount} onChange={(e) => setFreePreviewPageCount(e.target.value)} min="0" required />
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>Additional total pages (from start of paid chapters) readable for free.</p>
              </div>
            </div>
           

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-3">
                <Switch id="enableCrowdfunding" checked={enableCrowdfunding} onCheckedChange={setEnableCrowdfunding} aria-label="Enable Manga Crowdfunding" />
                <Label htmlFor="enableCrowdfunding" className="text-base font-medium cursor-pointer" suppressHydrationWarning>Enable Manga Crowdfunding?</Label>
              </div>
              {enableCrowdfunding && (
                <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                  <h3 className="text-lg font-semibold" suppressHydrationWarning>Crowdfunding Details</h3>
                   <p className="text-sm text-muted-foreground" suppressHydrationWarning>Allow readers to invest in your manga and share its success.</p>
                  <div className="space-y-2">
                    <Label htmlFor="crowdfundingDescription" suppressHydrationWarning>Crowdfunding Description *</Label>
                    <Textarea id="crowdfundingDescription" value={crowdfundingDescription} onChange={(e) => setCrowdfundingDescription(e.target.value)} placeholder="Describe the crowdfunding goals and investor benefits (e.g., revenue share, IP rights)." rows={3} required={enableCrowdfunding} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sharesOfferedTotalPercent" suppressHydrationWarning>Investor Total Revenue Share (%) *</Label>
                      <Input id="sharesOfferedTotalPercent" type="number" value={sharesOfferedTotalPercent} onChange={(e) => setSharesOfferedTotalPercent(e.target.value)} placeholder="e.g.: 20" min="1" max="100" required={enableCrowdfunding} />
                       <p className="text-xs text-muted-foreground">Portion of manga's total revenue allocated to investors.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalSharesInOffer" suppressHydrationWarning>Total Shares in Crowdfunding *</Label>
                      <Input id="totalSharesInOffer" type="number" value={totalSharesInOffer} onChange={(e) => setTotalSharesInOffer(e.target.value)} placeholder="e.g.: 100" min="1" required={enableCrowdfunding} />
                      <p className="text-xs text-muted-foreground">Number of shares the above revenue share is divided into.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerShare" suppressHydrationWarning>Investment Amount per Share (USD) *</Label>
                      <Input id="pricePerShare" type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} placeholder="e.g.: 10" step="0.01" min="0.01" required={enableCrowdfunding} />
                       <p className="text-xs text-muted-foreground">Cost for an investor to purchase one share.</p>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="dividendPayoutCycle">Dividend Payout Cycle *</Label>
                        <Select
                            value={dividendPayoutCycle?.toString()}
                            onValueChange={(value) => setDividendPayoutCycle(parseInt(value,10) as MangaInvestmentOffer['dividendPayoutCycle'])}
                            required={enableCrowdfunding}
                        >
                            <SelectTrigger id="dividendPayoutCycle">
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
                      <Label htmlFor="minSubscriptionRequirement" suppressHydrationWarning>Min. Subscription Requirement (Optional)</Label>
                      <Input id="minSubscriptionRequirement" type="number" value={minSubscriptionRequirement} onChange={(e) => setMinSubscriptionRequirement(e.target.value)} placeholder="e.g.: 5" min="0" />
                       <p className="text-xs text-muted-foreground">Number of manga series an investor must subscribe to, to be eligible to invest.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSharesPerUser" suppressHydrationWarning>Max Shares per Investor (Optional)</Label>
                      <Input id="maxSharesPerUser" type="number" value={maxSharesPerUser} onChange={(e) => setMaxSharesPerUser(e.target.value)} placeholder="e.g.: 10" min="1" />
                      <p className="text-xs text-muted-foreground">Limit on shares a single investor can buy.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6">Publish Manga Series</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

