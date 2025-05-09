"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMangaById } from '@/lib/mock-data';
import type { MangaSeries, SimulatedTransaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, BarChart2, DollarSign, Eye, BookUp, AlertTriangle, TrendingUp, Users, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { MANGA_GENRES_DETAILS, MAX_WORKS_PER_CREATOR } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CreatorDashboardPage() {
  const { user, transactions } = useAuth(); // Added transactions
  const router = useRouter();
  const { toast } = useToast();
  const [authoredManga, setAuthoredManga] = useState<MangaSeries[]>([]);

  const fetchAuthoredManga = useCallback(() => {
    if (user && user.accountType === 'creator' && user.isApproved && user.authoredMangaIds) {
      const mangaList = user.authoredMangaIds
        .map(id => getMangaById(id))
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
      toast({ title: "访问受限", description: "只有创作者才能访问此页面。", variant: "destructive" });
      router.push('/'); 
      return;
    }
    if (!user.isApproved) {
      toast({ 
        title: "账号待审批", 
        description: "您的创作者账号正在等待平台管理员审批。在此之前您无法访问控制面板。", 
        variant: "default", // Changed to default as it's informational, not an error
        duration: 7000
      });
      router.push('/'); // Redirect to home if not approved
      return;
    }
    fetchAuthoredManga();
  }, [user, router, fetchAuthoredManga, toast]);


  useEffect(() => {
    // Fetch manga data periodically to reflect updates (e.g., from edits or new creations)
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

  const totalSubRevenue = useMemo(() => authoredManga.reduce((sum, m) => sum + m.totalRevenueFromSubscriptions, 0), [authoredManga]);
  const totalDonationRevenue = useMemo(() => authoredManga.reduce((sum, m) => sum + m.totalRevenueFromDonations, 0), [authoredManga]);
  const totalViews = useMemo(() => authoredManga.reduce((sum, m) => sum + m.viewCount, 0), [authoredManga]);
  const totalInvestors = useMemo(() => authoredManga.reduce((sum, m) => sum + m.investors.length, 0), [authoredManga]);
  
  const creatorEarningsTransactions = useMemo(() => {
    if (!user) return [];
    return transactions.filter(tx => tx.authorId === user.id && tx.type === 'author_earning').slice(0,10);
  }, [transactions, user]);


  if (!user || user.accountType !== 'creator') {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">访问受限</h2>
        <p className="text-muted-foreground">
          您没有权限查看此页面。正在重定向...
        </p>
      </div>
    );
  }
  
  if (!user.isApproved) {
     return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">账号待审批</h2>
        <p className="text-muted-foreground max-w-md">
          您的创作者账号 <span className="font-semibold text-primary">{user.email}</span> 正在等待平台管理员审批。
          审批通过后，您将能够访问此控制面板并开始发布您的漫画作品。
        </p>
        <Button onClick={() => router.push('/')} className="mt-6">返回首页</Button>
      </div>
    );
  }
  
  const worksPublished = authoredManga.length;
  const worksLimitProgress = (worksPublished / MAX_WORKS_PER_CREATOR) * 100;


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center" suppressHydrationWarning>
            <BookUp className="mr-3 h-8 w-8 text-primary" />创作者控制面板
          </CardTitle>
          <CardDescription suppressHydrationWarning>管理您的漫画系列、查看收益和统计数据，并创作新内容。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <p suppressHydrationWarning>欢迎回来, {user.name}! 这里是您管理创作的空间。</p>
            <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                    <span suppressHydrationWarning>已发布作品: {worksPublished} / {MAX_WORKS_PER_CREATOR}</span>
                    <span suppressHydrationWarning>{worksLimitProgress.toFixed(0)}%</span>
                </div>
                <Progress value={worksLimitProgress} aria-label={`${worksLimitProgress.toFixed(0)}% of work limit used`} />
            </div>
        </CardContent>
         <CardFooter>
          <Button asChild size="lg" disabled={worksPublished >= MAX_WORKS_PER_CREATOR}>
            <Link href="/creator/create-manga">
              <PlusCircle className="mr-2 h-5 w-5" /> 创建新漫画系列
            </Link>
          </Button>
            {worksPublished >= MAX_WORKS_PER_CREATOR && <p className="ml-4 text-sm text-destructive">您已达到作品数量上限。</p>}
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>总订阅收益</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" suppressHydrationWarning>${totalSubRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>来自所有漫画的订阅</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>总打赏收益</CardTitle>
            <DollarSign className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" suppressHydrationWarning>${totalDonationRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>来自所有漫画的打赏</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>总浏览量</CardTitle>
            <Eye className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" suppressHydrationWarning>{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>所有漫画的总观看次数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>总投资者数</CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" suppressHydrationWarning>{totalInvestors}</div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>参与众筹的总人数</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-6 w-6 text-primary"/>近期收益记录 (模拟)</CardTitle>
          <CardDescription>您最近的模拟收益到账记录。</CardDescription>
        </CardHeader>
        <CardContent>
          {creatorEarningsTransactions.length > 0 ? (
            <ScrollArea className="h-72">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead className="text-right">金额</TableHead>
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
            <p className="text-muted-foreground text-center py-4">暂无收益记录。</p>
          )}
        </CardContent>
      </Card>


      <div className="space-y-6">
        <h2 className="text-2xl font-semibold" suppressHydrationWarning>您的漫画系列 ({authoredManga.length})</h2>
        {authoredManga.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8" suppressHydrationWarning>
                您还没有创建任何漫画系列。 <br/>
                点击上方的“创建新漫画系列”按钮开始吧！
              </p>
            </CardContent>
          </Card>
          
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authoredManga.map(manga => (
              <Card key={manga.id} className="flex flex-col shadow-md hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="aspect-[2/3] relative w-full mb-2 rounded-md overflow-hidden border">
                    <Image src={manga.coverImage} alt={manga.title} layout="fill" objectFit="cover" data-ai-hint="manga cover dashboard"/>
                  </div>
                  <CardTitle suppressHydrationWarning>{manga.title}</CardTitle>
                  <CardDescription suppressHydrationWarning>{getGenreNames(manga.genres)}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm">
                  <p className="flex items-center" suppressHydrationWarning><Eye className="mr-2 h-4 w-4 text-primary" /> 浏览量: <span className="font-semibold ml-1">{manga.viewCount.toLocaleString()}</span></p>
                  <p className="flex items-center" suppressHydrationWarning><DollarSign className="mr-2 h-4 w-4 text-green-500" /> 订阅收益: <span className="font-semibold ml-1">${manga.totalRevenueFromSubscriptions.toFixed(2)}</span></p>
                  <p className="flex items-center" suppressHydrationWarning><DollarSign className="mr-2 h-4 w-4 text-yellow-500" /> 打赏收益: <span className="font-semibold ml-1">${manga.totalRevenueFromDonations.toFixed(2)}</span></p>
                  {manga.investmentOffer && manga.investmentOffer.isActive && 
                    <p className="flex items-center" suppressHydrationWarning><TrendingUp className="mr-2 h-4 w-4 text-purple-500"/>众筹状态: <Badge variant={manga.investors.length >= (manga.investmentOffer.totalSharesInOffer*0.8) ? "default" : "secondary"}>{manga.investors.length} / {manga.investmentOffer.totalSharesInOffer} 份已投</Badge>
                    </p>
                  }
                  {manga.averageRating !== undefined && (
                     <p className="flex items-center" suppressHydrationWarning>评分: <span className="font-semibold ml-1">{manga.averageRating.toFixed(1)}/3 ({manga.ratingCount} 评价)</span></p>
                  )}
                   <p className="text-xs text-muted-foreground" suppressHydrationWarning>发布于: {new Date(manga.publishedDate).toLocaleDateString()}</p>
                   <p className="text-xs text-muted-foreground" suppressHydrationWarning>章节数: {manga.chapters.length}</p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <Link href={`/manga/${manga.id}`}><Eye className="mr-1 h-4 w-4"/>查看详情</Link>
                  </Button>
                  <Button variant="secondary" size="sm" asChild className="w-full sm:w-auto">
                    <Link href={`/creator/edit-manga/${manga.id}`}>
                      <Edit className="mr-1 h-4 w-4" /> 编辑
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
