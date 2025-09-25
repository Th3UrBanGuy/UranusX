

import { Tv, Clapperboard, Medal, Smile, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";

export interface PlatformLink {
    text: string;
    url: string;
}

export interface StreamSource {
    name: string;
    url: string;
}

export interface Platform {
  id?: string; // Firestore document ID
  name: string;
  links: PlatformLink[];
  category: Category;
  imageUrl: string;
  description: string;
  streamSources?: StreamSource[]; // Optional: for internal channels
}

export interface Menu {
    id: string; // Firestore document ID
    title: string;
    icon: string;
    subCategories: SubCategory[];
}

export interface SubCategory {
    name: Category;
    icon: string;
    linkType: 'internal' | 'external';
}

export interface NotificationButton {
    text: string;
    url: string;
}

export interface Notification {
    id: string;
    title: string;
    body: string;
    imageUrls?: string[];
    videoUrls?: string[];
    buttons?: NotificationButton[];
    timestamp: string;
    recipientId?: string | null; // null for universal, user ID for individual
    readBy?: string[]; // Array of user IDs who have read it
    deletedBy?: string[]; // Array of user IDs who have deleted it
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    accessibleCategories: string[]; // Array of Menu 'id's
    accessibleSubCategories: string[]; // Array of SubCategory 'name's
}

export interface LicenseKeyClaim {
    userId: string;
    timestamp: string;
}

export interface LicenseKey {
    id: string;
    key: string;
    planId: string;
    durationMinutes: number;
    status: 'unused' | 'claimed' | 'depleted';
    maxClaims: number;
    claims: LicenseKeyClaim[];
    createdAt: string; // Added for sorting
}

export interface UserSubscription {
    planId: string;
    status: 'Active' | 'Inactive';
    startDate: string;
    endDate: string;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string;
    role: 'Admin' | 'User';
    status: 'Active' | 'Inactive';
    subscriptions: UserSubscription[];
}


export const platformCategories = ['OTT', 'Live TV', 'Sports', 'Cartoons'] as const;
export type Category = typeof platformCategories[number];

export const defaultIcon = "https://cdn.lordicon.com/surjmvno.json";

export const categoryDetails: Record<Category, { icon: string }> = {
    'OTT': { icon: "https://cdn.lordicon.com/wzwygmng.json" },
    'Live TV': { icon: "https://cdn.lordicon.com/easyzdos.json" },
    'Sports': { icon: "https://cdn.lordicon.com/bhyjpvis.json" },
    'Cartoons': { icon: "https://cdn.lordicon.com/gamjbyfa.json" },
};

// This file now primarily contains type definitions and constants.
// All mock data has been removed and is now managed in Firestore.

export let subscriptionPlans: SubscriptionPlan[] = [];

export let licenseKeys: LicenseKey[] = [];
