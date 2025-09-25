

'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from "@/components/dashboard/header";
import { PlatformGrid } from "@/components/dashboard/platform-grid";
import { Clock } from "@/components/dashboard/clock";
import { CalendarCard } from "@/components/dashboard/calendar-card";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { Bell, Film, Lock, Loader2, Check, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Platform, Category, Menu, User, LicenseKey, UserSubscription, Notification, SubscriptionPlan } from "@/lib/data";
import { PlatformDetailDialog } from './platform-detail-dialog';
import { VideoPlayer } from '@/components/video-player';
import { formatDistanceToNow } from 'date-fns';
import { UserCard } from './user-card';
import { EditProfileDialog } from './edit-profile-dialog';
import { LogoutConfirmationDialog } from './logout-confirmation-dialog';
import { useRouter } from 'next/navigation';
import { AccountCard } from './account-card';
import { ClaimLicenseDialog } from './claim-license-dialog';
import { useToast } from '@/hooks/use-toast';
import { LicensePage } from './license-page';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, orderBy, where, getDocs, arrayUnion } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { SearchAndSort, SortOption } from './search-and-sort';


export type View = 'user-panel' | 'license-panel' | Category;

function SubscriptionRequired() {
    return (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[50vh] glass-card rounded-xl">
            <Lock className="w-16 h-16 mb-4 text-accent" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Subscription Required</h2>
            <p className="mb-6">You need an active subscription to access this content.</p>
            <Button asChild>
                <Link href="/subscribe">View Subscription Plans</Link>
            </Button>
        </div>
    );
}

interface DashboardClientProps {
  initialMenuData: Menu[];
  initialPlatforms: Platform[];
  initialNotifications: Notification[];
  initialLicenseKeys: LicenseKey[];
  initialSubscriptionPlans: SubscriptionPlan[];
}


export function DashboardClient({
    initialMenuData,
    initialPlatforms,
    initialLicenseKeys,
    initialSubscriptionPlans
}: DashboardClientProps) {
  const { toast } = useToast();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [activeView, setActiveView] = useState<View>('user-panel');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isClaimLicenseOpen, setClaimLicenseOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');


  // Data is now passed as props, but we can still use state to hold it and update it with real-time listeners.
  const [menuData, setMenuData] = useState<Menu[]>(initialMenuData);
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms);
  const [notifications, setNotifications] = useState<Notification[]>([]); // Start with empty array for notifications
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>(initialLicenseKeys);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(initialSubscriptionPlans);

  useEffect(() => {
    if (!currentUser) return;
    
    // Get the set of notifications already alerted for in this session
    const getAlertedIds = () => {
        const alerted = sessionStorage.getItem('alertedNotificationIds');
        return new Set(alerted ? JSON.parse(alerted) : []);
    };

    const setAlertedIds = (ids: Set<string>) => {
        sessionStorage.setItem('alertedNotificationIds', JSON.stringify(Array.from(ids)));
    };

    const q = query(collection(db, "notifications"), orderBy('timestamp', 'desc'));
    
    const notifsUnsub = onSnapshot(q, (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString()
            } as Notification;
        }).filter(notif => 
            // Filter for universal or user-specific notifications
            !notif.recipientId || notif.recipientId === currentUser.id
        );

        setNotifications(newNotifications);
        
        // --- Smart Alert Logic ---
        const alertedIds = getAlertedIds();
        const unalertedNotifications = newNotifications.filter(n => !alertedIds.has(n.id));

        if (unalertedNotifications.length > 0) {
            // Show a toast for the newest un-alerted notification
            const latestUnalerted = unalertedNotifications[0];
            toast({
                title: latestUnalerted.title,
                description: "You have a new notification.",
            });

            // Update the set of alerted IDs in session storage
            unalertedNotifications.forEach(n => alertedIds.add(n.id));
            setAlertedIds(alertedIds);
        }

    }, (error) => {
        console.error("Error fetching notifications:", error);
        toast({
            variant: "destructive",
            title: "Could not load notifications",
            description: "You may not have permission to view this data."
        })
    });

    return () => notifsUnsub();
}, [currentUser, toast]);


  useEffect(() => {
    // Set up real-time listeners to keep the prop data fresh
    const menuUnsub = onSnapshot(collection(db, "categories"), (snapshot) => {
      setMenuData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Menu)));
    });

    const platformsUnsub = onSnapshot(collection(db, "platforms"), (snapshot) => {
      setPlatforms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Platform)));
    });
    
     const licensesUnsub = onSnapshot(collection(db, "licenseKeys"), (snapshot) => {
      setLicenseKeys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LicenseKey)));
    });

    const plansUnsub = onSnapshot(collection(db, "subscriptionPlans"), (snapshot) => {
      setSubscriptionPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan)));
    });

    return () => {
      menuUnsub();
      platformsUnsub();
      licensesUnsub();
      plansUnsub();
    };
  }, []);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!currentUser) {
        router.push('/');
      } else if (currentUser.role === 'Admin') {
        router.push('/admin');
      }
    }
  }, [currentUser, isAuthLoading, router]);

  // This effect resets the search and sort when the view changes.
  useEffect(() => {
    setSearchQuery('');
    setSortOption('name-asc');
  }, [activeView]);

  const hasActiveSubscription = useMemo(() => 
    currentUser?.subscriptions.some(sub => sub.status === 'Active' && new Date(sub.endDate) > new Date()),
    [currentUser?.subscriptions]
  );

  const activeSubscriptions = useMemo(() => 
    currentUser?.subscriptions.filter(sub => sub.status === 'Active' && new Date(sub.endDate) > new Date()),
    [currentUser?.subscriptions]
  );
  
  const userPlanIds = useMemo(() => 
      Array.from(new Set(activeSubscriptions?.map(sub => sub.planId))),
      [activeSubscriptions]
  );

  const groupedPlatforms = useMemo(() => platforms.reduce((acc, platform) => {
    if (!acc[platform.category]) {
      acc[platform.category] = [];
    }
    acc[platform.category].push(platform);
    return acc;
  }, {} as Record<Category, Platform[]>), [platforms]);

  const handleUserUpdate = async (updatedUser: User) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.id);
    const { firstName, lastName, avatarUrl } = updatedUser;
    await updateDoc(userDocRef, { firstName, lastName, avatarUrl });
  };
  
  const handleClaimLicense = async (key: string) => {
      if (!currentUser) return;
      setIsClaiming(true);

      const licensesRef = collection(db, "licenseKeys");
      const q = query(licensesRef, where("key", "==", key));
      
      try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({ variant: "destructive", title: "Invalid License Key", description: "The key you entered does not exist." });
            return;
        }

        const licenseDoc = querySnapshot.docs[0];
        const license = { id: licenseDoc.id, ...licenseDoc.data() } as LicenseKey;

        if (license.claims.some(claim => claim.userId === currentUser.id)) {
            toast({ variant: "destructive", title: "Already Claimed", description: "You have already claimed this license key." });
            return;
        }

        if (license.claims.length >= license.maxClaims) {
            toast({ variant: "destructive", title: "License Depleted", description: "This key has reached its maximum claim limit." });
            return;
        }
        
        const newEndDate = new Date(Date.now() + license.durationMinutes * 60 * 1000).toISOString();
        const newSubscription: UserSubscription = {
            planId: license.planId,
            status: 'Active',
            startDate: new Date().toISOString(),
            endDate: newEndDate,
        };
        
        const userDocRef = doc(db, 'users', currentUser.id);
        const licenseDocRef = doc(db, 'licenseKeys', license.id);

        // Update user's subscription list
        await updateDoc(userDocRef, { subscriptions: arrayUnion(newSubscription) });

        // Update the license key with the new claim
        await updateDoc(licenseDocRef, {
            claims: arrayUnion({ userId: currentUser.id, timestamp: new Date().toISOString() }),
            status: (license.claims.length + 1) >= license.maxClaims ? 'depleted' : 'claimed'
        });

        toast({
            title: "Subscription Activated!",
            description: `Your new plan is now active.`,
        });
        
        setClaimLicenseOpen(false);
        setActiveView('user-panel');

      } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Claim Failed",
            description: error.message || "An unexpected error occurred. Please check your permissions.",
        });
      } finally {
        setIsClaiming(false);
      }
  };
  
  const handleCancelSubscription = async (subscriptionToCancel: UserSubscription) => {
      if (!currentUser) return;
      const updatedSubscriptions = currentUser.subscriptions.map(sub => {
          // Use a combination of properties to uniquely identify the subscription
          if (sub.planId === subscriptionToCancel.planId && sub.startDate === subscriptionToCancel.startDate) {
              return { ...sub, status: 'Inactive' as const, endDate: new Date().toISOString() };
          }
          return sub;
      });

      const userDocRef = doc(db, 'users', currentUser.id);
      await updateDoc(userDocRef, {
          subscriptions: updatedSubscriptions
      });
  };

  const filteredMenuData = useMemo(() => {
    if (!hasActiveSubscription || !currentUser || !subscriptionPlans.length) return [];
    
    const allAccessibleCategories = new Set<string>();
    const allAccessibleSubCategories = new Set<string>();

    const plans = subscriptionPlans.filter(p => userPlanIds.includes(p.id));
    
    for (const plan of plans) {
      plan.accessibleCategories.forEach(catId => allAccessibleCategories.add(catId));
      plan.accessibleSubCategories.forEach(subCatName => allAccessibleSubCategories.add(subCatName));
    }

    return menuData.map(menu => {
        const hasAccessToFullCategory = allAccessibleCategories.has(menu.id);
        
        const accessibleSubCategories = menu.subCategories.filter(sc => 
            hasAccessToFullCategory || allAccessibleSubCategories.has(sc.name)
        );

        if (accessibleSubCategories.length > 0) {
            return {
                ...menu,
                subCategories: accessibleSubCategories
            };
        }
        return null;
    }).filter((menu): menu is Menu => menu !== null);
  }, [hasActiveSubscription, userPlanIds, currentUser, menuData, subscriptionPlans]);


  const canAccessView = useMemo(() => {
      if (activeView === 'user-panel' || activeView === 'license-panel') return true;
      if (!hasActiveSubscription) return false;

      const subCategoryNames = filteredMenuData.flatMap(m => m.subCategories.map(sc => sc.name));
      return subCategoryNames.includes(activeView as Category);
  }, [activeView, hasActiveSubscription, filteredMenuData]);

  const filteredAndSortedPlatforms = useMemo(() => {
    const platformsForCategory = groupedPlatforms[activeView as Category] || [];
    
    const filtered = platformsForCategory.filter(platform => 
        platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        platform.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch(sortOption) {
        case 'name-asc':
            return filtered.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return filtered.sort((a, b) => b.name.localeCompare(a.name));
        default:
            return filtered;
    }
}, [groupedPlatforms, activeView, searchQuery, sortOption]);


  if (isAuthLoading || !currentUser || currentUser.role === 'Admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center animated-gradient">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    if (activeView === 'user-panel') {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <UserCard 
              user={currentUser}
              subscriptionPlans={subscriptionPlans}
              onUserUpdate={() => {}} // Updates are handled by onSnapshot via context
              onNavigateToLicense={() => setActiveView('license-panel')}
            />
          </div>
          <div className="lg:col-span-1">
            <CalendarCard />
          </div>
          <div className="lg:col-span-1">
             <Clock />
          </div>
           <div className="lg:col-span-1">
             <AccountCard 
                onEditProfile={() => setProfileDialogOpen(true)}
                onLogout={() => setLogoutDialogOpen(true)}
                onNavigateToLicense={() => setActiveView('license-panel')}
                hasSubscription={hasActiveSubscription}
                isAdmin={false}
              />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
             <Card className="h-full w-full glass-card rounded-xl">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Bell className="h-6 w-6" />
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(notification => {
                        return (
                          <div key={notification.id} className="p-4 rounded-lg border bg-background/20 border-border/50">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="font-bold">{notification.title}</p>
                                    <p className="text-sm text-foreground/90">{notification.body}</p>
                                </div>
                            </div>
                            
                            {(notification.imageUrls && notification.imageUrls.length > 0) && (
                                <Carousel className="w-full max-w-full mt-4" opts={{ loop: true }}>
                                    <CarouselContent>
                                        {notification.imageUrls.map((url, index) => (
                                            <CarouselItem key={index}>
                                                <Link href={url} target="_blank" rel="noopener noreferrer">
                                                    <div className="relative aspect-video rounded-md overflow-hidden border">
                                                        <Image src={url} alt={`${notification.title} image ${index + 1}`} layout="fill" objectFit="cover" />
                                                    </div>
                                                </Link>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                   {(notification.imageUrls.length > 1) && <>
                                        <CarouselPrevious className="left-2" />
                                        <CarouselNext className="right-2" />
                                    </>}
                                </Carousel>
                            )}
                            
                            {notification.videoUrls && notification.videoUrls.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                    {notification.videoUrls.map((url, index) => (
                                       <div key={index} className="aspect-video rounded-md overflow-hidden border bg-black">
                                         <VideoPlayer src={url} />
                                       </div>
                                    ))}
                                </div>
                            )}

                            {notification.buttons && notification.buttons.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/50">
                                    {notification.buttons.map((button, index) => (
                                        <Button key={index} asChild size="sm" variant="outline">
                                            <Link href={button.url} target="_blank" rel="noopener noreferrer">
                                                {button.text}
                                                <ExternalLink className="ml-2 h-3 w-3" />
                                            </Link>
                                        </Button>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-2 text-right">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        )
                    })
                  ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">You have no new notifications.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        </div>
      );
    }
    
    if(activeView === 'license-panel') {
      return (
        <LicensePage 
          user={currentUser} 
          subscriptionPlans={subscriptionPlans}
          onClaimLicense={() => setClaimLicenseOpen(true)}
          onNavigateBack={() => setActiveView('user-panel')}
          onCancelSubscription={handleCancelSubscription}
        />
      );
    }

    if (!canAccessView) {
        return <SubscriptionRequired />;
    }
    
    const categoryGroup = { [activeView]: filteredAndSortedPlatforms };

    if (filteredAndSortedPlatforms.length === 0 && searchQuery === '') {
        return (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[40vh] glass-card rounded-xl">
                <Film className="w-16 h-16 mb-4 text-accent" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Coming Soon!</h2>
                <p>Content for this category is being curated and will be available shortly.</p>
            </div>
        )
    }

    
    return (
        <div className="space-y-6">
            <SearchAndSort
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOption={sortOption}
                onSortChange={setSortOption}
            />
            <PlatformGrid 
                groupedPlatforms={categoryGroup} 
                onPlatformClick={setSelectedPlatform} 
                isSearchResult={searchQuery !== ''}
            />
        </div>
    )
  };

  return (
    <>
        <Header activeView={activeView} setActiveView={setActiveView} menuData={filteredMenuData} />
        <div className="mt-8">
            {renderContent()}
        </div>
        <BottomNav activeView={activeView} setActiveView={setActiveView} menuData={filteredMenuData} />
        <PlatformDetailDialog 
          platform={selectedPlatform} 
          menuData={menuData}
          isOpen={!!selectedPlatform} 
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedPlatform(null);
            }
          }}
        />
        {currentUser && (
          <EditProfileDialog 
              isOpen={isProfileDialogOpen}
              onOpenChange={setProfileDialogOpen}
              user={currentUser}
              onUserUpdate={handleUserUpdate}
          />
        )}
        <LogoutConfirmationDialog
            isOpen={isLogoutDialogOpen}
            onOpenChange={setLogoutDialogOpen}
        />
        <ClaimLicenseDialog
            isOpen={isClaimLicenseOpen}
            onOpenChange={setClaimLicenseOpen}
            onClaim={handleClaimLicense}
            isClaiming={isClaiming}
        />
    </>
  );
}
