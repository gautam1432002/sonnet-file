import { describe, it, expect } from 'vitest';
import { getCrossfaderGains } from './crossfader';

describe('crossfader', () => {
  it('equal_power is equal power at center', () => {
    const { a, b } = getCrossfaderGains(0.5, 'equal_power');
    expect(a).toBeCloseTo(0.707, 3);
    expect(b).toBeCloseTo(0.707, 3);
  });

  it('equal_power at ends', () => {
    const left = getCrossfaderGains(0, 'equal_power');
    expect(left.a).toBe(1);
    expect(left.b).toBe(0);

    const right = getCrossfaderGains(1, 'equal_power');
    expect(right.a).toBeCloseTo(0, 5);
    expect(right.b).toBe(1);
  });

  it('sharp_cut at center', () => {
    const { a, b } = getCrossfaderGains(0.5, 'sharp_cut');
    expect(a).toBe(1);
    expect(b).toBe(1);
  });

  it('sharp_cut at ends', () => {
    const left = getCrossfaderGains(0, 'sharp_cut');
    expect(left.a).toBe(1);
    expect(left.b).toBe(0);

    const right = getCrossfaderGains(1, 'sharp_cut');
    expect(right.a).toBeCloseTo(0, 5);
    expect(right.b).toBe(1);
  });
});
