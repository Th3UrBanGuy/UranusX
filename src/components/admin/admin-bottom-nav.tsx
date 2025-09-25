
'use client';

import Link from 'next/link';
import { Home, PanelLeft, LayoutGrid, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { AdminView } from './admin-client';

interface AdminBottomNavProps {
    activeView: AdminView;
    setActiveView: (view: AdminView) => void;
}

export function AdminBottomNav({ activeView, setActiveView }: AdminBottomNavProps) {
  
  const navItems = [
    { view: 'dashboard', icon: Home, label: 'Dashboard' },
    { view: 'content', icon: LayoutGrid, label: 'Content' },
    { view: 'site-management', icon: Users, label: 'Site' },
  ] as const;

  const contentViews: AdminView[] = ['content', 'categories', 'sub-categories', 'platforms', 'platforms/ott', 'platforms/internal', 'notifications'];
  const siteViews: AdminView[] = ['site-management', 'user-management', 'analytics', 'subscription-management', 'license-management', 'admin-tools'];


  return (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center z-40">
        <TooltipProvider>
            <div className="flex items-center justify-around gap-2 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-full p-2 shadow-2xl shadow-black/40 w-full">
                {navItems.map((item) => {
                     const isActive = item.view === 'content' 
                        ? contentViews.includes(activeView)
                        : item.view === 'site-management'
                        ? siteViews.includes(activeView)
                        : activeView === item.view;
                    const Icon = item.icon;
                    return (
                        <Tooltip key={item.view}>
                            <TooltipTrigger asChild>
                                <button onClick={() => setActiveView(item.view)}>
                                    <div
                                    className={cn(
                                        "flex flex-col items-center justify-center h-12 w-12 rounded-full text-white transition-transform duration-300 hover:scale-110",
                                        isActive ? 'bg-purple-600' : 'bg-white/10'
                                    )}
                                    aria-label={item.label}
                                    >
                                    <Icon className="h-6 w-6" />
                                    </div>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{item.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </div>
        </TooltipProvider>
    </nav>
  );
}
