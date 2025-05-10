// src/app/shares-market/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Store, AlertCircle } from 'lucide-react';
import { ShareListingCard } from '@/components/shares-market/ShareListingCard';
import type { ShareListing } from '@/lib/types';
import { getActiveShareListings } from '@/lib/mock-data'; 
import { useAuth } from '@/contexts/AuthContext';

export default function SharesMarketPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allListings, setAllListings] = useState<ShareListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<ShareListing[]>([]);
  const { user } = useAuth(); 

  useEffect(() => {
    setAllListings(getActiveShareListings());
  }, []);

  useEffect(() => {
    let listingsToDisplay = [...allListings];
    if (searchTerm) {
      listingsToDisplay = listingsToDisplay.filter(listing =>
        listing.mangaTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredListings(listingsToDisplay);
  }, [searchTerm, allListings]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };
  
  const pageTitle = "Manga Shares Trading Market";
  const pageDescription = "Buy and sell shares of your favorite manga series. Invest in creativity!";


  return (
    <div className="space-y-8 py-8">
      <section className="text-center">
        <Store className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight mb-2" suppressHydrationWarning>{pageTitle}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto" suppressHydrationWarning>
          {pageDescription}
        </p>
      </section>

      <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
        <Input
          type="search"
          placeholder="Search by manga title, author, or seller..."
          className="flex-grow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button type="submit">
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
      </form>

      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <ShareListingCard key={listing.id} listing={listing} currentUserId={user?.id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2" suppressHydrationWarning>
            {searchTerm ? "No Listings Found" : "No Shares Currently Listed"}
          </h2>
          <p className="text-muted-foreground" suppressHydrationWarning>
            {searchTerm 
              ? `No listings matched your search for "${searchTerm}". Try a different term.`
              : "Check back later, or be the first to list your shares!"}
          </p>
        </div>
      )}
    </div>
  );
}

