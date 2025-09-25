'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Loader2, Pencil } from 'lucide-react';
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
} from '@/components/ui/dropdown-menu';
import { Menu, SubscriptionPlan } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { DeleteConfirmationButton } from './delete-confirmation-button';
import { BackButton } from './back-button';
import type { AdminView } from './admin-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { SearchAndSort, SortOption } from '../dashboard/search-and-sort';

interface SubscriptionManagementPageProps {
    setActiveView: (view: AdminView) => void;
}

type PlanSortOption = SortOption | 'price-asc' | 'price-desc';

export function SubscriptionManagementPage({ setActiveView }: SubscriptionManagementPageProps) {
    const { toast } = useToast();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [menuData, setMenuData] = useState<Menu[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

    // State for form fields
    const [planName, setPlanName] = useState('');
    const [planDescription, setPlanDescription] = useState('');
    const [planPrice, setPlanPrice] = useState(0);
    const [accessibleCategories, setAccessibleCategories] = useState<string[]>([]);
    const [accessibleSubCategories, setAccessibleSubCategories] = useState<string[]>([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<PlanSortOption>('price-desc');


    useEffect(() => {
        let plansLoaded = false;
        let menuLoaded = false;

        const updateLoadingState = () => {
            if (plansLoaded && menuLoaded) {
                setIsLoading(false);
            }
        };

        const plansUnsub = onSnapshot(collection(db, 'subscriptionPlans'), (snapshot) => {
            setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan)));
            plansLoaded = true;
            updateLoadingState();
        });

        const menuUnsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
            setMenuData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Menu)));
            menuLoaded = true;
            updateLoadingState();
        });
        
        return () => {
            plansUnsub();
            menuUnsub();
        };
    }, []);
    
    const resetFormState = () => {
        setPlanName('');
        setPlanDescription('');
        setPlanPrice(0);
        setAccessibleCategories([]);
        setAccessibleSubCategories([]);
    };

    const handleAdd = () => {
        setEditingPlan(null);
        resetFormState();
        setDialogOpen(true);
    };

    const handleEdit = (plan: SubscriptionPlan) => {
        setEditingPlan(plan);
        setPlanName(plan.name);
        setPlanDescription(plan.description);
        setPlanPrice(plan.price);
        setAccessibleCategories(plan.accessibleCategories || []);
        setAccessibleSubCategories(plan.accessibleSubCategories || []);
        setDialogOpen(true);
    };

    const handleDelete = async (planId: string) => {
        try {
            await deleteDoc(doc(db, 'subscriptionPlans', planId));
            toast({ title: "Plan Deleted" });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const handleCategoryToggle = (categoryId: string, checked: boolean) => {
        setAccessibleCategories(prev => 
            checked ? [...prev, categoryId] : prev.filter(id => id !== categoryId)
        );
    };

    const handleSubCategoryToggle = (subCategoryName: string, checked: boolean) => {
        setAccessibleSubCategories(prev => 
            checked ? [...prev, subCategoryName] : prev.filter(name => name !== subCategoryName)
        );
    };
    
    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        
        const newPlanData = {
            name: planName,
            description: planDescription,
            price: planPrice,
            accessibleCategories,
            accessibleSubCategories,
        };
        
        try {
            if (editingPlan) {
                const planRef = doc(db, 'subscriptionPlans', editingPlan.id);
                await updateDoc(planRef, newPlanData);
                toast({ title: "Plan Updated" });
            } else {
                await addDoc(collection(db, 'subscriptionPlans'), newPlanData);
                toast({ title: "Plan Created" });
            }
            setDialogOpen(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredAndSortedPlans = useMemo(() => {
        const filtered = plans.filter(plan => 
            plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            plan.description.toLowerCase().includes(searchQuery.toLowerCase())
        );

        switch (sortOption) {
            case 'name-asc':
                return filtered.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return filtered.sort((a, b) => b.name.localeCompare(a.name));
            case 'price-asc':
                return filtered.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return filtered.sort((a, b) => b.price - a.price);
            default:
                return filtered;
        }
    }, [plans, searchQuery, sortOption]);

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
                        <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
                        <p className="text-muted-foreground">Manage your subscription plans and permissions.</p>
                    </div>
                </div>
                <Button onClick={handleAdd} className="hidden md:inline-flex">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Plan
                </Button>
            </div>
            
            <SearchAndSort
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOption={sortOption}
                onSortChange={setSortOption as any}
                sortOptions={[
                    { value: 'name-asc', label: 'Name (A-Z)' },
                    { value: 'name-desc', label: 'Name (Z-A)' },
                    { value: 'price-desc', label: 'Price (High-Low)' },
                    { value: 'price-asc', label: 'Price (Low-High)' },
                ]}
            />

             {/* Desktop Table View */}
            <div className="rounded-lg border hidden md:block">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Accessible Items</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedPlans.map((plan) => {
                            const accessibleCount = (plan.accessibleCategories?.length || 0) + (plan.accessibleSubCategories?.length || 0);
                            return (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell>${plan.price.toFixed(2)}</TableCell>
                                    <TableCell>{accessibleCount} items</TableCell>
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
                                                <DropdownMenuItem onClick={() => handleEdit(plan)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                    <DeleteConfirmationButton
                                                        onConfirm={() => handleDelete(plan.id)}
                                                        itemName={plan.name}
                                                        itemType="subscription plan"
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
                {filteredAndSortedPlans.map((plan) => {
                     const accessibleCount = (plan.accessibleCategories?.length || 0) + (plan.accessibleSubCategories?.length || 0);
                     return (
                        <Card key={plan.id} className="glass-card">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost" className="-mt-2 -mr-2">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleEdit(plan)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                <DeleteConfirmationButton
                                                    onConfirm={() => handleDelete(plan.id)}
                                                    itemName={plan.name}
                                                    itemType="subscription plan"
                                                />
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Price</span>
                                    <span className="font-semibold">${plan.price.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Accessible Items</span>
                                    <span>{accessibleCount}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="mt-8 md:hidden">
                <Button onClick={handleAdd} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Plan
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
                        <DialogDescription>
                           Fill in the details for the subscription plan.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <Tabs defaultValue="details" className="w-full">
                             <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="details">Plan Details</TabsTrigger>
                                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                            </TabsList>
                             <TabsContent value="details">
                                <ScrollArea className="h-72 pr-6">
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="name" className="text-right">Name</Label>
                                            <Input id="name" value={planName} onChange={e => setPlanName(e.target.value)} className="col-span-3" required disabled={isSaving} />
                                        </div>
                                        <div className="grid grid-cols-4 items-start gap-4">
                                            <Label htmlFor="description" className="text-right pt-2">Description</Label>
                                            <Textarea id="description" value={planDescription} onChange={e => setPlanDescription(e.target.value)} className="col-span-3" required rows={3} disabled={isSaving}/>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="price" className="text-right">Price ($)</Label>
                                            <Input id="price" type="number" step="0.01" value={planPrice} onChange={e => setPlanPrice(parseFloat(e.target.value))} className="col-span-3" required disabled={isSaving} />
                                        </div>
                                    </div>
                                </ScrollArea>
                             </TabsContent>
                             <TabsContent value="permissions">
                                 <ScrollArea className="h-72 rounded-md border p-4 mt-4">
                                    <div className="space-y-4">
                                        {menuData.map(category => (
                                            <div key={category.id}>
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Checkbox 
                                                        id={`cat-${category.id}`}
                                                        checked={accessibleCategories.includes(category.id)}
                                                        onCheckedChange={(checked) => handleCategoryToggle(category.id, !!checked)}
                                                        disabled={isSaving}
                                                    />
                                                    <label htmlFor={`cat-${category.id}`} className="font-semibold text-sm">
                                                        {category.title} (Full Category)
                                                    </label>
                                                </div>
                                                <div className="pl-6 space-y-2">
                                                    {category.subCategories.map(sub => (
                                                        <div key={sub.name} className="flex items-center space-x-2">
                                                            <Checkbox 
                                                                id={`sub-${sub.name}`}
                                                                checked={accessibleSubCategories.includes(sub.name)}
                                                                onCheckedChange={(checked) => handleSubCategoryToggle(sub.name, !!checked)}
                                                                disabled={isSaving}
                                                            />
                                                            <label htmlFor={`sub-${sub.name}`} className="text-sm font-normal">
                                                                {sub.name}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
