
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Menu, Platform, Notification, LicenseKey, SubscriptionPlan } from '@/lib/data';

// This is now a server component, so we can fetch data directly.
async function getInitialData() {
    const menuPromise = getDocs(collection(db, "categories"));
    const platformsPromise = getDocs(collection(db, "platforms"));
    // Notifications are now fetched client-side for real-time updates
    const licenseKeysPromise = getDocs(collection(db, "licenseKeys"));
    const subscriptionPlansPromise = getDocs(collection(db, "subscriptionPlans"));

    const [
        menuSnapshot, 
        platformsSnapshot, 
        licenseKeysSnapshot, 
        subscriptionPlansSnapshot
    ] = await Promise.all([
        menuPromise,
        platformsPromise,
        licenseKeysPromise,
        subscriptionPlansPromise
    ]);

    const menuData = menuSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Menu));
    const platforms = platformsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Platform));
    const licenseKeys = licenseKeysSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Convert Timestamp to a serializable string
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        } as LicenseKey;
    });
    const subscriptionPlans = subscriptionPlansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));

    // We pass an empty notifications array, as it will be populated by the client listener
    return { menuData, platforms, notifications: [], licenseKeys, subscriptionPlans };
}

export default async function DashboardPage() {
  
  const { menuData, platforms, notifications, licenseKeys, subscriptionPlans } = await getInitialData();

  return (
    <>
      <div className="min-h-screen w-full md:p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        <main className="md:container md:mx-auto md:rounded-2xl md:glassmorphic p-4 sm:p-6 lg:p-8 pt-24 md:pt-6">
          <DashboardClient 
            initialMenuData={menuData}
            initialPlatforms={platforms}
            initialNotifications={notifications}
            initialLicenseKeys={licenseKeys}
            initialSubscriptionPlans={subscriptionPlans}
          />
        </main>
      </div>
    </>
  );
}
