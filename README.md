# Sonnet File

Sonnet File is an offline-first, browser-based DJ mixer that runs on localhost, tailored specifically for a 10-day Dandiya/Garba event. It features a modern, fluid user interface with ambient color themes corresponding to different days of the festival.

## Features

- **Dual Deck System**: Play and control two tracks simultaneously.
- **Mixer Controls**: Equal-power crossfader, individual channel volume, and 3-band EQs (including bass kills).
- **Audio Effects**: Built-in filter sweeps for seamless transitions.
- **Master & Cue Support**: Master output with limiting to prevent distortion, plus headphone cueing.
- **Dynamic Theming**: Ambient, moving gradient backgrounds that change to match the 10 days of Navratri/Dandiya.
- **Keyboard Shortcuts**: Map to 'Q' and 'P' for playback, and arrow keys for the crossfader.

## Getting Started

1. Navigate to the `app` directory.
2. Install dependencies with `npm install`.
3. Run the development server with `npm run dev`.

## MANUAL TEST CHECKLIST

- [ ] Load two songs.
- [ ] Play both.
- [ ] Move the crossfader and hear a smooth equal-power fade.
- [ ] Kill the bass on one deck and verify it works.
- [ ] Sweep the filter on one deck and verify it works.
- [ ] Push the master hard and confirm the limiter prevents distortion.
- [ ] Switch the master output device.
- [ ] Check the cue in headphones if a second output exists.
