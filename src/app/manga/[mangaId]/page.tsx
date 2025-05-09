"use client";
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { getMangaById, getAuthorById, updateMockMangaData } from '@/lib/mock-data';
import { ChapterListItem } from '@/components/manga/ChapterListItem';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DollarSign, Gift, TrendingUp, CheckCircle, Landmark, Users, Percent, Info, PiggyBank, Ticket, Mail, Link as LinkIcon, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useState, useEffect, use as useReact } from 'react';
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
import type { MangaSeries, AuthorInfo } from '@/lib/types';


interface MangaDetailPageProps {
  params: { mangaId: string };
}

export default function MangaDetailPage({ params: paramsProp }: MangaDetailPageProps) {
  const resolvedParams = useReact(paramsProp as any);
  const mangaId = resolvedParams.mangaId;

  const [manga, setManga] = useState<MangaSeries | undefined>(() => getMangaById(mangaId));
  const [authorDetails, setAuthorDetails] = useState<AuthorInfo | undefined>(undefined);
  const { user, isSubscribedToManga, subscribeToManga, donateToManga, investInManga, rateManga } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [donationAmount, setDonationAmount] = useState<string>("");
  const [investmentShares, setInvestmentShares] = useState<string>("");
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false);

  useEffect(() => {
    const currentManga = getMangaById(mangaId);
    setManga(currentManga);
    if (currentManga) {
      setAuthorDetails(getAuthorById(currentManga.author.id));
    }

    const interval = setInterval(() => {
      const freshManga = getMangaById(mangaId);
      if (JSON.stringify(freshManga) !== JSON.stringify(manga)) {
        setManga(freshManga);
        if (freshManga) {
          setAuthorDetails(getAuthorById(freshManga.author.id));
        }
      }
    }, 1000); 
    return () => clearInterval(interval);
  }, [mangaId, manga]);


  if (!manga) {
    notFound();
  }

  const handleSubscribe = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to subscribe.", variant: "destructive", action: <Button onClick={() => router.push('/login')}>Login</Button> });
      return;
    }
    if (manga.subscriptionPrice) {
      await subscribeToManga(manga.id, manga.title, manga.subscriptionPrice);
    }
  };

  const handleOpenDonationDialog = () => {
     if (!user) {
      toast({ title: "Login Required", description: "Please log in to donate.", variant: "destructive", action: <Button onClick={() => router.push('/login')}>Login</Button> });
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
      toast({ title: "Login Required", description: "Please log in to invest.", variant: "destructive", action: <Button onClick={() => router.push('/login')}>Login</Button> });
      return;
    }
     if (!manga.investmentOffer || !manga.investmentOffer.isActive) {
      toast({ title: "Investment Closed", description: "This manga is not currently open for investment.", variant: "destructive" });
      return;
    }
    if (manga.investmentOffer.minSubscriptionRequirement && (!user.subscriptions || user.subscriptions.length < manga.investmentOffer.minSubscriptionRequirement)) {
        toast({ title: "Investment Requirement Not Met", description: `You must be subscribed to at least ${manga.investmentOffer.minSubscriptionRequirement} manga series to invest. You are currently subscribed to ${user.subscriptions?.length || 0}.`, variant: "destructive", duration: 7000 });
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
      toast({ title: "Login Required", description: "Please log in to rate.", variant: "destructive", action: <Button onClick={() => router.push('/login')}>Login</Button> });
      return;
    }
    await rateManga(manga.id, score);
  };
  
  const isUserAlreadySubscribed = user ? isSubscribedToManga(manga.id) : false;
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
                <AvatarFallback>{manga.author.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-lg font-medium" suppressHydrationWarning>{manga.author.name}</span>
            </div>

            {authorDetails && (authorDetails.contactEmail || (authorDetails.socialLinks && authorDetails.socialLinks.length > 0)) && (
              <div className="mb-3 text-sm text-muted-foreground space-y-1">
                {authorDetails.contactEmail && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" /> 
                    <a href={`mailto:${authorDetails.contactEmail}`} className="hover:text-primary" suppressHydrationWarning>{authorDetails.contactEmail}</a>
                  </div>
                )}
                {authorDetails.socialLinks?.map(link => (
                  <div key={link.platform} className="flex items-center gap-1.5">
                    <LinkIcon className="h-4 w-4" />
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary" suppressHydrationWarning>{link.platform}</a>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              {manga.genres.map((genre) => (
                <Badge key={genre} variant="outline" suppressHydrationWarning>{genre}</Badge>
              ))}
            </div>
            
            <p className="text-sm text-foreground leading-relaxed mb-6" suppressHydrationWarning>{manga.summary}</p>

             {/* Rating Section */}
            <Card className="mb-4 bg-secondary/20">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-md" suppressHydrationWarning>Rate this Manga</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleRating(3)} title="Good">
                    <ThumbsUp className="h-4 w-4 mr-1 text-green-500" /> <span suppressHydrationWarning>Good</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleRating(2)} title="Neutral">
                    <Meh className="h-4 w-4 mr-1 text-yellow-500" /> <span suppressHydrationWarning>Neutral</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleRating(1)} title="Bad">
                    <ThumbsDown className="h-4 w-4 mr-1 text-red-500" /> <span suppressHydrationWarning>Bad</span>
                  </Button>
                </div>
                {manga.averageRating !== undefined && manga.ratingCount !== undefined && (
                  <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                    Avg: <span className="font-semibold text-primary">{manga.averageRating.toFixed(1)}</span> ({manga.ratingCount} ratings)
                  </div>
                )}
              </CardContent>
            </Card>


            <Card className="mb-6 bg-secondary/30 p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg flex items-center"><Landmark className="mr-2 h-5 w-5 text-primary" /><span suppressHydrationWarning>Manga Financials (Mock)</span></CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-sm space-y-1">
                <p suppressHydrationWarning>Revenue from Subscriptions: <span className="font-semibold">${(manga.totalRevenueFromSubscriptions || 0).toFixed(2)}</span></p>
                <p suppressHydrationWarning>Revenue from Donations: <span className="font-semibold">${(manga.totalRevenueFromDonations || 0).toFixed(2)}</span></p>
                 <p suppressHydrationWarning>Views: <span className="font-semibold">{manga.viewCount.toLocaleString()}</span></p>
              </CardContent>
            </Card>


            <div className="mt-auto space-y-3">
              {manga.subscriptionPrice && (
                <Button 
                  onClick={handleSubscribe} 
                  className="w-full text-lg py-6"
                  disabled={isUserAlreadySubscribed}
                >
                  {isUserAlreadySubscribed ? (
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
              <Button onClick={handleOpenDonationDialog} variant="outline" className="w-full text-lg py-6">
                <Gift className="mr-2 h-5 w-5" /> <span suppressHydrationWarning>Donate to Author</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Section */}
      {currentInvestmentOffer && currentInvestmentOffer.isActive && (
        <>
          <Separator className="my-8" />
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <TrendingUp className="mr-3 h-7 w-7 text-primary" />
                <span suppressHydrationWarning>Investment Opportunity</span>
              </CardTitle>
              <CardDescription suppressHydrationWarning>{currentInvestmentOffer.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold flex items-center"><Percent className="mr-2 h-4 w-4 text-muted-foreground" /><span suppressHydrationWarning>Revenue Share for Investors (%):</span></p>
                  <p className="text-lg text-primary" suppressHydrationWarning>{currentInvestmentOffer.sharesOfferedTotalPercent}%</p>
                </div>
                <div>
                  <p className="font-semibold flex items-center"><Ticket className="mr-2 h-4 w-4 text-muted-foreground" /><span suppressHydrationWarning>Total Shares in Offer:</span></p>
                  <p className="text-lg" suppressHydrationWarning>{currentInvestmentOffer.totalSharesInOffer}</p>
                </div>
                <div>
                  <p className="font-semibold flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" /><span suppressHydrationWarning>Price Per Share:</span></p>
                  <p className="text-lg" suppressHydrationWarning>${currentInvestmentOffer.pricePerShare.toFixed(2)}</p>
                </div>
                 <div>
                  <p className="font-semibold flex items-center"><PiggyBank className="mr-2 h-4 w-4 text-muted-foreground" /><span suppressHydrationWarning>Shares Remaining:</span></p>
                  <p className="text-lg" suppressHydrationWarning>{sharesRemaining > 0 ? sharesRemaining : 'Offer Fully Vested'}</p>
                </div>
              </div>
               {currentInvestmentOffer.minSubscriptionRequirement && (
                <p className="text-xs text-muted-foreground flex items-center" suppressHydrationWarning>
                  <Info className="mr-1 h-3 w-3"/> Requires subscription to {currentInvestmentOffer.minSubscriptionRequirement} manga series.
                  {user && user.subscriptions && ` You are subscribed to ${user.subscriptions.length}.`}
                </p>
              )}
              {manga.investors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center"><Users className="mr-2 h-5 w-5 text-muted-foreground"/><span suppressHydrationWarning>Current Investors ({manga.investors.length}):</span></h4>
                  <ul className="list-disc list-inside pl-2 text-sm space-y-1 max-h-24 overflow-y-auto">
                    {manga.investors.map(inv => (
                      <li key={inv.userId} suppressHydrationWarning>{inv.userName} ({inv.sharesOwned} shares)</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleOpenInvestmentDialog} className="w-full text-lg py-6" disabled={sharesRemaining <= 0}>
                <TrendingUp className="mr-2 h-5 w-5" /> <span suppressHydrationWarning>Invest Now</span>
              </Button>
            </CardFooter>
          </Card>
        </>
      )}


      <Separator className="my-8" />

      <div>
        <h2 className="text-2xl font-semibold mb-4" suppressHydrationWarning>Chapters</h2>
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
              Show your support for the creator! Your donation (minus platform fees) goes towards supporting their work.
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
            <DialogClose asChild><Button variant="outline"><span suppressHydrationWarning>Cancel</span></Button></DialogClose>
            <Button onClick={handleDonate}><span suppressHydrationWarning>Donate</span></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {currentInvestmentOffer && (
      <Dialog open={isInvestmentDialogOpen} onOpenChange={setIsInvestmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>Invest in {manga.title}</DialogTitle>
            <DialogDescription suppressHydrationWarning>
              Purchase shares and become a part of this manga's success.
              Price per share: ${currentInvestmentOffer.pricePerShare.toFixed(2)}. Shares remaining: {sharesRemaining}.
              {currentInvestmentOffer.maxSharesPerUser && ` Max ${currentInvestmentOffer.maxSharesPerUser} shares per user.`}
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
            <DialogClose asChild><Button variant="outline"><span suppressHydrationWarning>Cancel</span></Button></DialogClose>
            <Button onClick={handleInvest} disabled={!investmentShares || parseInt(investmentShares) <=0 || parseInt(investmentShares) > sharesRemaining}><span suppressHydrationWarning>Invest</span></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}

    