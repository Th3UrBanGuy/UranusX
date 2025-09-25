
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
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';

export default function LoginPage() {
  const { toast } = useToast();
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { currentUser, firebaseUser, isLoading } = useAuth();

   useEffect(() => {
    // If the user is already logged in (from the context), redirect them.
    if (!isLoading && currentUser && firebaseUser) {
        setLoadingState('success');
        // Admins do not need to verify their email
        if (!firebaseUser.emailVerified && currentUser.role !== 'Admin') {
          router.push('/verify-email');
          return;
        }
        const targetPath = currentUser.role === 'Admin' ? '/admin' : '/dashboard';
        router.push(targetPath);
    }
  }, [currentUser, firebaseUser, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoadingState('loading');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      setLoadingState('success');
      toast({ title: "Login Successful", description: "Welcome back! Redirecting..." });

      // Redirection is now handled by the useEffect hook above.
      
    } catch (error: any) {
      console.error("Login Error:", error);
      setLoadingState('idle');
      
      let description = "An unexpected error occurred.";
      if (error.code === 'auth/invalid-credential') {
          description = "Invalid credentials. Please check your email and password.";
      } else {
          description = error.message || description;
      }

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: description,
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
                <div className="flex justify-center items-center gap-2">
                  <Image src="https://lh3.googleusercontent.com/pw/AP1GczNoCQo-qU0lfWyTQT1EqIhZofXYFZo1x-kSKbfhgqEXJu45jEtH3p2J3Nb3DrgRVrwXTGn3dRbhpLASHYYlfwMkV3OpuCwabpGuvpwvFkBCyvtAVBir0CV8VroEGIJNHwWK7agWTVMhvBmg3TIr4iM=w40-h40-s-no-gm?authuser=0" alt="UranusX Logo" width={40} height={40} className="h-8 w-8 text-primary" />
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    UranusX
                  </h1>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your personalized streaming dashboard.
                </p>
            </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6">
            {loadingState === 'idle' ? (
              <>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" passHref className="text-sm text-muted-foreground hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[164px] gap-4">
                {loadingState === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                {loadingState === 'success' && <Check className="h-12 w-12 text-green-500" />}
                <p className="text-lg font-semibold text-foreground">
                  {loadingState === 'loading' ? 'Signing in...' : 'Login Successful!'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {loadingState === 'loading' ? 'Please wait while we prepare your dashboard.' : 'Redirecting you now...'}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
