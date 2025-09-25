
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VideoPlayer } from '@/components/video-player';
import { ExternalLink } from 'lucide-react';
import type { Platform, Menu, StreamSource } from '@/lib/data';
import { useState } from 'react';

interface PlatformDetailDialogProps {
  platform: Platform | null;
  menuData: Menu[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function PlatformDetailDialog({ platform, menuData, isOpen, onOpenChange }: PlatformDetailDialogProps) {
  const [activeSource, setActiveSource] = useState<StreamSource | null>(null);

  if (!platform) {
    return null;
  }

  const subCategory = menuData.flatMap(menu => menu.subCategories).find(sc => sc.name === platform.category);
  const linkType = subCategory?.linkType || 'external';

  const handleSourceClick = (source: StreamSource) => {
      setActiveSource(source);
  }

  const handleOpenChange = (open: boolean) => {
      if(!open) {
          setActiveSource(null); // Reset active source when dialog closes
      }
      onOpenChange(open);
  }

  const renderContent = () => {
    if (linkType === 'internal' && platform.streamSources && platform.streamSources.length > 0) {
      const currentSourceUrl = activeSource ? activeSource.url : platform.streamSources[0].url;
      return (
        <>
          <div className='aspect-video rounded-lg overflow-hidden mb-4 border bg-black'>
            <VideoPlayer key={currentSourceUrl} src={currentSourceUrl} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold">{platform.name}</DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-foreground/80 pt-2">
              {platform.description}
            </DialogDescription>
          </DialogHeader>

          {platform.streamSources.length > 1 && (
              <div className="pt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Available Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {platform.streamSources.map((source, index) => (
                    <Button 
                        key={index}
                        variant={activeSource?.name === source.name || (!activeSource && index === 0) ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => handleSourceClick(source)}
                    >
                      {source.name}
                    </Button>
                  ))}
                </div>
              </div>
          )}

          <div className="pt-4 flex flex-wrap gap-2">
              {platform.links.map((link, index) => (
                <Button key={index} asChild>
                    <Link href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.text}
                    <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
              ))}
          </div>
        </>
      );
    }

    return (
      <>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
            <Image
              src={platform.imageUrl || `https://picsum.photos/seed/${platform.id}/600/400`}
              alt={`${platform.name} logo`}
              fill
              className="object-cover"
            />
          </div>
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold">{platform.name}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-foreground/80 pt-2">
            {platform.description}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4 flex flex-wrap gap-2">
            {platform.links.map((link, index) => (
                <Button key={index} asChild>
                    <Link href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.text}
                    <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            ))}
        </div>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass-card">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
