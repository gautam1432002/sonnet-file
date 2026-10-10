import { useEffect } from 'react';
import { useStore } from './store';
import { DeckUI } from './components/DeckUI';
import { MixerUI } from './components/MixerUI';
import { MasterUI } from './components/MasterUI';
import { CueUI } from './components/CueUI';
import { engine } from './audio/engine';
import { useAmbientColor } from './hooks/useAmbientColor';

export default function App() {
  const deckA = useStore(state => state.deckA);
  const deckB = useStore(state => state.deckB);
  const updateDeck = useStore(state => state.updateDeck);
  const crossfader = useStore(state => state.crossfader);
  const setCrossfader = useStore(state => state.setCrossfader);

  // Dynamic ambient background based on playing state
  useAmbientColor(deckA.playing, deckB.playing, deckA.trackName, deckB.trackName);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;
      if (e.key.toLowerCase() === 'q') {
        engine.resume();
        updateDeck('A', { playing: !deckA.playing });
      } else if (e.key.toLowerCase() === 'p') {
        engine.resume();
        updateDeck('B', { playing: !deckB.playing });
      } else if (e.key === 'ArrowLeft') {
        setCrossfader(Math.max(0, crossfader - 0.05));
      } else if (e.key === 'ArrowRight') {
        setCrossfader(Math.min(1, crossfader + 0.05));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [crossfader, updateDeck, deckA.playing, deckB.playing]);

  const isAnyPlaying = deckA.playing || deckB.playing;

  return (
    <div className="min-w-[1280px] min-h-screen flex flex-col" style={{ gap: 0 }}>

      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 border-b border-white/5" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-tighter" style={{ color: 'var(--accent)', textShadow: '0 0 20px var(--accent)' }}>
            SONNET FILE
          </span>
          <span className="text-xs font-mono text-white/30 tracking-widest mt-1">DJ STUDIO</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Live status indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-700 ${isAnyPlaying ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-white/20'}`} />
            <span className="text-xs font-mono text-white/40 tracking-widest">
              {isAnyPlaying ? 'LIVE' : 'IDLE'}
            </span>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="flex gap-2 text-xs font-mono text-white/20">
            <span className="bg-white/5 px-2 py-1 rounded">Q</span>
            <span className="text-white/10">Deck A</span>
            <span className="bg-white/5 px-2 py-1 rounded">P</span>
            <span className="text-white/10">Deck B</span>
            <span className="bg-white/5 px-2 py-1 rounded">← →</span>
            <span className="text-white/10">Xfader</span>
          </div>
        </div>
      </header>

      {/* Main Layout: Deck A | Mixer | Deck B */}
      <main className="flex flex-1 overflow-hidden">
        {/* Deck A */}
        <div className="flex-1 min-w-[320px] max-w-[380px] flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <DeckUI id="A" />
        </div>

        {/* Center: Mixer */}
        <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <MixerUI />
        </div>

        {/* Deck B */}
        <div className="flex-1 min-w-[320px] max-w-[380px] flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <DeckUI id="B" />
        </div>

        {/* Right sidebar: Master + Cue */}
        <div className="w-52 flex flex-col gap-0" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex-1 p-3 border-b border-white/5">
            <MasterUI />
          </div>
          <div className="flex-1 p-3">
            <CueUI />
          </div>
        </div>
      </main>
    </div>
  );
}
