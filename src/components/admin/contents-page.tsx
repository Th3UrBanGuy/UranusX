'use client';

import Link from 'next/link';
import { Home, Clapperboard, ListTree, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import type { AdminView } from './admin-client';

interface AdminSidenavProps {
    activeView: AdminView;
    setActiveView: (view: AdminView) => void;
}

export function AdminSidenav({ activeView, setActiveView }: AdminSidenavProps) {
  
  const navItems = [
    { view: 'dashboard', icon: Home, label: 'Dashboard' },
    { view: 'platforms', icon: Clapperboard, label: 'Platforms' },
    { view: 'sub-categories', icon: ListTree, label: 'Sub-categories' },
  ] as const;

  return (
    <nav className="hidden md:flex flex-col gap-2 min-w-[200px]">
        {navItems.map((item) => {
            const isActive = activeView.startsWith(item.view) && (item.view !== 'platforms' || activeView === 'platforms');
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

        <hr className="my-4" />

        <Button 
            asChild
            variant='ghost'
            className="justify-start gap-2"
        >
            <Link href="/">
                <PanelLeft className="h-4 w-4" />
                Back to App
            </Link>
        </Button>
    </nav>
  );
}