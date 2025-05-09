
"use client";

import { useState, type FormEvent, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { MangaInvestmentOffer } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { BookUp, PlusCircle, Trash2, AlertTriangle, UploadCloud } from 'lucide-react';
import { MANGA_GENRES_DETAILS, MAX_CHAPTERS_PER_WORK, MAX_PAGES_PER_CHAPTER, MAX_WORKS_PER_CREATOR } from '@/lib/constants';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditableChapterInput {
  localId: string; 
  title: string;
  pageCount: number;
}

export default function CreateMangaPage() {
  const { user, addMangaSeries } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState(`https://picsum.photos/400/600?random=${Date.now()}`);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [freePreviewPageCount, setFreePreviewPageCount] = useState('2');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');

  const [chaptersInput, setChaptersInput] = useState<EditableChapterInput[]>([]);

  const [enableInvestment, setEnableInvestment] = useState(false);
  const [sharesOfferedTotalPercent, setSharesOfferedTotalPercent] = useState('20');
  const [totalSharesInOffer, setTotalSharesInOffer] = useState('100');
  const [pricePerShare, setPricePerShare] = useState('10');
  const [investmentDescription, setInvestmentDescription] = useState('');
  const [minSubscriptionRequirement, setMinSubscriptionRequirement] = useState('');
  const [maxSharesPerUser, setMaxSharesPerUser] = useState('');

  const totalPagesInManga = useMemo(() => {
    return chaptersInput.reduce((sum, ch) => sum + ch.pageCount, 0);
  }, [chaptersInput]);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/creator/create-manga');
      return;
    }
    if (user.accountType !== 'creator') {
      toast({ title: "Access Denied", description: "Only creators can access this page.", variant: "destructive" });
      router.push('/');
      return;
    }
    if (!user.isApproved) {
      toast({ 
        title: "Account Pending Approval", 
        description: "Your creator account must be approved by an admin before you can create manga.", 
        variant: "destructive",
        duration: 7000
      });
      router.push('/creator/dashboard'); 
      return;
    }
  }, [user, router, toast]);

  const handleGenreChange = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(g => g !== genreId) : [...prev, genreId]
    );
  };

  const addChapterInput = () => {
    if (chaptersInput.length >= MAX_CHAPTERS_PER_WORK) {
      toast({ title: "Chapter Limit Reached", description: `A manga can have at most ${MAX_CHAPTERS_PER_WORK} chapters.`, variant: "destructive" });
      return;
    }
    setChaptersInput([...chaptersInput, { localId: `new-${Date.now()}`, title: `Chapter ${chaptersInput.length + 1}`, pageCount: 10 }]);
  };

  const updateChapterInput = (localId: string, field: keyof EditableChapterInput, value: string | number) => {
    setChaptersInput(chaptersInput.map(ch =>
      ch.localId === localId ? { ...ch, [field]: field === 'pageCount' ? Math.max(1, Math.min(Number(value), MAX_PAGES_PER_CHAPTER)) : value } : ch
    ));
  };

  const removeChapterInput = (localId: string) => {
    setChaptersInput(chaptersInput.filter(ch => ch.localId !== localId));
  };


  if (!user || user.accountType !== 'creator' || !user.isApproved) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Access Denied or Pending Approval</h2>
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
    if (!title || !summary || !coverImage || selectedGenres.length === 0) {
      toast({ title: "Missing Fields", description: "Please fill in title, summary, cover image, and select at least one genre.", variant: "destructive" });
      return;
    }
    if (chaptersInput.length === 0) {
      toast({ title: "No Chapters", description: "Please add at least one chapter.", variant: "destructive" });
      return;
    }
    if (parseInt(freePreviewPageCount, 10) > totalPagesInManga && totalPagesInManga > 0) { 
      toast({ title: "Invalid Free Preview", description: "Free preview pages cannot exceed total pages in the manga.", variant: "destructive" });
      return;
    }


    let investmentOfferData: MangaInvestmentOffer | undefined = undefined;
    if (enableInvestment) {
      if (!sharesOfferedTotalPercent || !totalSharesInOffer || !pricePerShare || !investmentDescription) {
        toast({ title: "Missing Crowdfunding Fields", description: "Please fill all crowdfunding details or disable it.", variant: "destructive" });
        return;
      }
      investmentOfferData = {
        sharesOfferedTotalPercent: parseFloat(sharesOfferedTotalPercent),
        totalSharesInOffer: parseInt(totalSharesInOffer, 10),
        pricePerShare: parseFloat(pricePerShare),
        description: investmentDescription,
        minSubscriptionRequirement: minSubscriptionRequirement ? parseInt(minSubscriptionRequirement, 10) : undefined,
        maxSharesPerUser: maxSharesPerUser ? parseInt(maxSharesPerUser, 10) : undefined,
        isActive: true,
      };
    }

    const newManga = await addMangaSeries({
      title,
      summary,
      coverImage,
      genres: selectedGenres,
      freePreviewPageCount: parseInt(freePreviewPageCount, 10) || 0,
      subscriptionPrice: subscriptionPrice ? parseFloat(subscriptionPrice) : undefined,
      investmentOffer: investmentOfferData,
      chaptersInput: chaptersInput.map(ch => ({ title: ch.title, pageCount: ch.pageCount })),
    });

    if (newManga) {
      router.push('/creator/dashboard');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center" suppressHydrationWarning><BookUp className="mr-3 h-7 w-7 text-primary" />创建新的漫画系列</CardTitle>
            <CardDescription suppressHydrationWarning>
              填写您的新漫画系列的详细信息。标有 * 的字段为必填项。
              最多 {MAX_WORKS_PER_CREATOR} 部作品，每部作品 {MAX_CHAPTERS_PER_WORK} 章，每章 {MAX_PAGES_PER_CHAPTER} 页。
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
              <Label htmlFor="coverImage" suppressHydrationWarning>封面图片 *</Label>
              {coverImage && (
                <div className="mt-2 relative aspect-[2/3] w-full max-w-[200px] rounded-md overflow-hidden border">
                  <Image src={coverImage} alt="封面预览" layout="fill" objectFit="cover" data-ai-hint="manga cover preview"/>
                </div>
              )}
              <Button type="button" variant="outline" onClick={() => setCoverImage(`https://picsum.photos/400/600?random=${Date.now()}`)}>
                <UploadCloud className="mr-2 h-4 w-4" /> 上传封面 (模拟)
              </Button>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>点击按钮以上传封面图片（当前为模拟上传）。</p>
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
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold" suppressHydrationWarning>章节 ({chaptersInput.length}/{MAX_CHAPTERS_PER_WORK})</h3>
                <Button type="button" variant="outline" size="sm" onClick={addChapterInput} disabled={chaptersInput.length >= MAX_CHAPTERS_PER_WORK}>
                  <PlusCircle className="mr-2 h-4 w-4" /> 添加章节
                </Button>
              </div>
              {chaptersInput.length === 0 && <p className="text-sm text-muted-foreground">尚未添加章节。点击“添加章节”开始。</p>}
              <ScrollArea className="max-h-60 space-y-3 pr-3">
                {chaptersInput.map((chapter, index) => (
                  <Card key={chapter.localId} className="p-3 bg-secondary/30">
                    <div className="flex justify-between items-center mb-2">
                       <Label htmlFor={`chapter-title-${index}`} className="text-sm font-medium" suppressHydrationWarning>章节 {index + 1} 标题</Label>
                       <Button type="button" variant="ghost" size="icon" onClick={() => removeChapterInput(chapter.localId)} className="text-destructive hover:bg-destructive/10 h-7 w-7">
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                    <Input
                      id={`chapter-title-${index}`}
                      value={chapter.title}
                      onChange={(e) => updateChapterInput(chapter.localId, 'title', e.target.value)}
                      placeholder="例如：开端"
                      className="mb-2"
                    />
                    <Label htmlFor={`chapter-pages-${index}`} className="text-sm font-medium" suppressHydrationWarning>页数 (1-{MAX_PAGES_PER_CHAPTER})</Label>
                    <Input
                      id={`chapter-pages-${index}`}
                      type="number"
                      value={chapter.pageCount}
                      onChange={(e) => updateChapterInput(chapter.localId, 'pageCount', parseInt(e.target.value, 10))}
                      min="1"
                      max={MAX_PAGES_PER_CHAPTER.toString()}
                      className="w-full"
                    />
                     <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>页面图片将进行模拟。在实际应用中，您将在此处上传文件。</p>
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
                <Input id="subscriptionPrice" type="number" value={subscriptionPrice} onChange={(e) => setSubscriptionPrice(e.target.value)} placeholder="例如：4.99" step="0.01" min="0" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-3">
                <Switch id="enableInvestment" checked={enableInvestment} onCheckedChange={setEnableInvestment} aria-label="启用漫画众筹" />
                <Label htmlFor="enableInvestment" className="text-base font-medium cursor-pointer" suppressHydrationWarning>启用漫画众筹?</Label>
              </div>
              {enableInvestment && (
                <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                  <h3 className="text-lg font-semibold" suppressHydrationWarning>众筹详情</h3>
                  <div className="space-y-2">
                    <Label htmlFor="investmentDescription" suppressHydrationWarning>众筹描述 *</Label>
                    <Textarea id="investmentDescription" value={investmentDescription} onChange={(e) => setInvestmentDescription(e.target.value)} placeholder="简述本次众筹的目的，以及对支持者的回报承诺。" rows={3} required={enableInvestment} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sharesOfferedTotalPercent" suppressHydrationWarning>支持者总收益分成 (%) *</Label>
                      <Input id="sharesOfferedTotalPercent" type="number" value={sharesOfferedTotalPercent} onChange={(e) => setSharesOfferedTotalPercent(e.target.value)} placeholder="例如: 20" min="1" max="100" required={enableInvestment} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalSharesInOffer" suppressHydrationWarning>众筹总份额 *</Label>
                      <Input id="totalSharesInOffer" type="number" value={totalSharesInOffer} onChange={(e) => setTotalSharesInOffer(e.target.value)} placeholder="例如: 100" min="1" required={enableInvestment} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerShare" suppressHydrationWarning>每份支持金额 (USD) *</Label>
                      <Input id="pricePerShare" type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} placeholder="例如: 10" step="0.01" min="0.01" required={enableInvestment} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minSubscriptionRequirement" suppressHydrationWarning>最低订阅漫画要求 (可选)</Label>
                      <Input id="minSubscriptionRequirement" type="number" value={minSubscriptionRequirement} onChange={(e) => setMinSubscriptionRequirement(e.target.value)} placeholder="例如: 5" min="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSharesPerUser" suppressHydrationWarning>每人最多支持份额 (可选)</Label>
                      <Input id="maxSharesPerUser" type="number" value={maxSharesPerUser} onChange={(e) => setMaxSharesPerUser(e.target.value)} placeholder="例如: 10" min="1" />
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

