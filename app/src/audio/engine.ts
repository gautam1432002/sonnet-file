class AudioEngine {
  public ctx: AudioContext;
  private masterGain: GainNode;
  private limiter: DynamicsCompressorNode;
  public masterAnalyser: AnalyserNode;
  
  constructor() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
    this.masterGain = this.ctx.createGain();
    
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -3;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.1;
    
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    this.masterAnalyser.smoothingTimeConstant = 0.85;
    
    this.masterGain.connect(this.limiter);
    this.limiter.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
  }
  
  resume() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getMasterLevel(): { left: number; right: number } {
    // A more complete level meter would split channels.
    // For Phase 1, we return a single max peak for both.
    const data = new Float32Array(this.masterAnalyser.fftSize);
    this.masterAnalyser.getFloatTimeDomainData(data);
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const val = Math.abs(data[i]);
      if (val > max) max = val;
    }
    return { left: max, right: max };
  }
  
  async setSinkId(deviceId: string): Promise<boolean> {
    if ('setSinkId' in this.ctx) {
      try {
        await (this.ctx as any).setSinkId(deviceId);
        return true;
      } catch (e) {
        console.error('setSinkId error', e);
        return false;
      }
    }
    return false;
  }
  
  get masterInput(): AudioNode {
    return this.masterGain;
  }

  setMasterVolume(val: number) {
    this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.01);
  }
}

export const engine = new AudioEngine();
