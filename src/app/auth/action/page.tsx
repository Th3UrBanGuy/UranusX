
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, KeyRound, MailCheck } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

type Action = 'verifyEmail' | 'resetPassword' | 'recoverEmail' | 'verifyAndChangeEmail';
type Status = 'loading' | 'success' | 'error' | 'form';

function HandleAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [mode, setMode] = useState<Action | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    const action = searchParams.get('mode') as Action;
    setMode(action);

    if (!oobCode) {
      setStatus('error');
      setErrorMessage('Missing action code. Please check the link and try again.');
      return;
    }

    switch (action) {
      case 'verifyEmail':
      case 'recoverEmail':
      case 'verifyAndChangeEmail':
        handleVerifyEmail(oobCode);
        break;
      case 'resetPassword':
        handleVerifyPasswordReset(oobCode);
        break;
      default:
        setStatus('error');
        setErrorMessage('Invalid action. Please check the link and try again.');
        break;
    }
  }, [searchParams, oobCode]);

  const handleVerifyEmail = async (actionCode: string) => {
    try {
      await applyActionCode(auth, actionCode);
      setStatus('success');
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleVerifyPasswordReset = async (actionCode: string) => {
    try {
        await verifyPasswordResetCode(auth, actionCode);
        setStatus('form'); // Show the password reset form
    } catch (error: any) {
        handleError(error);
    }
  }

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    setIsSubmitting(true);
    try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        setStatus('success');
        toast({ title: "Password Changed", description: "Your password has been successfully updated." });
    } catch(error: any) {
        handleError(error);
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleError = (error: any) => {
      setStatus('error');
      switch (error.code) {
        case 'auth/expired-action-code':
          setErrorMessage('This link has expired. Please request a new one.');
          break;
        case 'auth/invalid-action-code':
          setErrorMessage('This link is invalid or has already been used.');
          break;
        case 'auth/weak-password':
            setErrorMessage('The new password is too weak. Please choose a stronger one.');
            setStatus('form'); // Let them try again
            break;
        default:
          setErrorMessage(error.message || 'An unknown error occurred.');
          break;
      }
  }

  const getSuccessTitle = () => {
    switch (mode) {
        case 'verifyEmail':
            return 'Email Verified!';
        case 'recoverEmail':
        case 'verifyAndChangeEmail':
            return 'Email Address Updated!';
        case 'resetPassword':
            return 'Password Changed!';
        default:
            return 'Success!';
    }
  }
  
   const getSuccessDescription = () => {
    switch (mode) {
        case 'verifyEmail':
            return 'Your account is now fully active.';
        case 'recoverEmail':
        case 'verifyAndChangeEmail':
            return 'Your email address has been successfully updated.';
        case 'resetPassword':
            return 'You can now sign in with your new password.';
        default:
            return 'You can now continue to your dashboard.';
    }
  }


  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary mb-4" />
            <CardTitle className="text-center text-2xl">Verifying...</CardTitle>
            <p className="text-muted-foreground text-center mt-2">Please wait a moment.</p>
          </>
        );
      case 'form': // For password reset
        return (
            <form onSubmit={handleConfirmPasswordReset}>
                 <CardHeader className="p-0 mb-6">
                    <div className="text-center">
                        <KeyRound className="h-16 w-16 mx-auto text-primary mb-4" />
                        <CardTitle className="text-center text-2xl">Reset Password</CardTitle>
                        <p className="text-muted-foreground text-center mt-2">Enter your new password below.</p>
                    </div>
                 </CardHeader>
                <CardContent className="p-0 space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                            id="newPassword" 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                </CardContent>
                <CardFooter className="p-0 pt-6">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </CardFooter>
            </form>
        );
      case 'success':
        return (
          <>
            {(mode === 'verifyEmail' || mode === 'recoverEmail' || mode === 'verifyAndChangeEmail') && <MailCheck className="h-16 w-16 mx-auto text-green-500 mb-4" />}
            {mode === 'resetPassword' && <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />}
            <CardTitle className="text-center text-2xl">
                {getSuccessTitle()}
            </CardTitle>
            <p className="text-muted-foreground text-center mt-2">
                {getSuccessDescription()}
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full mt-6">
                Continue to Dashboard
            </Button>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <CardTitle className="text-center text-2xl">Action Failed</CardTitle>
            <p className="text-muted-foreground text-center mt-2">{errorMessage}</p>
            <Button asChild variant="link" className="w-full mt-6">
                <Link href="/">Return to Sign In</Link>
            </Button>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md glassmorphic p-6">
         {renderContent()}
      </Card>
    </div>
  );
}


export default function AuthActionPage() {
    return (
        <Suspense fallback={
             <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
             </div>
        }>
            <HandleAction />
        </Suspense>
    )
}

    