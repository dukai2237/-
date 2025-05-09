
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [accountType, setAccountType] = useState<'user' | 'creator'>('user');

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !accountType) {
      toast({ title: "Missing Fields", description: "Please fill in all fields and select an account type.", variant: "destructive"});
      return;
    }
    
    const newUser = signup(name, email, accountType);

    if (newUser) {
      // AuthContext now handles toasts for pending approval.
      // Redirect logic can remain simple or be adjusted if a "pending approval" page is desired.
      if (newUser.accountType === 'creator') {
        // Even if pending, they can go to login page. Login will block them if not approved.
        router.push('/login'); 
      } else {
        router.push('/profile');
      }
    } else {
      toast({ title: "Signup Failed", description: "Could not create account. Please try again.", variant: "destructive"});
    }
  };


  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Create your Manga Platform account. Creator accounts require admin approval after registration.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="e.g., John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Choose a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Account Type</Label>
              <RadioGroup defaultValue="user" onValueChange={(value: 'user' | 'creator') => setAccountType(value)} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="type-user" />
                  <Label htmlFor="type-user" className="font-normal">Regular User</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="creator" id="type-creator" />
                  <Label htmlFor="type-creator" className="font-normal">Manga Creator</Label>
                </div>
              </RadioGroup>
               {accountType === 'creator' && (
                <p className="text-xs text-muted-foreground pt-1">
                  As a Manga Creator, you'll be able to upload and manage your manga series after your account is approved by an admin.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full text-lg py-3">
              Create Account
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary hover:underline">Login here</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

