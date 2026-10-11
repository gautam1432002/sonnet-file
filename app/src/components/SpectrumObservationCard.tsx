import React, { useEffect, useState, useRef } from 'react';
import { engine } from '../audio/engine';
import { useStore } from '../store';

const BARS_CONFIG = [
  { grad: 'from-zinc-700 to-zinc-400', baseH: 75, opacity: 'opacity-90' },
  { grad: 'from-zinc-700 to-zinc-300', baseH: 88, opacity: 'opacity-95' },
  { grad: 'from-zinc-700 to-zinc-300', baseH: 68, opacity: 'opacity-90' },
  { grad: 'from-zinc-700 to-emerald-400', baseH: 82, opacity: 'opacity-90' },
  { grad: 'from-zinc-700 to-emerald-400', baseH: 60, opacity: 'opacity-85' },
  { grad: 'from-zinc-700 to-emerald-300', baseH: 66, opacity: 'opacity-90' },
  { grad: 'from-zinc-700 to-zinc-400', baseH: 52, opacity: 'opacity-85' },
  { grad: 'from-zinc-700 to-zinc-300', baseH: 58, opacity: 'opacity-85' },
  { grad: 'from-zinc-700 to-zinc-400', baseH: 48, opacity: 'opacity-80' },
  { grad: 'from-zinc-700 to-zinc-300', baseH: 54, opacity: 'opacity-85' },
  { grad: 'from-zinc-700 to-zinc-200', baseH: 64, opacity: 'opacity-90' },
  { grad: 'from-zinc-700 to-zinc-400', baseH: 44, opacity: 'opacity-80' },
  { grad: 'from-zinc-700 to-indigo-300', baseH: 55, opacity: 'opacity-85' },
  { grad: 'from-zinc-700 to-indigo-300', baseH: 63, opacity: 'opacity-90' },
  { grad: 'from-zinc-700 to-zinc-300', baseH: 45, opacity: 'opacity-80' },
  { grad: 'from-zinc-700 to-zinc-200', baseH: 60, opacity: 'opacity-90' },
  { grad: 'from-zinc-700 to-indigo-200', baseH: 69, opacity: 'opacity-95' },
  { grad: 'from-zinc-700 to-indigo-300', baseH: 74, opacity: 'opacity-95' },
  { grad: 'from-zinc-700 to-zinc-300', baseH: 56, opacity: 'opacity-85' },
  { grad: 'from-zinc-700 to-zinc-200', baseH: 70, opacity: 'opacity-90' },
  { grad: 'from-zinc-700 to-zinc-300', baseH: 52, opacity: 'opacity-85' },
  { grad: 'from-zinc-700 to-amber-300', baseH: 58, opacity: 'opacity-90' },
  { grad: 'from-zinc-700 to-amber-300', baseH: 64, opacity: 'opacity-90' },
  { grad: 'from-zinc-700 to-zinc-300', baseH: 72, opacity: 'opacity-95' },
  { grad: 'from-zinc-700 to-zinc-300', baseH: 82, opacity: 'opacity-95' },
  { grad: 'from-zinc-700 to-amber-400', baseH: 66, opacity: 'opacity-90' },
  { grad: 'from-zinc-700 to-zinc-300', baseH: 75, opacity: 'opacity-90' },
  { grad: 'from-zinc-700 to-zinc-400', baseH: 60, opacity: 'opacity-85' },
  { grad: 'from-zinc-700 to-zinc-400', baseH: 50, opacity: 'opacity-80' },
  { grad: 'from-zinc-700 to-zinc-500', baseH: 38, opacity: 'opacity-75' },
  { grad: 'from-zinc-700 to-zinc-500', baseH: 26, opacity: 'opacity-70' },
  { grad: 'from-zinc-700 to-zinc-600', baseH: 18, opacity: 'opacity-60' },
];

export const SpectrumObservationCard: React.FC = () => {
  const deckAPlaying = useStore((s) => s.deckA.playing);
  const deckBPlaying = useStore((s) => s.deckB.playing);
  const [barHeights, setBarHeights] = useState<number[]>(() => BARS_CONFIG.map((b) => b.baseH));
  const [peakDb, setPeakDb] = useState("-0.3 dBFS");
  const animRef = useRef<number>(0);

  useEffect(() => {
    const isPlaying = deckAPlaying || deckBPlaying;
    const analyser = engine.masterAnalyser;

    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const updateBars = () => {
      if (analyser && isPlaying && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        const binStep = Math.floor(dataArray.length / 32) || 1;
        let maxVal = 0;

        const newHeights = BARS_CONFIG.map((b, i) => {
          const val = dataArray[i * binStep] || 0;
          if (val > maxVal) maxVal = val;
          // Combine live energy with curated design curve
          const dynamicHeight = Math.max(10, Math.min(98, (val / 255) * 85 + b.baseH * 0.2));
          return dynamicHeight;
        });

        const db = maxVal > 0 ? ((maxVal / 255) * 6 - 6.3).toFixed(1) : "-0.3";
        setPeakDb(`${db} dBFS`);
        setBarHeights(newHeights);
      } else {
        // Subtle resting baseline from mockup
        setBarHeights(BARS_CONFIG.map((b) => b.baseH));
        setPeakDb("-0.3 dBFS");
      }

      animRef.current = requestAnimationFrame(updateBars);
    };

    animRef.current = requestAnimationFrame(updateBars);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [deckAPlaying, deckBPlaying]);

  return (
    <section className="bento-card rounded-2xl p-4 flex flex-col gap-2.5 select-none">
      {/* Header & Scale Ribbon */}
      <div className="flex items-center justify-between text-xs font-label-sm text-zinc-400 px-1">
        <div className="flex items-center gap-3">
          <span className="text-zinc-200 font-semibold tracking-wider">SPECTRUM RTA</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400">FFT 2048 STEREO</span>
          <span className="text-zinc-600">/</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            PHASE ALIGNED
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[10px] text-zinc-500 font-mono">
          <span>20Hz</span>
          <span>100Hz</span>
          <span>500Hz</span>
          <span>1kHz</span>
          <span>5kHz</span>
          <span>10kHz</span>
          <span>20kHz</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-zinc-400">
            PEAK: <strong className="font-mono text-zinc-200">{peakDb}</strong>
          </span>
        </div>
      </div>

      {/* Refined Smooth Gradient Visualizer Bar Array */}
      <div className="relative w-full h-24 bg-zinc-950/70 border border-white/5 rounded-xl px-3 py-2 flex items-end justify-between gap-[3px] overflow-hidden">
        {/* Central Precision Phase Needle */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/40 z-20 flex flex-col items-center justify-between pointer-events-none">
          <span className="bg-white/20 backdrop-blur-sm text-zinc-200 font-label-sm text-[8px] px-1 rounded-sm mt-0.5">
            0.00
          </span>
          <span className="bg-emerald-500/80 text-black font-label-sm text-[8px] px-1 rounded-sm font-bold mb-0.5">
            SYNC
          </span>
        </div>

        {/* Subtle horizontal decibel grid lines */}
        <div className="absolute inset-x-0 top-1/4 h-px bg-white/[0.03]"></div>
        <div className="absolute inset-x-0 top-2/4 h-px bg-white/[0.03]"></div>
        <div className="absolute inset-x-0 top-3/4 h-px bg-white/[0.03]"></div>

        {/* Studio Spectrum Columns (32 Bars with exact gradient stops and height transition) */}
        {BARS_CONFIG.map((cfg, idx) => (
          <div
            key={idx}
            className={`w-full bg-gradient-to-t ${cfg.grad} rounded-t-sm ${cfg.opacity} transition-[height] duration-75 ease-out`}
            style={{ height: `${barHeights[idx]}%` }}
          />
        ))}
      </div>

      {/* Integrated Waveform Overview Scrubber Track */}
      <div className="w-full h-7 bg-zinc-950/50 border border-white/5 rounded-lg px-2 flex items-center justify-between text-[10px] font-label-sm text-zinc-400 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-white/[0.04] border-r border-white/10"></div>
        <div className="absolute inset-y-0 right-0 w-1/2 bg-white/[0.02]"></div>
        <div className="relative z-10 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
          <span>A: INTRO BARS (00:00 - 02:14)</span>
        </div>
        <div className="relative z-10 font-mono text-zinc-500">
          BAR 32.4 • MASTER 124.00
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <span>B: DROP BUILD (01:05 - 03:20)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
        </div>
      </div>
    </section>
  );
};
