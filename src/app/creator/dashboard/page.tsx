"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMangaById } from '@/lib/mock-data';
import type { MangaSeries, SimulatedTransaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, BarChart2, DollarSign, Eye, BookUp, AlertTriangle, TrendingUp, Users, CheckCircle, ExternalLink, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { MANGA_GENRES_DETAILS, MAX_WORKS_PER_CREATOR } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CreatorDashboardPage() {
  const { user, transactions } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [authoredManga, setAuthoredManga] = useState<MangaSeries[]>([]);

  const fetchAuthoredManga = useCallback(() => {
    if (user && user.accountType === 'creator' && user.isApproved && user.authoredMangaIds) {
      const mangaList = user.authoredMangaIds
        .map(id => getMangaById(id)) // This will fetch manga regardless of its 'isPublished' status
        .filter(manga => manga !== undefined) as MangaSeries[];

      setAuthoredManga(prevList => {
        if (JSON.stringify(mangaList) !== JSON.stringify(prevList)) {
          return mangaList;
        }
        return prevList;
      });
    } else {
      setAuthoredManga(prevList => {
        if (prevList.length > 0) {
          return [];
        }
        return prevList;
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/creator/dashboard');
      return;
    }
    if (user.accountType !== 'creator') {
      toast({ title: "Access Restricted", description: "Only creators can access this page.", variant: "destructive" });
      router.push('/');
      return;
    }
    if (!user.isApproved) {
      toast({
        title: "Account Pending Approval",
        description: "Your creator account is awaiting admin approval. You cannot access the dashboard until approved.",
        variant: "default",
        duration: 7000
      });
      router.push('/');
      return;
    }
    fetchAuthoredManga();
  }, [user, router, fetchAuthoredManga, toast]);


  useEffect(() => {
    if (!user || user.accountType !== 'creator' || !user.isApproved) {
      return;
    }
    const interval = setInterval(fetchAuthoredManga, 2000);
    return () => clearInterval(interval);
  }, [user, fetchAuthoredManga]);


  const getGenreNames = (genreIds: string[]): string => {
    return genreIds.map(id => {
      const genre = MANGA_GENRES_DETAILS.find(g => g.id === id);
      return genre ? genre.name.split('(')[0].trim() : id;
    }).join(', ');
  };

  const totalSubRevenue = useMemo(() => authoredManga.filter(m => m.isPublished).reduce((sum, m) => sum + m.totalRevenueFromSubscriptions, 0), [authoredManga]);
  const totalDonationRevenue = useMemo(() => authoredManga.filter(m => m.isPublished).reduce((sum, m) => sum + m.totalRevenueFromDonations, 0), [authoredManga]);
  const totalViews = useMemo(() => authoredManga.filter(m => m.isPublished).reduce((sum, m) => sum + m.viewCount, 0), [authoredManga]);
  const totalInvestors = useMemo(() => authoredManga.filter(m => m.isPublished).reduce((sum, m) => sum + m.investors.length, 0), [authoredManga]);

  const creatorEarningsTransactions = useMemo(() => {
    if (!user) return [];
    return transactions.filter(tx => tx.authorId === user.id && tx.type === 'author_earning').slice(0,10);
  }, [transactions, user]);


  if (!user || user.accountType !== 'creator') {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground">
          You do not have permission to view this page. Redirecting...
        </p>
      </div>
    );
  }

  if (!user.isApproved) {
     return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Account Pending Approval</h2>
        <p className="text-muted-foreground max-w-md">
          Your creator account <span className="font-semibold text-primary">{user.email}</span> is awaiting admin approval.
          Once approved, you will be able to access this dashboard and publish your manga.
        </p>
        <Button onClick={() => router.push('/')} className="mt-6">Return to Homepage</Button>
      </div>
    );
  }

  const worksPublishedCount = authoredManga.filter(m => m.isPublished).length;
  const worksLimitProgress = (authoredManga.length / MAX_WORKS_PER_CREATOR) * 100;


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center" suppressHydrationWarning>
            <BookUp className="mr-3 h-8 w-8 text-primary" />Creator Dashboard
          </CardTitle>
          <CardDescription suppressHydrationWarning>Manage your manga series, view earnings and stats, and create new content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <p suppressHydrationWarning>Welcome back, {user.name}! This is your space to manage your creations.</p>
            <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                    <span suppressHydrationWarning>Total Works Created: {authoredManga.length} / {MAX_WORKS_PER_CREATOR}</span>
                    <span suppressHydrationWarning>{worksLimitProgress.toFixed(0)}%</span>
                </div>
                <Progress value={worksLimitProgress} aria-label={`${worksLimitProgress.toFixed(0)}% of work limit used`} />
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>{worksPublishedCount} work(s) currently published.</p>
            </div>
        </CardContent>
         <CardFooter>
          <Button asChild size="lg" disabled={authoredManga.length >= MAX_WORKS_PER_CREATOR}>
            <Link href="/creator/create-manga">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Manga Series
            </Link>
          </Button>
            {authoredManga.length >= MAX_WORKS_PER_CREATOR && <p className="ml-4 text-sm text-destructive">You have reached the maximum number of works.</p>}
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>Total Subscription Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" suppressHydrationWarning>${totalSubRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>From all published manga</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>Total Donation Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" suppressHydrationWarning>${totalDonationRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>From all published manga</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>Total Views</CardTitle>
            <Eye className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" suppressHydrationWarning>{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>Across all published manga</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>Total Investors</CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" suppressHydrationWarning>{totalInvestors}</div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>Across all published, invested manga</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-6 w-6 text-primary"/>Recent Earnings (Simulated)</CardTitle>
          <CardDescription>Your latest simulated earnings transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {creatorEarningsTransactions.length > 0 ? (
            <ScrollArea className="h-72">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creatorEarningsTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs tabular-nums">{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{tx.description}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        +${tx.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-4">No earnings records yet.</p>
          )}
        </CardContent>
      </Card>


      <div className="space-y-6">
        <h2 className="text-2xl font-semibold" suppressHydrationWarning>Your Manga Series ({authoredManga.length})</h2>
        {authoredManga.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8" suppressHydrationWarning>
                You haven't created any manga series yet. <br/>
                Click "Create New Manga Series" above to start!
              </p>
            </CardContent>
          </Card>

        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authoredManga.map(manga => (
              <Card key={manga.id} className="flex flex-col shadow-md hover:shadow-xl transition-shadow">
                <CardHeader>
                   <div className="flex justify-between items-start mb-2">
                    {manga.isPublished ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Unpublished
                      </Badge>
                    )}
                   </div>
                  <div className="aspect-[2/3] relative w-full mb-2 rounded-md overflow-hidden border">
                    <Image src={manga.coverImage} alt={manga.title} layout="fill" objectFit="cover" data-ai-hint="manga cover dashboard"/>
                  </div>
                  <CardTitle suppressHydrationWarning>{manga.title}</CardTitle>
                  <CardDescription suppressHydrationWarning>{getGenreNames(manga.genres)}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm">
                  {manga.isPublished && (
                    <>
                      <p className="flex items-center" suppressHydrationWarning><Eye className="mr-2 h-4 w-4 text-primary" /> Views: <span className="font-semibold ml-1">{manga.viewCount.toLocaleString()}</span></p>
                      <p className="flex items-center" suppressHydrationWarning><DollarSign className="mr-2 h-4 w-4 text-green-500" /> Subscription Revenue: <span className="font-semibold ml-1">${manga.totalRevenueFromSubscriptions.toFixed(2)}</span></p>
                      <p className="flex items-center" suppressHydrationWarning><DollarSign className="mr-2 h-4 w-4 text-yellow-500" /> Donation Revenue: <span className="font-semibold ml-1">${manga.totalRevenueFromDonations.toFixed(2)}</span></p>
                      {manga.investmentOffer && manga.investmentOffer.isActive &&
                        <p className="flex items-center" suppressHydrationWarning><TrendingUp className="mr-2 h-4 w-4 text-purple-500"/>Crowdfunding: <Badge variant={manga.investors.length >= (manga.investmentOffer.totalSharesInOffer*0.8) ? "default" : "secondary"}>{manga.investors.length} / {manga.investmentOffer.totalSharesInOffer} shares invested</Badge>
                        </p>
                      }
                      {manga.averageRating !== undefined && (
                         <p className="flex items-center" suppressHydrationWarning>Rating: <span className="font-semibold ml-1">{manga.averageRating.toFixed(1)}/3 ({manga.ratingCount} ratings)</span></p>
                      )}
                    </>
                  )}
                   <p className="text-xs text-muted-foreground" suppressHydrationWarning>Created: {new Date(manga.publishedDate).toLocaleDateString()}</p>
                   <p className="text-xs text-muted-foreground" suppressHydrationWarning>Last Updated: {new Date(manga.lastUpdatedDate || manga.publishedDate).toLocaleDateString()}</p>
                   <p className="text-xs text-muted-foreground" suppressHydrationWarning>Chapters: {manga.chapters.length}</p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  {manga.isPublished && (
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                      <Link href={`/manga/${manga.id}`}><ExternalLink className="mr-1 h-4 w-4"/>View Live</Link>
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" asChild className="w-full sm:w-auto">
                    <Link href={`/creator/edit-manga/${manga.id}`}>
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
