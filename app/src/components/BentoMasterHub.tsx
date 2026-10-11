import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import { engine } from '../audio/engine';
import type { CrossfaderCurve } from '../audio/crossfader';

export const BentoMasterHub: React.FC = () => {
  const masterVolume = useStore((s) => s.masterVolume);
  const setMasterVolume = useStore((s) => s.setMasterVolume);
  const crossfader = useStore((s) => s.crossfader);
  const setCrossfader = useStore((s) => s.setCrossfader);
  const crossfaderCurve = useStore((s) => s.crossfaderCurve);
  const setCrossfaderCurve = useStore((s) => s.setCrossfaderCurve);

  const [levels, setLevels] = useState({ left: 0, right: 0 });
  const [cueMix, setCueMix] = useState(0.5);
  const [boothGain, setBoothGain] = useState(1.5);
  const animRef = useRef<number>(0);

  // Monitor engine master levels for high precision VU meters
  useEffect(() => {
    const updateMeter = () => {
      const { left, right } = engine.getMasterLevel();
      setLevels({ left, right });
      animRef.current = requestAnimationFrame(updateMeter);
    };
    animRef.current = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Map 0..1 level to 0..11 active segments
  const activeSegmentsL = Math.min(11, Math.round(levels.left * 11));
  const activeSegmentsR = Math.min(11, Math.round(levels.right * 11));

  // 11 segments configured from top (high/rose) to bottom (low/emerald)
  const segmentsConfig = [
    { type: 'rose', bgLit: 'bg-rose-500', bgDim: 'bg-rose-500/20' },
    { type: 'rose', bgLit: 'bg-rose-500', bgDim: 'bg-rose-500/20' },
    { type: 'amber', bgLit: 'bg-amber-400', bgDim: 'bg-amber-400/20' },
    { type: 'amber', bgLit: 'bg-amber-400', bgDim: 'bg-amber-400/20' },
    { type: 'emerald', bgLit: 'bg-emerald-400', bgDim: 'bg-emerald-400/20' },
    { type: 'emerald', bgLit: 'bg-emerald-400', bgDim: 'bg-emerald-400/20' },
    { type: 'emerald', bgLit: 'bg-emerald-400', bgDim: 'bg-emerald-400/20' },
    { type: 'emerald', bgLit: 'bg-emerald-400/80', bgDim: 'bg-emerald-400/20' },
    { type: 'emerald', bgLit: 'bg-emerald-400/60', bgDim: 'bg-emerald-400/20' },
    { type: 'emerald', bgLit: 'bg-emerald-400/40', bgDim: 'bg-emerald-400/20' },
    { type: 'emerald', bgLit: 'bg-emerald-400/20', bgDim: 'bg-emerald-400/10' },
  ];

  // Helper for crossfader position
  const crossfaderPercent = crossfader * 100;

  // Master Volume dB readout
  const masterDbReadout = masterVolume >= 0.99 ? "0.0" : ((masterVolume - 1.0) * 18).toFixed(1);

  return (
    <div className="lg:col-span-2 bento-card rounded-2xl p-4 flex flex-col justify-between items-center gap-4 select-none">
      {/* Section Tag */}
      <div className="w-full flex items-center justify-between px-1">
        <span className="font-label-sm text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">
          MASTER HUB
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-400/80"></span>
      </div>

      {/* Twin High-Precision VU Meters & Master Level Slider */}
      <div className="w-full flex-1 flex items-center justify-between px-1 py-1">
        {/* Left Meter */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-label-sm text-[9px] text-zinc-400 font-mono">L</span>
          <div className="w-3 h-40 bg-zinc-950/80 border border-white/10 rounded-sm p-0.5 flex flex-col justify-between">
            {segmentsConfig.map((seg, i) => {
              const segIndex = 11 - i;
              const isLit = segIndex <= (activeSegmentsL || 7);
              return (
                <div
                  key={i}
                  className={`w-full h-1.5 rounded-xs transition-colors duration-75 ${
                    isLit ? seg.bgLit : seg.bgDim
                  }`}
                />
              );
            })}
          </div>
          <span className="font-label-sm text-[8px] text-zinc-500 font-mono">-3dB</span>
        </div>

        {/* Master Fader */}
        <div className="flex flex-col items-center gap-1 flex-1 px-2">
          <span className="font-label-sm text-[9px] text-zinc-200 font-mono font-semibold">
            MST
          </span>
          <div className="relative w-7 h-40 bg-zinc-950/80 border border-white/10 rounded-lg flex items-center justify-center py-2 shadow-inner">
            <div className="w-1 h-full bg-zinc-800 rounded-full"></div>
            {/* Machined Knob */}
            <div
              className="absolute w-6 h-6 rounded-md machined-slider border border-white/20 flex items-center justify-center cursor-ns-resize shadow-md transition-all"
              style={{
                top: `${Math.round(132 - masterVolume * 120)}px`,
              }}
            >
              <div className="w-3.5 h-0.5 bg-zinc-100 rounded-full"></div>
            </div>
            {/* Hidden Input for smooth drag */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ns-resize w-full h-full"
            />
          </div>
          <span className="font-label-sm text-[9px] text-zinc-200 font-mono font-semibold">
            {masterDbReadout}
          </span>
        </div>

        {/* Right Meter */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-label-sm text-[9px] text-zinc-400 font-mono">R</span>
          <div className="w-3 h-40 bg-zinc-950/80 border border-white/10 rounded-sm p-0.5 flex flex-col justify-between">
            {segmentsConfig.map((seg, i) => {
              const segIndex = 11 - i;
              const isLit = segIndex <= (activeSegmentsR || 5);
              return (
                <div
                  key={i}
                  className={`w-full h-1.5 rounded-xs transition-colors duration-75 ${
                    isLit ? seg.bgLit : seg.bgDim
                  }`}
                />
              );
            })}
          </div>
          <span className="font-label-sm text-[8px] text-zinc-500 font-mono">-6dB</span>
        </div>
      </div>

      {/* Booth & Cue Potentiometers */}
      <div className="w-full grid grid-cols-2 gap-1.5 bento-card-sub p-2 rounded-xl">
        <div className="flex flex-col items-center">
          <span className="font-label-sm text-[8px] text-zinc-400 uppercase">CUE MIX</span>
          <div
            className="w-7 h-7 rounded-full tactile-knob border border-white/10 flex items-center justify-center my-0.5 cursor-pointer"
            onClick={() => setCueMix((prev) => (prev === 0.5 ? 0.7 : 0.5))}
          >
            <div
              className="w-0.5 h-2.5 bg-zinc-200 rounded-full transition-transform"
              style={{ transform: `rotate(${(cueMix - 0.5) * 180}deg)` }}
            ></div>
          </div>
          <span className="font-label-sm text-[8px] text-zinc-400 font-mono">50/50</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="font-label-sm text-[8px] text-zinc-400 uppercase">BOOTH</span>
          <div
            className="w-7 h-7 rounded-full tactile-knob border border-white/10 flex items-center justify-center my-0.5 cursor-pointer"
            onClick={() => setBoothGain((prev) => (prev === 1.5 ? 0.0 : 1.5))}
          >
            <div
              className="w-0.5 h-2.5 bg-zinc-200 rounded-full transition-transform"
              style={{ transform: `rotate(${boothGain * 30}deg)` }}
            ></div>
          </div>
          <span className="font-label-sm text-[8px] text-zinc-400 font-mono">
            +{boothGain.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Horizontal Smooth Crossfader Base */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[9px] font-label-sm text-zinc-400 px-1">
          <span className="text-zinc-200 font-medium">CH A</span>
          <span className="text-zinc-500 font-mono">X-FADER</span>
          <span className="text-zinc-200 font-medium">CH B</span>
        </div>

        <div className="relative w-full h-9 bg-zinc-950/80 border border-white/10 rounded-lg flex items-center px-1.5 shadow-inner">
          <div className="absolute inset-x-2 h-1 bg-zinc-800 rounded-full"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20"></div>

          {/* Centered Crossfader Handle */}
          <div
            className="absolute w-7 h-7 rounded-md machined-slider border border-white/25 flex items-center justify-center cursor-ew-resize shadow-lg transition-all"
            style={{
              left: `calc(${crossfaderPercent}% - 14px)`,
            }}
          >
            <div className="w-0.5 h-4 bg-zinc-200 rounded-full"></div>
          </div>

          {/* Native range slider for smooth drag */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={crossfader}
            onChange={(e) => setCrossfader(parseFloat(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
          />
        </div>

        {/* Curve Selector */}
        <div className="flex items-center justify-between gap-1 text-[8px] font-label-sm pt-0.5">
          <button
            type="button"
            onClick={() => setCrossfaderCurve('sharp_cut' as CrossfaderCurve)}
            className={`flex-1 py-0.5 rounded transition-colors cursor-pointer ${
              crossfaderCurve === 'sharp_cut'
                ? 'bg-white/15 text-white font-medium border border-white/10'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white'
            }`}
          >
            CUT
          </button>
          <button
            type="button"
            onClick={() => setCrossfaderCurve('equal_power' as CrossfaderCurve)}
            className={`flex-1 py-0.5 rounded transition-colors cursor-pointer ${
              crossfaderCurve === 'equal_power'
                ? 'bg-white/15 text-white font-medium border border-white/10'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white'
            }`}
          >
            SMOOTH
          </button>
          <button
            type="button"
            onClick={() => setCrossfaderCurve('linear' as CrossfaderCurve)}
            className={`flex-1 py-0.5 rounded transition-colors cursor-pointer ${
              crossfaderCurve === 'linear'
                ? 'bg-white/15 text-white font-medium border border-white/10'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white'
            }`}
          >
            FAST
          </button>
        </div>
      </div>
    </div>
  );
};
