
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { BackButton } from './back-button';
import type { AdminView } from './admin-client';

interface AdminSignupSettings {
  enabled: boolean;
  path: string;
}

interface AdminToolsPageProps {
    setActiveView: (view: AdminView) => void;
}

export function AdminToolsPage({ setActiveView }: AdminToolsPageProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSignupSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'adminSignup');
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as AdminSignupSettings);
      } else {
        // If settings don't exist, create them with default values
        const defaultSettings = { enabled: false, path: 'xyz/admin' };
        setDoc(settingsRef, defaultSettings);
        setSettings(defaultSettings);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    const settingsRef = doc(db, 'settings', 'adminSignup');
    try {
      await setDoc(settingsRef, settings, { merge: true });
      toast({
        title: 'Settings Saved',
        description: 'Your changes to the admin tools have been saved.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Saving Settings',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-8">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
            <BackButton onClick={() => setActiveView('site-management')} />
        </div>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Tools</h1>
            <p className="text-muted-foreground">Manage admin-specific settings and tools.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Signup Route</CardTitle>
          <CardDescription>
            Control the secret route for creating new administrator accounts. Use a complex, unpredictable path to prevent unauthorized access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="signup-enabled" className="text-base">
                Enable Admin Signup Page
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, the secret page for creating admins will be accessible.
              </p>
            </div>
            <Switch
              id="signup-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-path">Signup Page Path</Label>
            <div className="flex items-center">
              <span className="p-2 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">
                your-domain.com/
              </span>
              <Input
                id="signup-path"
                value={settings.path}
                onChange={(e) => setSettings({ ...settings, path: e.target.value })}
                className="rounded-l-none"
                disabled={!settings.enabled || isSaving}
              />
            </div>
             <p className="text-xs text-muted-foreground pl-1">
                Do not include a leading slash. Example: `secret-admin-creation-route`
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
