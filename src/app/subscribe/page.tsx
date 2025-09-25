
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { SubscriptionPlan } from '@/lib/data';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const PlanSkeleton = () => (
    <Card className="glassmorphic flex flex-col border-transparent shadow-lg w-full max-w-sm">
        <CardHeader className="items-center text-center">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent className="flex-grow space-y-6 text-center">
            <Skeleton className="h-12 w-1/2 mx-auto" />
            <div className="space-y-3">
                <Skeleton className="h-5 w-5/6 mx-auto" />
                <Skeleton className="h-5 w-4/6 mx-auto" />
                <Skeleton className="h-5 w-5/6 mx-auto" />
            </div>
        </CardContent>
        <CardFooter>
            <Skeleton className="h-12 w-full" />
        </CardFooter>
    </Card>
);

export default function SubscribePage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const plansUnsub = onSnapshot(collection(db, 'subscriptionPlans'), (snapshot) => {
        setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan)));
        setIsLoading(false);
    });

    return () => plansUnsub();
  }, []);

  const getPlanPrice = (plan: SubscriptionPlan) => {
      const price = isYearly ? plan.price * 12 * 0.8 : plan.price;
      return price.toFixed(2);
  }
  
  // A simple way to highlight one plan, e.g., the second one.
  const isPopular = (index: number) => plans.length > 1 && index === 1;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-8">
       <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>
      <div className="flex flex-col items-center gap-8 w-full max-w-5xl">
        <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Choose Your Perfect Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Unlock unparalleled access to our entire library of content. Cancel anytime.
            </p>
        </div>

        <div className="flex items-center space-x-4">
            <Label htmlFor="billing-cycle" className="font-medium">Monthly</Label>
            <Switch id="billing-cycle" checked={isYearly} onCheckedChange={setIsYearly} />
            <Label htmlFor="billing-cycle" className="font-medium">Annually</Label>
            <Badge variant="secondary" className="animate-pulse">Save 20%</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full items-start justify-center">
            {isLoading ? (
                <>
                    <PlanSkeleton />
                    <PlanSkeleton />
                    <PlanSkeleton />
                </>
            ) : plans.map((plan, index) => (
                <Card 
                    key={plan.id} 
                    className={cn(
                        "glassmorphic flex flex-col shadow-lg transition-all duration-300 w-full max-w-sm mx-auto lg:max-w-none",
                        isPopular(index) ? "border-primary shadow-primary/20 scale-105" : "border-transparent"
                    )}
                >
                    {isPopular(index) && (
                         <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                    )}
                    <CardHeader className="items-center text-center">
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <CardDescription className="text-base min-h-[48px]">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-6 text-center">
                        <div className="text-5xl font-bold tracking-tighter">
                            ${getPlanPrice(plan)}
                            <span className="text-lg font-normal text-muted-foreground">/{isYearly ? 'yr' : 'mo'}</span>
                        </div>
                         <ul className="space-y-3 text-sm text-muted-foreground text-left">
                            {plan.accessibleCategories.map(catId => {
                                return (
                                <li key={catId} className="flex items-center gap-3">
                                    <Check className="h-5 w-5 text-primary" />
                                    <span className="flex-1">Full access to <span className="font-semibold text-foreground">{catId}</span></span>
                                </li>
                                )
                            })}
                            {plan.accessibleSubCategories.map(subCatName => (
                                <li key={subCatName} className="flex items-center gap-3">
                                    <Check className="h-5 w-5 text-primary" />
                                    <span className="flex-1">Access to <span className="font-semibold text-foreground">{subCatName}</span> channels</span>
                                </li>
                            ))}
                              <li className="flex items-center gap-3">
                                    <Check className="h-5 w-5 text-primary" />
                                    <span>HD and 4K streaming</span>
                                </li>
                                 <li className="flex items-center gap-3">
                                    <Check className="h-5 w-5 text-primary" />
                                    <span>Cancel anytime</span>
                                </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className={cn("w-full text-lg py-6", !isPopular(index) && "bg-primary/80 hover:bg-primary")}
                            variant={isPopular(index) ? "default" : "secondary"}
                        >
                            Choose Plan
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
         <div className="text-center text-sm text-muted-foreground/50 pt-8">
            <Button variant="link" asChild>
                <Link href="/dashboard">
                    Maybe later, take me back to the dashboard
                </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
