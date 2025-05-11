
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
import { MailCheck, AlertTriangle } from "lucide-react";
import type { User } from "@/lib/types";

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
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  useEffect(() => {
    if (user) {
        router.push(user.accountType === 'creator' ? '/creator/dashboard' : '/profile');
    }
  }, [user, router]);

  const handleSendVerificationCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsVerifyingEmail(true);
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your email address to send a verification code.", variant: "destructive" });
      setIsVerifyingEmail(false);
      return;
    }
    // Simulate checking if email exists (simplified, actual check in AuthContext)
    // In a real app, this would be an API call to the backend.
    const storedUsersString = localStorage.getItem('mockUserList');
    let mockUserListFromStorage: User[] = storedUsersString ? JSON.parse(storedUsersString) : [];
    if (mockUserListFromStorage.some(u => u.email === email)) {
        toast({ title: "Email Exists", description: "This email is already registered. Please use a different email or log in.", variant: "destructive" });
        setIsVerifyingEmail(false);
        return; // Keep form populated for user to change email
    }

    // Simulate sending verification code
    console.log(`Simulating: Sending verification code to ${email}. For demo, use code: 123456`);
    // In a real app, an email with the code would be sent. The toast informs about the simulation.
    // toast({
    //   title: "Verification Code Sent (Simulated)",
    //   description: `A verification code has been "sent" to ${email}. Please check your email. For this demo, you can use the code '123456'.`,
    //   duration: 7000,
    // });
    setIsVerificationCodeSent(true);
    setIsVerifyingEmail(false);
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
      toast({ title: "Verification Required", description: "Please send and enter the verification code from your email.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const newUser = await signup(name, email, password, accountType, verificationCode);

    if (newUser) {
      if (newUser.accountType === 'creator' && !newUser.isApproved) {
         router.push('/login'); 
      } else {
        router.push(newUser.accountType === 'creator' ? '/creator/dashboard' : '/profile');
      }
    }
    // If signup fails (e.g. wrong code), toast is handled by AuthContext.
    // Form data remains for correction.
    setIsSubmitting(false);
  };


  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Create your Manga Walker account. Email verification is required. Creator accounts require admin approval after registration.
          </CardDescription>
        </CardHeader>
        <form onSubmit={isVerificationCodeSent ? handleSignup : handleSendVerificationCode}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="e.g., John Doe" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting || isVerifyingEmail || (isVerificationCodeSent && !verificationCode.trim())} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting || isVerifyingEmail || (isVerificationCodeSent && !verificationCode.trim())} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Choose a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSubmitting || isVerifyingEmail || (isVerificationCodeSent && !verificationCode.trim())} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isSubmitting || isVerifyingEmail || (isVerificationCodeSent && !verificationCode.trim())}/>
            </div>
            <div className="space-y-3">
              <Label className="text-base">Account Type</Label>
              <RadioGroup defaultValue="user" value={accountType} onValueChange={(value: 'user' | 'creator') => setAccountType(value)} className="flex space-x-4" disabled={isSubmitting || isVerifyingEmail || (isVerificationCodeSent && !verificationCode.trim())}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="type-user" disabled={isSubmitting || isVerifyingEmail || (isVerificationCodeSent && !verificationCode.trim())}/>
                  <Label htmlFor="type-user" className={`font-normal ${(isSubmitting || isVerifyingEmail) ? 'cursor-not-allowed opacity-70': ''}`}>Regular User</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="creator" id="type-creator" disabled={isSubmitting || isVerifyingEmail || (isVerificationCodeSent && !verificationCode.trim())}/>
                  <Label htmlFor="type-creator" className={`font-normal ${(isSubmitting || isVerifyingEmail) ? 'cursor-not-allowed opacity-70': ''}`}>Manga Creator</Label>
                </div>
              </RadioGroup>
               {accountType === 'creator' && (
                <p className="text-xs text-muted-foreground pt-1">
                  As a Manga Creator, you'll be able to upload and manage your manga series after your account is approved by an admin.
                </p>
              )}
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Important Email Notice</h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            Please ensure you use an active email address that you can always access. 
                            This email is crucial for account verification and password recovery. 
                            If you lose access to this email, you may not be able to recover your account.
                        </p>
                    </div>
                </div>
            </div>


            {isVerificationCodeSent && (
              <div className="space-y-2 pt-4 border-t">
                 <Label htmlFor="verificationCode">Verification Code</Label>
                <div className="flex items-center gap-2">
                    <MailCheck className="h-5 w-5 text-muted-foreground" />
                    <Input
                        id="verificationCode"
                        type="text"
                        placeholder="Enter 6-digit code from email"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                        maxLength={6}
                        disabled={isSubmitting}
                    />
                </div>
                {/* Removed the demo code display toast from here, it's handled in handleSendVerificationCode now if needed for testing. */}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {!isVerificationCodeSent ? (
              <Button type="submit" className="w-full text-lg py-3" disabled={isVerifyingEmail || isSubmitting || !email.trim() || !name.trim() || !password.trim() || !confirmPassword.trim()}>
                {isVerifyingEmail ? 'Sending Code...' : 'Send Verification Code'}
              </Button>
            ) : (
              <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting || !verificationCode.trim()}>
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

