
import { PlatformCard } from "./platform-card";
import type { Platform, Category } from "@/lib/data";
import { SearchX } from "lucide-react";

interface PlatformGridProps {
  groupedPlatforms: Record<string, Platform[]>;
  isSearchResult?: boolean;
  onPlatformClick: (platform: Platform) => void;
}

export function PlatformGrid({ groupedPlatforms, isSearchResult = false, onPlatformClick }: PlatformGridProps) {
  // Use Object.keys to get all categories present in the current view
  const categoriesToDisplay = Object.keys(groupedPlatforms);

  const hasContent = categoriesToDisplay.some(category => groupedPlatforms[category]?.length > 0);

  if (!hasContent) {
    if (isSearchResult) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[30vh] glass-card rounded-xl">
                <SearchX className="w-16 h-16 mb-4 text-accent" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No Platforms Found</h2>
                <p>Your search did not match any platforms. Try a different keyword.</p>
            </div>
        )
    }
    return null;
  }
  
  return (
    <div className="space-y-8">
      {categoriesToDisplay.map((category) => {
        const platforms = groupedPlatforms[category as Category];
        if (!platforms || platforms.length === 0) {
          return null;
        }
        return (
          <section key={category} className="p-4 sm:p-6 rounded-xl glass-card">
            <h2 className="text-2xl font-bold tracking-tight mb-6 border-l-4 border-accent pl-4">
              {category}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {platforms.map((platform) => (
                <PlatformCard key={platform.name} platform={platform} onClick={onPlatformClick} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
