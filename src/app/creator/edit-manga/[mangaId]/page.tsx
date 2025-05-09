
"use client";

import { useState, useEffect, type FormEvent, useMemo } from 'react';
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
import type { MangaSeries, MangaInvestmentOffer, Chapter, MangaPage } from '@/lib/types';
import { getMangaById, updateMockMangaData } from '@/lib/mock-data';
import { Edit3, BookUp, PlusCircle, Trash2, AlertTriangle, UploadCloud } from 'lucide-react';
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
  id: string; 
  title: string;
  pageCount: number; 
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
    if (!user.isApproved) {
      toast({ 
        title: "Account Pending Approval", 
        description: "Your creator account must be approved by an admin before you can edit manga.", 
        variant: "destructive",
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
    ).filter(ch => !(ch._isNew && ch._toBeDeleted)) 
    );
  };
  
  const unmarkChapterForDeletion = (chapterId: string) => {
     setEditableChapters(prev => prev.map(ch =>
      ch.id === chapterId ? { ...ch, _toBeDeleted: false } : ch
    ));
  };


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /></div>;
  }
  
  if (!mangaToEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Cannot Edit Manga</h2>
        <p className="text-muted-foreground">
          The manga could not be loaded for editing, or your account requires approval.
        </p>
         <Button onClick={() => router.push('/creator/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
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
     if (parseInt(freePreviewPageCount, 10) > totalPagesInManga && totalPagesInManga > 0) {
      toast({ title: "Invalid Free Preview", description: "Free preview pages cannot exceed total pages in the manga.", variant: "destructive" });
      return;
    }

    let updatedInvestmentOfferData: MangaInvestmentOffer | undefined = mangaToEdit.investmentOffer;
    if (enableInvestment) {
      if (!sharesOfferedTotalPercent || !totalSharesInOffer || !pricePerShare || !investmentDescription) {
        toast({ title: "Missing Crowdfunding Fields", variant: "destructive" });
        return;
      }
      updatedInvestmentOfferData = {
        ...(mangaToEdit.investmentOffer || {}), 
        sharesOfferedTotalPercent: parseFloat(sharesOfferedTotalPercent),
        totalSharesInOffer: parseInt(totalSharesInOffer, 10),
        pricePerShare: parseFloat(pricePerShare),
        description: investmentDescription,
        minSubscriptionRequirement: minSubscriptionRequirement ? parseInt(minSubscriptionRequirement, 10) : undefined,
        maxSharesPerUser: maxSharesPerUser ? parseInt(maxSharesPerUser, 10) : undefined,
        isActive: true,
      };
    } else if (mangaToEdit.investmentOffer) { 
      updatedInvestmentOfferData = { ...mangaToEdit.investmentOffer, isActive: false };
    }


    const processedChapters: Chapter[] = finalChapters.map((editCh, index) => {
      const pages: MangaPage[] = Array.from({ length: editCh.pageCount }, (_, i) => ({
        id: `${mangaId}-${editCh.id}-page-${i + 1}`.replace('new-', 'ch-'), 
        imageUrl: `https://picsum.photos/800/1200?random=${mangaId}${editCh.id}${i + 1}`,
        altText: `Page ${i + 1}`,
      }));
      return {
        id: editCh._isNew ? `ch-${Date.now()}-${index}` : editCh.id,
        title: editCh.title,
        chapterNumber: index + 1, 
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
      investmentOffer: updatedInvestmentOfferData,
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
    if (!user || !user.isApproved) {
       toast({ title: "Action Denied", description: "Your account needs to be approved to perform this action.", variant: "destructive" });
       return;
    }
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
            <CardTitle className="text-2xl flex items-center" suppressHydrationWarning><Edit3 className="mr-3 h-7 w-7 text-primary"/>编辑漫画系列</CardTitle>
            <CardDescription suppressHydrationWarning>
              修改 "{mangaToEdit.title}" 的详细信息。最多 {MAX_CHAPTERS_PER_WORK} 章，每章 {MAX_PAGES_PER_CHAPTER} 页。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" suppressHydrationWarning>标题 *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary" suppressHydrationWarning>摘要 *</Label>
              <Textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage-edit" suppressHydrationWarning>封面图片 *</Label>
              {coverImage && (
                <div className="mt-2 relative aspect-[2/3] w-full max-w-[200px] rounded-md overflow-hidden border">
                  <Image src={coverImage} alt="封面预览" layout="fill" objectFit="cover" data-ai-hint="manga cover preview edit"/>
                </div>
              )}
              <Button type="button" variant="outline" onClick={() => setCoverImage(`https://picsum.photos/400/600?random=${Date.now()}`)}>
                 <UploadCloud className="mr-2 h-4 w-4" /> 更改封面 (模拟)
              </Button>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>点击按钮以更改封面图片（当前为模拟上传）。</p>
            </div>
            
            <div className="space-y-2">
              <Label suppressHydrationWarning>类型 * (至少选择一个)</Label>
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
               {selectedGenres.length === 0 && <p className="text-xs text-destructive">请至少选择一个类型。</p>}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold" suppressHydrationWarning>章节 ({editableChapters.filter(ch => !ch._toBeDeleted).length}/{MAX_CHAPTERS_PER_WORK})</h3>
                <Button type="button" variant="outline" size="sm" onClick={addChapter} disabled={editableChapters.filter(ch => !ch._toBeDeleted).length >= MAX_CHAPTERS_PER_WORK}>
                  <PlusCircle className="mr-2 h-4 w-4" /> 添加章节
                </Button>
              </div>
              {editableChapters.filter(ch => !ch._toBeDeleted).length === 0 && <p className="text-sm text-muted-foreground">没有活动章节。添加一个或取消删除。</p>}
              <ScrollArea className="max-h-72 space-y-3 pr-3">
                {editableChapters.map((chapter, index) => (
                  <Card key={chapter.id} className={`p-3 ${chapter._toBeDeleted ? 'bg-red-100 dark:bg-red-900/30 opacity-60' : 'bg-secondary/30'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor={`edit-chapter-title-${index}`} className="text-sm font-medium" suppressHydrationWarning>
                        {chapter._isNew ? `新章节 ${index + 1}` : `章节 ${mangaToEdit.chapters.find(c=>c.id===chapter.id)?.chapterNumber || index+1} 标题`}
                        {chapter._toBeDeleted && " (标记为删除)"}
                      </Label>
                      {chapter._toBeDeleted ? (
                         <Button type="button" variant="outline" size="sm" onClick={() => unmarkChapterForDeletion(chapter.id)}>撤销删除</Button>
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
                      placeholder="章节标题"
                      className="mb-2"
                      disabled={chapter._toBeDeleted}
                    />
                    <Label htmlFor={`edit-chapter-pages-${index}`} className="text-sm font-medium" suppressHydrationWarning>页数 (1-{MAX_PAGES_PER_CHAPTER})</Label>
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
                    <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>模拟：更改数量以添加/删除页面。完整的页面管理已简化。</p>
                  </Card>
                ))}
              </ScrollArea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="freePreviewPageCount" suppressHydrationWarning>免费预览页数 * (最多 {totalPagesInManga})</Label>
                <Input id="freePreviewPageCount" type="number" value={freePreviewPageCount} onChange={(e) => setFreePreviewPageCount(e.target.value)} min="0" max={totalPagesInManga > 0 ? totalPagesInManga.toString() : '0'} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriptionPrice" suppressHydrationWarning>订阅价格 (美元/月, 可选)</Label>
                <Input id="subscriptionPrice" type="number" value={subscriptionPrice} onChange={(e) => setSubscriptionPrice(e.target.value)} step="0.01" min="0" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-3">
                <Switch id="enableInvestment-edit" checked={enableInvestment} onCheckedChange={setEnableInvestment} aria-label="启用漫画众筹"/>
                <Label htmlFor="enableInvestment-edit" className="text-base font-medium cursor-pointer" suppressHydrationWarning>启用漫画众筹?</Label>
              </div>
              {enableInvestment && (
                <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                   <h3 className="text-lg font-semibold" suppressHydrationWarning>众筹详情</h3>
                  <div className="space-y-2">
                    <Label htmlFor="investmentDescription-edit" suppressHydrationWarning>众筹描述 *</Label>
                    <Textarea id="investmentDescription-edit" value={investmentDescription} onChange={(e) => setInvestmentDescription(e.target.value)} placeholder="简述本次众筹的目的，以及对支持者的回报承诺。" rows={3} required={enableInvestment} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sharesOfferedTotalPercent-edit" suppressHydrationWarning>支持者总收益分成 (%) *</Label>
                      <Input id="sharesOfferedTotalPercent-edit" type="number" value={sharesOfferedTotalPercent} onChange={(e) => setSharesOfferedTotalPercent(e.target.value)} placeholder="例如: 20" min="1" max="100" required={enableInvestment} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalSharesInOffer-edit" suppressHydrationWarning>众筹总份额 *</Label>
                      <Input id="totalSharesInOffer-edit" type="number" value={totalSharesInOffer} onChange={(e) => setTotalSharesInOffer(e.target.value)} placeholder="例如: 100" min="1" required={enableInvestment} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerShare-edit" suppressHydrationWarning>每份支持金额 (USD) *</Label>
                      <Input id="pricePerShare-edit" type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} placeholder="例如: 10" step="0.01" min="0.01" required={enableInvestment} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minSubscriptionRequirement-edit" suppressHydrationWarning>最低订阅漫画要求 (可选)</Label>
                      <Input id="minSubscriptionRequirement-edit" type="number" value={minSubscriptionRequirement} onChange={(e) => setMinSubscriptionRequirement(e.target.value)} placeholder="例如: 5" min="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSharesPerUser-edit" suppressHydrationWarning>每人最多支持份额 (可选)</Label>
                      <Input id="maxSharesPerUser-edit" type="number" value={maxSharesPerUser} onChange={(e) => setMaxSharesPerUser(e.target.value)} placeholder="例如: 10" min="1" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" /> 删除漫画系列
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 text-destructive"/>您确定吗?</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作无法撤销。这将永久删除漫画系列
                        "{mangaToEdit.title}" 及其所有数据。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteManga} className="bg-destructive hover:bg-destructive/90">
                        是的，删除漫画
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">取消</Button>
            <Button type="submit" className="text-lg py-3 w-full sm:w-auto">保存更改</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

