export interface SourceAdapter {
  kind: 'buffer' | 'mediaElement' | 'mediaStream';
  load(fileOrUrl: File | string | ArrayBuffer): Promise<void>;
  start(when: number, offset: number): void;
  stop(): void;
  duration: number;
  getPosition(currentTime: number): number;
  connect(destination: AudioNode): void;
  setPlaybackRate(rate: number): void;
}

export class BufferSourceAdapter implements SourceAdapter {
  kind = 'buffer' as const;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private context: AudioContext;
  private startTime: number = 0;
  private offsetTime: number = 0;
  private isPlaying: boolean = false;
  private playbackRate: number = 1;
  
  public duration: number = 0;

  constructor(context: AudioContext) {
    this.context = context;
  }

  async load(input: File | ArrayBuffer): Promise<void> {
    let arrayBuffer: ArrayBuffer;
    if (input instanceof File) {
      arrayBuffer = await input.arrayBuffer();
    } else {
      arrayBuffer = input;
    }
    this.buffer = await this.context.decodeAudioData(arrayBuffer);
    this.duration = this.buffer.duration;
  }

  start(when: number, offset: number): void {
    if (!this.buffer) return;
    this.stop(); // Ensure any existing source is stopped and disconnected
    
    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = this.playbackRate;
    this.startTime = when;
    this.offsetTime = offset;
    this.isPlaying = true;
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        // May throw if never started
      }
      this.source.disconnect();
      this.source = null;
    }
    this.isPlaying = false;
  }

  getPosition(currentTime: number): number {
    if (!this.isPlaying) return this.offsetTime;
    let pos = this.offsetTime + (currentTime - this.startTime) * this.playbackRate;
    if (pos > this.duration) {
      pos = this.duration; // Ended
      this.isPlaying = false;
    }
    return pos;
  }

  connect(destination: AudioNode): void {
    if (this.source) {
      this.source.connect(destination);
    }
  }

  getBuffer(): AudioBuffer | null {
    return this.buffer;
  }

  setPlaybackRate(rate: number): void {
    if (this.isPlaying) {
      // Before changing rate, update offset Time to current position
      // so getPosition doesn't jump
      this.offsetTime = this.getPosition(this.context.currentTime);
      this.startTime = this.context.currentTime;
    }
    this.playbackRate = rate;
    if (this.source) {
      this.source.playbackRate.setTargetAtTime(rate, this.context.currentTime, 0.01);
    }
  }
}

export class MediaElementAdapter implements SourceAdapter {
  kind = 'mediaElement' as const;
  duration = 0;
  async load(): Promise<void> { throw new Error('not implemented in Phase 1'); }
  start(): void { throw new Error('not implemented in Phase 1'); }
  stop(): void { throw new Error('not implemented in Phase 1'); }
  getPosition(): number { throw new Error('not implemented in Phase 1'); }
  setPlaybackRate(): void { throw new Error('not implemented in Phase 1'); }
  connect(): void { throw new Error('not implemented in Phase 1'); }
}

export class MediaStreamAdapter implements SourceAdapter {
  kind = 'mediaStream' as const;
  duration = Infinity;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private context: AudioContext;

  constructor(context: AudioContext) {
    this.context = context;
  }

  async load(input: MediaStream | any): Promise<void> { 
    this.stream = input;
  }
  
  start(): void { 
    if (!this.stream) return;
    this.stop();
    this.source = this.context.createMediaStreamSource(this.stream);
  }
  
  stop(): void { 
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
  }
  
  getPosition(): number { return 0; }
  
  connect(destination: AudioNode): void { 
    if (this.source) {
      this.source.connect(destination);
    }
  }
  
  setPlaybackRate(): void { 
    // Not possible on live stream
  }
}
