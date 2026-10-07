# DECISIONS

- **Audio Engine**: Web Audio API used exclusively for Phase 1 as requested.
- **State Management**: Zustand chosen for global state to easily share audio state without unnecessary React re-renders. Audio time uses `requestAnimationFrame` for UI instead of Zustand to prevent spamming renders.
- **Styling**: Tailwind CSS + CSS Variables for theming. This ensures themes are just token swaps without massive CSS overhead.
- **Crossfader**: Implemented Equal Power curve and Sharp Cut curve mathematically.

