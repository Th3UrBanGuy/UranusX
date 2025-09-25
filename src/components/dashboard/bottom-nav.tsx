
'use client';

import { useState } from 'react';
import { User, Play, X, Film, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Category, Menu } from '@/lib/data';
import { DynamicIcon } from '@/components/dynamic-icon';
import type { View } from '@/components/dashboard/dashboard-client';

interface BottomNavProps {
  activeView: View;
  setActiveView: (view: View) => void;
  menuData: Menu[];
}

export function BottomNav({ activeView, setActiveView, menuData = [] }: BottomNavProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleCategoryClick = (category: Category) => {
    setActiveView(category);
    setActiveMenu(null);
  };
  
  const toggleMenu = (menuId: string) => {
    if (activeMenu === menuId) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menuId);
    }
  }

  const menuVariants = {
    closed: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: { duration: 0.2, ease: "easeIn" }
    },
    open: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    },
  };

  const itemVariants = {
    closed: { opacity: 0, y: 10 },
    open: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
      },
    }),
  };
  
  const renderMenuContent = () => {
    if (!activeMenu) return null;

    const menu = menuData.find(m => m.id === activeMenu);
    if (!menu) return null;
      
    return (
        <motion.div
            key={menu.id}
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveMenu(null)}
        >
            <div className="bg-gray-800/90 backdrop-blur-lg border border-gray-600 rounded-2xl p-6 shadow-2xl m-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-bold text-lg">{menu.title}</h3>
                    <button onClick={() => setActiveMenu(null)} className="text-gray-400 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {menu.subCategories.length > 0 ? (
                    <div className="grid grid-cols-3 gap-6">
                        {menu.subCategories.map((subCategory, index) => {
                          return (
                            <motion.button
                              key={subCategory.name}
                              custom={index}
                              variants={itemVariants}
                              initial="closed"
                              animate="open"
                              exit="closed"
                              onClick={() => handleCategoryClick(subCategory.name)}
                              className="flex flex-col items-center justify-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white"
                              aria-label={subCategory.name}
                            >
                              <div className={cn(
                                "flex items-center justify-center h-16 w-16 rounded-full bg-gray-700/50 transition-colors",
                                activeView === subCategory.name ? 'bg-purple-600 text-white' : ''
                              )}>
                                <DynamicIcon iconString={subCategory.icon} className="h-8 w-8" />
                              </div>
                              <span className="text-xs text-center font-medium">{subCategory.name}</span>
                            </motion.button>
                          );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 min-h-[10vh]">
                        <Film className="w-12 h-12 mb-4 text-accent" />
                        <h2 className="text-xl font-bold text-foreground mb-2">Coming Soon!</h2>
                        <p className="text-sm">Content for this category will be available shortly.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center z-40">
        <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-full p-2 shadow-2xl shadow-black/40 w-auto">
          
          {menuData.map(menu => {
            return (
              <button
                key={menu.id}
                onClick={() => toggleMenu(menu.id)}
                className={cn("flex flex-col items-center justify-center h-14 w-14 rounded-full text-white transition-transform duration-300 hover:scale-110",
                  activeMenu === menu.id ? 'bg-purple-600' : 'bg-white/10'
                )}
                aria-label={`Open ${menu.title} Menu`}
              >
                <DynamicIcon iconString={menu.icon} className="h-7 w-7" />
              </button>
            )
          })}
          
          <button
            onClick={() => setActiveView('user-panel')}
            className={cn(
              "flex flex-col items-center justify-center h-14 w-14 rounded-full text-white transition-transform duration-300 hover:scale-110",
              activeView === 'user-panel' ? 'bg-purple-600' : 'bg-white/10'
            )}
            aria-label="Open User Panel"
          >
            <User className="h-7 w-7" />
          </button>

        </div>
      </nav>

      <AnimatePresence>
        {activeMenu && renderMenuContent()}
      </AnimatePresence>
    </>
  );
}
