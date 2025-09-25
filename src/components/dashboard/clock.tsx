
'use client';

import { useState, useEffect } from 'react';

export function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client-side only
    setTime(new Date()); 
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatSeconds = (date: Date) => {
    return date.toLocaleTimeString([], { second: '2-digit' });
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 rounded-xl glass-card">
      {time ? (
        <>
          <div className="font-mono text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-foreground relative flex items-baseline">
            {formatTime(time)}
            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl ml-2 text-muted-foreground">{formatSeconds(time)}</span>
          </div>
          <div className="mt-2 sm:mt-4 text-sm sm:text-base text-muted-foreground">
            {formatDate(time)}
          </div>
        </>
      ) : (
        <>
          <div className="font-mono text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-foreground">
            --:--<span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl ml-2 text-muted-foreground">--</span>
          </div>
           <div className="mt-2 sm:mt-4 text-sm sm:text-base text-muted-foreground">
            Loading...
          </div>
        </>
      )}
    </div>
  );
}
