
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
import { Edit3, BookUp, PlusCircle, Trash2, AlertTriangle, UploadCloud, Mail, Link as LinkIcon, FileImage, RotateCcw, Images, Edit2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { MANGA_GENRES_DETAILS, MAX_CHAPTERS_PER_WORK, MAX_PAGES_PER_CHAPTER } from '@/lib/constants';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  
  const [freePreviewPageCount, setFreePreviewPageCount] = useState('0');
  const [freePreviewChapterCount, setFreePreviewChapterCount] = useState('0');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');

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
      toast({ title: "访问受限", description: "只有创作者才能编辑漫画。", variant: "destructive" });
      router.push('/');
      return;
    }
    if (!user.isApproved) {
      toast({ 
        title: "账号待审批", 
        description: "您的创作者账号需经管理员审批后才能编辑漫画。", 
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
          toast({ title: "访问受限", description: "您只能编辑自己的漫画系列。", variant: "destructive" });
          router.push('/creator/dashboard');
          return;
        }
        setMangaToEdit(fetchedManga);
        setTitle(fetchedManga.title);
        setSummary(fetchedManga.summary);
        setCoverImagePreview(fetchedManga.coverImage); // Keep existing cover initially
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
        setFreePreviewPageCount(fetchedManga.freePreviewPageCount.toString());
        setFreePreviewChapterCount(fetchedManga.freePreviewChapterCount?.toString() || '0');
        setSubscriptionPrice(fetchedManga.subscriptionPrice?.toString() || '');
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

        // Deletion check
        const hasInvestors = fetchedManga.investors && fetchedManga.investors.length > 0;
        const hasPotentialSubscribers = fetchedManga.subscriptionPrice !== undefined && fetchedManga.subscriptionPrice > 0;
        if (hasInvestors || hasPotentialSubscribers) {
          const lastActivityDate = Math.max(
            new Date(fetchedManga.publishedDate).getTime(),
            fetchedManga.lastInvestmentDate ? new Date(fetchedManga.lastInvestmentDate).getTime() : 0,
            fetchedManga.lastSubscriptionDate ? new Date(fetchedManga.lastSubscriptionDate).getTime() : 0
          );
          setIsDeletionAllowed((Date.now() - lastActivityDate) >= ONE_YEAR_IN_MS);
        } else {
          setIsDeletionAllowed(true); // No investors/subs, can delete
        }

      } else {
        toast({ title: "漫画未找到", description: "无法找到要编辑的漫画。", variant: "destructive" });
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
        toast({ title: "信息不完整", description: "请输入平台和链接地址。", variant: "destructive" });
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
      toast({ title: "章节已达上限", variant: "destructive" });
      return;
    }
    const newChapterId = `new-chapter-${Date.now()}`;
    setEditableChapters([...editableChapters, {
      id: newChapterId,
      title: `新章节 ${activeChapters.length + 1}`,
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
          title: "页面数量超出限制", 
          description: `您尝试上传 ${filesToProcess.length} 张图片，但此章节仅剩 ${remainingPageSlots} 个空位 (总共 ${MAX_PAGES_PER_CHAPTER} 页)。已添加允许数量的图片。`, 
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
        <h2 className="text-2xl font-semibold mb-2">漫画未找到</h2>
        <p className="text-muted-foreground">
          无法加载漫画数据或指定的漫画不存在。
        </p>
        <Button onClick={() => router.push('/creator/dashboard')} className="mt-4">
          返回控制面板
        </Button>
      </div>
   );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !summary || (!coverImagePreview && !mangaToEdit.coverImage) || selectedGenres.length === 0) {
      toast({ title: "缺少必填项", description: "标题、摘要、封面图片和类型为必填项。", variant: "destructive" });
      return;
    }
    const finalChaptersState = editableChapters.filter(ch => !ch._toBeDeleted);
    if (finalChaptersState.length === 0) {
      toast({ title: "没有章节", description: "漫画系列必须至少有一个章节。", variant: "destructive" });
      return;
    }
    if (finalChaptersState.some(ch => ch.pages.filter(p => !p._toBeDeleted).length === 0 || ch.pages.filter(p => !p._toBeDeleted).some(p => !p.previewUrl && !p.existingImageUrl))) {
      toast({ title: "章节不完整", description: "所有章节必须至少有一页，并且所有活动页面都必须有图片。", variant: "destructive" });
      return;
    }

    const parsedFreePageCount = parseInt(freePreviewPageCount, 10);
    const parsedFreeChapterCount = parseInt(freePreviewChapterCount, 10);

    if (parsedFreePageCount > totalPagesInManga && totalPagesInManga > 0) {
      toast({ title: "免费预览页数无效", description: "免费预览页数不能超过漫画总页数。", variant: "destructive" });
      return;
    }
    if (parsedFreeChapterCount > totalActiveChapters && totalActiveChapters > 0) {
      toast({ title: "免费预览章节数无效", description: "免费预览章节数不能超过漫画总章节数。",variant: "destructive" });
      return;
    }


    let updatedInvestmentOfferData: MangaInvestmentOffer | undefined = mangaToEdit.investmentOffer;
     if (enableCrowdfunding) { 
        if (!sharesOfferedTotalPercent || !totalSharesInOffer || !pricePerShare || !crowdfundingDescription) {
            toast({ title: "众筹信息不完整", description: "请填写所有众筹详情或关闭此功能。", variant: "destructive" });
            return;
        }
        updatedInvestmentOfferData = {
            ...(mangaToEdit.investmentOffer || {}), // Preserve existing fields like lastDividendPayoutDate
            sharesOfferedTotalPercent: parseFloat(sharesOfferedTotalPercent),
            totalSharesInOffer: parseInt(totalSharesInOffer, 10),
            pricePerShare: parseFloat(pricePerShare),
            description: crowdfundingDescription,
            minSubscriptionRequirement: minSubscriptionRequirement ? parseInt(minSubscriptionRequirement, 10) : undefined,
            maxSharesPerUser: maxSharesPerUser ? parseInt(maxSharesPerUser, 10) : undefined,
            isActive: true, 
            dividendPayoutCycle: dividendPayoutCycle,
        };
     } else if (mangaToEdit.investmentOffer) { 
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

    const updatedMangaData: Partial<MangaSeries> = {
      title,
      summary,
      coverImage: coverImagePreview || mangaToEdit.coverImage, // Use new preview if available, else old one
      genres: selectedGenres,
      chapters: processedChapters,
      freePreviewPageCount: parsedFreePageCount || 0,
      freePreviewChapterCount: parsedFreeChapterCount || 0,
      subscriptionPrice: subscriptionPrice ? parseFloat(subscriptionPrice) : undefined,
      investmentOffer: updatedInvestmentOfferData,
      authorDetails: authorDetailsPayload,
      lastUpdatedDate: new Date().toISOString(),
    };

    try {
      updateMockMangaData(mangaId, updatedMangaData);
      toast({ title: "漫画已更新!", description: `${title} 已成功更新。` });
      router.push('/creator/dashboard');
    } catch (error) {
      console.error("Failed to update manga:", error);
      toast({ title: "更新失败", description: "保存漫画更改时出错。", variant: "destructive" });
    }
  };

  const handleDeleteManga = async () => { 
      if (!mangaToEdit || !isDeletionAllowed) {
        toast({
          title: "删除失败",
          description: !mangaToEdit ? "未找到漫画。" : "此漫画当前不满足删除条件 (可能存在活跃投资或订阅未满一年)。",
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
            <CardTitle className="text-2xl flex items-center" suppressHydrationWarning><Edit3 className="mr-3 h-7 w-7 text-primary"/>编辑漫画系列</CardTitle>
            <CardDescription suppressHydrationWarning>
              修改 "{mangaToEdit?.title}" 的详细信息。最多 {MAX_CHAPTERS_PER_WORK} 章，每章 {MAX_PAGES_PER_CHAPTER} 页。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
              <Label htmlFor="title-edit" suppressHydrationWarning>标题 *</Label>
              <Input id="title-edit" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary-edit" suppressHydrationWarning>摘要 *</Label>
              <Textarea id="summary-edit" value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImageFile-edit" suppressHydrationWarning>封面图片 * (本地上传)</Label>
              <Input id="coverImageFile-edit" type="file" accept="image/*" onChange={handleCoverImageChange} className="text-sm"/>
              {coverImagePreview && (
                <div className="mt-2 relative aspect-[2/3] w-full max-w-[200px] rounded-md overflow-hidden border">
                  <Image src={coverImagePreview} alt="封面预览" layout="fill" objectFit="cover" data-ai-hint="manga cover preview edit"/>
                </div>
              )}
               {!coverImagePreview && mangaToEdit?.coverImage && ( 
                 <div className="mt-2 relative aspect-[2/3] w-full max-w-[200px] rounded-md overflow-hidden border">
                    <Image src={mangaToEdit.coverImage} alt="当前封面" layout="fill" objectFit="cover" data-ai-hint="manga cover current"/>
                 </div>
              )}
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
              <h3 className="text-lg font-semibold" suppressHydrationWarning>作者联系方式 (可选)</h3>
              <div className="space-y-2">
                <Label htmlFor="authorContactEmail-edit" suppressHydrationWarning>联系邮箱</Label>
                <Input id="authorContactEmail-edit" type="email" value={authorContactEmail} onChange={(e) => setAuthorContactEmail(e.target.value)} placeholder="作者的公开联系邮箱" />
              </div>
              <div className="space-y-3">
                <Label suppressHydrationWarning>社交媒体链接</Label>
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
                    <Label htmlFor="socialPlatform-edit" className="text-xs">平台名称</Label>
                    <Input id="socialPlatform-edit" value={authorSocialLinkPlatform} onChange={(e) => setAuthorSocialLinkPlatform(e.target.value)} placeholder="例如：微博, Twitter" />
                  </div>
                  <div className="flex-grow space-y-1">
                     <Label htmlFor="socialUrl-edit" className="text-xs">链接地址</Label>
                    <Input id="socialUrl-edit" value={authorSocialLinkUrl} onChange={(e) => setAuthorSocialLinkUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="shrink-0">
                    <PlusCircle className="mr-1.5 h-4 w-4" /> 添加链接
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold" suppressHydrationWarning>章节 ({totalActiveChapters}/{MAX_CHAPTERS_PER_WORK})</h3>
                <Button type="button" variant="outline" size="sm" onClick={addChapter} disabled={totalActiveChapters >= MAX_CHAPTERS_PER_WORK}>
                  <PlusCircle className="mr-2 h-4 w-4" /> 添加章节
                </Button>
              </div>
              {totalActiveChapters === 0 && <p className="text-sm text-muted-foreground">没有活动章节。</p>}
              <ScrollArea className="max-h-[600px] space-y-3 pr-3">
                {editableChapters.map((chapter, chapterIndex) => {
                  if (chapter._toBeDeleted && !chapter._isNew) { 
                    return (
                      <Card key={chapter.id} className="p-3 bg-red-100 dark:bg-red-900/30 opacity-70">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-red-700 dark:text-red-300">
                            章节 {mangaToEdit?.chapters.find(c => c.id === chapter.id)?.chapterNumber || chapterIndex + 1}: {chapter.title} (已标记待删除)
                          </span>
                          <Button type="button" variant="outline" size="sm" onClick={() => unmarkChapterForDeletion(chapter.id)}>
                            <RotateCcw className="mr-1 h-3.5 w-3.5" /> 撤销删除
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
                          {chapter._isNew ? `新章节` : `章节 ${mangaToEdit?.chapters.find(c=>c.id===chapter.id)?.chapterNumber || chapterIndex+1}`} 标题
                        </Label>
                        <Button type="button" variant="ghost" size="icon" onClick={() => markChapterForDeletion(chapter.id)} className="text-destructive hover:bg-destructive/10 h-7 w-7">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        id={`edit-chapter-title-${chapter.id}`}
                        value={chapter.title}
                        onChange={(e) => updateChapterTitle(chapter.id, e.target.value)}
                        placeholder="章节标题"
                      />
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">
                          页面 ({activePages.length}/{MAX_PAGES_PER_CHAPTER})
                        </Label>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="xs" 
                            onClick={() => triggerPageUploadEdit(chapter.id)}
                            disabled={activePages.length >= MAX_PAGES_PER_CHAPTER}
                          >
                            <Images className="mr-1 h-3 w-3.5" /> 批量添加图片页
                          </Button>
                      </div>
                      {activePages.length === 0 && <p className="text-xs text-muted-foreground">此章节没有页面。点击按钮添加图片。</p>}
                      <div className="space-y-3">
                        {chapter.pages.sort((a,b)=> a.order - b.order).map((page) => { 
                          if (page._toBeDeleted && !page._isNew) {
                            return (
                              <Card key={page.id} className="p-2 bg-red-100 dark:bg-red-900/40 opacity-70">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium text-red-600 dark:text-red-300">
                                    第 {page.order + 1} 页 (已标记待删除)
                                  </span>
                                  <Button type="button" variant="outline" size="xs" onClick={() => unmarkPageForDeletion(chapter.id, page.id)}>
                                     <RotateCcw className="mr-1 h-3 w-3" /> 撤销
                                  </Button>
                                </div>
                              </Card>
                            );
                          }
                          if (page._toBeDeleted && page._isNew) return null;

                          return (
                            <Card key={page.id} className="p-3 bg-background/70">
                              <div className="flex justify-between items-center mb-2">
                                <Label className="text-xs font-medium">第 {page.order + 1} 页图片</Label>
                                <div className="flex items-center gap-1">
                                   <Button type="button" variant="outline" size="xs" onClick={() => triggerSinglePageImageChangeEdit(page.id)}>
                                    <Edit2 className="mr-1 h-3 w-3" /> 更改图片
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
                      </div>
                    </Card>
                  );
                })}
              </ScrollArea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="freePreviewChapterCount-edit" suppressHydrationWarning>免费预览章节数 * (最多 {totalActiveChapters})</Label>
                <Input id="freePreviewChapterCount-edit" type="number" value={freePreviewChapterCount} onChange={(e) => setFreePreviewChapterCount(e.target.value)} min="0" max={totalActiveChapters > 0 ? totalActiveChapters.toString() : '0'} required />
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>设置漫画系列开头有多少章节可以免费阅读。</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="freePreviewPageCount-edit" suppressHydrationWarning>免费预览总页数 * (最多 {totalPagesInManga})</Label>
                <Input id="freePreviewPageCount-edit" type="number" value={freePreviewPageCount} onChange={(e) => setFreePreviewPageCount(e.target.value)} min="0" max={totalPagesInManga > 0 ? totalPagesInManga.toString() : '0'} required />
                 <p className="text-xs text-muted-foreground" suppressHydrationWarning>除了免费章节外，额外可免费阅读的总页数 (在付费章节的开头)。</p>
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="subscriptionPrice-edit" suppressHydrationWarning>订阅价格 (美元/月, 可选)</Label>
                <Input id="subscriptionPrice-edit" type="number" value={subscriptionPrice} onChange={(e) => setSubscriptionPrice(e.target.value)} step="0.01" min="0" />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-3">
                <Switch id="enableCrowdfunding-edit" checked={enableCrowdfunding} onCheckedChange={setEnableCrowdfunding} aria-label="启用漫画众筹"/>
                <Label htmlFor="enableCrowdfunding-edit" className="text-base font-medium cursor-pointer" suppressHydrationWarning>启用漫画众筹?</Label>
              </div>
              {enableCrowdfunding && (
                <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                   <h3 className="text-lg font-semibold" suppressHydrationWarning>众筹详情</h3>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>允许读者投资您的漫画，共享成功果实。</p>
                  <div className="space-y-2">
                    <Label htmlFor="crowdfundingDescription-edit" suppressHydrationWarning>众筹描述 *</Label>
                    <Textarea id="crowdfundingDescription-edit" value={crowdfundingDescription} onChange={(e) => setCrowdfundingDescription(e.target.value)} placeholder="简述众筹目标和投资者回报 (如收益分成比例、IP权益等)。" rows={3} required={enableCrowdfunding} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sharesOfferedTotalPercent-edit" suppressHydrationWarning>投资者总收益分成 (%) *</Label>
                      <Input id="sharesOfferedTotalPercent-edit" type="number" value={sharesOfferedTotalPercent} onChange={(e) => setSharesOfferedTotalPercent(e.target.value)} placeholder="例如: 20%" min="1" max="100" required={enableCrowdfunding} />
                       <p className="text-xs text-muted-foreground">漫画总收益中分配给投资者的比例。</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalSharesInOffer-edit" suppressHydrationWarning>众筹总份数 *</Label>
                      <Input id="totalSharesInOffer-edit" type="number" value={totalSharesInOffer} onChange={(e) => setTotalSharesInOffer(e.target.value)} placeholder="例如: 100份" min="1" required={enableCrowdfunding} />
                      <p className="text-xs text-muted-foreground">将上述收益分成多少份进行众筹。</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerShare-edit" suppressHydrationWarning>每份投资金额 (USD) *</Label>
                      <Input id="pricePerShare-edit" type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} placeholder="例如: 10美元/份" step="0.01" min="0.01" required={enableCrowdfunding} />
                       <p className="text-xs text-muted-foreground">投资者购买一份所需的金额。</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dividendPayoutCycle-edit">分红周期 *</Label>
                        <Select
                            value={dividendPayoutCycle?.toString()}
                            onValueChange={(value) => setDividendPayoutCycle(parseInt(value,10) as MangaInvestmentOffer['dividendPayoutCycle'])}
                            required={enableCrowdfunding}
                        >
                            <SelectTrigger id="dividendPayoutCycle-edit">
                                <SelectValue placeholder="选择分红周期" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">每月</SelectItem>
                                <SelectItem value="3">每季度 (3个月)</SelectItem>
                                <SelectItem value="6">每半年 (6个月)</SelectItem>
                                <SelectItem value="12">每年 (12个月)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">投资者收益的分红频率。</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minSubscriptionRequirement-edit" suppressHydrationWarning>最低订阅漫画要求 (可选)</Label>
                      <Input id="minSubscriptionRequirement-edit" type="number" value={minSubscriptionRequirement} onChange={(e) => setMinSubscriptionRequirement(e.target.value)} placeholder="例如: 5部" min="0" />
                       <p className="text-xs text-muted-foreground">投资者需订阅多少部漫画才能参与。</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSharesPerUser-edit" suppressHydrationWarning>每人最多投资份数 (可选)</Label>
                      <Input id="maxSharesPerUser-edit" type="number" value={maxSharesPerUser} onChange={(e) => setMaxSharesPerUser(e.target.value)} placeholder="例如: 10份" min="1" />
                      <p className="text-xs text-muted-foreground">限制单个投资者可购买的最大份数。</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" className="w-full" disabled={!isDeletionAllowed}>
                      <Trash2 className="mr-2 h-4 w-4" /> 删除漫画系列
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 text-destructive"/>您确定吗?</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作无法撤销。这将永久删除漫画系列
                        "{mangaToEdit?.title}" 及其所有数据。
                         {!isDeletionAllowed && <span className="block mt-2 text-destructive font-semibold">此漫画不满足删除条件 (可能存在活跃投资或订阅未满一年)。</span>}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteManga} disabled={!isDeletionAllowed} className="bg-destructive hover:bg-destructive/90">
                        是的，删除漫画
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                 {!isDeletionAllowed && <p className="text-xs text-muted-foreground mt-2 text-center">此漫画因存在活跃投资/订阅且未满一年，暂时无法删除。</p>}
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

