import { useEffect, useRef } from 'react';

// Deterministic hash from a string → number 0..1
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash) / 2147483647;
}

// Generate a vibrant gradient palette from a track name
function trackToGradient(trackName: string): { from: string; via: string; to: string } {
  const h = hashString(trackName);
  const hue = Math.floor(h * 360);
  const hue2 = (hue + 40) % 360;
  const hue3 = (hue + 80) % 360;

  return {
    from: `hsl(${hue}, 80%, 8%)`,
    via:  `hsl(${hue2}, 70%, 16%)`,
    to:   `hsl(${hue3}, 60%, 24%)`,
  };
}

// Idle palettes: vibrant, cycling color schemes
export const IDLE_PALETTES = [
  // Green + Yellow + Cyan
  { from: '#001a0d', via: '#00591a', to: '#00c896', accent: '#39ff14' },
  // Purple + Violet + Indigo
  { from: '#0d001a', via: '#4a0080', to: '#7c3aed', accent: '#c084fc' },
  // Pink + Sky Blue + Lavender
  { from: '#1a001a', via: '#c026a0', to: '#38bdf8', accent: '#f0abfc' },
  // Electric Blue + Cyan + Teal
  { from: '#000d1a', via: '#0066cc', to: '#00d4ff', accent: '#67e8f9' },
];

export interface AmbientColors {
  from: string;
  via: string;
  to: string;
  accent: string;
}

export function useAmbientColor(
  deckAPlaying: boolean,
  deckBPlaying: boolean,
  trackA: string | null,
  trackB: string | null,
) {
  const paletteIndexRef = useRef(0);
  const paletteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const isAnySongPlaying = deckAPlaying || deckBPlaying;

    if (isAnySongPlaying) {
      // Stop idle cycling
      if (paletteTimerRef.current) {
        clearInterval(paletteTimerRef.current);
        paletteTimerRef.current = null;
      }

      // Determine color from the playing track(s)
      const activeTrack = (deckAPlaying && trackA) ? trackA : (deckBPlaying && trackB) ? trackB : null;

      if (activeTrack) {
        const { from, via, to } = trackToGradient(activeTrack);
        const h = hashString(activeTrack);
        const accentHue = Math.floor(h * 360 + 160) % 360;
        const accent = `hsl(${accentHue}, 100%, 72%)`;

        document.documentElement.style.setProperty('--bg-from', from);
        document.documentElement.style.setProperty('--bg-via', via);
        document.documentElement.style.setProperty('--bg-to', to);
        document.documentElement.style.setProperty('--accent', accent);
        document.documentElement.style.setProperty('--ambient-speed', '8s');
      }
    } else {
      // Idle: cycle through palettes
      document.documentElement.style.setProperty('--ambient-speed', '18s');

      const applyPalette = (idx: number) => {
        const p = IDLE_PALETTES[idx % IDLE_PALETTES.length];
        document.documentElement.style.setProperty('--bg-from', p.from);
        document.documentElement.style.setProperty('--bg-via', p.via);
        document.documentElement.style.setProperty('--bg-to', p.to);
        document.documentElement.style.setProperty('--accent', p.accent);
      };

      // Apply current palette immediately
      applyPalette(paletteIndexRef.current);

      if (!paletteTimerRef.current) {
        paletteTimerRef.current = setInterval(() => {
          paletteIndexRef.current = (paletteIndexRef.current + 1) % IDLE_PALETTES.length;
          applyPalette(paletteIndexRef.current);
        }, 8000); // Switch every 8 seconds
      }
    }

    return () => {
      // Cleanup on unmount only
    };
  }, [deckAPlaying, deckBPlaying, trackA, trackB]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (paletteTimerRef.current) clearInterval(paletteTimerRef.current);
    };
  }, []);
}
