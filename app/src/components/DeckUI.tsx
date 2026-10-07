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

  return (
    <div 
      className={`glass-panel p-4 flex flex-col gap-4 relative transition-colors ${isDragging ? 'ring-2 ring-[var(--accent)] bg-black/40' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight text-[var(--accent)]">Deck {id}</h2>
        <div className="text-sm font-medium truncate max-w-[200px]" title={deckState.trackName || 'No track loaded'}>
          {deckState.trackName || 'No track loaded'}
        </div>
        <div>
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

      <Waveform 
        peaks={peaks} 
        position={pos} 
        duration={deckState.duration} 
        onSeek={(p) => deckObj.seek(p)} 
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              engine.resume();
              updateDeck(id, { playing: !deckState.playing });
            }}
            className="w-12 h-12 flex items-center justify-center bg-[var(--accent)] text-[#0b1026] rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg font-bold"
          >
            {deckState.playing ? '||' : '▶'}
          </button>
          <button 
            onClick={() => {
              deckObj.cueToStart();
              if (deckState.playing) {
                // optionally pause when cueing to start, CDJ style
                updateDeck(id, { playing: false });
              }
            }}
            className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all font-bold"
          >
            CUE
          </button>
        </div>
        <div className="flex gap-4 font-mono text-sm opacity-80 select-none">
          <span>{formatTime(pos)}</span>
          <span>-{formatTime(Math.max(0, deckState.duration - pos))}</span>
        </div>
      </div>
    </div>
  );
}
