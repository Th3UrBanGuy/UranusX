
'use client';
import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import type Player from 'video.js/dist/types/player';

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [{
      src: src,
      type: 'application/x-mpegURL'
    }]
  };

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      // The Video.js player needs a video element, not a div.
      // So we create one inside our ref.
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-default-skin', 'vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, videoJsOptions, () => {
        console.log('Player is ready');
      });
    } else {
        const player = playerRef.current;
        if (player) {
            player.src({ src: src, type: 'application/x-mpegURL' });
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Dispose the Video.js player when the component unmounts
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player>
      <div ref={videoRef} className="w-full h-full" />
    </div>
  );
};
