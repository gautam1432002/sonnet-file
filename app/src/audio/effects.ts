export class EffectsChain {
  public input: GainNode;
  public output: GainNode;
  
  // EQ & Gain
  private gainNode: GainNode;
  private bassNode: BiquadFilterNode;
  private trebleNode: BiquadFilterNode;
  
  // Echo
  private delayNode: DelayNode;
  private feedbackNode: GainNode;
  private echoWetNode: GainNode;
  
  // Virtuality (Stereo Widening)
  private virtualityDry: GainNode;
  private virtualityWet: GainNode;
  private splitter: ChannelSplitterNode;
  private merger: ChannelMergerNode;
  private widenDelay: DelayNode;

  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();

    // 1. Initialize EQ & Gain
    this.gainNode = ctx.createGain();
    this.bassNode = ctx.createBiquadFilter();
    this.bassNode.type = 'lowshelf';
    this.bassNode.frequency.value = 250;
    
    this.trebleNode = ctx.createBiquadFilter();
    this.trebleNode.type = 'highshelf';
    this.trebleNode.frequency.value = 2500;

    // 2. Initialize Echo (330ms delay with 40% feedback)
    this.delayNode = ctx.createDelay(1.0);
    this.delayNode.delayTime.value = 0.33;
    this.feedbackNode = ctx.createGain();
    this.feedbackNode.gain.value = 0.4;
    this.echoWetNode = ctx.createGain();
    this.echoWetNode.gain.value = 0; // Default off

    // 3. Initialize Virtuality (Haas Effect)
    this.virtualityDry = ctx.createGain();
    this.virtualityWet = ctx.createGain();
    this.virtualityWet.gain.value = 0; // Default off
    this.splitter = ctx.createChannelSplitter(2);
    this.merger = ctx.createChannelMerger(2);
    this.widenDelay = ctx.createDelay();
    this.widenDelay.delayTime.value = 0.02; // 20ms delay on right channel

    this.buildRoutingGraph();
  }

  private buildRoutingGraph() {
    // Linear Core: Input -> Gain -> Bass -> Treble
    this.input.connect(this.gainNode);
    this.gainNode.connect(this.bassNode);
    this.bassNode.connect(this.trebleNode);

    // Echo Routing (Parallel)
    this.trebleNode.connect(this.delayNode);
    this.delayNode.connect(this.feedbackNode);
    this.feedbackNode.connect(this.delayNode); // Feedback loop
    this.delayNode.connect(this.echoWetNode);
    
    // Mix Dry EQ + Wet Echo into Virtuality stage
    this.trebleNode.connect(this.virtualityDry);
    this.echoWetNode.connect(this.virtualityDry);

    // Virtuality Routing
    this.virtualityDry.connect(this.splitter);
    
    // Left channel straight through
    this.splitter.connect(this.merger, 0, 0);
    // Right channel delayed by 20ms to create wide stereo image
    this.splitter.connect(this.widenDelay, 1);
    this.widenDelay.connect(this.merger, 0, 1);
    
    this.merger.connect(this.virtualityWet);

    // Final Output Mix
    this.virtualityDry.connect(this.output);
    this.virtualityWet.connect(this.output);
  }

  // Parameter Setters
  setGain(value: number) { this.gainNode.gain.value = value; } // 0.0 to 2.0
  setBass(db: number) { this.bassNode.gain.value = db; }       // -40 to +15
  setTreble(db: number) { this.trebleNode.gain.value = db; }   // -40 to +15
  
  toggleEcho(active: boolean) {
    // 1ms ramp prevents audio clicking when toggling
    this.echoWetNode.gain.setTargetAtTime(active ? 0.8 : 0, this.ctx.currentTime, 0.01);
  }

  toggleVirtuality(active: boolean) {
    this.virtualityWet.gain.setTargetAtTime(active ? 1 : 0, this.ctx.currentTime, 0.01);
    this.virtualityDry.gain.setTargetAtTime(active ? 0 : 1, this.ctx.currentTime, 0.01);
  }
}
