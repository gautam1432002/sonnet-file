import React, { useEffect, useRef } from 'react';
import { YouTubeSourceAdapter } from '../audio/sources/YouTubeSourceAdapter';

interface YouTubeDeckPlayerProps {
  deckId: 'A' | 'B';
  videoId?: string | null;
  onAdapterReady: (adapter: YouTubeSourceAdapter) => void;
  onStateChange: (state: number) => void;
}

export const YouTubeDeckPlayer: React.FC<YouTubeDeckPlayerProps> = ({
  deckId,
  videoId,
  onAdapterReady,
  onStateChange
}) => {
  const containerId = `yt-player-deck-${deckId.toLowerCase()}`;
  const adapterRef = useRef<YouTubeSourceAdapter | null>(null);

  useEffect(() => {
    if (!adapterRef.current) {
      adapterRef.current = new YouTubeSourceAdapter(containerId, (state) => {
        onStateChange(state);
      });
      onAdapterReady(adapterRef.current);
    }
  }, [containerId, onAdapterReady, onStateChange]);

  useEffect(() => {
    if (videoId && adapterRef.current) {
      adapterRef.current.loadVideo(videoId);
    }
  }, [videoId]);

  return (
    <div
      className="yt-platter-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        height: '220px',
        backgroundColor: '#000000',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${deckId === 'A' ? 'var(--deck-a-accent)' : 'var(--deck-b-accent)'}`,
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      {/* Target DOM Element for YouTube API injection */}
      <div id={containerId} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />

      {/* Glassmorphic DJ HUD Overlay */}
      <div
        className="deck-lens-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.4) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '8px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            color: deckId === 'A' ? 'var(--deck-a-accent)' : 'var(--deck-b-accent)',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          DECK {deckId} • LIVE SOURCE
        </span>
      </div>
    </div>
  );
};
