import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { View } from "@/components/dashboard/dashboard-client";
import { Category, Menu } from "@/lib/data";
import { User, ChevronDown, KeyRound } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { DynamicIcon } from '@/components/dynamic-icon';
import Image from 'next/image';

interface HeaderProps {
    activeView: View;
    setActiveView: (view: View) => void;
    menuData: Menu[];
}

export function Header({ activeView, setActiveView, menuData = [] }: HeaderProps) {

  const renderDropdown = (
    menu: Menu,
    currentActiveView: View
  ) => {
    const isActive = menu.subCategories.some(sc => sc.name === currentActiveView);
    return (
      <DropdownMenu key={menu.id}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 justify-center gap-2 text-foreground/80 hover:bg-accent/10 hover:text-foreground",
              isActive && "bg-accent/20 text-foreground"
            )}
          >
            <span>{menu.title}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-popover/80 backdrop-blur-md border-border text-popover-foreground">
          {menu.subCategories.map((subCategory) => {
            return (
              <DropdownMenuItem
                key={subCategory.name}
                onClick={() => setActiveView(subCategory.name)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer focus:bg-accent focus:text-accent-foreground",
                  activeView === subCategory.name && "bg-accent/80"
                )}
              >
                <DynamicIcon iconString={subCategory.icon} className="h-4 w-4" />
                <span>{subCategory.name}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex flex-col gap-4 bg-background/30 backdrop-blur-sm border border-foreground/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2">
              <Image src="https://lh3.googleusercontent.com/pw/AP1GczNoCQo-qU0lfWyTQT1EqIhZofXYFZo1x-kSKbfhgqEXJu45jEtH3p2J3Nb3DrgRVrwXTGn3dRbhpLASHYYlfwMkV3OpuCwabpGuvpwvFkBCyvtAVBir0CV8VroEGIJNHwWK7agWTVMhvBmg3TIr4iM=w40-h40-s-no-gm?authuser=0" alt="UranusX Logo" width={40} height={40} className="h-7 w-7" />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                UranusX
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Your personalized streaming dashboard.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-foreground/10 pt-4">
            {menuData.map(menu => renderDropdown(menu, activeView))}
            <Button
                variant="ghost"
                onClick={() => setActiveView('license-panel')}
                className={cn(
                    "flex-1 justify-center gap-2 text-foreground/80 hover:bg-accent/10 hover:text-foreground",
                    activeView === 'license-panel' && "bg-accent/20 text-foreground"
                )}
            >
                <KeyRound className="h-4 w-4" />
                <span>License Center</span>
            </Button>
             <Button
                variant="ghost"
                onClick={() => setActiveView('user-panel')}
                className={cn(
                    "flex-1 justify-center gap-2 text-foreground/80 hover:bg-accent/10 hover:text-foreground",
                    activeView === 'user-panel' && "bg-accent/20 text-foreground"
                )}
            >
                <User className="h-4 w-4" />
                <span>User Panel</span>
            </Button>
        </div>
      </header>
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-4 left-4 right-4 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
            <Image src="https://lh3.googleusercontent.com/pw/AP1GczNoCQo-qU0lfWyTQT1EqIhZofXYFZo1x-kSKbfhgqEXJu45jEtH3p2J3Nb3DrgRVrwXTGn3dRbhpLASHYYlfwMkV3OpuCwabpGuvpwvFkBCyvtAVBir0CV8VroEGIJNHwWK7agWTVMhvBmg3TIr4iM=w32-h32-s-no-gm?authuser=0" alt="UranusX Logo" width={32} height={32} />
            <div>
              <h2 className="font-bold text-white">UranusX</h2>
              <p className="text-xs text-gray-400">Your Universe of Entertainment</p>
            </div>
        </div>
        <ThemeSwitcher />
      </div>
    </>
  );
}
