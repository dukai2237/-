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
import { Edit3, BookUp, PlusCircle, Trash2, AlertTriangle, UploadCloud, Mail, Link as LinkIcon } from 'lucide-react';
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
  
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const coverImageFileRef = useRef<File | null>(null);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [editableChapters, setEditableChapters] = useState<EditableChapterState[]>([]);
  const [freePreviewPageCount, setFreePreviewPageCount] = useState('0');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');

  const [enableCrowdfunding, setEnableCrowdfunding] = useState(false);
  const [sharesOfferedTotalPercent, setSharesOfferedTotalPercent] = useState('');
  const [totalSharesInOffer, setTotalSharesInOffer] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [crowdfundingDescription, setCrowdfundingDescription] = useState('');
  const [minSubscriptionRequirement, setMinSubscriptionRequirement] = useState('');
  const [maxSharesPerUser, setMaxSharesPerUser] = useState('');
  
  const [authorContactEmail, setAuthorContactEmail] = useState('');
  const [authorSocialLinkPlatform, setAuthorSocialLinkPlatform] = useState('');
  const [authorSocialLinkUrl, setAuthorSocialLinkUrl] = useState('');
  const [authorSocialLinks, setAuthorSocialLinks] = useState<{platform: string, url: string}[]>([]);


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
        setCoverImagePreview(fetchedManga.coverImage); // Initialize preview with existing image
        setSelectedGenres(fetchedManga.genres);
        setEditableChapters(fetchedManga.chapters.map(ch => ({
          id: ch.id,
          title: ch.title,
          pageCount: ch.pages.length,
        })));
        setFreePreviewPageCount(fetchedManga.freePreviewPageCount.toString());
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
        } else {
          setEnableCrowdfunding(false);
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
      toast({title: "新封面图片已选择", description: "这只是一个模拟上传预览。保存后生效。"})
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
      toast({ title: "章节已达上限", description: `一部漫画最多只能有 ${MAX_CHAPTERS_PER_WORK} 个章节。`, variant: "destructive" });
      return;
    }
    setEditableChapters([...editableChapters, {
      id: `new-${Date.now()}`,
      title: `新章节 ${activeChapters.length + 1}`,
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
        <h2 className="text-2xl font-semibold mb-2">无法编辑漫画</h2>
        <p className="text-muted-foreground">
          无法加载漫画进行编辑，或您的账号需要审批。
        </p>
         <Button onClick={() => router.push('/creator/dashboard')} className="mt-4">前往控制面板</Button>
      </div>
    );
  }


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !coverImagePreview || selectedGenres.length === 0) {
      toast({ title: "缺少必填项", description: "请填写标题、摘要、封面图片并选择类型。", variant: "destructive" });
      return;
    }
    const finalChapters = editableChapters.filter(ch => !ch._toBeDeleted);
    if (finalChapters.length === 0) {
      toast({ title: "没有章节", description: "漫画必须至少有一个章节。", variant: "destructive" });
      return;
    }
     if (parseInt(freePreviewPageCount, 10) > totalPagesInManga && totalPagesInManga > 0) {
      toast({ title: "免费预览页数无效", description: "免费预览页数不能超过漫画总页数。", variant: "destructive" });
      return;
    }

    let updatedInvestmentOfferData: MangaInvestmentOffer | undefined = mangaToEdit.investmentOffer;
    if (enableCrowdfunding) {
      if (!sharesOfferedTotalPercent || !totalSharesInOffer || !pricePerShare || !crowdfundingDescription) {
        toast({ title: "众筹信息不完整", variant: "destructive" });
        return;
      }
      updatedInvestmentOfferData = {
        ...(mangaToEdit.investmentOffer || {} as MangaInvestmentOffer), // Ensure base object if creating new
        sharesOfferedTotalPercent: parseFloat(sharesOfferedTotalPercent),
        totalSharesInOffer: parseInt(totalSharesInOffer, 10),
        pricePerShare: parseFloat(pricePerShare),
        description: crowdfundingDescription,
        minSubscriptionRequirement: minSubscriptionRequirement ? parseInt(minSubscriptionRequirement, 10) : undefined,
        maxSharesPerUser: maxSharesPerUser ? parseInt(maxSharesPerUser, 10) : undefined,
        isActive: true,
      };
    } else if (mangaToEdit.investmentOffer) { 
      updatedInvestmentOfferData = { ...mangaToEdit.investmentOffer, isActive: false };
    }
    
    const authorDetailsPayload: AuthorContactDetails = {
        email: authorContactEmail || undefined,
        socialLinks: authorSocialLinks.length > 0 ? authorSocialLinks : undefined,
    };


    const processedChapters: Chapter[] = finalChapters.map((editCh, index) => {
      const existingChapterData = mangaToEdit.chapters.find(c => c.id === editCh.id && !editCh._isNew);
      const pages: MangaPage[] = Array.from({ length: editCh.pageCount }, (_, i) => ({
        // Try to reuse existing page IDs if page count hasn't changed drastically, otherwise new IDs
        id: existingChapterData?.pages[i]?.id || `${mangaId}-${editCh.id.replace('new-', 'ch-')}-page-${i + 1}`, 
        imageUrl: existingChapterData?.pages[i]?.imageUrl || `https://picsum.photos/800/1200?random=${mangaId}${editCh.id.replace('new-', 'ch-')}${i + 1}`, // Mock image
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
      coverImage: coverImagePreview, // Use preview as placeholder for new/updated image URL
      genres: selectedGenres,
      chapters: processedChapters,
      freePreviewPageCount: parseInt(freePreviewPageCount, 10) || 0,
      subscriptionPrice: subscriptionPrice ? parseFloat(subscriptionPrice) : undefined,
      investmentOffer: updatedInvestmentOfferData,
      authorDetails: authorDetailsPayload,
    };

    try {
      updateMockMangaData(mangaId, updatedMangaData);
      toast({ title: "漫画已更新!", description: `${title} 已成功更新。` });
      router.push('/creator/dashboard');
    } catch (error) {
      toast({ title: "更新失败", description: "无法更新漫画。", variant: "destructive" });
    }
  };

  const handleDeleteManga = async () => {
    if (!user || !user.isApproved) {
       toast({ title: "操作被拒绝", description: "您的账号需要审批通过才能执行此操作。", variant: "destructive" });
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
              <Label htmlFor="title-edit" suppressHydrationWarning>标题 *</Label>
              <Input id="title-edit" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary-edit" suppressHydrationWarning>摘要 *</Label>
              <Textarea id="summary-edit" value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImageFile-edit" suppressHydrationWarning>封面图片 * (模拟本地上传)</Label>
              <Input id="coverImageFile-edit" type="file" accept="image/*" onChange={handleCoverImageChange} className="text-sm"/>
              {coverImagePreview && (
                <div className="mt-2 relative aspect-[2/3] w-full max-w-[200px] rounded-md overflow-hidden border">
                  <Image src={coverImagePreview} alt="封面预览" layout="fill" objectFit="cover" data-ai-hint="manga cover preview edit"/>
                </div>
              )}
               {!coverImagePreview && mangaToEdit.coverImage && ( // Fallback for initial load before selection
                 <div className="mt-2 relative aspect-[2/3] w-full max-w-[200px] rounded-md overflow-hidden border">
                    <Image src={mangaToEdit.coverImage} alt="当前封面" layout="fill" objectFit="cover" data-ai-hint="manga cover current"/>
                 </div>
              )}
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>选择新的本地图片文件以更改封面。实际应用中会上传到服务器。</p>
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
                <h3 className="text-lg font-semibold" suppressHydrationWarning>章节 ({editableChapters.filter(ch => !ch._toBeDeleted).length}/{MAX_CHAPTERS_PER_WORK})</h3>
                <Button type="button" variant="outline" size="sm" onClick={addChapter} disabled={editableChapters.filter(ch => !ch._toBeDeleted).length >= MAX_CHAPTERS_PER_WORK}>
                  <PlusCircle className="mr-2 h-4 w-4" /> 添加章节
                </Button>
              </div>
              {editableChapters.filter(ch => !ch._toBeDeleted).length === 0 && <p className="text-sm text-muted-foreground">没有活动章节。添加一个或取消已标记为删除的章节。</p>}
              <ScrollArea className="max-h-72 space-y-3 pr-3">
                {editableChapters.map((chapter, index) => (
                  <Card key={chapter.id} className={`p-3 ${chapter._toBeDeleted ? 'bg-red-100 dark:bg-red-900/30 opacity-60' : 'bg-secondary/30'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor={`edit-chapter-title-${index}`} className="text-sm font-medium" suppressHydrationWarning>
                        {chapter._isNew ? `新章节` : `章节 ${mangaToEdit.chapters.find(c=>c.id===chapter.id)?.chapterNumber || index+1}`}
                        {chapter._toBeDeleted && <span className="text-red-600"> (已标记待删除)</span>}
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
                    <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>模拟：更改页数以调整章节长度。实际应用中，您将在此处管理每一页的图片。</p>
                  </Card>
                ))}
              </ScrollArea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="freePreviewPageCount-edit" suppressHydrationWarning>免费预览页数 * (最多 {totalPagesInManga})</Label>
                <Input id="freePreviewPageCount-edit" type="number" value={freePreviewPageCount} onChange={(e) => setFreePreviewPageCount(e.target.value)} min="0" max={totalPagesInManga > 0 ? totalPagesInManga.toString() : '0'} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriptionPrice-edit" suppressHydrationWarning>订阅价格 (美元/月, 可选)</Label>
                <Input id="subscriptionPrice-edit" type="number" value={subscriptionPrice} onChange={(e) => setSubscriptionPrice(e.target.value)} step="0.01" min="0" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-3">
                <Switch id="enableCrowdfunding-edit" checked={enableCrowdfunding} onCheckedChange={setEnableCrowdfunding} aria-label="启用漫画众筹"/>
                <Label htmlFor="enableCrowdfunding-edit" className="text-base font-medium cursor-pointer" suppressHydrationWarning>启用漫画众筹?</Label>
              </div>
              {enableCrowdfunding && (
                <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                   <h3 className="text-lg font-semibold" suppressHydrationWarning>众筹详情</h3>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>通过众筹，您可以让读者成为您作品的支持者，并分享未来的收益。</p>
                  <div className="space-y-2">
                    <Label htmlFor="crowdfundingDescription-edit" suppressHydrationWarning>众筹描述 *</Label>
                    <Textarea id="crowdfundingDescription-edit" value={crowdfundingDescription} onChange={(e) => setCrowdfundingDescription(e.target.value)} placeholder="简述本次众筹的目的，以及对支持者的回报承诺（例如：收益分成、IP权益等）。" rows={3} required={enableCrowdfunding} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sharesOfferedTotalPercent-edit" suppressHydrationWarning>支持者总收益分成 (%) *</Label>
                      <Input id="sharesOfferedTotalPercent-edit" type="number" value={sharesOfferedTotalPercent} onChange={(e) => setSharesOfferedTotalPercent(e.target.value)} placeholder="例如: 20" min="1" max="100" required={enableCrowdfunding} />
                       <p className="text-xs text-muted-foreground">漫画总收益中，用于分配给所有支持者的百分比。</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalSharesInOffer-edit" suppressHydrationWarning>众筹总份数 *</Label>
                      <Input id="totalSharesInOffer-edit" type="number" value={totalSharesInOffer} onChange={(e) => setTotalSharesInOffer(e.target.value)} placeholder="例如: 100" min="1" required={enableCrowdfunding} />
                      <p className="text-xs text-muted-foreground">将“支持者总收益分成”分割成的总份数。</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerShare-edit" suppressHydrationWarning>每份支持金额 (USD) *</Label>
                      <Input id="pricePerShare-edit" type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} placeholder="例如: 10" step="0.01" min="0.01" required={enableCrowdfunding} />
                       <p className="text-xs text-muted-foreground">支持者购买一份所需支付的金额。</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minSubscriptionRequirement-edit" suppressHydrationWarning>最低订阅漫画要求 (可选)</Label>
                      <Input id="minSubscriptionRequirement-edit" type="number" value={minSubscriptionRequirement} onChange={(e) => setMinSubscriptionRequirement(e.target.value)} placeholder="例如: 5" min="0" />
                       <p className="text-xs text-muted-foreground">支持者参与众筹前，需要订阅的漫画数量门槛。</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSharesPerUser-edit" suppressHydrationWarning>每人最多支持份数 (可选)</Label>
                      <Input id="maxSharesPerUser-edit" type="number" value={maxSharesPerUser} onChange={(e) => setMaxSharesPerUser(e.target.value)} placeholder="例如: 10" min="1" />
                      <p className="text-xs text-muted-foreground">限制单个支持者可购买的最大份数。</p>
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
