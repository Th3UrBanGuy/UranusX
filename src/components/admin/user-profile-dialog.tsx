
'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, LicenseKey, SubscriptionPlan, UserSubscription } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { CalendarIcon, KeyIcon, ClockIcon, Hash, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserProfileDialogProps {
    user: User | null;
    allLicenseKeys: LicenseKey[];
    allSubscriptionPlans: SubscriptionPlan[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function UserProfileDialog({
    user,
    allLicenseKeys,
    allSubscriptionPlans,
    isOpen,
    onOpenChange,
}: UserProfileDialogProps) {

    const claimedKeys = useMemo(() => {
        if (!user) return [];
        return allLicenseKeys.filter(key => key.claims.some(claim => claim.userId === user.id));
    }, [user, allLicenseKeys]);

    const activeSubscriptions = useMemo(() => {
        if (!user) return [];
        return user.subscriptions.filter(sub => sub.status === 'Active' && new Date(sub.endDate) > new Date());
    }, [user]);

    const getPlanName = (planId: string) => {
        return allSubscriptionPlans.find(p => p.id === planId)?.name || 'Unknown Plan';
    }

    if (!user) {
        return null;
    }

    const sortedSubscriptions = [...user.subscriptions].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    const stats = [
        { name: 'Total Subscriptions', value: user.subscriptions.length },
        { name: 'Active Subscriptions', value: activeSubscriptions.length },
        { name: 'Keys Claimed', value: claimedKeys.length },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "flex flex-col p-0 gap-0 overflow-hidden",
                // Desktop
                "max-w-3xl h-[90vh]",
                // Mobile
                "sm:max-w-full sm:h-screen sm:rounded-none sm:border-none"
            )}>
                <ScrollArea className="flex-grow">
                    <div className="relative">
                        {/* Cover Photo */}
                        <div className="h-40 sm:h-56 w-full relative">
                            <Image 
                                src={`https://picsum.photos/seed/${user.id}/1024/256`} 
                                alt="Cover image"
                                fill
                                className="object-cover"
                            />
                             <div className="absolute inset-0 bg-black/30" />
                        </div>

                        {/* Profile Header */}
                        <div className="relative px-6 -mt-16 z-10">
                            <div className="flex flex-col sm:flex-row items-center sm:items-end sm:gap-6">
                                <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-background">
                                    <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                                    <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-center sm:text-left py-2">
                                    <h1 className="text-2xl font-bold">{user.firstName} {user.lastName}</h1>
                                    <p className="text-muted-foreground">{user.email}</p>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                                        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                                        <Badge variant={user.status === 'Active' ? 'outline' : 'destructive'}>{user.status}</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Section */}
                         <div className="px-6 py-4 border-b border-border/50">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                {stats.map(stat => (
                                     <div key={stat.name}>
                                        <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                                        <p className="text-xs sm:text-sm text-muted-foreground">{stat.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activity Tabs */}
                        <div className="p-4 sm:p-6">
                             <Tabs defaultValue="subscriptions" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                                    <TabsTrigger value="claims">Claims</TabsTrigger>
                                </TabsList>
                                <TabsContent value="subscriptions" className="mt-4">
                                     {sortedSubscriptions.length > 0 ? (
                                        <div className="space-y-4">
                                            {sortedSubscriptions.map((sub, index) => (
                                                <div key={index} className="flex items-start gap-4 p-3 border rounded-lg bg-background/50">
                                                    <div className="flex-shrink-0 pt-1">
                                                        <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold">{getPlanName(sub.planId)}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(new Date(sub.startDate), 'MMM d, yyyy')} - {format(new Date(sub.endDate), 'MMM d, yyyy')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        {sub.status === 'Active' && new Date(sub.endDate) > new Date() ? (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                                <span>Active</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4 text-red-500" />
                                                                <span>{sub.status}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8">No subscription history.</p>
                                    )}
                                </TabsContent>
                                <TabsContent value="claims" className="mt-4">
                                    {claimedKeys.length > 0 ? (
                                        <div className="space-y-4">
                                            {claimedKeys.map(key => {
                                                const claim = key.claims.find(c => c.userId === user.id);
                                                return (
                                                    <div key={key.id} className="flex items-start gap-4 p-3 border rounded-lg bg-background/50">
                                                        <div className="flex-shrink-0 pt-1">
                                                            <KeyIcon className="w-5 h-5 text-muted-foreground" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold font-mono text-sm">{key.key}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Claimed: {claim ? format(new Date(claim.timestamp), 'PPp') : 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold">{getPlanName(key.planId)}</p>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                                                                <ClockIcon className="w-3 h-3" /> {key.durationMinutes} min
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8">No license keys claimed.</p>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="flex-shrink-0 p-4 border-t bg-background sm:sticky sm:bottom-0">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

