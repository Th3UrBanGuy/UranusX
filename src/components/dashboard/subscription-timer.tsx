
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SubscriptionTimerProps { 
    endDate: string;
    onTimerEnd: () => void;
    isCompact?: boolean;
}

export const SubscriptionTimer = ({ endDate, onTimerEnd, isCompact = false }: SubscriptionTimerProps) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(endDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft as { days: number, hours: number, minutes: number, seconds: number };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            if (Object.keys(newTimeLeft).length === 0) {
                onTimerEnd();
            }
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents: (keyof typeof timeLeft)[] = ['days', 'hours', 'minutes', 'seconds'];
    
    if (Object.keys(timeLeft).length === 0) {
        return <div className={cn("font-semibold text-destructive", isCompact ? "text-sm" : "text-lg")}>Expired</div>;
    }

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {timerComponents.map(interval => (
                <div key={interval} className="flex flex-col items-center">
                    <span className={cn("font-bold text-foreground tabular-nums", isCompact ? "text-base" : "text-xl")}>
                        {String(timeLeft[interval]).padStart(2, '0')}
                    </span>
                    <span className="text-xs">{interval.charAt(0)}</span>
                </div>
            ))}
        </div>
    );
};
