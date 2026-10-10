declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: any;
  }
}

export class YouTubeSourceAdapter {
  private player: any = null;
  public isReady: boolean = false;
  private queuedVideoId: string | null = null;

  constructor(
    private containerId: string,
    private onStateChange?: (state: number) => void
  ) {
    this.initApi();
  }

  private initApi() {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        this.mountPlayer();
      };
    } else if (window.YT && window.YT.Player) {
      this.mountPlayer();
    }
  }

  private mountPlayer() {
    this.player = new window.YT.Player(this.containerId, {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          this.isReady = true;
          if (this.queuedVideoId) {
            this.loadVideo(this.queuedVideoId);
            this.queuedVideoId = null;
          }
        },
        onStateChange: (event: any) => {
          if (this.onStateChange) {
            this.onStateChange(event.data);
          }
        },
      },
    });
  }

  public loadVideo(videoId: string) {
    if (!this.isReady || !this.player) {
      this.queuedVideoId = videoId;
      return;
    }
    this.player.loadVideoById({ videoId });
  }

  public play() {
    if (this.isReady && this.player) this.player.playVideo();
  }

  public pause() {
    if (this.isReady && this.player) this.player.pauseVideo();
  }

  public seekTo(seconds: number) {
    if (this.isReady && this.player) this.player.seekTo(seconds, true);
  }

  public setVolume(volume: number) {
    // Expects volume in range 0 - 100
    if (this.isReady && this.player && typeof this.player.setVolume === 'function') {
      this.player.setVolume(Math.min(100, Math.max(0, volume)));
    }
  }

  public setPlaybackRate(rate: number) {
    // Supports 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2
    if (this.isReady && this.player && typeof this.player.setPlaybackRate === 'function') {
      this.player.setPlaybackRate(rate);
    }
  }

  public getCurrentTime(): number {
    return this.isReady && this.player && typeof this.player.getCurrentTime === 'function' ? this.player.getCurrentTime() : 0;
  }

  public getDuration(): number {
    return this.isReady && this.player && typeof this.player.getDuration === 'function' ? this.player.getDuration() : 0;
  }
}
