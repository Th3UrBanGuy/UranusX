
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Loader2, Check, MailCheck, MailWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { sendEmailVerification, reload } from 'firebase/auth';

export default function VerifyEmailPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { firebaseUser, isLoading } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!isLoading && firebaseUser?.emailVerified) {
      router.push('/dashboard');
    }
  }, [firebaseUser, isLoading, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!firebaseUser || resendCooldown > 0) return;

    setIsResending(true);
    try {
      await sendEmailVerification(firebaseUser);
      toast({
        title: 'Verification Email Sent',
        description: `A new verification link has been sent to ${firebaseUser.email}.`,
      });
      setResendCooldown(60); // 60-second cooldown
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Resend Email',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleContinue = async () => {
    if (!firebaseUser) return;

    setIsSubmitting(true);
    try {
      await reload(firebaseUser);
      // Re-check the user from the auth object after reload
      if (auth.currentUser?.emailVerified) {
        toast({
          title: 'Email Verified!',
          description: 'Your account is now fully active. Redirecting...',
        });
        router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Email Not Verified',
          description: 'Please check your inbox (and spam folder) for the verification link.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification Check Failed',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center animated-gradient">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <Card className="w-full max-w-md glassmorphic">
        <CardHeader>
          <div className="text-center">
            <MailCheck className="h-16 w-16 mx-auto text-primary mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Verify Your Email
            </h1>
            <p className="mt-2 text-muted-foreground">
              A verification link has been sent to your email address:
              <strong className="text-foreground block mt-1">{firebaseUser?.email}</strong>
            </p>
          </div>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
            Please check your inbox (and spam folder) and click the link to activate your account.
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button onClick={handleContinue} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continue'}
          </Button>
          <div className="flex w-full items-center gap-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
            >
              {isResending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Resend Email'
              )}
              {resendCooldown > 0 && ` (${resendCooldown}s)`}
            </Button>
            <Button asChild variant="link" className="whitespace-nowrap">
              <Link href="/dashboard">Skip for now</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
