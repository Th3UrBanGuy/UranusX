'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Copy, RefreshCw, Users, Loader2, Pencil } from 'lucide-react';
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
import { LicenseKey, User, SubscriptionPlan } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { DeleteConfirmationButton } from './delete-confirmation-button';
import { BackButton } from './back-button';
import type { AdminView } from './admin-client';
import { SearchAndSort, SortOption } from '../dashboard/search-and-sort';

interface LicenseManagementPageProps {
    setActiveView: (view: AdminView) => void;
}

type LicenseSortOption = SortOption | 'date-asc' | 'date-desc' | 'status';

export function LicenseManagementPage({ setActiveView }: LicenseManagementPageProps) {
    const { toast } = useToast();
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isFormDialogOpen, setFormDialogOpen] = React.useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingKey, setEditingKey] = React.useState<LicenseKey | null>(null);
    const [customKey, setCustomKey] = React.useState('');
    const [isAnalyticsOpen, setAnalyticsOpen] = React.useState(false);
    const [viewingKey, setViewingKey] = React.useState<LicenseKey | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<LicenseSortOption>('date-desc');


    useEffect(() => {
        const keysQuery = query(collection(db, 'licenseKeys'), orderBy('createdAt', 'desc'));
        const keysUnsub = onSnapshot(keysQuery, (snapshot) => {
            setKeys(snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    // Ensure createdAt is a string for consistent sorting
                    createdAt: data.createdAt?.toDate().toISOString() || new Date(0).toISOString()
                } as LicenseKey;
            }));
            setIsLoading(false);
        });

        const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
            setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        });

        const plansUnsub = onSnapshot(collection(db, 'subscriptionPlans'), (snapshot) => {
            setSubscriptionPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan)));
        });

        return () => {
            keysUnsub();
            usersUnsub();
            plansUnsub();
        }
    }, []);

    const generateKeyString = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = 'SH-';
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                key += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            if (i < 2) key += '-';
        }
        return key;
    };

    const handleAdd = () => {
        setEditingKey(null);
        setCustomKey(generateKeyString());
        setFormDialogOpen(true);
    };

    const handleEdit = (key: LicenseKey) => {
        setEditingKey(key);
        setCustomKey(key.key);
        setFormDialogOpen(true);
    };

    const handleDelete = async (keyId: string) => {
        try {
            await deleteDoc(doc(db, 'licenseKeys', keyId));
            toast({ title: "License Key Deleted", description: "The key has been permanently removed." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error Deleting Key', description: error.message });
        }
    };
    
    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const planId = formData.get('planId') as string;
        const durationMinutes = parseInt(formData.get('durationMinutes') as string, 10);
        const maxClaims = parseInt(formData.get('maxClaims') as string, 10);
        const key = formData.get('key') as string;

        const licenseData = {
            key,
            planId,
            durationMinutes,
            maxClaims,
        };

        try {
            if (editingKey) {
                const keyRef = doc(db, 'licenseKeys', editingKey.id);
                await updateDoc(keyRef, licenseData);
                toast({ title: "Key Updated", description: "The license key has been successfully updated." });
            } else {
                await addDoc(collection(db, 'licenseKeys'), {
                    ...licenseData,
                    status: 'unused',
                    claims: [],
                    createdAt: serverTimestamp()
                });
                toast({ title: "Key Generated", description: "A new license key has been created." });
            }
            setFormDialogOpen(false);
            setEditingKey(null);
            setCustomKey('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error Saving Key', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleViewAnalytics = (key: LicenseKey) => {
        setViewingKey(key);
        setAnalyticsOpen(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "License key copied to clipboard." });
    }
    
    const getKeyStatus = (key: LicenseKey) => {
        if (key.claims.length >= key.maxClaims) return 'depleted';
        if (key.claims.length > 0) return 'claimed';
        return 'unused';
    }

    const filteredAndSortedKeys = useMemo(() => {
        const filtered = keys.filter(key => {
            const plan = subscriptionPlans.find(p => p.id === key.planId);
            return key.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   (plan && plan.name.toLowerCase().includes(searchQuery.toLowerCase()));
        });
        
        switch (sortOption) {
            case 'date-asc':
                return filtered.sort((a, b) => parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime());
            case 'date-desc':
                 return filtered.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
            case 'status':
                return filtered.sort((a, b) => getKeyStatus(a).localeCompare(getKeyStatus(b)));
            default:
                return filtered;
        }

    }, [keys, searchQuery, sortOption, subscriptionPlans]);

    const getStatusBadge = (key: LicenseKey) => {
        const status = getKeyStatus(key);
        if (status === 'depleted') return <Badge variant="destructive">Depleted</Badge>;
        if (status === 'claimed') return <Badge variant="secondary">Claimed</Badge>;
        return <Badge>Unused</Badge>;
    }
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }


    return (
        <div className="flex flex-col h-full gap-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="md:hidden">
                        <BackButton onClick={() => setActiveView('site-management')} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">License Key Management</h1>
                        <p className="text-muted-foreground">Generate and manage subscription license keys.</p>
                    </div>
                </div>
                <Button onClick={handleAdd} className="hidden md:inline-flex" disabled={subscriptionPlans.length === 0}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Generate Key
                </Button>
            </div>
            
            <SearchAndSort
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOption={sortOption}
                onSortChange={setSortOption as (opt: SortOption) => void}
                sortOptions={[
                    { value: 'date-desc', label: 'Newest' },
                    { value: 'date-asc', label: 'Oldest' },
                    { value: 'status', label: 'By Status' },
                ]}
            />


            {/* Desktop Table View */}
            <div className="rounded-lg border hidden md:block">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedKeys.map((key) => {
                            const plan = subscriptionPlans.find(p => p.id === key.planId);
                            return (
                                <TableRow key={key.id}>
                                    <TableCell className="font-mono">
                                        <div className="flex items-center gap-2">
                                            <span>{key.key}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(key.key)}>
                                                <Copy className="h-3 w-3"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>{plan?.name}</TableCell>
                                    <TableCell>{key.durationMinutes} minutes</TableCell>
                                    <TableCell>{key.claims.length} / {key.maxClaims}</TableCell>
                                    <TableCell>
                                        {getStatusBadge(key)}
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
                                                <DropdownMenuItem onClick={() => handleEdit(key)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleViewAnalytics(key)}
                                                    disabled={key.claims.length === 0}
                                                >
                                                    <Users className="mr-2 h-4 w-4" />
                                                    View Claims
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                                    <DeleteConfirmationButton
                                                        onConfirm={() => handleDelete(key.id)}
                                                        itemName={key.key}
                                                        itemType="license key"
                                                    />
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4">
                {filteredAndSortedKeys.map((key) => {
                     const plan = subscriptionPlans.find(p => p.id === key.planId);
                     return (
                        <Card key={key.id} className="glass-card">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-base font-mono flex items-center gap-2">
                                            {key.key}
                                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(key.key)}>
                                                <Copy className="h-3 w-3"/>
                                            </Button>
                                        </CardTitle>
                                        <div className="text-sm text-muted-foreground mt-1">{plan?.name}</div>
                                    </div>
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost" className="-mt-2 -mr-2">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleEdit(key)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => handleViewAnalytics(key)}
                                                disabled={key.claims.length === 0}
                                            >
                                                <Users className="mr-2 h-4 w-4" />
                                                View Claims
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                                <DeleteConfirmationButton
                                                    onConfirm={() => handleDelete(key.id)}
                                                    itemName={key.key}
                                                    itemType="license key"
                                                />
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2 text-sm pt-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    {getStatusBadge(key)}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span>{key.durationMinutes} minutes</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Usage</span>
                                    <span>{key.claims.length} / {key.maxClaims}</span>
                                </div>
                            </CardContent>
                        </Card>
                     )
                })}
            </div>
            
            <div className="mt-8 md:hidden">
                <Button onClick={handleAdd} className="w-full" disabled={subscriptionPlans.length === 0}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Generate Key
                </Button>
            </div>

            {/* Form Dialog for Add/Edit */}
            <Dialog open={isFormDialogOpen} onOpenChange={setFormDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingKey ? 'Edit License Key' : 'Generate New Key'}</DialogTitle>
                        <DialogDescription>
                           Set the properties for the license key. You can create a custom key or use the generated one.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="key">License Key</Label>
                                <div className="relative">
                                    <Input 
                                        id="key" 
                                        name="key" 
                                        value={customKey} 
                                        onChange={(e) => setCustomKey(e.target.value)}
                                        className="pr-10 font-mono"
                                        required 
                                        disabled={isSaving}
                                    />
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                        onClick={() => setCustomKey(generateKeyString())}
                                        disabled={isSaving}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="planId">Subscription Plan</Label>
                                <Select name="planId" defaultValue={editingKey?.planId || subscriptionPlans[0]?.id} required disabled={isSaving}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subscriptionPlans.map(plan => (
                                            <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                                    <Input id="durationMinutes" name="durationMinutes" type="number" defaultValue={editingKey?.durationMinutes || 43200} required disabled={isSaving}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxClaims">Max Claims</Label>
                                    <Input id="maxClaims" name="maxClaims" type="number" defaultValue={editingKey?.maxClaims || 1} required disabled={isSaving}/>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setFormDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingKey ? 'Save Changes' : 'Generate Key'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            {/* Analytics Dialog */}
            <Dialog open={isAnalyticsOpen} onOpenChange={setAnalyticsOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Claim Analytics</DialogTitle>
                        <DialogDescription>
                            Users who have claimed the key: <span className="font-bold font-mono">{viewingKey?.key}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 max-h-[60vh] overflow-y-auto">
                        {viewingKey && viewingKey.claims.length > 0 ? (
                            <div className="space-y-4">
                                {viewingKey.claims.map((claim, index) => {
                                    const user = allUsers.find(u => u.id === claim.userId);
                                    if (!user) return null;
                                    return (
                                        <div key={index} className="flex items-center gap-3 rounded-md border p-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                                                <AvatarFallback>
                                                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="font-medium">{user.firstName} {user.lastName}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {format(new Date(claim.timestamp), "PPpp")}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No claims yet for this key.</p>
                        )}
                    </div>
                     <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setAnalyticsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
