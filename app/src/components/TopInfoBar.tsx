import React from 'react';
import { useStore } from '../store';
import './TopInfoBar.css';

interface TopInfoBarProps {
  onSearchClick: () => void;
}

export const TopInfoBar: React.FC<TopInfoBarProps> = ({ onSearchClick }) => {
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
      <div className="center-console" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button onClick={onSearchClick} style={{ 
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: 10, fontWeight: 'bold', letterSpacing: '0.1em', marginBottom: 4, transition: 'background 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
          SEARCH YOUTUBE
        </button>
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
