
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
import type { MangaInvestmentOffer, AuthorContactDetails } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { BookUp, PlusCircle, Trash2, AlertTriangle, UploadCloud, Mail, Link as LinkIcon, FileImage, Images } from 'lucide-react';
import { MANGA_GENRES_DETAILS, MAX_CHAPTERS_PER_WORK, MAX_PAGES_PER_CHAPTER, MAX_WORKS_PER_CREATOR } from '@/lib/constants';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [freePreviewPageCount, setFreePreviewPageCount] = useState('2');
  const [freePreviewChapterCount, setFreePreviewChapterCount] = useState('0');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');

  const [chaptersInput, setChaptersInput] = useState<EditableChapterInput[]>([]);

  const [enableCrowdfunding, setEnableCrowdfunding] = useState(false);
  const [sharesOfferedTotalPercent, setSharesOfferedTotalPercent] = useState('20');
  const [totalSharesInOffer, setTotalSharesInOffer] = useState('100');
  const [pricePerShare, setPricePerShare] = useState('10');
  const [crowdfundingDescription, setCrowdfundingDescription] = useState('');
  const [minSubscriptionRequirement, setMinSubscriptionRequirement] = useState('');
  const [maxSharesPerUser, setMaxSharesPerUser] = useState('');

  const [authorContactEmail, setAuthorContactEmail] = useState(user?.email || '');
  const [authorSocialLinkPlatform, setAuthorSocialLinkPlatform] = useState('');
  const [authorSocialLinkUrl, setAuthorSocialLinkUrl] = useState('');
  const [authorSocialLinks, setAuthorSocialLinks] = useState<{platform: string, url: string}[]>([]);

  const pageUploadInputRef = useRef<HTMLInputElement>(null);
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
      toast({ title: "访问受限", description: "只有创作者才能访问此页面。", variant: "destructive" });
      router.push('/');
      return;
    }
    if (!user.isApproved) {
      toast({ 
        title: "账号待审批", 
        description: "您的创作者账号需经管理员审批后才能创建漫画。", 
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
      toast({title: "封面图片已选择", description: "这只是一个模拟上传预览。实际应用中图片会上传至服务器。"})
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

  const addChapterInput = () => {
    if (chaptersInput.length >= MAX_CHAPTERS_PER_WORK) {
      toast({ title: "章节已达上限", description: `一部漫画最多只能有 ${MAX_CHAPTERS_PER_WORK} 个章节。`, variant: "destructive" });
      return;
    }
    setChaptersInput([...chaptersInput, { 
      localId: `new-chapter-${Date.now()}`, 
      title: `第 ${chaptersInput.length + 1} 章`, 
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
          title: "页面数量超出限制", 
          description: `您尝试上传 ${filesToProcess.length} 张图片，但此章节仅剩 ${remainingPageSlots} 个空位 (总共 ${MAX_PAGES_PER_CHAPTER} 页)。已添加允许数量的图片。`, 
          variant: "destructive",
          duration: 7000
        });
        filesToProcess.splice(remainingPageSlots); // Keep only allowed number of files
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

  // For uploading image to a single, existing blank page slot
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
  };


  if (!user || user.accountType !== 'creator' || !user.isApproved) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">访问受限或账号待审批</h2>
        <p className="text-muted-foreground">
          {user && user.accountType === 'creator' && !user.isApproved 
            ? "您的创作者账号正在等待审批以创建漫画。" 
            : "正在重定向..."}
        </p>
         <Button onClick={() => router.push(user && user.accountType === 'creator' && !user.isApproved ? '/creator/dashboard' : '/')} className="mt-4">
          前往 {user && user.accountType === 'creator' && !user.isApproved ? '控制面板' : '首页'}
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !coverImagePreview || selectedGenres.length === 0) {
      toast({ title: "缺少必填项", description: "请填写标题、摘要、上传封面图片并选择至少一个类型。", variant: "destructive" });
      return;
    }
    if (chaptersInput.length === 0) {
      toast({ title: "没有章节", description: "请至少添加一个章节。", variant: "destructive" });
      return;
    }
    if (chaptersInput.some(ch => ch.pages.length === 0 || ch.pages.some(p => !p.previewUrl))) {
      toast({ title: "章节不完整", description: "所有章节必须至少有一页，并且所有页面都必须上传图片。", variant: "destructive" });
      return;
    }
    const parsedFreePageCount = parseInt(freePreviewPageCount, 10);
    const parsedFreeChapterCount = parseInt(freePreviewChapterCount, 10);

    if (parsedFreePageCount > totalPagesInManga && totalPagesInManga > 0) { 
      toast({ title: "免费预览页数无效", description: "免费预览页数不能超过漫画总页数。", variant: "destructive" });
      return;
    }
    if (parsedFreeChapterCount > chaptersInput.length && chaptersInput.length > 0) {
      toast({ title: "免费预览章节数无效", description: "免费预览章节数不能超过漫画总章节数。", variant: "destructive" });
      return;
    }


    let investmentOfferData: MangaInvestmentOffer | undefined = undefined;
    if (enableCrowdfunding) {
      if (!sharesOfferedTotalPercent || !totalSharesInOffer || !pricePerShare || !crowdfundingDescription) {
        toast({ title: "众筹信息不完整", description: "请填写所有众筹详情或关闭此功能。", variant: "destructive" });
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
      };
    }
    
    const authorDetailsPayload: AuthorContactDetails = {
        email: authorContactEmail || undefined,
        socialLinks: authorSocialLinks.length > 0 ? authorSocialLinks : undefined,
    };

    const newManga = await addMangaSeries({
      title,
      summary,
      coverImage: coverImagePreview, 
      genres: selectedGenres,
      freePreviewPageCount: parsedFreePageCount || 0,
      freePreviewChapterCount: parsedFreeChapterCount || 0,
      subscriptionPrice: subscriptionPrice ? parseFloat(subscriptionPrice) : undefined,
      investmentOffer: investmentOfferData,
      chaptersInput: chaptersInput.map(ch => ({ 
        title: ch.title, 
        pages: ch.pages.map(p => ({ previewUrl: p.previewUrl! /* Already checked for null */ }))
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
            <CardTitle className="text-2xl flex items-center" suppressHydrationWarning><BookUp className="mr-3 h-7 w-7 text-primary" />创建新的漫画系列</CardTitle>
            <CardDescription suppressHydrationWarning>
              填写您的新漫画系列的详细信息。标有 * 的字段为必填项。
              最多可创建 {MAX_WORKS_PER_CREATOR} 部作品，每部作品最多 {MAX_CHAPTERS_PER_WORK} 章，每章最多 {MAX_PAGES_PER_CHAPTER} 页。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" suppressHydrationWarning>标题 *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：银河历险记" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary" suppressHydrationWarning>摘要 *</Label>
              <Textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="您的漫画的简要描述。" rows={4} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImageFile" suppressHydrationWarning>封面图片 * (本地上传)</Label>
              <Input id="coverImageFile" type="file" accept="image/*" onChange={handleCoverImageChange} className="text-sm"/>
              {coverImagePreview && (
                <div className="mt-2 relative aspect-[2/3] w-full max-w-[200px] rounded-md overflow-hidden border">
                  <Image src={coverImagePreview} alt="封面预览" layout="fill" objectFit="cover" data-ai-hint="manga cover preview"/>
                </div>
              )}
              {!coverImagePreview && (
                 <div className="mt-2 flex items-center justify-center aspect-[2/3] w-full max-w-[200px] rounded-md border border-dashed bg-muted/50">
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
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
                        id={`genre-${genre.id}`}
                        checked={selectedGenres.includes(genre.id)}
                        onCheckedChange={() => handleGenreChange(genre.id)}
                      />
                      <Label htmlFor={`genre-${genre.id}`} className="font-normal text-sm cursor-pointer" suppressHydrationWarning>{genre.name}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedGenres.length === 0 && <p className="text-xs text-destructive">请至少选择一个类型。</p>}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold" suppressHydrationWarning>作者联系方式 (可选)</h3>
              <div className="space-y-2">
                <Label htmlFor="authorContactEmail" suppressHydrationWarning>联系邮箱</Label>
                <Input id="authorContactEmail" type="email" value={authorContactEmail} onChange={(e) => setAuthorContactEmail(e.target.value)} placeholder="作者的公开联系邮箱" />
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
                    <Label htmlFor="socialPlatform" className="text-xs">平台名称</Label>
                    <Input id="socialPlatform" value={authorSocialLinkPlatform} onChange={(e) => setAuthorSocialLinkPlatform(e.target.value)} placeholder="例如：微博, Twitter, Bilibili" />
                  </div>
                  <div className="flex-grow space-y-1">
                     <Label htmlFor="socialUrl" className="text-xs">链接地址</Label>
                    <Input id="socialUrl" value={authorSocialLinkUrl} onChange={(e) => setAuthorSocialLinkUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="shrink-0">
                    <PlusCircle className="mr-1.5 h-4 w-4" /> 添加链接
                  </Button>
                </div>
                 <p className="text-xs text-muted-foreground">这些信息将显示在您的漫画详情页，方便读者联系您。</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold" suppressHydrationWarning>章节 ({chaptersInput.length}/{MAX_CHAPTERS_PER_WORK})</h3>
                <Button type="button" variant="outline" size="sm" onClick={addChapterInput} disabled={chaptersInput.length >= MAX_CHAPTERS_PER_WORK}>
                  <PlusCircle className="mr-2 h-4 w-4" /> 添加章节
                </Button>
              </div>
              {chaptersInput.length === 0 && <p className="text-sm text-muted-foreground">尚未添加章节。点击“添加章节”开始。</p>}
              <ScrollArea className="max-h-[500px] space-y-3 pr-3">
                {chaptersInput.map((chapter, chapterIndex) => (
                  <Card key={chapter.localId} className="p-4 bg-secondary/30 space-y-3">
                    <div className="flex justify-between items-center">
                       <Label htmlFor={`chapter-title-${chapter.localId}`} className="text-base font-medium" suppressHydrationWarning>章节 {chapterIndex + 1} 标题</Label>
                       <Button type="button" variant="ghost" size="icon" onClick={() => removeChapterInput(chapter.localId)} className="text-destructive hover:bg-destructive/10 h-7 w-7">
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                    <Input
                      id={`chapter-title-${chapter.localId}`}
                      value={chapter.title}
                      onChange={(e) => updateChapterTitleInput(chapter.localId, e.target.value)}
                      placeholder="例如：开端"
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium" suppressHydrationWarning>页面 ({chapter.pages.length}/{MAX_PAGES_PER_CHAPTER})</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="xs" 
                          onClick={() => triggerPageUpload(chapter.localId)}
                          disabled={chapter.pages.length >= MAX_PAGES_PER_CHAPTER}
                        >
                          <Images className="mr-1 h-3 w-3.5" /> 批量添加图片页
                        </Button>
                    </div>
                     {chapter.pages.length === 0 && <p className="text-xs text-muted-foreground">此章节没有页面。点击按钮添加图片。</p>}
                    <div className="space-y-3">
                      {chapter.pages.map((page, pageIndex) => (
                        <Card key={page.localId} className="p-3 bg-background/70">
                          <div className="flex justify-between items-center mb-2">
                            <Label htmlFor={`page-image-upload-${chapter.localId}-${page.localId}`} className="text-xs font-medium" suppressHydrationWarning>第 {pageIndex + 1} 页图片</Label>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removePageFromChapterInput(chapter.localId, page.localId)} className="text-destructive hover:bg-destructive/10 h-6 w-6">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {!page.previewUrl && !page.file && ( 
                            <Input 
                              id={`page-image-upload-${chapter.localId}-${page.localId}`}
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleSinglePageImageChange(chapter.localId, page.localId, e)} 
                              className="text-xs mb-2"
                            />
                          )}
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
                    </div>
                  </Card>
                ))}
              </ScrollArea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
               <div className="space-y-2">
                <Label htmlFor="freePreviewChapterCount" suppressHydrationWarning>免费预览章节数 * (最多 {chaptersInput.length})</Label>
                <Input id="freePreviewChapterCount" type="number" value={freePreviewChapterCount} onChange={(e) => setFreePreviewChapterCount(e.target.value)} min="0" max={chaptersInput.length > 0 ? chaptersInput.length.toString() : '0'} required />
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>设置漫画系列开头有多少章节可以免费阅读。</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="freePreviewPageCount" suppressHydrationWarning>免费预览总页数 * (最多 {totalPagesInManga})</Label>
                <Input id="freePreviewPageCount" type="number" value={freePreviewPageCount} onChange={(e) => setFreePreviewPageCount(e.target.value)} min="0" max={totalPagesInManga > 0 ? totalPagesInManga.toString() : '0'} required />
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>除了免费章节外，额外可免费阅读的总页数 (在付费章节的开头)。</p>
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="subscriptionPrice" suppressHydrationWarning>订阅价格 (美元/月, 可选)</Label>
                <Input id="subscriptionPrice" type="number" value={subscriptionPrice} onChange={(e) => setSubscriptionPrice(e.target.value)} placeholder="例如：4.99" step="0.01" min="0" />
            </div>


            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-3">
                <Switch id="enableCrowdfunding" checked={enableCrowdfunding} onCheckedChange={setEnableCrowdfunding} aria-label="启用漫画众筹" />
                <Label htmlFor="enableCrowdfunding" className="text-base font-medium cursor-pointer" suppressHydrationWarning>启用漫画众筹?</Label>
              </div>
              {enableCrowdfunding && (
                <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                  <h3 className="text-lg font-semibold" suppressHydrationWarning>众筹详情</h3>
                   <p className="text-sm text-muted-foreground" suppressHydrationWarning>通过众筹，您可以让读者成为您作品的支持者，并分享未来的收益。</p>
                  <div className="space-y-2">
                    <Label htmlFor="crowdfundingDescription" suppressHydrationWarning>众筹描述 *</Label>
                    <Textarea id="crowdfundingDescription" value={crowdfundingDescription} onChange={(e) => setCrowdfundingDescription(e.target.value)} placeholder="简述本次众筹的目的，以及对支持者的回报承诺（例如：收益分成、IP权益等）。" rows={3} required={enableCrowdfunding} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sharesOfferedTotalPercent" suppressHydrationWarning>支持者总收益分成 (%) *</Label>
                      <Input id="sharesOfferedTotalPercent" type="number" value={sharesOfferedTotalPercent} onChange={(e) => setSharesOfferedTotalPercent(e.target.value)} placeholder="例如: 20 (表示总收入的20%将分配给所有支持者)" min="1" max="100" required={enableCrowdfunding} />
                       <p className="text-xs text-muted-foreground">漫画总收益中，用于分配给所有支持者的百分比。</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalSharesInOffer" suppressHydrationWarning>众筹总份数 *</Label>
                      <Input id="totalSharesInOffer" type="number" value={totalSharesInOffer} onChange={(e) => setTotalSharesInOffer(e.target.value)} placeholder="例如: 100 (将上述收益分成分为100份)" min="1" required={enableCrowdfunding} />
                      <p className="text-xs text-muted-foreground">将“支持者总收益分成”分割成的总份数。</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerShare" suppressHydrationWarning>每份支持金额 (USD) *</Label>
                      <Input id="pricePerShare" type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} placeholder="例如: 10 (每份需要支持者支付10美元)" step="0.01" min="0.01" required={enableCrowdfunding} />
                       <p className="text-xs text-muted-foreground">支持者购买一份所需支付的金额。</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minSubscriptionRequirement" suppressHydrationWarning>最低订阅漫画要求 (可选)</Label>
                      <Input id="minSubscriptionRequirement" type="number" value={minSubscriptionRequirement} onChange={(e) => setMinSubscriptionRequirement(e.target.value)} placeholder="例如: 5 (要求支持者至少订阅了5部漫画)" min="0" />
                       <p className="text-xs text-muted-foreground">支持者参与众筹前，需要订阅的漫画数量门槛。</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSharesPerUser" suppressHydrationWarning>每人最多支持份数 (可选)</Label>
                      <Input id="maxSharesPerUser" type="number" value={maxSharesPerUser} onChange={(e) => setMaxSharesPerUser(e.target.value)} placeholder="例如: 10 (每位支持者最多购买10份)" min="1" />
                      <p className="text-xs text-muted-foreground">限制单个支持者可购买的最大份数。</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6">发布漫画系列</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

