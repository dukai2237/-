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
import { DollarSign, Gift, TrendingUp, CheckCircle, Landmark, Users, Percent, Info, PiggyBank, Ticket, Mail, Link as LinkIcon, ThumbsUp, ThumbsDown, Meh, Lock, Heart, Edit2 } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';


interface MangaDetailPageProps {
  params: { mangaId: string };
}

export default function MangaDetailPage({ params: paramsProp }: MangaDetailPageProps) {
  const resolvedParams = use(paramsProp);
  const mangaId = resolvedParams.mangaId;

  const [manga, setManga] = useState<MangaSeries | undefined>(undefined);
  const { user, isSubscribedToManga, subscribeToManga, donateToManga, investInManga, rateManga, isFavorited, toggleFavorite } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [donationAmount, setDonationAmount] = useState<string>("");
  const [investmentShares, setInvestmentShares] = useState<string>("");
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false);

  useEffect(() => {
    const currentMangaData = getMangaById(mangaId);
    if (!currentMangaData || !currentMangaData.isPublished) { // Also check if published
      // Defer notFound until after a short period to allow for mock data updates.
      // This is a workaround for the mock data setup.
      // In a real app, you'd likely get null/undefined immediately from a DB if not found or not published.
      setTimeout(() => {
        const freshCheck = getMangaById(mangaId);
        if(!freshCheck || !freshCheck.isPublished) {
          notFound();
        }
      }, 200); // Adjust delay as needed
    }
    setManga(currentMangaData);
  }, [mangaId]);


  useEffect(() => {
    if (!mangaId) return;
    const interval = setInterval(() => {
      const freshMangaData = getMangaById(mangaId);
      if (freshMangaData && freshMangaData.isPublished) { // Only update if published
        setManga(prevManga => {
          if (JSON.stringify(freshMangaData) !== JSON.stringify(prevManga)) {
            return freshMangaData;
          }
          return prevManga;
        });
      } else {
        // If it becomes unpublished or deleted, and we are on its page, it should ideally redirect or show not found.
        // For now, if it was already set, we keep showing it. A stricter check might navigate away.
        if (manga && (!freshMangaData || !freshMangaData.isPublished)) {
           // Potentially call notFound() here if strict behavior is desired
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [mangaId, manga]); // Added manga to dependencies to re-evaluate if manga becomes undefined


  if (!manga) {
    if(mangaId) {
        // Wait a moment before calling notFound in case data is loading
        // This is primarily for the mock data scenario
        // In a real app, this might be handled by a loading state from a fetch
    }
    return <div className="text-center py-10">Loading manga details or manga not found/unpublished...</div>;
  }

  const getGenreName = (genreId: string) => {
    const genreDetail = MANGA_GENRES_DETAILS.find(g => g.id === genreId);
    return genreDetail ? genreDetail.name : genreId;
  };


  const handleSubscribe = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to subscribe.", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>Login</Button> });
      return;
    }
    if (manga.subscriptionPrice) {
      await subscribeToManga(manga.id, manga.title, manga.subscriptionPrice);
    } else {
      toast({ title: "Cannot Subscribe", description: "This manga has no subscription price set.", variant: "destructive" });
    }
  };

  const handleOpenDonationDialog = () => {
     if (!user) {
      toast({ title: "Login Required", description: "Please login to donate.", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>Login</Button> });
      return;
    }
    setIsDonationDialogOpen(true);
  }

  const handleDonate = async () => {
    if (!user) return;
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount to donate.", variant: "destructive" });
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
      toast({ title: "Login Required", description: "Please login to invest.", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>Login</Button> });
      return;
    }
     if (!manga.investmentOffer || !manga.investmentOffer.isActive) {
      toast({ title: "Investment Closed", description: "This manga is not currently open for investment.", variant: "destructive" });
      return;
    }
    if (manga.investmentOffer.minSubscriptionRequirement && (!user.subscriptions || user.subscriptions.length < manga.investmentOffer.minSubscriptionRequirement)) {
        toast({ title: "Investment Requirement Not Met", description: `You need to subscribe to at least ${manga.investmentOffer.minSubscriptionRequirement} manga to invest. You currently have ${user.subscriptions?.length || 0} subscriptions.`, variant: "destructive", duration: 7000 });
        return;
    }
    setIsInvestmentDialogOpen(true);
  }

  const handleInvest = async () => {
    if (!user || !manga.investmentOffer) return;
    const shares = parseInt(investmentShares);
    if (isNaN(shares) || shares <= 0) {
      toast({ title: "Invalid Shares", description: "Please enter a valid positive number of shares.", variant: "destructive" });
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
      toast({ title: "Login Required", description: "Please login to rate.", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>Login</Button> });
      return;
    }
    await rateManga(manga.id, score);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(manga.id, manga.title);
  };

  const isUserSubscribed = user ? isSubscribedToManga(manga.id) : false;
  const userRating = user?.ratingsGiven?.[manga.id];
  const canRate = user && isUserSubscribed && !userRating; // User must be subscribed and not have rated yet
  const ratingDisabledReason = () => {
    if (!user) return "Login to rate";
    if (!isUserSubscribed) return "Subscribe to rate";
    if (userRating) return `You've already rated (${userRating}/3)`;
    return "";
  };
  const userHasFavorited = user ? isFavorited(manga.id) : false;

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
            <div className="flex justify-between items-start">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2" suppressHydrationWarning>{manga.title}</h1>
                {user && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleFavorite}
                        className="text-muted-foreground hover:text-primary"
                        title={userHasFavorited ? "Remove from Favorites" : "Add to Favorites"}
                        suppressHydrationWarning
                    >
                        <Heart className={`h-7 w-7 ${userHasFavorited ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-3 mb-1 text-muted-foreground">
              <Avatar className="h-10 w-10">
                <AvatarImage src={manga.author.avatarUrl} alt={manga.author.name} data-ai-hint="author avatar" />
                <AvatarFallback suppressHydrationWarning>{manga.author.name?.[0]}</AvatarFallback>
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
             {manga.lastChapterUpdateInfo && (
                <Card className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
                    <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-md flex items-center text-blue-700 dark:text-blue-300">
                            <Edit2 className="mr-2 h-4 w-4"/>Recent Update
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 text-sm text-blue-600 dark:text-blue-400">
                        <p suppressHydrationWarning>
                            Chapter {manga.lastChapterUpdateInfo.chapterNumber} ("{manga.lastChapterUpdateInfo.chapterTitle}") updated on {new Date(manga.lastChapterUpdateInfo.date).toLocaleDateString()}.
                            {manga.lastChapterUpdateInfo.pagesAdded > 0 && ` ${manga.lastChapterUpdateInfo.pagesAdded} new page(s) added.`}
                            Now {manga.lastChapterUpdateInfo.newTotalPagesInChapter} total pages.
                        </p>
                    </CardContent>
                </Card>
            )}


            <p className="text-sm text-foreground leading-relaxed mb-6" suppressHydrationWarning>{manga.summary}</p>

            <Card className="mb-4 bg-secondary/20">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-md" suppressHydrationWarning>Rate This Manga</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant={userRating === 3 ? "default" : "outline"} size="sm" onClick={() => handleRating(3)} title="Good (3 points)" disabled={!canRate && userRating !==3}>
                      <ThumbsUp className={`h-4 w-4 mr-1 ${userRating === 3 ? "" : "text-green-500"}`} /> <span suppressHydrationWarning>Good (3)</span>
                    </Button>
                    <Button variant={userRating === 2 ? "default" : "outline"} size="sm" onClick={() => handleRating(2)} title="Okay (2 points)" disabled={!canRate && userRating !==2}>
                      <Meh className={`h-4 w-4 mr-1 ${userRating === 2 ? "" : "text-yellow-500"}`} /> <span suppressHydrationWarning>Okay (2)</span>
                    </Button>
                    <Button variant={userRating === 1 ? "default" : "outline"} size="sm" onClick={() => handleRating(1)} title="Bad (1 point)" disabled={!canRate && userRating !==1}>
                      <ThumbsDown className={`h-4 w-4 mr-1 ${userRating === 1 ? "" : "text-red-500"}`} /> <span suppressHydrationWarning>Bad (1)</span>
                    </Button>
                  </div>
                  {manga.averageRating !== undefined && manga.ratingCount !== undefined && (
                    <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                      Avg: <span className="font-semibold text-primary">{manga.averageRating.toFixed(1)}</span> ({manga.ratingCount} ratings)
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
                    <Lock className="h-3 w-3 mr-1" /> Login and subscribe to rate.
                     <Button variant="link" size="xs" className="p-0 h-auto ml-1" onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>Login</Button>
                  </p>
                )}
              </CardContent>
            </Card>


            <Card className="mb-6 bg-secondary/30 p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg flex items-center"><Landmark className="mr-2 h-5 w-5 text-primary" /><span suppressHydrationWarning>Manga Financials (Simulated)</span></CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-sm space-y-1">
                <p suppressHydrationWarning>Total Subscription Revenue: <span className="font-semibold">${(manga.totalRevenueFromSubscriptions || 0).toFixed(2)}</span></p>
                <p suppressHydrationWarning>Total Donation Revenue: <span className="font-semibold">${(manga.totalRevenueFromDonations || 0).toFixed(2)}</span></p>
                 <p suppressHydrationWarning>Views: <span className="font-semibold">{manga.viewCount.toLocaleString()}</span></p>
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
                      <CheckCircle className="mr-2 h-5 w-5" /> <span suppressHydrationWarning>Subscribed</span>
                    </>
                  ) : (
                    <>
                     <DollarSign className="mr-2 h-5 w-5" /> <span suppressHydrationWarning>Subscribe (${manga.subscriptionPrice.toFixed(2)}/month)</span>
                    </>
                  )}
                </Button>
              )}
              <Button onClick={handleOpenDonationDialog} variant="outline" className="w-full text-lg py-6" suppressHydrationWarning>
                <Gift className="mr-2 h-5 w-5" /> <span suppressHydrationWarning>Donate to Author</span>
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
                Manga Crowdfunding Opportunity
              </CardTitle>
              <CardDescription suppressHydrationWarning>{currentInvestmentOffer.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold flex items-center" suppressHydrationWarning><Percent className="mr-2 h-4 w-4 text-muted-foreground" />Investor Total Revenue Share:</p>
                  <p className="text-lg text-primary" suppressHydrationWarning>{currentInvestmentOffer.sharesOfferedTotalPercent}%</p>
                </div>
                <div>
                  <p className="font-semibold flex items-center" suppressHydrationWarning><Ticket className="mr-2 h-4 w-4 text-muted-foreground" />Total Shares in Crowdfunding:</p>
                  <p className="text-lg" suppressHydrationWarning>{currentInvestmentOffer.totalSharesInOffer}</p>
                </div>
                <div>
                  <p className="font-semibold flex items-center" suppressHydrationWarning><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />Investment Amount per Share:</p>
                  <p className="text-lg" suppressHydrationWarning>${currentInvestmentOffer.pricePerShare.toFixed(2)}</p>
                </div>
                 <div>
                  <p className="font-semibold flex items-center" suppressHydrationWarning><PiggyBank className="mr-2 h-4 w-4 text-muted-foreground" />Shares Remaining:</p>
                  <p className="text-lg" suppressHydrationWarning>{sharesRemaining > 0 ? sharesRemaining : 'Fully Subscribed'}</p>
                </div>
                 <div>
                  <p className="font-semibold flex items-center" suppressHydrationWarning><Info className="mr-2 h-4 w-4 text-muted-foreground" />Dividend Payout Cycle:</p>
                  <p className="text-lg" suppressHydrationWarning>
                    {currentInvestmentOffer.dividendPayoutCycle === 1 && "Monthly"}
                    {currentInvestmentOffer.dividendPayoutCycle === 3 && "Quarterly"}
                    {currentInvestmentOffer.dividendPayoutCycle === 6 && "Semi-Annually"}
                    {currentInvestmentOffer.dividendPayoutCycle === 12 && "Annually"}
                    {!currentInvestmentOffer.dividendPayoutCycle && "Not Set"}
                  </p>
                </div>
              </div>
               {currentInvestmentOffer.minSubscriptionRequirement && (
                <p className="text-xs text-muted-foreground flex items-center" suppressHydrationWarning>
                  <Info className="mr-1 h-3 w-3"/> Requires subscribing to {currentInvestmentOffer.minSubscriptionRequirement} manga series.
                  {user && user.subscriptions && ` You are subscribed to ${user.subscriptions.length}.`}
                </p>
              )}
              {manga.investors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center" suppressHydrationWarning><Users className="mr-2 h-5 w-5 text-muted-foreground"/>Current Backers ({manga.investors.length}):</h4>
                  <ScrollArea className="max-h-24">
                    <ul className="list-disc list-inside pl-2 text-sm space-y-1">
                      {manga.investors.map(inv => (
                        <li key={inv.userId} suppressHydrationWarning>{inv.userName} ({inv.sharesOwned} shares)</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleOpenInvestmentDialog} className="w-full text-lg py-6" disabled={sharesRemaining <= 0} suppressHydrationWarning>
                <TrendingUp className="mr-2 h-5 w-5" /> Invest Now
              </Button>
            </CardFooter>
          </Card>
        </>
      )}

      <Separator className="my-8" />

      <div>
        <h2 className="text-2xl font-semibold mb-4" suppressHydrationWarning>Chapter List</h2>
        {manga.chapters.length > 0 ? (
          <ul className="border rounded-lg overflow-hidden bg-card shadow">
            {manga.chapters.sort((a,b) => a.chapterNumber - b.chapterNumber).map((chapter) => (
              <ChapterListItem key={chapter.id} mangaId={manga.id} chapter={chapter} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground" suppressHydrationWarning>No chapters available yet.</p>
        )}
      </div>

      <Dialog open={isDonationDialogOpen} onOpenChange={setIsDonationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>Donate to {manga.author.name} for {manga.title}</DialogTitle>
            <DialogDescription suppressHydrationWarning>
              Show your support for the creator! Your donation (after platform fees) will help them continue their work.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="donationAmount" className="text-right" suppressHydrationWarning>Amount ($)</Label>
              <Input
                id="donationAmount"
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 5.00"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" suppressHydrationWarning>Cancel</Button></DialogClose>
            <Button onClick={handleDonate} suppressHydrationWarning>Confirm Donation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {currentInvestmentOffer && (
      <Dialog open={isInvestmentDialogOpen} onOpenChange={setIsInvestmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>Invest in {manga.title}</DialogTitle>
            <DialogDescription suppressHydrationWarning>
              Purchase shares and become a backer of this manga's success.
              Price per share: ${currentInvestmentOffer.pricePerShare.toFixed(2)}. Shares remaining: {sharesRemaining}.
              {currentInvestmentOffer.maxSharesPerUser && ` Max ${currentInvestmentOffer.maxSharesPerUser} shares per person.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="investmentShares" className="text-right" suppressHydrationWarning>Shares</Label>
              <Input
                id="investmentShares"
                type="number"
                value={investmentShares}
                onChange={(e) => setInvestmentShares(e.target.value)}
                className="col-span-3"
                placeholder="Number of shares"
                min="1"
                max={Math.min(sharesRemaining, currentInvestmentOffer.maxSharesPerUser || sharesRemaining).toString()}
              />
            </div>
            {investmentShares && parseInt(investmentShares) > 0 && (
              <p className="text-sm text-center text-muted-foreground col-span-4" suppressHydrationWarning>
                Total Cost: {parseInt(investmentShares)} shares * ${currentInvestmentOffer.pricePerShare.toFixed(2)} =
                <span className="font-semibold text-primary"> ${(parseInt(investmentShares) * currentInvestmentOffer.pricePerShare).toFixed(2)}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" suppressHydrationWarning>Cancel</Button></DialogClose>
            <Button onClick={handleInvest} disabled={!investmentShares || parseInt(investmentShares) <=0 || parseInt(investmentShares) > sharesRemaining} suppressHydrationWarning>Confirm Investment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
