"use client";
import Link from 'next/link';
import { Home, BookOpen, Sparkles, Menu, UserCircle, LogIn, LogOut, ShoppingCart, Edit3, BookUp, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const baseNavItems = [
    { href: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { href: '/recommendations', label: 'Recommendations', icon: <Sparkles className="h-5 w-5" /> },
    { href: '/merchandise', label: 'Merchandise', icon: <ShoppingCart className="h-5 w-5" /> },
  ];

  let dynamicNavItems = [];
  if (user) {
    if (user.accountType === 'creator') {
      dynamicNavItems.push({ href: '/creator/dashboard', label: 'Creator Dashboard', icon: <BookUp className="h-5 w-5" /> });
    }
    dynamicNavItems.push(
      { href: '/profile', label: 'Profile', icon: (
        user.avatarUrl ? (
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatarUrl} alt={user.name || 'User'} data-ai-hint="user avatar small" />
            <AvatarFallback suppressHydrationWarning>{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        ) : <UserCircle className="h-5 w-5" />
      )},
      { onClick: logout, label: 'Logout', icon: <LogOut className="h-5 w-5" />, isButton: true }
    );
  } else {
    dynamicNavItems.push(
      { href: '/login', label: 'Login', icon: <LogIn className="h-5 w-5" /> },
      { href: '/signup', label: 'Sign Up', icon: <UserCircle className="h-5 w-5" /> }
    );
  }
  
  const ssrAuthNavItems = [ 
      { href: '/login', label: 'Login', icon: <LogIn className="h-5 w-5" /> },
      { href: '/signup', label: 'Sign Up', icon: <UserCircle className="h-5 w-5" /> },
  ];
  
  const navItems = isClient ? [...baseNavItems, ...dynamicNavItems] : [...baseNavItems, ...ssrAuthNavItems];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-4 flex items-center gap-2" suppressHydrationWarning>
          <BookOpen className="h-7 w-7 text-primary" />
          <span 
            className="font-bold text-xl tracking-tight hidden sm:inline"
            suppressHydrationWarning={true} 
          >
            Manga Platform
          </span>
        </Link>

        <form onSubmit={handleSearch} className="flex-grow max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mr-auto relative">
          <Input 
            type="search"
            placeholder="搜索漫画或作者..."
            className="pr-10 text-sm h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7">
            <SearchIcon className="h-4 w-4" />
            <span className="sr-only">搜索</span>
          </Button>
        </form>
        
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {navItems.map((item) =>
            item.isButton ? (
              <Button key={item.label} variant="ghost" onClick={item.onClick} className="flex items-center gap-2" suppressHydrationWarning>
                {item.icon}
                <span suppressHydrationWarning>{item.label}</span>
              </Button>
            ) : (
              <Button key={item.label} variant="ghost" asChild>
                <Link href={item.href!} className="flex items-center gap-2" suppressHydrationWarning>
                  {item.icon}
                  <span suppressHydrationWarning>{item.label}</span>
                </Link>
              </Button>
            )
          )}
        </nav>

        <div className="md:hidden ml-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" suppressHydrationWarning>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.label}>
                    {item.isButton ? (
                       <Button variant="ghost" onClick={item.onClick} className="justify-start text-lg py-3 px-3 flex items-center gap-3" suppressHydrationWarning>
                        {item.icon}
                        <span suppressHydrationWarning>{item.label}</span>
                      </Button>
                    ) : (
                      <Button variant="ghost" asChild className="justify-start text-lg py-3 px-3">
                        <Link href={item.href!} className="flex items-center gap-3" suppressHydrationWarning>
                          {item.icon}
                          <span suppressHydrationWarning>{item.label}</span>
                        </Link>
                      </Button>
                    )}
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
