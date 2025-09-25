
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoadingState('loading');

    try {
      await sendPasswordResetEmail(auth, email);
      setLoadingState('success');
      toast({
        title: "Check Your Email",
        description: `A password reset link has been sent to ${email}.`,
      });
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      setLoadingState('idle');
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <Card className="w-full max-w-md glassmorphic">
        <CardHeader>
            <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Forgot Password
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                Enter your email to receive a password reset link.
                </p>
            </div>
        </CardHeader>
        {loadingState !== 'success' ? (
            <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                        id="email" 
                        type="email" 
                        placeholder="name@example.com" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link href="/" className="font-medium text-primary hover:underline">
                    Sign in
                </Link>
                </div>
            </CardFooter>
            </form>
        ) : (
            <CardContent className="flex flex-col items-center justify-center min-h-[150px] gap-4 text-center">
                <Check className="h-12 w-12 text-green-500" />
                <p className="text-lg font-semibold text-foreground">
                    Reset Link Sent!
                </p>
                <p className="text-sm text-muted-foreground">
                    Please check your inbox (and spam folder) for the password reset instructions.
                </p>
                 <Button variant="link" asChild className="mt-4">
                    <Link href="/">Return to Sign In</Link>
                </Button>
            </CardContent>
        )}
      </Card>
    </div>
  );
}
