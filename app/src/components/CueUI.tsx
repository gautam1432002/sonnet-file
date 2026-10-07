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

    navigator.mediaDevices.addEventListener('devicechange', () => {
      navigator.mediaDevices.enumerateDevices().then(devs => {
        setDevices(devs.filter(d => d.kind === 'audiooutput'));
      });
    });
    
    // Check if setSinkId is supported on Audio element
    if (!('setSinkId' in HTMLAudioElement.prototype)) {
      setSupported(false);
    }
  }, []);

  const handleDeviceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDevice(id);
    const success = await cueSystem.setSinkId(id);
    if (!success) {
      alert('Cue output device change failed. Make sure you select a different device from the master.');
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col gap-4">
      <h3 className="font-bold text-[var(--accent)] uppercase tracking-wider text-sm">Headphones (Cue)</h3>
      
      {!supported ? (
        <div className="text-red-400 text-xs flex-1 bg-red-400/10 p-2 rounded">
          Your browser does not support secondary audio outputs (setSinkId). Cue monitoring disabled.
        </div>
      ) : devices.length <= 1 ? (
        <div className="text-yellow-400 text-xs flex-1 bg-yellow-400/10 p-2 rounded">
          Only one audio output detected. Connect headphones to use cue monitoring.
        </div>
      ) : (
        <>
          <div className="flex gap-4 flex-1 items-center justify-center">
            <button 
              onClick={() => updateDeck('A', { cueOn: !deckACue })}
              className={`w-16 h-12 rounded font-bold transition-colors ${deckACue ? 'bg-[var(--accent)] text-[#0b1026]' : 'bg-black/50 border border-[var(--glass-border)]'}`}
            >
              CUE A
            </button>
            <button 
              onClick={() => updateDeck('B', { cueOn: !deckBCue })}
              className={`w-16 h-12 rounded font-bold transition-colors ${deckBCue ? 'bg-[var(--accent)] text-[#0b1026]' : 'bg-black/50 border border-[var(--glass-border)]'}`}
            >
              CUE B
            </button>
          </div>
          
          <div className="flex flex-col gap-1 mt-auto">
            <label className="text-xs text-gray-400">Cue Device</label>
            <select 
              value={selectedDevice} 
              onChange={handleDeviceChange}
              className="bg-black/50 border border-[var(--glass-border)] rounded px-2 py-1 text-sm outline-none w-full"
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Device ${d.deviceId}`}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
