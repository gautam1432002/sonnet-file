import { useEffect, useRef } from 'react';

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  targetHue: number;
  alpha: number;
}

function parseHsl(cssColor: string): number {
  // Try to extract hue from hsl() or hex
  const hslMatch = cssColor.match(/hsl\((\d+)/);
  if (hslMatch) return parseInt(hslMatch[1]);
  // fallback: hash the string to a hue
  let h = 0;
  for (let i = 0; i < cssColor.length; i++) h = (h * 31 + cssColor.charCodeAt(i)) & 0xffff;
  return h % 360;
}

export function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<Orb[]>([]);
  const rafRef = useRef<number>(0);
  const lastColorRef = useRef<string>('');

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init orbs
    const initOrbs = () => {
      orbsRef.current = Array.from({ length: 7 }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 200 + Math.random() * 300,
        hue: (i * 51) % 360,
        targetHue: (i * 51) % 360,
        alpha: 0.12 + Math.random() * 0.08,
      }));
    };
    initOrbs();

    let frameCount = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Read current accent hue from CSS var
      const accentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim();

      if (accentColor !== lastColorRef.current) {
        lastColorRef.current = accentColor;
        const baseHue = parseHsl(accentColor);
        orbsRef.current.forEach((orb, i) => {
          orb.targetHue = (baseHue + i * 45) % 360;
        });
      }

      // Clear with near-black
      ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
      ctx.fillRect(0, 0, w, h);

      frameCount++;

      for (const orb of orbsRef.current) {
        // Lerp hue toward target
        const diff = ((orb.targetHue - orb.hue + 540) % 360) - 180;
        orb.hue += diff * 0.005;

        // Drift
        orb.x += orb.vx;
        orb.y += orb.vy;

        // Bounce softly
        if (orb.x < -orb.radius) orb.x = w + orb.radius;
        if (orb.x > w + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = h + orb.radius;
        if (orb.y > h + orb.radius) orb.y = -orb.radius;

        // Draw radial gradient orb
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        grad.addColorStop(0, `hsla(${orb.hue}, 90%, 60%, ${orb.alpha})`);
        grad.addColorStop(0.5, `hsla(${(orb.hue + 30) % 360}, 80%, 45%, ${orb.alpha * 0.5})`);
        grad.addColorStop(1, `hsla(${(orb.hue + 60) % 360}, 70%, 30%, 0)`);

        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Shimmer particles
      if (frameCount % 3 === 0) {
        for (let i = 0; i < 3; i++) {
          const px = Math.random() * w;
          const py = Math.random() * h;
          const hue = orbsRef.current[0]?.hue ?? 180;
          ctx.beginPath();
          ctx.arc(px, py, 1 + Math.random() * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 100%, 85%, ${Math.random() * 0.4})`;
          ctx.fill();
        }
      }

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
