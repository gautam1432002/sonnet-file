import React, { useState } from 'react';
import { useYouTubeSearch } from '../hooks/useYouTubeSearch';
import type { YouTubeResult } from '../hooks/useYouTubeSearch';

interface YouTubeBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTrack: (deckId: 'A' | 'B', track: YouTubeResult) => void;
}

export const YouTubeBrowser: React.FC<YouTubeBrowserProps> = ({ isOpen, onClose, onLoadTrack }) => {
  const [query, setQuery] = useState('');
  const { results, searchYouTube, loading } = useYouTubeSearch();

  if (!isOpen) return null;

  return (
    <div className="youtube-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backdropFilter: 'blur(10px)'
    }}>
      <div className="youtube-browser-container bento" style={{
        width: '80%', height: '80%', backgroundColor: 'rgba(10, 10, 10, 0.95)',
        borderRadius: '12px', border: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
      }}>
        
        {/* Header & Search Bar */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchYouTube(query)}
            placeholder="Search YouTube or paste a URL/Playlist link..."
            style={{ 
              flex: 1, padding: '12px', borderRadius: '6px', 
              backgroundColor: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-color)', outline: 'none'
            }}
            autoFocus
          />
          <button onClick={() => searchYouTube(query)} style={{ 
            padding: '0 24px', cursor: 'pointer', borderRadius: '6px', backgroundColor: 'var(--deck-a-accent)', color: '#000', fontWeight: 'bold', border: 'none'
          }}>Search</button>
          <button onClick={onClose} style={{ 
            padding: '0 24px', borderRadius: '6px', backgroundColor: '#333', color: '#fff', cursor: 'pointer', border: 'none', fontWeight: 'bold'
          }}>Close</button>
        </div>

        {/* Results List */}
        <div className="results-list" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Searching...</p> : results.map((track) => (
            <div key={track.id} style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '12px',
              border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)',
              borderRadius: '8px'
            }}>
              <img src={track.thumbnail} alt="thumb" style={{ width: '120px', height: '68px', objectFit: 'cover', borderRadius: '4px' }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{track.title}</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>{track.artist}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => onLoadTrack('A', track)}
                  style={{ backgroundColor: 'var(--deck-a-accent)', color: '#000', padding: '8px 16px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Load Deck A
                </button>
                <button 
                  onClick={() => onLoadTrack('B', track)}
                  style={{ backgroundColor: 'var(--deck-b-accent)', color: '#000', padding: '8px 16px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Load Deck B
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
