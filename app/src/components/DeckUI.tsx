import { useRef, useState, useEffect } from 'react';
import { useStore, deckAObj, deckBObj } from '../store';
import { Waveform } from './Waveform';
import { computePeaks } from '../audio/peaks';
import { engine } from '../audio/engine';
import { BufferSourceAdapter } from '../audio/sources/SourceAdapter';

interface DeckUIProps {
  id: 'A' | 'B';
}

function formatTime(secs: number) {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function DeckUI({ id }: DeckUIProps) {
  const deckState = useStore(state => id === 'A' ? state.deckA : state.deckB);
  const updateDeck = useStore(state => state.updateDeck);
  const deckObj = id === 'A' ? deckAObj : deckBObj;
  
  const [peaks, setPeaks] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync position via rAF
  useEffect(() => {
    let handle: number;
    const loop = () => {
      setPos(deckObj.getPosition());
      handle = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(handle);
  }, [deckObj]);

  const handleFile = async (file: File) => {
    updateDeck(id, { trackName: 'Loading...' });
    try {
      await engine.ctx.resume();
      await deckObj.load(file);
      const adapter = deckObj.sourceAdapter as BufferSourceAdapter;
      const buffer = adapter.getBuffer();
      if (buffer) {
        setPeaks(computePeaks(buffer, 400));
      }
      updateDeck(id, { 
        trackName: file.name, 
        duration: deckObj.getDuration(),
        playing: false
      });
      deckObj.seek(0);
    } catch (e) {
      console.error(e);
      updateDeck(id, { trackName: 'Error loading file' });
    }
  };

  const handleLiveCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      await engine.ctx.resume();
      await deckObj.load(stream);
      setPeaks([]);
      updateDeck(id, { 
        trackName: 'Live Capture', 
        duration: Infinity,
        playing: true
      });
      deckObj.play();
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate rotation for jog wheel based on position
  const jogRotation = (pos / 2) * 360; // 1 rotation every 2 seconds

  return (
    <div 
      className={`glass-panel p-4 flex gap-4 relative transition-colors ${isDragging ? 'ring-2 ring-[var(--accent)] bg-black/40' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight text-[var(--accent)]">Deck {id}</h2>
          <div className="text-sm font-medium truncate max-w-[200px]" title={deckState.trackName || 'No track loaded'}>
            {deckState.trackName || 'No track loaded'}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleLiveCapture}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-md text-sm transition-colors"
              title="Capture YouTube/Tab Audio"
            >
              Live Tab
            </button>
            <input 
              type="file" 
              accept="audio/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-sm transition-colors"
            >
              Load Track
            </button>
          </div>
        </div>

        {/* Jog Wheel */}
        <div className="flex justify-center items-center py-4">
          <div 
            className="w-48 h-48 rounded-full border-4 border-black/40 bg-black/20 shadow-xl flex items-center justify-center relative overflow-hidden group"
            style={{ transform: `rotate(${jogRotation}deg)` }}
          >
            {/* Vinyl grooves */}
            <div className="absolute inset-0 rounded-full border border-white/5 m-2 pointer-events-none"></div>
            <div className="absolute inset-0 rounded-full border border-white/5 m-6 pointer-events-none"></div>
            <div className="absolute inset-0 rounded-full border border-white/5 m-10 pointer-events-none"></div>
            <div className="absolute inset-0 rounded-full border border-white/5 m-14 pointer-events-none"></div>
            
            {/* Center label */}
            <div className="w-16 h-16 rounded-full bg-[var(--accent)] border-2 border-black/50 flex items-center justify-center text-xs font-bold text-[#0b1026]">
              {id}
            </div>
            {/* Position marker */}
            <div className="absolute top-0 w-2 h-4 bg-white/50 rounded-b-full"></div>
          </div>
        </div>

        <Waveform 
          peaks={peaks} 
          position={pos} 
          duration={deckState.duration} 
          onSeek={(p) => deckObj.seek(p)} 
        />

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                engine.resume();
                updateDeck(id, { playing: !deckState.playing });
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center font-bold transition-all shadow-lg border-2 ${
                deckState.playing 
                  ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
                  : 'bg-white/10 border-white/20 hover:border-white/40'
              }`}
            >
              {deckState.playing ? '||' : '▶'}
            </button>
            <button 
              onClick={() => {
                deckObj.cueToStart();
                if (deckState.playing) {
                  updateDeck(id, { playing: false });
                }
              }}
              className="w-14 h-14 rounded-full flex items-center justify-center font-bold bg-white/10 border-2 border-white/20 hover:border-white/40 transition-all shadow-lg text-[10px]"
            >
              CUE
            </button>
          </div>
          <div className="flex flex-col items-end gap-1 font-mono text-sm opacity-80 select-none">
            <span className="text-[var(--accent)] font-bold">{formatTime(pos)}</span>
            <span>-{formatTime(Math.max(0, deckState.duration - pos))}</span>
          </div>
        </div>
      </div>

      {/* Tempo/Pitch Fader */}
      <div className="w-16 flex flex-col items-center justify-between py-4 border-l border-[var(--glass-border)] ml-2">
        <div className="text-[10px] font-bold text-[var(--accent)] mb-2">TEMPO</div>
        <div className="text-[10px] opacity-70 mb-2">{((deckState.pitch - 1) * 100).toFixed(1)}%</div>
        <div className="flex-1 relative flex justify-center w-full group">
          <div className="absolute top-1/2 w-4 h-[1px] bg-white/50 -translate-y-1/2 z-0"></div>
          <input 
            type="range" 
            min="0.9" max="1.1" step="0.001" 
            value={deckState.pitch}
            onChange={(e) => updateDeck(id, { pitch: parseFloat(e.target.value) })}
            onDoubleClick={() => updateDeck(id, { pitch: 1 })}
            className="h-full -rotate-90 appearance-none bg-transparent cursor-pointer z-10 w-[200px]"
          />
        </div>
      </div>
    </div>
  );
}
