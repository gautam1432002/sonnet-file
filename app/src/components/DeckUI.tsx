import { useRef, useState, useEffect } from 'react';
import { useStore, deckAObj, deckBObj } from '../store';
import { Waveform } from './Waveform';
import { computePeaks } from '../audio/peaks';
import { engine } from '../audio/engine';
import { BufferSourceAdapter } from '../audio/sources/SourceAdapter';
import { Knob } from './Knob';
import YouTube from 'react-youtube';
import type { YouTubePlayer } from 'react-youtube';

interface DeckUIProps { id: 'A' | 'B'; }

function formatTime(secs: number) {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function extractYouTubeId(input: string): string | null {
  const t = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(t)) return t;
  try {
    const url = new URL(t);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1).split('?')[0];
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v');
  } catch { /* not a URL */ }
  const m = t.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const accent = 'var(--accent)';

export function DeckUI({ id }: DeckUIProps) {
  const deckState = useStore(s => id === 'A' ? s.deckA : s.deckB);
  const updateDeck = useStore(s => s.updateDeck);
  const crossfader = useStore(s => s.crossfader);
  const crossfaderCurve = useStore(s => s.crossfaderCurve);
  const deckObj = id === 'A' ? deckAObj : deckBObj;

  const [peaks, setPeaks] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [ytPlayer, setYtPlayer] = useState<YouTubePlayer | null>(null);
  const [ytInput, setYtInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [echoActive, setEchoActive] = useState(false);
  const [virtualityActive, setVirtualityActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let h: number;
    const loop = () => {
      setPos(deckState.youtubeId && ytPlayer ? ytPlayer.getCurrentTime() || 0 : deckObj.getPosition());
      h = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(h);
  }, [deckObj, deckState.youtubeId, ytPlayer]);

  useEffect(() => {
    if (!ytPlayer) return;
    import('../audio/crossfader').then(({ getCrossfaderGains }) => {
      const gains = getCrossfaderGains(crossfader, crossfaderCurve);
      const xg = id === 'A' ? gains.a : gains.b;
      ytPlayer.setVolume(deckState.volume * (deckState.trim / 2) * xg * 100);
    });
  }, [ytPlayer, deckState.volume, deckState.trim, crossfader, crossfaderCurve, id]);

  const handleFile = async (file: File) => {
    updateDeck(id, { trackName: 'LOADING...' });
    try {
      await engine.ctx.resume();
      await deckObj.load(file);
      const adapter = deckObj.sourceAdapter as BufferSourceAdapter;
      const buffer = adapter.getBuffer();
      const name = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
      if (buffer) {
        const p = computePeaks(buffer, 800);
        setPeaks(p);
        updateDeck(id, { trackName: name, duration: deckObj.getDuration(), playing: false, peaks: p, youtubeId: null });
      } else {
        updateDeck(id, { trackName: name, duration: deckObj.getDuration(), playing: false, youtubeId: null });
      }
      deckObj.seek(0);
    } catch { updateDeck(id, { trackName: 'ERROR' }); }
  };

  const handleYtLoad = (e: React.FormEvent) => {
    e.preventDefault();
    const vid = extractYouTubeId(ytInput);
    if (!vid) return;
    deckObj.pause();
    setPeaks([]);
    updateDeck(id, { youtubeId: vid, trackName: `YT ID: ${vid}`, duration: 0, playing: true });
    setYtInput('');
    setShowSearch(false);
  };

  const performSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/yt-search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(await res.json());
    } catch { /* ignore */ }
    setIsSearching(false);
  };

  const loadYTVideo = (v: any) => {
    deckObj.pause(); setPeaks([]);
    updateDeck(id, { youtubeId: v.videoId, trackName: v.title.toUpperCase(), artist: v.author, artworkUrl: v.thumbnail, duration: 0, playing: true });
    setShowSearch(false);
  };

  const unloadYT = () => {
    deckObj.pause(); setYtPlayer(null); setPeaks([]);
    updateDeck(id, { youtubeId: null, trackName: null, playing: false });
  };

  const progressPct = deckState.duration > 0 ? Math.min(100, (pos / deckState.duration) * 100) : 0;
  const jogRot = (pos / 2) * 360;
  const isPlaying = deckState.playing;
  const activeColor = id === 'A' ? 'var(--deck-a-accent)' : 'var(--deck-b-accent)';

  const handleEchoToggle = () => {
    const newState = !echoActive;
    setEchoActive(newState);
    deckObj.effects.toggleEcho(newState);
  };

  const handleVirtualityToggle = () => {
    const newState = !virtualityActive;
    setVirtualityActive(newState);
    deckObj.effects.toggleVirtuality(newState);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
      onDragOver={e => { e.preventDefault(); }}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
    >
      {/* ─── Search Overlay ─── */}
      {showSearch && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', padding: 20, gap: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.2em', color: accent }}>SEARCH YOUTUBE</span>
            <button onClick={() => setShowSearch(false)} style={{ color: '#fff', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
          </div>
          <form onSubmit={performSearch} style={{ display: 'flex', gap: 10 }}>
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tracks..." autoFocus
              style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: '#fff', padding: '12px 16px', outline: 'none', fontSize: 14 }}
            />
            <button type="submit" style={{ padding: '0 24px', borderRadius: 6, background: accent, color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer' }}>GO</button>
          </form>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {isSearching ? <div style={{ color: accent, textAlign: 'center', padding: 40, letterSpacing: '0.1em' }}>SEARCHING...</div> :
              searchResults.map((v, i) => (
                <div key={i} onClick={() => loadYTVideo(v)} style={{
                  display: 'flex', gap: 12, padding: 8, borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.02)',
                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                  <img src={v.thumbnail} style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 4 }} alt="" />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{v.title}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{v.author}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ─── Deck Header ─── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: isPlaying ? accent : 'rgba(255,255,255,0.1)', transition: 'color 3.5s ease' }}>
              {id}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', marginTop: 4 }}>
              {deckState.trackName || 'NO TRACK LOADED'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>
              {formatTime(pos)}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: accent, transition: 'width 0.2s linear, background 3.5s ease' }} />
        </div>
      </div>

      {/* ─── Main Visual & Effects ─── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: 16, overflow: 'hidden' }}>
        
        {/* Platter / Video */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {deckState.youtubeId ? (
            <div style={{ width: '100%', position: 'relative' }}>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <YouTube
                  videoId={deckState.youtubeId}
                  opts={{ width: '100%', height: '220', playerVars: { autoplay: 1, controls: 1, modestbranding: 1 } }}
                  onReady={e => { setYtPlayer(e.target); updateDeck(id, { duration: e.target.getDuration() }); }}
                  onStateChange={e => {
                    if (e.data === 1) updateDeck(id, { playing: true });
                    else if (e.data === 2 || e.data === 0) updateDeck(id, { playing: false });
                  }}
                />
              </div>
              <button onClick={unloadYT} style={{
                position: 'absolute', top: -30, right: 0, fontSize: 10, color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.1em'
              }}>EJECT YT</button>
            </div>
          ) : (
            <div style={{
              width: 180, height: 180, borderRadius: '50%',
              transform: `rotate(${jogRot}deg)`,
              background: 'radial-gradient(circle, rgba(30,30,30,1) 0%, rgba(10,10,10,1) 100%)',
              border: '2px solid rgba(255,255,255,0.05)',
              boxShadow: isPlaying ? `0 0 40px rgba(0,0,0,0.8), inset 0 0 0 2px ${activeColor}` : '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              transition: 'box-shadow 3.5s ease',
            }}>
              <div style={{ position: 'absolute', inset: 15, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }} />
              <div style={{ position: 'absolute', inset: 30, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.1)' }} />
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#050505', border: `2px solid ${isPlaying ? activeColor : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 3.5s ease'
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isPlaying ? activeColor : 'rgba(255,255,255,0.2)' }} />
              </div>
            </div>
          )}
        </div>

        {/* Effects Panel */}
        <div style={{ 
          display: 'flex', gap: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Knob 
              label="GAIN" min={0} max={2} step={0.1} value={1} size={32}
              onChange={(val) => deckObj.effects.setGain(val)} color={activeColor}
            />
            <Knob 
              label="TREB" min={-40} max={15} step={1} value={0} size={32}
              onChange={(val) => deckObj.effects.setTreble(val)} color={activeColor}
            />
            <Knob 
              label="BASS" min={-40} max={15} step={1} value={0} size={32}
              onChange={(val) => deckObj.effects.setBass(val)} color={activeColor}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
            <button 
              onClick={handleEchoToggle}
              style={{
                padding: '12px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 10, transition: 'all 0.2s',
                border: `1px solid ${echoActive ? activeColor : 'rgba(255,255,255,0.1)'}`,
                backgroundColor: echoActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: echoActive ? activeColor : 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '0.1em'
              }}
            >
              ECHO
            </button>
            <button 
              onClick={handleVirtualityToggle}
              style={{
                padding: '12px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 10, transition: 'all 0.2s',
                border: `1px solid ${virtualityActive ? activeColor : 'rgba(255,255,255,0.1)'}`,
                backgroundColor: virtualityActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: virtualityActive ? activeColor : 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '0.1em'
              }}
            >
              VIRTUAL
            </button>
          </div>
        </div>

      </div>

      {/* ─── Waveform ─── */}
      {peaks.length > 0 && !deckState.youtubeId && (
        <div style={{ padding: '0 20px', height: 60, flexShrink: 0, marginBottom: 10 }}>
          <Waveform peaks={peaks} position={pos} duration={deckState.duration} />
        </div>
      )}

      {/* ─── Transport & Controls ─── */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* CUE (Skip Back) */}
          <button onClick={() => { deckObj.cueToStart(); if (isPlaying) updateDeck(id, { playing: false }); }}
            style={{ width: 44, height: 44, background: 'transparent', border: 'none', color: '#ff6600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19 20 9 12 19 4 19 20"></polygon>
              <rect x="5" y="4" width="3" height="16"></rect>
            </svg>
          </button>
          
          {/* PLAY / PAUSE */}
          <button onClick={() => {
              if (deckState.youtubeId && ytPlayer) { isPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo(); } 
              else { engine.resume(); updateDeck(id, { playing: !isPlaying }); }
            }}
            style={{ width: 44, height: 44, background: 'transparent', border: 'none', color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9, transition: 'opacity 0.2s, color 3.5s ease' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.9'}
          >
            {isPlaying ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Pitch Fader */}
          <div style={{ width: 100 }}>
            <input type="range" min="0.9" max="1.1" step="0.001" value={deckState.pitch}
              onChange={e => updateDeck(id, { pitch: parseFloat(e.target.value) })}
              onDoubleClick={() => updateDeck(id, { pitch: 1 })}
              className="pitch-fader" style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setShowSearch(true)} style={{ width: 32, height: 32, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={{ width: 32, height: 32, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </button>
          </div>
        </div>
      </div>
      
      <input type="file" accept="audio/*" className="hidden" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}
