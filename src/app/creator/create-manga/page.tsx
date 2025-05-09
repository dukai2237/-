"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { MangaInvestmentOffer } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { BookUp } from 'lucide-react';

export default function CreateMangaPage() {
  const { user, addMangaSeries } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState(`https://picsum.photos/400/600?random=${Date.now()}`); 
  const [genres, setGenres] = useState(''); // Comma-separated
  const [freePreviewPageCount, setFreePreviewPageCount] = useState('2');
  const [subscriptionPrice, setSubscriptionPrice] = useState(''); 

  const [enableInvestment, setEnableInvestment] = useState(false);
  const [sharesOfferedTotalPercent, setSharesOfferedTotalPercent] = useState('20');
  const [totalSharesInOffer, setTotalSharesInOffer] = useState('100');
  const [pricePerShare, setPricePerShare] = useState('10');
  const [investmentDescription, setInvestmentDescription] = useState('');
  const [minSubscriptionRequirement, setMinSubscriptionRequirement] = useState('');
  const [maxSharesPerUser, setMaxSharesPerUser] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/creator/create-manga');
    } else if (user.accountType !== 'creator') {
      toast({ title: "Access Denied", description: "Only creators can access this page.", variant: "destructive" });
      router.push('/');
    }
  }, [user, router, toast]);


  if (!user || user.accountType !== 'creator') {
    return <div className="text-center py-10">Redirecting...</div>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !coverImage || !genres) {
      toast({ title: "Missing Fields", description: "Please fill in all required manga details.", variant: "destructive" });
      return;
    }

    let investmentOffer: MangaInvestmentOffer | undefined = undefined;
    if (enableInvestment) {
      if (!sharesOfferedTotalPercent || !totalSharesInOffer || !pricePerShare || !investmentDescription) {
        toast({ title: "Missing Investment Fields", description: "Please fill all investment offer details or disable it.", variant: "destructive" });
        return;
      }
      investmentOffer = {
        sharesOfferedTotalPercent: parseFloat(sharesOfferedTotalPercent),
        totalSharesInOffer: parseInt(totalSharesInOffer, 10),
        pricePerShare: parseFloat(pricePerShare),
        description: investmentDescription,
        minSubscriptionRequirement: minSubscriptionRequirement ? parseInt(minSubscriptionRequirement, 10) : undefined,
        maxSharesPerUser: maxSharesPerUser ? parseInt(maxSharesPerUser, 10) : undefined,
        isActive: true,
      };
    }

    // For "uploading" pages, we'll create mock chapter data with a default page count.
    // A real system would involve file uploads for each page image.
    const placeholderChapters = [{ title: "Chapter 1: Genesis", pageCount: 10 }]; 
    if (title.toLowerCase().includes("arc")) { 
        placeholderChapters.push({ title: "Chapter 2: The Journey Begins", pageCount: 12 });
    }

    const newManga = await addMangaSeries({
      title,
      summary,
      coverImage,
      genres: genres.split(',').map(g => g.trim()).filter(g => g),
      freePreviewPageCount: parseInt(freePreviewPageCount, 10) || 0,
      subscriptionPrice: subscriptionPrice ? parseFloat(subscriptionPrice) : undefined,
      investmentOffer,
      chaptersInput: placeholderChapters, 
    });

    if (newManga) {
      toast({ title: "Manga Created!", description: `${newManga.title} has been successfully created.`});
      router.push('/creator/dashboard');
    } else {
      toast({ title: "Creation Failed", description: "Could not create manga. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center" suppressHydrationWarning><BookUp className="mr-3 h-7 w-7 text-primary"/>Create New Manga Series</CardTitle>
            <CardDescription suppressHydrationWarning>
              Fill in the details for your new manga. This simulates uploading your work to the platform. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" suppressHydrationWarning>Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., The Galactic Adventures" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary" suppressHydrationWarning>Summary *</Label>
              <Textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="A brief description of your manga." rows={4} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage" suppressHydrationWarning>Cover Image URL *</Label>
              <Input id="coverImage" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://example.com/cover.jpg (mock upload)" required />
               <p className="text-xs text-muted-foreground" suppressHydrationWarning>In a real app, this would be a file upload field.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="genres" suppressHydrationWarning>Genres * (comma-separated)</Label>
              <Input id="genres" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="e.g., Sci-Fi, Action, Comedy" required />
            </div>
             <p className="text-sm text-muted-foreground pt-2 border-t" suppressHydrationWarning>
              Chapter and page uploads are simplified for this mock. A default first chapter with 10 pages will be created. 
              You would typically upload images for each page.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="freePreviewPageCount" suppressHydrationWarning>Free Preview Pages *</Label>
                <Input id="freePreviewPageCount" type="number" value={freePreviewPageCount} onChange={(e) => setFreePreviewPageCount(e.target.value)} min="0" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriptionPrice" suppressHydrationWarning>Subscription Price (USD/month, optional)</Label>
                <Input id="subscriptionPrice" type="number" value={subscriptionPrice} onChange={(e) => setSubscriptionPrice(e.target.value)} placeholder="e.g., 4.99" step="0.01" min="0" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center space-x-3">
                    <Switch id="enableInvestment" checked={enableInvestment} onCheckedChange={setEnableInvestment} aria-label="Enable Investment Offer"/>
                    <Label htmlFor="enableInvestment" className="text-base font-medium cursor-pointer" suppressHydrationWarning>Enable Investment Offer for this Manga?</Label>
                </div>

                {enableInvestment && (
                    <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                        <h3 className="text-lg font-semibold" suppressHydrationWarning>Investment Offer Details</h3>
                         <div className="space-y-2">
                            <Label htmlFor="investmentDescription" suppressHydrationWarning>Offer Description *</Label>
                            <Textarea id="investmentDescription" value={investmentDescription} onChange={(e) => setInvestmentDescription(e.target.value)} placeholder="Describe the benefits for investors (e.g., revenue share, IP rights details)." rows={3} required={enableInvestment} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sharesOfferedTotalPercent" suppressHydrationWarning>Total Revenue Share for Investors Pool (%) *</Label>
                                <Input id="sharesOfferedTotalPercent" type="number" value={sharesOfferedTotalPercent} onChange={(e) => setSharesOfferedTotalPercent(e.target.value)} placeholder="e.g., 20 for 20%" min="1" max="100" required={enableInvestment} />
                                <p className="text-xs text-muted-foreground" suppressHydrationWarning>The percentage of future manga revenue allocated to all investors combined.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="totalSharesInOffer" suppressHydrationWarning>Total Shares in This Offer *</Label>
                                <Input id="totalSharesInOffer" type="number" value={totalSharesInOffer} onChange={(e) => setTotalSharesInOffer(e.target.value)} placeholder="e.g., 100" min="1" required={enableInvestment} />
                                <p className="text-xs text-muted-foreground" suppressHydrationWarning>How many individual shares make up the investor pool.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pricePerShare" suppressHydrationWarning>Price Per Share (USD) *</Label>
                                <Input id="pricePerShare" type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} placeholder="e.g., 10" step="0.01" min="0.01" required={enableInvestment} />
                                <p className="text-xs text-muted-foreground" suppressHydrationWarning>The cost for an investor to buy one share.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minSubscriptionRequirement" suppressHydrationWarning>Min. User Subscriptions to Invest (optional)</Label>
                                <Input id="minSubscriptionRequirement" type="number" value={minSubscriptionRequirement} onChange={(e) => setMinSubscriptionRequirement(e.target.value)} placeholder="e.g., 5" min="0" />
                                <p className="text-xs text-muted-foreground" suppressHydrationWarning>Investor must be subscribed to this many manga to qualify.</p>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="maxSharesPerUser" suppressHydrationWarning>Max Shares Per Investor (optional)</Label>
                                <Input id="maxSharesPerUser" type="number" value={maxSharesPerUser} onChange={(e) => setMaxSharesPerUser(e.target.value)} placeholder="e.g., 10" min="1" />
                                <p className="text-xs text-muted-foreground" suppressHydrationWarning>Limit the number of shares one investor can buy.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6">Publish Manga Series</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
