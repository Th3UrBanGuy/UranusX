
'use client';

import { AdminBottomNav } from './admin-bottom-nav';
import { AdminDashboard } from './admin-dashboard';
import { PlatformsPage } from './platforms-page';
import { SubCategoriesPage } from './sub-categories-page';
import { CategoriesPage } from './categories-page';
import { NotificationsPage } from './notifications-page';
import { ContentDashboard } from './content-dashboard';
import { SiteManagementDashboard } from './site-management-dashboard';
import { UserManagementPage } from './user-management-page';
import { AnalyticsPage } from './analytics-page';
import { SubscriptionManagementPage } from './subscription-management';
import { LicenseManagementPage } from './license-management-page';
import { AdminToolsPage } from './admin-tools-page';

export type AdminView = 
    | 'dashboard'
    | 'content'
    | 'categories'
    | 'platforms' 
    | 'sub-categories'
    | 'notifications'
    | 'site-management'
    | 'user-management'
    | 'analytics'
    | 'subscription-management'
    | 'license-management'
    | 'admin-tools';

interface AdminClientProps {
    activeView: AdminView;
    setActiveView: (view: AdminView) => void;
    onEditProfile: () => void;
    onLogout: () => void;
}

export function AdminClient({ activeView, setActiveView, onEditProfile, onLogout }: AdminClientProps) {

  const renderContent = () => {
    switch (activeView) {
        case 'dashboard':
            return <AdminDashboard onEditProfile={onEditProfile} onLogout={onLogout} />;
        case 'content':
            return <ContentDashboard setActiveView={setActiveView} />;
        case 'categories':
            return <CategoriesPage setActiveView={setActiveView} />;
        case 'platforms':
            return <PlatformsPage setActiveView={setActiveView} />;
        case 'sub-categories':
            return <SubCategoriesPage setActiveView={setActiveView} />;
        case 'notifications':
            return <NotificationsPage setActiveView={setActiveView} />;
        case 'site-management':
            return <SiteManagementDashboard setActiveView={setActiveView} />;
        case 'user-management':
            return <UserManagementPage setActiveView={setActiveView} />;
        case 'analytics':
            return <AnalyticsPage setActiveView={setActiveView} />;
        case 'subscription-management':
            return <SubscriptionManagementPage setActiveView={setActiveView} />;
        case 'license-management':
            return <LicenseManagementPage setActiveView={setActiveView} />;
        case 'admin-tools':
            return <AdminToolsPage setActiveView={setActiveView} />;
        default:
            return <AdminDashboard onEditProfile={onEditProfile} onLogout={onLogout} />;
    }
  };

  return (
    <div className="flex gap-8">
        <div className="flex-1">
             {renderContent()}
        </div>
        <AdminBottomNav activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}
