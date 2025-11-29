# Technology Stack

## Overview
Game of Life is a client-side educational web application built with modern frontend technologies. The application is deployed as a static site, requiring no backend server or database.

## Core Technologies

### Frontend Framework
- **Vanilla TypeScript** - No framework dependencies for maximum performance and simplicity
  - Version: 5.3.3+
  - Configuration: Strict mode enabled, ES2020 target
  - Why: Direct control over rendering pipeline, minimal bundle size, easier for students to understand

### Build Tool
- **Vite** 5.0.11+
  - Development server with HMR (Hot Module Replacement)
  - Production builds with optimization and minification
  - TypeScript support out of the box
  - Why: Fast development experience, optimized production builds

### Rendering
- **HTML5 Canvas API**
  - Direct pixel manipulation for grid-based rendering
  - Hardware-accelerated `drawImage()` for emoji caching
  - Dirty rectangle optimization for performance
  - Why: Best performance for grid-based simulations with 1000+ entities

### Code Quality
- **Biome** 2.3.8+
  - Linting and formatting
  - Replaces ESLint + Prettier with single fast tool
  - Why: Faster than ESLint/Prettier, single configuration

## Build Output

### Development
```bash
npm run dev
# Starts Vite dev server at http://localhost:5173
# Hot module replacement enabled
# Source maps for debugging
```

### Production
```bash
npm run build
# Output: dist/ directory containing:
#   - index.html (entry point)
#   - assets/*.js (bundled TypeScript, minified)
#   - assets/*.css (if any, minified)
# All assets have content-based hashes for cache busting
```

## Deployment Architecture

### Static Hosting Requirements
- **Server**: Any static file server (nginx, Apache, Caddy, etc.)
- **HTTPS**: Recommended for production
- **Compression**: Gzip/Brotli recommended for assets
- **Caching**: Long cache times for hashed assets, short for index.html

### VPS Deployment (Target)
- **OS**: Linux (Ubuntu/Debian recommended)
- **Web Server**: nginx
- **Process**:
  1. Build static assets locally or via CI/CD
  2. Transfer `dist/` directory to VPS
  3. Serve via nginx with appropriate headers

### Build Size
- **Uncompressed**: ~150-200 KB (all JS + HTML)
- **Gzipped**: ~50-70 KB
- **Assets**: No external images, fonts, or dependencies
- **Load Time**: <1s on 3G connection

## Browser Compatibility

### Primary Target
- Chrome/Edge (latest) - Full support, primary testing platform
- Firefox (latest) - Full support, secondary testing platform

### Requirements
- HTML5 Canvas API support
- ES2020 JavaScript features
- No mobile/tablet optimization in MVP

### Known Limitations
- No Internet Explorer support (ES2020 required)
- No Safari testing in MVP (expected to work)
- Canvas performance varies by GPU/browser

## Development Environment

### Required Tools
- Node.js 18+ (for Vite and build tools)
- npm 9+ (package management)
- Modern code editor (VS Code recommended)

### Optional Tools
- Git (version control)
- Browser DevTools (debugging, performance profiling)

## Performance Characteristics

### Target Performance
- **60 FPS**: 30x30 board with 100-200 entities
- **30 FPS**: 30x30 board with 200-300 entities
- **10-20 FPS**: 100x100 board with 1000+ entities

### Optimization Techniques
1. **Emoji Caching**: Pre-render emojis to Canvas images (10x faster than fillText)
2. **Dirty Rectangles**: Only redraw changed cells + neighbors
3. **Spatial Grid**: O(1) cell lookup via 2D array
4. **Request Animation Frame**: Smooth rendering tied to display refresh

### Memory Usage
- **Typical**: 50-100 MB for 30x30 board with 200 entities
- **Large**: 200-300 MB for 100x100 board with 1000 entities
- **No memory leaks**: Tested for 30+ minute sessions

## External Dependencies

### Runtime
- **None** - Pure TypeScript/JavaScript, no external libraries
- All functionality implemented from scratch using browser APIs

### Development
- `typescript` - TypeScript compiler
- `vite` - Build tool and dev server
- `@biomejs/biome` - Linting and formatting

### Why No Frameworks?
- Educational clarity - students can read all source code
- Performance - no framework overhead
- Simplicity - fewer concepts to learn
- Bundle size - minimal JS to download

## Deployment Workflow (Planned)

### CI/CD Pipeline
1. **Trigger**: Push to `main` branch
2. **Build**: `npm ci && npm run build`
3. **Test**: Lint check with Biome
4. **Deploy**: SCP `dist/` to VPS nginx root
5. **Verification**: Health check endpoint (optional)

### Manual Deployment
```bash
# Build locally
npm run build

# Transfer to VPS
scp -r dist/* user@vps:/var/www/gameoflife/

# Reload nginx (if config changed)
ssh user@vps "sudo systemctl reload nginx"
```

## Future Considerations

### Potential Enhancements
- **Service Worker**: Offline support for classroom use without internet
- **PWA**: Install as standalone app on student devices
- **CDN**: CloudFlare or similar for global distribution
- **Analytics**: Privacy-respecting usage tracking for educational research

### Not Planned
- Backend API (simulation is fully client-side)
- Database (no user accounts or data persistence on server)
- Server-side rendering (no SEO requirements)
- Mobile app (web-only for MVP)
