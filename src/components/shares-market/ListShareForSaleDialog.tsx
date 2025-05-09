// src/components/shares-market/ListShareForSaleDialog.tsx
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UserInvestment } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ListShareForSaleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  investment: UserInvestment | null;
}

export function ListShareForSaleDialog({ isOpen, onOpenChange, investment }: ListShareForSaleDialogProps) {
  const { listSharesForSale } = useAuth();
  const { toast } = useToast();
  
  const [sharesToList, setSharesToList] = useState("");
  const [pricePerShareToList, setPricePerShareToList] = useState("");
  const [listingDescription, setListingDescription] = useState("");

  // Reset form when dialog opens or investment changes
  useState(() => {
    if (investment) {
      setSharesToList((investment.sharesOwned - (investment.sharesListed || 0)).toString());
      setPricePerShareToList(investment.listedPricePerShare?.toString() || "");
      setListingDescription(investment.listingDescription || "");
    } else {
      setSharesToList("");
      setPricePerShareToList("");
      setListingDescription("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally run when investment changes
  }, [investment, isOpen]); 


  const handleSubmit = async () => {
    if (!investment) return;
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
    const availableToSell = investment.sharesOwned - (investment.sharesListed || 0);
    if (numShares > availableToSell) {
        toast({ title: "Not Enough Unlisted Shares", description: `You only have ${availableToSell} unlisted shares available to sell for this manga.`, variant: "destructive"});
        return;
    }
    
    const newListing = await listSharesForSale(investment.mangaId, numShares, price, listingDescription);
    if (newListing) {
      onOpenChange(false); // Close dialog on success
    }
  };

  if (!investment) return null;

  const availableToSell = (investment.sharesOwned - (investment.sharesListed || 0));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>List Shares for Sale</DialogTitle>
          <DialogDescription>
            Sell your shares of "{investment.mangaTitle}" on the market.
            You have {availableToSell} unlisted shares available.
            {investment.isListedForSale && ` (${investment.sharesListed} shares already listed @ $${investment.listedPricePerShare?.toFixed(2)})`}
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
              placeholder={`Max ${availableToSell}`}
              min="1"
              max={availableToSell.toString()}
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
              <Label htmlFor="listingDescriptionProfile">Listing Description (Optional, Max 1000 chars)</Label>
              <Textarea 
                  id="listingDescriptionProfile"
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
          <Button onClick={handleSubmit} disabled={availableToSell <= 0}>Confirm Listing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
