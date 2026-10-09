import { useRef, useState, useEffect } from 'react';
import { useStore, deckAObj, deckBObj } from '../store';
import { Waveform } from './Waveform';
import { computePeaks } from '../audio/peaks';
import { engine } from '../audio/engine';
import { BufferSourceAdapter } from '../audio/sources/SourceAdapter';
import YouTube from 'react-youtube';
import type { YouTubePlayer } from 'react-youtube';

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
  const crossfader = useStore(state => state.crossfader);
  const crossfaderCurve = useStore(state => state.crossfaderCurve);
  const deckObj = id === 'A' ? deckAObj : deckBObj;
  
  const [peaks, setPeaks] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [ytPlayer, setYtPlayer] = useState<YouTubePlayer | null>(null);
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync position via rAF
  useEffect(() => {
    let handle: number;
    const loop = () => {
      if (deckState.youtubeId && ytPlayer) {
        setPos(ytPlayer.getCurrentTime() || 0);
      } else {
        setPos(deckObj.getPosition());
      }
      handle = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(handle);
  }, [deckObj, deckState.youtubeId, ytPlayer]);

  // Sync YouTube Volume
  useEffect(() => {
    if (!ytPlayer) return;
    import('../audio/crossfader').then(({ getCrossfaderGains }) => {
      const gains = getCrossfaderGains(crossfader, crossfaderCurve);
      const xFadeGain = id === 'A' ? gains.a : gains.b;
      const targetVol = deckState.volume * (deckState.trim / 2) * xFadeGain * 100;
      ytPlayer.setVolume(targetVol);
    });
  }, [ytPlayer, deckState.volume, deckState.trim, crossfader, crossfaderCurve, id]);

  const handleFile = async (file: File) => {
    updateDeck(id, { trackName: 'Loading...' });
    try {
      await engine.ctx.resume();
      await deckObj.load(file);
      const adapter = deckObj.sourceAdapter as BufferSourceAdapter;
      const buffer = adapter.getBuffer();
      if (buffer) {
        const computedPeaks = computePeaks(buffer, 800);
        setPeaks(computedPeaks);
        updateDeck(id, { 
          trackName: file.name, 
          duration: deckObj.getDuration(),
          playing: false,
          peaks: computedPeaks,
          youtubeId: null
        });
      } else {
        updateDeck(id, { 
          trackName: file.name, 
          duration: deckObj.getDuration(),
          playing: false,
          youtubeId: null
        });
      }
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
        playing: true,
        youtubeId: null
      });
      deckObj.play();
    } catch (e) {
      console.error(e);
    }
  };

  const handleYouTubeURL = () => {
    setShowSearch(!showSearch);
  };

  const performSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/yt-search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
    setIsSearching(false);
  };

  const selectYouTubeVideo = (vId: string, title: string) => {
    deckObj.pause();
    setPeaks([]);
    updateDeck(id, { youtubeId: vId, trackName: title, duration: 100, playing: true });
    setShowSearch(false);
  };

  // Calculate rotation for jog wheel based on position
  const jogRotation = (pos / 2) * 360; // 1 rotation every 2 seconds

  return (
    <div 
      className={`flex-1 p-4 flex flex-col gap-4 relative transition-colors bg-[#1a1a1a] border-r border-[#222] ${isDragging ? 'ring-2 ring-[#1ed760] bg-black/40' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      {/* Top Bar (Track Info) */}
      <div className="flex justify-between items-start h-12">
        <div className="flex flex-col overflow-hidden max-w-[200px]">
          <div className="text-xl font-bold tracking-tight text-[#1ed760]">{id}</div>
          <div className="text-sm font-medium truncate text-gray-300" title={deckState.trackName || 'No track loaded'}>
            {deckState.trackName || 'No track loaded'}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 font-mono text-sm opacity-80 select-none text-white">
          <span className="font-bold text-[#1ed760]">{formatTime(pos)}</span>
          <span>-{formatTime(Math.max(0, deckState.duration - pos))}</span>
        </div>
      </div>

      <div className="flex flex-1 relative">
        
        {/* Search Overlay */}
        {showSearch && (
          <div className="absolute inset-0 z-50 bg-[#111] flex flex-col p-2 gap-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Search YouTube</h3>
              <button onClick={() => setShowSearch(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={performSearch} className="flex gap-2">
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search songs..." 
                className="flex-1 bg-[#222] border border-[#333] text-sm text-white px-2 py-1 rounded outline-none focus:border-[#1ed760]"
              />
              <button type="submit" className="bg-[#1ed760] text-black px-3 py-1 rounded text-sm font-bold">Search</button>
            </form>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {isSearching ? (
                <div className="text-center text-gray-500 text-sm mt-4">Searching...</div>
              ) : (
                searchResults.map((video, idx) => (
                  <div key={idx} onClick={() => selectYouTubeVideo(video.videoId, video.title)} className="flex gap-2 p-2 hover:bg-[#222] cursor-pointer rounded">
                    <img src={video.thumbnail} className="w-16 h-12 object-cover rounded" />
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <div className="text-xs text-white truncate font-bold">{video.title}</div>
                      <div className="text-[10px] text-gray-400 truncate">{video.author}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Deck Area */}
        <div className="flex-1 flex flex-col items-center justify-around">
          
          {deckState.youtubeId ? (
            <div className="w-64 h-48 bg-black border-[6px] border-[#111] shadow-2xl overflow-hidden rounded-md relative">
              <YouTube 
                videoId={deckState.youtubeId} 
                opts={{ width: '256', height: '192', playerVars: { autoplay: 1, controls: 1, disablekb: 0 } }}
                onReady={(e) => {
                  setYtPlayer(e.target);
                  updateDeck(id, { duration: e.target.getDuration() });
                }}
                onStateChange={(e) => {
                  if (e.data === 1) updateDeck(id, { playing: true });
                  else if (e.data === 2) updateDeck(id, { playing: false });
                }}
              />
            </div>
          ) : (
            <div className="relative">
              {/* Jog Wheel */}
              <div 
                className="w-56 h-56 rounded-full border-[6px] border-[#111] bg-[#222] shadow-2xl flex items-center justify-center overflow-hidden"
                style={{ transform: `rotate(${jogRotation}deg)` }}
              >
                {/* Vinyl grooves */}
                <div className="absolute inset-0 rounded-full border border-white/5 m-3 pointer-events-none"></div>
                <div className="absolute inset-0 rounded-full border border-white/5 m-8 pointer-events-none"></div>
                <div className="absolute inset-0 rounded-full border border-white/5 m-12 pointer-events-none"></div>
                <div className="absolute inset-0 rounded-full border border-white/5 m-16 pointer-events-none"></div>
                
                {/* Center label */}
                <div className="w-20 h-20 rounded-full bg-[#111] border border-[#333] flex items-center justify-center relative">
                   <div className="w-2 h-2 rounded-full bg-white/50 absolute top-1"></div>
                </div>
              </div>
            </div>
          )}

          {/* Hot Cues & Transport */}
          <div className="w-full flex flex-col gap-4 px-4">
            {/* Hot Cues Placeholder */}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <button key={i} className="h-8 bg-[#2a2a2a] hover:bg-[#333] rounded text-xs font-bold text-gray-500 border-b-2 border-black active:border-b-0 active:translate-y-[2px]">
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Play/Cue Buttons */}
            <div className="flex gap-4 items-center">
              <button 
                onClick={() => {
                  deckObj.cueToStart();
                  if (deckState.playing) {
                    updateDeck(id, { playing: false });
                  }
                }}
                className="w-16 h-16 rounded-full flex items-center justify-center font-bold bg-[#333] border border-[#444] hover:bg-[#444] text-orange-500 shadow-[0_5px_0_#111] active:translate-y-[5px] active:shadow-none transition-all"
              >
                CUE
              </button>
              <button 
                onClick={() => {
                  if (deckState.youtubeId && ytPlayer) {
                    deckState.playing ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
                  } else {
                    engine.resume();
                    updateDeck(id, { playing: !deckState.playing });
                  }
                }}
                className={`w-16 h-16 rounded-full flex items-center justify-center font-bold shadow-[0_5px_0_#111] active:translate-y-[5px] active:shadow-none transition-all border border-[#444] ${
                  deckState.playing 
                    ? 'bg-[#1ed760] text-black shadow-[0_5px_0_#149643]' 
                    : 'bg-[#333] hover:bg-[#444] text-[#1ed760]'
                }`}
              >
                {deckState.playing ? '||' : '▶'}
              </button>
              
              <div className="ml-auto flex gap-1">
                <button 
                  onClick={handleYouTubeURL}
                  className="px-2 py-1 bg-red-500/20 text-[10px] font-bold text-red-400 rounded hover:bg-red-500/40"
                  title="Load YouTube URL"
                >
                  YT
                </button>
                <button 
                  onClick={handleLiveCapture}
                  className="px-2 py-1 bg-[#2a2a2a] text-[10px] text-red-400 rounded hover:bg-[#333]"
                >
                  Live Tab
                </button>
                <input type="file" accept="audio/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 bg-[#2a2a2a] text-[10px] text-white rounded hover:bg-[#333]"
                >
                  File
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pitch Fader (Far Edge) */}
        <div className="w-16 flex flex-col items-center py-4 bg-[#111] rounded shadow-inner ml-4">
          <div className="text-[10px] font-bold text-gray-400 mb-1">TEMPO</div>
          <div className="text-[10px] text-[#1ed760] mb-4 font-mono">{((deckState.pitch - 1) * 100).toFixed(1)}%</div>
          <div className="flex-1 relative flex justify-center w-full group">
            {/* Track */}
            <div className="absolute inset-y-0 w-1 bg-black rounded-full"></div>
            {/* Zero mark */}
            <div className="absolute top-1/2 w-4 h-[2px] bg-gray-500 -translate-y-1/2"></div>
            
            <input 
              type="range" 
              min="0.9" max="1.1" step="0.001" 
              value={deckState.pitch}
              onChange={(e) => updateDeck(id, { pitch: parseFloat(e.target.value) })}
              onDoubleClick={() => updateDeck(id, { pitch: 1 })}
              className="h-full -rotate-90 appearance-none bg-transparent cursor-pointer z-10 w-[240px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
