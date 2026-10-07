import React, { useEffect, useState, useRef } from 'react';
import { engine } from '../audio/engine';
import { useStore } from '../store';
import { Knob } from './Knob';

export function MasterUI() {
  const masterVolume = useStore(state => state.masterVolume);
  const setMasterVolume = useStore(state => state.setMasterVolume);
  
  const [level, setLevel] = useState({ left: 0, right: 0 });
  const peakHold = useRef({ left: 0, right: 0, holdTimeL: 0, holdTimeR: 0 });
  const clip = useRef({ left: false, right: false, clipTimeL: 0, clipTimeR: 0 });
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('default');

  useEffect(() => {
    // Poll devices
    navigator.mediaDevices.enumerateDevices().then(devs => {
      setDevices(devs.filter(d => d.kind === 'audiooutput'));
    }).catch(console.error);

    navigator.mediaDevices.addEventListener('devicechange', () => {
      navigator.mediaDevices.enumerateDevices().then(devs => {
        setDevices(devs.filter(d => d.kind === 'audiooutput'));
      });
    });
  }, []);

  useEffect(() => {
    let handle: number;
    let lastTime = performance.now();
    
    const loop = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      
      const { left, right } = engine.getMasterLevel();
      
      // Update peaks
      if (left > peakHold.current.left) {
        peakHold.current.left = left;
        peakHold.current.holdTimeL = 1000; // hold 1s
      } else {
        peakHold.current.holdTimeL -= dt;
        if (peakHold.current.holdTimeL <= 0) {
          peakHold.current.left = Math.max(0, peakHold.current.left - 0.05); // decay
        }
      }
      
      if (right > peakHold.current.right) {
        peakHold.current.right = right;
        peakHold.current.holdTimeR = 1000;
      } else {
        peakHold.current.holdTimeR -= dt;
        if (peakHold.current.holdTimeR <= 0) {
          peakHold.current.right = Math.max(0, peakHold.current.right - 0.05);
        }
      }
      
      // Clip check (approx, > 0.99)
      if (left > 0.99) { clip.current.left = true; clip.current.clipTimeL = 500; }
      else if (clip.current.clipTimeL > 0) clip.current.clipTimeL -= dt;
      else clip.current.left = false;
      
      if (right > 0.99) { clip.current.right = true; clip.current.clipTimeR = 500; }
      else if (clip.current.clipTimeR > 0) clip.current.clipTimeR -= dt;
      else clip.current.right = false;
      
      setLevel({ left, right });
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(handle);
  }, []);

  const handleDeviceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDevice(id);
    const success = await engine.setSinkId(id);
    if (!success) {
      alert('Master output device change failed or is not supported by your browser.');
    }
  };

  const renderMeter = (val: number, peak: number, isClip: boolean) => {
    const height = 200;
    const vH = Math.min(1, val) * height;
    const pH = Math.min(1, peak) * height;
    return (
      <div className="relative w-4 h-[200px] bg-black/40 rounded-sm overflow-hidden flex flex-col justify-end">
        {/* Clip indicator */}
        <div className={`absolute top-0 left-0 w-full h-2 ${isClip ? 'bg-red-500' : 'bg-transparent'} transition-colors`} />
        
        {/* Peak hold */}
        <div className="absolute w-full h-1 bg-[var(--accent)]" style={{ bottom: pH }} />
        
        {/* Active level */}
        <div 
          className="w-full bg-gradient-to-t from-green-500 via-yellow-400 to-red-500" 
          style={{ height: vH }}
        />
      </div>
    );
  };

  return (
    <div className="glass-panel p-4 flex flex-col gap-4">
      <h3 className="font-bold text-[var(--accent)] uppercase tracking-wider text-sm">Master Output</h3>
      
      <div className="flex gap-6 justify-center flex-1 items-center">
        <div className="flex flex-col items-center gap-2">
          <Knob 
            label="Volume" 
            value={masterVolume} 
            onChange={setMasterVolume} 
            onDoubleClick={() => setMasterVolume(1)} 
          />
        </div>
        
        <div className="flex gap-1">
          {renderMeter(level.left, peakHold.current.left, clip.current.left)}
          {renderMeter(level.right, peakHold.current.right, clip.current.right)}
        </div>
      </div>
      
      <div className="flex flex-col gap-1 mt-auto">
        <label className="text-xs text-gray-400">Master Device</label>
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
    </div>
  );
}
