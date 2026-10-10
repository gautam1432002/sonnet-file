import { useEffect } from 'react';

// Idle palettes: Professional Cyan / Magenta / Blue
export const IDLE_ACCENTS = [
  '#00f3ff', // Cyan
  '#ff00ff', // Magenta
  '#0088ff', // Deep Blue
];

export function useAmbientColor(
  deckAPlaying: boolean,
  deckBPlaying: boolean,
  trackA: string | null,
  trackB: string | null,
) {
  useEffect(() => {
    // We enforce the professional sleek charcoal background statically.
    document.documentElement.style.setProperty('--bg-from', '#080808');
    document.documentElement.style.setProperty('--bg-via', '#121212');
    document.documentElement.style.setProperty('--bg-to', '#1a1a1a');

    let accent = '#00f3ff'; // default cyan
    if (deckAPlaying && deckBPlaying) {
      accent = '#ff00ff'; // Both playing: Magenta
    } else if (deckAPlaying) {
      accent = '#00f3ff'; // Deck A playing: Cyan
    } else if (deckBPlaying) {
      accent = '#ff00ff'; // Deck B playing: Magenta
    }

    document.documentElement.style.setProperty('--accent', accent);
  }, [deckAPlaying, deckBPlaying, trackA, trackB]);
}
