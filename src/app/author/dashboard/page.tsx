
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMangaById } from '@/lib/mock-data';
import type { MangaSeries } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, BarChart2, DollarSign } from 'lucide-react';
import Image from 'next/image';

export default function AuthorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [authoredManga, setAuthoredManga] = useState<MangaSeries[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/author/dashboard');
      return;
    }
    if (!user.authoredMangaIds || user.authoredMangaIds.length === 0) {
      // If user has no authored manga, maybe redirect or show a message
      // For now, they can still access dashboard to create one
    }
    const mangaList = user.authoredMangaIds
      .map(id => getMangaById(id))
      .filter(manga => manga !== undefined) as MangaSeries[];
    setAuthoredManga(mangaList);

    // Periodically refresh manga data in case it's updated by other actions (e.g. ratings)
    const interval = setInterval(() => {
       const freshMangaList = user.authoredMangaIds
        .map(id => getMangaById(id))
        .filter(manga => manga !== undefined) as MangaSeries[];
      if (JSON.stringify(freshMangaList) !== JSON.stringify(authoredManga)) {
        setAuthoredManga(freshMangaList);
      }
    }, 2000);
    return () => clearInterval(interval);

  }, [user, router, authoredManga]);

  if (!user) {
    return <div className="text-center py-10">Loading or redirecting...</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Author Dashboard</CardTitle>
          <CardDescription>Manage your manga series, view earnings, and create new content.</CardDescription>
        </CardHeader>
        <CardContent>
           <p>Welcome, {user.name}! Here you can manage your creative work.</p>
        </CardContent>
         <CardFooter>
          <Button asChild>
            <Link href="/author/create-manga">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Manga
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Your Manga Series</h2>
        {authoredManga.length === 0 ? (
          <p className="text-muted-foreground">You haven't created any manga series yet. Get started by clicking the button above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authoredManga.map(manga => (
              <Card key={manga.id} className="flex flex-col">
                <CardHeader>
                  <div className="aspect-[2/3] relative w-full mb-2 rounded-md overflow-hidden">
                    <Image src={manga.coverImage} alt={manga.title} layout="fill" objectFit="cover" data-ai-hint="manga cover small"/>
                  </div>
                  <CardTitle>{manga.title}</CardTitle>
                  <CardDescription>{manga.genres.join(', ')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm">
                  <p className="flex items-center"><BarChart2 className="mr-2 h-4 w-4 text-primary" /> Views: <span className="font-semibold ml-1">{manga.viewCount.toLocaleString()}</span></p>
                  <p className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-green-500" /> Subscriptions Revenue: <span className="font-semibold ml-1">${manga.totalRevenueFromSubscriptions.toFixed(2)}</span></p>
                  <p className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-yellow-500" /> Donations Revenue: <span className="font-semibold ml-1">${manga.totalRevenueFromDonations.toFixed(2)}</span></p>
                  {manga.averageRating !== undefined && (
                     <p className="flex items-center">Rating: <span className="font-semibold ml-1">{manga.averageRating.toFixed(1)}/3 ({manga.ratingCount} ratings)</span></p>
                  )}
                   <p className="text-xs text-muted-foreground">Published: {new Date(manga.publishedDate).toLocaleDateString()}</p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/manga/${manga.id}`}><BarChart2 className="mr-1 h-4 w-4"/>View Details</Link>
                  </Button>
                  {/* <Button variant="secondary" size="sm" disabled>
                    <Edit className="mr-1 h-4 w-4" /> Edit (Soon)
                  </Button> */}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Conceptual sections for earnings overview and author profile editing */}
    </div>
  );
}