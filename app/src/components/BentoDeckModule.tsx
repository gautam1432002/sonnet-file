import React, { useState, useEffect } from 'react';
import { useStore, deckAObj, deckBObj } from '../store';
import { YouTubeDeckPlayer } from './YouTubeDeckPlayer';
import { YouTubeSourceAdapter } from '../audio/sources/YouTubeSourceAdapter';
import { engine } from '../audio/engine';

interface BentoDeckModuleProps {
  id: 'A' | 'B';
}

export const BentoDeckModule: React.FC<BentoDeckModuleProps> = ({ id }) => {
  const isA = id === 'A';
  const deckState = useStore((s) => (isA ? s.deckA : s.deckB));
  const updateDeck = useStore((s) => s.updateDeck);
  const deckObj = isA ? deckAObj : deckBObj;

  const [ytAdapter, setYtAdapter] = useState<YouTubeSourceAdapter | null>(null);
  const [echoActive, setEchoActive] = useState(isA); // Deck A default on
  const [spaceActive, setSpaceActive] = useState(isA); // Deck A default on
  const [rotationAngle, setRotationAngle] = useState(isA ? 45 : 120);

  // Pitch state (0.92 to 1.08 => -8% to +8%)
  const pitch = deckState.pitch || 1.0;

  // EQ values
  const [gainDb, setGainDb] = useState(isA ? 2.4 : 0.0);
  const [trebleDb, setTrebleDb] = useState(isA ? 0.8 : -1.2);
  const [bassDb, setBassDb] = useState(isA ? 3.2 : 1.5);

  const baseBpm = isA ? 186.0 : 171.0;
  const currentBpm = (baseBpm * pitch).toFixed(1);

  // Animation frame loop for platter rotation
  useEffect(() => {
    let animId: number;
    const loop = () => {
      if (deckState.playing) {
        setRotationAngle((prev) => (prev + (isA ? 1.5 : 1.3) * pitch) % 360);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [deckState.playing, isA, pitch]);

  // Handle Play / Pause
  const togglePlay = async () => {
    await engine.resume();
    const nextPlaying = !deckState.playing;
    updateDeck(id, { playing: nextPlaying });
    if (ytAdapter) {
      if (nextPlaying) ytAdapter.play();
      else ytAdapter.pause();
    }
  };

  // Handle Cue
  const handleCue = () => {
    if (deckState.playing) {
      updateDeck(id, { playing: false });
      if (ytAdapter) ytAdapter.pause();
      deckObj.pause();
    }
    deckObj.seek(0);
    if (ytAdapter) ytAdapter.seekTo(0);
    setRotationAngle(isA ? 45 : 120);
  };

  // Handle Nudge
  const handleNudge = (delta: number) => {
    const newPitch = Math.max(0.92, Math.min(1.08, pitch + delta));
    updateDeck(id, { pitch: newPitch });
  };

  // Handle Pitch Fader Drag
  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    updateDeck(id, { pitch: val });
  };

  // Handle FX
  const toggleEcho = () => {
    const next = !echoActive;
    setEchoActive(next);
    deckObj.effects.toggleEcho(next);
  };

  const toggleSpace = () => {
    const next = !spaceActive;
    setSpaceActive(next);
    deckObj.effects.toggleVirtuality(next);
  };

  // Rotary Knob Drag helper
  const makeKnobDrag = (val: number, setVal: (v: number) => void, min: number, max: number, onCommit?: (v: number) => void) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startVal = val;
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dy = startY - moveEvent.clientY;
        const range = max - min;
        const change = (dy / 100) * range;
        const clamped = Math.max(min, Math.min(max, startVal + change));
        const rounded = Math.round(clamped * 10) / 10;
        setVal(rounded);
        if (onCommit) onCommit(rounded);
      };
      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };
  };

  // Convert dB to rotation degree (-135 to 135)
  const dbToRotation = (db: number, min: number, max: number) => {
    const pct = (db - min) / (max - min);
    return -135 + pct * 270;
  };

  // Jog wheel element
  const jogWheel = (
    <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-[#111216] border border-white/10 p-2 shadow-2xl shrink-0 flex items-center justify-center select-none">
      {/* Outer Machined Rim */}
      <div className="absolute inset-1 rounded-full border border-white/5 pointer-events-none"></div>

      {/* Subtle Vinyl Texture Disc */}
      <div
        className="w-full h-full rounded-full bg-[radial-gradient(ellipse_at_center,#22242c_0%,#15161b_40%,#121317_70%,#0c0d10_100%)] flex items-center justify-center relative cursor-grab active:cursor-grabbing border border-black/80"
        onClick={togglePlay}
      >
        {/* Hairline Rotating Disc Indicator */}
        <div
          className="absolute inset-2 rounded-full border border-white/[0.06] flex items-start justify-center transition-transform"
          style={{ transform: `rotate(${rotationAngle}deg)` }}
        >
          <div className="w-1 h-3.5 bg-zinc-200 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)] -mt-0.5"></div>
        </div>

        {/* Center Spindle Display */}
        <div className="relative w-20 h-20 rounded-full bg-zinc-900 border border-white/10 shadow-xl flex flex-col items-center justify-center text-center p-2 pointer-events-none">
          <span className="font-mono text-zinc-100 font-bold text-base leading-tight">
            {currentBpm}
          </span>
          <span className="font-label-sm text-[8px] text-zinc-400 uppercase tracking-widest mt-0.5">
            DECK {id}
          </span>
          <div
            className={`mt-1 w-1.5 h-1.5 rounded-full ${
              isA ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          ></div>
        </div>
      </div>
    </div>
  );

  // Pitch Fader & Tempo Strip
  const pitchFader = (
    <div className={`flex flex-col items-center justify-between h-48 sm:h-56 flex-1 ${isA ? 'pl-1' : 'pr-1'}`}>
      {/* Beat Sync Pill */}
      <button
        type="button"
        onClick={() => updateDeck(id, { pitch: 1.0 })}
        className="w-full py-1.5 px-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-lg font-label-sm text-[10px] font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${isA ? 'bg-emerald-400' : 'bg-amber-400'}`}
        ></span>
        {isA ? 'SYNC LOCK' : 'BEAT SYNC'}
      </button>

      <div className="w-full flex justify-between text-[9px] font-label-sm text-zinc-400 px-1">
        <span>TEMPO</span>
        <span className="text-zinc-200 font-mono font-medium">±8%</span>
      </div>

      {/* Sleek Machined Fader Track */}
      <div className="relative w-7 h-28 bg-zinc-950/80 border border-white/10 rounded-lg flex items-center justify-center py-2 shadow-inner">
        {/* Center zero notch line */}
        <div className="absolute w-full h-px bg-white/20 left-0"></div>
        <div className="w-1 h-full bg-zinc-800 rounded-full"></div>

        {/* Machined Solid Fader Knob */}
        <div
          className="absolute w-6 h-5 rounded-md machined-slider border border-white/20 flex items-center justify-center cursor-ns-resize shadow-md transition-all"
          style={{
            top: `${Math.round(44 - ((pitch - 1.0) / 0.08) * 36)}px`,
          }}
        >
          <div className="w-3.5 h-0.5 bg-white/80 rounded-full"></div>
        </div>

        {/* Hidden native input for accessible drag/touch interaction */}
        <input
          type="range"
          min="0.92"
          max="1.08"
          step="0.002"
          value={pitch}
          onChange={handlePitchChange}
          className="absolute inset-0 opacity-0 cursor-ns-resize w-full h-full"
        />
      </div>

      {/* Tactile Nudge Buttons */}
      <div className="w-full grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => handleNudge(-0.005)}
          className="py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-md font-label-sm text-[9px] text-zinc-300 font-medium active:scale-95 transition-all cursor-pointer"
        >
          - NUDGE
        </button>
        <button
          type="button"
          onClick={() => handleNudge(0.005)}
          className="py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-md font-label-sm text-[9px] text-zinc-300 font-medium active:scale-95 transition-all cursor-pointer"
        >
          + NUDGE
        </button>
      </div>
    </div>
  );

  return (
    <div className="lg:col-span-5 bento-card rounded-2xl p-4 flex flex-col justify-between gap-4 select-none relative">
      {/* Hidden YouTube player container for uninterrupted background playback */}
      <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden" aria-hidden="true">
        <YouTubeDeckPlayer
          deckId={id}
          videoId={deckState.youtubeId}
          onAdapterReady={(adp) => setYtAdapter(adp)}
          onStateChange={(state) => {
            if (state === 1) updateDeck(id, { playing: true });
            else if (state === 2 || state === 0) updateDeck(id, { playing: false });
          }}
        />
      </div>

      {/* Top Section: Jog Wheel & Pitch Fader (Symmetrical layout) */}
      <div className="flex items-start justify-between gap-4">
        {isA ? (
          <>
            {jogWheel}
            {pitchFader}
          </>
        ) : (
          <>
            {pitchFader}
            {jogWheel}
          </>
        )}
      </div>

      {/* Tactile Rotary EQ Dials (Gain, Treble, Mid/Bass) */}
      <div className="grid grid-cols-3 gap-2 bento-card-sub rounded-xl p-2.5">
        {/* Gain Knob */}
        <div className="flex flex-col items-center">
          <span className="font-label-sm text-[9px] text-zinc-400 uppercase font-medium">GAIN</span>
          <div
            className="relative w-11 h-11 my-1 flex items-center justify-center cursor-ns-resize"
            onMouseDown={makeKnobDrag(gainDb, setGainDb, -12, 12, (v) => {
              updateDeck(id, { trim: Math.max(0, 1 + v / 12) });
            })}
          >
            <div className="w-9 h-9 rounded-full tactile-knob border border-white/10 flex items-center justify-center shadow-lg transition-transform">
              <div
                className="w-0.5 h-3 bg-zinc-200 rounded-full -translate-y-1.5 transform"
                style={{ transform: `rotate(${dbToRotation(gainDb, -12, 12)}deg) translateY(-6px)` }}
              ></div>
            </div>
          </div>
          <span className="font-label-sm text-[10px] text-zinc-200 font-mono">
            {gainDb > 0 ? `+${gainDb.toFixed(1)}` : gainDb.toFixed(1)} dB
          </span>
        </div>

        {/* Treble Knob */}
        <div className="flex flex-col items-center">
          <span className="font-label-sm text-[9px] text-zinc-400 uppercase font-medium">TREBLE</span>
          <div
            className="relative w-11 h-11 my-1 flex items-center justify-center cursor-ns-resize"
            onMouseDown={makeKnobDrag(trebleDb, setTrebleDb, -24, 6, (v) => {
              updateDeck(id, { eqHigh: v });
            })}
          >
            <div className="w-9 h-9 rounded-full tactile-knob border border-white/10 flex items-center justify-center shadow-lg transition-transform">
              <div
                className="w-0.5 h-3 bg-zinc-200 rounded-full -translate-y-1.5 transform"
                style={{ transform: `rotate(${dbToRotation(trebleDb, -24, 6)}deg) translateY(-6px)` }}
              ></div>
            </div>
          </div>
          <span className="font-label-sm text-[10px] text-zinc-200 font-mono">
            {trebleDb > 0 ? `+${trebleDb.toFixed(1)}` : trebleDb.toFixed(1)} dB
          </span>
        </div>

        {/* Bass Knob */}
        <div className="flex flex-col items-center">
          <span className="font-label-sm text-[9px] text-zinc-400 uppercase font-medium">BASS</span>
          <div
            className="relative w-11 h-11 my-1 flex items-center justify-center cursor-ns-resize"
            onMouseDown={makeKnobDrag(bassDb, setBassDb, -24, 6, (v) => {
              updateDeck(id, { eqLow: v });
            })}
          >
            <div className="w-9 h-9 rounded-full tactile-knob border border-white/10 flex items-center justify-center shadow-lg transition-transform">
              <div
                className="w-0.5 h-3 bg-zinc-200 rounded-full -translate-y-1.5 transform"
                style={{ transform: `rotate(${dbToRotation(bassDb, -24, 6)}deg) translateY(-6px)` }}
              ></div>
            </div>
          </div>
          <span className="font-label-sm text-[10px] text-zinc-200 font-mono">
            {bassDb > 0 ? `+${bassDb.toFixed(1)}` : bassDb.toFixed(1)} dB
          </span>
        </div>
      </div>

      {/* FX / Loop Toggles */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={toggleEcho}
          className="py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-xl flex items-center justify-between text-zinc-200 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                echoActive
                  ? isA
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                  : 'bg-zinc-600'
              }`}
            ></span>
            <span className="font-label-sm text-[10px] uppercase font-semibold">ECHO</span>
          </div>
          <span className="font-label-sm text-[9px] font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">
            {isA ? '1/4 D' : '1/8 T'}
          </span>
        </button>

        <button
          type="button"
          onClick={toggleSpace}
          className={`py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-xl flex items-center justify-between text-zinc-200 transition-all cursor-pointer ${
            !spaceActive ? 'opacity-80' : ''
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                spaceActive
                  ? isA
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                  : 'bg-zinc-600'
              }`}
            ></span>
            <span
              className={`font-label-sm text-[10px] uppercase font-semibold ${
                spaceActive ? 'text-zinc-200' : 'text-zinc-400'
              }`}
            >
              SPACE 3D
            </span>
          </div>
          <span className="font-label-sm text-[9px] font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">
            {spaceActive ? 'WIDE' : 'BYPASS'}
          </span>
        </button>
      </div>

      {/* Chunky Tactile Cue & Play Transport Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={handleCue}
          className="h-12 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-zinc-200 font-headline-sm text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 shadow-md transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-zinc-400">
            fiber_manual_record
          </span>
          CUE
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className={`h-12 rounded-xl text-zinc-950 font-headline-sm text-sm font-bold flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all cursor-pointer ${
            deckState.playing ? 'bg-emerald-300 hover:bg-emerald-200' : 'bg-zinc-100 hover:bg-white'
          }`}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {deckState.playing ? 'pause' : 'play_arrow'}
          </span>
          {deckState.playing ? 'PAUSE' : 'PLAY'}
        </button>
      </div>
    </div>
  );
};
