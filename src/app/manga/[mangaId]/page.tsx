"use client";
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { getMangaById } from '@/lib/mock-data';
import { ChapterListItem } from '@/components/manga/ChapterListItem';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DollarSign, Gift, TrendingUp, CheckCircle, Landmark, Users, Percent, Info, PiggyBank, Ticket, Mail, Link as LinkIcon, ThumbsUp, ThumbsDown, Meh, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useState, useEffect, use } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MangaSeries } from '@/lib/types';
import { MANGA_GENRES_DETAILS } from '@/lib/constants';

interface MangaDetailPageProps {
  params: { mangaId: string };
}

export default function MangaDetailPage({ params: paramsProp }: MangaDetailPageProps) {
  const resolvedParams = use(paramsProp);
  const mangaId = resolvedParams.mangaId;

  const [manga, setManga] = useState<MangaSeries | undefined>(undefined);
  const { user, isSubscribedToManga, subscribeToManga, donateToManga, investInManga, rateManga } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [donationAmount, setDonationAmount] = useState<string>("");
  const [investmentShares, setInvestmentShares] = useState<string>("");
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false);

  useEffect(() => {
    const currentMangaData = getMangaById(mangaId);
    if (!currentMangaData) {
      notFound();
    }
    setManga(currentMangaData);
  }, [mangaId]);


  useEffect(() => {
    if (!mangaId) return;
    const interval = setInterval(() => {
      const freshMangaData = getMangaById(mangaId);
      if (freshMangaData) {
        setManga(prevManga => {
          if (JSON.stringify(freshMangaData) !== JSON.stringify(prevManga)) {
            return freshMangaData;
          }
          return prevManga;
        });
      } else {
        setManga(undefined);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [mangaId]);


  if (!manga) {
    return <div className="text-center py-10">正在加载漫画详情或漫画未找到...</div>;
  }

  const getGenreName = (genreId: string) => {
    const genreDetail = MANGA_GENRES_DETAILS.find(g => g.id === genreId);
    return genreDetail ? genreDetail.name : genreId;
  };


  const handleSubscribe = async () => {
    if (!user) {
      toast({ title: "需要登录", description: "请登录后订阅。", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>登录</Button> });
      return;
    }
    if (manga.subscriptionPrice) {
      await subscribeToManga(manga.id, manga.title, manga.subscriptionPrice);
    } else {
      toast({ title: "无法订阅", description: "此漫画未设置订阅价格。", variant: "destructive" });
    }
  };

  const handleOpenDonationDialog = () => {
     if (!user) {
      toast({ title: "需要登录", description: "请登录后打赏。", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>登录</Button> });
      return;
    }
    setIsDonationDialogOpen(true);
  }

  const handleDonate = async () => {
    if (!user) return;
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "金额无效", description: "请输入有效的正数金额进行打赏。", variant: "destructive" });
      return;
    }
    const success = await donateToManga(manga.id, manga.title, manga.author.id, amount);
    if (success) {
      setDonationAmount("");
      setIsDonationDialogOpen(false);
    }
  };

  const handleOpenInvestmentDialog = () => {
    if (!user) {
      toast({ title: "需要登录", description: "请登录后投资。", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>登录</Button> });
      return;
    }
     if (!manga.investmentOffer || !manga.investmentOffer.isActive) {
      toast({ title: "投资已关闭", description: "此漫画目前不开放投资。", variant: "destructive" });
      return;
    }
    if (manga.investmentOffer.minSubscriptionRequirement && (!user.subscriptions || user.subscriptions.length < manga.investmentOffer.minSubscriptionRequirement)) {
        toast({ title: "未满足投资要求", description: `您需要至少订阅 ${manga.investmentOffer.minSubscriptionRequirement} 部漫画才能投资。您当前已订阅 ${user.subscriptions?.length || 0} 部。`, variant: "destructive", duration: 7000 });
        return;
    }
    setIsInvestmentDialogOpen(true);
  }

  const handleInvest = async () => {
    if (!user || !manga.investmentOffer) return;
    const shares = parseInt(investmentShares);
    if (isNaN(shares) || shares <= 0) {
      toast({ title: "份数无效", description: "请输入有效的正数份数。", variant: "destructive" });
      return;
    }
    const totalCost = shares * manga.investmentOffer.pricePerShare;
    const success = await investInManga(manga.id, manga.title, shares, manga.investmentOffer.pricePerShare, totalCost);
    if (success) {
      setInvestmentShares("");
      setIsInvestmentDialogOpen(false);
    }
  };

  const handleRating = async (score: 1 | 2 | 3) => {
    if (!user) {
      toast({ title: "需要登录", description: "请登录后评分。", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>登录</Button> });
      return;
    }
    // rateManga function in AuthContext will handle subscription and "rated once" checks.
    await rateManga(manga.id, score);
  };

  const isUserSubscribed = user ? isSubscribedToManga(manga.id) : false;
  const userRating = user?.ratingsGiven?.[manga.id];
  const canRate = user && isUserSubscribed && !userRating;
  const ratingDisabledReason = () => {
    if (!user) return "登录后可评价";
    if (!isUserSubscribed) return "订阅后可评价";
    if (userRating) return `您已评价过 (${userRating}分)`;
    return "";
  };

  const currentInvestmentOffer = manga.investmentOffer;
  const sharesRemaining = currentInvestmentOffer ? currentInvestmentOffer.totalSharesInOffer - manga.investors.reduce((sum, inv) => sum + inv.sharesOwned, 0) : 0;


  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-0 md:p-6 md:flex md:gap-8">
          <div className="md:w-1/3 aspect-[2/3] md:aspect-auto relative">
            <Image
              src={manga.coverImage}
              alt={`Cover of ${manga.title}`}
              width={400}
              height={600}
              className="w-full h-full object-cover md:rounded-lg"
              data-ai-hint="manga cover"
              priority
            />
          </div>
          <div className="md:w-2/3 p-6 md:p-0 flex flex-col">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2" suppressHydrationWarning>{manga.title}</h1>
            <div className="flex items-center gap-3 mb-1 text-muted-foreground">
              <Avatar className="h-10 w-10">
                <AvatarImage src={manga.author.avatarUrl} alt={manga.author.name} data-ai-hint="author avatar" />
                <AvatarFallback suppressHydrationWarning>{manga.author.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-lg font-medium" suppressHydrationWarning>{manga.author.name}</span>
            </div>

            {manga.authorDetails && (manga.authorDetails.email || (manga.authorDetails.socialLinks && manga.authorDetails.socialLinks.length > 0)) && (
              <div className="mb-3 text-sm text-muted-foreground space-y-1">
                {manga.authorDetails.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${manga.authorDetails.email}`} className="hover:text-primary" suppressHydrationWarning>{manga.authorDetails.email}</a>
                  </div>
                )}
                {manga.authorDetails.socialLinks?.map(link => (
                  <div key={link.platform} className="flex items-center gap-1.5">
                    <LinkIcon className="h-4 w-4" />
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary" suppressHydrationWarning>{link.platform}</a>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {manga.genres.map((genreId) => (
                <Badge key={genreId} variant="outline" suppressHydrationWarning>{getGenreName(genreId)}</Badge>
              ))}
            </div>

            <p className="text-sm text-foreground leading-relaxed mb-6" suppressHydrationWarning>{manga.summary}</p>

            <Card className="mb-4 bg-secondary/20">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-md" suppressHydrationWarning>评价这部漫画</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant={userRating === 3 ? "default" : "outline"} size="sm" onClick={() => handleRating(3)} title="好评" disabled={!canRate && userRating !==3}>
                      <ThumbsUp className={`h-4 w-4 mr-1 ${userRating === 3 ? "" : "text-green-500"}`} /> <span suppressHydrationWarning>好评 (3分)</span>
                    </Button>
                    <Button variant={userRating === 2 ? "default" : "outline"} size="sm" onClick={() => handleRating(2)} title="中评" disabled={!canRate && userRating !==2}>
                      <Meh className={`h-4 w-4 mr-1 ${userRating === 2 ? "" : "text-yellow-500"}`} /> <span suppressHydrationWarning>中评 (2分)</span>
                    </Button>
                    <Button variant={userRating === 1 ? "default" : "outline"} size="sm" onClick={() => handleRating(1)} title="差评" disabled={!canRate && userRating !==1}>
                      <ThumbsDown className={`h-4 w-4 mr-1 ${userRating === 1 ? "" : "text-red-500"}`} /> <span suppressHydrationWarning>差评 (1分)</span>
                    </Button>
                  </div>
                  {manga.averageRating !== undefined && manga.ratingCount !== undefined && (
                    <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                      平均分: <span className="font-semibold text-primary">{manga.averageRating.toFixed(1)}</span> ({manga.ratingCount} 评价)
                    </div>
                  )}
                </div>
                {(!canRate && user) && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center">
                    <Lock className="h-3 w-3 mr-1" /> {ratingDisabledReason()}
                  </p>
                )}
                 {!user && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center">
                    <Lock className="h-3 w-3 mr-1" /> 登录并订阅后可评价。
                     <Button variant="link" size="xs" className="p-0 h-auto ml-1" onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>去登录</Button>
                  </p>
                )}
              </CardContent>
            </Card>


            <Card className="mb-6 bg-secondary/30 p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg flex items-center"><Landmark className="mr-2 h-5 w-5 text-primary" /><span suppressHydrationWarning>漫画财务数据 (模拟)</span></CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-sm space-y-1">
                <p suppressHydrationWarning>订阅总收入: <span className="font-semibold">${(manga.totalRevenueFromSubscriptions || 0).toFixed(2)}</span></p>
                <p suppressHydrationWarning>打赏总收入: <span className="font-semibold">${(manga.totalRevenueFromDonations || 0).toFixed(2)}</span></p>
                 <p suppressHydrationWarning>浏览量: <span className="font-semibold">{manga.viewCount.toLocaleString()}</span></p>
              </CardContent>
            </Card>

            <div className="mt-auto space-y-3">
              {manga.subscriptionPrice && (
                <Button
                  onClick={handleSubscribe}
                  className="w-full text-lg py-6"
                  disabled={isUserSubscribed}
                  suppressHydrationWarning
                >
                  {isUserSubscribed ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" /> <span suppressHydrationWarning>已订阅</span>
                    </>
                  ) : (
                    <>
                     <DollarSign className="mr-2 h-5 w-5" /> <span suppressHydrationWarning>订阅 (${manga.subscriptionPrice.toFixed(2)}/月)</span>
                    </>
                  )}
                </Button>
              )}
              <Button onClick={handleOpenDonationDialog} variant="outline" className="w-full text-lg py-6" suppressHydrationWarning>
                <Gift className="mr-2 h-5 w-5" /> <span suppressHydrationWarning>打赏作者</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentInvestmentOffer && currentInvestmentOffer.isActive && (
        <>
          <Separator className="my-8" />
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center" suppressHydrationWarning>
                <TrendingUp className="mr-3 h-7 w-7 text-primary" />
                漫画众筹机会
              </CardTitle>
              <CardDescription suppressHydrationWarning>{currentInvestmentOffer.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold flex items-center" suppressHydrationWarning><Percent className="mr-2 h-4 w-4 text-muted-foreground" />投资者总收益分成 (%):</p>
                  <p className="text-lg text-primary" suppressHydrationWarning>{currentInvestmentOffer.sharesOfferedTotalPercent}%</p>
                </div>
                <div>
                  <p className="font-semibold flex items-center" suppressHydrationWarning><Ticket className="mr-2 h-4 w-4 text-muted-foreground" />众筹总份数:</p>
                  <p className="text-lg" suppressHydrationWarning>{currentInvestmentOffer.totalSharesInOffer}</p>
                </div>
                <div>
                  <p className="font-semibold flex items-center" suppressHydrationWarning><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />每份支持金额:</p>
                  <p className="text-lg" suppressHydrationWarning>${currentInvestmentOffer.pricePerShare.toFixed(2)}</p>
                </div>
                 <div>
                  <p className="font-semibold flex items-center" suppressHydrationWarning><PiggyBank className="mr-2 h-4 w-4 text-muted-foreground" />剩余份数:</p>
                  <p className="text-lg" suppressHydrationWarning>{sharesRemaining > 0 ? sharesRemaining : '已全部认购'}</p>
                </div>
              </div>
               {currentInvestmentOffer.minSubscriptionRequirement && (
                <p className="text-xs text-muted-foreground flex items-center" suppressHydrationWarning>
                  <Info className="mr-1 h-3 w-3"/> 需要订阅 {currentInvestmentOffer.minSubscriptionRequirement} 部漫画系列。
                  {user && user.subscriptions && ` 您已订阅 ${user.subscriptions.length} 部。`}
                </p>
              )}
              {manga.investors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center" suppressHydrationWarning><Users className="mr-2 h-5 w-5 text-muted-foreground"/>当前支持者 ({manga.investors.length}):</h4>
                  <ScrollArea className="max-h-24">
                    <ul className="list-disc list-inside pl-2 text-sm space-y-1">
                      {manga.investors.map(inv => (
                        <li key={inv.userId} suppressHydrationWarning>{inv.userName} ({inv.sharesOwned} 份)</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleOpenInvestmentDialog} className="w-full text-lg py-6" disabled={sharesRemaining <= 0} suppressHydrationWarning>
                <TrendingUp className="mr-2 h-5 w-5" /> 立即支持
              </Button>
            </CardFooter>
          </Card>
        </>
      )}

      <Separator className="my-8" />

      <div>
        <h2 className="text-2xl font-semibold mb-4" suppressHydrationWarning>章节列表</h2>
        {manga.chapters.length > 0 ? (
          <ul className="border rounded-lg overflow-hidden bg-card shadow">
            {manga.chapters.sort((a,b) => a.chapterNumber - b.chapterNumber).map((chapter) => (
              <ChapterListItem key={chapter.id} mangaId={manga.id} chapter={chapter} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground" suppressHydrationWarning>暂无章节。</p>
        )}
      </div>

      <Dialog open={isDonationDialogOpen} onOpenChange={setIsDonationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>打赏 {manga.author.name} 的作品 {manga.title}</DialogTitle>
            <DialogDescription suppressHydrationWarning>
              表达您对创作者的支持！您的打赏 (扣除平台费用后) 将用于支持他们的创作。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="donationAmount" className="text-right" suppressHydrationWarning>金额 ($)</Label>
              <Input
                id="donationAmount"
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                className="col-span-3"
                placeholder="例如：5.00"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" suppressHydrationWarning>取消</Button></DialogClose>
            <Button onClick={handleDonate} suppressHydrationWarning>确认打赏</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {currentInvestmentOffer && (
      <Dialog open={isInvestmentDialogOpen} onOpenChange={setIsInvestmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>支持漫画 {manga.title}</DialogTitle>
            <DialogDescription suppressHydrationWarning>
              购买份数，成为这部漫画成功的支持者。
              每份价格: ${currentInvestmentOffer.pricePerShare.toFixed(2)}。 剩余份数: {sharesRemaining}。
              {currentInvestmentOffer.maxSharesPerUser && ` 每人最多 ${currentInvestmentOffer.maxSharesPerUser} 份。`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="investmentShares" className="text-right" suppressHydrationWarning>份数</Label>
              <Input
                id="investmentShares"
                type="number"
                value={investmentShares}
                onChange={(e) => setInvestmentShares(e.target.value)}
                className="col-span-3"
                placeholder="支持份数"
                min="1"
                max={Math.min(sharesRemaining, currentInvestmentOffer.maxSharesPerUser || sharesRemaining).toString()}
              />
            </div>
            {investmentShares && parseInt(investmentShares) > 0 && (
              <p className="text-sm text-center text-muted-foreground col-span-4" suppressHydrationWarning>
                总计费用: {parseInt(investmentShares)} 份 * ${currentInvestmentOffer.pricePerShare.toFixed(2)} =
                <span className="font-semibold text-primary"> ${(parseInt(investmentShares) * currentInvestmentOffer.pricePerShare).toFixed(2)}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" suppressHydrationWarning>取消</Button></DialogClose>
            <Button onClick={handleInvest} disabled={!investmentShares || parseInt(investmentShares) <=0 || parseInt(investmentShares) > sharesRemaining} suppressHydrationWarning>确认支持</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
