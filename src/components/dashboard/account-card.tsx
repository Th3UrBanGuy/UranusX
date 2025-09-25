
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, KeyRound } from "lucide-react";

interface AccountCardProps {
    onEditProfile: () => void;
    onLogout: () => void;
    onNavigateToLicense: () => void;
    hasSubscription?: boolean;
    isAdmin?: boolean;
}

export function AccountCard({ onEditProfile, onLogout, onNavigateToLicense, hasSubscription, isAdmin = false }: AccountCardProps) {
  return (
    <Card className="w-full h-full glass-card rounded-xl">
        <CardHeader>
            <CardTitle>Account Center</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
            <Button variant="outline" onClick={onEditProfile} className="justify-start text-base py-6">
                <User className="mr-4 h-5 w-5" />
                Edit Profile
            </Button>
            {!isAdmin && (
                <Button variant="outline" onClick={onNavigateToLicense} className="justify-start text-base py-6">
                    <KeyRound className="mr-4 h-5 w-5" />
                    License Center
                </Button>
            )}
            <Button variant="outline" onClick={onLogout} className="justify-start text-base py-6">
                <LogOut className="mr-4 h-5 w-5" />
                Logout
            </Button>
        </CardContent>
    </Card>
  );
}
