
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BarChart, CreditCard, KeyRound, Wrench } from "lucide-react";
import type { AdminView } from './admin-client';

interface SiteManagementDashboardProps {
    setActiveView: (view: AdminView) => void;
}

export function SiteManagementDashboard({ setActiveView }: SiteManagementDashboardProps) {

    const managementItems = [
        {
            view: 'user-management',
            title: 'User Management',
            description: 'Add, edit, and manage all registered users.',
            icon: Users
        },
        {
            view: 'subscription-management',
            title: 'Subscription Plans',
            description: 'Create and manage subscription plans.',
            icon: CreditCard
        },
        {
            view: 'license-management',
            title: 'License Keys',
            description: 'Generate and manage license keys for subscriptions.',
            icon: KeyRound
        },
        {
            view: 'admin-tools',
            title: 'Admin Tools',
            description: 'Manage admin-specific settings and tools.',
            icon: Wrench
        },
        {
            view: 'analytics',
            title: 'Analytics',
            description: 'View user activity and site metrics.',
            icon: BarChart
        },
    ] as const;

  return (
    <div>
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Site Management</h1>
                <p className="text-muted-foreground">Manage site-wide settings and users.</p>
            </div>
        </div>
      <div className="grid gap-6 md:grid-cols-2">
        {managementItems.map((item) => {
            const Icon = item.icon;
            return (
                <Card key={item.view}>
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="mb-4">{item.description}</CardDescription>
                         <Button onClick={() => setActiveView(item.view)} variant="outline">
                            Manage <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            )
        })}
      </div>
    </div>
  );
}
