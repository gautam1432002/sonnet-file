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

// Extract YouTube video ID from various URL formats or plain ID
function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  // Plain video ID (11 chars, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1);
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v');
  } catch {
    // not a url
  }
  const match = trimmed.match(/[a-zA-Z0-9_-]{11}/);
  return match ? match[0] : null;
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

  const [ytInput, setYtInput] = useState('');
  const [showYtInput, setShowYtInput] = useState(false);
  const [ytError, setYtError] = useState('');

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
          trackName: file.name.replace(/\.[^/.]+$/, ''),
          duration: deckObj.getDuration(),
          playing: false,
          peaks: computedPeaks,
          youtubeId: null
        });
      } else {
        updateDeck(id, {
          trackName: file.name.replace(/\.[^/.]+$/, ''),
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

  const handleYtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setYtError('');
    const vid = extractYouTubeId(ytInput);
    if (!vid) {
      setYtError('Invalid YouTube URL or ID');
      return;
    }
    deckObj.pause();
    setPeaks([]);
    updateDeck(id, { youtubeId: vid, trackName: `YouTube: ${vid}`, duration: 100, playing: true });
    setYtInput('');
    setShowYtInput(false);
    setShowSearch(false);
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
    setShowYtInput(false);
  };

  const jogRotation = (pos / 2) * 360;
  const hasTrack = !!deckState.trackName && deckState.trackName !== 'No track loaded';
  const progressPct = deckState.duration > 0 ? (pos / deckState.duration) * 100 : 0;

  return (
    <div
      className={`flex flex-col h-full relative transition-all duration-300 ${isDragging ? 'ring-2 ring-inset ring-[var(--accent)]' : ''}`}
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)' }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      {/* Deck Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-black tracking-tighter"
            style={{ color: 'var(--accent)', textShadow: deckState.playing ? '0 0 12px var(--accent)' : 'none' }}
          >
            {id}
          </span>
          <span className="text-xs text-white/40 font-mono">DECK</span>
          {deckState.playing && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          )}
        </div>
        <div className="font-mono text-xs text-white/50 flex gap-2">
          <span style={{ color: 'var(--accent)' }}>{formatTime(pos)}</span>
          <span className="text-white/20">|</span>
          <span>-{formatTime(Math.max(0, deckState.duration - pos))}</span>
        </div>
      </div>

      {/* Track Name */}
      <div className="px-4 pb-2">
        <div
          className="text-xs font-medium truncate text-white/60 tracking-wide"
          title={deckState.trackName || 'Drop audio file or load YouTube'}
        >
          {deckState.trackName || (
            <span className="text-white/20 italic">Drop audio file or load YouTube below</span>
          )}
        </div>
        {/* Progress bar */}
        {hasTrack && (
          <div className="mt-1 h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPct}%`, background: 'var(--accent)' }}
            />
          </div>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 relative">

        {/* Search Overlay */}
        {showSearch && (
          <div className="absolute inset-0 z-50 flex flex-col p-4 gap-3" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white/80 tracking-wider">SEARCH YOUTUBE</span>
              <button onClick={() => setShowSearch(false)} className="text-white/40 hover:text-white text-lg leading-none">✕</button>
            </div>
            <form onSubmit={performSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search songs..."
                autoFocus
                className="flex-1 bg-white/5 border border-white/10 text-sm text-white px-3 py-2 rounded-lg outline-none focus:border-[var(--accent)] transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={{ background: 'var(--accent)', color: '#000' }}
              >
                Search
              </button>
            </form>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              {isSearching ? (
                <div className="text-center text-white/30 text-sm mt-8">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="text-center text-white/20 text-xs mt-8">No results. Try a search above.</div>
              ) : (
                searchResults.map((video, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectYouTubeVideo(video.videoId, video.title)}
                    className="flex gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <img src={video.thumbnail} className="w-20 h-14 object-cover rounded-md flex-shrink-0" />
                    <div className="flex flex-col flex-1 overflow-hidden justify-center">
                      <div className="text-xs text-white/80 truncate font-medium leading-tight">{video.title}</div>
                      <div className="text-[10px] text-white/30 truncate mt-0.5">{video.author}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* YouTube embed or Jog Wheel */}
        {deckState.youtubeId ? (
          <div className="w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            <YouTube
              videoId={deckState.youtubeId}
              opts={{
                width: '100%',
                height: '200',
                playerVars: { autoplay: 1, controls: 1, disablekb: 0, modestbranding: 1, rel: 0 }
              }}
              className="w-full"
              onReady={(e) => {
                setYtPlayer(e.target);
                updateDeck(id, { duration: e.target.getDuration() });
              }}
              onStateChange={(e) => {
                if (e.data === 1) updateDeck(id, { playing: true });
                else if (e.data === 2) updateDeck(id, { playing: false });
              }}
            />
            <button
              onClick={() => { updateDeck(id, { youtubeId: null, trackName: null, playing: false }); setYtPlayer(null); }}
              className="w-full text-xs text-white/30 hover:text-white/60 py-1 text-center transition-colors border-t border-white/5"
            >
              ✕ Unload YouTube
            </button>
          </div>
        ) : (
          <div className="relative flex-shrink-0">
            <div
              className="w-44 h-44 rounded-full flex items-center justify-center overflow-hidden shadow-2xl"
              style={{
                transform: `rotate(${jogRotation}deg)`,
                border: `3px solid rgba(255,255,255,0.08)`,
                background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.05), rgba(0,0,0,0.8))'
              }}
            >
              {[3, 8, 12, 16, 20].map(m => (
                <div key={m} className="absolute inset-0 rounded-full border border-white/5" style={{ margin: m }} />
              ))}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              </div>
            </div>
            {/* Drop hint */}
            {!hasTrack && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none">
                <span className="text-[10px] text-white/20 text-center leading-relaxed tracking-widest">DROP<br/>AUDIO</span>
              </div>
            )}
          </div>
        )}

        {/* Waveform */}
        {peaks.length > 0 && !deckState.youtubeId && (
          <div className="w-full h-12">
            <Waveform peaks={peaks} position={pos} duration={deckState.duration} />
          </div>
        )}
      </div>

      {/* Hot Cues (8 pads) */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <button
              key={i}
              className="h-6 rounded text-[9px] font-bold transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Transport Controls */}
      <div className="px-4 pb-4 flex items-center gap-3">
        {/* CUE button */}
        <button
          onClick={() => { deckObj.cueToStart(); if (deckState.playing) updateDeck(id, { playing: false }); }}
          className="w-14 h-14 rounded-full font-bold text-xs transition-all active:scale-95"
          style={{
            background: 'rgba(255, 120, 0, 0.15)',
            border: '1px solid rgba(255,120,0,0.3)',
            color: '#ff9840',
            boxShadow: '0 4px 0 rgba(0,0,0,0.5)',
          }}
        >
          CUE
        </button>

        {/* PLAY button */}
        <button
          onClick={() => {
            if (deckState.youtubeId && ytPlayer) {
              deckState.playing ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
            } else {
              engine.resume();
              updateDeck(id, { playing: !deckState.playing });
            }
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all active:scale-95 ${deckState.playing ? 'playing-glow' : ''}`}
          style={{
            background: deckState.playing ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${deckState.playing ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
            color: deckState.playing ? '#000' : 'var(--accent)',
            boxShadow: '0 4px 0 rgba(0,0,0,0.5)',
          }}
        >
          {deckState.playing ? '⏸' : '▶'}
        </button>

        {/* Pitch % */}
        <div className="flex flex-col items-center ml-1">
          <span className="text-[9px] text-white/30 font-mono tracking-widest">TEMPO</span>
          <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>
            {((deckState.pitch - 1) * 100).toFixed(1)}%
          </span>
        </div>

        {/* Source buttons (right side) */}
        <div className="ml-auto flex flex-col gap-1">
          {/* YouTube URL paste */}
          <button
            onClick={() => { setShowYtInput(v => !v); setShowSearch(false); }}
            className="px-3 py-1 rounded text-[10px] font-bold transition-all"
            style={{
              background: showYtInput ? 'rgba(255,0,0,0.3)' : 'rgba(255,0,0,0.1)',
              border: '1px solid rgba(255,0,0,0.25)',
              color: '#ff6b6b',
            }}
          >
            ▶ YouTube
          </button>

          {/* File load */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 rounded text-[10px] font-bold transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            ⊕ File
          </button>
          <input type="file" accept="audio/*,video/*" className="hidden" ref={fileInputRef} onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }} />
        </div>
      </div>

      {/* YouTube URL Input (expanded panel) */}
      {showYtInput && (
        <div className="px-4 pb-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <form onSubmit={handleYtSubmit} className="flex gap-2">
            <input
              type="text"
              value={ytInput}
              onChange={e => { setYtInput(e.target.value); setYtError(''); }}
              placeholder="Paste YouTube URL or video ID..."
              autoFocus
              className="flex-1 text-xs bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg outline-none focus:border-[var(--accent)] transition-colors"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg text-xs font-bold"
              style={{ background: '#ff4444', color: '#fff' }}
            >
              Load
            </button>
          </form>
          {ytError && <span className="text-[10px] text-red-400">{ytError}</span>}
          <button
            onClick={() => { setShowSearch(true); setShowYtInput(false); }}
            className="text-[10px] text-white/30 hover:text-white/50 text-left underline transition-colors"
          >
            Search YouTube instead →
          </button>
        </div>
      )}

      {/* Pitch Fader (bottom) */}
      <div className="px-4 pb-4 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
        <span className="text-[9px] text-white/30 font-mono tracking-widest flex-shrink-0">PITCH</span>
        <input
          type="range"
          min="0.9" max="1.1" step="0.001"
          value={deckState.pitch}
          onChange={(e) => updateDeck(id, { pitch: parseFloat(e.target.value) })}
          onDoubleClick={() => updateDeck(id, { pitch: 1 })}
          className="flex-1 horizontal"
        />
      </div>
    </div>
  );
}
