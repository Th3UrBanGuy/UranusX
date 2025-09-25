
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore"; 

export default function SignUpPage() {
  const { toast } = useToast();
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const router = useRouter();

  useEffect(() => {
    // This effect will redirect the user if they are already logged in.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.emailVerified) {
          router.push('/dashboard');
        } else {
          router.push('/verify-email');
        }
      }
    });
    return () => unsubscribe();
  }, [router]);


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingState('loading');
    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Update user profile with first and last name
      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });
      
      // Create a user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: user.email,
          avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
          role: 'User',
          status: 'Active',
          subscriptions: []
      });

      setLoadingState('success');
      toast({
        title: 'Account Created!',
        description: 'A verification email has been sent. Please check your inbox.',
      });
      
      // Redirection is handled by the onAuthStateChanged listener

    } catch (error: any) {
        console.error("Signup Error:", error);
        setLoadingState('idle');
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
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
                Create an Account
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                Join UranusX today.
                </p>
            </div>
        </CardHeader>
        <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
            {loadingState === 'idle' ? (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" required onChange={(e) => setFormData({...formData, firstName: e.target.value})} value={formData.firstName} disabled={isSubmitting} />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" required onChange={(e) => setFormData({...formData, lastName: e.target.value})} value={formData.lastName} disabled={isSubmitting} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="name@example.com" required onChange={(e) => setFormData({...formData, email: e.target.value})} value={formData.email} disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" required onChange={(e) => setFormData({...formData, password: e.target.value})} value={formData.password} disabled={isSubmitting} />
                    </div>
                </>
             ) : (
              <div className="flex flex-col items-center justify-center h-[218px] gap-4">
                {loadingState === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                {loadingState === 'success' && <Check className="h-12 w-12 text-green-500" />}
                <p className="text-lg font-semibold text-foreground">
                  {loadingState === 'loading' ? 'Creating your account...' : 'Account Created!'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {loadingState === 'loading' ? 'Just a moment...' : 'Redirecting you for email verification.'}
                </p>
              </div>
            )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loadingState !== 'idle' || isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/" className="font-medium text-primary hover:underline">
                Sign in
                </Link>
            </div>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
