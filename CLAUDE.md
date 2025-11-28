# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Game of Life is an educational ecosystem simulator built with TypeScript and Canvas. It simulates population dynamics with humans, animals (wolves/dogs), and plants (fruits/mushrooms) on a grid-based board. Target audience: students aged 11-15.

**Key Educational Goals:**
- Population dynamics and cause-effect relationships
- Ecosystem balance through experimentation
- Systems thinking through emergent behaviors

## Development Commands

```bash
# Development
npm run dev          # Start Vite dev server at http://localhost:5173

# Build
npm run build        # TypeScript compile + Vite production build → dist/

# Preview
npm run preview      # Preview production build locally
```

## Architecture Overview

### System Design: Seven-Phase Simulation Loop

The core game logic executes in **strict priority order** each round:

1. **Movement** - Creatures move toward targets within perception range
2. **Combat** - Damage dealt (wolves→humans, dogs→wolves, males→males)
3. **Eating** - Plants consumed (fruits heal, mushrooms poison)
4. **Reproduction** - Pregnancy initiated between adjacent males/females
5. **Death** - Creatures with health ≤ 0 removed
6. **Birth** - Pregnancy period completed, new humans spawn
7. **Plant Spawning** - New fruits/mushrooms spawn on empty cells

**Critical Implementation Detail:** Phase order is immutable and defined in PRD. All systems must respect this order.

### Directory Structure

```
src/
├── core/           # Core engine and rendering
│   ├── Game.ts           # Main loop, round execution, phase orchestration
│   ├── Board.ts          # Grid state management, cell lookup
│   └── Renderer.ts       # Canvas rendering, dirty rectangles, emoji caching
├── entities/       # Entity class hierarchy
│   ├── Entity.ts         # Base class with health, age, position
│   ├── Human.ts          # Male/Female, pregnancy, cooldown mechanics
│   ├── Wolf.ts           # Hunt humans
│   ├── Dog.ts            # Protect humans by attacking wolves
│   ├── Fruit.ts          # Ripening mechanic (unripe/ripe states)
│   └── Mushroom.ts       # Poisonous plants
├── systems/        # Phase execution systems (stateless)
│   ├── MovementSystem.ts       # Phase 1: Perception-based weighted movement
│   ├── CombatSystem.ts         # Phase 2: Damage dealing, counter-attacks
│   ├── EatingSystem.ts         # Phase 3: Plant consumption
│   ├── ReproductionSystem.ts   # Phase 4: Pregnancy initiation
│   ├── DeathSystem.ts          # Phase 5: Health-based removal + Gompertz
│   ├── BirthSystem.ts          # Phase 6: Spawn from pregnancy
│   └── SpawnSystem.ts     # Phase 7: Probabilistic spawning
├── utils/
│   ├── Gompertz.ts       # Age-based mortality calculation
│   └── Random.ts         # Seeded random utilities
├── ui/
│   └── ConfigPanel.ts    # Pre-game configuration interface
├── types.ts        # Enums (EntityType, Sex) and interfaces
├── config.ts       # DEFAULT_CONFIG with all game parameters
└── main.ts         # Entry point, initialization, event binding
```

### Key Architectural Patterns

**Entity System:**
- All entities inherit from `Entity` base class (health, age, position, type)
- Entities are immutable references after creation (state changes modify in-place)
- Board stores entities in 2D array for O(1) spatial lookup

**System Design (ECS-like):**
- Systems are **stateless** - all state lives in entities and board
- Each system receives board + renderer, operates on all relevant entities
- Systems use `Renderer` for visual effects (flashes, borders) in `src/core/Renderer.ts:45-67`

**Performance Optimizations:**
- **Dirty Rectangle Rendering**: Only redraw changed cells + neighbors
- **Emoji Caching**: Pre-render emojis to Canvas images at startup (critical for 1000+ entities)
- **Spatial Grid**: Board provides O(1) cell lookup, avoiding O(n²) adjacency checks
- Performance target: 30 FPS on 30x30 board with 200-300 creatures

## Critical Implementation Rules

### 1. Phase Order is Sacred
Never reorder or combine phases. Each system executes completely before the next begins.

Example: Death must happen *after* combat but *before* birth. If you move death earlier, combat damage won't kill creatures that round.

### 2. Gompertz Mortality Model
All creatures use scientifically accurate age-based death probability:
```typescript
P(death | age) = 1 - e^(-A * e^(B * age))
```
- Located in `src/utils/Gompertz.ts`
- Applied in `DeathSystem` after health-based death checks
- Configurable A (mortality rate) and B (acceleration) per species

### 3. Movement Algorithm (Weighted Random)
- Check perception range for target (humans→fruit, wolves→humans, dogs→wolves)
- If target detected: `moveTowardProbability` chance to move closer, else random
- If no target or blocked: purely random adjacent cell
- If multiple equidistant cells: random choice among them
- Implementation in `src/systems/MovementSystem.ts`

### 4. Configuration Immutability
Once game starts (`Game.start()`), configuration is **locked**. All parameters in `GameConfig` must be frozen.

Rationale: Students need consistent parameters throughout an experiment to understand cause-effect.

### 5. Visual Feedback System
Three flash types rendered by `Renderer`:
- **Red flash**: Combat damage or mushroom poisoning
- **Green flash**: Reproduction or birth
- **Yellow flash**: Fruit consumption

Flashes are non-blocking and last ~1 second. Implement in `Renderer.addVisualEffect()`.

## Common Development Tasks

### Adding a New Entity Type
1. Create class in `src/entities/` extending `Entity`
2. Add enum value to `EntityType` in `src/types.ts`
3. Update relevant systems (movement, combat, etc.) to handle new type
4. Add spawn probability to `DEFAULT_CONFIG` in `src/config.ts`
5. Add rendering emoji to `Renderer` emoji map
6. Update `ConfigPanel` to expose new parameters

### Adding a New Game Phase
**⚠️ This requires PRD discussion** - phase order is part of educational design.

If approved:
1. Create system in `src/systems/` following existing pattern
2. Add system instantiation in `Game` constructor
3. Call system in correct order in `Game.runRound()` at `src/core/Game.ts:145-200`
4. Update PRD documentation to reflect new priority order

### Modifying Configuration Parameters
1. Update `DEFAULT_CONFIG` in `src/config.ts`
2. Update `GameConfig` interface in `src/ui/ConfigPanel.ts`
3. Add UI controls to `ConfigPanel.render()`
4. Add validation logic for new parameter ranges
5. Update tooltips with valid ranges and descriptions

### Performance Debugging
1. Enable debug mode in `Renderer` to show FPS counter
2. Check dirty rectangle optimization is working (verify only changed cells redraw)
3. Profile emoji rendering (should use cached Canvas images, not `fillText`)
4. Verify spatial grid lookups are O(1) not O(n)
5. Check for garbage collection pauses (minimize object creation in game loop)

### Testing Simulation Phases
Test each phase in isolation by commenting out others in `Game.runRound()`:
```typescript
// Test only movement
this.movementSystem.process(this.board);
// this.combatSystem.process(this.board);
// ... comment out rest
```

Then verify behavior matches PRD specifications.

## Important Technical Constraints

### TypeScript Configuration
- Strict mode enabled (`strict: true`)
- No unused locals or parameters allowed
- Module resolution: "bundler" (for Vite)
- Target: ES2020 with DOM APIs

### Canvas Rendering Performance
**Critical:** Emoji rendering via `context.fillText()` is **extremely slow** (~1-2ms per call). With 1000 entities, this is 1000ms per frame.

**Solution:** Pre-render emojis to Canvas images at startup, then use `drawImage()` (5-10x faster, hardware accelerated). See `src/core/Renderer.ts` for implementation.

### Browser Compatibility
- Primary: Chrome (latest)
- Secondary: Firefox (latest)
- No explicit mobile/tablet support in MVP
- Keyboard controls required (spacebar, arrow keys)

## Configuration System

All game parameters live in `src/config.ts` as `DEFAULT_CONFIG`. Categories:

- **board**: Dimensions, injured threshold for red borders
- **spawn**: Probability per entity type at game start
- **human**: Health, damage, reproduction, pregnancy, perception, Gompertz
- **wolf**: Health, damage, perception, Gompertz
- **dog**: Health, damage, perception, Gompertz
- **fruit**: Healing amount, spawn rate, ripening time
- **mushroom**: Damage amount, spawn rate
- **simulation**: Default speed (ms per round)
- **overcrowding**: Thresholds and death multipliers

Students configure these pre-game via `ConfigPanel`. Values are validated in real-time with helpful error messages.

## Educational Design Principles

These inform all feature decisions:

1. **Transparency over Magic**: Students should understand *why* things happen (hence visual flashes, statistics panel, rules reference)
2. **Experimentation over Tutorial**: No hand-holding - let students discover through parameter tweaking
3. **Predictability from Complexity**: Clear rules create emergent behaviors students can reason about
4. **Visual Cause-Effect**: Flash types immediately connect game events to outcomes
5. **Parameter Range Freedom**: No artificial upper limits (except board size) - encourage extreme experiments

## Known Technical Decisions

### Why Vanilla TypeScript + Canvas?
- No framework complexity - simple learning curve
- Canvas optimal for grid-based rendering
- Full control over performance optimizations
- Target audience (11-15) doesn't need complex UI framework

### Why Strict Phase Order?
Educational requirement - students need to understand that simultaneous events have resolution order. This teaches systems thinking.

### Why Emoji Caching is Critical?
Without it, 1000 entities × 1ms emoji rendering = 1 second per frame = 1 FPS. With caching: 1000 entities × 0.1ms drawImage = 100ms = 10 FPS. Makes 1000-creature simulations viable.

### Why No Tests in MVP?
Educational project with tight scope. Manual testing sufficient for MVP. Consider adding tests post-MVP for regression protection.

## Future Enhancement Hooks

Architecture supports but doesn't implement:

- Save/load game states (serialize Board + Game state)
- Data export (CSV export of population history)
- Multiple simultaneous simulations (instantiate multiple Game objects)
- Historical playback (record all rounds, enable rewind)
- Intent visualization (show creature target lines)

If implementing these, coordinate with educational goals - some features may reduce learning value by hiding complexity.
