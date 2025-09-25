
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart as BarChartIcon, Users, Activity, DollarSign, Loader2, KeyRound, Clapperboard, PieChart } from 'lucide-react';
import { Bar, XAxis, YAxis, ResponsiveContainer, BarChart, Pie, Cell } from "recharts"
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import type { User, SubscriptionPlan, LicenseKey, LicenseKeyClaim, Platform } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format, subMonths, getMonth, getYear } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from './back-button';
import type { AdminView } from './admin-client';

interface AnalyticsPageProps {
    setActiveView: (view: AdminView) => void;
}

interface ClaimWithDetails extends LicenseKeyClaim {
    planName: string;
    price: number;
    user: User;
    key: string;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];


export function AnalyticsPage({ setActiveView }: AnalyticsPageProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loadingStates, setLoadingStates] = useState({
        users: true,
        plans: true,
        keys: true,
        platforms: true,
    });

    useEffect(() => {
        const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
            setLoadingStates(prev => ({...prev, users: false}));
        });
        const unsubPlans = onSnapshot(collection(db, 'subscriptionPlans'), (snapshot) => {
            setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan)));
            setLoadingStates(prev => ({...prev, plans: false}));
        });
        const unsubKeys = onSnapshot(collection(db, 'licenseKeys'), (snapshot) => {
            setKeys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LicenseKey)));
            setLoadingStates(prev => ({...prev, keys: false}));
        });
        const unsubPlatforms = onSnapshot(collection(db, 'platforms'), (snapshot) => {
            setPlatforms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Platform)));
            setLoadingStates(prev => ({...prev, platforms: false}));
        });

        return () => {
            unsubUsers();
            unsubPlans();
            unsubKeys();
            unsubPlatforms();
        };
    }, []);

    const totalRevenue = useMemo(() => {
        return keys.reduce((acc, key) => {
            const plan = plans.find(p => p.id === key.planId);
            if (!plan || plan.price === 0) return acc;
            return acc + (key.claims.length * plan.price);
        }, 0);
    }, [keys, plans]);

    const activeSubscriptionsCount = useMemo(() => {
        return users.reduce((acc, user) => {
            const activeCount = user.subscriptions.filter(s => s.status === 'Active' && new Date(s.endDate) > new Date()).length;
            return acc + activeCount;
        }, 0);
    }, [users]);
    
    const overviewData = useMemo(() => {
        const monthlyRevenue = Array(6).fill(0).map((_, i) => {
            const d = subMonths(new Date(), i);
            return { month: getMonth(d), year: getYear(d), revenue: 0 };
        }).reverse();

        keys.forEach(key => {
            const plan = plans.find(p => p.id === key.planId);
            if (!plan || plan.price === 0) return;

            key.claims.forEach(claim => {
                const claimDate = new Date(claim.timestamp);
                const claimMonth = getMonth(claimDate);
                const claimYear = getYear(claimDate);
                const monthData = monthlyRevenue.find(m => m.month === claimMonth && m.year === claimYear);
                if (monthData) {
                    monthData.revenue += plan.price;
                }
            });
        });

        return monthlyRevenue.map(m => ({
            name: format(new Date(m.year, m.month), 'MMM'),
            revenue: m.revenue
        }));
    }, [keys, plans]);

    const recentClaims = useMemo(() => {
        const allClaims: ClaimWithDetails[] = [];
        keys.forEach(key => {
            const plan = plans.find(p => p.id === key.planId);
            if (!plan) return;
            key.claims.forEach(claim => {
                const user = users.find(u => u.id === claim.userId);
                if (!user) return;
                allClaims.push({
                    ...claim,
                    planName: plan.name,
                    price: plan.price,
                    user: user,
                    key: key.key,
                });
            });
        });
        return allClaims.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    }, [keys, plans, users]);

    const subscriptionsByPlan = useMemo(() => {
        const planCounts: {[planName: string]: number} = {};
        users.forEach(user => {
            user.subscriptions.forEach(sub => {
                if (sub.status === 'Active' && new Date(sub.endDate) > new Date()) {
                    const plan = plans.find(p => p.id === sub.planId);
                    if (plan) {
                        planCounts[plan.name] = (planCounts[plan.name] || 0) + 1;
                    }
                }
            });
        });
        return Object.entries(planCounts).map(([name, value]) => ({ name, value }));
    }, [users, plans]);
    
    const planChartConfig = useMemo(() => {
        const config: ChartConfig = {};
        subscriptionsByPlan.forEach((plan, index) => {
            config[plan.name] = {
                label: plan.name,
                color: COLORS[index % COLORS.length]
            }
        })
        return config;
    }, [subscriptionsByPlan]);

    const kpiData = [
        { title: 'Total Revenue', icon: DollarSign, value: `$${totalRevenue.toFixed(2)}`, description: 'Based on all license claims', loading: loadingStates.keys || loadingStates.plans },
        { title: 'Active Subscriptions', icon: Activity, value: `+${activeSubscriptionsCount}`, description: 'Currently active user plans', loading: loadingStates.users },
        { title: 'Total Users', icon: Users, value: users.length, description: 'Total registered accounts', loading: loadingStates.users },
        { title: 'Total Platforms', icon: Clapperboard, value: platforms.length, description: 'Live channels & services', loading: loadingStates.platforms },
        { title: 'License Keys', icon: KeyRound, value: keys.length, description: 'Total keys generated', loading: loadingStates.keys },
    ]

  return (
    <div>
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="md:hidden">
                    <BackButton onClick={() => setActiveView('site-management')} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">An overview of your application's performance.</p>
                </div>
            </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {kpiData.map((kpi, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {kpi.loading ? (
                           <>
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-3/4 mt-2" />
                           </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{kpi.value}</div>
                                <p className="text-xs text-muted-foreground">{kpi.description}</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-5 mt-6">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Monthly subscription revenue from claimed keys.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] w-full p-0">
                   {loadingStates.keys || loadingStates.plans ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                   ) : (
                       <ChartContainer config={chartConfig} className="w-full h-full">
                            <BarChart data={overviewData} accessibilityLayer>
                                <XAxis
                                    dataKey="name"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <ChartTooltip 
                                    content={<ChartTooltipContent />}
                                    cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
                                />
                                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                   )}
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Subscriptions by Plan</CardTitle>
                    <CardDescription>Distribution of active subscriptions.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] w-full p-0">
                     {loadingStates.users || loadingStates.plans ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : subscriptionsByPlan.length > 0 ? (
                        <ChartContainer config={planChartConfig} className="w-full h-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="value" />} />
                                <Pie
                                    data={subscriptionsByPlan}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                        return (
                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold fill-white">
                                            {`${(percent * 100).toFixed(0)}%`}
                                        </text>
                                        );
                                    }}
                                    outerRadius={120}
                                    dataKey="value"
                                >
                                    {subscriptionsByPlan.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                     ) : (
                         <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            No active subscriptions to display.
                        </div>
                     )}
                </CardContent>
            </Card>
             <Card className="lg:col-span-5">
                <CardHeader>
                    <CardTitle>Recent Claims</CardTitle>
                    <CardDescription>The last 5 license keys claimed by users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingStates.keys || loadingStates.plans || loadingStates.users ? (
                         Array.from({length: 5}).map((_, i) => (
                             <div className="flex items-center gap-4" key={i}>
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div className="grid gap-1 w-full">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-5 w-1/4" />
                            </div>
                         ))
                    ) : recentClaims.length > 0 ? recentClaims.map((claim) => (
                        <div className="flex items-center gap-4" key={claim.timestamp}>
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={claim.user.avatarUrl} alt="Avatar" />
                                <AvatarFallback>{claim.user.firstName.charAt(0)}{claim.user.lastName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1">
                                <p className="text-sm font-medium leading-none">{claim.user.firstName} {claim.user.lastName}</p>
                                <p className="text-sm text-muted-foreground">{claim.user.email}</p>
                            </div>
                            <div className="ml-auto font-medium text-right">
                                +${claim.price.toFixed(2)}
                                <p className="text-xs text-muted-foreground font-normal">{claim.planName}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No recent claims.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
