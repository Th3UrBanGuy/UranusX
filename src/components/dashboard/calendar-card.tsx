
'use client';

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import React, { useState, useEffect } from "react";
import { Skeleton } from '@/components/ui/skeleton';

export function CalendarCard() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setDate(new Date());
  }, []);

  return (
     <Card className="h-full w-full glass-card rounded-xl overflow-hidden">
        <CardContent className="p-0 flex items-center justify-center">
          {isClient ? (
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-2 sm:p-4"
                classNames={{
                    root: 'w-full',
                    months: "w-full",
                    month: "w-full space-y-2 sm:space-y-4",
                    caption: "flex justify-center pt-1 relative items-center text-sm sm:text-base",
                    head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.7rem] sm:text-[0.8rem]",
                    row: "flex w-full mt-1 sm:mt-2",
                    cell: "w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 rounded-full text-xs sm:text-sm",
                    day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground rounded-full",
                    day_outside:
                    "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
                    day_disabled: "text-muted-foreground opacity-50",
                }}
            />
          ) : (
             <div className="p-4 w-full h-[360px] flex items-center justify-center">
                <Skeleton className="w-full h-full" />
             </div>
          )}
        </CardContent>
     </Card>
  );
}
