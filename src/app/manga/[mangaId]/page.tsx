
"use client";
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { getMangaById } from '@/lib/mock-data';
import { ChapterListItem } from '@/components/manga/ChapterListItem';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DollarSign, Gift, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface MangaDetailPageProps {
  params: { mangaId: string };
}

// export async function generateMetadata({ params }: MangaDetailPageProps) {
//   // Cannot use useAuth in generateMetadata as it's a server component
//   // For dynamic metadata depending on client state, consider updating via useEffect in the component
//   const manga = getMangaById(params.mangaId);
//   if (!manga) {
//     return { title: 'Manga Not Found' };
//   }
//   return {
//     title: `${manga.title} - By ${manga.author.name} | Manga Platform`,
//     description: `Browse chapters, subscribe, and support ${manga.title}. ${manga.summary}`,
//   };
// }


export default function MangaDetailPage({ params }: MangaDetailPageProps) {
  const manga = getMangaById(params.mangaId);
  const { user, isSubscribed, subscribe } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  if (!manga) {
    notFound();
  }

  const handleSubscribe = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to subscribe.",
        variant: "destructive",
        action: <Button onClick={() => router.push('/login')}>Login</Button>
      });
      return;
    }
    if (typeof subscribe === 'function') {
       subscribe(manga.id, manga.title);
    }
  };

  const handleDonate = () => {
    toast({
      title: "Feature Coming Soon!",
      description: "The ability to donate to creators will be available soon. Thank you for your support!",
    });
  };
  
  const isUserSubscribed = isSubscribed(manga.id);

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

            <div className="mt-auto space-y-4">
              {manga.subscriptionPrice && (
                <Button 
                  onClick={handleSubscribe} 
                  className="w-full text-lg py-6"
                  disabled={isUserSubscribed}
                >
                  {isUserSubscribed ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" /> Subscribed
                    </>
                  ) : (
                    <>
                     <DollarSign className="mr-2 h-5 w-5" /> Subscribe (${manga.subscriptionPrice}/month)
                    </>
                  )}
                </Button>
              )}
              <Button onClick={handleDonate} variant="outline" className="w-full text-lg py-6">
                <Gift className="mr-2 h-5 w-5" /> Donate to Author
              </Button>
            </div>
            
            {manga.investmentDetails && (
              <div className="mt-8 p-4 border border-dashed rounded-lg bg-secondary/30">
                <h3 className="text-xl font-semibold mb-2 flex items-center">
                  <TrendingUp className="mr-2 h-6 w-6 text-primary" />
                  Investment Opportunity
                </h3>
                {manga.investmentDetails.sharesOfferedPercent && (
                   <p className="text-sm text-muted-foreground mb-1">
                    Author is offering {manga.investmentDetails.sharesOfferedPercent}% of this manga's revenue share.
                  </p>
                )}
                <p className="text-sm text-muted-foreground mb-3">
                  {manga.investmentDetails.description}
                </p>
                <Button variant="ghost" className="text-primary hover:text-primary/80 p-0 h-auto" disabled>
                  Learn More & Invest (Coming Soon)
                </Button>
              </div>
            )}
            
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
