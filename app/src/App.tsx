import { useState, useEffect } from 'react';
import { useStore } from './store';
import { WebGLShaderBackground } from './components/WebGLShaderBackground';
import { Sidebar } from './components/Sidebar';
import { BentoTopBar } from './components/BentoTopBar';
import { SpectrumObservationCard } from './components/SpectrumObservationCard';
import { BentoDeckModule } from './components/BentoDeckModule';
import { BentoMasterHub } from './components/BentoMasterHub';
import { YouTubeBrowser } from './components/YouTubeBrowser';
import { engine } from './audio/engine';
import type { YouTubeResult } from './hooks/useYouTubeSearch';

export default function App() {
  const deckA = useStore((state) => state.deckA);
  const deckB = useStore((state) => state.deckB);
  const updateDeck = useStore((state) => state.updateDeck);
  const crossfader = useStore((state) => state.crossfader);
  const setCrossfader = useStore((state) => state.setCrossfader);

  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  const handleLoadTrack = (deckId: 'A' | 'B', track: YouTubeResult) => {
    updateDeck(deckId, {
      youtubeId: track.id,
      trackName: track.title,
      artist: track.artist,
      artworkUrl: track.thumbnail,
      duration: 230,
      playing: true,
    });
    setIsBrowserOpen(false);
  };

  const handleSearchSubmit = (query: string) => {
    // Check if query is a direct YouTube link
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = query.match(regExp);
    if (match && match[2].length === 11) {
      const videoId = match[2];
      // Load directly into the inactive or first deck
      const targetDeck = !deckA.playing ? 'A' : 'B';
      updateDeck(targetDeck, {
        youtubeId: videoId,
        trackName: 'YouTube Stream',
        artist: 'Lossless Audio',
        playing: true,
      });
    } else {
      setIsBrowserOpen(true);
    }
  };

  // Global DJ hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') {
        return;
      }
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
  }, [crossfader, updateDeck, deckA.playing, deckB.playing, setCrossfader]);

  return (
    <div className="bg-[#0b0c10] font-body-md text-zinc-100 antialiased selection:bg-zinc-700 selection:text-white min-h-screen relative overflow-x-hidden">
      {/* Dynamic Animated WebGL Shader Background */}
      <WebGLShaderBackground />

      {/* Shell Navigation Sidebar */}
      <Sidebar onOpenLibrary={() => setIsBrowserOpen(true)} />

      {/* Main Bento Studio Canvas */}
      <div className="pl-56 relative z-10">
        <main className="w-full min-h-screen px-6 py-5 flex flex-col gap-4">
          {/* BENTO TOP BAR: BRAND + YOUTUBE SOURCE BAR + METADATA STRIP */}
          <BentoTopBar
            onSearchSubmit={handleSearchSubmit}
            onOpenBrowser={() => setIsBrowserOpen(true)}
          />

          {/* BENTO ROW 2: ACOUSTIC SPECTRUM & WAVEFORM OBSERVATION CARD */}
          <SpectrumObservationCard />

          {/* BENTO ROW 3: SYMMETRICAL STUDIO CONSOLE (DECK A | HUB | DECK B) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* DECK A (lg:col-span-5) */}
            <BentoDeckModule id="A" />

            {/* MASTER HUB (lg:col-span-2) */}
            <BentoMasterHub />

            {/* DECK B (lg:col-span-5) */}
            <BentoDeckModule id="B" />
          </div>
        </main>
      </div>

      {/* Dedicated YouTube Search & Crates Drawer */}
      <YouTubeBrowser
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        onLoadTrack={handleLoadTrack}
      />
    </div>
  );
}
