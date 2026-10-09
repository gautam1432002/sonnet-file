import { useStore } from '../store';
import { Knob } from './Knob';
import { StackedWaveform } from './StackedWaveform';

export function MixerUI() {
  const deckA = useStore(state => state.deckA);
  const deckB = useStore(state => state.deckB);
  const crossfader = useStore(state => state.crossfader);
  
  const updateDeck = useStore(state => state.updateDeck);
  const setCrossfader = useStore(state => state.setCrossfader);
  const crossfaderCurve = useStore(state => state.crossfaderCurve);
  const setCrossfaderCurve = useStore(state => state.setCrossfaderCurve);

  const renderEQs = (id: 'A' | 'B', state: typeof deckA) => (
    <div className="flex flex-col items-center gap-6">
      <Knob 
        label="Trim" 
        value={state.trim / 2}
        onChange={(v) => updateDeck(id, { trim: v * 2 })} 
        onDoubleClick={() => updateDeck(id, { trim: 1 })}
      />
      <Knob 
        label="High" 
        value={(state.eqHigh + 40) / 46}
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
        value={(state.filter + 1) / 2}
        onChange={(v) => updateDeck(id, { filter: (v * 2) - 1 })} 
        onDoubleClick={() => updateDeck(id, { filter: 0 })}
        size={56}
      />
    </div>
  );

  const renderFader = (id: 'A' | 'B', state: typeof deckA) => (
    <div className="flex items-center gap-2 mt-4">
      {/* Fake VU meter */}
      <div className="flex flex-col gap-[2px] w-3 h-48 bg-black/60 p-1 rounded-sm overflow-hidden justify-end">
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
      <div className="h-48 flex items-center justify-center group">
        <input 
          type="range" 
          min="0" max="1" step="0.01" 
          value={state.volume}
          onChange={(e) => updateDeck(id, { volume: parseFloat(e.target.value) })}
          onDoubleClick={() => updateDeck(id, { volume: 1 })}
          className="h-32 -rotate-90 appearance-none bg-transparent cursor-pointer"
          style={{ width: '160px' }}
        />
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-4 flex flex-col gap-6 items-center justify-between h-full bg-[#111]">
      <div className="w-full flex justify-between items-start gap-4">
        
        {/* Left EQs */}
        {renderEQs('A', deckA)}
        {renderFader('A', deckA)}
        
        {/* Central Waveform */}
        <div className="flex-1 flex flex-col pt-4">
          <StackedWaveform />
          
          <div className="w-full flex flex-col items-center gap-2 mt-8">
            <div className="flex justify-between w-full px-4 text-[10px] font-bold tracking-widest text-gray-500">
              <span>A</span>
              <span>CROSSFADER</span>
              <span>B</span>
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={crossfader}
              onChange={(e) => setCrossfader(parseFloat(e.target.value))}
              onDoubleClick={() => setCrossfader(0.5)}
              className="w-full max-w-sm appearance-none bg-[#222] h-2 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-12 [&::-webkit-slider-thumb]:bg-[#333] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#555] [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
            />
          </div>
        </div>

        {/* Right EQs */}
        {renderFader('B', deckB)}
        {renderEQs('B', deckB)}
        
      </div>
    </div>
  );
}
