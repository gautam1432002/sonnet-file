export function computePeaks(buffer: AudioBuffer, width: number): number[] {
  if (width === 0) return [];
  const channelData = buffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / width);
  const peaks = new Array(width).fill(0);
  
  const step = Math.max(1, Math.floor(blockSize / 200));

  for (let i = 0; i < width; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize; j += step) {
      const val = Math.abs(channelData[start + j]);
      if (val > max) max = val;
    }
    peaks[i] = max;
  }
  return peaks;
}
