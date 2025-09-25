
'use-client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hourglass, Rocket } from 'lucide-react';
import Link from 'next/link';

const TRIAL_DURATION_MINUTES = 15;

interface TestDriveCardProps {
    onTestDriveStart: () => void;
}

export function TestDriveCard({ onTestDriveStart }: TestDriveCardProps) {

    return (
        <Card className="w-full glass-card rounded-xl border-accent/50 shadow-lg shadow-accent/10">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Rocket className="h-8 w-8 text-accent" />
                    <div>
                        <CardTitle className="text-xl">Take a Test Drive!</CardTitle>
                        <CardDescription>Get a free {TRIAL_DURATION_MINUTES}-minute premium pass to check out our content.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardFooter>
                <Button onClick={onTestDriveStart} className="w-full">
                    Start Test Drive
                </Button>
            </CardFooter>
        </Card>
    );
}

    
