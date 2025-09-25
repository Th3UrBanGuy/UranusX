'use client';
import { useState } from 'react';
import { AdminClient } from '@/components/admin/admin-client';
import { AdminHeader } from '@/components/admin/admin-header';
import type { AdminView } from '@/components/admin/admin-client';

interface AdminPageProps {
    onEditProfile: () => void;
    onLogout: () => void;
}

export default function AdminPage({ onEditProfile, onLogout }: AdminPageProps) {
    const [activeView, setActiveView] = useState<AdminView>('dashboard');

    return (
        <>
            <AdminHeader activeView={activeView} setActiveView={setActiveView} />
            <AdminClient
                activeView={activeView}
                setActiveView={setActiveView}
                onEditProfile={onEditProfile}
                onLogout={onLogout}
            />
        </>
    );
}
