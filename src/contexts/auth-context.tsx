
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, reload } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/lib/data';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This listener handles auth state changes (login/logout)
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      
      if (fbUser) {
        // Always reload user data to get the latest emailVerified status
        await fbUser.reload();
        // The onAuthStateChanged listener might give a stale fbUser object, so we get the fresh one from auth.currentUser
        const freshUser = auth.currentUser;
        setFirebaseUser(freshUser);
        
        // User is signed in. Listen for real-time updates to their profile.
        const userDocRef = doc(db, 'users', freshUser!.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap: DocumentData) => {
          if (docSnap.exists()) {
            const userData = { id: docSnap.id, ...docSnap.data() } as User;
            
            // --- Email Synchronization Logic ---
            // If the email in Firestore doesn't match the one in Auth, update Firestore.
            // This handles cases where the user just verified a new email address.
            if (freshUser && freshUser.email && userData.email !== freshUser.email) {
                updateDoc(userDocRef, { email: freshUser.email });
                // The onSnapshot listener will fire again with the updated data,
                // so we don't need to call setCurrentUser here.
            } else {
                setCurrentUser(userData);
            }
          }
          setIsLoading(false);
        }, (error) => {
            console.error("Firestore snapshot error:", error);
            setIsLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        // User is signed out
        setCurrentUser(null);
        setFirebaseUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // List of public paths that don't require authentication
    const publicPaths = ['/', '/signup', '/forgot-password', '/subscribe', '/auth/action'];
    const isAdminRoute = /^\/[^/]+\/admin$/.test(pathname);
    // Any path that isn't a defined app route is potentially the dynamic admin route
    const isPotentiallyPublic = publicPaths.includes(pathname) || !pathname.startsWith('/dashboard') && !pathname.startsWith('/admin')

    if (!currentUser && !isPotentiallyPublic && pathname !== '/verify-email') {
        router.push('/');
    } else if (currentUser && firebaseUser) {
        // Admins do not need to verify their email to access the app
        if (!firebaseUser.emailVerified && currentUser.role !== 'Admin' && pathname !== '/verify-email') {
             router.push('/verify-email');
        } else if ((firebaseUser.emailVerified || currentUser.role === 'Admin')) {
            const targetPath = currentUser.role === 'Admin' ? '/admin' : '/dashboard';
            if (pathname === '/verify-email' || pathname === '/') {
                router.push(targetPath);
            }
        }
    }

  }, [currentUser, firebaseUser, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ currentUser, firebaseUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
