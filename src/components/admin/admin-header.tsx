
'use client';

import Link from 'next/link';
import { Home, PanelLeft, LayoutGrid, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import type { AdminView } from './admin-client';

interface AdminHeaderProps {
    activeView: AdminView;
    setActiveView: (view: AdminView) => void;
}

export function AdminHeader({ activeView, setActiveView }: AdminHeaderProps) {
  
  const navItems = [
    { view: 'dashboard', icon: Home, label: 'Dashboard' },
    { view: 'content', icon: LayoutGrid, label: 'Content Management' },
    { view: 'site-management', icon: Users, label: 'Site Management' },
  ] as const;

  const contentViews: AdminView[] = ['content', 'categories', 'sub-categories', 'platforms', 'notifications'];
  const siteViews: AdminView[] = ['site-management', 'user-management', 'analytics', 'subscription-management', 'license-management', 'admin-tools'];

  return (
    <nav className="hidden md:flex items-center gap-2 border-b-2 pb-2 mb-8">
        {navItems.map((item) => {
            const isActive = item.view === 'content' 
                ? contentViews.includes(activeView) 
                : item.view === 'site-management'
                ? siteViews.includes(activeView)
                : activeView === item.view;
            const Icon = item.icon;
            return (
                <Button 
                    key={item.view}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="justify-start gap-2"
                    onClick={() => setActiveView(item.view)}
                >
                    <Icon className="h-4 w-4" />
                    {item.label}
                </Button>
            )
        })}

        <div className="flex-grow" />

        <Button 
            asChild
            variant='ghost'
            className="justify-start gap-2"
        >
            <Link href="/dashboard">
                <PanelLeft className="h-4 w-4" />
                Back to App
            </Link>
        </Button>
    </nav>
  );
}
