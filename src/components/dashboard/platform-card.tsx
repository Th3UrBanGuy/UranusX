
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { Platform } from "@/lib/data";

interface PlatformCardProps {
  platform: Platform;
  onClick: (platform: Platform) => void;
}

export function PlatformCard({ platform, onClick }: PlatformCardProps) {
  return (
    <button
      onClick={() => onClick(platform)}
      className="group block text-left"
    >
      <Card className="h-full w-full overflow-hidden transition-all duration-300 ease-in-out bg-card/50 backdrop-blur-md border border-border/50 rounded-lg hover:border-accent/50 hover:bg-accent/10 hover:shadow-lg hover:shadow-accent/10 transform hover:-translate-y-1">
        <CardContent className="p-0 flex flex-col items-center justify-center text-center">
            <div className="relative w-full aspect-video">
                <Image
                src={platform.imageUrl || `https://picsum.photos/seed/${platform.id}/300/150`}
                alt={`${platform.name} logo`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
            </div>
          <h3 className="font-semibold text-sm sm:text-base text-card-foreground p-3 truncate w-full">
            {platform.name}
          </h3>
        </CardContent>
      </Card>
    </button>
  );
}
