export type CrossfaderCurve = 'equal_power' | 'sharp_cut';

export function getCrossfaderGains(x: number, curve: CrossfaderCurve = 'equal_power'): { a: number; b: number } {
  const clampedX = Math.max(0, Math.min(1, x));
  
  if (curve === 'sharp_cut') {
    const a = clampedX > 0.9 ? 1 - (clampedX - 0.9) * 10 : 1;
    const b = clampedX < 0.1 ? clampedX * 10 : 1;
    return { a, b };
  } else {
    const angle = clampedX * Math.PI / 2;
    return {
      a: Math.cos(angle),
      b: Math.sin(angle)
    };
  }
}
