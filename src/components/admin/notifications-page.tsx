'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Loader2, Send, Image as ImageIcon, Video as VideoIcon, Link as LinkIcon, Edit, Users, MessageSquare } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Notification, User, NotificationButton } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where, getDocs, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationButton } from './delete-confirmation-button';
import { BackButton } from './back-button';
import type { AdminView } from './admin-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';

interface MediaItem {
    id: number;
    type: 'image' | 'video';
    url: string;
}

interface ButtonItem {
    id: number;
    text: string;
    url: string;
}

interface NotificationsPageProps {
    setActiveView: (view: AdminView) => void;
}


export function NotificationsPage({ setActiveView }: NotificationsPageProps) {
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for form fields
    const [recipientType, setRecipientType] = useState<'universal' | 'individual'>('universal');
    const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [buttonItems, setButtonItems] = useState<ButtonItem[]>([]);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');


     useEffect(() => {
        const notificationsRef = collection(db, 'notifications');
        const q = query(notificationsRef, orderBy('timestamp', 'desc'));
        const unsubscribeNotifs = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                return { 
                    id: doc.id, 
                    ...docData,
                    timestamp: docData.timestamp?.toDate().toISOString() || new Date().toISOString(),
                } as Notification
            });
            setNotifications(data);
            if (users.length > 0 || snapshot.empty) setIsLoading(false);
        });

        const usersRef = collection(db, 'users');
        const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
            if (notifications.length > 0 || snapshot.docs.length > 0) setIsLoading(false);
        });

        return () => {
            unsubscribeNotifs();
            unsubscribeUsers();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDelete = async (notificationId: string) => {
        try {
            await deleteDoc(doc(db, 'notifications', notificationId));
            toast({ title: "Notification Deleted" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const resetForm = () => {
        setTitle('');
        setBody('');
        setRecipientType('universal');
        setSelectedUser(undefined);
        setMediaItems([]);
        setButtonItems([]);
    }
    
    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        if (recipientType === 'individual' && !selectedUser) {
            toast({ variant: 'destructive', title: 'No Recipient Selected', description: 'Please select a user to send the notification to.' });
            setIsSubmitting(false);
            return;
        }

        const newNotificationData = {
            title,
            body,
            recipientId: recipientType === 'individual' ? selectedUser : null,
            imageUrls: mediaItems.filter(item => item.type === 'image' && item.url).map(item => item.url),
            videoUrls: mediaItems.filter(item => item.type === 'video' && item.url).map(item => item.url),
            buttons: buttonItems.filter(item => item.text && item.url).map(item => ({ text: item.text, url: item.url })),
            readBy: [],
            deletedBy: [],
            timestamp: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, 'notifications'), newNotificationData);
            toast({ title: "Notification Sent", description: `Your notification has been sent to ${recipientType === 'universal' ? 'all users' : 'the selected user'}.` });
            resetForm();
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getRecipientName = (notif: Notification) => {
        if (!notif.recipientId) {
            return <Badge variant="secondary">Universal</Badge>;
        }
        const user = users.find(u => u.id === notif.recipientId);
        return user ? `${user.firstName} ${user.lastName}` : <Badge variant="outline">Unknown User</Badge>;
    }

    const addMediaItem = (type: 'image' | 'video') => {
        setMediaItems(prev => [...prev, { id: Date.now(), type, url: '' }]);
    }

    const updateMediaItemUrl = (id: number, url: string) => {
        setMediaItems(prev => prev.map(item => item.id === id ? { ...item, url } : item));
    }

    const removeMediaItem = (id: number) => {
        setMediaItems(prev => prev.filter(item => item.id !== id));
    }
    
    const addButtonItem = () => {
        setButtonItems(prev => [...prev, { id: Date.now(), text: '', url: '' }]);
    }

    const updateButtonItem = (id: number, field: 'text' | 'url', value: string) => {
        setButtonItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    }

    const removeButtonItem = (id: number) => {
        setButtonItems(prev => prev.filter(item => item.id !== id));
    }


    return (
        <div className="flex flex-col h-full gap-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="md:hidden">
                        <BackButton onClick={() => setActiveView('content')} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                        <p className="text-muted-foreground">Send and manage user notifications.</p>
                    </div>
                </div>
            </div>
            <div>
                 <Card>
                    <form onSubmit={handleSave}>
                        <CardHeader>
                             <CardTitle>Compose Notification</CardTitle>
                             <CardDescription>Compose and send a new notification to all users or a specific user.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Tabs defaultValue="content" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="content"><MessageSquare className="mr-2 h-4 w-4 sm:hidden" /> <span className="hidden sm:inline">Content</span></TabsTrigger>
                                    <TabsTrigger value="audience"><Users className="mr-2 h-4 w-4 sm:hidden" /> <span className="hidden sm:inline">Audience</span></TabsTrigger>
                                    <TabsTrigger value="attachments"><ImageIcon className="mr-2 h-4 w-4 sm:hidden" /> <span className="hidden sm:inline">Attachments</span></TabsTrigger>
                                </TabsList>
                                <TabsContent value="content">
                                    <ScrollArea className="h-72 pr-6">
                                        <div className="py-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Title</Label>
                                                <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="body">Body</Label>
                                                <Textarea id="body" name="body" value={body} onChange={(e) => setBody(e.target.value)} required rows={4} disabled={isSubmitting}/>
                                            </div>
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                                <TabsContent value="audience">
                                    <ScrollArea className="h-72 pr-6">
                                        <div className="py-4 space-y-4">
                                             <div className="space-y-2">
                                                 <Label htmlFor="recipientType">Recipient Type</Label>
                                                 <Select value={recipientType} onValueChange={(value) => setRecipientType(value as any)} disabled={isSubmitting}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="universal">Universal</SelectItem>
                                                        <SelectItem value="individual">Individual</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                             {recipientType === 'individual' && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="recipient">Select User</Label>
                                                     <Select value={selectedUser} onValueChange={setSelectedUser} disabled={isSubmitting}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a user" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {users.map(user => (
                                                                <SelectItem key={user.id} value={user.id}>
                                                                    {user.firstName} {user.lastName} ({user.email})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                             )}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                                 <TabsContent value="attachments">
                                     <ScrollArea className="h-72 pr-6">
                                         <div className="py-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label>Media</Label>
                                                <div className="space-y-2">
                                                    {mediaItems.map((item) => (
                                                        <div key={item.id} className="flex items-center gap-2">
                                                            <Input 
                                                                type="url"
                                                                placeholder={item.type === 'image' ? 'https://example.com/image.png' : 'https://example.com/video.mp4'}
                                                                value={item.url}
                                                                onChange={(e) => updateMediaItemUrl(item.id, e.target.value)}
                                                                className="flex-grow"
                                                                disabled={isSubmitting}
                                                            />
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeMediaItem(item.id)} disabled={isSubmitting}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <div className="flex gap-2">
                                                        <Button type="button" variant="outline" size="sm" onClick={() => addMediaItem('image')} disabled={isSubmitting}>
                                                            <ImageIcon className="mr-2 h-4 w-4" /> Add Image
                                                        </Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => addMediaItem('video')} disabled={isSubmitting}>
                                                            <VideoIcon className="mr-2 h-4 w-4" /> Add Video
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                             <div className="space-y-2">
                                                <Label>Buttons</Label>
                                                <div className="space-y-2">
                                                    {buttonItems.map((item) => (
                                                        <div key={item.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border rounded-md relative">
                                                           <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute -top-3 -right-3 h-6 w-6 bg-muted rounded-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                                                                onClick={() => removeButtonItem(item.id)}
                                                                disabled={isSubmitting}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                            <Input 
                                                                type="text"
                                                                placeholder="Button Text"
                                                                value={item.text}
                                                                onChange={(e) => updateButtonItem(item.id, 'text', e.target.value)}
                                                                className="flex-grow"
                                                                disabled={isSubmitting}
                                                            />
                                                            <Input 
                                                                type="url"
                                                                placeholder="https://example.com/link"
                                                                value={item.url}
                                                                onChange={(e) => updateButtonItem(item.id, 'url', e.target.value)}
                                                                className="flex-grow"
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                    ))}
                                                    <div className="flex gap-2">
                                                        <Button type="button" variant="outline" size="sm" onClick={addButtonItem} disabled={isSubmitting}>
                                                            <LinkIcon className="mr-2 h-4 w-4" /> Add Button
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                         </div>
                                     </ScrollArea>
                                 </TabsContent>
                            </Tabs>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                               {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Send Notification
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>

            <div className="flex flex-col">
                 <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Sent Notifications</h2>
                        <p className="text-muted-foreground">Manage previously sent notifications.</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="rounded-lg border hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Recipient</TableHead>
                                        <TableHead>Sent</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {notifications.map((notification) => (
                                        <TableRow key={notification.id}>
                                            <TableCell className="font-medium">{notification.title}</TableCell>
                                            <TableCell>
                                                {getRecipientName(notification)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DeleteConfirmationButton
                                                    onConfirm={() => handleDelete(notification.id)}
                                                    itemName={notification.title}
                                                    itemType="notification"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {/* Mobile Card View */}
                        <div className="md:hidden flex flex-col gap-4">
                            {notifications.map((notification) => (
                                <Card key={notification.id} className="glass-card">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-base">{notification.title}</CardTitle>
                                             <DeleteConfirmationButton
                                                onConfirm={() => handleDelete(notification.id)}
                                                itemName={notification.title}
                                                itemType="notification"
                                                className="-mt-2 -mr-2"
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2 pt-0">
                                         <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Recipient</span>
                                            <span>{getRecipientName(notification)}</span>
                                        </div>
                                         <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Sent</span>
                                            <span>{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
