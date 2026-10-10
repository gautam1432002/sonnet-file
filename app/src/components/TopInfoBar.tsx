import React from 'react';
import { useStore } from '../store';
import './TopInfoBar.css';

export const TopInfoBar: React.FC = () => {
  const deckA = useStore((state) => state.deckA);
  const deckB = useStore((state) => state.deckB);

  return (
    <div className="top-info-bar">
      {/* Deck A Left Side */}
      <div className="deck-info deck-a">
        <div className="artwork" style={{ borderColor: 'var(--deck-a-accent)' }}>
          {deckA.artworkUrl ? (
            <img src={deckA.artworkUrl} alt="Track Art" />
          ) : (
            <div className="placeholder" style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)' }} />
          )}
        </div>
        <div className="meta">
          <div className="title">{deckA.trackName || 'No Track Loaded'}</div>
          <div className="artist">{deckA.artist || 'Select a track'}</div>
        </div>
      </div>

      {/* Center Mixer Brand / Clock */}
      <div className="center-console">
        <span style={{
          fontSize: 24,
          fontFamily: '"Dancing Script", cursive',
          color: 'var(--accent)',
          transition: 'color 3.5s ease',
        }}>
          Sonnet File
        </span>
        <h2>DJ STUDIO</h2>
      </div>

      {/* Deck B Right Side */}
      <div className="deck-info deck-b">
        <div className="meta right-align">
          <div className="title">{deckB.trackName || 'No Track Loaded'}</div>
          <div className="artist">{deckB.artist || 'Select a track'}</div>
        </div>
        <div className="artwork" style={{ borderColor: 'var(--deck-b-accent)' }}>
          {deckB.artworkUrl ? (
            <img src={deckB.artworkUrl} alt="Track Art" />
          ) : (
            <div className="placeholder" style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)' }} />
          )}
        </div>
      </div>
    </div>
  );
};
