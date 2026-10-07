import { create } from 'zustand';
import type { CrossfaderCurve } from './audio/crossfader';
import { getCrossfaderGains } from './audio/crossfader';
import { Deck } from './audio/deck';
import { engine } from './audio/engine';

export interface DeckState {
  trackName: string | null;
  duration: number;
  playing: boolean;
  trim: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  filter: number;
  volume: number;
  cueOn: boolean;
}

const initialDeckState: DeckState = {
  trackName: null,
  duration: 0,
  playing: false,
  trim: 1, // 0 to 2
  eqLow: 0, // -40 to 6
  eqMid: 0,
  eqHigh: 0,
  filter: 0, // -1 to 1
  volume: 1, // 0 to 1
  cueOn: false,
};

interface MixerState {
  theme: number;
  crossfader: number; // 0 to 1
  crossfaderCurve: CrossfaderCurve;
  masterVolume: number;
  deckA: DeckState;
  deckB: DeckState;
  
  setTheme: (theme: number) => void;
  setCrossfader: (val: number) => void;
  setCrossfaderCurve: (curve: CrossfaderCurve) => void;
  setMasterVolume: (val: number) => void;
  
  updateDeck: (deckId: 'A' | 'B', updates: Partial<DeckState>) => void;
}

export const deckAObj = new Deck('A');
export const deckBObj = new Deck('B');

export const useStore = create<MixerState>((set, get) => ({
  theme: Number(localStorage.getItem('sonnet_theme')) || 1,
  crossfader: 0.5,
  crossfaderCurve: 'equal_power',
  masterVolume: 1,
  
  deckA: { ...initialDeckState },
  deckB: { ...initialDeckState },
  
  setTheme: (theme) => {
    localStorage.setItem('sonnet_theme', String(theme));
    document.documentElement.setAttribute('data-theme', String(theme));
    set({ theme });
  },
  
  setCrossfader: (val) => {
    set({ crossfader: val });
    const { crossfaderCurve } = get();
    const gains = getCrossfaderGains(val, crossfaderCurve);
    deckAObj.setCrossfaderGain(gains.a);
    deckBObj.setCrossfaderGain(gains.b);
  },
  
  setCrossfaderCurve: (curve) => {
    set({ crossfaderCurve: curve });
    const { crossfader } = get();
    const gains = getCrossfaderGains(crossfader, curve);
    deckAObj.setCrossfaderGain(gains.a);
    deckBObj.setCrossfaderGain(gains.b);
  },
  
  setMasterVolume: (val) => {
    set({ masterVolume: val });
    engine.setMasterVolume(val);
  },
  
  updateDeck: (deckId, updates) => {
    set((state) => {
      const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
      const deckObj = deckId === 'A' ? deckAObj : deckBObj;
      const newState = { ...state[deckKey], ...updates };
      
      // Sync with audio engine
      if (updates.trim !== undefined) deckObj.setTrim(updates.trim);
      if (updates.eqLow !== undefined) deckObj.setEq('low', updates.eqLow);
      if (updates.eqMid !== undefined) deckObj.setEq('mid', updates.eqMid);
      if (updates.eqHigh !== undefined) deckObj.setEq('high', updates.eqHigh);
      if (updates.filter !== undefined) deckObj.setFilter(updates.filter);
      if (updates.volume !== undefined) deckObj.setVolume(updates.volume);
      if (updates.cueOn !== undefined) deckObj.setCue(updates.cueOn);
      
      if (updates.playing !== undefined) {
        if (updates.playing) deckObj.play();
        else deckObj.pause();
      }
      
      return { [deckKey]: newState };
    });
  }
}));

// Initialize gains based on default store state
const { crossfader, crossfaderCurve, masterVolume } = useStore.getState();
const initialGains = getCrossfaderGains(crossfader, crossfaderCurve);
deckAObj.setCrossfaderGain(initialGains.a);
deckBObj.setCrossfaderGain(initialGains.b);
engine.setMasterVolume(masterVolume);
