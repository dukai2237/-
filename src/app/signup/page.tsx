"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MailCheck } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { user, signup } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<'user' | 'creator'>('user');
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationCodeSent, setIsVerificationCodeSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
        router.push(user.accountType === 'creator' ? '/creator/dashboard' : '/profile');
    }
  }, [user, router]);

  const handleSendVerificationCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your email address to send a verification code.", variant: "destructive" });
      return;
    }
    // Simulate sending verification code
    console.log(`Simulating: Sending verification code to ${email}. For demo, use code: 123456`);
    toast({
      title: "Verification Code Sent (Simulated)",
      description: `A verification code has been "sent" to ${email}. Please check your console or use '123456' for this demo.`,
      duration: 7000,
    });
    setIsVerificationCodeSent(true);
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!name || !email || !password || !confirmPassword || !accountType) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (!isVerificationCodeSent || !verificationCode) {
      toast({ title: "Verification Required", description: "Please send and enter the verification code.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    // Pass verificationCode to signup function
    const newUser = await signup(name, email, password, accountType, verificationCode);

    if (newUser) {
      // Toast for pending approval is handled in AuthContext
      // Redirect logic can remain simple
      if (newUser.accountType === 'creator' && !newUser.isApproved) {
         router.push('/login'); // Redirect to login, approval message will be shown by AuthContext or login page
      } else {
        router.push(newUser.accountType === 'creator' ? '/creator/dashboard' : '/profile');
      }
    }
    // If signup fails, toast is handled by AuthContext
    setIsSubmitting(false);
  };


  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Create your Manga Platform account. Email verification is required. Creator accounts require admin approval after registration.
          </CardDescription>
        </CardHeader>
        <form onSubmit={isVerificationCodeSent ? handleSignup : handleSendVerificationCode}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="e.g., John Doe" value={name} onChange={(e) => setName(e.target.value)} required disabled={isVerificationCodeSent} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isVerificationCodeSent} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Choose a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isVerificationCodeSent} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isVerificationCodeSent}/>
            </div>
            <div className="space-y-3">
              <Label className="text-base">Account Type</Label>
              <RadioGroup defaultValue="user" value={accountType} onValueChange={(value: 'user' | 'creator') => setAccountType(value)} className="flex space-x-4" disabled={isVerificationCodeSent}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="type-user" disabled={isVerificationCodeSent}/>
                  <Label htmlFor="type-user" className={`font-normal ${isVerificationCodeSent ? 'cursor-not-allowed opacity-70': ''}`}>Regular User</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="creator" id="type-creator" disabled={isVerificationCodeSent}/>
                  <Label htmlFor="type-creator" className={`font-normal ${isVerificationCodeSent ? 'cursor-not-allowed opacity-70': ''}`}>Manga Creator</Label>
                </div>
              </RadioGroup>
               {accountType === 'creator' && (
                <p className="text-xs text-muted-foreground pt-1">
                  As a Manga Creator, you'll be able to upload and manage your manga series after your account is approved by an admin.
                </p>
              )}
            </div>

            {isVerificationCodeSent && (
              <div className="space-y-2 pt-4 border-t">
                 <Label htmlFor="verificationCode">Verification Code</Label>
                <div className="flex items-center gap-2">
                    <MailCheck className="h-5 w-5 text-muted-foreground" />
                    <Input
                        id="verificationCode"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                        maxLength={6}
                    />
                </div>
                <p className="text-xs text-muted-foreground">A (simulated) verification code was sent to your email. Use '123456' for this demo.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {!isVerificationCodeSent ? (
              <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting}>
                Send Verification Code
              </Button>
            ) : (
              <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting || !verificationCode}>
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            )}
            <p className="text-sm text-center text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary hover:underline">Login here</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
