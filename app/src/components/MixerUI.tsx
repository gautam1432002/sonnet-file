import { useStore } from '../store';
import { Knob } from './Knob';

export function MixerUI() {
  const deckA = useStore(state => state.deckA);
  const deckB = useStore(state => state.deckB);
  const crossfader = useStore(state => state.crossfader);
  
  const updateDeck = useStore(state => state.updateDeck);
  const setCrossfader = useStore(state => state.setCrossfader);
  const crossfaderCurve = useStore(state => state.crossfaderCurve);
  const setCrossfaderCurve = useStore(state => state.setCrossfaderCurve);

  const renderDeckStrip = (id: 'A' | 'B', state: typeof deckA) => (
    <div className="flex flex-col items-center gap-6">
      <div className="text-xl font-bold opacity-50">{id}</div>
      <Knob 
        label="Trim" 
        value={state.trim / 2} // map 0-2 to 0-1
        onChange={(v) => updateDeck(id, { trim: v * 2 })} 
        onDoubleClick={() => updateDeck(id, { trim: 1 })}
      />
      <Knob 
        label="High" 
        value={(state.eqHigh + 40) / 46} // map -40..6 to 0-1. Center (0dB) = 40/46 = ~0.87
        onChange={(v) => updateDeck(id, { eqHigh: (v * 46) - 40 })} 
        onDoubleClick={() => updateDeck(id, { eqHigh: 0 })}
      />
      <Knob 
        label="Mid" 
        value={(state.eqMid + 40) / 46}
        onChange={(v) => updateDeck(id, { eqMid: (v * 46) - 40 })} 
        onDoubleClick={() => updateDeck(id, { eqMid: 0 })}
      />
      <Knob 
        label="Low" 
        value={(state.eqLow + 40) / 46}
        onChange={(v) => updateDeck(id, { eqLow: (v * 46) - 40 })} 
        onDoubleClick={() => updateDeck(id, { eqLow: 0 })}
      />
      <Knob 
        label="Filter" 
        value={(state.filter + 1) / 2} // -1..1 to 0..1
        onChange={(v) => updateDeck(id, { filter: (v * 2) - 1 })} 
        onDoubleClick={() => updateDeck(id, { filter: 0 })}
        size={56}
      />
      
      {/* Channel Fader & Meter */}
      <div className="flex items-center gap-4 mt-4">
        {/* Fake VU meter */}
        <div className="flex flex-col gap-[2px] w-3 h-32 bg-black/60 p-1 rounded-sm overflow-hidden justify-end">
          {Array.from({ length: 15 }).map((_, i) => {
            const isLit = state.playing && (15 - i) <= state.volume * 15 * (state.trim / 2 + 0.5);
            return (
              <div 
                key={i} 
                className={`w-full flex-1 rounded-sm transition-colors ${isLit ? (i < 3 ? 'bg-red-500 shadow-[0_0_5px_red]' : i < 6 ? 'bg-yellow-400 shadow-[0_0_5px_yellow]' : 'bg-green-500 shadow-[0_0_5px_green]') : 'bg-white/5'}`} 
              />
            );
          })}
        </div>
        <div className="h-40 flex items-center justify-center group">
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            value={state.volume}
            onChange={(e) => updateDeck(id, { volume: parseFloat(e.target.value) })}
            onDoubleClick={() => updateDeck(id, { volume: 1 })}
            className="h-32 -rotate-90 appearance-none bg-transparent cursor-pointer"
            style={{ width: '128px' }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="glass-panel p-6 flex flex-col gap-8 items-center justify-between h-full bg-gradient-to-b from-black/20 to-black/40">
      <div className="flex w-full justify-around items-start">
        {renderDeckStrip('A', deckA)}
        {renderDeckStrip('B', deckB)}
      </div>

      <div className="w-full flex flex-col items-center gap-4 border-t border-[var(--glass-border)] pt-6">
        <div className="flex justify-between w-full px-4 text-xs font-semibold tracking-widest uppercase opacity-70">
          <span>A</span>
          <span>X-FADER</span>
          <span>B</span>
        </div>
        <input 
          type="range" 
          min="0" max="1" step="0.01" 
          value={crossfader}
          onChange={(e) => setCrossfader(parseFloat(e.target.value))}
          onDoubleClick={() => setCrossfader(0.5)}
          className="w-full max-w-sm appearance-none bg-black/40 h-2 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-10 [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <div className="flex gap-4">
          <label className="text-xs flex items-center gap-1 cursor-pointer">
            <input type="radio" checked={crossfaderCurve === 'equal_power'} onChange={() => setCrossfaderCurve('equal_power')} /> Equal Power
          </label>
          <label className="text-xs flex items-center gap-1 cursor-pointer">
            <input type="radio" checked={crossfaderCurve === 'sharp_cut'} onChange={() => setCrossfaderCurve('sharp_cut')} /> Sharp Cut
          </label>
        </div>
      </div>
    </div>
  );
}
