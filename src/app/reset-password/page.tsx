"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, useEffect } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [token, setToken] = useState(""); // Would come from URL in real app
  const [verificationCode, setVerificationCode] = useState(""); // Or this, depending on flow
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // In a real app, you'd extract a token from the URL (e.g., searchParams.get('token'))
    // For this demo, we'll just assume the user needs to enter a code.
    const urlToken = searchParams.get('token');
    if (urlToken) {
        setToken(urlToken); // If a token is in URL, prefill or use it
        toast({ title: "Token Detected (Simulated)", description: "Password reset token from URL (simulated)." });
    }
  }, [searchParams, toast]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!verificationCode || !newPassword || !confirmNewPassword) {
      toast({ title: "Missing Fields", description: "Please fill in all fields.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    // Simulate password reset
    // In a real app, you'd send the token/code and new password to your backend for validation and update.
    // Here, we'll check against a mock code.
    if (verificationCode !== "654321" && token !== "mockResetToken123") { // Example mock codes
        toast({ title: "Invalid Code/Token", description: "The verification code or token is incorrect.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    console.log(`Simulating: Password reset for token/code ${token || verificationCode} with new password: ${newPassword}`);
    toast({
      title: "Password Reset Successful (Simulated)",
      description: "Your password has been (simulated) successfully reset. You can now log in with your new password.",
    });
    
    setIsSubmitting(false);
    router.push('/login'); // Redirect to login after successful (simulated) reset
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><KeyRound className="mr-2"/> Reset Your Password</CardTitle>
          <CardDescription>
            Enter the verification code sent to your email (or use '654321' for demo if no token in URL) and set a new password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code-reset">Verification Code</Label>
              <Input 
                id="verification-code-reset" 
                type="text" 
                placeholder="Enter code from email" 
                value={verificationCode} 
                onChange={(e) => setVerificationCode(e.target.value)} 
                required 
              />
               {token && <p className="text-xs text-muted-foreground">URL Token (simulated): {token}</p>}
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
