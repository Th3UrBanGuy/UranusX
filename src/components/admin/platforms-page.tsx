
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { Platform, Menu, SubCategory, PlatformLink, StreamSource } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AdminView } from './admin-client';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmationButton } from './delete-confirmation-button';
import { BackButton } from './back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { SearchAndSort, SortOption } from '../dashboard/search-and-sort';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PlatformsPageProps {
    setActiveView: (view: AdminView) => void;
}

export function PlatformsPage({ setActiveView }: PlatformsPageProps) {
    const { toast } = useToast();
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [menuData, setMenuData] = useState<Menu[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);

    // State for search and sort
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('name-asc');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [subCategoryFilter, setSubCategoryFilter] = useState('all');


    // State for the form fields
    const [platformName, setPlatformName] = useState('');
    const [platformCategory, setPlatformCategory] = useState('');
    const [platformDescription, setPlatformDescription] = useState('');
    const [platformImageUrl, setPlatformImageUrl] = useState('');
    const [platformStreamSources, setPlatformStreamSources] = useState<StreamSource[]>([{ name: 'Primary', url: '' }]);
    const [platformLinks, setPlatformLinks] = useState<PlatformLink[]>([{ text: 'Visit Website', url: '' }]);

    useEffect(() => {
        const platformsUnsub = onSnapshot(collection(db, 'platforms'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Platform));
            setPlatforms(data);
            setIsLoading(false);
        });

        const menuUnsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
            setMenuData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Menu)));
        });

        return () => {
            platformsUnsub();
            menuUnsub();
        };
    }, []);
    
    const allSubCategories = menuData.flatMap(m => m.subCategories);
    const selectedSubCategoryDetails = allSubCategories.find(sc => sc.name === platformCategory);


    const resetFormState = () => {
        setPlatformName('');
        setPlatformCategory('');
        setPlatformDescription('');
        setPlatformImageUrl('');
        setPlatformStreamSources([{ name: 'Primary', url: '' }]);
        setPlatformLinks([{ text: 'Visit Website', url: '' }]);
    }

    const handleAdd = () => {
        setEditingPlatform(null);
        resetFormState();
        setDialogOpen(true);
    };
    
    const handleEdit = (platform: Platform) => {
        setEditingPlatform(platform);
        setPlatformName(platform.name);
        setPlatformCategory(platform.category);
        setPlatformDescription(platform.description);
        setPlatformImageUrl(platform.imageUrl);
        setPlatformStreamSources(platform.streamSources && platform.streamSources.length > 0 ? platform.streamSources : [{ name: 'Primary', url: '' }]);
        setPlatformLinks(platform.links && platform.links.length > 0 ? platform.links : [{ text: 'Visit Website', url: '' }]);
        setDialogOpen(true);
    };

    const handleDelete = async (platformId: string) => {
        try {
            await deleteDoc(doc(db, 'platforms', platformId));
            toast({ title: "Platform Deleted" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };
    
    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);

        const platformData = {
            name: platformName,
            links: platformLinks.filter(link => link.url),
            category: platformCategory,
            imageUrl: platformImageUrl,
            description: platformDescription,
            streamSources: platformStreamSources.filter(source => source.url),
        };

        if (!platformData.name || !platformData.category) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all required fields in the Core Details tab." });
            setIsSaving(false);
            return;
        }

        try {
            if (editingPlatform && editingPlatform.id) {
                const platformRef = doc(db, 'platforms', editingPlatform.id);
                await updateDoc(platformRef, platformData);
                toast({ title: "Platform Updated" });
            } else {
                await addDoc(collection(db, 'platforms'), platformData);
                toast({ title: "Platform Added" });
            }
            setDialogOpen(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const getLinkType = (categoryName: string) => {
        const subCat = allSubCategories.find(sc => sc.name === categoryName);
        return subCat?.linkType || 'external';
    }

    const handleLinkChange = (index: number, field: keyof PlatformLink, value: string) => {
        const newLinks = [...platformLinks];
        newLinks[index][field] = value;
        setPlatformLinks(newLinks);
    };

    const addLink = () => {
        setPlatformLinks([...platformLinks, { text: 'Visit Website', url: '' }]);
    };

    const removeLink = (index: number) => {
        const newLinks = platformLinks.filter((_, i) => i !== index);
        setPlatformLinks(newLinks);
    };

    const handleSourceChange = (index: number, field: keyof StreamSource, value: string) => {
        const newSources = [...platformStreamSources];
        newSources[index][field] = value;
        setPlatformStreamSources(newSources);
    };

    const addSource = () => {
        setPlatformStreamSources([...platformStreamSources, { name: `Source ${platformStreamSources.length + 1}`, url: '' }]);
    };

    const removeSource = (index: number) => {
        const newSources = platformStreamSources.filter((_, i) => i !== index);
        setPlatformStreamSources(newSources);
    };

    const filteredAndSortedPlatforms = useMemo(() => {
        let filtered = platforms;

        if (categoryFilter !== 'all') {
            const subCategoriesInCategory = menuData.find(m => m.id === categoryFilter)?.subCategories.map(sc => sc.name) || [];
            filtered = filtered.filter(platform => subCategoriesInCategory.includes(platform.category));
        }
        
        if (subCategoryFilter !== 'all') {
            filtered = filtered.filter(platform => platform.category === subCategoryFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(platform =>
                platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                platform.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        switch (sortOption) {
            case 'name-asc':
                return filtered.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return filtered.sort((a, b) => b.name.localeCompare(a.name));
            default:
                return filtered;
        }
    }, [platforms, searchQuery, sortOption, categoryFilter, subCategoryFilter, menuData]);

    const subCategoryOptions = useMemo(() => {
        if (categoryFilter === 'all') return allSubCategories;
        return menuData.find(m => m.id === categoryFilter)?.subCategories || [];
    }, [categoryFilter, menuData, allSubCategories]);

    useEffect(() => {
        setSubCategoryFilter('all');
    }, [categoryFilter]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="md:hidden">
                        <BackButton onClick={() => setActiveView('content')} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Platform Management</h1>
                        <p className="text-muted-foreground text-sm sm:text-base">Manage all streaming platforms and channels.</p>
                    </div>
                </div>
                 <Button onClick={handleAdd} size="sm" className="hidden sm:inline-flex" disabled={allSubCategories.length === 0}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Platform
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Category..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {menuData.map(cat => (
                             <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Sub-category..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sub-categories</SelectItem>
                        {subCategoryOptions.map(subCat => (
                             <SelectItem key={subCat.name} value={subCat.name}>{subCat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <SearchAndSort
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOption={sortOption}
                onSortChange={setSortOption}
            />

            {/* Desktop Table View */}
            <div className="rounded-lg border hidden md:block">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">
                                <span className="sr-only">Image</span>
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Sub-Category</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedPlatforms.map((platform) => {
                            const linkType = getLinkType(platform.category);

                            return (
                                <TableRow key={platform.id}>
                                    <TableCell>
                                        <Image
                                            alt={platform.name}
                                            className="aspect-square rounded-md object-cover"
                                            height="64"
                                            src={platform.imageUrl || `https://picsum.photos/seed/${platform.id}/64/64`}
                                            width="64"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{platform.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{platform.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={linkType === 'internal' ? 'secondary' : 'default'}>{linkType}</Badge>
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
                                                <DropdownMenuItem onClick={() => handleEdit(platform)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                    <DeleteConfirmationButton
                                                        onConfirm={() => handleDelete(platform.id!)}
                                                        itemName={platform.name}
                                                        itemType="platform"
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
                 {filteredAndSortedPlatforms.map((platform) => {
                    const linkType = getLinkType(platform.category);
                    return (
                        <Card key={platform.id} className="glass-card">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <Image
                                            alt={platform.name}
                                            className="aspect-square rounded-md object-cover"
                                            height="56"
                                            src={platform.imageUrl || `https://picsum.photos/seed/${platform.id}/64/64`}
                                            width="56"
                                        />
                                        <div className="flex-1">
                                            <CardTitle className="text-base">{platform.name}</CardTitle>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                <Badge variant="outline">{platform.category}</Badge>
                                            </div>
                                        </div>
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
                                            <DropdownMenuItem onClick={() => handleEdit(platform)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                <DeleteConfirmationButton
                                                    onConfirm={() => handleDelete(platform.id!)}
                                                    itemName={platform.name}
                                                    itemType="platform"
                                                />
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2 text-sm pt-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Type</span>
                                    <Badge variant={linkType === 'internal' ? 'secondary' : 'default'}>{linkType}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )
                 })}
            </div>


             <div className="mt-8 sm:hidden">
                <Button onClick={handleAdd} className="w-full" disabled={allSubCategories.length === 0}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Platform
                </Button>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingPlatform ? 'Edit Platform' : 'Add New Platform'}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the platform. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="details">Core Details</TabsTrigger>
                                <TabsTrigger value="media">Media & Links</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="py-4">
                                <ScrollArea className="h-72 pr-6">
                                     <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input id="name" value={platformName} onChange={e => setPlatformName(e.target.value)} required disabled={isSaving} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Sub-Category</Label>
                                            <Select value={platformCategory} onValueChange={setPlatformCategory} required disabled={isSaving}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a sub-category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allSubCategories.map(cat => (
                                                        <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea id="description" value={platformDescription} onChange={e => setPlatformDescription(e.target.value)} required disabled={isSaving} />
                                        </div>
                                    </div>
                                 </ScrollArea>
                            </TabsContent>
                             <TabsContent value="media" className="py-4">
                                 <ScrollArea className="h-72 pr-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="imageUrl">Image URL (Logo)</Label>
                                            <Input id="imageUrl" value={platformImageUrl} onChange={e => setPlatformImageUrl(e.target.value)} required placeholder="https://example.com/logo.png" disabled={isSaving} />
                                        </div>
                                        
                                        {selectedSubCategoryDetails?.linkType === 'internal' && (
                                            <div className="space-y-4 rounded-lg border p-4">
                                                <div className="flex justify-between items-center">
                                                    <Label>Stream Sources (.m3u8)</Label>
                                                    <Button type="button" size="sm" variant="outline" onClick={addSource} disabled={isSaving}>
                                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Source
                                                    </Button>
                                                </div>
                                                {platformStreamSources.map((source, index) => (
                                                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border rounded-md relative">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute -top-3 -right-3 h-6 w-6 bg-muted rounded-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                                                            onClick={() => removeSource(index)}
                                                            disabled={isSaving}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`source-name-${index}`} className="text-xs">Source Name</Label>
                                                            <Input id={`source-name-${index}`} value={source.name} onChange={(e) => handleSourceChange(index, 'name', e.target.value)} required disabled={isSaving} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`source-url-${index}`} className="text-xs">Source URL</Label>
                                                            <Input id={`source-url-${index}`} value={source.url} onChange={(e) => handleSourceChange(index, 'url', e.target.value)} required placeholder="https://stream.example.com/live.m3u8" disabled={isSaving} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="space-y-4 rounded-lg border p-4">
                                            <div className="flex justify-between items-center">
                                                <Label>External Links</Label>
                                                <Button type="button" size="sm" variant="outline" onClick={addLink} disabled={isSaving}>
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Link
                                                </Button>
                                            </div>
                                            {platformLinks.map((link, index) => (
                                                <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border rounded-md relative">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute -top-3 -right-3 h-6 w-6 bg-muted rounded-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                                                        onClick={() => removeLink(index)}
                                                        disabled={isSaving}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`link-text-${index}`} className="text-xs">Button Text</Label>
                                                        <Input id={`link-text-${index}`} value={link.text} onChange={(e) => handleLinkChange(index, 'text', e.target.value)} disabled={isSaving} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`link-url-${index}`} className="text-xs">URL</Label>
                                                        <Input id={`link-url-${index}`} value={link.url} onChange={(e) => handleLinkChange(index, 'url', e.target.value)} required disabled={isSaving} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
