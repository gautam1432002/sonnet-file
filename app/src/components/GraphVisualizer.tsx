import React, { useRef, useEffect } from 'react';

interface GraphVisualizerProps {
  analyser: AnalyserNode | null;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      // Loop the animation
      animationRef.current = requestAnimationFrame(draw);

      // Get real-time frequency data
      analyser.getByteFrequencyData(dataArray);

      // Clear the canvas for the next frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Bar settings
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // Professional Gradient: Cyan to Magenta to match your decks
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, 'var(--deck-a-accent)'); // Cyan
        gradient.addColorStop(1, 'var(--deck-b-accent)'); // Magenta

        ctx.fillStyle = gradient;
        
        // Draw the bar (origin is top-left, so we calculate Y from the bottom)
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 2; // gap
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser]);

  return (
    <div className="visualizer-container bento" style={{ 
      width: '100%', 
      height: '100px', 
      flexShrink: 0,
      backgroundColor: 'rgba(23, 23, 23, 0.4)', // transparent glass
      border: '1px solid var(--glass-border)',
      boxShadow: 'inset 0 1px 0 var(--glass-highlight)',
      overflow: 'hidden',
      borderRadius: 'var(--radius)',
    }}>
      <canvas 
        ref={canvasRef} 
        width={1100} 
        height={100} 
        style={{ width: '100%', height: '100%', display: 'block' }} 
      />
    </div>
  );
};
