
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMangaById } from '@/lib/mock-data';
import type { MangaSeries } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, BarChart2, DollarSign, Eye, BookUp } from 'lucide-react';
import Image from 'next/image';

export default function CreatorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [authoredManga, setAuthoredManga] = useState<MangaSeries[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/creator/dashboard');
      return;
    }
    if (user.accountType !== 'creator') {
      router.push('/'); // Redirect non-creators away
      return;
    }
    if (!user.authoredMangaIds) {
      setAuthoredManga([]);
    } else {
      const mangaList = user.authoredMangaIds
        .map(id => getMangaById(id))
        .filter(manga => manga !== undefined) as MangaSeries[];
      setAuthoredManga(mangaList);
    }

    const interval = setInterval(() => {
       if (user && user.authoredMangaIds) {
        const freshMangaList = user.authoredMangaIds
          .map(id => getMangaById(id))
          .filter(manga => manga !== undefined) as MangaSeries[];
        if (JSON.stringify(freshMangaList) !== JSON.stringify(authoredManga)) {
          setAuthoredManga(freshMangaList);
        }
       }
    }, 2000); // Check for updates every 2 seconds
    return () => clearInterval(interval);

  }, [user, router, authoredManga]);

  if (!user || user.accountType !== 'creator') {
    // Show loading or redirect message while routing checks complete
    return <div className="text-center py-10" suppressHydrationWarning>Loading or redirecting...</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl" suppressHydrationWarning>Creator Dashboard</CardTitle>
          <CardDescription suppressHydrationWarning>Manage your manga series, view earnings, and create new content.</CardDescription>
        </CardHeader>
        <CardContent>
           <p suppressHydrationWarning>Welcome, {user.name}! This is your space to manage your creations.</p>
        </CardContent>
         <CardFooter>
          <Button asChild size="lg">
            <Link href="/creator/create-manga">
              <BookUp className="mr-2 h-5 w-5" /> Create New Manga Series
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold" suppressHydrationWarning>Your Manga Series</h2>
        {authoredManga.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center" suppressHydrationWarning>
                You haven't created any manga series yet. <br/>
                Click the "Create New Manga Series" button above to get started!
              </p>
            </CardContent>
          </Card>
          
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authoredManga.map(manga => (
              <Card key={manga.id} className="flex flex-col shadow-md hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="aspect-[2/3] relative w-full mb-2 rounded-md overflow-hidden">
                    <Image src={manga.coverImage} alt={manga.title} layout="fill" objectFit="cover" data-ai-hint="manga cover dashboard"/>
                  </div>
                  <CardTitle suppressHydrationWarning>{manga.title}</CardTitle>
                  <CardDescription suppressHydrationWarning>{manga.genres.join(', ')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm">
                  <p className="flex items-center" suppressHydrationWarning><Eye className="mr-2 h-4 w-4 text-primary" /> Views: <span className="font-semibold ml-1">{manga.viewCount.toLocaleString()}</span></p>
                  <p className="flex items-center" suppressHydrationWarning><DollarSign className="mr-2 h-4 w-4 text-green-500" /> Subs Revenue: <span className="font-semibold ml-1">${manga.totalRevenueFromSubscriptions.toFixed(2)}</span></p>
                  <p className="flex items-center" suppressHydrationWarning><DollarSign className="mr-2 h-4 w-4 text-yellow-500" /> Donations Revenue: <span className="font-semibold ml-1">${manga.totalRevenueFromDonations.toFixed(2)}</span></p>
                  {manga.investmentOffer && <p className="flex items-center" suppressHydrationWarning><BarChart2 className="mr-2 h-4 w-4 text-blue-500"/>Investments: <span className="font-semibold ml-1">{manga.investors.length} investors</span></p>}
                  {manga.averageRating !== undefined && (
                     <p className="flex items-center" suppressHydrationWarning>Rating: <span className="font-semibold ml-1">{manga.averageRating.toFixed(1)}/3 ({manga.ratingCount} ratings)</span></p>
                  )}
                   <p className="text-xs text-muted-foreground" suppressHydrationWarning>Published: {new Date(manga.publishedDate).toLocaleDateString()}</p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <Link href={`/manga/${manga.id}`}><Eye className="mr-1 h-4 w-4"/>View Details</Link>
                  </Button>
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

