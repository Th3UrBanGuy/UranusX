
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
import { defaultIcon, SubCategory, Menu } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicIcon } from '@/components/dynamic-icon';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmationButton } from './delete-confirmation-button';
import { BackButton } from './back-button';
import type { AdminView } from './admin-client';

type SubCategoryRow = SubCategory & {
    parent: string; // The ID of the parent category
    parentTitle: string;
};

interface SubCategoriesPageProps {
    setActiveView: (view: AdminView) => void;
}

export function SubCategoriesPage({ setActiveView }: SubCategoriesPageProps) {
    const { toast } = useToast();
    const [menuData, setMenuData] = useState<Menu[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryRow | null>(null);
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

    const allSubCategories: SubCategoryRow[] = menuData.flatMap(m => 
        m.subCategories.map(sc => ({ ...sc, parent: m.id, parentTitle: m.title }))
    );

    const handleAdd = () => {
        setEditingSubCategory(null);
        setIconValue(defaultIcon);
        setDialogOpen(true);
    };

    const handleEdit = (subCategory: SubCategoryRow) => {
        setEditingSubCategory(subCategory);
        setIconValue(subCategory.icon || defaultIcon);
        setDialogOpen(true);
    };

    const handleDelete = async (subCategory: SubCategoryRow) => {
        const parentDocRef = doc(db, 'categories', subCategory.parent);
        try {
            // Find the exact subcategory object to remove
            const parentCategory = menuData.find(m => m.id === subCategory.parent);
            const subCategoryToRemove = parentCategory?.subCategories.find(sc => sc.name === subCategory.name);
            
            if(subCategoryToRemove) {
                await updateDoc(parentDocRef, {
                    subCategories: arrayRemove(subCategoryToRemove)
                });
                toast({ title: "Sub-category Deleted" });
            }
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };
    
    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const parentId = formData.get('parent') as string;
        const linkType = formData.get('linkType') as 'internal' | 'external';
        
        const newSubCategoryData: Omit<SubCategory, 'parent' | 'parentTitle'> = { name, icon: iconValue, linkType };

        try {
            if (editingSubCategory) {
                // If parent has changed, we must remove from old and add to new
                if (editingSubCategory.parent !== parentId) {
                    const oldParentRef = doc(db, 'categories', editingSubCategory.parent);
                    const oldSubCategoryObject = {
                        name: editingSubCategory.name,
                        icon: editingSubCategory.icon,
                        linkType: editingSubCategory.linkType
                    };
                    await updateDoc(oldParentRef, { subCategories: arrayRemove(oldSubCategoryObject) });

                    const newParentRef = doc(db, 'categories', parentId);
                    await updateDoc(newParentRef, { subCategories: arrayUnion(newSubCategoryData) });
                } else { // Just updating the sub-category in the same parent
                    const parentRef = doc(db, 'categories', parentId);
                    const parentCategory = menuData.find(m => m.id === parentId);
                    const updatedSubCategories = parentCategory!.subCategories.map(sc => 
                        sc.name === editingSubCategory.name ? newSubCategoryData : sc
                    );
                    await updateDoc(parentRef, { subCategories: updatedSubCategories });
                }
                toast({ title: "Sub-category Updated" });
            } else { // Adding new sub-category
                const parentRef = doc(db, 'categories', parentId);
                await updateDoc(parentRef, {
                    subCategories: arrayUnion(newSubCategoryData)
                });
                toast({ title: "Sub-category Added" });
            }
            setDialogOpen(false);
            setEditingSubCategory(null);
        } catch(error: any) {
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
                        <h1 className="text-3xl font-bold tracking-tight">Sub-category Management</h1>
                        <p className="text-muted-foreground">Manage your sub-categories here.</p>
                    </div>
                </div>
                <Button onClick={handleAdd} className="hidden md:inline-flex" disabled={menuData.length === 0}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Sub-category
                </Button>
            </div>

            {/* Desktop Table View */}
            <div className="rounded-lg border flex-grow hidden md:block">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Icon</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Parent Category</TableHead>
                            <TableHead>Link Type</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allSubCategories.map((subCategory) => (
                            <TableRow key={subCategory.name}>
                                 <TableCell>
                                    <DynamicIcon iconString={subCategory.icon} className="h-8 w-8" />
                                 </TableCell>
                                <TableCell className="font-medium">{subCategory.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{subCategory.parentTitle}</Badge>
                                </TableCell>
                                 <TableCell>
                                    <Badge variant={subCategory.linkType === 'internal' ? 'secondary' : 'default'}>
                                        {subCategory.linkType}
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
                                            <DropdownMenuItem onClick={() => handleEdit(subCategory)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                 <DeleteConfirmationButton
                                                    onConfirm={() => handleDelete(subCategory)}
                                                    itemName={subCategory.name}
                                                    itemType="sub-category"
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
                {allSubCategories.map((subCategory) => (
                    <Card key={subCategory.name} className="glass-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <DynamicIcon iconString={subCategory.icon} className="h-10 w-10" />
                                    <CardTitle className="text-lg">{subCategory.name}</CardTitle>
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
                                        <DropdownMenuItem onClick={() => handleEdit(subCategory)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <DeleteConfirmationButton
                                                onConfirm={() => handleDelete(subCategory)}
                                                itemName={subCategory.name}
                                                itemType="sub-category"
                                            />
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 text-sm pt-0">
                             <div>
                                <strong>Parent:</strong> <Badge variant="outline">{subCategory.parentTitle}</Badge>
                            </div>
                            <div>
                                <strong>Link Type:</strong> <Badge variant={subCategory.linkType === 'internal' ? 'secondary' : 'default'}>
                                            {subCategory.linkType}
                                        </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-8 md:hidden">
                <Button onClick={handleAdd} className="w-full" disabled={menuData.length === 0}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingSubCategory ? 'Edit Sub-category' : 'Add New Sub-category'}</DialogTitle>
                        <DialogDescription>
                           Fill in the details for the sub-category. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="grid gap-4 py-4">
                             <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" defaultValue={editingSubCategory?.name} required disabled={isSaving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parent">Parent Category</Label>
                                <Select name="parent" defaultValue={editingSubCategory?.parent} required disabled={isSaving}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {menuData.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="linkType">Link Type</Label>
                                <Select name="linkType" defaultValue={editingSubCategory?.linkType || 'external'} disabled={isSaving}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a link type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="external">External</SelectItem>
                                        <SelectItem value="internal">Internal</SelectItem>
                                    </SelectContent>
                                </Select>
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
