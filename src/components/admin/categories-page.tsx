
'use client'

import React, { useState, useEffect } from 'react';
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
import { defaultIcon, Menu } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DynamicIcon } from '@/components/dynamic-icon';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmationButton } from './delete-confirmation-button';
import { BackButton } from './back-button';
import type { AdminView } from './admin-client';

interface CategoriesPageProps {
    setActiveView: (view: AdminView) => void;
}


export function CategoriesPage({ setActiveView }: CategoriesPageProps) {
    const { toast } = useToast();
    const [menuData, setMenuData] = useState<Menu[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Menu | null>(null);
    const [iconValue, setIconValue] = useState('');

    useEffect(() => {
        const categoriesRef = collection(db, 'categories');
        const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Menu));
            setMenuData(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAdd = () => {
        setEditingCategory(null);
        setIconValue(defaultIcon);
        setDialogOpen(true);
    };

    const handleEdit = (category: Menu) => {
        setEditingCategory(category);
        setIconValue(category.icon || defaultIcon);
        setDialogOpen(true);
    };

    const handleDelete = async (categoryId: string) => {
        try {
            await deleteDoc(doc(db, 'categories', categoryId));
            toast({ title: "Category Deleted", description: "The category has been successfully deleted." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };
    
    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        
        try {
            if (editingCategory) {
                const categoryRef = doc(db, 'categories', editingCategory.id);
                await updateDoc(categoryRef, { title, icon: iconValue });
                toast({ title: "Category Updated", description: "The category has been successfully updated." });
            } else {
                await addDoc(collection(db, 'categories'), {
                    title,
                    icon: iconValue,
                    subCategories: [], // New categories start with no sub-categories
                });
                toast({ title: "Category Added", description: "The new category has been created." });
            }
            setDialogOpen(false);
            setEditingCategory(null);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col h-full">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="md:hidden">
                        <BackButton onClick={() => setActiveView('content')} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
                        <p className="text-muted-foreground">Manage your parent categories here.</p>
                    </div>
                </div>
                <Button onClick={handleAdd} className="hidden md:inline-flex">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                </Button>
            </div>

            {/* Desktop Table View */}
            <div className="rounded-lg border flex-grow hidden md:block">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Icon</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Sub-category Count</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {menuData.map((category) => (
                            <TableRow key={category.id}>
                                 <TableCell>
                                    <DynamicIcon iconString={category.icon} className="h-8 w-8" />
                                 </TableCell>
                                <TableCell className="font-medium">{category.title}</TableCell>
                                <TableCell>{category.subCategories.length}</TableCell>
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
                                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                <DeleteConfirmationButton
                                                    onConfirm={() => handleDelete(category.id)}
                                                    itemName={category.title}
                                                    itemType="category"
                                                />
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4">
                {menuData.map((category) => (
                    <Card key={category.id} className="glass-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <DynamicIcon iconString={category.icon} className="h-10 w-10" />
                                    <CardTitle className="text-lg">{category.title}</CardTitle>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleEdit(category)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                           <DeleteConfirmationButton
                                                onConfirm={() => handleDelete(category.id)}
                                                itemName={category.title}
                                                itemType="category"
                                            />
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 text-sm pt-0">
                             <div>
                                <strong>Sub-categories:</strong> {category.subCategories.length}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-8 md:hidden">
                <Button onClick={handleAdd} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                        <DialogDescription>
                           Fill in the details for the category. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="grid gap-4 py-4">
                             <div className="space-y-2">
                                <Label htmlFor="title">
                                    Title
                                </Label>
                                <Input id="title" name="title" defaultValue={editingCategory?.title} required disabled={isSaving} />
                            </div>
                            <div className="space-y-2">
                                <Label>Icon</Label>
                                <Textarea 
                                    placeholder='Paste the <lord-icon> HTML tag here...'
                                    value={iconValue}
                                    onChange={(e) => setIconValue(e.target.value)}
                                    rows={5}
                                    disabled={isSaving}
                                />
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
        </div>
    );
}
