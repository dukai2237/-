
"use client";
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { getMangaById, updateMockMangaData } from '@/lib/mock-data';
import { ChapterListItem } from '@/components/manga/ChapterListItem';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DollarSign, Gift, TrendingUp, CheckCircle, Landmark, Users, Percent, Info, PiggyBank, Ticket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useState, useEffect } from 'react';
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


export default function MangaDetailPage({ params }: MangaDetailPageProps) {
  // Use local state for manga data to reflect simulated updates
  const [manga, setManga] = useState<MangaSeries | undefined>(() => getMangaById(params.mangaId));
  const { user, isSubscribedToManga, subscribeToManga, donateToManga, investInManga } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [donationAmount, setDonationAmount] = useState<string>("");
  const [investmentShares, setInvestmentShares] = useState<string>("");
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false);

  useEffect(() => {
    // This effect ensures that if the underlying mock data changes (e.g. by AuthContext elsewhere),
    // this component re-fetches it. This is for demonstration with mock data.
    // In a real app with a DB, you might use a query library that handles re-fetching or updates.
    const interval = setInterval(() => {
      const freshManga = getMangaById(params.mangaId);
      if (JSON.stringify(freshManga) !== JSON.stringify(manga)) {
        setManga(freshManga);
      }
    }, 1000); // Check for updates periodically
    return () => clearInterval(interval);
  }, [params.mangaId, manga]);


  if (!manga) {
    notFound();
  }

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to subscribe.",
        variant: "destructive",
        action: <Button onClick={() => router.push('/login')}>Login</Button>
      });
      return;
    }
    if (manga.subscriptionPrice) {
      const success = await subscribeToManga(manga.id, manga.title, manga.subscriptionPrice);
      if (success) {
        // Refresh local manga state if needed, though AuthContext might handle this conceptually
        setManga(getMangaById(params.mangaId)); 
      }
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
    if (!user) return; // Should be caught by dialog trigger logic
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount to donate.", variant: "destructive" });
      return;
    }
    const success = await donateToManga(manga.id, manga.title, manga.author.id, amount);
    if (success) {
      setDonationAmount("");
      setIsDonationDialogOpen(false);
      setManga(getMangaById(params.mangaId));
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
    // Check subscription requirement
    if (manga.investmentOffer.minSubscriptionRequirement && (!user.subscriptions || user.subscriptions.length < manga.investmentOffer.minSubscriptionRequirement)) {
        toast({
            title: "Investment Requirement Not Met",
            description: `You must be subscribed to at least ${manga.investmentOffer.minSubscriptionRequirement} manga series to invest. You are currently subscribed to ${user.subscriptions?.length || 0}.`,
            variant: "destructive",
            duration: 7000,
        });
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
      setManga(getMangaById(params.mangaId));
    }
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
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">{manga.title}</h1>
            <div className="flex items-center gap-3 mb-3 text-muted-foreground">
              <Avatar className="h-10 w-10">
                <AvatarImage src={manga.author.avatarUrl} alt={manga.author.name} data-ai-hint="author avatar" />
                <AvatarFallback>{manga.author.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-lg font-medium">{manga.author.name}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {manga.genres.map((genre) => (
                <Badge key={genre} variant="outline">{genre}</Badge>
              ))}
            </div>
            
            <p className="text-sm text-foreground leading-relaxed mb-6">{manga.summary}</p>

            <Card className="mb-6 bg-secondary/30 p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg flex items-center"><Landmark className="mr-2 h-5 w-5 text-primary" />Manga Financials (Mock)</CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-sm space-y-1">
                <p>Revenue from Subscriptions: <span className="font-semibold">${(manga.totalRevenueFromSubscriptions || 0).toFixed(2)}</span></p>
                <p>Revenue from Donations: <span className="font-semibold">${(manga.totalRevenueFromDonations || 0).toFixed(2)}</span></p>
                 {/* <p>Conceptual Platform Share (10%): $XXX.XX</p>
                <p>Conceptual Investor Pool Share (YY%): $YYY.YY</p> */}
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
                      <CheckCircle className="mr-2 h-5 w-5" /> Subscribed
                    </>
                  ) : (
                    <>
                     <DollarSign className="mr-2 h-5 w-5" /> Subscribe (${manga.subscriptionPrice.toFixed(2)}/month)
                    </>
                  )}
                </Button>
              )}
              <Button onClick={handleOpenDonationDialog} variant="outline" className="w-full text-lg py-6">
                <Gift className="mr-2 h-5 w-5" /> Donate to Author
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
                Investment Opportunity
              </CardTitle>
              <CardDescription>{currentInvestmentOffer.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold flex items-center"><Percent className="mr-2 h-4 w-4 text-muted-foreground" />Revenue Share for Investors:</p>
                  <p className="text-lg text-primary">{currentInvestmentOffer.sharesOfferedTotalPercent}%</p>
                </div>
                <div>
                  <p className="font-semibold flex items-center"><Ticket className="mr-2 h-4 w-4 text-muted-foreground" />Total Shares in Offer:</p>
                  <p className="text-lg">{currentInvestmentOffer.totalSharesInOffer}</p>
                </div>
                <div>
                  <p className="font-semibold flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />Price Per Share:</p>
                  <p className="text-lg">${currentInvestmentOffer.pricePerShare.toFixed(2)}</p>
                </div>
                 <div>
                  <p className="font-semibold flex items-center"><PiggyBank className="mr-2 h-4 w-4 text-muted-foreground" />Shares Remaining:</p>
                  <p className="text-lg">{sharesRemaining > 0 ? sharesRemaining : 'Offer Fully Vested'}</p>
                </div>
              </div>
               {currentInvestmentOffer.minSubscriptionRequirement && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <Info className="mr-1 h-3 w-3"/> Requires subscription to {currentInvestmentOffer.minSubscriptionRequirement} manga series.
                  {user && user.subscriptions && ` You are subscribed to ${user.subscriptions.length}.`}
                </p>
              )}
              {manga.investors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center"><Users className="mr-2 h-5 w-5 text-muted-foreground"/>Current Investors ({manga.investors.length}):</h4>
                  <ul className="list-disc list-inside pl-2 text-sm space-y-1 max-h-24 overflow-y-auto">
                    {manga.investors.map(inv => (
                      <li key={inv.userId}>{inv.userName} ({inv.sharesOwned} shares)</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleOpenInvestmentDialog} className="w-full text-lg py-6" disabled={sharesRemaining <= 0}>
                <TrendingUp className="mr-2 h-5 w-5" /> Invest Now
              </Button>
            </CardFooter>
          </Card>
        </>
      )}


      <Separator className="my-8" />

      <div>
        <h2 className="text-2xl font-semibold mb-4">Chapters</h2>
        {manga.chapters.length > 0 ? (
          <ul className="border rounded-lg overflow-hidden bg-card shadow">
            {manga.chapters.sort((a,b) => a.chapterNumber - b.chapterNumber).map((chapter) => (
              <ChapterListItem key={chapter.id} mangaId={manga.id} chapter={chapter} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No chapters available yet.</p>
        )}
      </div>

      {/* Donation Dialog */}
      <Dialog open={isDonationDialogOpen} onOpenChange={setIsDonationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Donate to {manga.author.name} for {manga.title}</DialogTitle>
            <DialogDescription>
              Show your support for the creator! Your donation (minus platform fees) goes towards supporting their work.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="donationAmount" className="text-right">Amount ($)</Label>
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
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleDonate}>Donate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Investment Dialog */}
      {currentInvestmentOffer && (
      <Dialog open={isInvestmentDialogOpen} onOpenChange={setIsInvestmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invest in {manga.title}</DialogTitle>
            <DialogDescription>
              Purchase shares and become a part of this manga's success.
              Price per share: ${currentInvestmentOffer.pricePerShare.toFixed(2)}. Shares remaining: {sharesRemaining}.
              {currentInvestmentOffer.maxSharesPerUser && ` Max ${currentInvestmentOffer.maxSharesPerUser} shares per user.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="investmentShares" className="text-right">Shares</Label>
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
              <p className="text-sm text-center text-muted-foreground col-span-4">
                Total Cost: {parseInt(investmentShares)} shares * ${currentInvestmentOffer.pricePerShare.toFixed(2)} = 
                <span className="font-semibold text-primary"> ${(parseInt(investmentShares) * currentInvestmentOffer.pricePerShare).toFixed(2)}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleInvest} disabled={!investmentShares || parseInt(investmentShares) <=0 || parseInt(investmentShares) > sharesRemaining}>Invest</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

    </div>
  );
}

interface MangaDetailPageProps {
  params: { mangaId: string };
}
