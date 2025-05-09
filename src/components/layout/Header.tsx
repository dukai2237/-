"use client";
import Link from 'next/link';
import { Home, BookOpen, Sparkles, Menu, UserCircle, LogIn, LogOut, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, logout } = useAuth();
  // state to ensure user-dependent parts are rendered only on client after hydration
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const baseNavItems = [
    { href: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { href: '/recommendations', label: 'Recommendations', icon: <Sparkles className="h-5 w-5" /> },
    { href: '/merchandise', label: 'Merchandise', icon: <ShoppingCart className="h-5 w-5" /> },
  ];

  // Determine authNavItems based on user state; will be fully formed once isClient is true
  const authNavItems = user
    ? [
        { href: '/profile', label: 'Profile', icon: (
          user.avatarUrl ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatarUrl} alt={user.name || 'User'} data-ai-hint="user avatar small" />
              <AvatarFallback>{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          ) : <UserCircle className="h-5 w-5" />
        )},
        { onClick: logout, label: 'Logout', icon: <LogOut className="h-5 w-5" />, isButton: true },
      ]
    : [
        { href: '/login', label: 'Login', icon: <LogIn className="h-5 w-5" /> },
        { href: '/signup', label: 'Sign Up', icon: <UserCircle className="h-5 w-5" /> },
      ];
  
  // Render a consistent set of nav items on SSR and initial client render
  // Then update on client once user state is confirmed
  const ssrAuthNavItems = [ // Always show logged-out state for SSR consistency
      { href: '/login', label: 'Login', icon: <LogIn className="h-5 w-5" /> },
      { href: '/signup', label: 'Sign Up', icon: <UserCircle className="h-5 w-5" /> },
  ];
  
  const navItems = isClient ? [...baseNavItems, ...authNavItems] : [...baseNavItems, ...ssrAuthNavItems];


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-auto flex items-center gap-2" suppressHydrationWarning>
          <BookOpen className="h-7 w-7 text-primary" />
          <span 
            className="font-bold text-xl tracking-tight"
            suppressHydrationWarning={true} 
          >
            Manga Platform
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-1">
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

        <div className="md:hidden">
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
