import { useRef, useState, useEffect } from 'react';
import { useStore, deckAObj, deckBObj } from '../store';
import { Waveform } from './Waveform';
import { computePeaks } from '../audio/peaks';
import { engine } from '../audio/engine';
import { BufferSourceAdapter } from '../audio/sources/SourceAdapter';
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
  const [ytError, setYtError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Position polling
  useEffect(() => {
    let h: number;
    const loop = () => {
      setPos(deckState.youtubeId && ytPlayer ? ytPlayer.getCurrentTime() || 0 : deckObj.getPosition());
      h = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(h);
  }, [deckObj, deckState.youtubeId, ytPlayer]);

  // YT volume sync
  useEffect(() => {
    if (!ytPlayer) return;
    import('../audio/crossfader').then(({ getCrossfaderGains }) => {
      const gains = getCrossfaderGains(crossfader, crossfaderCurve);
      const xg = id === 'A' ? gains.a : gains.b;
      ytPlayer.setVolume(deckState.volume * (deckState.trim / 2) * xg * 100);
    });
  }, [ytPlayer, deckState.volume, deckState.trim, crossfader, crossfaderCurve, id]);

  const handleFile = async (file: File) => {
    updateDeck(id, { trackName: 'Loading…' });
    try {
      await engine.ctx.resume();
      await deckObj.load(file);
      const adapter = deckObj.sourceAdapter as BufferSourceAdapter;
      const buffer = adapter.getBuffer();
      const name = file.name.replace(/\.[^/.]+$/, '');
      if (buffer) {
        const p = computePeaks(buffer, 800);
        setPeaks(p);
        updateDeck(id, { trackName: name, duration: deckObj.getDuration(), playing: false, peaks: p, youtubeId: null });
      } else {
        updateDeck(id, { trackName: name, duration: deckObj.getDuration(), playing: false, youtubeId: null });
      }
      deckObj.seek(0);
    } catch { updateDeck(id, { trackName: 'Error loading' }); }
  };

  const handleYtLoad = (e: React.FormEvent) => {
    e.preventDefault();
    setYtError('');
    const vid = extractYouTubeId(ytInput);
    if (!vid) { setYtError('Invalid YouTube URL'); return; }
    deckObj.pause();
    setPeaks([]);
    updateDeck(id, { youtubeId: vid, trackName: `YT: ${vid}`, duration: 0, playing: true });
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

  const loadYTVideo = (vId: string, title: string) => {
    deckObj.pause(); setPeaks([]);
    updateDeck(id, { youtubeId: vId, trackName: title, duration: 0, playing: true });
    setShowSearch(false);
  };

  const unloadYT = () => {
    deckObj.pause(); setYtPlayer(null); setPeaks([]);
    updateDeck(id, { youtubeId: null, trackName: null, playing: false });
  };

  const progressPct = deckState.duration > 0 ? Math.min(100, (pos / deckState.duration) * 100) : 0;
  const jogRot = (pos / 2) * 360;
  const isPlaying = deckState.playing;
  const hasTrack = !!deckState.trackName;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 99,
          background: 'rgba(0,0,0,0.7)',
          border: `2px dashed ${accent}`,
          borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: accent, fontWeight: 700, letterSpacing: '0.1em',
        }}>
          DROP TO LOAD
        </div>
      )}

      {/* ─── Search overlay ─── */}
      {showSearch && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(24px)',
          borderRadius: 20, display: 'flex', flexDirection: 'column',
          padding: 16, gap: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.6)' }}>
              SEARCH YOUTUBE
            </span>
            <button onClick={() => setShowSearch(false)} style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>
              ✕
            </button>
          </div>
          <form onSubmit={performSearch} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search songs, artists…"
              autoFocus
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                color: '#fff', fontSize: 13, padding: '8px 12px', outline: 'none',
              }}
            />
            <button type="submit" style={{
              padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: 12,
              background: accent, color: '#000', border: 'none', cursor: 'pointer',
            }}>
              Search
            </button>
          </form>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isSearching ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: 40, fontSize: 13 }}>Searching…</div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.15)', marginTop: 40, fontSize: 12 }}>Type to search</div>
            ) : searchResults.map((v, i) => (
              <div key={i} onClick={() => loadYTVideo(v.videoId, v.title)} style={{
                display: 'flex', gap: 10, padding: 8, borderRadius: 10, cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)', transition: 'background 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              >
                <img src={v.thumbnail} style={{ width: 80, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} alt="" />
                <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{v.author}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Deck Header ─── */}
      <div style={{ padding: '14px 16px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 26, fontWeight: 900, letterSpacing: '-0.05em',
              color: accent,
              textShadow: isPlaying ? `0 0 16px ${accent}` : 'none',
              transition: 'text-shadow 1s ease, color 3.5s ease',
            }}>{id}</span>
            {isPlaying && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: accent, boxShadow: `0 0 8px ${accent}`,
                display: 'inline-block', transition: 'background 3.5s ease',
              }} className="animate-pulse" />
            )}
          </div>
          {/* Time */}
          <div style={{ fontFamily: 'monospace', textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: accent, transition: 'color 3.5s ease' }}>
              {formatTime(pos)}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
              -{formatTime(Math.max(0, deckState.duration - pos))}
            </div>
          </div>
        </div>

        {/* Track name */}
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontWeight: 500,
        }}>
          {deckState.trackName || <span style={{ color: 'rgba(255,255,255,0.18)', fontStyle: 'italic' }}>Drop a file or load YouTube</span>}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 8, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progressPct}%`,
            background: accent, transition: 'width 0.5s linear, background 3.5s ease',
            borderRadius: 1,
          }} />
        </div>
      </div>

      {/* ─── Main Visual Area ─── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', minHeight: 0 }}>
        {deckState.youtubeId ? (
          <div style={{ width: '100%' }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
              <YouTube
                videoId={deckState.youtubeId}
                opts={{ width: '100%', height: '185', playerVars: { autoplay: 1, controls: 1, modestbranding: 1, rel: 0 } }}
                className="w-full block"
                onReady={e => { setYtPlayer(e.target); updateDeck(id, { duration: e.target.getDuration() }); }}
                onStateChange={e => {
                  if (e.data === 1) updateDeck(id, { playing: true });
                  else if (e.data === 2 || e.data === 0) updateDeck(id, { playing: false });
                }}
              />
            </div>
            <button onClick={unloadYT} style={{
              display: 'block', width: '100%', marginTop: 6, padding: '4px 0',
              fontSize: 10, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none',
              cursor: 'pointer', letterSpacing: '0.1em',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
            >
              ✕ UNLOAD
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* Jog wheel */}
            <div style={{
              width: 150, height: 150, borderRadius: '50%',
              transform: `rotate(${jogRot}deg)`,
              background: 'radial-gradient(circle at 38% 35%, rgba(255,255,255,0.06), rgba(0,0,0,0.85))',
              border: '2px solid rgba(255,255,255,0.07)',
              boxShadow: isPlaying ? `0 0 30px rgba(0,0,0,0.8), 0 0 0 1px ${accent}33` : '0 0 30px rgba(0,0,0,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
              transition: 'box-shadow 1s ease',
            }}>
              {/* Groove rings */}
              {[10, 22, 34, 46].map(m => (
                <div key={m} style={{
                  position: 'absolute', inset: m, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.04)',
                }} />
              ))}
              {/* Center label */}
              <div style={{
                width: 50, height: 50, borderRadius: '50%', zIndex: 1,
                background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
              </div>
            </div>
            {!hasTrack && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.2em', textAlign: 'center', lineHeight: 1.8 }}>
                  DROP<br />AUDIO
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Waveform ─── */}
      {peaks.length > 0 && !deckState.youtubeId && (
        <div style={{ padding: '0 16px', flexShrink: 0 }}>
          <Waveform peaks={peaks} position={pos} duration={deckState.duration} />
        </div>
      )}

      {/* ─── Transport ─── */}
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* CUE */}
        <button
          onClick={() => { deckObj.cueToStart(); if (isPlaying) updateDeck(id, { playing: false }); }}
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,120,0,0.12)', border: '1px solid rgba(255,120,0,0.25)',
            color: '#ff9840', fontSize: 10, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 0 rgba(0,0,0,0.5)', letterSpacing: '0.05em',
            transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,120,0,0.22)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,120,0,0.12)')}
        >
          CUE
        </button>

        {/* PLAY */}
        <button
          onClick={() => {
            if (deckState.youtubeId && ytPlayer) {
              isPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
            } else {
              engine.resume();
              updateDeck(id, { playing: !isPlaying });
            }
          }}
          className={isPlaying ? 'playing-glow' : ''}
          style={{
            width: 54, height: 54, borderRadius: '50%', fontSize: 18,
            background: isPlaying ? accent : 'rgba(255,255,255,0.07)',
            border: `1px solid ${isPlaying ? accent : 'rgba(255,255,255,0.1)'}`,
            color: isPlaying ? '#000' : accent,
            cursor: 'pointer', fontWeight: 700, flexShrink: 0,
            boxShadow: '0 4px 0 rgba(0,0,0,0.5)',
            transition: 'background 0.2s, color 0.2s, border 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Pitch */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>PITCH</span>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: accent, transition: 'color 3.5s ease' }}>
              {((deckState.pitch - 1) * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range" min="0.9" max="1.1" step="0.001"
            value={deckState.pitch}
            onChange={e => updateDeck(id, { pitch: parseFloat(e.target.value) })}
            onDoubleClick={() => updateDeck(id, { pitch: 1 })}
            className="pitch-fader"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* ─── YouTube Load Bar ─── */}
      <div style={{
        padding: '0 16px 14px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: 10,
        flexShrink: 0,
      }}>
        <form onSubmit={handleYtLoad} style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={ytInput}
            onChange={e => { setYtInput(e.target.value); setYtError(''); }}
            placeholder="YouTube URL or video ID…"
            style={{
              flex: 1, fontSize: 11, padding: '7px 10px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${ytError ? 'rgba(255,80,80,0.4)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 8, color: '#fff', outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          <button type="submit" style={{
            padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
            background: 'rgba(255,30,30,0.18)', color: '#ff6b6b',
            border: '1px solid rgba(255,30,30,0.25)', cursor: 'pointer',
            letterSpacing: '0.05em', flexShrink: 0,
          }}>
            ▶ YT
          </button>
          <button
            type="button"
            onClick={() => setShowSearch(v => !v)}
            style={{
              padding: '7px 10px', borderRadius: 8, fontSize: 11,
              background: showSearch ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
            }}
            title="Search YouTube"
          >
            🔍
          </button>
        </form>
        {ytError && <p style={{ fontSize: 10, color: '#ff6b6b', marginTop: 4, margin: '4px 0 0' }}>{ytError}</p>}
      </div>

      {/* File input */}
      <input type="file" accept="audio/*,video/*" className="hidden" ref={fileInputRef}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {/* File load button — tiny, bottom right corner */}
      <button
        onClick={() => fileInputRef.current?.click()}
        style={{
          position: 'absolute', bottom: 14, right: 14,
          padding: '4px 8px', borderRadius: 6, fontSize: 9,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.25)', cursor: 'pointer', letterSpacing: '0.08em',
          fontWeight: 600,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
      >
        FILE
      </button>
    </div>
  );
}
