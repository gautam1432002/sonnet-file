import React, { useEffect, useState } from 'react';
import { cueSystem } from '../audio/cue';
import { useStore } from '../store';

export function CueUI() {
  const deckACue = useStore(state => state.deckA.cueOn);
  const deckBCue = useStore(state => state.deckB.cueOn);
  const updateDeck = useStore(state => state.updateDeck);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('default');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      setDevices(devs.filter(d => d.kind === 'audiooutput'));
    }).catch(console.error);
    if (!('setSinkId' in HTMLAudioElement.prototype)) setSupported(false);
  }, []);

  const handleDeviceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDevice(id);
    const success = await cueSystem.setSinkId(id);
    if (!success) alert('Cue output device change failed.');
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase">Cue / Headphones</span>

      {!supported ? (
        <p className="text-[10px] text-red-400/70 bg-red-400/10 p-2 rounded-lg leading-relaxed">
          Browser doesn't support secondary audio outputs.
        </p>
      ) : devices.length <= 1 ? (
        <p className="text-[10px] text-yellow-400/60 bg-yellow-400/10 p-2 rounded-lg leading-relaxed">
          Connect headphones to enable cue monitoring.
        </p>
      ) : (
        <>
          <div className="flex gap-2 justify-center">
            {(['A', 'B'] as const).map(deck => {
              const isOn = deck === 'A' ? deckACue : deckBCue;
              return (
                <button
                  key={deck}
                  onClick={() => updateDeck(deck, { cueOn: !isOn })}
                  className="flex-1 py-2 rounded-lg font-bold text-xs transition-all"
                  style={{
                    background: isOn ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isOn ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
                    color: isOn ? '#000' : 'rgba(255,255,255,0.4)',
                    boxShadow: isOn ? '0 0 12px var(--accent)' : 'none',
                  }}
                >
                  CUE {deck}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1 mt-auto">
            <span className="text-[9px] text-white/20 font-mono">CUE OUTPUT</span>
            <select
              value={selectedDevice}
              onChange={handleDeviceChange}
              className="text-[10px] rounded px-1 py-1 outline-none w-full"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Device ${d.deviceId.slice(0, 8)}...`}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
