"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!email) {
      toast({ title: "Email Required", description: "Please enter your email address.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    // Simulate sending password reset link
    console.log(`Simulating: Sending password reset link to ${email}.`);
    toast({
      title: "Password Reset Email Sent (Simulated)",
      description: `If an account exists for ${email}, a (simulated) password reset link/code has been sent. Check console for details or use '654321' or token 'mockResetToken123' on the reset page.`,
      duration: 10000, // Increased duration for visibility
    });
    
    // In a real app, you wouldn't clear the email here, but for demo purposes it's fine.
    // setEmail(""); 
    setIsSubmitting(false);
    // Optionally redirect or show a success message on the page
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll (simulate) send you a link/code to reset your password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-forgot">Email Address</Label>
              <Input 
                id="email-forgot" 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Link/Code'}
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
