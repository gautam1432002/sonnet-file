import { engine } from './engine';
import { cueSystem } from './cue';
import { BufferSourceAdapter } from './sources/SourceAdapter';
import type { SourceAdapter } from './sources/SourceAdapter';

export class Deck {
  public id: 'A' | 'B';
  public sourceAdapter: SourceAdapter | null = null;
  
  private trimNode: GainNode;
  private lowEq: BiquadFilterNode;
  private midEq: BiquadFilterNode;
  private highEq: BiquadFilterNode;
  private filterLowPass: BiquadFilterNode;
  private filterHighPass: BiquadFilterNode;
  private channelFader: GainNode;
  private crossfaderGain: GainNode;
  private cueGain: GainNode;
  

  
  constructor(id: 'A' | 'B') {
    this.id = id;
    const ctx = engine.ctx;
    
    this.trimNode = ctx.createGain();
    
    this.lowEq = ctx.createBiquadFilter();
    this.lowEq.type = 'lowshelf';
    this.lowEq.frequency.value = 250;
    
    this.midEq = ctx.createBiquadFilter();
    this.midEq.type = 'peaking';
    this.midEq.frequency.value = 1000;
    this.midEq.Q.value = 0.7;
    
    this.highEq = ctx.createBiquadFilter();
    this.highEq.type = 'highshelf';
    this.highEq.frequency.value = 4000;
    
    this.filterLowPass = ctx.createBiquadFilter();
    this.filterLowPass.type = 'lowpass';
    this.filterLowPass.frequency.value = 20000; // flat
    
    this.filterHighPass = ctx.createBiquadFilter();
    this.filterHighPass.type = 'highpass';
    this.filterHighPass.frequency.value = 10; // flat
    
    this.channelFader = ctx.createGain();
    this.crossfaderGain = ctx.createGain();
    
    this.cueGain = ctx.createGain();
    this.cueGain.gain.value = 0;
    
    // Chain: Trim -> Low -> Mid -> High -> FilterLP -> FilterHP -> Channel Fader -> Crossfader -> Master
    this.trimNode.connect(this.lowEq);
    this.lowEq.connect(this.midEq);
    this.midEq.connect(this.highEq);
    this.highEq.connect(this.filterLowPass);
    this.filterLowPass.connect(this.filterHighPass);
    this.filterHighPass.connect(this.channelFader);
    this.channelFader.connect(this.crossfaderGain);
    this.crossfaderGain.connect(engine.masterInput);
    
    // Tap cue send after EQ (and after DJ filter, or before? "tap a cue send after the EQ")
    this.highEq.connect(this.cueGain);
    this.cueGain.connect(cueSystem.cueInput);
  }

  async load(file: File) {
    // Only buffer source supported in Phase 1
    const adapter = new BufferSourceAdapter(engine.ctx);
    await adapter.load(file);
    this.sourceAdapter = adapter;
    this.sourceAdapter.connect(this.trimNode);
  }

  play() {
    if (!this.sourceAdapter) return;
    engine.resume();
    cueSystem.resume();
    // we want to play from current paused position
    const pos = this.sourceAdapter.getPosition(engine.ctx.currentTime);
    this.sourceAdapter.start(engine.ctx.currentTime, pos);
  }

  pause() {
    if (!this.sourceAdapter) return;
    this.sourceAdapter.stop();
  }

  seek(position: number) {
    if (!this.sourceAdapter) return;
    const isPlaying = this.sourceAdapter.getPosition(engine.ctx.currentTime) > 0 && (this.sourceAdapter as any).isPlaying;
    this.sourceAdapter.stop();
    if (isPlaying) {
      this.sourceAdapter.start(engine.ctx.currentTime, position);
    } else {
      // update offset for when it plays next
      (this.sourceAdapter as any).offsetTime = position;
    }
  }

  cueToStart() {
    this.seek(0);
  }

  getPosition(): number {
    if (!this.sourceAdapter) return 0;
    return this.sourceAdapter.getPosition(engine.ctx.currentTime);
  }

  getDuration(): number {
    return this.sourceAdapter ? this.sourceAdapter.duration : 0;
  }

  setTrim(val: number) { // val 0 to 2
    this.trimNode.gain.setTargetAtTime(val, engine.ctx.currentTime, 0.01);
  }

  setEq(band: 'low' | 'mid' | 'high', valDb: number) { // -40 to 6
    const node = band === 'low' ? this.lowEq : band === 'mid' ? this.midEq : this.highEq;
    node.gain.setTargetAtTime(valDb, engine.ctx.currentTime, 0.01);
  }

  setFilter(val: number) { // -1 to +1
    const t = engine.ctx.currentTime;
    if (val < 0) {
      // low pass, sweep from 20000Hz down to 20Hz
      const freq = 20 + (20000 - 20) * (1 + val); // val=-1 -> 20, val=0 -> 20000
      this.filterLowPass.frequency.setTargetAtTime(freq, t, 0.01);
      this.filterHighPass.frequency.setTargetAtTime(10, t, 0.01);
    } else if (val > 0) {
      // high pass, sweep from 10Hz up to 10000Hz
      const freq = 10 + (10000 - 10) * val;
      this.filterHighPass.frequency.setTargetAtTime(freq, t, 0.01);
      this.filterLowPass.frequency.setTargetAtTime(20000, t, 0.01);
    } else {
      // flat
      this.filterLowPass.frequency.setTargetAtTime(20000, t, 0.01);
      this.filterHighPass.frequency.setTargetAtTime(10, t, 0.01);
    }
  }

  setVolume(val: number) {
    this.channelFader.gain.setTargetAtTime(val, engine.ctx.currentTime, 0.01);
  }

  setCrossfaderGain(val: number) {
    this.crossfaderGain.gain.setTargetAtTime(val, engine.ctx.currentTime, 0.01);
  }

  setCue(on: boolean) {
    this.cueGain.gain.setTargetAtTime(on ? 1 : 0, engine.ctx.currentTime, 0.01);
  }
}
