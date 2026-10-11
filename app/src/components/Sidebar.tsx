import React from 'react';

interface SidebarProps {
  onOpenLibrary?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenLibrary }) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-56 z-50 flex flex-col justify-between py-4 px-3 bg-zinc-950/70 backdrop-blur-2xl border-r border-white/5 select-none">
      <div className="flex flex-col gap-5">
        {/* Minimal Brand Header */}
        <div className="px-2 pt-1 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/90 shadow-[0_0_10px_rgba(52,211,153,0.6)]"></div>
            <span className="font-label-sm text-[10px] tracking-widest text-zinc-200 uppercase font-semibold">
              STUDIO BENTO
            </span>
          </div>
          <span className="font-label-sm text-[9px] text-zinc-500 tracking-wider">v5.0</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.08] text-white border border-white/10 shadow-sm font-body-sm text-[13px] font-medium transition-all text-left"
          >
            <span className="material-symbols-outlined text-[17px] text-emerald-400">equalizer</span>
            Mixer Surface
          </button>
          <button
            type="button"
            onClick={onOpenLibrary}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] font-body-sm text-[13px] font-medium transition-all text-left"
          >
            <span className="material-symbols-outlined text-[17px]">queue_music</span>
            Library Crates
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] font-body-sm text-[13px] font-medium transition-all text-left"
          >
            <span className="material-symbols-outlined text-[17px]">spatial_audio</span>
            FX Sampler
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] font-body-sm text-[13px] font-medium transition-all text-left"
          >
            <span className="material-symbols-outlined text-[17px]">tune</span>
            Audio Routing
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] font-body-sm text-[13px] font-medium transition-all text-left"
          >
            <span className="material-symbols-outlined text-[17px]">radio_button_checked</span>
            Session Rec
          </button>
        </nav>
      </div>

      {/* Hardware Diagnostics & User Pill */}
      <div className="flex flex-col gap-3">
        <div className="bento-card-sub p-2.5 rounded-xl flex flex-col gap-1.5 font-label-sm text-[10px]">
          <div className="flex items-center justify-between text-zinc-400">
            <span>DSP LATENCY</span>
            <span className="text-emerald-400 font-mono font-medium">1.2 ms</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>SAMPLE RATE</span>
            <span className="text-zinc-200 font-mono">48 kHz</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>BUFFER</span>
            <span className="text-zinc-200 font-mono">64 smp</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-zinc-400 font-label-sm text-[9px] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Link Active (4)
          </div>
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300">
            <span className="material-symbols-outlined text-[15px]">person</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
