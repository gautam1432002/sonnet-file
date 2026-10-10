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

      if (left > peakHold.current.left) { peakHold.current.left = left; peakHold.current.holdTimeL = 1000; }
      else { peakHold.current.holdTimeL -= dt; if (peakHold.current.holdTimeL <= 0) peakHold.current.left = Math.max(0, peakHold.current.left - 0.05); }

      if (right > peakHold.current.right) { peakHold.current.right = right; peakHold.current.holdTimeR = 1000; }
      else { peakHold.current.holdTimeR -= dt; if (peakHold.current.holdTimeR <= 0) peakHold.current.right = Math.max(0, peakHold.current.right - 0.05); }

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
    if (!success) alert('Master output device change failed or not supported.');
  };

  const renderMeter = (val: number, peak: number, isClip: boolean) => {
    const segments = 16;
    return (
      <div className="flex flex-col gap-px w-3 justify-end" style={{ height: '100px' }}>
        {/* Clip dot */}
        <div className={`w-3 h-1 rounded-sm mb-0.5 transition-colors ${isClip ? 'bg-red-500 shadow-[0_0_6px_red]' : 'bg-white/5'}`} />
        {Array.from({ length: segments }).map((_, i) => {
          const threshold = (segments - i) / segments;
          const isLit = val >= threshold;
          const isPeak = Math.abs(peak - threshold) < (1 / segments);
          const color = i < 3 ? '#ef4444' : i < 6 ? '#eab308' : 'var(--accent)';
          return (
            <div
              key={i}
              className="w-3 flex-1 rounded-sm transition-all duration-75"
              style={{
                background: isPeak ? color : isLit ? color : 'rgba(255,255,255,0.04)',
                opacity: isLit || isPeak ? 1 : 0.3,
                boxShadow: isLit && i >= 6 ? `0 0 4px var(--accent)` : 'none',
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase">Master</span>

      <div className="flex items-end gap-2 justify-center">
        {renderMeter(level.left, peakHold.current.left, clip.current.left)}
        {renderMeter(level.right, peakHold.current.right, clip.current.right)}
        <Knob
          label="Vol"
          value={masterVolume}
          onChange={setMasterVolume}
          onDoubleClick={() => setMasterVolume(1)}
          size={40}
        />
      </div>

      {devices.length > 0 && (
        <div className="flex flex-col gap-1 mt-auto">
          <span className="text-[9px] text-white/20 font-mono">OUTPUT</span>
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
      )}
    </div>
  );
}
