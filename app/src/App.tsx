import { useEffect } from 'react';
import { useStore } from './store';
import { THEMES } from './themes';
import { DeckUI } from './components/DeckUI';
import { MixerUI } from './components/MixerUI';
import { MasterUI } from './components/MasterUI';
import { CueUI } from './components/CueUI';
import { engine } from './audio/engine';

export default function App() {
  const themeId = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);
  
  const deckA = useStore(state => state.deckA);
  const deckB = useStore(state => state.deckB);
  const updateDeck = useStore(state => state.updateDeck);
  const crossfader = useStore(state => state.crossfader);
  const setCrossfader = useStore(state => state.setCrossfader);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if focus is on an input or something else
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
  }, [crossfader, updateDeck]);

  const handleThemeChange = (id: number) => {
    setTheme(id);
    const savedTheme = THEMES.find(t => t.id === id) || THEMES[0];
    document.documentElement.style.setProperty('--bg-from', savedTheme.from);
    document.documentElement.style.setProperty('--bg-via', savedTheme.via);
    document.documentElement.style.setProperty('--bg-to', savedTheme.to);
    document.documentElement.style.setProperty('--accent', savedTheme.accent);
  };

  return (
    <div className="min-w-[1280px] min-h-screen p-6 flex flex-col gap-6">
      <header className="flex justify-between items-center glass-panel px-6 py-4">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--accent)] drop-shadow-md">
          Sonnet File
        </h1>
        <div className="flex gap-2">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              className={`px-3 py-1 text-sm font-medium rounded-full transition-all border ${
                themeId === t.id 
                  ? 'bg-[var(--accent)] text-[#0b1026] border-[var(--accent)] shadow-[0_0_10px_var(--accent)]' 
                  : 'bg-black/30 border-[var(--glass-border)] hover:bg-black/50 text-white'
              }`}
            >
              Day {t.id}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 grid grid-cols-4 gap-6 auto-rows-max">
        {/* Row 1: Decks and Mixer */}
        <div className="col-span-1">
          <DeckUI id="A" />
        </div>
        <div className="col-span-2">
          <MixerUI />
        </div>
        <div className="col-span-1">
          <DeckUI id="B" />
        </div>

        {/* Row 2: Master, Cue, and Placeholders */}
        <div className="col-span-1 flex flex-col gap-6">
          <MasterUI />
          <CueUI />
        </div>
        
        <div className="col-span-2 grid grid-cols-2 gap-6">
          <div className="glass-panel p-6 flex items-center justify-center opacity-60 border-dashed border-2 border-[var(--glass-border)]">
            <span className="font-mono text-sm tracking-widest text-center">Banger Pads<br/>(Phase 3)</span>
          </div>
          <div className="glass-panel p-6 flex items-center justify-center opacity-60 border-dashed border-2 border-[var(--glass-border)]">
            <span className="font-mono text-sm tracking-widest text-center">Aura Queue<br/>(Phase 3)</span>
          </div>
          <div className="glass-panel p-6 flex items-center justify-center opacity-60 border-dashed border-2 border-[var(--glass-border)]">
            <span className="font-mono text-sm tracking-widest text-center">Suggestions<br/>(Phase 4)</span>
          </div>
          <div className="glass-panel p-6 flex items-center justify-center opacity-60 border-dashed border-2 border-[var(--glass-border)]">
            <span className="font-mono text-sm tracking-widest text-center">Night Planner<br/>(Phase 5)</span>
          </div>
        </div>

        <div className="col-span-1">
          <div className="glass-panel p-6 h-full min-h-[300px] flex items-center justify-center opacity-60 border-dashed border-2 border-[var(--glass-border)]">
            <span className="font-mono text-sm tracking-widest text-center">Live Inputs + YouTube<br/>(Phase 6)</span>
          </div>
        </div>
      </main>
    </div>
  );
}
