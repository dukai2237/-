"use client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { DollarSign, BookOpenCheck, BarChart3, Briefcase, LogOut, Landmark, Receipt, Edit3, BookUp, PlusCircle, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, logout, viewingHistory, transactions, addFunds, approveCreatorAccount } = useAuth(); 
  const router = useRouter();
  const { toast } = useToast();

  const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false);
  const [fundsToAdd, setFundsToAdd] = useState("");

  // Conceptual: Mock admin action button state
  const [isMockAdmin, setIsMockAdmin] = useState(false); 
  useEffect(() => {
    // Simulate checking if the current user is an admin for dev purposes
    if (user && user.email === 'admin@example.com') { // Replace with actual admin check
        setIsMockAdmin(true);
    } else {
        setIsMockAdmin(false);
    }
  }, [user]);


  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/profile");
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-4">您需要登录后才能查看此页面。</p>
        <Button asChild>
          <Link href="/login">前往登录</Link>
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
        toast({ title: "金额无效", description: "请输入一个有效的正数金额。", variant: "destructive" });
        return;
    }
    addFunds(amount);
    setFundsToAdd("");
    setIsAddFundsDialogOpen(false);
  };
  
  const handleWithdraw = () => {
    // For now, just a toast. In real app, this would be more complex.
    // Also, only creators or users with earnings should be able to withdraw.
    if (user.walletBalance <= 0) {
        toast({title: "余额不足", description: "您的钱包余额为0，无法提现。", variant: "destructive"});
        return;
    }
    toast({title: "提现功能 (模拟)", description: "实际应用中，这将启动提现流程。当前余额: $" + user.walletBalance.toFixed(2), duration: 5000});
    // Conceptually, you might record a withdrawal transaction here if it were real
  };

  const isCreator = user.accountType === 'creator';

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 ring-2 ring-primary ring-offset-2">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" />
            <AvatarFallback className="text-3xl" suppressHydrationWarning>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl" suppressHydrationWarning>{user.name}</CardTitle>
          <CardDescription className="text-lg" suppressHydrationWarning>{user.email}</CardDescription>
          
          {isCreator && (
            user.isApproved ? (
              <Badge variant="default" className="mx-auto mt-2 text-sm px-3 py-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-1.5 h-4 w-4" />已认证创作者
              </Badge>
            ) : (
              <Badge variant="destructive" className="mx-auto mt-2 text-sm px-3 py-1">
                <Clock className="mr-1.5 h-4 w-4" />创作者账号待审批
              </Badge>
            )
          )}
          {!isCreator && <Badge variant="outline" className="mx-auto mt-2 text-sm px-3 py-1">普通用户</Badge>}

        </CardHeader>
        <CardContent className="text-center space-y-2">
            <div className="flex items-center justify-center text-2xl font-semibold text-primary">
                <DollarSign className="h-7 w-7 mr-2"/> 
                钱包余额: ${user.walletBalance.toFixed(2)}
            </div>
          <p className="text-muted-foreground" suppressHydrationWarning>管理您的个人资料、订阅和投资。</p>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-center gap-4">
            {isCreator && user.isApproved && (
              <Button asChild variant="default" className="w-full sm:w-auto">
                <Link href="/creator/dashboard"><BookUp className="mr-2 h-4 w-4"/> 创作者控制面板</Link>
              </Button>
            )}
            <Button onClick={() => setIsAddFundsDialogOpen(true)} variant="secondary" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> 钱包充值 (模拟)
            </Button>
            <Button onClick={handleWithdraw} variant="outline" className="w-full sm:w-auto">
              <Landmark className="mr-2 h-4 w-4" /> 资金提现 (模拟)
            </Button>
            <Button onClick={logout} variant="destructive" className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" /> 登出
            </Button>
        </CardFooter>
      </Card>
      
      {/* Conceptual Admin Action: Button to approve a pending creator (visible only if current user is a mock admin and target user is a pending creator) */}
      {isMockAdmin && user.accountType === 'creator' && !user.isApproved && (
        <Card className="w-full max-w-2xl mx-auto bg-yellow-50 border-yellow-300">
            <CardHeader>
                <CardTitle className="flex items-center text-yellow-700"><AlertCircle className="mr-2 h-5 w-5"/>模拟管理员操作</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-yellow-600">此创作者账号 ({user.email}) 当前待审批。</p>
            </CardContent>
            <CardFooter>
                <Button onClick={() => approveCreatorAccount(user.id)} variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                    <CheckCircle className="mr-2 h-4 w-4"/> 批准此创作者账号 (模拟)
                </Button>
            </CardFooter>
        </Card>
      )}


      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><BookOpenCheck className="mr-2 h-6 w-6 text-primary"/>我的订阅</CardTitle>
          <CardDescription>您当前订阅的漫画系列。</CardDescription>
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
                        ${sub.monthlyPrice.toFixed(2)}/月 - 订阅于: {new Date(sub.subscribedSince).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">订阅中</Badge>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground">您尚未订阅任何漫画系列。</p>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-primary"/>我的投资 (模拟)</CardTitle>
          <CardDescription>您在漫画系列中的当前投资。</CardDescription>
        </CardHeader>
        <CardContent>
          {investmentsWithMockROI.length > 0 ? (
             <ScrollArea className="h-60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>漫画名称</TableHead>
                      <TableHead className="text-right">持有份数</TableHead>
                      <TableHead className="text-right">投资金额</TableHead>
                      <TableHead className="text-right">模拟当前价值</TableHead>
                      <TableHead className="text-right">模拟收益</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investmentsWithMockROI.map((inv) => (
                      <TableRow key={inv.mangaId}>
                        <TableCell>
                            <Link href={`/manga/${inv.mangaId}`} className="font-medium hover:text-primary">{inv.mangaTitle}</Link>
                            <p className="text-xs text-muted-foreground">投资于: {new Date(inv.investmentDate).toLocaleDateString()}</p>
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
            <p className="text-muted-foreground">您尚未进行任何投资。</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><Receipt className="mr-2 h-6 w-6 text-primary" />近期交易 (模拟)</CardTitle>
          <CardDescription>您最近的模拟财务活动记录。</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <ScrollArea className="h-60">
              <Table>
                <TableCaption>您最近的模拟交易列表。</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead className="text-right">金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map((tx) => ( 
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs tabular-nums">{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize text-xs whitespace-nowrap">{tx.type.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell className="text-sm">{tx.description}</TableCell>
                      <TableCell className={`text-right font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {tx.amount < 0 ? '-' : (tx.amount > 0 && tx.type !== 'rating_update' && tx.type !== 'manga_creation' && tx.type !== 'manga_deletion' && tx.type !== 'creator_approval_pending' && tx.type !== 'creator_approved' ? '+' : '')}
                        ${tx.type === 'rating_update' || tx.type === 'manga_creation' || tx.type === 'manga_deletion' || tx.type === 'creator_approval_pending' || tx.type === 'creator_approved' ? Math.abs(tx.amount).toFixed(0) : Math.abs(tx.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground">暂无模拟交易记录。</p>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>最近浏览历史</CardTitle>
          <CardDescription>您上次观看的漫画章节。</CardDescription>
        </CardHeader>
        <CardContent>
          {recentViewing.length > 0 ? (
            <ul className="space-y-2">
              {recentViewing.map(([mangaId, history]) => (
                <li key={`${mangaId}-${history.chapterId}`} className="p-3 border rounded-md">
                  <Link href={`/manga/${mangaId}/${history.chapterId}#page=${history.pageIndex + 1}`} className="hover:text-primary">
                    <p className="font-semibold">漫画ID: {mangaId}</p>
                    <p className="text-sm text-muted-foreground">
                      章节ID: {history.chapterId}, 页码: {history.pageIndex + 1}
                    </p>
                    <p className="text-xs text-muted-foreground">观看于: {history.date.toLocaleDateString()}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">暂无浏览历史。</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>钱包充值 (模拟)</DialogTitle>
            <DialogDescription>
              输入您希望添加到钱包的金额。此操作为模拟，不会产生真实交易。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="fundsAmount" className="text-right">金额 ($)</label>
              <Input
                id="fundsAmount"
                type="number"
                value={fundsToAdd}
                onChange={(e) => setFundsToAdd(e.target.value)}
                className="col-span-3"
                placeholder="例如: 50.00"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
            <Button onClick={handleAddFunds}>确认充值</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
