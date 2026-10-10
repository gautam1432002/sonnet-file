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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flex: 1 }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.2)' }}>{id}</span>

      {/* EQs & Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Knob label="TRIM" value={state.trim / 2} onChange={v => updateDeck(id, { trim: v * 2 })} onDoubleClick={() => updateDeck(id, { trim: 1 })} size={32} />
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
        <Knob label="HI" value={(state.eqHigh + 40) / 46} onChange={v => updateDeck(id, { eqHigh: v * 46 - 40 })} onDoubleClick={() => updateDeck(id, { eqHigh: 0 })} size={40} />
        <Knob label="MID" value={(state.eqMid + 40) / 46} onChange={v => updateDeck(id, { eqMid: v * 46 - 40 })} onDoubleClick={() => updateDeck(id, { eqMid: 0 })} size={40} />
        <Knob label="LOW" value={(state.eqLow + 40) / 46} onChange={v => updateDeck(id, { eqLow: v * 46 - 40 })} onDoubleClick={() => updateDeck(id, { eqLow: 0 })} size={40} />
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
        <Knob label="FLT" value={(state.filter + 1) / 2} onChange={v => updateDeck(id, { filter: v * 2 - 1 })} onDoubleClick={() => updateDeck(id, { filter: 0 })} size={48} />
      </div>

      {/* Fader & VU meter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, height: 140 }}>
        {/* VU meter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const level = state.volume * 12 * (state.trim / 2 + 0.5);
            const lit = state.playing && (12 - i) <= level;
            const color = i < 2 ? '#ff3333' : i < 4 ? '#ff9933' : '#33ff99';
            return (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: 1,
                background: lit ? color : 'rgba(255,255,255,0.05)',
                boxShadow: lit ? `0 0 8px ${color}` : 'none',
                transition: 'background 0.05s ease-out'
              }} />
            );
          })}
        </div>
        {/* Vertical Volume Fader */}
        <input type="range" min="0" max="1" step="0.01" value={state.volume}
          onChange={e => updateDeck(id, { volume: parseFloat(e.target.value) })}
          onDoubleClick={() => updateDeck(id, { volume: 1 })}
          className="v-fader" style={{ height: '100%' }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Top Waveform Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <StackedWaveform />
      </div>

      {/* Mixer Body */}
      <div style={{ flex: 1, display: 'flex', padding: '20px 10px', overflow: 'hidden' }}>
        
        {channelStrip('A', deckA)}

        {/* Center Crossfader/Curve area */}
        <div style={{
          flexShrink: 0, width: 140, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-end', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)',
          paddingBottom: 20
        }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 40 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: '0.1em', fontWeight: 600 }}>CF CURVE</span>
            {(['equal_power', 'linear', 'scratch'] as const).map(c => (
              <button key={c} onClick={() => setCrossfaderCurve(c)} style={{
                padding: '6px 10px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                background: crossfaderCurve === c ? 'var(--accent)' : 'transparent',
                color: crossfaderCurve === c ? '#000' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${crossfaderCurve === c ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer', transition: 'all 0.2s'
              }}>
                {c === 'equal_power' ? 'EQ POWER' : c.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ width: '100%', padding: '0 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>A</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>B</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" value={crossfader}
              onChange={e => setCrossfader(parseFloat(e.target.value))}
              onDoubleClick={() => setCrossfader(0.5)}
              className="h-fader" style={{ width: '100%' }}
            />
          </div>

        </div>

        {channelStrip('B', deckB)}
        
      </div>
    </div>
  );
}
