
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell, Clapperboard, LayoutGrid, ListTree } from "lucide-react";
import type { AdminView } from './admin-client';

interface ContentDashboardProps {
    setActiveView: (view: AdminView) => void;
}

export function ContentDashboard({ setActiveView }: ContentDashboardProps) {

    const managementItems = [
        {
            view: 'categories',
            title: 'Category Management',
            description: 'Add, edit, or delete parent categories.',
            icon: LayoutGrid
        },
        {
            view: 'sub-categories',
            title: 'Sub-category Management',
            description: 'Manage all sub-categories and their parents.',
            icon: ListTree
        },
        {
            view: 'platforms',
            title: 'Platform Management',
            description: 'Manage OTT platforms and internal channels.',
            icon: Clapperboard
        },
        {
            view: 'notifications',
            title: 'Notification Management',
            description: 'Send and manage user notifications.',
            icon: Bell
        },
    ] as const;

  return (
    <div>
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
                <p className="text-muted-foreground">Select a section to manage your app's content.</p>
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
