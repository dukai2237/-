
import { ShoppingCart } from 'lucide-react';

export const metadata = {
  title: 'Merchandise | Manga Reader Platform',
  description: 'Browse official merchandise from your favorite manga creators.',
};

export default function MerchandisePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <ShoppingCart className="w-24 h-24 text-primary mb-8" />
      <h1 className="text-4xl font-bold mb-4">Merchandise Store</h1>
      <p className="text-xl text-muted-foreground max-w-md">
        Our official merchandise store is coming soon! Get ready to find exclusive items from your favorite manga series and creators.
      </p>
    </div>
  );
}
