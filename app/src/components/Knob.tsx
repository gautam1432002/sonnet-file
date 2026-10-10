import { useState, useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

interface KnobProps {
  label: string;
  value: number; // For custom ranges, use min and max
  min?: number;
  max?: number;
  step?: number;
  color?: string;
  onChange: (val: number) => void;
  onDoubleClick?: () => void;
  size?: number;
}

export function Knob({ label, value, min = 0, max = 1, step = 0.05, color = 'var(--accent)', onChange, onDoubleClick, size = 48 }: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startVal = useRef(value);

  const handlePointerDown = (e: PointerEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startVal.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.clientY;
    const range = max - min;
    const sensitivity = range * 0.005; // Base sensitivity off range
    let newVal = startVal.current + deltaY * sensitivity;
    newVal = Math.max(min, Math.min(max, newVal));
    onChange(newVal);
  };

  const handlePointerUp = (e: PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      onChange(Math.min(max, value + step));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      onChange(Math.max(min, value - step));
    } else if (e.key === 'Home') {
      onChange(max);
    } else if (e.key === 'End') {
      onChange(min);
    }
  };

  // Convert value to angle: -135deg to +135deg
  const normalizedValue = (value - min) / (max - min);
  const angle = -135 + (normalizedValue * 270);

  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className="relative cursor-ns-resize focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded-full touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={onDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{ width: size, height: size }}
        role="slider"
        aria-valuenow={value}
        aria-label={label}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Background track */}
          <path 
            d="M 20 80 A 45 45 0 1 1 80 80" 
            fill="none" 
            className="knob-track" 
            strokeWidth="10" 
            strokeLinecap="round" 
          />
          {/* Value track (we don't easily do a partial arc without complex SVG math, so we just rotate an indicator) */}
          <circle 
            cx="50" cy="50" r="35" 
            fill="var(--glass)" 
            stroke="var(--glass-border)" 
            strokeWidth="2" 
          />
          <g transform={`rotate(${angle} 50 50)`}>
            <line x1="50" y1="50" x2="50" y2="20" stroke={color} strokeWidth="4" strokeLinecap="round" />
          </g>
        </svg>
      </div>
      <span className="text-xs uppercase tracking-wider text-gray-300 font-medium select-none">{label}</span>
    </div>
  );
}
