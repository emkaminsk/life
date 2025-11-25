# Tech stack

## Core tech

- Vanilla TypeScript + Canvas with PNG sprites and dirty rectangles
- Vite - for optimizations
- Vite for unit testing


## Recommendations

Critical Recommendations

  🔴 MANDATORY (Before MVP Launch)

  1. Implement Emoji Caching (Week 1)
  // Pre-render emojis to canvas images at startup
  const emojiCache = new Map();
  function cacheEmoji(emoji, size) { /* ... */ }
  2. Implement Dirty Rectangle Optimization (Week 2)
  // Only redraw changed cells + neighbors
  const dirtyRects = new Set();
  function markDirty(x, y) { /* ... */ }
  3. Add Performance Monitoring (Week 1)
  // FPS counter (debug mode)
  // Render time tracking
  // Entity count warnings

  🟡 STRONGLY RECOMMENDED

  4. Consider Image Sprites Over Emoji (Week 1 decision)
    - Better performance (+15%)
    - Better cross-browser consistency
    - One-time sprite sheet creation cost
  5. Establish Code Organization Early (Week 1)
  js/
  ├── core/
  │   ├── Game.js (main loop)
  │   ├── Board.js (rendering)
  │   └── Entity.js (base class)
  ├── entities/
  │   ├── Human.js
  │   ├── Wolf.js
  │   └── ...
  ├── systems/
  │   ├── MovementSystem.js
  │   ├── CombatSystem.js
  │   └── ...
  └── utils/
      ├── Gompertz.js
      └── SpatialGrid.js
  6. Plan TypeScript Migration Path (Month 2-3)
    - Gradual migration: utils → entities → systems → core
    - Type safety before complexity explodes