import { useRef, useEffect } from 'react';
import { useStore, deckAObj, deckBObj } from '../store';

export function StackedWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const deckA = useStore(state => state.deckA);
  const deckB = useStore(state => state.deckB);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const halfHeight = height / 2;

    let handle: number;
    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Draw middle separator
      ctx.fillStyle = '#222';
      ctx.fillRect(0, halfHeight - 1, width, 2);

      const drawWaveform = (deckState: any, deckObj: any, yOffset: number, color: string) => {
        const { peaks, duration } = deckState;
        if (!peaks || peaks.length === 0 || duration <= 0) return;
        
        const pos = deckObj.getPosition();
        // Zoom level: how many seconds visible on screen?
        const windowSeconds = 12; 
        const playheadPct = pos / duration;
        
        // Find center index in peaks array
        const centerIndex = playheadPct * peaks.length;
        
        // Peaks per second = peaks.length / duration
        const peaksPerWindow = (windowSeconds / duration) * peaks.length;
        const startIndex = Math.floor(centerIndex - peaksPerWindow / 2);
        const endIndex = Math.ceil(centerIndex + peaksPerWindow / 2);
        
        const step = width / peaksPerWindow;
        
        ctx.beginPath();
        for (let i = startIndex; i <= endIndex; i++) {
          if (i >= 0 && i < peaks.length) {
            const x = (i - (centerIndex - peaksPerWindow / 2)) * step;
            const y = (peaks[i] * halfHeight);
            ctx.moveTo(x, yOffset - y);
            ctx.lineTo(x, yOffset + y);
          }
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, step - 0.5);
        ctx.stroke();
      };

      // Draw A (Top half)
      drawWaveform(deckA, deckAObj, halfHeight / 2, '#1ed760'); // Bright green
      // Draw B (Bottom half)
      drawWaveform(deckB, deckBObj, halfHeight + halfHeight / 2, '#3b82f6'); // Blue

      // Draw central playhead
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(width / 2 - 1, 0, 2, height);
      
      handle = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(handle);
  }, [deckA, deckB]);

  return (
    <div className="w-full h-40 bg-[#0a0a0a] border border-[#222] rounded overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={1000} 
        height={160} 
        className="w-full h-full"
      />
    </div>
  );
}
