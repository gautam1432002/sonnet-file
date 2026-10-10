import { useEffect } from 'react';
import { useStore } from './store';
import { DeckUI } from './components/DeckUI';
import { MixerUI } from './components/MixerUI';
import { MasterUI } from './components/MasterUI';
import { CueUI } from './components/CueUI';
import { AmbientCanvas } from './components/AmbientCanvas';
import { engine } from './audio/engine';
import { useAmbientColor } from './hooks/useAmbientColor';

export default function App() {
  const deckA = useStore(state => state.deckA);
  const deckB = useStore(state => state.deckB);
  const updateDeck = useStore(state => state.updateDeck);
  const crossfader = useStore(state => state.crossfader);
  const setCrossfader = useStore(state => state.setCrossfader);

  useAmbientColor(deckA.playing, deckB.playing, deckA.trackName, deckB.trackName);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;
      if (e.key.toLowerCase() === 'q') { engine.resume(); updateDeck('A', { playing: !deckA.playing }); }
      else if (e.key.toLowerCase() === 'p') { engine.resume(); updateDeck('B', { playing: !deckB.playing }); }
      else if (e.key === 'ArrowLeft') setCrossfader(Math.max(0, crossfader - 0.05));
      else if (e.key === 'ArrowRight') setCrossfader(Math.min(1, crossfader + 0.05));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [crossfader, updateDeck, deckA.playing, deckB.playing]);

  const isAnyPlaying = deckA.playing || deckB.playing;

  return (
    <>
      {/* Layer 0: Animated ambient canvas background */}
      <AmbientCanvas />

      {/* Layer 1: UI */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          minWidth: 1100,
          padding: '14px',
          gap: '12px',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Header ── */}
        <header
          className="bento"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            flexShrink: 0,
            border: 'none',
            background: 'transparent',
            boxShadow: 'none',
            backdropFilter: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontSize: 32,
              fontFamily: '"Dancing Script", cursive',
              color: 'var(--accent)',
              transition: 'color 3.5s ease',
            }}>
              Sonnet File
            </span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.25em', fontWeight: 600 }}>
              DJ STUDIO
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isAnyPlaying ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                transition: 'background 1s ease',
              }} />
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>
                {isAnyPlaying ? 'LIVE' : 'IDLE'}
              </span>
            </div>

            {/* Keyboard hints */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {[['Q', 'Deck A'], ['P', 'Deck B'], ['← →', 'Xfade']].map(([key, label]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    fontSize: 9, fontFamily: 'monospace', padding: '2px 6px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 4, color: 'rgba(255,255,255,0.5)',
                  }}>{key}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── Bento Grid ── */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1.4fr 1fr',
            gridTemplateRows: '1fr auto',
            gap: '12px',
            minHeight: 0,
          }}
        >
          {/* Deck A */}
          <div className={`bento ${deckA.playing ? 'bento-accent' : ''}`} style={{ gridColumn: 1, gridRow: '1 / 3', overflow: 'hidden', transition: 'all 3.5s ease' }}>
            <DeckUI id="A" />
          </div>

          {/* Mixer — spans top center */}
          <div className="bento" style={{ gridColumn: 2, gridRow: 1, overflow: 'hidden', minHeight: 0 }}>
            <MixerUI />
          </div>

          {/* Deck B */}
          <div className={`bento ${deckB.playing ? 'bento-accent' : ''}`} style={{ gridColumn: 3, gridRow: '1 / 3', overflow: 'hidden', transition: 'all 3.5s ease' }}>
            <DeckUI id="B" />
          </div>

          {/* Bottom center: Master + Cue side by side */}
          <div style={{ gridColumn: 2, gridRow: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="bento" style={{ padding: '16px', overflow: 'hidden' }}>
              <MasterUI />
            </div>
            <div className="bento" style={{ padding: '16px', overflow: 'hidden' }}>
              <CueUI />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
