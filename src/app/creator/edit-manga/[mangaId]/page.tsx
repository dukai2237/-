
"use client";

import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { MangaSeries, MangaInvestmentOffer, Chapter, MangaPage } from '@/lib/types';
import { getMangaById, updateMockMangaData } from '@/lib/mock-data';
import { Edit3, BookUp, PlusCircle, Trash2, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { MANGA_GENRES_DETAILS, MAX_CHAPTERS_PER_WORK, MAX_PAGES_PER_CHAPTER } from '@/lib/constants';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface EditableChapterState {
  id: string; // Existing ID or temporary new ID like 'new-timestamp'
  title: string;
  pageCount: number; // Editable, affects simulated page generation
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

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [editableChapters, setEditableChapters] = useState<EditableChapterState[]>([]);
  const [freePreviewPageCount, setFreePreviewPageCount] = useState('0');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');

  const [enableInvestment, setEnableInvestment] = useState(false);
  const [sharesOfferedTotalPercent, setSharesOfferedTotalPercent] = useState('');
  const [totalSharesInOffer, setTotalSharesInOffer] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [investmentDescription, setInvestmentDescription] = useState('');
  const [minSubscriptionRequirement, setMinSubscriptionRequirement] = useState('');
  const [maxSharesPerUser, setMaxSharesPerUser] = useState('');

  const totalPagesInManga = useMemo(() => {
    return editableChapters
      .filter(ch => !ch._toBeDeleted)
      .reduce((sum, ch) => sum + ch.pageCount, 0);
  }, [editableChapters]);

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/creator/edit-manga/${mangaId}`);
      return;
    }
    if (user.accountType !== 'creator') {
      toast({ title: "Access Denied", description: "Only creators can edit manga.", variant: "destructive" });
      router.push('/');
      return;
    }

    if (mangaId) {
      const fetchedManga = getMangaById(mangaId);
      if (fetchedManga) {
        if (fetchedManga.author.id !== user.id) {
          toast({ title: "Access Denied", description: "You can only edit your own manga series.", variant: "destructive" });
          router.push('/creator/dashboard');
          return;
        }
        setMangaToEdit(fetchedManga);
        setTitle(fetchedManga.title);
        setSummary(fetchedManga.summary);
        setCoverImage(fetchedManga.coverImage);
        setSelectedGenres(fetchedManga.genres);
        setEditableChapters(fetchedManga.chapters.map(ch => ({
          id: ch.id,
          title: ch.title,
          pageCount: ch.pages.length,
        })));
        setFreePreviewPageCount(fetchedManga.freePreviewPageCount.toString());
        setSubscriptionPrice(fetchedManga.subscriptionPrice?.toString() || '');

        if (fetchedManga.investmentOffer) {
          setEnableInvestment(fetchedManga.investmentOffer.isActive);
          setSharesOfferedTotalPercent(fetchedManga.investmentOffer.sharesOfferedTotalPercent.toString());
          setTotalSharesInOffer(fetchedManga.investmentOffer.totalSharesInOffer.toString());
          setPricePerShare(fetchedManga.investmentOffer.pricePerShare.toString());
          setInvestmentDescription(fetchedManga.investmentOffer.description);
          setMinSubscriptionRequirement(fetchedManga.investmentOffer.minSubscriptionRequirement?.toString() || '');
          setMaxSharesPerUser(fetchedManga.investmentOffer.maxSharesPerUser?.toString() || '');
        } else {
          setEnableInvestment(false);
        }
      } else {
        toast({ title: "Manga Not Found", description: "Could not find the manga to edit.", variant: "destructive" });
        router.push('/creator/dashboard');
        return;
      }
    }
    setIsLoading(false);
  }, [mangaId, user, router, toast]);

  const handleGenreChange = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(g => g !== genreId) : [...prev, genreId]
    );
  };

  const addChapter = () => {
    const activeChapters = editableChapters.filter(ch => !ch._toBeDeleted);
    if (activeChapters.length >= MAX_CHAPTERS_PER_WORK) {
      toast({ title: "Chapter Limit Reached", description: `A manga can have at most ${MAX_CHAPTERS_PER_WORK} chapters.`, variant: "destructive" });
      return;
    }
    setEditableChapters([...editableChapters, {
      id: `new-${Date.now()}`,
      title: `New Chapter ${activeChapters.length + 1}`,
      pageCount: 10,
      _isNew: true,
    }]);
  };

  const updateChapterField = (chapterId: string, field: 'title' | 'pageCount', value: string | number) => {
    setEditableChapters(prev => prev.map(ch =>
      ch.id === chapterId
        ? { ...ch, [field]: field === 'pageCount' ? Math.max(1, Math.min(Number(value), MAX_PAGES_PER_CHAPTER)) : value }
        : ch
    ));
  };

  const markChapterForDeletion = (chapterId: string) => {
    setEditableChapters(prev => prev.map(ch =>
      ch.id === chapterId ? { ...ch, _toBeDeleted: true } : ch
    ).filter(ch => !(ch._isNew && ch._toBeDeleted)) // Immediately remove new chapters marked for deletion
    );
  };
  
  const unmarkChapterForDeletion = (chapterId: string) => {
     setEditableChapters(prev => prev.map(ch =>
      ch.id === chapterId ? { ...ch, _toBeDeleted: false } : ch
    ));
  };


  if (isLoading || !mangaToEdit) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /></div>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !coverImage || selectedGenres.length === 0) {
      toast({ title: "Missing Fields", description: "Please fill title, summary, cover, and select genres.", variant: "destructive" });
      return;
    }
    const finalChapters = editableChapters.filter(ch => !ch._toBeDeleted);
    if (finalChapters.length === 0) {
      toast({ title: "No Chapters", description: "Manga must have at least one chapter.", variant: "destructive" });
      return;
    }
     if (parseInt(freePreviewPageCount, 10) > totalPagesInManga) {
      toast({ title: "Invalid Free Preview", description: "Free preview pages cannot exceed total pages in the manga.", variant: "destructive" });
      return;
    }

    let updatedInvestmentOffer: MangaInvestmentOffer | undefined = mangaToEdit.investmentOffer;
    if (enableInvestment) {
      if (!sharesOfferedTotalPercent || !totalSharesInOffer || !pricePerShare || !investmentDescription) {
        toast({ title: "Missing Investment Fields", variant: "destructive" });
        return;
      }
      updatedInvestmentOffer = {
        sharesOfferedTotalPercent: parseFloat(sharesOfferedTotalPercent),
        totalSharesInOffer: parseInt(totalSharesInOffer, 10),
        pricePerShare: parseFloat(pricePerShare),
        description: investmentDescription,
        minSubscriptionRequirement: minSubscriptionRequirement ? parseInt(minSubscriptionRequirement, 10) : undefined,
        maxSharesPerUser: maxSharesPerUser ? parseInt(maxSharesPerUser, 10) : undefined,
        isActive: true,
      };
    } else if (mangaToEdit.investmentOffer) {
      updatedInvestmentOffer = { ...mangaToEdit.investmentOffer, isActive: false };
    }

    const processedChapters: Chapter[] = finalChapters.map((editCh, index) => {
      // Regenerate pages based on pageCount for simplicity in mock
      const pages: MangaPage[] = Array.from({ length: editCh.pageCount }, (_, i) => ({
        id: `${mangaId}-${editCh.id}-page-${i + 1}`.replace('new-', 'ch-'), // make IDs somewhat consistent
        imageUrl: `https://picsum.photos/800/1200?random=${mangaId}${editCh.id}${i + 1}`,
        altText: `Page ${i + 1}`,
      }));
      return {
        id: editCh._isNew ? `ch-${Date.now()}-${index}` : editCh.id,
        title: editCh.title,
        chapterNumber: index + 1, // Re-number chapters based on final list
        pages: pages,
      };
    });

    const updatedMangaData: Partial<MangaSeries> = {
      title,
      summary,
      coverImage,
      genres: selectedGenres,
      chapters: processedChapters,
      freePreviewPageCount: parseInt(freePreviewPageCount, 10) || 0,
      subscriptionPrice: subscriptionPrice ? parseFloat(subscriptionPrice) : undefined,
      investmentOffer: updatedInvestmentOffer,
    };

    try {
      updateMockMangaData(mangaId, updatedMangaData);
      toast({ title: "Manga Updated!", description: `${title} has been successfully updated.` });
      router.push('/creator/dashboard');
    } catch (error) {
      toast({ title: "Update Failed", description: "Could not update manga.", variant: "destructive" });
    }
  };

  const handleDeleteManga = async () => {
    const success = await deleteMangaSeries(mangaId);
    if (success) {
      router.push('/creator/dashboard');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center" suppressHydrationWarning><Edit3 className="mr-3 h-7 w-7 text-primary"/>Edit Manga Series</CardTitle>
            <CardDescription suppressHydrationWarning>
              Modify details for: "{mangaToEdit.title}". Max {MAX_CHAPTERS_PER_WORK} chapters, {MAX_PAGES_PER_CHAPTER} pages/chapter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info Fields */}
            <div className="space-y-2">
              <Label htmlFor="title" suppressHydrationWarning>Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary" suppressHydrationWarning>Summary *</Label>
              <Textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage" suppressHydrationWarning>Cover Image URL *</Label>
              <Input id="coverImage" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} required />
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>Simulated: In real app, a file upload.</p>
            </div>
            
            {/* Genre Selection */}
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

            {/* Chapters Management */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold" suppressHydrationWarning>Chapters ({editableChapters.filter(ch => !ch._toBeDeleted).length}/{MAX_CHAPTERS_PER_WORK})</h3>
                <Button type="button" variant="outline" size="sm" onClick={addChapter} disabled={editableChapters.filter(ch => !ch._toBeDeleted).length >= MAX_CHAPTERS_PER_WORK}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Chapter
                </Button>
              </div>
              {editableChapters.filter(ch => !ch._toBeDeleted).length === 0 && <p className="text-sm text-muted-foreground">No active chapters. Add one or undelete.</p>}
              <ScrollArea className="max-h-72 space-y-3 pr-3">
                {editableChapters.map((chapter, index) => (
                  <Card key={chapter.id} className={`p-3 ${chapter._toBeDeleted ? 'bg-red-100 dark:bg-red-900/30 opacity-60' : 'bg-secondary/30'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor={`edit-chapter-title-${index}`} className="text-sm font-medium" suppressHydrationWarning>
                        {chapter._isNew ? `New Chapter ${index + 1}` : `Chapter ${mangaToEdit.chapters.find(c=>c.id===chapter.id)?.chapterNumber || index+1} Title`}
                        {chapter._toBeDeleted && " (Marked for Deletion)"}
                      </Label>
                      {chapter._toBeDeleted ? (
                         <Button type="button" variant="outline" size="sm" onClick={() => unmarkChapterForDeletion(chapter.id)}>Undo Delete</Button>
                      ) : (
                        <Button type="button" variant="ghost" size="icon" onClick={() => markChapterForDeletion(chapter.id)} className="text-destructive hover:bg-destructive/10 h-7 w-7">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      id={`edit-chapter-title-${index}`}
                      value={chapter.title}
                      onChange={(e) => updateChapterField(chapter.id, 'title', e.target.value)}
                      placeholder="Chapter Title"
                      className="mb-2"
                      disabled={chapter._toBeDeleted}
                    />
                    <Label htmlFor={`edit-chapter-pages-${index}`} className="text-sm font-medium" suppressHydrationWarning>Page Count (1-{MAX_PAGES_PER_CHAPTER})</Label>
                    <Input
                      id={`edit-chapter-pages-${index}`}
                      type="number"
                      value={chapter.pageCount}
                      onChange={(e) => updateChapterField(chapter.id, 'pageCount', parseInt(e.target.value, 10))}
                      min="1"
                      max={MAX_PAGES_PER_CHAPTER.toString()}
                      className="w-full"
                      disabled={chapter._toBeDeleted}
                    />
                    <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>Simulated: Change count to add/remove pages. Full page management is simplified.</p>
                  </Card>
                ))}
              </ScrollArea>
            </div>
            
            {/* Other settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="freePreviewPageCount" suppressHydrationWarning>Free Preview Pages * (max {totalPagesInManga})</Label>
                <Input id="freePreviewPageCount" type="number" value={freePreviewPageCount} onChange={(e) => setFreePreviewPageCount(e.target.value)} min="0" max={totalPagesInManga.toString()} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriptionPrice" suppressHydrationWarning>Subscription Price (USD/month, optional)</Label>
                <Input id="subscriptionPrice" type="number" value={subscriptionPrice} onChange={(e) => setSubscriptionPrice(e.target.value)} step="0.01" min="0" />
              </div>
            </div>

            {/* Investment Offer Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-3">
                <Switch id="enableInvestment" checked={enableInvestment} onCheckedChange={setEnableInvestment} aria-label="Enable Investment Offer"/>
                <Label htmlFor="enableInvestment" className="text-base font-medium cursor-pointer" suppressHydrationWarning>Enable Investment Offer</Label>
              </div>
              {enableInvestment && (
                <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                  {/* Investment fields identical to create page */}
                   <h3 className="text-lg font-semibold" suppressHydrationWarning>Investment Offer Details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="investmentDescription-edit" suppressHydrationWarning>Offer Description *</Label>
                    <Textarea id="investmentDescription-edit" value={investmentDescription} onChange={(e) => setInvestmentDescription(e.target.value)} placeholder="Describe the benefits for investors..." rows={3} required={enableInvestment} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sharesOfferedTotalPercent-edit" suppressHydrationWarning>Total Revenue Share for Investors Pool (%) *</Label>
                      <Input id="sharesOfferedTotalPercent-edit" type="number" value={sharesOfferedTotalPercent} onChange={(e) => setSharesOfferedTotalPercent(e.target.value)} placeholder="e.g., 20" min="1" max="100" required={enableInvestment} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalSharesInOffer-edit" suppressHydrationWarning>Total Shares in This Offer *</Label>
                      <Input id="totalSharesInOffer-edit" type="number" value={totalSharesInOffer} onChange={(e) => setTotalSharesInOffer(e.target.value)} placeholder="e.g., 100" min="1" required={enableInvestment} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerShare-edit" suppressHydrationWarning>Price Per Share (USD) *</Label>
                      <Input id="pricePerShare-edit" type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} placeholder="e.g., 10" step="0.01" min="0.01" required={enableInvestment} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minSubscriptionRequirement-edit" suppressHydrationWarning>Min. User Subscriptions to Invest (optional)</Label>
                      <Input id="minSubscriptionRequirement-edit" type="number" value={minSubscriptionRequirement} onChange={(e) => setMinSubscriptionRequirement(e.target.value)} placeholder="e.g., 5" min="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSharesPerUser-edit" suppressHydrationWarning>Max Shares Per Investor (optional)</Label>
                      <Input id="maxSharesPerUser-edit" type="number" value={maxSharesPerUser} onChange={(e) => setMaxSharesPerUser(e.target.value)} placeholder="e.g., 10" min="1" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Delete Manga Section */}
            <div className="pt-6 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Manga Series
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 text-destructive"/>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the manga series
                        "{mangaToEdit.title}" and all of its data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteManga} className="bg-destructive hover:bg-destructive/90">
                        Yes, delete manga
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" className="text-lg py-3 w-full sm:w-auto">Save Changes</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
