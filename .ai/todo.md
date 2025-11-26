# Game of Life PoC → MVP Todo List

This document tracks remaining implementation steps to complete the MVP (Minimum Viable Product) from the current PoC state.

## ✅ Completed (PoC Phases 1-5)

### Phase 1-4: Core Systems
- [x] Project setup with Vite + TypeScript
- [x] Board class with 30x30 grid
- [x] Renderer with emoji display and dirty rectangles
- [x] Entity base class + Human/Wolf/Fruit subclasses
- [x] Movement System (perception-based targeting)
- [x] Combat System (male vs male, wolf vs human)
- [x] Death System (health + Gompertz age-based mortality)
- [x] Reproduction System (pregnancy initiation)
- [x] Birth System (baby spawning)
- [x] Basic UI controls (Start/Pause/Step/Run)
- [x] Statistics panel (entity counts)
- [x] Visual effects (combat/reproduction flashes)
- [x] FPS counter

### Phase 5: Plant System ✅ COMPLETE
- [x] Create `systems/EatingSystem.ts`
- [x] Implement fruit consumption logic:
  - [x] Adjacent human + ripe fruit → consume fruit
  - [x] Heal human by `fruitEnergyHealed` (30 HP)
  - [x] Remove consumed fruit from board
  - [x] Add yellow visual effect flash at eating location
  - [x] Console logging: eating events count per round
- [x] Create `systems/PlantSpawnSystem.ts`
- [x] Implement random fruit generation:
  - [x] Iterate through all empty cells
  - [x] Each empty cell: `spawnProbability` (0.01) chance to spawn fruit
  - [x] Spawn new Fruit entity at selected empty cells
  - [x] Console logging: new fruits spawned per round
- [x] Fruit Ripening:
  - [x] Call `fruit.advanceRipening()` for all fruits each round
  - [x] Fruits start with `ripeningCounter = 2`
  - [x] After 2 rounds, fruits become ripe (counter = 0)
- [x] Integration:
  - [x] Import EatingSystem and PlantSpawnSystem
  - [x] Instantiate in constructor
  - [x] Activate Phase 3 (Eating) execution
  - [x] Activate Phase 7 (Plant Spawn) execution
  - [x] Build successful - all 7 phases active

## 🎯 All 7 Systems Implemented!

## 🐕 Phase 5.5: Dog Implementation (CRITICAL - Missing from PoC)

**Status**: ❌ NOT STARTED
**Priority**: HIGH - Required for complete ecosystem
**Reference**: See `.ai/dog-implementation-analysis.md` for detailed analysis

### Background
Dogs are fully specified in PRD but completely missing from PoC implementation. Dogs are critical for ecosystem balance as they hunt wolves, creating a three-tier predator-prey dynamic:
- Dogs → hunt wolves
- Wolves → hunt humans
- Humans → consume fruits

Without dogs, wolf populations are unchecked, leading to human extinction scenarios.

### Foundation Tasks
- [ ] Add `DOG` to `EntityType` enum in `src/types.ts`
- [ ] Create `src/entities/Dog.ts` entity class
  - [ ] Extends Entity base class
  - [ ] Constructor: `Dog(x: number, y: number)`
  - [ ] Set `type = EntityType.DOG`
  - [ ] Set initial health from config
  - [ ] Age-based mortality (Gompertz)
- [ ] Add `dog` configuration section to `src/config.ts`:
  - [ ] `startingHealth: 70`
  - [ ] `damageToWolf: 35`
  - [ ] `perceptionRange: 6`
  - [ ] `moveTowardWolfProbability: 0.75`
  - [ ] `gompertzA: 0.00015`
  - [ ] `gompertzB: 0.11`
- [ ] Add `dogProbability: 0.03` to spawn config section

### Spawn Logic
- [ ] Update `src/core/Game.ts:initializeBoard()` spawn logic:
  - [ ] Import Dog entity class
  - [ ] Add dog to cumulative probability calculation
  - [ ] Spawn Dog entities when probability threshold met
  - [ ] Track and log dogCount in initialization summary

### Renderer Integration
- [ ] Update `src/core/Renderer.ts:getEntityEmoji()`:
  - [ ] Add case for `EntityType.DOG` returning '🐕'
  - [ ] Verify injured border logic applies to dogs (health < 50)

### Movement System
- [ ] Update `src/systems/MovementSystem.ts`:
  - [ ] Import Dog entity class
  - [ ] Add `getDogTarget()` private method:
    - [ ] Find wolves within perception range
    - [ ] Probability check using `moveTowardWolfProbability`
    - [ ] Return position closest to nearest wolf
  - [ ] Update `moveCreature()` to handle Dog instance:
    - [ ] Call `getDogTarget()` for dogs
    - [ ] Fall back to random movement if no target

### Combat System
- [ ] Update `src/systems/CombatSystem.ts`:
  - [ ] Import Dog entity class
  - [ ] Update `shouldFight()` method:
    - [ ] Add dog vs wolf condition (both directions)
  - [ ] Update `resolveCombat()` method:
    - [ ] Add dog vs wolf combat logic:
      - [ ] Dog deals `damageToWolf` damage to wolf
      - [ ] **NO counter-attack from wolf** (key difference from human combat)
      - [ ] Add combat flash effect on both squares
      - [ ] Console log combat event

### Statistics Display
- [ ] Update `index.html` statistics panel:
  - [ ] Add dog count stat row after wolves:
    ```html
    <div class="stat-row">
      <span class="stat-label">🐕 Dogs</span>
      <span class="stat-value" id="dogCount">0</span>
    </div>
    ```
- [ ] Update `src/main.ts:updateStatistics()`:
  - [ ] Add dog count calculation: `entities.filter(e => e.type === EntityType.DOG).length`
  - [ ] Update `#dogCount` element with calculated value

### Build & Testing
- [ ] Run `npm run build` and verify no TypeScript errors
- [ ] Test initialization: dogs spawn at ~3% (expect ~27 dogs on 30x30 board)
- [ ] Test visual: 🐕 emoji renders correctly
- [ ] Test movement: dogs move toward wolves within perception range
- [ ] Test combat: dogs damage wolves, wolves don't counter-attack
- [ ] Test statistics: dog count displays and updates correctly
- [ ] Test injured state: dogs show red border when health < 50
- [ ] Test death: dogs die from health ≤ 0 or age-based mortality
- [ ] Test ecosystem: observe dogs controlling wolf population

### Success Criteria
- [ ] Dogs spawn on board initialization (~27 on 30x30 board)
- [ ] Dogs move toward wolves with appropriate probability
- [ ] Dogs deal 35 damage to adjacent wolves
- [ ] Wolves do NOT counter-attack dogs
- [ ] Statistics panel shows accurate dog count
- [ ] All visual feedback working (emoji, border, flash)
- [ ] No compilation or runtime errors
- [ ] Ecosystem dynamics observable (three-tier predator system)

**Estimated Time**: 2-3 hours
**Blocking**: None - can be implemented independently
**PRD Alignment**: US-019, Sections 3.4.3-3.4.4, 3.7.7, 3.10.1

## 🎨 Phase 6: Visual Polish ✅ COMPLETE

### Pregnancy Visual Indicator
- [x] Update `core/Renderer.ts` `drawCell()` method:
  - [x] Check if entity is Human and `isPregnant()`
  - [x] Draw small indicator (pink border)
  - [x] Position indicator clearly visible without obscuring main emoji
- [x] Test: Verify pregnant females have visual indicator

### Fruit Ripening Visual
- [x] Update `core/Renderer.ts` `getEntityEmoji()` method:
  - [x] Check if fruit is ripe: `fruit.isRipe()`
  - [x] Ripe fruit: 🍎 (red apple)
  - [x] Unripe fruit: 🍏 (green apple)
- [x] Test: Verify visual difference between ripe/unripe fruits

### Visual Effects Enhancement
- [x] Verify all visual effects working:
  - [x] Combat: red flash (300ms, reduced to 25% opacity) - DONE
  - [x] Reproduction: green flash (400ms) - DONE
  - [x] Eating: yellow flash (300ms) - DONE
  - [x] Birth: green flash (500ms) - DONE
- [x] Test: Run simulation, observe all effect types

### Injured Visual (Red Border)
- [x] Implemented for health <50 (creatures only, not fruits) - FIXED
- [x] Test: Verify red border appears on injured creatures

### Performance Counter
- [x] Moved FPS counter from canvas to header bar
- [x] Renamed "FPS" to "Rounds/sec" for accuracy
- [x] Counter updates in real-time alongside Round counter

## 🎮 Phase 7: UI/UX Enhancements

### Button Consolidation
- [ ] Consolidate Start/Pause/Run into single state-based button
- [ ] Implementation:
  - [ ] Add game state enum: `NOT_STARTED | PAUSED | RUNNING`
  - [ ] Replace 3 buttons (Start/Pause/Run) with 1 dynamic button
  - [ ] Button shows "Start Game" when `NOT_STARTED`
  - [ ] Button shows "Run" when `PAUSED`
  - [ ] Button shows "Pause" when `RUNNING`
  - [ ] Update button handler to manage state transitions
  - [ ] Keep "Step" button separate for debugging
- [ ] Test: Verify button changes text and state correctly

### Reset Button
- [ ] Add Reset button functionality
- [ ] Implementation:
  - [ ] Add `reset()` method to `Game` class
  - [ ] Clear board grid (all cells to null)
  - [ ] Reset round counter to 0
  - [ ] Mark all cells dirty
  - [ ] Render empty board
  - [ ] Reset game state to `NOT_STARTED`
  - [ ] Update statistics to show zeros
  - [ ] Add "Reset" button to HTML controls
  - [ ] Wire up button click handler
- [ ] Test: Verify reset clears board and restarts simulation

## ⚡ Phase 8: Performance Optimization

### Dirty Rectangle Optimization
- [x] Basic dirty rectangle tracking implemented
- [ ] Audit dirty marking:
  - [ ] Ensure only changed cells marked dirty
  - [ ] Mark previous position dirty when entity moves
  - [ ] Mark new position dirty after movement
  - [ ] Verify no unnecessary full-board redraws
- [ ] Profile: Monitor FPS during operations

### Emoji Caching Verification
- [x] Off-screen canvas caching implemented
- [ ] Test cache efficiency:
  - [ ] Verify emojis rendered once and cached
  - [ ] Monitor cache hit rate (console logging optional)
  - [ ] Test with 200-300 creatures

### Performance Testing
- [ ] Spawn 200 creatures test:
  - [ ] Adjust spawn probabilities temporarily to spawn ~200 entities
  - [ ] Run simulation for 50+ rounds
  - [ ] Measure FPS (target: 30+ FPS)
  - [ ] Identify bottlenecks if FPS <30
- [ ] Spawn 300 creatures stress test:
  - [ ] Same process with ~300 entities
  - [ ] Measure FPS, identify performance issues
  - [ ] Optimize if needed

### Optimization Opportunities (if needed)
- [ ] Batch entity dirty marking (single loop vs multiple)
- [ ] Optimize `getAllEntities()` to avoid creating new array each call
- [ ] Consider spatial partitioning if perception range queries slow
- [ ] Reduce visual effect duration if rendering overhead high

## 🧪 Testing & Validation

### Success Criteria Checklist
- [ ] **Simulation Runs**: Board initializes, executes rounds without crashes
- [ ] **Phase Order Correct**: Console logs verify 7-phase execution order
- [ ] **Movement Works**: Humans → fruits, wolves → humans (visual observation)
- [ ] **Combat Works**: Damage dealt, death at health ≤ 0, red flashes visible
- [ ] **Reproduction Works**: Pregnancy → 3 round gestation → birth, green flashes
- [ ] **Plants Work**: Fruits spawn, ripen after 2 rounds, heal on consumption
- [ ] **Death Works**: Health-based + age-based (Gompertz), console logging
- [ ] **Performance Target**: 30+ FPS with 200+ creatures
- [ ] **Visual Feedback**: All flashes (red/green/yellow), injured borders, pregnancy indicator
- [ ] **Controls Work**: Start/Pause/Step/Run + Spacebar toggle functional

### Edge Case Testing
- [ ] Test birth with no adjacent empty space (should log "no space available")
- [ ] Test combat until death (health reaches 0)
- [ ] Test age-based death (run 100+ rounds, observe age deaths in console)
- [ ] Test reproduction cooldown (verify 2 round cooldown after birth)
- [ ] Test fruit consumption healing (injured creature eats fruit, health increases)
- [ ] Test population dynamics (births > deaths = growth, deaths > births = decline)

### Bug Fixes (as discovered)
- [ ] Document any bugs found during testing
- [ ] Fix critical bugs blocking MVP
- [ ] Defer non-critical bugs to post-MVP

## 📚 Documentation

### Code Documentation
- [ ] Add JSDoc comments to public methods (optional for PoC→MVP)
- [ ] Document configuration parameters in `config.ts` (brief inline comments)

### User Documentation
- [ ] Create `README.md`:
  - [ ] Project description
  - [ ] How to run (`npm install`, `npm run dev`)
  - [ ] Controls explanation (buttons + spacebar)
  - [ ] Simulation rules summary
  - [ ] Configuration guide (how to adjust spawn rates, etc.)
- [ ] Add screenshots/GIFs of simulation running (optional but helpful)

### Developer Documentation
- [ ] Update `.ai/poc-prompt.md` with final PoC outcomes
- [ ] Document known limitations/future enhancements
- [ ] Architecture diagram (optional, text-based is fine)

## 🚀 MVP Definition of Done

MVP is complete when:
1. ✅ All 7 system phases implemented and functional
2. ✅ All 10 success criteria pass
3. ✅ Performance target met (30+ FPS with 200+ creatures)
4. ✅ All visual indicators working (flashes, borders, pregnancy)
5. ✅ Basic README.md with run instructions
6. ✅ No critical bugs blocking simulation

## 📋 Post-MVP Enhancements (Future)

Items deferred beyond MVP scope:
- [ ] Configurable simulation speed slider
- [ ] Reset/Restart button
- [ ] Save/Load simulation state
- [ ] Export simulation data (CSV/JSON)
- [ ] Advanced statistics (avg age, population graphs)
- [ ] Different board sizes (configurable)
- [ ] Additional entity types (predator/prey variations)
- [ ] Sound effects
- [ ] Mobile responsive design
- [ ] Unit tests for systems
- [ ] Integration tests for full simulation loop

---

**Estimated Remaining Work**: ~4-6 hours for MVP completion
**Priority Order**: Phase 5 (Plant System) → Phase 6 (Visual Polish) → Phase 7 (Performance) → Testing → Documentation
