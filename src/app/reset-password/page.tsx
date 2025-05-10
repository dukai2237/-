
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, useEffect } from "react";
import { ArrowLeft, KeyRound, AlertTriangle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [token, setToken] = useState(""); 
  const [verificationCode, setVerificationCode] = useState(""); 
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
        setToken(urlToken); 
        toast({ title: "Token Detected (Simulated)", description: "Password reset token from URL (simulated). You can use this or enter a code sent to your email." });
    }
  }, [searchParams, toast]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!verificationCode && !token) {
      toast({ title: "Missing Code/Token", description: "Please enter the verification code sent to your email or ensure a token is present in the URL.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (!newPassword || !confirmNewPassword) {
       toast({ title: "Missing Password Fields", description: "Please enter and confirm your new password.", variant: "destructive" });
       setIsSubmitting(false);
       return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    // Simulate password reset
    const codeOrTokenUsed = token || verificationCode;
    if (verificationCode !== "654321" && token !== "mockResetToken123") { 
        toast({ title: "Invalid Code/Token", description: "The verification code or token is incorrect. Please check your email or the link.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    console.log(`Simulating: Password reset for token/code ${codeOrTokenUsed} with new password: ${newPassword}`);
    toast({
      title: "Password Reset Successful (Simulated)",
      description: "Your password has been (simulated) successfully reset. You can now log in with your new password.",
    });
    
    setIsSubmitting(false);
    router.push('/login'); 
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><KeyRound className="mr-2"/> Reset Your Password</CardTitle>
          <CardDescription>
            Enter the verification code sent to your email (for demo, try '654321') or use the token from the reset link URL, then set a new password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {token && (
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md text-xs text-blue-600 dark:text-blue-400">
                    URL Token Detected (Simulated): {token}. You may not need to enter a code below if this token is valid.
                </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="verification-code-reset">Verification Code (from Email)</Label>
              <Input 
                id="verification-code-reset" 
                type="text" 
                placeholder="Enter code from email" 
                value={verificationCode} 
                onChange={(e) => setVerificationCode(e.target.value)} 
                disabled={isSubmitting || !!token} // Disable if token is present in URL
              />
            </div>
             <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Email Access Required</h4>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                            Ensure you have access to your registered email to receive the verification code/link. 
                            If you cannot access your email, you may not be able to reset your password.
                        </p>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password" 
                type="password" 
                placeholder="Enter new password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input 
                id="confirm-new-password" 
                type="password" 
                placeholder="Confirm new password" 
                value={confirmNewPassword} 
                onChange={(e) => setConfirmNewPassword(e.target.value)} 
                required 
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Button variant="link" asChild className="text-sm">
              <Link href="/login">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to Login
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

