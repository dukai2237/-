'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { getMangaById } from '@/lib/mock-data';
import { CommentSection } from '@/components/manga/CommentSection';
import { ShareMangaDialog } from '@/components/manga/ShareMangaDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Star } from 'lucide-react';

export default function MangaDetailPage({ params }: { params: Promise<{ mangaId: string }> }) {
  const { mangaId } = use(params);
  const manga = getMangaById(mangaId);
  const [shareOpen, setShareOpen] = useState(false);
  const [payType, setPayType] = useState<'subscribe'|'donate'|'invest'|null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [isPayPal, setIsPayPal] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [isRating, setIsRating] = useState(false);
  const { toast } = useToast();
  const { user, investInManga, purchaseAccess, donateToManga, rateManga, isSubscribedToManga, hasPurchasedChapter } = useAuth();

  if (!manga) {
    return <div>404 Not Found</div>;
  }

  // 权限与状态判断
  const isCreator = user?.accountType === 'creator';
  const isOwnManga = user && manga.author.id === user.id;
  // 访问权限判断（订阅、购买、投资）
  const isSubscribed = user && isSubscribedToManga(manga.id);
  const hasPurchased = user && manga.chapters.some(ch => hasPurchasedChapter(manga.id, ch.id));
  const isInvestor = user && manga.investmentOffer && manga.investmentOffer.isActive && user.investments?.some(inv => inv.mangaId === manga.id);
  // 评分权限：仅普通用户且非作者可评分
  const canRate = user && user.accountType === 'user' && !isOwnManga;

  // 评分提交
  const handleRate = async (score: 1 | 2 | 3) => {
    if (!canRate) {
      toast({ title: '无法评分', description: isCreator ? '创作者不能为漫画评分' : '请先解锁本漫画后再评分', variant: 'destructive' });
      return;
    }
    setIsRating(true);
    await rateManga(manga.id, score);
    setRating(score);
    setIsRating(false);
    toast({ title: '感谢您的评分！', description: `您为本漫画打了${score}星。` });
  };

  // 支付/投资校验
  const validatePayAmount = () => {
    if (!payAmount || Number(payAmount) <= 0) return false;
    if (payType === 'invest' && manga.investmentOffer) {
      const price = manga.investmentOffer.pricePerShare;
      return Number(payAmount) % price === 0;
    }
    return true;
  };

  // 支付处理
  const handlePayment = async () => {
    if (!validatePayAmount()) {
      toast({ title: '金额无效', description: payType === 'invest' ? `投资金额需为每股单价（${manga.investmentOffer?.pricePerShare}）的整数倍` : '请输入有效金额', variant: 'destructive' });
      return;
    }
    setPayType(null);
    if (payType === 'subscribe') {
      const accessType = manga.subscriptionModel === 'monthly' ? 'monthly' : 'chapter';
      await purchaseAccess(manga.id, accessType, manga.id, Number(payAmount));
      toast({ title: '订阅成功', description: '您已成功订阅本漫画。' });
    } else if (payType === 'donate') {
      await donateToManga(manga.id, manga.title, manga.author.id, Number(payAmount));
      toast({ title: '打赏成功', description: '感谢您的支持！' });
    } else if (payType === 'invest') {
      const shares = Math.floor(Number(payAmount) / (manga.investmentOffer?.pricePerShare || 1));
      await investInManga(manga.id, manga.title, shares, Number(payAmount), Number(payAmount));
      toast({ title: '投资成功', description: '感谢您对本漫画的投资！' });
    }
  };

  // PayPal 支付模拟
  const handlePayPal = () => {
    setIsPayPal(false);
    setPayType(null);
    toast({ title: 'PayPal 支付', description: '模拟 PayPal 支付成功。' });
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f7f7fa', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* 主卡片 */}
      <div style={{
        width: '100%', maxWidth: 900, background: '#fff', borderRadius: 18, boxShadow: '0 4px 32px #0002', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 32, padding: 32, marginBottom: 32
      }}>
        {/* 封面 */}
        <img src={manga.coverImage || '/default-cover.png'} alt={manga.title} style={{ width: 220, height: 320, objectFit: 'cover', borderRadius: 12, boxShadow: '0 2px 12px #0003', background: '#eee', flexShrink: 0 }} />
        {/* 信息区 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#23243a', lineHeight: 1.2 }}>{manga.title}</div>
          {/* 作者联系方式展示优化 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18, color: '#666', fontWeight: 500 }}>Author:</span>
            <span style={{ fontSize: 18, color: '#23243a', fontWeight: 700 }}>{manga.author.name}</span>
            {manga.author.contactDetails?.email && (
              <a href={`mailto:${manga.author.contactDetails.email}`} style={{ color: '#2563eb', fontSize: 15, marginLeft: 8, textDecoration: 'underline' }}>{manga.author.contactDetails.email}</a>
            )}
            {manga.author.contactDetails?.socialLinks && manga.author.contactDetails.socialLinks.length > 0 && (
              <span style={{ color: '#888', fontSize: 15, marginLeft: 8, display: 'flex', gap: 6 }}>
                {manga.author.contactDetails.socialLinks.map((link: any, idx: number) => (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', marginRight: 4 }}>{link.platform}</a>
                ))}
              </span>
            )}
          </div>
          {/* 简介 */}
          <div style={{ fontSize: 16, color: '#444', margin: '8px 0 2px 0', lineHeight: 1.7, maxHeight: 90, overflow: 'auto' }}>{manga.summary}</div>
          {/* 标签 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '4px 0' }}>
            {manga.genres?.map((g, i) => <span key={g} style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 14, borderRadius: 6, padding: '3px 12px', fontWeight: 500 }}>{g}</span>)}
          </div>
          {/* 评分优化：仅普通用户且非作者可评分 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
            <span style={{ fontWeight: 600 }}>Rating:</span>
            <span style={{ color: '#f59e42', fontWeight: 700, fontSize: 18 }}>{manga.averageRating?.toFixed(2) || '--'}</span>
            <span style={{ color: '#888', fontSize: 14 }}>({manga.ratingCount || 0} ratings)</span>
            {canRate && (
              <>
                {[1, 2, 3].map((s) => (
                  <button key={s} onClick={() => handleRate(s as 1 | 2 | 3)} disabled={isRating} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4 }} title={`Rate ${s}`}>
                    <Star size={22} color={rating >= s ? '#f59e42' : '#bbb'} fill={rating >= s ? '#f59e42' : 'none'} />
                  </button>
                ))}
              </>
            )}
            {!user && <span style={{ color: '#aaa', fontSize: 14, marginLeft: 8 }}>(Login to rate)</span>}
            {user && !canRate && <span style={{ color: '#aaa', fontSize: 14, marginLeft: 8 }}>(Only non-authors can rate)</span>}
          </div>
          {/* 分享按钮 */}
          <div style={{ margin: '8px 0 0 0', display: 'flex', gap: 12 }}>
            <button
              style={{ background: '#fff', color: '#2563eb', border: '1px solid #2563eb', borderRadius: 8, padding: '8px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 1px 6px #2563eb11', display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => setShareOpen(true)}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M17 8.5a2.5 2.5 0 1 0-2.45-3.01l-5.1 2.04a2.5 2.5 0 1 0 0 3.94l5.1 2.04A2.5 2.5 0 1 0 17 15.5a2.5 2.5 0 0 0-2.45-3.01l-5.1-2.04a2.5 2.5 0 1 0 0-3.94l5.1-2.04A2.5 2.5 0 1 0 17 8.5z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              分享
            </button>
            <ShareMangaDialog
              mangaTitle={manga.title}
              mangaUrl={typeof window !== 'undefined' ? window.location.href : `https://mangawalker.com/manga/${manga.id}`}
              isOpen={shareOpen}
              onOpenChange={setShareOpen}
            />
          </div>
          {/* 投资/众筹信息优化，增加说明与校验 */}
          {manga.investmentOffer && manga.investmentOffer.isActive && (
            <div style={{
              background: '#f0f6ff', border: '1px solid #b6d4fe', borderRadius: 10, padding: '18px 22px', margin: '10px 0 0 0', color: '#1d3b5a', boxShadow: '0 1px 8px #2563eb11', fontSize: 16
            }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, color: '#2563eb' }}>Investment Opportunity Open</div>
              <div style={{ marginBottom: 4 }}>
                <b>Details:</b> {manga.investmentOffer.description}
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 4 }}>
                <span>Total Dividend Ratio: <b>{manga.investmentOffer.sharesOfferedTotalPercent}%</b></span>
                <span>Shares Available: <b>{manga.investmentOffer.totalSharesInOffer}</b></span>
                <span>Price per Share: <b>{manga.investmentOffer.pricePerShare} USD</b></span>
                {manga.investmentOffer.minSubscriptionRequirement && <span>Min Subscriptions Required: <b>{manga.investmentOffer.minSubscriptionRequirement}</b></span>}
                {manga.investmentOffer.maxSharesPerUser && <span>Max Shares per User: <b>{manga.investmentOffer.maxSharesPerUser}</b></span>}
                {manga.investmentOffer.dividendPayoutCycle && <span>Payout Cycle: <b>{manga.investmentOffer.dividendPayoutCycle === 1 ? 'Monthly' : manga.investmentOffer.dividendPayoutCycle === 3 ? 'Quarterly' : manga.investmentOffer.dividendPayoutCycle === 6 ? 'Semi-Annual' : 'Yearly'}</b></span>}
              </div>
              <div style={{ color: '#2563eb', fontSize: 15, marginBottom: 6 }}>
                Invest to become a shareholder and receive dividends. Please read the offer details carefully. Minimum investment: <b>{manga.investmentOffer.pricePerShare} USD</b> per share.
              </div>
              <button style={{ background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 17, border: 'none', borderRadius: 8, padding: '10px 32px', marginTop: 8, cursor: 'pointer', transition: 'background 0.2s' }}
                onClick={() => { setPayType('invest'); setPayAmount(manga.investmentOffer?.pricePerShare?.toString()||''); }}>
                Invest in this Manga
              </button>
            </div>
          )}
          {/* 订阅/打赏按钮 */}
          <div style={{ display: 'flex', gap: 16, marginTop: 18 }}>
            {manga.subscriptionModel !== 'none' && (
              <button style={{ background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 18, border: 'none', borderRadius: 8, padding: '12px 36px', boxShadow: '0 1px 8px #2563eb22', cursor: 'pointer', transition: 'background 0.2s' }}
                onClick={() => { setPayType('subscribe'); setPayAmount(manga.subscriptionPrice?.toString()||''); }}>
                订阅 {manga.subscriptionModel === 'monthly' && `（${manga.subscriptionPrice?.toFixed(2) || 0} USD/月）`}
                {manga.subscriptionModel === 'per_chapter' && '（按章节）'}
              </button>
            )}
            <button style={{ background: '#fff', color: '#2563eb', fontWeight: 700, fontSize: 18, border: '1px solid #2563eb', borderRadius: 8, padding: '12px 36px', boxShadow: '0 1px 8px #2563eb11', cursor: 'pointer', transition: 'background 0.2s' }}
              onClick={() => { setPayType('donate'); setPayAmount('5'); }}>
              打赏作者
            </button>
          </div>
        </div>
      </div>
      {/* 支付弹窗优化，投资校验、金额校验、PayPal模拟 */}
      <Dialog open={!!payType || isPayPal} onOpenChange={open => { if(!open) { setPayType(null); setIsPayPal(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {payType === 'subscribe' && 'Subscription Payment'}
              {payType === 'donate' && 'Donate to Author'}
              {payType === 'invest' && 'Invest in this Manga'}
              {isPayPal && 'Pay with PayPal'}
            </DialogTitle>
            <DialogDescription>
              {payType === 'subscribe' && 'Please confirm your subscription payment.'}
              {payType === 'donate' && 'Enter donation amount. Thank you for your support!'}
              {payType === 'invest' && (
                <>
                  Enter investment amount to support this manga.<br/>
                  <span style={{ color: '#2563eb', fontSize: 14 }}>
                    Minimum: {manga.investmentOffer?.pricePerShare} USD, Maximum: {manga.investmentOffer?.maxSharesPerUser ? manga.investmentOffer.pricePerShare * manga.investmentOffer.maxSharesPerUser : 'No limit'} USD
                  </span>
                </>
              )}
              {isPayPal && 'Simulated PayPal payment.'}
            </DialogDescription>
          </DialogHeader>
          {!isPayPal && (
            <div style={{ margin: '16px 0' }}>
              <Input
                type="number"
                min={payType==='invest' ? manga.investmentOffer?.pricePerShare||1 : 1}
                max={payType==='invest' && manga.investmentOffer?.maxSharesPerUser ? manga.investmentOffer.pricePerShare * manga.investmentOffer.maxSharesPerUser : undefined}
                step={payType==='invest' ? manga.investmentOffer?.pricePerShare||1 : 1}
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder={payType==='donate' ? 'Donation Amount' : 'Amount'}
              />
            </div>
          )}
          {!isPayPal && (
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                onClick={handlePayment}
                disabled={Boolean(
                  !payAmount || Number(payAmount) <= 0 ||
                  (payType === 'invest' && (
                    Number(payAmount) < (manga.investmentOffer?.pricePerShare || 1) ||
                    (manga.investmentOffer?.maxSharesPerUser && Number(payAmount) > manga.investmentOffer.pricePerShare * manga.investmentOffer.maxSharesPerUser)
                  ))
                )}
                className="w-full"
              >
                Confirm Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => { setIsPayPal(true); }}
                className="w-full"
              >
                Pay with PayPal
              </Button>
            </div>
          )}
          {isPayPal && (
            <Button onClick={handlePayPal} className="w-full">Simulate PayPal Payment</Button>
          )}
        </DialogContent>
      </Dialog>
      {/* 章节列表 */}
      <div style={{
        width: '100%', maxWidth: 980, margin: '0 auto', background: '#fff',
        borderRadius: 18, boxShadow: '0 2px 12px #0001', padding: '28px 40px', marginBottom: 40
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, color: '#23243a' }}>章节</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {manga.chapters.map(chapter => (
            <li key={chapter.id} style={{
              background: '#f7f7fa', borderRadius: 8, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: '#23243a' }}>{chapter.title}</span>
              <Link href={`/manga/${manga.id}/chapter/${chapter.id}`}>
                <button style={{
                  background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 15,
                  border: 'none', borderRadius: 6, padding: '7px 22px',
                  boxShadow: '0 1px 4px #2563eb22', cursor: 'pointer', transition: 'background 0.2s'
                }}>阅读</button>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {/* 评论区优化：权限交由组件内部处理，外部不传 canComment/isCreator/isOwnManga 等 */}
      <div style={{ width: '100%', maxWidth: 980, margin: '0 auto 40px auto', background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px #0001', padding: '28px 40px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, color: '#23243a' }}>Comments</div>
        <div>
          <CommentSection mangaId={manga.id} />
        </div>
      </div>
    </div>
  );
}