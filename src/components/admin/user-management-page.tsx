'use client'

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Shield, User as UserIcon, Pencil, UserRound } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import type { User as UserType, LicenseKey, SubscriptionPlan } from '@/lib/data';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { DeleteConfirmationButton } from './delete-confirmation-button';
import { BackButton } from './back-button';
import type { AdminView } from './admin-client';
import { UserProfileDialog } from './user-profile-dialog';
import { SearchAndSort, SortOption } from '../dashboard/search-and-sort';


interface UserManagementPageProps {
    setActiveView: (view: AdminView) => void;
}

export function UserManagementPage({ setActiveView }: UserManagementPageProps) {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserType[]>([]);
    const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([]);
    const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [viewingUser, setViewingUser] = useState<UserType | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('name-asc');


    useEffect(() => {
        let usersLoaded = false;
        let keysLoaded = false;
        let plansLoaded = false;

        const updateLoadingState = () => {
            if (usersLoaded && keysLoaded && plansLoaded) {
                setIsLoading(false);
            }
        };

        const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserType)));
            usersLoaded = true;
            updateLoadingState();
        });

        const keysUnsub = onSnapshot(collection(db, 'licenseKeys'), (snapshot) => {
            setLicenseKeys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LicenseKey)));
            keysLoaded = true;
            updateLoadingState();
        });

        const plansUnsub = onSnapshot(collection(db, 'subscriptionPlans'), (snapshot) => {
            setSubscriptionPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan)));
            plansLoaded = true;
            updateLoadingState();
        });

        return () => {
            usersUnsub();
            keysUnsub();
            plansUnsub();
        };
    }, []);


    const handleEdit = (user: UserType) => {
        setEditingUser(user);
        setDialogOpen(true);
    };
    
    const handleViewProfile = (user: UserType) => {
        setViewingUser(user);
    };

    const handleDelete = async (userToDelete: UserType) => {
        if (!userToDelete) return;
        
        // Note: Deleting a user from Firebase Auth requires admin privileges
        // and should be handled in a secure backend environment (e.g., Cloud Function).
        // We will only delete the Firestore document here.
        try {
            await deleteDoc(doc(db, 'users', userToDelete.id));

            toast({
                title: "User Deleted",
                description: `The user "${userToDelete.firstName} ${userToDelete.lastName}" has been successfully deleted from Firestore.`,
            });
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: "Error Deleting User",
                description: error.message,
            });
        }
    };

    const handleMakeAdmin = async (user: UserType) => {
        if (!user) return;
        
        const userDocRef = doc(db, 'users', user.id);
        try {
            await updateDoc(userDocRef, {
                role: 'Admin'
            });
            toast({
                title: "Admin Promotion Successful",
                description: `${user.firstName} ${user.lastName} is now an administrator.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Promotion Failed",
                description: error.message,
            });
        }
    };
    
    const handleMakeUser = async (user: UserType) => {
        if (!user) return;
        
        const userDocRef = doc(db, 'users', user.id);
        try {
            await updateDoc(userDocRef, {
                role: 'User'
            });
            toast({
                title: "Admin Demotion Successful",
                description: `${user.firstName} ${user.lastName} is now a regular user.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Demotion Failed",
                description: error.message,
            });
        }
    };

    const handlePasswordReset = async (user: UserType) => {
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast({
                title: "Password Reset Email Sent",
                description: `A password reset link has been sent to ${user.email}.`,
            });
        } catch(error: any) {
             toast({
                variant: 'destructive',
                title: "Error Sending Reset Email",
                description: error.message,
            });
        }
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingUser) return;
        
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const [firstName, ...lastName] = name.split(' ');
        const email = formData.get('email') as string;
        const role = formData.get('role') as 'Admin' | 'User';
        const status = formData.get('status') as 'Active' | 'Inactive';

        const userDocRef = doc(db, 'users', editingUser.id);

        try {
            await updateDoc(userDocRef, {
                firstName,
                lastName: lastName.join(' '),
                email,
                role,
                status
            });
            toast({
                title: "User Updated",
                description: `Details for "${name}" have been successfully updated.`,
            });
            setDialogOpen(false);
            setEditingUser(null);
        } catch(error: any) {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: error.message,
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const getActiveSubscriptionStatus = (user: UserType) => {
        if (!user.subscriptions || user.subscriptions.length === 0) return 'Inactive';
        const hasActive = user.subscriptions.some(s => s.status === 'Active' && new Date(s.endDate) > new Date());
        return hasActive ? 'Active' : 'Inactive';
    }

    const filteredAndSortedUsers = useMemo(() => {
        const filtered = users.filter(user => {
            const fullName = `${user.firstName} ${user.lastName}`;
            return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   user.email.toLowerCase().includes(searchQuery.toLowerCase());
        });

        switch (sortOption) {
            case 'name-asc':
                return filtered.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
            case 'name-desc':
                return filtered.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
            case 'role-asc':
                return filtered.sort((a, b) => a.role.localeCompare(b.role));
            default:
                return filtered;
        }
    }, [users, searchQuery, sortOption]);
    
    if (isLoading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }


    return (
        <div className="flex flex-col h-full gap-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="md:hidden">
                        <BackButton onClick={() => setActiveView('site-management')} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground">View and manage all registered users.</p>
                    </div>
                </div>
                {/* Add User button disabled as user creation should happen via signup flow */}
                <Button disabled className="hidden md:inline-flex" title="Create users via the main signup page">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

             <SearchAndSort
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOption={sortOption}
                onSortChange={setSortOption}
                sortOptions={[
                    { value: 'name-asc', label: 'Name (A-Z)' },
                    { value: 'name-desc', label: 'Name (Z-A)' },
                    { value: 'role-asc', label: 'Role' },
                ]}
            />

            {/* Desktop Table View */}
            <div className="rounded-lg border flex-grow hidden md:block">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Subscription</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedUsers.map((user) => {
                            const subStatus = getActiveSubscriptionStatus(user);
                            return (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.status === 'Active' ? 'outline' : 'destructive'}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={subStatus === 'Active' ? 'default' : 'secondary'}>
                                        {subStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleViewProfile(user)}>
                                                <UserRound className="mr-2 h-4 w-4" />
                                                Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            {user.role === 'Admin' ? (
                                                <DropdownMenuItem onClick={() => handleMakeUser(user)}>
                                                    <UserIcon className="mr-2 h-4 w-4" />
                                                    Make User
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => handleMakeAdmin(user)}>
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    Make Admin
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => handlePasswordReset(user)}>Reset Password</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                                <DeleteConfirmationButton
                                                    onConfirm={() => handleDelete(user)}
                                                    itemName={`${user.firstName} ${user.lastName}`}
                                                    itemType="user"
                                                />
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4">
                {filteredAndSortedUsers.map((user) => {
                    const subStatus = getActiveSubscriptionStatus(user);
                    return (
                    <Card key={user.id} className="glass-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{user.firstName} {user.lastName}</CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleViewProfile(user)}>
                                            <UserRound className="mr-2 h-4 w-4" />
                                            Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                         {user.role === 'Admin' ? (
                                            <DropdownMenuItem onClick={() => handleMakeUser(user)}>
                                                <UserIcon className="mr-2 h-4 w-4" />
                                                Make User
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem onClick={() => handleMakeAdmin(user)}>
                                                <Shield className="mr-2 h-4 w-4" />
                                                Make Admin
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handlePasswordReset(user)}>Reset Password</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                            <DeleteConfirmationButton
                                                onConfirm={() => handleDelete(user)}
                                                itemName={`${user.firstName} ${user.lastName}`}
                                                itemType="user"
                                            />
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 text-sm pt-0">
                            <p className="text-muted-foreground">{user.email}</p>
                             <div className="flex items-center gap-2">
                                <strong>Role:</strong> <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <strong>Status:</strong> <Badge variant={user.status === 'Active' ? 'outline' : 'destructive'}>{user.status}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <strong>Subscription:</strong> <Badge variant={subStatus === 'Active' ? 'default' : 'secondary'}>{subStatus}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                )})}
            </div>
            <div className="mt-8 md:hidden">
                <Button disabled className="w-full" title="Create users via the main signup page">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

             <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                        <DialogDescription>
                           Fill in the details for the user. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="grid gap-4 py-4">
                             <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="sm:text-right">Name</Label>
                                <Input id="name" name="name" defaultValue={editingUser ? `${editingUser.firstName} ${editingUser.lastName}` : ''} className="sm:col-span-3" required disabled={isSaving} />
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="sm:text-right">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={editingUser?.email} className="sm:col-span-3" required disabled={isSaving} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="sm:text-right">Role</Label>
                                <Select name="role" defaultValue={editingUser?.role || 'User'} disabled={isSaving}>
                                    <SelectTrigger className="sm:col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="User">User</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="sm:text-right">Status</Label>
                                <Select name="status" defaultValue={editingUser?.status || 'Active'} disabled={isSaving}>
                                    <SelectTrigger className="sm:col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <UserProfileDialog
                user={viewingUser}
                allLicenseKeys={licenseKeys}
                allSubscriptionPlans={subscriptionPlans}
                isOpen={!!viewingUser}
                onOpenChange={() => setViewingUser(null)}
            />
        </div>
    );
}
