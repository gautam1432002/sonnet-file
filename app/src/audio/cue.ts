import { engine } from './engine';

class CueSystem {
  public cueDestination: MediaStreamAudioDestinationNode;
  private audioEl: HTMLAudioElement;

  constructor() {
    this.cueDestination = engine.ctx.createMediaStreamDestination();
    this.audioEl = new Audio();
    // Use the stream as the source for the hidden audio element
    if ('srcObject' in this.audioEl) {
      this.audioEl.srcObject = this.cueDestination.stream;
    }
    this.audioEl.play().catch(e => console.warn('Cue audio play prevented', e));
  }

  resume() {
    this.audioEl.play().catch(e => console.warn('Cue audio play prevented', e));
  }

  async setSinkId(deviceId: string): Promise<boolean> {
    if ('setSinkId' in this.audioEl) {
      try {
        await (this.audioEl as any).setSinkId(deviceId);
        return true;
      } catch (e) {
        console.error('Cue setSinkId error', e);
        return false;
      }
    }
    return false;
  }

  get cueInput(): AudioNode {
    return this.cueDestination;
  }
}

export const cueSystem = new CueSystem();
