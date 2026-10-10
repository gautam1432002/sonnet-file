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

  const renderChannel = (id: 'A' | 'B', state: typeof deckA) => (
    <div className="flex flex-col items-center gap-4 px-2">
      {/* Channel label */}
      <span className="text-[10px] font-mono tracking-widest text-white/30">{id}</span>

      {/* EQ Knobs */}
      <div className="flex flex-col gap-4">
        <Knob
          label="Hi"
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
          label="Lo"
          value={(state.eqLow + 40) / 46}
          onChange={(v) => updateDeck(id, { eqLow: (v * 46) - 40 })}
          onDoubleClick={() => updateDeck(id, { eqLow: 0 })}
        />
      </div>

      {/* Filter Knob */}
      <div className="border-t border-white/5 pt-3 w-full flex justify-center">
        <Knob
          label="Flt"
          value={(state.filter + 1) / 2}
          onChange={(v) => updateDeck(id, { filter: (v * 2) - 1 })}
          onDoubleClick={() => updateDeck(id, { filter: 0 })}
          size={44}
        />
      </div>

      {/* Trim + VU + Volume Fader */}
      <div className="border-t border-white/5 pt-3 w-full flex flex-col items-center gap-2">
        <Knob
          label="Trim"
          value={state.trim / 2}
          onChange={(v) => updateDeck(id, { trim: v * 2 })}
          onDoubleClick={() => updateDeck(id, { trim: 1 })}
          size={36}
        />

        {/* VU + Fader side by side */}
        <div className="flex items-end gap-1 mt-1">
          {/* Mini VU meter */}
          <div className="flex flex-col gap-px w-2 h-32 justify-end">
            {Array.from({ length: 12 }).map((_, i) => {
              const isLit = state.playing && (12 - i) <= state.volume * 12 * (state.trim / 2 + 0.5);
              return (
                <div
                  key={i}
                  className="w-full flex-1 rounded-sm transition-all duration-75"
                  style={{
                    background: isLit
                      ? i < 2 ? '#ef4444' : i < 4 ? '#eab308' : 'var(--accent)'
                      : 'rgba(255,255,255,0.04)',
                    boxShadow: isLit && i >= 4 ? '0 0 4px var(--accent)' : 'none',
                  }}
                />
              );
            })}
          </div>

          {/* Volume fader */}
          <input
            type="range"
            min="0" max="1" step="0.01"
            value={state.volume}
            onChange={(e) => updateDeck(id, { volume: parseFloat(e.target.value) })}
            onDoubleClick={() => updateDeck(id, { volume: 1 })}
            className="vertical"
            style={{ height: '128px' }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(16px)' }}>
      {/* Waveform area */}
      <div className="p-4 border-b border-white/5">
        <StackedWaveform />
      </div>

      {/* Channel strips */}
      <div className="flex-1 flex justify-center items-start gap-4 p-4 overflow-y-auto">
        {renderChannel('A', deckA)}

        {/* Center section */}
        <div className="flex flex-col items-center gap-6 px-4 border-x border-white/5">
          <span className="text-[10px] font-mono tracking-widest text-white/20 mt-5">MIX</span>

          {/* Crossfader curve selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-white/20 text-center font-mono">CURVE</span>
            {(['equal_power', 'linear', 'scratch'] as const).map(curve => (
              <button
                key={curve}
                onClick={() => setCrossfaderCurve(curve)}
                className="px-2 py-0.5 rounded text-[9px] font-mono transition-all"
                style={{
                  background: crossfaderCurve === curve ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                  color: crossfaderCurve === curve ? '#000' : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${crossfaderCurve === curve ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {curve === 'equal_power' ? 'EQ PWR' : curve.charAt(0).toUpperCase() + curve.slice(1)}
              </button>
            ))}
          </div>

          {/* Crossfader */}
          <div className="flex flex-col items-center gap-2 mt-auto pb-4">
            <div className="flex justify-between w-full text-[9px] font-mono text-white/20 px-1">
              <span>A</span>
              <span>XFADE</span>
              <span>B</span>
            </div>
            <input
              type="range"
              min="0" max="1" step="0.01"
              value={crossfader}
              onChange={(e) => setCrossfader(parseFloat(e.target.value))}
              onDoubleClick={() => setCrossfader(0.5)}
              className="horizontal"
              style={{ width: '140px' }}
            />
          </div>
        </div>

        {renderChannel('B', deckB)}
      </div>
    </div>
  );
}
