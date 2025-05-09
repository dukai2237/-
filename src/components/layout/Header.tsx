import Link from 'next/link';
import { Home, BookOpen, Sparkles, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const navItems = [
    { href: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { href: '/recommendations', label: 'Recommendations', icon: <Sparkles className="h-5 w-5" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-auto flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl tracking-tight">Manga Reader</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <Button key={item.label} variant="ghost" asChild>
              <Link href={item.href} className="flex items-center gap-2">
                {item.icon}
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                   <Button key={item.label} variant="ghost" asChild className="justify-start text-lg py-6">
                    <Link href={item.href} className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
