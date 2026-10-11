# STUDIO BENTO v5.0 • Precision DJ Console

[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio-W3C%20Standard-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![WebGL](https://img.shields.io/badge/WebGL-Shader-green.svg?logo=webgl)](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)

A state-of-the-art, browser-based precision DJ mixer built with modern web technologies, inspired by iconic tactile industrial design (Teenage Engineering, Dieter Rams, and Braun audio hardware). **STUDIO BENTO** features dual-deck playback, YouTube audio streaming integration, hardware-modeled EQ and FX, real-time 32-band RTA spectrum analysis, and a dynamic WebGL fluid shader background.

---

## 🎛 Key Features

### 1. Tactile Symmetrical Studio Console (Deck A & Deck B)
- **Dark Aluminum Jog Wheels:** Machined outer rim with dark vinyl texture and hairline rotating position indicator driven by real-time playback.
- **Spindle Displays:** Center spindle displaying live BPM, active channel badge, and status indicators.
- **Machined Pitch Fader:** Center-zero notched track providing `±8%` tempo adjustments with beat sync locking and tactile `- NUDGE` / `+ NUDGE` buttons.
- **Tactile Rotary EQ Potentiometers:** Custom radial gradient dials for `GAIN`, `TREBLE`, and `BASS` with real-time dB readouts and smooth rotational control.
- **Dedicated FX Toggles:** 
  - `ECHO` (1/4 D & 1/8 T delay feedback loops).
  - `SPACE 3D` (stereo widening Haas effect).
- **Chunky Transport Controls:** Tactile `CUE` button and high-contrast solid `PLAY` / `PAUSE` buttons.

### 2. Master Mixing Hub (Center Console)
- **Twin High-Precision VU Meters:** 11-segment LED ladder meters (Emerald, Amber, Rose) reacting to engine output with peak dBFS monitoring.
- **Vertical Master Fader:** Solid machined volume slider (`MST 0.0`) controlling master gain.
- **Potentiometers:** Precision dials for `CUE MIX` (50/50 blend) and `BOOTH` monitoring gain.
- **Horizontal Smooth Crossfader:** Linear sliding control with selectable crossfader curves:
  - `CUT` (sharp cut for scratching / cuts).
  - `SMOOTH` (equal-power constant loudness curve).
  - `FAST` (linear curve).

### 3. Acoustic Spectrum RTA & Waveform Observation
- **32-Band Visualizer:** Multi-gradient frequency columns (titanium, emerald, indigo, amber) driven by an AnalyserNode (2048 FFT stereo).
- **Precision Phase Needle:** Center hairline phase indicator with `0.00` alignment and green `SYNC` status.
- **Overview Scrubber Track:** Intro bar overview, drop build demarcation, and master beat counters (`BAR 32.4 • MASTER 124.00`).

### 4. YouTube Stream & Crates Integration
- **Universal Search Pill:** Type search queries or paste direct YouTube stream / video URLs directly in the header.
- **Under-YouTube Architecture:** Dynamic iframe bridge with dynamic playback rate, volume scaling, and crossfader gain matching.
- **Library Crates Drawer:** Browse search results and quickly route tracks to Deck A or Deck B.

### 5. WebGL Fluid Shader Background
- Custom hardware-accelerated WebGL fragment shader generating organic, multi-frequency simplex noise and fluid wave drifts using a deep velvet graphite, indigo, teal, and slate palette with pointer tracking.

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Q</kbd> | Toggle Play / Pause for **Deck A** |
| <kbd>P</kbd> | Toggle Play / Pause for **Deck B** |
| <kbd>←</kbd> | Nudge Crossfader towards **Deck A** |
| <kbd>→</kbd> | Nudge Crossfader towards **Deck B** |

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS v4, Vanilla CSS tokens, Google Fonts (`Space Grotesk` & `JetBrains Mono`), Material Symbols
- **Audio Engine:** Web Audio API (`AudioContext`, `BiquadFilterNode`, `GainNode`, `DelayNode`, `ChannelSplitterNode`, `AnalyserNode`)
- **Graphics:** WebGL Shaders (GLSL), HTML5 Canvas
- **State Management:** Zustand
- **Build Tool:** Vite 8

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gautam1432002/sonnet-file.git
   cd sonnet-file
   ```

2. Navigate to the `app` directory and install dependencies:
   ```bash
   cd app
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173/` in your browser.

### Production Build
To create an optimized production build:
```bash
npm run build
```

---

## 📁 Project Structure

```
SonnetFile/
├── app/
│   ├── src/
│   │   ├── audio/
│   │   │   ├── crossfader.ts        # Equal-power & cut curve algorithms
│   │   │   ├── deck.ts              # Deck node architecture & playback logic
│   │   │   ├── effects.ts           # EQ, Echo feedback & Stereo widening graph
│   │   │   ├── engine.ts            # Master AudioContext & AnalyserNode
│   │   │   └── sources/             # YouTube & audio buffer adapters
│   │   ├── components/
│   │   │   ├── BentoDeckModule.tsx  # Jog wheel, pitch fader, EQ knobs & transport
│   │   │   ├── BentoMasterHub.tsx   # VU meters, master slider, crossfader
│   │   │   ├── BentoTopBar.tsx      # Header strip, track summary & YouTube input
│   │   │   ├── Sidebar.tsx          # Hardware navigation & DSP diagnostics
│   │   │   ├── SpectrumObservationCard.tsx # 32-band RTA visualizer
│   │   │   ├── WebGLShaderBackground.tsx   # Fluid shader background
│   │   │   └── YouTubeBrowser.tsx   # YouTube search modal
│   │   ├── hooks/                   # Custom audio & search hooks
│   │   ├── store.ts                 # Zustand store for console state
│   │   ├── index.css                # Bento glass textures & typography
│   │   └── App.tsx                  # Root application layout
│   └── package.json
└── README.md
```

---

## 📜 License

MIT License. Designed and engineered for high-precision live audio performance.
