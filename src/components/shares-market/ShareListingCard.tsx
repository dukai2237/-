// src/components/shares-market/ShareListingCard.tsx
"use client";

import Image from 'next/image';
import type { ShareListing } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Package, Eye, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import React from 'react';

interface ShareListingCardProps {
  listing: ShareListing;
  currentUserId?: string;
}

export const ShareListingCard = React.memo(function ShareListingCard({ listing, currentUserId }: ShareListingCardProps) {
  const { user, followShareListing, unfollowShareListing, isShareListingFollowed, purchaseSharesFromListing } = useAuth();
  const { toast } = useToast();

  const isFollowed = user ? isShareListingFollowed(listing.id) : false;
  const canUserPurchaseShares = user ? (user.investmentOpportunitiesAvailable || 0) > 0 : false;

  const handleFollowToggle = () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to follow listings.", variant: "destructive" });
      return;
    }
    if (isFollowed) {
      unfollowShareListing(listing.id);
    } else {
      followShareListing(listing.id);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to purchase shares.", variant: "destructive" });
      return;
    }
    if (user.accountType === 'creator') {
        toast({ title: "Action Not Allowed", description: "Creators cannot purchase shares from the market.", variant: "destructive" });
        return;
    }
    if (!canUserPurchaseShares) {
        toast({ title: "Purchase Locked", description: `You need an available investment opportunity. Earn one via 5 combined subscriptions/donations. You have ${user.investmentOpportunitiesAvailable || 0}.`, variant: "destructive", duration: 8000 });
        return;
    }
    if (user.id === listing.sellerUserId) {
      toast({ title: "Cannot Buy Own Shares", description: "You cannot purchase shares you listed yourself.", variant: "default" });
      return;
    }
    
    const sharesToBuy = listing.sharesOffered; 
    await purchaseSharesFromListing(listing.id, sharesToBuy);
  };


  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 group">
      <CardHeader className="p-0 relative">
        <div className="aspect-[2/3] relative overflow-hidden">
          <Image
            src={listing.coverImage || `https://picsum.photos/400/600?random=${listing.mangaId}`}
            alt={`Cover of ${listing.mangaTitle}`}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-300"
            data-ai-hint="manga cover investment"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-2">
        <CardTitle className="text-lg mb-1 leading-tight">
          <Link href={`/manga/${listing.mangaId}`} className="hover:text-primary transition-colors" suppressHydrationWarning>
            {listing.mangaTitle}
          </Link>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground" suppressHydrationWarning>
          By <span className="font-medium text-foreground">{listing.authorName}</span>
        </CardDescription>
        
        <div className="pt-2">
            <p className="text-sm font-semibold flex items-center" suppressHydrationWarning>
                <Package className="mr-2 h-4 w-4 text-primary" /> {listing.sharesOffered} Shares Offered
            </p>
            <p className="text-sm font-semibold flex items-center" suppressHydrationWarning>
                <DollarSign className="mr-2 h-4 w-4 text-green-500" /> ${listing.pricePerShare.toFixed(2)} per Share
            </p>
            <p className="text-sm text-muted-foreground flex items-center" suppressHydrationWarning>
                <Briefcase className="mr-2 h-4 w-4" />Seller: {listing.sellerName}
            </p>
        </div>

        {listing.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 pt-1" suppressHydrationWarning>
            Seller's Note: {listing.description}
          </p>
        )}
         <p className="text-xs text-muted-foreground pt-1" suppressHydrationWarning>
            Listed: {new Date(listing.listedDate).toLocaleDateString()}
         </p>
         {listing.followersCount !== undefined && (
            <p className="text-xs text-muted-foreground flex items-center" suppressHydrationWarning>
                <Users className="mr-1 h-3.5 w-3.5" /> {listing.followersCount} follower(s)
            </p>
         )}

      </CardContent>
      <CardFooter className="p-4 pt-0 flex-col sm:flex-row gap-2">
        <Button 
          onClick={handlePurchase} 
          className="w-full sm:flex-grow" 
          disabled={currentUserId === listing.sellerUserId || !listing.isActive || !canUserPurchaseShares || user?.accountType === 'creator'}
          title={user?.accountType === 'creator' ? "Creators cannot purchase shares" : !canUserPurchaseShares ? `Requires investment opportunity (earned via 5 subscriptions/donations). You have ${user?.investmentOpportunitiesAvailable || 0}.` : (currentUserId === listing.sellerUserId ? "Cannot buy own shares" : (!listing.isActive ? "Listing not active" : "Buy Shares"))}
          suppressHydrationWarning
        >
          <DollarSign className="mr-1.5 h-4 w-4" /> 
          Buy Shares ({listing.sharesOffered})
        </Button>
        {user && user.id !== listing.sellerUserId && user.accountType !== 'creator' && (
           <Button 
            variant="outline" 
            onClick={handleFollowToggle} 
            className="w-full sm:w-auto"
            suppressHydrationWarning
           >
            <Eye className={`mr-1.5 h-4 w-4 ${isFollowed ? 'text-primary' : ''}`} />
            {isFollowed ? 'Unfollow' : 'Follow'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
});
ShareListingCard.displayName = 'ShareListingCard';

