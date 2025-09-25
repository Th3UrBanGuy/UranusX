
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminClient } from '@/components/admin/admin-client';
import type { User } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { EditProfileDialog } from '@/components/dashboard/edit-profile-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { LogoutConfirmationDialog } from '@/components/dashboard/logout-confirmation-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        router.push('/');
      } else if (currentUser.role !== 'Admin') {
        router.push('/dashboard');
      }
    }
  }, [currentUser, isLoading, router]);

  const handleUserUpdate = async (updatedUser: User) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.id);
    const { firstName, lastName, avatarUrl } = updatedUser;
    // The context will update the local state, but we still need to push to Firestore
    await updateDoc(userDocRef, { firstName, lastName, avatarUrl });
  };
  
  if (isLoading || !currentUser || currentUser.role !== 'Admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center animated-gradient">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full md:p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        <main className="md:container md:mx-auto md:rounded-2xl md:glassmorphic p-4 sm:p-6 lg:p-8 pt-24 md:pt-6">
          <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Admin Panel
              </h1>
              <div className="flex items-center gap-4">
                  <ThemeSwitcher />
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button
                              variant="outline"
                              size="icon"
                              className="overflow-hidden rounded-full h-10 w-10"
                          >
                              <Avatar className="h-10 w-10">
                                  <AvatarImage src={currentUser.avatarUrl} alt={`${currentUser.firstName} ${currentUser.lastName}`} />
                                  <AvatarFallback>{currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}</AvatarFallback>
                              </Avatar>
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuLabel>My Account</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                              <UserIcon className="mr-2 h-4 w-4" />
                              Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)} className="text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                              Logout
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
          </div>
          {/* We pass the children prop which will be the page content */}
          {React.cloneElement(children as React.ReactElement, { onEditProfile: () => setProfileDialogOpen(true), onLogout: () => setLogoutDialogOpen(true) })}
        </main>
      </div>
       <EditProfileDialog 
            isOpen={isProfileDialogOpen}
            onOpenChange={setProfileDialogOpen}
            user={currentUser}
            onUserUpdate={handleUserUpdate}
        />
         <LogoutConfirmationDialog
            isOpen={isLogoutDialogOpen}
            onOpenChange={setLogoutDialogOpen}
        />
    </>
  );
}
