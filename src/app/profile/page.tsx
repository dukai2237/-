"use client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { DollarSign, BookOpenCheck, BarChart3, Briefcase, LogOut, Landmark, Receipt, Edit3 } from "lucide-react";

export default function ProfilePage() {
  const { user, logout, viewingHistory, transactions } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-4">You need to be logged in to view this page.</p>
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }
  
  const recentViewing = Array.from(viewingHistory.entries())
    .sort(([, a], [, b]) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  const investmentsWithMockROI = user.investments.map(inv => ({
    ...inv,
    mockCurrentValue: inv.amountInvested * (1 + (Math.random() * 0.10 + 0.05)), 
    mockProfit: (inv.amountInvested * (1 + (Math.random() * 0.10 + 0.05))) - inv.amountInvested,
  }));

  const handleWithdraw = () => {
    alert("Withdrawal feature is conceptual. In a real app, this would initiate a payout process.");
  };

  const isAuthor = user.authoredMangaIds && user.authoredMangaIds.length > 0;

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 ring-2 ring-primary ring-offset-2">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" />
            <AvatarFallback className="text-3xl">{user.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{user.name}</CardTitle>
          <CardDescription className="text-lg">{user.email}</CardDescription>
          {isAuthor && <Badge variant="secondary" className="mx-auto mt-2">Author</Badge>}
        </CardHeader>
        <CardContent className="text-center space-y-2">
            <div className="flex items-center justify-center text-2xl font-semibold text-primary">
                <DollarSign className="h-7 w-7 mr-2"/> 
                Wallet Balance: ${user.walletBalance.toFixed(2)}
            </div>
          <p className="text-muted-foreground">Manage your profile, subscriptions, and investments.</p>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-center gap-4">
            {isAuthor && (
              <Button asChild variant="default" className="w-full sm:w-auto">
                <Link href="/author/dashboard"><Edit3 className="mr-2 h-4 w-4"/> Author Dashboard</Link>
              </Button>
            )}
            <Button onClick={handleWithdraw} variant="outline" className="w-full sm:w-auto">
              <Landmark className="mr-2 h-4 w-4" /> Withdraw Funds (Mock)
            </Button>
            <Button onClick={logout} variant="destructive" className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
        </CardFooter>
      </Card>

      {/* Subscriptions Card */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><BookOpenCheck className="mr-2 h-6 w-6 text-primary"/>My Subscriptions</CardTitle>
          <CardDescription>Manga series you are currently subscribed to.</CardDescription>
        </CardHeader>
        <CardContent>
          {user.subscriptions.length > 0 ? (
            <ScrollArea className="h-48">
              <ul className="space-y-3">
                {user.subscriptions.map((sub) => (
                  <li key={sub.mangaId} className="p-3 border rounded-md flex justify-between items-center">
                    <div>
                      <Link href={`/manga/${sub.mangaId}`} className="font-semibold hover:text-primary">{sub.mangaTitle}</Link>
                      <p className="text-sm text-muted-foreground">
                        ${sub.monthlyPrice.toFixed(2)}/month - Subscribed on: {new Date(sub.subscribedSince).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground">You are not subscribed to any manga series yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Investments Card */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-primary"/>My Investments</CardTitle>
          <CardDescription>Your current investments in manga series.</CardDescription>
        </CardHeader>
        <CardContent>
          {investmentsWithMockROI.length > 0 ? (
             <ScrollArea className="h-60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manga</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Invested</TableHead>
                      <TableHead className="text-right">Mock Value</TableHead>
                      <TableHead className="text-right">Mock Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investmentsWithMockROI.map((inv) => (
                      <TableRow key={inv.mangaId}>
                        <TableCell>
                            <Link href={`/manga/${inv.mangaId}`} className="font-medium hover:text-primary">{inv.mangaTitle}</Link>
                            <p className="text-xs text-muted-foreground">Invested: {new Date(inv.investmentDate).toLocaleDateString()}</p>
                        </TableCell>
                        <TableCell className="text-right">{inv.sharesOwned}</TableCell>
                        <TableCell className="text-right">${inv.amountInvested.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${inv.mockCurrentValue.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-semibold ${inv.mockProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${inv.mockProfit.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </ScrollArea>
          ) : (
            <p className="text-muted-foreground">You have not made any investments yet.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Authored Manga - Conceptual - now replaced by Author Dashboard link */}
      {/* {isAuthor && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center"><Briefcase className="mr-2 h-6 w-6 text-primary"/>My Authored Manga</CardTitle>
            <CardDescription>Manage your published manga series and earnings (Conceptual).</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Author dashboard features (setting prices, viewing detailed analytics, managing payouts) would appear here.</p>
          </CardContent>
        </Card>
      )} */}


      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><Receipt className="mr-2 h-6 w-6 text-primary" />Recent Transactions (Mock)</CardTitle>
          <CardDescription>Your recent mock financial activities.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <ScrollArea className="h-60">
              <Table>
                <TableCaption>A list of your recent mock transactions.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map((tx) => ( // Show last 10
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize text-xs">{tx.type.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell className="text-sm">{tx.description}</TableCell>
                      <TableCell className={`text-right font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {tx.type.endsWith('_payment') || tx.type.endsWith('_deduction') ? '-' : '+'}
                        ${Math.abs(tx.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground">No mock transactions recorded yet.</p>
          )}
        </CardContent>
      </Card>


      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Recent Viewing History</CardTitle>
          <CardDescription>Your last viewed manga chapters.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentViewing.length > 0 ? (
            <ul className="space-y-2">
              {recentViewing.map(([mangaId, history]) => (
                <li key={`${mangaId}-${history.chapterId}`} className="p-3 border rounded-md">
                  <Link href={`/manga/${mangaId}/${history.chapterId}#page=${history.pageIndex + 1}`} className="hover:text-primary">
                    {/* Ideally, fetch manga title here. For now, using ID. */}
                    <p className="font-semibold">Manga ID: {mangaId}</p>
                    <p className="text-sm text-muted-foreground">
                      Chapter ID: {history.chapterId}, Page: {history.pageIndex + 1}
                    </p>
                    <p className="text-xs text-muted-foreground">Viewed on: {history.date.toLocaleDateString()}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No viewing history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}