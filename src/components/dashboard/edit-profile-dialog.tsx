
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User as UserIcon, FileImage, Lock, Mail, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User;
  onUserUpdate: (user: User) => void;
}

export function EditProfileDialog({
  isOpen,
  onOpenChange,
  user,
  onUserUpdate,
}: EditProfileDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });

  const [emailData, setEmailData] = useState({
    newEmail: '',
    currentPassword: '',
  });

  // Effect to reset form data when the user prop changes
  useEffect(() => {
    if (isOpen) {
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
        });
         setPasswordData({
            currentPassword: '',
            newPassword: '',
        });
        setEmailData({
            newEmail: '',
            currentPassword: '',
        });
        setActiveTab('profile');
    }
  }, [user, isOpen]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailData((prev) => ({...prev, [name]: value }));
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUserUpdate({
        ...user,
        ...formData,
      });
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully.',
      });
      onOpenChange(false);
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsUpdatingPassword(true);
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
          toast({ variant: "destructive", title: "Error", description: "You must be logged in to change your password." });
          setIsUpdatingPassword(false);
          return;
      }
      
      const credential = EmailAuthProvider.credential(currentUser.email, passwordData.currentPassword);

      try {
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, passwordData.newPassword);
        toast({ title: "Password Changed", description: "Your password has been updated successfully." });
        onOpenChange(false);
      } catch (error: any) {
        console.error("Password Update Error:", error);
        let description = "Please check your current password and try again.";
        if (error.code === 'auth/weak-password') {
            description = 'Your new password is too weak. Please choose a stronger one.';
        } else if (error.code !== 'auth/invalid-credential') {
            description = error.message || description;
        }
        toast({ variant: "destructive", title: "Password Change Failed", description });
      } finally {
          setIsUpdatingPassword(false);
      }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsUpdatingEmail(true);
      const currentUser = auth.currentUser;

      if(!currentUser || !currentUser.email) {
           toast({ variant: "destructive", title: "Error", description: "You must be logged in to change your email." });
           setIsUpdatingEmail(false);
           return;
      }
      
      const credential = EmailAuthProvider.credential(currentUser.email, emailData.currentPassword);

      try {
        await reauthenticateWithCredential(currentUser, credential);
        await verifyBeforeUpdateEmail(currentUser, emailData.newEmail);
        toast({ title: "Verification Email Sent", description: `A verification link has been sent to ${emailData.newEmail}. Please check the inbox to complete the change.` });
        onOpenChange(false);
      } catch (error: any) {
        console.error("Email Update Error:", error);
        let description = "An unexpected error occurred. Please check your password and try again.";
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email address is already in use by another account.';
        } else if (error.code === 'auth/invalid-email') {
            description = 'The new email address is not valid.';
        } else if (error.code !== 'auth/invalid-credential') {
            description = error.message || description;
        }
        toast({ variant: "destructive", title: "Email Change Failed", description });
      } finally {
          setIsUpdatingEmail(false);
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", "claim-dialog-theme")}>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" asChild>
                <form onSubmit={handleSaveChanges} className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="pl-9"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                             <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="pl-9"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="avatarUrl">Avatar URL</Label>
                         <div className="relative">
                                <FileImage className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="avatarUrl"
                                    name="avatarUrl"
                                    value={formData.avatarUrl}
                                    onChange={handleChange}
                                    className="pl-9"
                                    disabled={isSaving}
                                />
                        </div>
                    </div>
                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" className="sm:w-auto" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </TabsContent>
            <TabsContent value="security" className="pt-4">
                <ScrollArea className="h-[65vh] sm:h-auto sm:max-h-[65vh]">
                    <div className="pr-6 space-y-8">
                        {/* Change Password Form */}
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div>
                                <h3 className="font-medium text-foreground">Change Password</h3>
                                <p className="text-sm text-muted-foreground">Update your account password.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="currentPassword" name="currentPassword" type="password" required className="pl-9" value={passwordData.currentPassword} onChange={handlePasswordChange} disabled={isUpdatingPassword} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="newPassword" name="newPassword" type="password" required className="pl-9" value={passwordData.newPassword} onChange={handlePasswordChange} disabled={isUpdatingPassword} />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isUpdatingPassword}>
                                    {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </div>
                        </form>

                        {/* Change Email Form */}
                        <form onSubmit={handleUpdateEmail} className="space-y-4 pt-6 border-t">
                            <div>
                                <h3 className="font-medium text-foreground">Change Email Address</h3>
                                <p className="text-sm text-muted-foreground">A verification link will be sent to your new email.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newEmail">New Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="newEmail" name="newEmail" type="email" required className="pl-9" value={emailData.newEmail} onChange={handleEmailChange} disabled={isUpdatingEmail} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currentPasswordForEmail">Current Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="currentPasswordForEmail" name="currentPassword" type="password" placeholder="Enter password to confirm" required className="pl-9" value={emailData.currentPassword} onChange={handleEmailChange} disabled={isUpdatingEmail} />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isUpdatingEmail}>
                                    {isUpdatingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Email
                                </Button>
                            </div>
                        </form>
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
