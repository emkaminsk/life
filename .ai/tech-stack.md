# Technology Stack

## Core Technologies

### Language & Runtime
- **TypeScript 5.3.3+**
  - Strict mode enabled
  - ES2020 target
  - No framework dependencies (vanilla TypeScript)

### Build Tool
- **Vite 5.0.11+**
  - Development server with HMR
  - Production optimization and minification
  - TypeScript support out of the box

### Rendering Engine
- **HTML5 Canvas API**
  - Direct pixel manipulation for grid-based rendering
  - Hardware-accelerated `drawImage()` for emoji caching
  - Dirty rectangle optimization

### Code Quality
- **Biome 2.3.8+**
  - Unified linting and formatting
  - Replaces ESLint + Prettier

### Testing
- **Vitest**
  - Unit testing framework
  - Vite-native integration

## Performance Optimizations

### Critical Techniques
1. **Emoji Caching**: Pre-render emojis to Canvas images at startup (10x faster than fillText)
2. **Dirty Rectangles**: Only redraw changed cells + neighbors
3. **Spatial Grid**: O(1) cell lookup via 2D array
4. **Request Animation Frame**: Smooth rendering tied to display refresh

### Performance Targets
- **60 FPS**: 30x30 board with 100-200 entities
- **30 FPS**: 30x30 board with 200-300 entities
- **10-20 FPS**: 100x100 board with 1000+ entities

### Memory Profile
- **Typical**: 50-100 MB for 30x30 board with 200 entities
- **Large**: 200-300 MB for 100x100 board with 1000 entities
- **No memory leaks**: Tested for 30+ minute sessions

## Browser Compatibility

### Primary Targets
- Chrome/Edge (latest) - Full support, primary testing
- Firefox (latest) - Full support, secondary testing

### Requirements
- HTML5 Canvas API support
- ES2020 JavaScript features
- No mobile/tablet optimization in MVP

### Known Limitations
- No Internet Explorer support (ES2020 required)
- No Safari testing in MVP (expected to work)
- Canvas performance varies by GPU/browser

## Dependencies

### Runtime
- **None** - Pure TypeScript/JavaScript, no external libraries
- All functionality implemented using browser APIs

### Development Only
- `typescript` - TypeScript compiler
- `vite` - Build tool and dev server
- `@biomejs/biome` - Linting and formatting
- `vitest` - Testing framework

### Why No Frameworks?
- Educational clarity - students can read all source code
- Performance - no framework overhead
- Simplicity - fewer concepts to learn
- Bundle size - minimal JS to download

## Build Output

### Development
- Vite dev server at `http://localhost:5173`
- HMR enabled, source maps for debugging

### Production
- Output: `dist/` directory
  - `index.html` (entry point)
  - `assets/*.js` (bundled TypeScript, minified)
  - `assets/*.css` (if any, minified)
- Content-based hashes for cache busting
- **Size**: ~150-200 KB uncompressed, ~50-70 KB gzipped
- **Load Time**: <1s on 3G connection

## Development Environment

### Required
- Node.js 18+
- npm 9+
- Modern code editor (VS Code recommended)

### Optional
- Git (version control)
- Browser DevTools (debugging, performance profiling)
