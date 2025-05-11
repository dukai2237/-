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
import { DollarSign, Gift, TrendingUp, CheckCircle, Landmark, Users, Percent, Info, PiggyBank, Ticket, Mail, Link as LinkIcon, ThumbsUp, ThumbsDown, Meh, Lock, Heart, Edit2, Share2 } from 'lucide-react';
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
import dynamic from 'next/dynamic';
import { ShareMangaDialog } from '@/components/manga/ShareMangaDialog';

const CommentSection = dynamic(() =>
  import('@/components/manga/CommentSection').then((mod) => mod.CommentSection),
  {
    loading: () => <p className="text-center p-4">Loading comments...</p>,
    ssr: false 
  }
);


interface MangaDetailPageProps {
  params: { mangaId: string };
}

export default function MangaDetailPage({ params: paramsProp }: MangaDetailPageProps) {
  const resolvedParams = use(paramsProp);
  const mangaId = resolvedParams.mangaId;

  const [manga, setManga] = useState<MangaSeries | undefined>(undefined);
  const { user, isSubscribedToManga, purchaseAccess, donateToManga, investInManga, rateManga, isFavorited, toggleFavorite } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [donationAmount, setDonationAmount] = useState<string>("");
  const [investmentShares, setInvestmentShares] = useState<string>("");
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");


  useEffect(() => {
    const currentMangaData = getMangaById(mangaId);
    if (!currentMangaData || !currentMangaData.isPublished) { 
      setManga(undefined);
      const timer = setTimeout(() => {
        const freshCheck = getMangaById(mangaId);
        if(!freshCheck || !freshCheck.isPublished) {
          notFound();
        } else {
          setManga(freshCheck);
        }
      }, 200); 
      return () => clearTimeout(timer);
    } else {
      setManga(currentMangaData);
    }
  }, [mangaId]);


  useEffect(() => {
    if (!mangaId) return;
    const interval = setInterval(() => {
      const freshMangaData = getMangaById(mangaId);
      if (freshMangaData && freshMangaData.isPublished) { 
        setManga(prevManga => {
          if (JSON.stringify(freshMangaData) !== JSON.stringify(prevManga)) {
            return freshMangaData; 
          }
          return prevManga;
        });
      }
    }, 1000); 
    return () => clearInterval(interval);
  }, [mangaId]); 

  useEffect(() => {
    if (typeof window !== "undefined" && manga) {
      const origin = window.location.origin;
      setCurrentUrl(`${origin}/manga/${manga.id}`);
    }
  }, [manga]);


  if (!manga) {
    return <div className="text-center py-10" suppressHydrationWarning={true}>Loading manga details or manga not found/unpublished...</div>;
  }

  const getGenreName = (genreId: string) => {
    const genreDetail = MANGA_GENRES_DETAILS.find(g => g.id === genreId);
    return genreDetail ? genreDetail.name : genreId;
  };

  const isCreatorViewingOwnManga = user?.accountType === 'creator' && user?.id === manga.author.id;
  const isCreatorViewingOtherManga = user?.accountType === 'creator' && user?.id !== manga.author.id;


  const handleSubscribe = async () => {
    if (isCreatorViewingOtherManga || user?.accountType === 'creator') {
        toast({ title: "Action Not Allowed", description: "Creators cannot subscribe to manga series.", variant: "destructive" });
        return;
    }
    if (!user) {
      toast({ title: "Login Required", description: "Please login to subscribe.", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>Login</Button> });
      return;
    }
    if (manga.subscriptionPrice && manga.subscriptionModel === 'monthly') {
      await purchaseAccess(manga.id, 'monthly', manga.id, manga.subscriptionPrice);
    } else {
      toast({ title: "Cannot Subscribe", description: "This manga has no monthly subscription price set or is not on a monthly model.", variant: "destructive" });
    }
  };

  const handleOpenDonationDialog = () => {
     if (isCreatorViewingOtherManga || user?.accountType === 'creator') {
        toast({ title: "Action Not Allowed", description: "Creators cannot donate to other creators' works.", variant: "destructive" });
        return;
    }
     if (!user) {
      toast({ title: "Login Required", description: "Please login to donate.", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>Login</Button> });
      return;
    }
    setIsDonationDialogOpen(true);
  }

  const handleDonate = async () => {
    if (!user) return;
     if (isCreatorViewingOtherManga || user.accountType === 'creator') {
        toast({ title: "Action Not Allowed", description: "Creators cannot donate to other creators' works.", variant: "destructive" });
        setIsDonationDialogOpen(false);
        return;
    }
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
    if (isCreatorViewingOtherManga || user?.accountType === 'creator') {
        toast({ title: "Action Not Allowed", description: "Creators cannot invest in other creators' works.", variant: "destructive" });
        return;
    }
    if (!user) {
      toast({ title: "Login Required", description: "Please login to invest.", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>Login</Button> });
      return;
    }
     if (!manga.investmentOffer || !manga.investmentOffer.isActive) {
      toast({ title: "Investment Closed", description: "This manga is not currently open for investment.", variant: "destructive" });
      return;
    }
    const combinedActions = (user.subscriptions?.length || 0) + (user.donationCount || 0);
    if ((user.investmentOpportunitiesAvailable || 0) <= 0) {
        toast({ title: "Investment Locked", description: `You need an available investment opportunity. Earn one by making 5 combined subscriptions or donations. You currently have ${user.investmentOpportunitiesAvailable || 0} opportunities and ${combinedActions} combined actions.`, variant: "destructive", duration: 8000 });
        return;
    }
    if (manga.investmentOffer.minSubscriptionRequirement && (!user.subscriptions || user.subscriptions.filter(s => s.type === 'monthly' && s.mangaId === manga.id).length < manga.investmentOffer.minSubscriptionRequirement)) {
        toast({ title: "Author's Investment Requirement Not Met", description: `The author requires you to subscribe to *this specific manga* at least ${manga.investmentOffer.minSubscriptionRequirement} times (monthly) to invest. You currently have ${user.subscriptions?.filter(s=>s.type==='monthly' && s.mangaId === manga.id).length || 0} monthly subscriptions for this manga.`, variant: "destructive", duration: 8000 });
        return;
    }
    setIsInvestmentDialogOpen(true);
  }

  const handleInvest = async () => {
    if (!user || !manga.investmentOffer) return;
    if (isCreatorViewingOtherManga || user.accountType === 'creator') {
        toast({ title: "Action Not Allowed", description: "Creators cannot invest in other creators' works.", variant: "destructive" });
        setIsInvestmentDialogOpen(false);
        return;
    }
    const combinedActions = (user.subscriptions?.length || 0) + (user.donationCount || 0);
    if ((user.investmentOpportunitiesAvailable || 0) <= 0) { 
        toast({ title: "Investment Locked", description: `No investment opportunities available. You have ${combinedActions} combined actions.`, variant: "destructive" });
        setIsInvestmentDialogOpen(false);
        return;
    }
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
     if (isCreatorViewingOtherManga || user?.accountType === 'creator') {
        toast({ title: "Action Not Allowed", description: "Creators cannot rate other creators' works.", variant: "destructive" });
        return;
    }
    if (!user) {
      toast({ title: "Login Required", description: "Please login to rate.", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>Login</Button> });
      return;
    }
    await rateManga(manga.id, score);
  };

  const handleToggleFavorite = () => {
     if (isCreatorViewingOtherManga || user?.accountType === 'creator') {
        toast({ title: "Action Not Allowed", description: "Creators cannot favorite other creators' works.", variant: "destructive" });
        return;
    }
    if (!user) {
        toast({ title: "Login Required", description: "Please login to favorite manga.", variant: "destructive", action: <Button onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>Login</Button> });
        return;
    }
    toggleFavorite(manga.id, manga.title);
  };

  const isUserSubscribed = user ? isSubscribedToManga(manga.id) : false;
  const userRating = user?.ratingsGiven?.[manga.id];
  const hasChapterPurchaseForThisManga = user ? user.subscriptions.some(sub => sub.mangaId === manga.id && sub.type === 'chapter') : false;
  const hasInvestmentInThisManga = user ? user.investments.some(inv => inv.mangaId === manga.id) : false;

  const canRate = user && user.accountType !== 'creator' && (isUserSubscribed || hasChapterPurchaseForThisManga || hasInvestmentInThisManga) && !userRating;

  const ratingDisabledReason = () => {
    if (user?.accountType === 'creator') return "Creators cannot rate manga.";
    if (!user) return "Login to rate";
    if (!isUserSubscribed && !hasChapterPurchaseForThisManga && !hasInvestmentInThisManga) return "Subscribe, purchase a chapter, or invest to rate";
    if (userRating) return `You've already rated (${userRating}/3)`;
    return "";
  };
  const userHasFavorited = user ? isFavorited(manga.id) : false;

  const currentInvestmentOffer = manga.investmentOffer;
  const sharesRemaining = currentInvestmentOffer ? currentInvestmentOffer.totalSharesInOffer - manga.investors.reduce((sum, inv) => sum + inv.sharesOwned, 0) : 0;
  
  const combinedActionsForInvestment = user ? (user.subscriptions?.length || 0) + (user.donationCount || 0) : 0;
  const canUserInvest = user && user.accountType !== 'creator' && (user.investmentOpportunitiesAvailable || 0) > 0;

  const canUserInvestAuthorSpecific = user && currentInvestmentOffer && currentInvestmentOffer.minSubscriptionRequirement
    ? (user.subscriptions?.filter(s => s.type === 'monthly' && s.mangaId === manga.id).length || 0) >= currentInvestmentOffer.minSubscriptionRequirement
    : true; 


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
            <div className="flex justify-between items-start mb-1">
                <h1 className="text-3xl lg:text-4xl font-bold " suppressHydrationWarning>{manga.title}</h1>
                <div className="flex items-center">
                    {user && user.accountType !== 'creator' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleToggleFavorite}
                            className="text-muted-foreground hover:text-primary"
                            title={userHasFavorited ? "Remove from Favorites" : "Add to Favorites"}
                            suppressHydrationWarning
                        >
                            <Heart className={`h-6 w-6 ${userHasFavorited ? 'fill-primary text-primary' : ''}`} />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsShareDialogOpen(true)}
                        className="text-muted-foreground hover:text-primary ml-1"
                        title="Share this Manga"
                        suppressHydrationWarning
                    >
                        <Share2 className="h-6 w-6" />
                    </Button>
                </div>
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
                {manga.authorDetails.socialLinks?.filter(link => link.platform.toLowerCase() !== 'website').map(link => (
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
                        <CardTitle className="text-md flex items-center text-blue-700 dark:text-blue-300" suppressHydrationWarning>
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
                    <Button variant={userRating === 3 ? "default" : "outline"} size="sm" onClick={() => handleRating(3)} title="Good (3 points)" disabled={!canRate && userRating !==3 || user?.accountType === 'creator'}>
                      <ThumbsUp className={`h-4 w-4 mr-1 ${userRating === 3 ? "" : "text-green-500"}`} /> <span suppressHydrationWarning>Good (3)</span>
                    </Button>
                    <Button variant={userRating === 2 ? "default" : "outline"} size="sm" onClick={() => handleRating(2)} title="Okay (2 points)" disabled={!canRate && userRating !==2 || user?.accountType === 'creator'}>
                      <Meh className={`h-4 w-4 mr-1 ${userRating === 2 ? "" : "text-yellow-500"}`} /> <span suppressHydrationWarning>Okay (2)</span>
                    </Button>
                    <Button variant={userRating === 1 ? "default" : "outline"} size="sm" onClick={() => handleRating(1)} title="Bad (1 point)" disabled={!canRate && userRating !==1 || user?.accountType === 'creator'}>
                      <ThumbsDown className={`h-4 w-4 mr-1 ${userRating === 1 ? "" : "text-red-500"}`} /> <span suppressHydrationWarning>Bad (1)</span>
                    </Button>
                  </div>
                  {manga.averageRating !== undefined && manga.ratingCount !== undefined && (
                    <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                      Avg: <span className="font-semibold text-primary">{manga.averageRating.toFixed(1)}</span> ({manga.ratingCount} ratings)
                    </div>
                  )}
                </div>
                {((!canRate && user && user.accountType !== 'creator') || (user && user.accountType === 'creator')) && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center" suppressHydrationWarning>
                    <Lock className="h-3 w-3 mr-1" /> {ratingDisabledReason()}
                  </p>
                )}
                 {!user && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center" suppressHydrationWarning>
                    <Lock className="h-3 w-3 mr-1" /> Login and get access to rate.
                     <Button variant="link" size="xs" className="p-0 h-auto ml-1" onClick={() => router.push('/login?redirect=/manga/' + mangaId)}>Login</Button>
                  </p>
                )}
              </CardContent>
            </Card>


            <Card className="mb-6 bg-secondary/30 p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg flex items-center" suppressHydrationWarning><Landmark className="mr-2 h-5 w-5 text-primary" />Manga Financials (Simulated)</CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-sm space-y-1">
                <p suppressHydrationWarning>Total Subscription Revenue: <span className="font-semibold">${(manga.totalRevenueFromSubscriptions || 0).toFixed(2)}</span></p>
                <p suppressHydrationWarning>Total Donation Revenue: <span className="font-semibold">${(manga.totalRevenueFromDonations || 0).toFixed(2)}</span></p>
                 <p suppressHydrationWarning>Views: <span className="font-semibold">{manga.viewCount.toLocaleString()}</span></p>
              </CardContent>
            </Card>

            <div className="mt-auto space-y-3">
              {manga.subscriptionPrice && manga.subscriptionModel === 'monthly' && (
                <Button
                  onClick={handleSubscribe}
                  className="w-full text-lg py-6"
                  disabled={isUserSubscribed || user?.accountType === 'creator'}
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
               {manga.chapterSubscriptionPrice && manga.subscriptionModel === 'per_chapter' && user?.accountType !== 'creator' && (
                 <p className="text-sm text-center text-muted-foreground" suppressHydrationWarning>
                    Chapters can be purchased individually from the chapter list.
                 </p>
               )}
              <Button onClick={handleOpenDonationDialog} variant="outline" className="w-full text-lg py-6" suppressHydrationWarning disabled={user?.accountType === 'creator'}>
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
              <p className="text-xs text-muted-foreground flex items-center" suppressHydrationWarning>
                <Info className="mr-1 h-3 w-3"/> Platform Requirement: 5 combined subscriptions/donations per investment opportunity.
                {user && ` You have ${user.investmentOpportunitiesAvailable || 0} opportunities. (${combinedActionsForInvestment} total actions)`}
              </p>
               {currentInvestmentOffer.minSubscriptionRequirement && (
                <p className="text-xs text-muted-foreground flex items-center" suppressHydrationWarning>
                  <Info className="mr-1 h-3 w-3"/> Author Requirement: At least {currentInvestmentOffer.minSubscriptionRequirement} monthly subscriptions to *this* manga.
                  {user && ` You have ${user.subscriptions?.filter(s => s.type === 'monthly' && s.mangaId === manga.id).length || 0} for this manga.`}
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
              <Button 
                onClick={handleOpenInvestmentDialog} 
                className="w-full text-lg py-6" 
                disabled={sharesRemaining <= 0 || !canUserInvest || !canUserInvestAuthorSpecific || user?.accountType === 'creator'} 
                suppressHydrationWarning
                title={user?.accountType === 'creator' ? "Creators cannot invest" : !canUserInvest ? `Requires investment opportunity (earned via 5 subscriptions/donations). You have ${user?.investmentOpportunitiesAvailable || 0} opportunities and ${combinedActionsForInvestment} total actions.` : ""}
              >
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

      <Separator className="my-8" />
      { (!user || user.accountType !== 'creator' || (user.accountType === 'creator' && user.id === manga.author.id) ) && ( 
        <CommentSection mangaId={manga.id} />
      )}
       {user && user.accountType === 'creator' && user.id !== manga.author.id && ( 
        <div className="text-center text-muted-foreground py-4">
            Creators cannot comment on other creators' works.
        </div>
      )}

      {manga && currentUrl && (
        <ShareMangaDialog
          mangaTitle={manga.title}
          mangaUrl={currentUrl}
          isOpen={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
        />
      )}


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
