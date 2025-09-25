
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Loader2, Check, Shield, SearchX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from "firebase/firestore";
import Link from 'next/link';

interface AdminSignupSettings {
  enabled: boolean;
  path: string;
}

const NotFoundPage = () => (
  <div className="min-h-screen w-full flex items-center justify-center p-4">
    <div className="text-center">
      <SearchX className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
      <h1 className="text-4xl font-bold">404 - Not Found</h1>
      <p className="text-muted-foreground mt-2">The page you are looking for does not exist or has been moved.</p>
      <Button asChild variant="link" className="mt-4">
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  </div>
);


export default function AdminSignUpPage() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageState, setPageState] = useState<'loading' | 'visible' | 'not_found'>('loading');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const checkSettings = async () => {
      const settingsRef = doc(db, 'settings', 'adminSignup');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const settings = settingsSnap.data() as AdminSignupSettings;
        // Normalize paths by removing leading/trailing slashes for a robust comparison
        const normalizedDbPath = settings.path.replace(/^\/|\/$/g, '');
        const normalizedCurrentPath = pathname.replace(/^\/|\/$/g, '');
        
        if (settings.enabled && normalizedDbPath === normalizedCurrentPath) {
          setPageState('visible');
        } else {
          setPageState('not_found');
        }
      } else {
        // If settings don't exist, route is disabled by default
        setPageState('not_found');
      }
    };

    checkSettings();
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If user is already logged in, redirect them.
        router.push('/admin');
      }
    });
    return () => unsubscribe();
  }, [router]);


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoadingState('loading');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });
      
      await setDoc(doc(db, "users", user.uid), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: user.email,
          avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
          role: 'Admin',
          status: 'Active',
          subscriptions: []
      });

      setLoadingState('success');
      toast({
        title: 'Admin Account Created!',
        description: 'Redirecting you to the admin dashboard.',
      });
      
    } catch (error: any) {
        console.error("Admin Signup Error:", error);
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

  if (pageState === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (pageState === 'not_found') {
    return <NotFoundPage />;
  }


  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <Card className="w-full max-w-md glassmorphic">
        <CardHeader>
            <div className="text-center">
                <div className="flex justify-center items-center gap-2">
                    <Shield className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Admin Account
                    </h1>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                 Create a new administrator account.
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
                  {loadingState === 'loading' ? 'Creating Admin Account...' : 'Account Created!'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {loadingState === 'loading' ? 'Just a moment...' : 'Redirecting to the admin dashboard.'}
                </p>
              </div>
            )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loadingState !== 'idle' || isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Admin Account'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
                Return to regular {' '}
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
