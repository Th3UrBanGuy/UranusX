
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, KeyRound, Trash2, Loader2 } from 'lucide-react';
import { User, UserSubscription, SubscriptionPlan } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { SubscriptionTimer } from './subscription-timer';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';


interface LicensePageProps {
    user: User;
    subscriptionPlans: SubscriptionPlan[];
    onClaimLicense: () => void;
    onNavigateBack: () => void;
    onCancelSubscription: (subscription: UserSubscription) => void;
}

const SubscriptionCard = ({ subscription, onCancelClick, plan }: { subscription: UserSubscription, onCancelClick: () => void, plan?: SubscriptionPlan }) => {
    const isActive = subscription.status === 'Active' && new Date(subscription.endDate) > new Date();
    
    return (
        <Card className="glass-card flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{plan?.name || 'Unknown Plan'}</CardTitle>
                        <CardDescription>{plan?.description}</CardDescription>
                    </div>
                     <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Active' : 'Expired'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                {isActive && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Expires:</span>
                            <span className="font-semibold">{format(new Date(subscription.endDate), "PPp")}</span>
                        </div>
                        <SubscriptionTimer 
                            endDate={subscription.endDate} 
                            onTimerEnd={() => { /* The parent component handles the update */ }}
                            isCompact={true}
                        />
                    </div>
                )}
                 {!isActive && (
                     <div className="text-sm text-muted-foreground">
                        {subscription.status === 'Inactive' ? `Cancelled on ${format(new Date(subscription.endDate), "PPp")}` : `Expired on ${format(new Date(subscription.endDate), "PPp")}`}
                     </div>
                 )}
            </CardContent>
            {isActive && (
                <CardFooter>
                    <Button variant="destructive" size="sm" className="w-full" onClick={onCancelClick}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancel Subscription
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}

export function LicensePage({ user, subscriptionPlans, onClaimLicense, onNavigateBack, onCancelSubscription }: LicensePageProps) {
    const { toast } = useToast();
    const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [subscriptionToCancel, setSubscriptionToCancel] = useState<UserSubscription | null>(null);
    const [isClaiming, setIsClaiming] = useState(false);

    const handleOpenClaimDialog = () => {
        setIsClaiming(true);
        onClaimLicense();
        // Set a 10-second cooldown
        setTimeout(() => {
            setIsClaiming(false);
        }, 10000);
    }

    const handleCancelClick = (subscription: UserSubscription) => {
        setSubscriptionToCancel(subscription);
        setCancelDialogOpen(true);
    }

    const handleConfirmCancel = () => {
        if (subscriptionToCancel) {
            onCancelSubscription(subscriptionToCancel);
            toast({
                title: "Subscription Cancelled",
                description: "The subscription has been successfully cancelled.",
            });
        }
        setCancelDialogOpen(false);
        setSubscriptionToCancel(null);
    }

    const activeSubscriptions = useMemo(() => 
        user.subscriptions.filter(s => s.status === 'Active' && new Date(s.endDate) > new Date()),
        [user.subscriptions]
    );

    const inactiveSubscriptions = useMemo(() =>
        user.subscriptions.filter(s => s.status === 'Inactive' || new Date(s.endDate) <= new Date()),
        [user.subscriptions]
    );

    return (
        <div className="flex flex-col h-full gap-8">
            <div>
                <button onClick={onNavigateBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Back to User Panel
                </button>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">License Center</h1>
                        <p className="text-muted-foreground">Manage your active and past subscriptions.</p>
                    </div>
                    <Button onClick={handleOpenClaimDialog} className="w-full sm:w-auto" disabled={isClaiming}>
                        {isClaiming ? (
                           <>
                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                             Please wait...
                           </>
                        ) : (
                           <>
                             <KeyRound className="mr-2 h-4 w-4" />
                             Claim New License
                           </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <section>
                    <h2 className="text-2xl font-bold tracking-tight mb-4 border-l-4 border-accent pl-4">Active Subscriptions ({activeSubscriptions.length})</h2>
                    {activeSubscriptions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {activeSubscriptions.map((sub, index) => (
                                <SubscriptionCard 
                                    key={`${sub.planId}-${index}`} 
                                    subscription={sub} 
                                    plan={subscriptionPlans.find(p => p.id === sub.planId)}
                                    onCancelClick={() => handleCancelClick(sub)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">You have no active subscriptions.</p>
                    )}
                </section>
                
                <section>
                    <h2 className="text-2xl font-bold tracking-tight mb-4 border-l-4 border-border pl-4">Expired Subscriptions ({inactiveSubscriptions.length})</h2>
                    {inactiveSubscriptions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                             {inactiveSubscriptions.map((sub, index) => (
                                <SubscriptionCard 
                                    key={`${sub.planId}-${index}`} 
                                    subscription={sub}
                                    plan={subscriptionPlans.find(p => p.id === sub.planId)}
                                    onCancelClick={() => {}}
                                />
                            ))}
                        </div>
                    ) : (
                         <p className="text-muted-foreground">You have no expired subscriptions.</p>
                    )}
                </section>
            </div>
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. Your access for this subscription will be revoked immediately.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmCancel} variant="destructive">
                        Confirm Cancellation
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
