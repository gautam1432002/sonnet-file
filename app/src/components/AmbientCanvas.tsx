import { useEffect, useRef } from 'react';

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  targetHue: number;
}

interface Particle {
  x: number;
  y: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
}

function parseHsl(cssColor: string): number {
  const hslMatch = cssColor.match(/hsl\((\d+)/);
  if (hslMatch) return parseInt(hslMatch[1]);
  let h = 0;
  for (let i = 0; i < cssColor.length; i++) h = (h * 31 + cssColor.charCodeAt(i)) & 0xffff;
  return h % 360;
}

export function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<Orb[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastColorRef = useRef<string>('');

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize large liquid orbs
    const initOrbs = () => {
      orbsRef.current = Array.from({ length: 5 }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: canvas.width * (0.3 + Math.random() * 0.3), // Massive radius for fluid look
        hue: (i * 60) % 360,
        targetHue: (i * 60) % 360,
      }));
    };
    initOrbs();

    let frameCount = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Update hue target from CSS var
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      if (accentColor !== lastColorRef.current && accentColor) {
        lastColorRef.current = accentColor;
        const baseHue = parseHsl(accentColor);
        orbsRef.current.forEach((orb, i) => {
          orb.targetHue = (baseHue + (i * 35)) % 360; // Analogous/Split complementary
        });
      }

      // Fill background very dark
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#020202';
      ctx.fillRect(0, 0, w, h);

      // Draw liquid orbs
      ctx.globalCompositeOperation = 'screen';
      
      for (const orb of orbsRef.current) {
        // Smooth hue interpolation
        const diff = ((orb.targetHue - orb.hue + 540) % 360) - 180;
        orb.hue += diff * 0.005;

        // Fluid drift with sine wave variation
        orb.x += orb.vx + Math.sin(frameCount * 0.001 + orb.hue) * 0.5;
        orb.y += orb.vy + Math.cos(frameCount * 0.001 + orb.hue) * 0.5;

        // Wrap around
        if (orb.x < -orb.radius) orb.x = w + orb.radius;
        if (orb.x > w + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = h + orb.radius;
        if (orb.y > h + orb.radius) orb.y = -orb.radius;

        // Radial gradient for deep solid liquid feel
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        grad.addColorStop(0, `hsla(${orb.hue}, 90%, 25%, 0.6)`);
        grad.addColorStop(0.4, `hsla(${(orb.hue + 20) % 360}, 100%, 15%, 0.3)`);
        grad.addColorStop(1, `hsla(${(orb.hue + 40) % 360}, 100%, 5%, 0)`);

        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Shimmer Particles
      ctx.globalCompositeOperation = 'lighter';
      
      // Spawn new particles occasionally
      if (Math.random() < 0.3) {
        const baseHue = orbsRef.current[0]?.hue ?? 180;
        particlesRef.current.push({
          x: Math.random() * w,
          y: h + 10, // Start below screen
          vy: -(0.2 + Math.random() * 0.8),
          size: 0.5 + Math.random() * 1.5,
          life: 0,
          maxLife: 200 + Math.random() * 300,
          hue: (baseHue + (Math.random() - 0.5) * 40) % 360
        });
      }

      // Update and draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life++;
        p.x += Math.sin(p.life * 0.02) * 0.3; // Wiggle
        p.y += p.vy;

        const fade = Math.sin((p.life / p.maxLife) * Math.PI); // 0 to 1 to 0
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${fade * 0.8})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 50%, ${fade})`;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.life >= p.maxLife || p.y < -10) {
          particlesRef.current.splice(i, 1);
        }
      }

      frameCount++;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
