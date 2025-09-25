
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, ShieldQuestion, Loader2, MailWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

interface ClaimLicenseDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClaim: (key: string) => void;
  isClaiming: boolean;
}

export function ClaimLicenseDialog({
  isOpen,
  onOpenChange,
  onClaim,
  isClaiming,
}: ClaimLicenseDialogProps) {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [key, setKey] = useState('');
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);


  // Generate random numbers on the client side when the dialog opens
  useEffect(() => {
    if (isOpen) {
      setNum1(Math.floor(Math.random() * 10) + 1);
      setNum2(Math.floor(Math.random() * 10) + 1);
      setAnswer(''); // Reset answer field
      setKey(''); // Reset key field
    }
  }, [isOpen]);

  const correctAnswer = num1 + num2;
  const isChallengePassed = parseInt(answer, 10) === correctAnswer;

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (firebaseUser && !firebaseUser.emailVerified) {
      setShowVerificationAlert(true);
      return;
    }

    if (key.trim() && isChallengePassed && !isClaiming) {
      onClaim(key.trim());
    }
  };

  const UnverifiedEmailAlert = () => (
    <AlertDialog open={showVerificationAlert} onOpenChange={setShowVerificationAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
              <MailWarning className="h-12 w-12 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">Email Verification Required</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            You must verify your email address before you can claim a subscription. Please check your inbox for the verification link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction onClick={() => router.push('/verify-email')}>
            Go to Verification
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <>
      <UnverifiedEmailAlert />
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className={cn("sm:max-w-md", "claim-dialog-theme")}>
          <DialogHeader>
            <DialogTitle>Claim Subscription</DialogTitle>
            <DialogDescription>
              Enter a license key and complete the security check to activate your plan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleClaim}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="license-key">License Key</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="license-key"
                    placeholder="SH-XXXX-XXXX-XXXX"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="pl-9"
                    required
                    disabled={isClaiming}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="security-check">Security Check: What is {num1} + {num2}?</Label>
                <div className="relative">
                  <ShieldQuestion className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="security-check"
                    type="number"
                    placeholder="Your answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="pl-9"
                    required
                    disabled={isClaiming}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isClaiming}>Cancel</Button>
              <Button type="submit" disabled={!isChallengePassed || !key.trim() || isClaiming}>
                  {isClaiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Activate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
