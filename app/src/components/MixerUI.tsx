import { useStore } from '../store';
import { Knob } from './Knob';
import { StackedWaveform } from './StackedWaveform';

export function MixerUI() {
  const deckA = useStore(s => s.deckA);
  const deckB = useStore(s => s.deckB);
  const crossfader = useStore(s => s.crossfader);
  const updateDeck = useStore(s => s.updateDeck);
  const setCrossfader = useStore(s => s.setCrossfader);
  const crossfaderCurve = useStore(s => s.crossfaderCurve);
  const setCrossfaderCurve = useStore(s => s.setCrossfaderCurve);

  const channelStrip = (id: 'A' | 'B', state: typeof deckA) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flex: 1 }}>
      {/* Label */}
      <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>
        {id}
      </span>

      {/* EQ Knobs */}
      {[
        { label: 'Hi',  val: (state.eqHigh + 40) / 46, set: (v: number) => updateDeck(id, { eqHigh: v * 46 - 40 }), rst: () => updateDeck(id, { eqHigh: 0 }) },
        { label: 'Mid', val: (state.eqMid  + 40) / 46, set: (v: number) => updateDeck(id, { eqMid:  v * 46 - 40 }), rst: () => updateDeck(id, { eqMid:  0 }) },
        { label: 'Lo',  val: (state.eqLow  + 40) / 46, set: (v: number) => updateDeck(id, { eqLow:  v * 46 - 40 }), rst: () => updateDeck(id, { eqLow:  0 }) },
      ].map(({ label, val, set, rst }) => (
        <Knob key={label} label={label} value={val} onChange={set} onDoubleClick={rst} size={44} />
      ))}

      {/* Divider */}
      <div style={{ width: '60%', height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* Filter */}
      <Knob
        label="Flt"
        value={(state.filter + 1) / 2}
        onChange={v => updateDeck(id, { filter: v * 2 - 1 })}
        onDoubleClick={() => updateDeck(id, { filter: 0 })}
        size={38}
      />

      {/* Trim */}
      <Knob
        label="Trim"
        value={state.trim / 2}
        onChange={v => updateDeck(id, { trim: v * 2 })}
        onDoubleClick={() => updateDeck(id, { trim: 1 })}
        size={34}
      />

      {/* VU + Volume fader */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        {/* VU bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 8, height: 112, justifyContent: 'flex-end' }}>
          {Array.from({ length: 10 }).map((_, i) => {
            const lit = state.playing && (10 - i) <= state.volume * 10 * (state.trim / 2 + 0.5);
            const color = i < 2 ? '#ef4444' : i < 4 ? '#eab308' : 'var(--accent)';
            return (
              <div key={i} style={{
                height: 9, borderRadius: 2,
                background: lit ? color : 'rgba(255,255,255,0.04)',
                boxShadow: lit && i >= 4 ? '0 0 4px var(--accent)' : 'none',
                transition: 'background 0.08s, box-shadow 0.08s',
              }} />
            );
          })}
        </div>
        {/* Volume fader */}
        <input
          type="range" min="0" max="1" step="0.01"
          value={state.volume}
          onChange={e => updateDeck(id, { volume: parseFloat(e.target.value) })}
          onDoubleClick={() => updateDeck(id, { volume: 1 })}
          className="v-fader"
        />
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Waveform */}
      <div style={{ padding: '12px 16px', flexShrink: 0 }}>
        <StackedWaveform />
      </div>

      {/* Channel strips + center */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', padding: '8px 8px 12px', gap: 0, overflow: 'hidden' }}>
        {channelStrip('A', deckA)}

        {/* Center column */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          padding: '24px 12px', borderLeft: '1px solid rgba(255,255,255,0.05)',
          borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em' }}>MIX</span>

          {/* Curve buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textAlign: 'center', letterSpacing: '0.1em' }}>CURVE</span>
            {(['equal_power', 'linear', 'scratch'] as const).map(c => (
              <button key={c} onClick={() => setCrossfaderCurve(c)} style={{
                padding: '3px 8px', borderRadius: 5, fontSize: 8, fontFamily: 'monospace',
                background: crossfaderCurve === c ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                color: crossfaderCurve === c ? '#000' : 'rgba(255,255,255,0.3)',
                border: `1px solid ${crossfaderCurve === c ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer', letterSpacing: '0.06em',
                transition: 'all 0.2s, background 3.5s ease',
              }}>
                {c === 'equal_power' ? 'EQ' : c.toUpperCase().slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Crossfader */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 2px' }}>
              <span style={{ fontSize: 8, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)' }}>A</span>
              <span style={{ fontSize: 8, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)' }}>B</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.01"
              value={crossfader}
              onChange={e => setCrossfader(parseFloat(e.target.value))}
              onDoubleClick={() => setCrossfader(0.5)}
              className="h-fader"
              style={{ width: 120 }}
            />
            <span style={{ fontSize: 8, fontFamily: 'monospace', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.12em' }}>
              XFADE
            </span>
          </div>
        </div>

        {channelStrip('B', deckB)}
      </div>
    </div>
  );
}
