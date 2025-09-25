
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { LogOut, Edit, Timer, CalendarClock, ShieldCheck, KeyRound } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { User, UserSubscription, SubscriptionPlan } from '@/lib/data';
import { format } from 'date-fns';

interface UserCardProps {
    user: User;
    subscriptionPlans: SubscriptionPlan[];
    onUserUpdate: (user: User) => void;
    onNavigateToLicense: () => void;
}

const SubscriptionTimer = ({ endDate, onTimerEnd }: { endDate: string, onTimerEnd: () => void }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(endDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft as { days: number, hours: number, minutes: number, seconds: number };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            if (Object.keys(newTimeLeft).length === 0) {
                onTimerEnd();
            }
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents: (keyof typeof timeLeft)[] = ['days', 'hours', 'minutes', 'seconds'];
    
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {Object.keys(timeLeft).length > 0 ? (
                timerComponents.map(interval => (
                    <div key={interval} className="flex flex-col items-center">
                        <span className="text-xl font-bold text-foreground tabular-nums">
                            {String(timeLeft[interval]).padStart(2, '0')}
                        </span>
                        <span className="text-xs">{interval.charAt(0)}</span>
                    </div>
                ))
            ) : (
                <div className="text-lg font-semibold text-destructive">Expired</div>
            )}
        </div>
    );
};

const SubscriptionDetails = ({ subscription, onUserUpdate }: { subscription: UserSubscription, onUserUpdate: any }) => { // onUserUpdate is a function that accepts a function
    if (subscription.status !== 'Active' || !subscription.endDate || new Date(subscription.endDate) <= new Date()) {
        return null;
    }

    const endDate = new Date(subscription.endDate);
    
    const handleTimerEnd = () => {
      onUserUpdate((prevUser: User) => {
        const newSubscriptions = prevUser.subscriptions.map(sub => 
          sub.planId === subscription.planId && sub.endDate === subscription.endDate 
          ? {...sub, status: 'Inactive'} 
          : sub
        );
        return {
          ...prevUser,
          subscriptions: newSubscriptions
        };
      });
    };

    return (
        <div className="p-4 rounded-lg border bg-background/50 mx-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        <span>Time Left</span>
                    </div>
                    <SubscriptionTimer endDate={subscription.endDate} onTimerEnd={handleTimerEnd} />
                </div>
                <div className="w-full sm:w-px h-px sm:h-12 bg-border"></div>
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                         <CalendarClock className="h-4 w-4" />
                        <span>Expires On</span>
                    </div>
                    <div className="text-base font-semibold text-foreground">
                        {format(endDate, "MMM dd, yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {format(endDate, "h:mm a")}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function UserCard({ user, subscriptionPlans, onUserUpdate, onNavigateToLicense }: UserCardProps) {
  
  const activeSubscriptions = useMemo(() => 
    user.subscriptions.filter(s => s.status === 'Active' && new Date(s.endDate) > new Date()),
    [user.subscriptions]
  );

  const hasActiveSubscription = activeSubscriptions.length > 0;

  const latestSubscription = useMemo(() => {
    if (!hasActiveSubscription) return null;
    return activeSubscriptions.reduce((latest, current) => {
        return new Date(latest.endDate) > new Date(current.endDate) ? latest : current;
    });
  }, [activeSubscriptions, hasActiveSubscription]);

  const planNames = useMemo(() => {
    const planIds = new Set(activeSubscriptions.map(s => s.planId));
    return Array.from(planIds).map(id => subscriptionPlans.find(p => p.id === id)?.name).filter(Boolean).join(', ');
  }, [activeSubscriptions, subscriptionPlans]);


  return (
    <Card className="w-full glass-card rounded-xl">
        <CardHeader className="relative flex flex-col items-center gap-4 p-4 text-center md:flex-row md:items-start md:text-left md:p-6">
            <Avatar className="h-20 w-20 md:h-16 md:w-16">
                <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <CardTitle className="text-xl md:text-2xl">{user.firstName} {user.lastName}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
                 <div className="mt-2 flex items-center justify-center md:justify-start gap-x-4 gap-y-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Subscription:</span>
                        <Badge variant={hasActiveSubscription ? 'default' : 'secondary'}>
                            {hasActiveSubscription ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                    {hasActiveSubscription && (
                         <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <span className="text-sm text-muted-foreground">{planNames}</span>
                         </div>
                    )}
                </div>
            </div>
            {hasActiveSubscription && (
                 <Button onClick={onNavigateToLicense} variant="outline" size="sm" className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    <span>Manage Licenses</span>
                </Button>
            )}
        </CardHeader>
        {latestSubscription && (
             <SubscriptionDetails subscription={latestSubscription} onUserUpdate={onUserUpdate} />
        )}
    </Card>
  );
}
