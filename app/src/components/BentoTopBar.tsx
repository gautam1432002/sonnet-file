import React, { useState } from 'react';
import { useStore } from '../store';

interface BentoTopBarProps {
  onSearchSubmit: (query: string) => void;
  onOpenBrowser: () => void;
}

const DEFAULT_ARTWORK_A = "https://lh3.googleusercontent.com/aida-public/AB6AXuA_Zvdgqz8K41wtcKFkmofFk6-AmD_JrEXfAzzNVDdUdsu7OPuCw4WekN9cYxmQB_U4ADGTFvb55R2dha3F8UN9W_VnOfjhiE2Qw7zxJ6cSsM6emud9DR1E1JaB1Lg0V5QLvNQzEth7k7tXn2ASJ_fjSmk0-cBE7RQOJNR6ny1PIo2yjmeh4JRPtMFsXFkTRM25XJFt09Rb6GayZc5YV_2F6d4YLKkNDiDJGMyKQG5E87JWX8ibwu5Crg";
const DEFAULT_ARTWORK_B = "https://lh3.googleusercontent.com/aida-public/AB6AXuAiXJFD4oLB86lyd0EhAT1Ls5V19c_Ec0G-bwnIlXq9wy5cSX_wNgx2iNOUmM2POYkg713Js6k4wBwkdcU1pR8PcHr-lHbML-913bv8iWfO-Ciqe_OI8TchS3_gGjRdUwNuui3zue8fpv27fY7uLja1ejha5CfAuCA57blEvqyuTLH0oqsc1mTWNrmQHoYL2lCCpW1s4knv_23auGAJV99tumqeNeJOAdFGyKvJN23hxnq2KT7CGctSow";

function formatSecs(secs: number) {
  if (!secs || isNaN(secs) || secs < 0) return '00:00';
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const BentoTopBar: React.FC<BentoTopBarProps> = ({ onSearchSubmit, onOpenBrowser }) => {
  const deckA = useStore((state) => state.deckA);
  const deckB = useStore((state) => state.deckB);
  const [searchValue, setSearchValue] = useState("The Weeknd - Official Audio (Lossless Stream)");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchValue);
    }
  };

  const handleLoadClick = () => {
    if (searchValue.trim()) {
      onSearchSubmit(searchValue);
    } else {
      onOpenBrowser();
    }
  };

  const bpmA = (186.0 * (deckA.pitch || 1)).toFixed(1);
  const bpmB = (171.0 * (deckB.pitch || 1)).toFixed(1);

  return (
    <section className="bento-card rounded-2xl p-3.5 flex flex-col lg:flex-row items-center justify-between gap-4 select-none">
      {/* Left Deck Summary */}
      <div className="flex items-center gap-3.5 w-full lg:w-4/12 min-w-0">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md">
          <img
            className="w-full h-full object-cover"
            alt="Album cover art for Starboy"
            src={deckA.artworkUrl || DEFAULT_ARTWORK_A}
          />
          <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/70 backdrop-blur-md text-[8px] font-label-sm font-semibold text-zinc-300">
            A
          </span>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-headline-sm text-sm font-semibold text-white truncate">
              {deckA.trackName || "Starboy"}
            </span>
            <span className="font-label-sm text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300 font-medium">
              MASTER
            </span>
          </div>
          <span className="text-xs text-zinc-400 truncate">
            {deckA.artist || "The Weeknd ft. Daft Punk"}
          </span>
          <div className="flex items-center gap-2 font-label-sm text-[10px] text-zinc-400 mt-0.5">
            <span className="text-zinc-200 font-mono font-medium">
              {deckA.duration ? formatSecs(deckA.duration * 0.58) : "02:14"}
            </span>
            <span>/</span>
            <span>{deckA.duration ? formatSecs(deckA.duration) : "03:50"}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-mono">{bpmA} BPM</span>
            <span className="text-zinc-500 font-mono">G min</span>
          </div>
        </div>
      </div>

      {/* Center Bento Control: YouTube Audio Source Pill & Studio Master Indicator */}
      <div className="flex items-center gap-3 w-full lg:w-4/12 justify-center">
        <div className="flex items-center w-full max-w-md bg-zinc-950/60 border border-white/10 rounded-full px-3 py-1.5 shadow-inner focus-within:border-zinc-400/50 transition-all">
          <span className="material-symbols-outlined text-rose-400 text-[18px] mr-2">
            smart_display
          </span>
          <input
            className="bg-transparent border-none text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none w-full font-body-sm"
            placeholder="Search YouTube or paste audio stream URL..."
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={handleLoadClick}
            className="shrink-0 ml-2 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-label-sm uppercase font-semibold text-zinc-200 transition-colors cursor-pointer"
          >
            LOAD
          </button>
        </div>
      </div>

      {/* Right Deck Summary */}
      <div className="flex items-center justify-end gap-3.5 w-full lg:w-4/12 min-w-0">
        <div className="flex flex-col min-w-0 flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="font-label-sm text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300 font-medium">
              CUE READY
            </span>
            <span className="font-headline-sm text-sm font-semibold text-white truncate">
              {deckB.trackName || "Blinding Lights"}
            </span>
          </div>
          <span className="text-xs text-zinc-400 truncate">
            {deckB.artist || "The Weeknd"}
          </span>
          <div className="flex items-center justify-end gap-2 font-label-sm text-[10px] text-zinc-400 mt-0.5">
            <span className="text-zinc-500 font-mono">F# min</span>
            <span className="text-zinc-600">•</span>
            <span className="text-amber-400 font-mono">{bpmB} BPM</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-200 font-mono">
              {deckB.duration ? formatSecs(deckB.duration * 0.32) : "01:05"}
            </span>
            <span>/</span>
            <span>{deckB.duration ? formatSecs(deckB.duration) : "03:20"}</span>
          </div>
        </div>
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md">
          <img
            className="w-full h-full object-cover"
            alt="Album artwork for Blinding Lights"
            src={deckB.artworkUrl || DEFAULT_ARTWORK_B}
          />
          <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-black/70 backdrop-blur-md text-[8px] font-label-sm font-semibold text-zinc-300">
            B
          </span>
        </div>
      </div>
    </section>
  );
};
