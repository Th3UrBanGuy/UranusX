
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface DynamicIconProps {
  iconString: string;
  className?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ iconString, className }) => {
  // Return null or a default icon if iconString is not valid
  if (!iconString || typeof iconString !== 'string') {
    return <div className={cn("w-full h-full bg-muted rounded-md", className)} />;
  }

  const trimmedIconString = iconString.trim();

  // 1. Check for Lordicon
  if (trimmedIconString.startsWith('<lord-icon')) {
    return (
      <div 
        className={cn("flex items-center justify-center", className)}
        dangerouslySetInnerHTML={{ __html: trimmedIconString }} 
      />
    );
  }

  // Fallback if no match or string is just text
  return <div className={cn("w-full h-full bg-muted rounded-md", className)} />;
};
