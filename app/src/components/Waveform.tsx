import { useRef, useEffect } from 'react';
import type { PointerEvent } from 'react';

interface WaveformProps {
  peaks: number[];
  position: number;
  duration: number;
  onSeek: (pos: number) => void;
}

export function Waveform({ peaks, position, duration, onSeek }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handlePointerDown = (e: PointerEvent) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    onSeek(pct * duration);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Use resize observer for real responsive canvas maybe?
    // For Phase 1 simple static size mapping is fine
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (peaks.length === 0) return;
    
    // Current position pixel
    const progressX = duration > 0 ? (position / duration) * width : 0;
    
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    
    const step = width / peaks.length;
    for (let i = 0; i < peaks.length; i++) {
      const x = i * step;
      const y = (peaks[i] * height) / 2;
      ctx.moveTo(x, height / 2 - y);
      ctx.lineTo(x, height / 2 + y);
    }
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = Math.max(1, step - 0.5);
    ctx.stroke();
    
    // Fill past progress
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00ffcc';
    ctx.fillRect(0, 0, progressX, height);
    ctx.globalCompositeOperation = 'source-over';
    
    // Playhead
    ctx.fillStyle = 'white';
    ctx.fillRect(progressX, 0, 2, height);
    
  }, [peaks, position, duration]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-16 bg-black/30 rounded-lg cursor-pointer overflow-hidden"
      onPointerDown={handlePointerDown}
    >
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={64} 
        className="w-full h-full pointer-events-none"
      />
    </div>
  );
}
