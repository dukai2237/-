// src/app/profile/page.tsx
"use client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { DollarSign, BookOpenCheck, BarChart3, Briefcase, LogOut, Landmark, Receipt, Edit3, BookUp, PlusCircle, CheckCircle, Clock, AlertCircle, Heart, Search, Store, Tag, MinusCircle, Edit, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getMangaById, getShareListingById, mockAuthors, updateMockAuthorBalance } from "@/lib/mock-data"; 
import type { UserInvestment, ShareListing, AuthorInfo as GlobalAuthorInfo } from '@/lib/types';
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';

const USER_PROFILE_UPDATE_COOLDOWN_DAYS = 30;
const CREATOR_PROFILE_UPDATE_COOLDOWN_DAYS = 90;


export default function ProfilePage() {
  const { 
    user, logout, viewingHistory, transactions, addFunds, withdrawFunds, 
    approveCreatorAccount, favorites, listSharesForSale, delistSharesFromSale,
    updateUserProfile 
  } = useAuth(); 
  const router = useRouter();
  const { toast } = useToast();

  const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false);
  const [isWithdrawFundsDialogOpen, setIsWithdrawFundsDialogOpen] = useState(false);
  const [isListSharesDialogOpen, setIsListSharesDialogOpen] = useState(false);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  
  const [fundsToAdd, setFundsToAdd] = useState("");
  const [fundsToWithdraw, setFundsToWithdraw] = useState("");
  
  const [selectedInvestmentToList, setSelectedInvestmentToList] = useState<UserInvestment | null>(null);
  const [sharesToList, setSharesToList] = useState("");
  const [pricePerShareToList, setPricePerShareToList] = useState("");
  const [listingDescription, setListingDescription] = useState("");

  const [newName, setNewName] = useState(user?.name || "");
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const avatarFileRef = useRef<HTMLInputElement>(null);


  const [isMockAdmin, setIsMockAdmin] = useState(false); 
  const [authorDetails, setAuthorDetails] = useState<GlobalAuthorInfo | null | undefined>(null);

  useEffect(() => {
    if (user) {
        setNewName(user.name);
        setNewAvatarPreview(user.avatarUrl);
        if (user.email === 'admin@example.com') { 
            setIsMockAdmin(true);
        } else {
            setIsMockAdmin(false);
        }
        if (user.accountType === 'creator') {
             const author = mockAuthors.find(author => author.id === user.id);
             setAuthorDetails(author);
        } else {
             setAuthorDetails(null);
        }
    } else {
      router.push("/login?redirect=/profile");
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

  const handleAddFunds = () => {
    const amount = parseFloat(fundsToAdd);
    if (isNaN(amount) || amount <= 0) {
        toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
        return;
    }
    addFunds(amount);
    setFundsToAdd("");
    setIsAddFundsDialogOpen(false);
  };
  
  const handleAuthorWithdraw = async () => {
    if (!user || user.accountType !== 'creator' || !authorDetails) {
        toast({title: "Error", description: "Only creators can withdraw author funds.", variant: "destructive"});
        return;
    }
    const amount = parseFloat(fundsToWithdraw);
    if (isNaN(amount) || amount <= 0) {
        toast({ title: "Invalid Amount", description: "Withdrawal amount must be positive.", variant: "destructive" });
        return;
    }
    if (authorDetails.walletBalance < amount) {
        toast({
            title: "Insufficient Author Balance",
            description: `Cannot withdraw $${amount.toFixed(2)}. Creator wallet balance: $${authorDetails.walletBalance.toFixed(2)}.`,
            variant: "destructive"
        });
        return;
    }
    
    // Simulate dividend check logic if needed (copied from AuthContext, adapt if necessary)
    for (const mangaId of user.authoredMangaIds) {
        const manga = getMangaById(mangaId);
        if (manga?.investmentOffer?.isActive && manga.investmentOffer.dividendPayoutCycle && manga.investors.length > 0) {
            const cycleMonths = manga.investmentOffer.dividendPayoutCycle;
            const lastPayoutDateForManga = manga.investmentOffer.lastDividendPayoutDate
                                        ? new Date(manga.investmentOffer.lastDividendPayoutDate)
                                        : (manga.lastInvestmentDate ? new Date(manga.lastInvestmentDate) : new Date(manga.publishedDate));
            
            const nextPayoutDueDate = new Date(lastPayoutDateForManga);
            nextPayoutDueDate.setMonth(nextPayoutDueDate.getMonth() + cycleMonths);

            if (new Date() >= nextPayoutDueDate) {
                const totalEarningsForManga = (manga.totalRevenueFromSubscriptions + manga.totalRevenueFromDonations + manga.totalRevenueFromMerchandise);
                const potentialDividendPool = totalEarningsForManga * (manga.investmentOffer.sharesOfferedTotalPercent / 100);
                
                if (potentialDividendPool > 0) { 
                    toast({
                        title: "Withdrawal Blocked",
                        description: `Dividends for manga "${manga.title}" are due. Process payouts before withdrawing.`,
                        variant: "destructive", duration: 8000,
                    });
                    return;
                }
            }
        }
    }

    updateMockAuthorBalance(authorDetails.id, authorDetails.walletBalance - amount);
    // Refresh authorDetails locally (or rely on AuthContext to update user which might trigger re-fetch)
    setAuthorDetails(prev => prev ? {...prev, walletBalance: prev.walletBalance - amount} : null);

    transactions.unshift({ // Manually add to local transaction display if not handled by a global context call
        id: `tx-withdraw-${Date.now()}`,
        type: 'wallet_withdrawal',
        amount: -amount,
        userId: user.id,
        description: `Creator ${user.name} withdrew $${amount.toFixed(2)} from author wallet.`,
        timestamp: new Date().toISOString(),
    });

    setFundsToWithdraw("");
    setIsWithdrawFundsDialogOpen(false);
    toast({title: "Withdrawal Processed", description: `$${amount.toFixed(2)} has been withdrawn from author wallet.`});
  };


  const handleOpenListSharesDialog = (investment: UserInvestment) => {
    setSelectedInvestmentToList(investment);
    setSharesToList((investment.sharesOwned - (investment.sharesListed || 0)).toString()); 
    setPricePerShareToList("");
    setListingDescription("");
    setIsListSharesDialogOpen(true);
  };

  const handleListShares = async () => {
    if (!selectedInvestmentToList || !user) return;
    const numShares = parseInt(sharesToList, 10);
    const price = parseFloat(pricePerShareToList);

    if (isNaN(numShares) || numShares <= 0) {
      toast({ title: "Invalid Shares", description: "Number of shares must be a positive integer.", variant: "destructive" });
      return;
    }
    if (isNaN(price) || price <= 0) {
      toast({ title: "Invalid Price", description: "Price per share must be a positive number.", variant: "destructive" });
      return;
    }
    if (listingDescription.length > 1000) {
      toast({ title: "Description Too Long", description: "Listing description cannot exceed 1000 characters.", variant: "destructive" });
      return;
    }
    const currentlyOwned = selectedInvestmentToList.sharesOwned;
    const alreadyListed = selectedInvestmentToList.sharesListed || 0;
    if (numShares > (currentlyOwned - alreadyListed) ) {
        toast({ title: "Not Enough Shares", description: `You only have ${currentlyOwned - alreadyListed} unlisted shares available to sell for this manga.`, variant: "destructive"});
        return;
    }

    const success = await listSharesForSale(selectedInvestmentToList.mangaId, numShares, price, listingDescription);
    if (success) {
      setIsListSharesDialogOpen(false);
      setSelectedInvestmentToList(null);
    }
  };
  
  const handleDelistShares = async (investment: UserInvestment) => {
    if (!investment.listingId) {
        toast({title: "Error", description: "No active listing found for these shares.", variant: "destructive"});
        return;
    }
    await delistSharesFromSale(investment.mangaId, investment.listingId);
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    const success = await updateUserProfile(newName, newAvatarPreview);
    if (success) {
        setIsEditProfileDialogOpen(false);
        // setNewAvatarFile(null); // Optionally reset file input state
    }
  };

  const getNextProfileUpdateTime = (): string => {
    if (!user || !user.lastProfileUpdate) return "Now";
    const cooldownDays = user.accountType === 'creator' ? CREATOR_PROFILE_UPDATE_COOLDOWN_DAYS : USER_PROFILE_UPDATE_COOLDOWN_DAYS;
    const lastUpdate = new Date(user.lastProfileUpdate);
    const nextUpdate = new Date(lastUpdate.setDate(lastUpdate.getDate() + cooldownDays));
    return new Date() > nextUpdate ? "Now" : nextUpdate.toLocaleDateString();
  };

  const canUpdateProfile = (): boolean => {
    if (!user || !user.lastProfileUpdate) return true;
    const cooldownDays = user.accountType === 'creator' ? CREATOR_PROFILE_UPDATE_COOLDOWN_DAYS : USER_PROFILE_UPDATE_COOLDOWN_DAYS;
    const lastUpdate = new Date(user.lastProfileUpdate).getTime();
    const now = Date.now();
    return (now - lastUpdate) / (1000 * 60 * 60 * 24) >= cooldownDays;
  };


  const isCreator = user.accountType === 'creator';
  const favoritedMangaList = user.favorites?.map(id => getMangaById(id)).filter(Boolean) || [];
  const userShareListings = user.investments.filter(inv => inv.isListedForSale && inv.listingId).map(inv => getShareListingById(inv.listingId!)).filter(Boolean) as ShareListing[];

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center relative">
          <Avatar className="w-24 h-24 mx-auto mb-4 ring-2 ring-primary ring-offset-2">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" />
            <AvatarFallback className="text-3xl" suppressHydrationWarning>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl" suppressHydrationWarning>{user.name}</CardTitle>
          <CardDescription className="text-lg" suppressHydrationWarning>{user.email}</CardDescription>
          
          {isCreator && (
            user.isApproved ? (
              <Badge variant="default" className="mx-auto mt-2 text-sm px-3 py-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-1.5 h-4 w-4" />Approved Creator
              </Badge>
            ) : (
              <Badge variant="destructive" className="mx-auto mt-2 text-sm px-3 py-1">
                <Clock className="mr-1.5 h-4 w-4" />Creator Account Pending Approval
              </Badge>
            )
          )}
          {!isCreator && <Badge variant="outline" className="mx-auto mt-2 text-sm px-3 py-1">Regular User</Badge>}
           <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2" 
            onClick={() => {
                setNewName(user.name);
                setNewAvatarPreview(user.avatarUrl);
                setNewAvatarFile(null);
                setIsEditProfileDialogOpen(true);
            }}
            title="Edit Profile"
            disabled={!canUpdateProfile()}
            suppressHydrationWarning
            >
            <UserCog className="h-5 w-5" />
          </Button>
          <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
            Next profile update: {getNextProfileUpdateTime()}
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-2">
            <div className="flex items-center justify-center text-2xl font-semibold text-primary">
                <DollarSign className="h-7 w-7 mr-2"/> 
                Wallet Balance: ${user.walletBalance.toFixed(2)}
            </div>
          {authorDetails && (
            <div className="flex items-center justify-center text-xl font-semibold text-green-600">
                <Landmark className="h-6 w-6 mr-2"/> 
                Creator Earnings: ${authorDetails.walletBalance.toFixed(2)}
            </div>
           )}
          <p className="text-muted-foreground" suppressHydrationWarning>Manage your profile, subscriptions, and investments.</p>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-center gap-4">
            {isCreator && user.isApproved && (
              <Button asChild variant="default" className="w-full sm:w-auto">
                <Link href="/creator/dashboard"><BookUp className="mr-2 h-4 w-4"/> Creator Dashboard</Link>
              </Button>
            )}
            <Button onClick={() => setIsAddFundsDialogOpen(true)} variant="secondary" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Funds (Simulated)
            </Button>
            {isCreator && authorDetails && (
              <Button onClick={() => setIsWithdrawFundsDialogOpen(true)} variant="outline" className="w-full sm:w-auto" disabled={authorDetails.walletBalance <= 0}>
                <Landmark className="mr-2 h-4 w-4" /> Withdraw Creator Earnings
              </Button>
            )}
            <Button onClick={logout} variant="destructive" className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
        </CardFooter>
      </Card>
      
      {isMockAdmin && user.accountType === 'creator' && !user.isApproved && (
        <Card className="w-full max-w-2xl mx-auto bg-yellow-50 border-yellow-300">
            <CardHeader>
                <CardTitle className="flex items-center text-yellow-700"><AlertCircle className="mr-2 h-5 w-5"/>Mock Admin Action</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-yellow-600">This creator account ({user.email}) is currently pending approval.</p>
            </CardContent>
            <CardFooter>
                <Button onClick={() => approveCreatorAccount(user.id)} variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                    <CheckCircle className="mr-2 h-4 w-4"/> Approve Creator Account (Mock)
                </Button>
            </CardFooter>
        </Card>
      )}


      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><BookOpenCheck className="mr-2 h-6 w-6 text-primary"/>My Subscriptions</CardTitle>
          <CardDescription>Manga series you are currently subscribed to or chapters you've purchased.</CardDescription>
        </CardHeader>
        <CardContent>
          {user.subscriptions.length > 0 ? (
            <ScrollArea className="h-48">
              <ul className="space-y-3">
                {user.subscriptions.map((sub, index) => (
                  <li key={`${sub.mangaId}-${sub.chapterId || index}`} className="p-3 border rounded-md flex justify-between items-center">
                    <div>
                      <Link href={`/manga/${sub.mangaId}${sub.chapterId ? `/${sub.chapterId}` : ''}`} className="font-semibold hover:text-primary">
                        {sub.mangaTitle} {sub.type === 'chapter' && sub.chapterId ? `(Chapter ${getMangaById(sub.mangaId)?.chapters.find(c=>c.id===sub.chapterId)?.chapterNumber || 'N/A'})` : ''}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {sub.type === 'monthly' ? `$${sub.pricePaid.toFixed(2)}/month - Subscribed: ${new Date(sub.subscribedSince).toLocaleDateString()}` : `Paid $${sub.pricePaid.toFixed(2)} - Purchased: ${new Date(sub.subscribedSince).toLocaleDateString()}`}
                        {sub.type === 'monthly' && sub.expiresAt && ` (Renews: ${new Date(sub.expiresAt).toLocaleDateString()})`}
                      </p>
                    </div>
                    <Badge variant={sub.type === 'monthly' ? "default" : "secondary"}>{sub.type === 'monthly' ? 'Subscribed' : 'Chapter Purchased'}</Badge>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground">You have no active subscriptions or chapter purchases.</p>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><Heart className="mr-2 h-6 w-6 text-primary"/>My Favorites</CardTitle>
          <CardDescription>Manga series you have favorited.</CardDescription>
        </CardHeader>
        <CardContent>
          {favoritedMangaList.length > 0 ? (
            <ScrollArea className="h-48">
              <ul className="space-y-3">
                {favoritedMangaList.map((manga) => manga && (
                  <li key={manga.id} className="p-3 border rounded-md flex justify-between items-center">
                    <Link href={`/manga/${manga.id}`} className="font-semibold hover:text-primary">{manga.title}</Link>
                    <Badge variant="outline">Favorited</Badge>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground">You haven't favorited any manga series yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-primary"/>My Investments (Simulated)</CardTitle>
          <CardDescription>Your current investments in manga series and options to list them for sale.</CardDescription>
        </CardHeader>
        <CardContent>
          {investmentsWithMockROI.length > 0 ? (
             <ScrollArea className="h-72"> 
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manga</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Value (Sim.)</TableHead>
                      <TableHead className="text-right">Profit (Sim.)</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investmentsWithMockROI.map((inv) => (
                      <TableRow key={inv.mangaId}>
                        <TableCell>
                            <Link href={`/manga/${inv.mangaId}`} className="font-medium hover:text-primary">{inv.mangaTitle}</Link>
                            <p className="text-xs text-muted-foreground">Invested: {new Date(inv.investmentDate).toLocaleDateString()}</p>
                             {inv.isListedForSale && inv.listingId && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                    <Store className="mr-1 h-3 w-3"/> On Market ({inv.sharesListed} shares @ ${inv.listedPricePerShare?.toFixed(2)})
                                </Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right">{inv.sharesOwned}</TableCell>
                        <TableCell className="text-right">${inv.amountInvested.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${inv.mockCurrentValue.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-semibold ${inv.mockProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${inv.mockProfit.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                           {inv.isListedForSale && inv.listingId ? (
                             <Button variant="outline" size="sm" onClick={() => handleDelistShares(inv)}>
                                <MinusCircle className="mr-1 h-4 w-4"/> Delist
                             </Button>
                           ) : (
                             (inv.sharesOwned - (inv.sharesListed || 0)) > 0 && (
                                <Button variant="default" size="sm" onClick={() => handleOpenListSharesDialog(inv)}>
                                    <Store className="mr-1 h-4 w-4"/> Sell Shares
                                </Button>
                             )
                           )}
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
      
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><Receipt className="mr-2 h-6 w-6 text-primary" />Recent Transactions (Simulated)</CardTitle>
          <CardDescription>Your latest simulated financial activities.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <ScrollArea className="h-60">
              <Table>
                <TableCaption>A list of your recent simulated transactions.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map((tx) => ( 
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs tabular-nums">{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize text-xs whitespace-nowrap">{tx.type.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell className="text-sm">{tx.description}</TableCell>
                      <TableCell className={`text-right font-medium ${tx.amount < 0 || ['platform_earning', 'user_payment'].includes(tx.type) ? 'text-red-600' : 'text-green-600'}`}>
                        {tx.amount < 0 || tx.type === 'user_payment' ? '-' : (tx.amount > 0 && !['rating_update', 'manga_creation', 'manga_deletion', 'creator_approval_pending', 'creator_approved', 'platform_earning', 'list_shares_for_sale', 'delist_shares_from_sale', 'profile_update'].includes(tx.type) ? '+' : '')}
                        ${Math.abs(tx.amount).toFixed(['rating_update', 'manga_creation', 'manga_deletion', 'creator_approval_pending', 'creator_approved', 'list_shares_for_sale', 'delist_shares_from_sale', 'profile_update'].includes(tx.type) ? 0 : 2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground">No simulated transaction records yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><Search className="mr-2 h-6 w-6 text-primary"/>Search History</CardTitle>
          <CardDescription>Your recent search queries.</CardDescription>
        </CardHeader>
        <CardContent>
          {user.searchHistory && user.searchHistory.length > 0 ? (
             <ScrollArea className="h-32">
              <ul className="space-y-2">
                {user.searchHistory.map((term, index) => (
                  <li key={index} className="p-2 border rounded-md text-sm">
                    <Link href={`/?search=${encodeURIComponent(term)}`} className="hover:text-primary">
                      {term}
                    </Link>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground">No search history yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Recent Viewing History</CardTitle>
          <CardDescription>Manga chapters you last viewed.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentViewing.length > 0 ? (
            <ul className="space-y-2">
              {recentViewing.map(([mangaId, history]) => (
                <li key={`${mangaId}-${history.chapterId}`} className="p-3 border rounded-md">
                  <Link href={`/manga/${mangaId}/${history.chapterId}#page=${history.pageIndex + 1}`} className="hover:text-primary">
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

      <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds (Simulated)</DialogTitle>
            <DialogDescription>
              Enter the amount you wish to add to your wallet. This is a simulation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fundsAmount" className="text-right">Amount ($)</Label>
              <Input
                id="fundsAmount"
                type="number"
                value={fundsToAdd}
                onChange={(e) => setFundsToAdd(e.target.value)}
                className="col-span-3"
                placeholder="e.g.: 50.00"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleAddFunds}>Confirm Deposit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isCreator && authorDetails && (
        <Dialog open={isWithdrawFundsDialogOpen} onOpenChange={setIsWithdrawFundsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Withdraw Creator Earnings (Simulated)</DialogTitle>
                    <DialogDescription>
                        Enter the amount you wish to withdraw from your creator earnings wallet. Current balance: ${authorDetails.walletBalance.toFixed(2)}. This is a simulation.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="withdrawAmountCreator" className="text-right">Amount ($)</Label>
                        <Input
                            id="withdrawAmountCreator"
                            type="number"
                            value={fundsToWithdraw}
                            onChange={(e) => setFundsToWithdraw(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g.: 20.00"
                            max={authorDetails.walletBalance}
                        />
                    </div>
                     {authorDetails.bankDetails && (
                        <div className="col-span-4 text-sm text-muted-foreground">
                            <p>Withdrawal will be sent to:</p>
                            <p>Bank: {authorDetails.bankDetails.bankName}</p>
                            <p>Account: ****{authorDetails.bankDetails.accountNumber.slice(-4)}</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleAuthorWithdraw} disabled={parseFloat(fundsToWithdraw) > authorDetails.walletBalance || parseFloat(fundsToWithdraw) <= 0}>Confirm Withdrawal</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}


      <Dialog open={isListSharesDialogOpen} onOpenChange={setIsListSharesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>List Shares for Sale</DialogTitle>
            <DialogDescription>
              Sell your shares of "{selectedInvestmentToList?.mangaTitle}" on the market.
              You have {(selectedInvestmentToList?.sharesOwned || 0) - (selectedInvestmentToList?.sharesListed || 0)} unlisted shares.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sharesToList" className="text-right col-span-1">Shares</Label>
              <Input
                id="sharesToList"
                type="number"
                value={sharesToList}
                onChange={(e) => setSharesToList(e.target.value)}
                className="col-span-3"
                placeholder="Number of shares"
                min="1"
                max={((selectedInvestmentToList?.sharesOwned || 0) - (selectedInvestmentToList?.sharesListed || 0)).toString()}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pricePerShareToList" className="text-right col-span-1">Price/Share ($)</Label>
              <Input
                id="pricePerShareToList"
                type="number"
                value={pricePerShareToList}
                onChange={(e) => setPricePerShareToList(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 15.50"
                step="0.01"
                min="0.01"
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="listingDescription">Listing Description (Optional, Max 1000 chars)</Label>
                <Textarea 
                    id="listingDescription"
                    value={listingDescription}
                    onChange={(e) => setListingDescription(e.target.value)}
                    placeholder="Why are you selling? What's special about this manga?"
                    rows={3}
                    maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">{listingDescription.length}/1000</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleListShares}>Confirm Listing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditProfileDialogOpen} onOpenChange={setIsEditProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                    Update your name and avatar. 
                    {user.accountType === 'user' && ` You can update again in ${USER_PROFILE_UPDATE_COOLDOWN_DAYS} days.`}
                    {user.accountType === 'creator' && ` You can update again in ${CREATOR_PROFILE_UPDATE_COOLDOWN_DAYS} days.`}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="newName">Name</Label>
                    <Input 
                        id="newName" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)} 
                        placeholder="Your new name"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newAvatar">Avatar (Local Upload)</Label>
                    <Input 
                        id="newAvatar" 
                        type="file" 
                        accept="image/*" 
                        ref={avatarFileRef}
                        onChange={handleAvatarChange}
                        className="text-sm"
                    />
                    {newAvatarPreview && (
                        <div className="mt-2 relative w-24 h-24 rounded-full overflow-hidden border">
                            <Image src={newAvatarPreview} alt="New avatar preview" layout="fill" objectFit="cover" data-ai-hint="avatar preview"/>
                        </div>
                    )}
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleUpdateProfile} disabled={!canUpdateProfile() || (!newName.trim() && !newAvatarFile)}>Update Profile</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
