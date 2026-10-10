import { useEffect } from 'react';
import { useStore } from './store';
import { DeckUI } from './components/DeckUI';
import { MixerUI } from './components/MixerUI';
import { MasterUI } from './components/MasterUI';
import { CueUI } from './components/CueUI';
import { AmbientCanvas } from './components/AmbientCanvas';
import { TopInfoBar } from './components/TopInfoBar';
import { GraphVisualizer } from './components/GraphVisualizer';
import { YouTubeBrowser } from './components/YouTubeBrowser';
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
        <TopInfoBar onSearchClick={() => setIsBrowserOpen(true)} />
        
        {engine.masterAnalyser && (
          <GraphVisualizer analyser={engine.masterAnalyser} />
        )}

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
