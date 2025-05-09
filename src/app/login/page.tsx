"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, MOCK_USER_VALID } from "@/contexts/AuthContext";
import type { User } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, useEffect } from "react";

export default function LoginPage() {
  const { user: loggedInUser, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("test@example.com"); // Default to MOCK_USER_VALID's email
  const [password, setPassword] = useState("password123"); // Mock password

  useEffect(() => {
    if (loggedInUser) {
      const redirectPath = searchParams.get('redirect') || (loggedInUser.accountType === 'creator' ? '/creator/dashboard' : '/profile');
      router.push(redirectPath);
    }
  }, [loggedInUser, router, searchParams]);


  const handleMockLogin = (e: FormEvent) => {
    e.preventDefault();
    // In a real app, you'd validate credentials against a backend.
    // For this mock, if email matches MOCK_USER_VALID, log them in as that user (a creator).
    // Otherwise, log in as a generic new user (regular user type).
    let userToLogin: User;
    if (email === MOCK_USER_VALID.email) {
      userToLogin = MOCK_USER_VALID;
    } else {
      // Simulate logging in a non-creator user if email doesn't match MOCK_USER_VALID
      // This part is highly conceptual for a mock login without actual user database.
      // We'll create a new mock 'user' type user on the fly for this demo.
      userToLogin = {
        id: `user-${Date.now()}`,
        email: email,
        name: email.split('@')[0] || 'New User',
        avatarUrl: 'https://picsum.photos/100/100?random=genericuser',
        walletBalance: 50,
        subscriptions: [],
        investments: [],
        authoredMangaIds: [],
        accountType: 'user', 
      };
    }
    
    login(userToLogin);
    // Redirection is handled by the useEffect hook above once loggedInUser state updates.
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your credentials. For demo, use '{MOCK_USER_VALID.email}' for a Creator account, 
            or any other email for a regular User account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleMockLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full text-lg py-3">
              Login (Mock)
            </Button>
             <p className="text-sm text-center text-muted-foreground">
              No account? <Link href="/signup" className="text-primary hover:underline">Sign up here</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
