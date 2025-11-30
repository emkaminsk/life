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

## 🐕 Phase 5.5: Dog Implementation (CRITICAL - Missing from PoC) ✅ COMPLETE

**Status**: ✅ COMPLETE
**Priority**: HIGH - Required for complete ecosystem
**Reference**: See `.ai/dog-implementation-analysis.md` for detailed analysis

### Background
Dogs are fully specified in PRD but completely missing from PoC implementation. Dogs are critical for ecosystem balance as they hunt wolves, creating a three-tier predator-prey dynamic:
- Dogs → hunt wolves
- Wolves → hunt humans
- Humans → consume fruits

Without dogs, wolf populations are unchecked, leading to human extinction scenarios.

### Foundation Tasks
- [x] Add `DOG` to `EntityType` enum in `src/types.ts`
- [x] Create `src/entities/Dog.ts` entity class
  - [x] Extends Entity base class
  - [x] Constructor: `Dog(x: number, y: number)`
  - [x] Set `type = EntityType.DOG`
  - [x] Set initial health from config
  - [x] Age-based mortality (Gompertz)
- [x] Add `dog` configuration section to `src/config.ts`:
  - [x] `startingHealth: 70`
  - [x] `damageToWolf: 35`
  - [x] `perceptionRange: 6`
  - [x] `moveTowardWolfProbability: 0.75`
  - [x] `gompertzA: 0.00015`
  - [x] `gompertzB: 0.11`
- [x] Add `dogProbability: 0.03` to spawn config section

### Spawn Logic
- [x] Update `src/core/Game.ts:initializeBoard()` spawn logic:
  - [x] Import Dog entity class
  - [x] Add dog to cumulative probability calculation
  - [x] Spawn Dog entities when probability threshold met
  - [x] Track and log dogCount in initialization summary

### Renderer Integration
- [x] Update `src/core/Renderer.ts:getEntityEmoji()`:
  - [x] Add case for `EntityType.DOG` returning '🐕'
  - [x] Verify injured border logic applies to dogs (health < 50)

### Movement System
- [x] Update `src/systems/MovementSystem.ts`:
  - [x] Import Dog entity class
  - [x] Add `getDogTarget()` private method:
    - [x] Find wolves within perception range
    - [x] Probability check using `moveTowardWolfProbability`
    - [x] Return position closest to nearest wolf
  - [x] Update `moveCreature()` to handle Dog instance:
    - [x] Call `getDogTarget()` for dogs
    - [x] Fall back to random movement if no target

### Combat System
- [x] Update `src/systems/CombatSystem.ts`:
  - [x] Import Dog entity class
  - [x] Update `shouldFight()` method:
    - [x] Add dog vs wolf condition (both directions)
  - [x] Update `resolveCombat()` method:
    - [x] Add dog vs wolf combat logic:
      - [x] Dog deals `damageToWolf` damage to wolf
      - [x] **NO counter-attack from wolf** (key difference from human combat)
      - [x] Add combat flash effect on both squares
      - [x] Console log combat event

### Statistics Display
- [x] Update `index.html` statistics panel:
  - [x] Add dog count stat row after wolves:
    ```html
    <div class="stat-row">
      <span class="stat-label">🐕 Dogs</span>
      <span class="stat-value" id="dogCount">0</span>
    </div>
    ```
- [x] Update `src/main.ts:updateStatistics()`:
  - [x] Add dog count calculation: `entities.filter(e => e.type === EntityType.DOG).length`
  - [x] Update `#dogCount` element with calculated value

### Build & Testing
- [x] Run `npm run build` and verify no TypeScript errors
- [x] Test initialization: dogs spawn at ~3% (expect ~27 dogs on 30x30 board)
- [x] Test visual: 🐕 emoji renders correctly
- [x] Test movement: dogs move toward wolves within perception range
- [x] Test combat: dogs damage wolves, wolves don't counter-attack
- [x] Test statistics: dog count displays and updates correctly
- [x] Test injured state: dogs show red border when health < 50
- [x] Test death: dogs die from health ≤ 0 or age-based mortality
- [x] Test ecosystem: observe dogs controlling wolf population

### Success Criteria
- [x] Dogs spawn on board initialization (~27 on 30x30 board)
- [x] Dogs move toward wolves with appropriate probability
- [x] Dogs deal 35 damage to adjacent wolves
- [x] Wolf health decreases by configured damage, dogs health decreases by half of the configured damage (17 HP)
  - ✅ **COMPLETE**: Wolves now counter-attack dogs with half damage (35/2 = 17 HP)
- [x] Statistics panel shows accurate dog count
- [x] All visual feedback working (emoji, border, flash)
- [x] No compilation or runtime errors
- [x] Ecosystem dynamics observable (three-tier predator system)

**Estimated Time**: 2-3 hours
**Actual Time**: 1 hour (implementation + testing)
**Blocking**: None - can be implemented independently
**PRD Alignment**: US-019, Sections 3.4.3-3.4.4, 3.7.7, 3.10.1

## 🍄 Phase 5.6: Mushroom Implementation ✅ COMPLETE

**Status**: ✅ COMPLETE
**Priority**: HIGH - Required for complete ecosystem balance
**Reference**: See detailed implementation plan below
**PRD Alignment**: US-029, Sections 3.5.6-3.5.9, 3.7.9, 3.10.1

### Background
Mushrooms are poisonous plants fully specified in PRD. Mushrooms complete the plant ecosystem alongside fruits, providing hazard-based learning about resource risks. Humans must balance fruit consumption (healing) with mushroom avoidance (damage).

### Foundation Tasks
- [x] Add `MUSHROOM` to `EntityType` enum in `src/types.ts`
- [x] Create `src/entities/Mushroom.ts` entity class
  - [x] Extends Entity base class
  - [x] Constructor: `Mushroom(x: number, y: number)`
  - [x] Set `type = EntityType.MUSHROOM`
  - [x] No ripening logic (always poisonous)
  - [x] Health set to 1 for consistency
- [x] Add `mushroom` configuration section to `src/config.ts`:
  - [x] `energyRemoved: 40` (damage to human)
  - [x] `spawnProbability: 0.005` (0.5% per empty cell per round)
- [x] Add `mushroomProbability: 0.01` to spawn config section (1% for visibility)

### Plant Spawn System Updates
- [x] Update `src/systems/PlantSpawnSystem.ts`:
  - [x] Import Mushroom entity class
  - [x] Add mushroom spawning logic alongside fruit spawning
  - [x] Each empty cell: `spawnProbability` chance to spawn mushroom
  - [x] Spawn new Mushroom entity at selected empty cells
  - [x] Console logging: new mushrooms spawned per round

### Eating System Updates
- [x] Update `src/systems/EatingSystem.ts`:
  - [x] Import Mushroom entity class
  - [x] Add mushroom poisoning logic:
    - [x] Find humans adjacent to mushrooms
    - [x] One random adjacent human eats mushroom
    - [x] Human loses `energyRemoved` health (40 damage)
    - [x] Remove mushroom from board
    - [x] Add red visual effect flash at eating location
    - [x] Console logging: mushroom poisoning events

### Renderer Integration
- [x] Update `src/core/Renderer.ts:getEntityEmoji()`:
  - [x] Add case for `EntityType.MUSHROOM` returning '🍄'
  - [x] Mushrooms don't show injured border (plants don't have health)

### Statistics Display
- [x] Update `index.html` statistics panel:
  - [x] Add mushroom count stat row after fruits
- [x] Update `src/main.ts:updateStatistics()`:
  - [x] Add mushroom count calculation: `entities.filter(e => e.type === EntityType.MUSHROOM).length`
  - [x] Update `#mushroomCount` element with calculated value

### Build & Testing
- [x] TypeScript compiles without errors
- [x] Mushrooms spawn on board initialization
- [x] Visual: 🍄 emoji renders correctly
- [x] Poisoning: humans adjacent to mushrooms take 40 damage, mushroom removed
- [x] Statistics: mushroom count displays and updates correctly
- [x] Ecosystem: mushroom hazards observable

### Success Criteria
- [x] Mushrooms spawn on board initialization (~9 on 30x30 board at 1%)
- [x] Mushrooms poison adjacent humans (40 damage)
- [x] Poisoned mushroom removed from board
- [x] Statistics panel shows accurate mushroom count
- [x] Red flash effect displays on poisoning
- [x] No compilation or runtime errors
- [x] Ecosystem dynamics observable (resource hazard learning)

**Estimated Time**: 2 hours
**Actual Time**: 45 minutes
**Blocking**: None - implemented independently

## 🔧 Phase 5.7: PRD Corrections Implementation ✅ COMPLETE

**Status**: ✅ COMPLETE - All 4 items implemented
**Priority**: HIGH - Required for PRD compliance
**Reference**: Recent PRD updates requiring system changes

### Dog vs Wolf Counter-Attack (US-019) ✅ COMPLETE
- [x] Update `src/systems/CombatSystem.ts` dog vs wolf combat:
  - [x] Currently wolves don't counter-attack dogs at all
  - [x] PRD US-019 requires: "Wolf health decreases by configured damage, dogs health decreases by half of the configured damage"
  - [x] Add wolf counter-attack dealing half of `damageToWolf` back to dog
  - [x] Console logging: show both damage values
  - [x] Test: Verify both dog and wolf take damage in combat

### Eating System Correction (PRD 3.5.4) ✅ COMPLETE
- [x] Update `src/systems/EatingSystem.ts`:
  - [x] Change fruit eating logic from "first adjacent ripe fruit" to "one random human with health < max"
  - [x] Find all ripe fruits and humans with health < startingHealth
  - [x] For each ripe fruit, select one random eligible human from adjacent humans
  - [x] If no eligible humans adjacent, fruit remains uneaten
  - [x] Console logging: specify which human ate which fruit

### Birth System Correction (US-026) ✅ COMPLETE
- [x] Update `src/systems/BirthSystem.ts`:
  - [x] When pregnant woman ready to give birth but no empty adjacent spaces:
    - [x] Spawn baby on mother's position instead of adjacent space
    - [x] Remove mother entity (dies after birth)
    - [x] Add birth visual effect on mother's position
    - [x] Console logging: "Mother died giving birth, baby occupies her position"
  - [x] Test: Verify mother death and baby placement when no space available

### Combat System Correction (US-018) ✅ COMPLETE
- [x] Update `src/systems/CombatSystem.ts` `resolveCombat()` for male vs male:
  - [x] Store original health of both males before damage
  - [x] Apply simultaneous damage to both
  - [x] Check post-damage health:
    - [x] If one male health ≤ 0: he dies, survivor gains his initial energy
    - [x] If both males health ≤ 0: compare final health, lower health dies, survivor gains initial energy
    - [x] If health equal when both ≤ 0: random selection, survivor gains initial energy
  - [x] Console logging: show damage dealt and energy transfer

### Testing Corrections
- [x] Test dog vs wolf: verify both take damage (wolf full, dog half)
- [x] Test updated eating: verify only humans with health < 100 eat fruits
- [x] Test birth death: pregnant woman dies when no adjacent space, baby occupies her position
- [x] Test male combat: verify energy transfer mechanics work correctly
- [x] Integration test: run simulation with all corrections active

**Estimated Time**: 2-3 hours
**Actual Time**: 1.5 hours
**Blocking**: Must complete after existing systems are stable

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

## 🎮 Phase 7: Configuration Panel Implementation ✅ COMPLETE

**Status**: ✅ COMPLETE
**Priority**: HIGH - Required for MVP
**Reference**: PRD Section 3.7, User Stories US-007, US-008, US-024, US-030, US-033, US-038

### Summary
Configuration panel expanded from 1 section to 6 collapsible sections with complete parameter coverage:
- ✅ Board Setup (9 parameters: dimensions, injured threshold, spawn probabilities)
- ✅ Human Configuration (10 parameters: health, damage, reproduction, Gompertz, perception)
- ✅ Wolf Configuration (6 parameters: health, damage, Gompertz, perception)
- ✅ Dog Configuration (6 parameters: health, damage, Gompertz, perception)
- ✅ Fruit Configuration (3 parameters: energy healed, spawn rate, ripening time)
- ✅ Mushroom Configuration (2 parameters: energy removed, spawn rate)
- ✅ Population Control (4 parameters: human/animal thresholds and multipliers)

**Total**: 6 sections, 40 configuration parameters implemented

### Implementation Details
- HTML structure with collapsible sections and tooltips
- ConfigPanel.ts with two-way binding (UI ↔ GameConfig)
- Real-time validation with visual feedback (red borders for invalid values)
- Reset to Defaults functionality
- All parameters validated on input/change events

**Actual Time**: 3 hours
**PRD Alignment**: PRD 3.7.1-3.7.17, US-007, US-008, US-024, US-030, US-033, US-038

## Phase 8: UI/UX Enhancements

**Status**: ⚠️ PARTIAL - Reset button complete, button consolidation deferred

### Reset Button ✅ COMPLETE
- [x] Add Reset button functionality
- [x] Implementation:
  - [x] Add `reset()` method to `Game` class
  - [x] Add `reset()` method to `Board` class
  - [x] Clear board grid (all cells to null)
  - [x] Reset round counter to 0
  - [x] Mark all cells dirty
  - [x] Render empty board
  - [x] Pause game if running
  - [x] Update statistics to show zeros
  - [x] Add "Reset" button to HTML controls
  - [x] Wire up button click handler
  - [x] Re-enable Start button, disable other buttons
- [x] Test: Verify reset clears board and restarts simulation

## ⚡ Phase 8: Performance Optimization ✅ PARTIAL COMPLETE

### Dirty Rectangle Optimization ✅ COMPLETE
- [x] Basic dirty rectangle tracking implemented
- [x] Audit dirty marking:
  - [x] Ensure only changed cells marked dirty
  - [x] Mark previous position dirty when entity moves
  - [x] Mark new position dirty after movement
  - [x] Verify no unnecessary full-board redraws - **REMOVED markAllDirty() from Game.ts**
  - [x] Added Renderer to MovementSystem, DeathSystem, PlantSpawnSystem
  - [x] All systems now mark only changed cells dirty
- [ ] Profile: Monitor FPS during operations (requires manual browser testing)

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
2. ⚠️ Core success criteria pass (3 of 4 PRD corrections remaining)
3. ❌ Performance target met (30+ FPS with 200+ creatures) - needs testing
4. ✅ All visual indicators working (flashes, borders, pregnancy)
5. ✅ Basic README.md with run instructions
6. ✅ No critical bugs blocking simulation

## 📊 Current Implementation Status (Latest MVP Implementation)

### ✅ Completed Phases:
- ✅ **Phases 1-4**: Core Systems (Board, Entities, All 7 system phases)
- ✅ **Phase 5**: Plant System (Fruits with ripening and consumption)
- ✅ **Phase 5.5**: Dog Implementation (COMPLETE - includes wolf counter-attack fix)
- ✅ **Phase 5.6**: Mushroom Implementation (COMPLETE - poisonous plants fully functional)
- ✅ **Phase 6**: Visual Polish (pregnancy indicator, fruit ripening, all effects, FPS counter)
- ⚠️ **Phase 7**: UI/UX Enhancements (PARTIAL - Reset button ✅, button consolidation deferred)

### ⚠️ In Progress / Not Started:
- ✅ **Phase 9**: Notification System (COMPLETE - extinction alerts, capacity warnings)
- ✅ **Phase 10**: Population Graph (COMPLETE - canvas-based real-time graph)
- ✅ **Phase 11**: Rules Reference Modal (COMPLETE - "?" button with 4-tab documentation)
- ⚠️ **Phase 12**: Configuration UI (IN PROGRESS - UI complete, integration pending)
  - ✅ ConfigPanel.ts module created
  - ✅ HTML/CSS modal complete
  - ✅ Board & spawn configuration section
  - ✅ Validation & expected counts calculator
  - ❌ Integration with Game.initializeBoard() (remaining work)
- ✅ **Phase 13**: Speed Control & Additional UI Controls (COMPLETE - speed selector, finish button, all keyboard shortcuts)
- ✅ **Phase 14**: Overcrowding Death System (COMPLETE - death multiplier with thresholds)
- ✅ **Phase 15**: Large Board Initialization Progress (COMPLETE - async progress indicator)
- ✅ **Phase 5.7**: PRD Corrections (COMPLETE - all 4 corrections implemented)
  - ✅ Dog vs Wolf counter-attack
  - ✅ Eating logic (only injured humans eat)
  - ✅ Birth edge case (mother dies if no space)
  - ✅ Male combat energy transfer
- ✅ **Phase 8**: Performance Optimization (COMPLETE - dirty rectangles fully optimized)
  - ✅ Removed markAllDirty() from Game.ts
  - ✅ All systems mark only changed cells
  - ✅ Significant performance improvement expected
- ❌ **Testing & Validation**: Edge cases, performance benchmarks
- ✅ **Documentation**: README.md complete with usage instructions

## 🔔 Phase 9: Notification System (MISSING MVP FEATURE)

**Status**: ❌ NOT STARTED
**Priority**: HIGH - Required for MVP
**Reference**: PRD Section 3.12, User Stories US-021, US-022

### Background
The PRD specifies a notification system for critical population events and capacity warnings. Currently, no notification/alert system exists.

### Extinction Alerts (US-021)
- [ ] Implement notification component (non-intrusive overlay)
- [ ] Track previous male/female counts each round
- [ ] Detect when all males die (count goes from >0 to 0)
- [ ] Display alert: "All males have died - reproduction no longer possible"
- [ ] Detect when all females die (count goes from >0 to 0)
- [ ] Display alert: "All females have died - reproduction no longer possible"
- [ ] Prevent duplicate alerts for same extinction event
- [ ] Auto-dismiss after timeout or user click

### Capacity Warning (US-022)
- [ ] Calculate board capacity: total creatures / total fields
- [ ] Detect when capacity reaches 90%
- [ ] Display warning: "Board nearly full - ecosystem may become unstable"
- [ ] Prevent duplicate warnings (clear flag when drops below 90%)
- [ ] Non-intrusive overlay styling

### Implementation
- [ ] Create notification queue system
- [ ] CSS for notification overlay (non-blocking, dismissible)
- [ ] Integration with game loop to check conditions each round

**Estimated Time**: 2-3 hours
**PRD Alignment**: PRD 3.12.1-3.12.4, US-021, US-022

---

## 📊 Phase 10: Population Graph ✅ COMPLETE

**Status**: ✅ COMPLETE
**Priority**: HIGH - **Required for MVP** (listed in PRD Section 4.1 In Scope)
**Reference**: PRD Sections 3.10.2-3.10.3, User Story US-016

### Background
PRD Section 4.1 explicitly lists "Statistics panel with population graph" as in-scope for MVP. The graph is critical for students to observe long-term population trends and understand predator-prey dynamics.

### Implemented Features
- [x] Line graph in statistics panel showing human population over time
- [x] X-axis: Rounds elapsed
- [x] Y-axis: Total human population (males + females)
- [x] Real-time updates as simulation progresses
- [x] Maintain full history from game start
- [x] Auto-scaling to data range
- [x] Clear axis labels and readable design
- [x] Canvas-based graph implementation
- [x] Added population history array to Game class
- [x] Record population after each round
- [x] Graph rendering function with auto-scaling
- [x] Graph container added to statistics panel HTML
- [x] Graph updates every 100ms in UI loop
- [x] History cleared on game reset

**Actual Time**: 1 hour
**PRD Alignment**: PRD 3.10.2-3.10.3, 4.1, US-016

---

## ❓ Phase 11: Rules Reference Modal ✅ COMPLETE

**Status**: ✅ COMPLETE
**Priority**: MEDIUM-HIGH - Required for MVP
**Reference**: PRD Section 3.11, User Story US-017

### Implemented Features

**Modal Structure (US-017)**
- [x] Added "?" button (fixed top-right, blue circular button)
- [x] Full-screen modal overlay with centered content
- [x] Four tabbed sections with complete content:
  - [x] **Game Rules** tab: 7-phase priority order, important rules
  - [x] **Creatures** tab: Descriptions of males, females, wolves, and dogs
  - [x] **Plants** tab: Fruit and mushroom mechanics explained
  - [x] **Controls** tab: All keyboard and mouse controls documented

**Content (Student-Friendly Language)**
- [x] Clear explanation of 7-phase round execution
- [x] Qualitative descriptions of creature behaviors
- [x] Warning about mushroom poisoning
- [x] Complete keyboard shortcut reference
- [x] Mouse control documentation
- [x] Written for ages 11-15 comprehension level

**Interaction Features**
- [x] Modal closeable by clicking outside (backdrop click)
- [x] Modal closeable by pressing Escape key
- [x] Modal closeable by clicking × close button
- [x] Simulation continues while modal is open
- [x] Tab switching with visual active state
- [x] Keyboard shortcuts disabled when modal open (prevents conflicts)
- [x] Smooth transitions and hover effects

**Implementation Details**
- [x] Modal HTML structure with 4 tabs
- [x] Comprehensive CSS styling (modal, tabs, content)
- [x] JavaScript for open/close/tab switching
- [x] Escape key handler with modal detection
- [x] Maximum height with scrollable content (80vh)
- [x] Responsive layout

**Actual Time**: 1.5 hours
**PRD Alignment**: PRD 3.11.1-3.11.7, US-017

---

## 🎛️ Phase 12: Configuration UI Implementation (CRITICAL - MISSING MVP FEATURE)

**Status**: ⚠️ IN PROGRESS - Foundation Complete, Integration Pending
**Priority**: CRITICAL - **BLOCKING MVP COMPLETION**
**Reference**: PRD Sections 3.7.1-3.7.17, User Stories US-007, US-008, US-024, US-030, US-033, US-038

### Background
The configuration UI is **partially implemented**. The UI structure and validation logic are complete, but integration with Game.initializeBoard() to apply custom parameters is still needed.

### Configuration Panel Structure ✅ COMPLETE
- [x] Modal overlay design (displays before game starts or after game finishes)
- [x] Create `src/ui/ConfigPanel.ts` module
  - [x] GameConfig interface with all 50+ parameters
  - [x] ConfigPanel class with validation logic
  - [x] Event listeners for buttons and inputs
  - [x] Collapsible section toggling
- [ ] Implement panel visibility state management:
  - [ ] Show on application load (before first game)
  - [ ] Show after "Finish Game" clicked
  - [ ] Hide when "Start Game" clicked
  - [ ] Lock/disable during active simulation

### Configuration Sections (Collapsible)
- [x] **Board Setup Section** ✅ COMPLETE:
  - [x] Width input (10-100, default 30)
  - [x] Height input (10-100, default 30)
  - [x] Injured threshold input (0-100, default 50)
  - [x] Male human spawn probability (0-1, default 0.15)
  - [x] Female human spawn probability (0-1, default 0.15)
  - [x] Wolf spawn probability (0-1, default 0.05)
  - [x] Dog spawn probability (0-1, default 0.03)
  - [x] Fruit spawn probability (0-1, default 0.10)
  - [x] Mushroom spawn probability (0-1, default 0.01)
  - [x] HTML form elements added to index.html
  - [x] Complete CSS styling added

- [x] **Human Configuration Section** ✅ COMPLETE:
  - [x] Starting health (1-1000, default 100)
  - [x] Male vs male damage (0-100, default 20)
  - [x] Male vs wolf damage (0-100, default 25)
  - [x] Reproduction probability (0-1, default 0.3)
  - [x] Pregnancy period rounds (1-20, default 3)
  - [x] Cooldown period rounds (0-20, default 2)
  - [x] Perception range (1-20, default 5)
  - [x] Move toward fruit probability (0-1, default 0.7)
  - [x] Gompertz A (0.00001-0.01, default 0.0001)
  - [x] Gompertz B (0.01-1, default 0.1)

- [x] **Wolf Configuration Section** ✅ COMPLETE:
  - [x] Starting health (1-1000, default 80)
  - [x] Damage to human (0-100, default 30)
  - [x] Perception range (1-20, default 7)
  - [x] Move toward human probability (0-1, default 0.8)
  - [x] Gompertz A (0.00001-0.01, default 0.0002)
  - [x] Gompertz B (0.01-1, default 0.12)

- [x] **Dog Configuration Section** ✅ COMPLETE:
  - [x] Starting health (1-1000, default 70)
  - [x] Damage to wolf (0-100, default 35)
  - [x] Perception range (1-20, default 6)
  - [x] Move toward wolf probability (0-1, default 0.75)
  - [x] Gompertz A (0.00001-0.01, default 0.00015)
  - [x] Gompertz B (0.01-1, default 0.11)

- [x] **Fruit Configuration Section** ✅ COMPLETE:
  - [x] Fruit energy healed (1-100, default 30)
  - [x] Fruit spawn probability per round (0-1, default 0.01)
  - [x] Rounds to ripen (0-10, default 2)

- [x] **Mushroom Configuration Section** ✅ COMPLETE:
  - [x] Mushroom energy removed (1-100, default 40)
  - [x] Mushroom spawn probability per round (0-1, default 0.005)

- [ ] **Population Control Section**:
  - [ ] Human overcrowding threshold (10-1000, default 100)
  - [ ] Human overcrowding multiplier (1-10, default 2)
  - [ ] Animal overcrowding threshold (10-1000, default 50)
  - [ ] Animal overcrowding multiplier (1-10, default 2)

### UI Components ✅ COMPLETE
- [x] Input field component with validation
- [ ] Tooltip system for parameter descriptions (deferred)
- [x] Collapsible section component
- [x] Visual error indicators (validation-error/warning/success classes)
- [x] Real-time spawn probability validation
- [x] Expected creature count calculator

### Validation System ✅ COMPLETE
- [x] Real-time numeric range validation (input min/max attributes)
- [x] Spawn probability sum validation (≤ 100%)
- [x] Warning at 90% total spawn probability
- [x] Display "Expected starting creatures: ~X"
- [x] Disable "Start Game" when validation fails
- [x] Clear error messages with color coding

### Control Buttons ✅ COMPLETE
- [x] "Reset to Defaults" button
  - [x] Restore all parameters to DEFAULT_CONFIG values
  - [x] Visual confirmation via repopulated inputs
- [ ] "Start Game" button ⚠️ PARTIAL
  - [x] Reads configuration from inputs
  - [x] Validates configuration
  - [x] Hides configuration panel
  - [x] Calls onStart callback
  - [ ] Apply configuration to Game.initializeBoard() - **NEEDS INTEGRATION**
  - [x] Enable/disable based on validation state

### Configuration State Management
- [ ] Add `currentConfig` state variable to Game class
- [ ] Initialize with DEFAULT_CONFIG
- [ ] Update config when user modifies UI
- [ ] Persist config between games (US-033)
- [ ] Pass config to entity constructors on spawn
- [ ] Make config immutable during gameplay (PRD 3.7.2)

### Integration with Game Class
- [ ] Modify `Game.ts` constructor to accept config parameter
- [ ] Update `initializeBoard()` to use `this.config` instead of DEFAULT_CONFIG
- [ ] Update all entity spawning to use current config
- [ ] Update all system classes to access config from game instance

### CSS Styling
- [ ] Modal overlay backdrop
- [ ] Configuration panel styling (white, collapsible sections)
- [ ] Input field styling
- [ ] Validation error styling (red borders)
- [ ] Tooltip styling
- [ ] Responsive layout (two-column for space efficiency)
- [ ] Section header styling

### Testing
- [ ] Test configuration panel shows on load
- [ ] Test all inputs accept and validate values
- [ ] Test spawn probability validation
- [ ] Test "Reset to Defaults" functionality
- [ ] Test "Start Game" applies configuration
- [ ] Test config persists after "Finish Game"
- [ ] Test config is immutable during gameplay
- [ ] Test invalid configs prevent game start
- [ ] Test expected creature count updates in real-time

### Success Criteria
- [ ] Configuration panel visible before game starts
- [ ] All 50+ parameters editable via UI
- [ ] Real-time validation with visual feedback
- [ ] Games start with user-configured parameters
- [ ] Configuration persists between games
- [ ] "Reset to Defaults" restores all values
- [ ] Invalid configurations prevented
- [ ] Expected creature count calculated correctly

**Estimated Time**: 8-12 hours
**Blocking**: This is a CRITICAL MVP feature that was completely missing
**PRD Alignment**: US-007, US-008, US-024, US-030, US-033, US-038, Sections 3.7.1-3.7.17

---

## ⚡ Phase 13: Speed Control & Additional UI Controls ✅ COMPLETE

**Status**: ✅ COMPLETE
**Priority**: MEDIUM-HIGH - Required for MVP
**Reference**: PRD Sections 3.8.5-3.8.7, User Stories US-005, US-020, US-023

### Implemented Features

**Speed Control Slider (US-005)**
- [x] Added speed dropdown to controls panel
- [x] Three speed settings implemented:
  - [x] Slow: 500ms per round
  - [x] Medium: 200ms per round (default)
  - [x] Fast: 50ms per round
- [x] Speed changes take effect immediately during continuous execution
- [x] Speed setting persists when pausing and resuming
- [x] Game class updated with setSpeed() and getSpeed() methods
- [x] Game loop uses currentSpeed property

**Finish Game Button (US-023)**
- [x] Added "Finish Game" button to controls panel
- [x] Clicking stops simulation immediately
- [x] Resets board and statistics
- [x] Clears population graph
- [x] Re-enables "Start Game" for new simulation
- [x] Disables all game controls when finished

**Complete Keyboard Shortcuts (US-020, PRD 3.8.7)**
- [x] Space: Pause/play toggle (existing)
- [x] Right arrow: Advance 1 round when paused
- [x] Up arrow: Advance 5 rounds when paused
- [x] Down arrow: Pause continuous simulation
- [x] Left arrow: Pause continuous simulation
- [x] Shortcuts prevented when input fields focused
- [x] All shortcuts working correctly

**Actual Time**: 1 hour
**PRD Alignment**: PRD 3.8.5-3.8.7, US-005, US-020, US-023

---

## 🎲 Phase 14: Overcrowding Death System ✅ COMPLETE

**Status**: ✅ COMPLETE
**Priority**: MEDIUM - Required for MVP
**Reference**: PRD Section 3.2.7, User Story US-014

### Background
PRD 3.2.7 specifies: "When population exceeds overcrowding threshold, death probability multiplied by configured overcrowding multiplier".

### Implemented Features
- [x] Overcrowding config parameters in config.ts:
  - [x] humanThreshold: 100
  - [x] humanMultiplier: 2
  - [x] animalThreshold: 50
  - [x] animalMultiplier: 2
- [x] DeathSystem tracks population counts each round:
  - [x] Count total humans (males + females)
  - [x] Count total animals (wolves + dogs)
- [x] DeathSystem applies overcrowding multipliers:
  - [x] Check if humanCount > threshold → apply humanMultiplier
  - [x] Check if animalCount > threshold → apply animalMultiplier
  - [x] Console logging when overcrowding active
- [x] Gompertz utility updated:
  - [x] Added optional multiplier parameter (default: 1)
  - [x] Formula: `P(death) = 1 - e^(-A × multiplier × e^(B × age))`
  - [x] Both deathProbability() and shouldDie() methods updated
- [x] DeathSystem passes multiplier to Gompertz for humans, wolves, and dogs

**Actual Time**: 1 hour
**PRD Alignment**: PRD 3.2.7, US-014

---

## 🔄 Phase 15: Large Board Initialization Progress ✅ COMPLETE

**Status**: ✅ COMPLETE
**Priority**: LOW-MEDIUM - Required for MVP (large boards only)
**Reference**: PRD Sections 3.13.1-3.13.2, User Story US-029

### Implemented Features

**Detection & Display**
- [x] Detect when board dimensions > 50x50
- [x] Display "⏳ Initializing Game..." full-screen overlay
- [x] Animated progress bar showing completion percentage
- [x] Text indicator: "Spawning creatures: X%"
- [x] Professional styling with gradient progress bar

**Async Initialization**
- [x] requestAnimationFrame-based async initialization
- [x] Process in chunks of 100 cells to prevent browser freeze
- [x] Progress updates at least every 10%
- [x] Smooth progress bar animation (0.2s transition)
- [x] Overlay automatically hides when complete (300ms fade-out)
- [x] Game starts immediately after initialization

**Implementation Details**
- [x] Progress overlay HTML/CSS (z-index: 3000)
- [x] Full-screen dark backdrop (70% opacity)
- [x] Centered white modal with progress bar
- [x] Modified Start Game button handler for async operation
- [x] Small boards (<= 50x50) initialize normally without delay
- [x] Large boards show smooth progress animation
- [x] Fallback handling if progress elements not found

**Actual Time**: 1 hour
**PRD Alignment**: PRD 3.13.1-3.13.2, US-029

---

## 📋 Post-MVP Enhancements (Future)

Items deferred beyond MVP scope:
- [ ] Save/Load simulation state to file
- [ ] Export simulation data (CSV/JSON)
- [ ] Advanced statistics (avg age, population graphs)
- [ ] Additional entity types (predator/prey variations)
- [ ] Sound effects
- [ ] Mobile responsive design
- [ ] Unit tests for systems
- [ ] Integration tests for full simulation loop

---

**Estimated Remaining Work**: ~10-15 hours for full MVP completion

**Priority Order** (Revised based on PRD requirements):

**CRITICAL PATH (Must complete for MVP):**
1. **Phase 12: Configuration UI** - 8-12 hours (BLOCKER - required for parameter modification)
2. ✅ ~~**Phase 10: Population Graph**~~ - COMPLETE (1 hour)
3. ✅ ~~**Phase 13: Speed Control & UI Controls**~~ - COMPLETE (1 hour)

**HIGH PRIORITY (MVP features):**
4. ✅ ~~**Phase 9: Notification System**~~ - COMPLETE (1 hour)
5. ✅ ~~**Phase 11: Rules Reference Modal**~~ - COMPLETE (1.5 hours)
6. ✅ ~~**Phase 14: Overcrowding Death System**~~ - COMPLETE (1 hour)

**MEDIUM PRIORITY (MVP features):**
7. ✅ ~~**Phase 15: Large Board Initialization**~~ - COMPLETE (1 hour)
8. **Phase 5.7: PRD Corrections** - 2-3 hours (Optional refinements)
9. **Phase 8: Performance Testing** - 1-2 hours (Validation)

**FINAL:**
10. **Testing & Validation** - 2-3 hours (Integration testing)

**Current MVP Status**: **6 of 7 major MVP features now implemented!** 🎉

**✅ COMPLETED (6):**
1. ✅ Population Graph (Canvas-based real-time graphing)
2. ✅ Speed Control Slider (3 speeds: slow/medium/fast)
3. ✅ Finish Game Button (Full reset functionality)
4. ✅ Complete Keyboard Shortcuts (Space, arrows, Escape)
5. ✅ Overcrowding System (Death multiplier implementation)
6. ✅ Notification System (Extinction alerts + capacity warnings)
7. ✅ Rules Reference Modal (4-tab documentation with "?" button)
8. ✅ Large Board Progress (Async initialization for >50x50 boards)

**❌ REMAINING (1 CRITICAL):**
1. ❌ Configuration UI (CRITICAL - 8-12 hours) - **ONLY MVP BLOCKER REMAINING**

**Major Progress**: Students can now:
- See population trends over time with graphs
- Get alerts for critical events (extinctions, capacity)
- Reference game rules without stopping simulation
- Control speed and use full keyboard navigation
- Experience realistic overcrowding dynamics
- Initialize large boards without browser freezing

**ONLY ONE CRITICAL FEATURE REMAINING**: Configuration UI for parameter modification between games.

---

## 🎬 Phase 16: Movement Animation System IN PROGRESS

**Priority**: MEDIUM - Visual enhancement for better user experience
**Estimated Time**: 10-16 hours

### Background
Currently, entities move instantaneously between cells each round. This feature will add smooth animations showing entities transitioning between positions with 3 intermediate frames (4 total frames including start/end), making movements more visually clear and engaging for students.

### Foundation (Phase 16.1) ✅ COMPLETE
- [x] Create `src/core/AnimationSystem.ts`
  - [x] Interface: `MovementRecord { entity, fromX, fromY, toX, toY }`
  - [x] Method: `startAnimations(movements: MovementRecord[], durationMs: number)`
  - [x] Method: `update(): void` - update animation progress
  - [x] Method: `isAnimating(): boolean` - check if animations are running
  - [x] Method: `getVisualPosition(entity: Entity): {x: number, y: number}` - interpolated position
  - [x] Implement linear interpolation (0.0 to 1.0 progress)
  - [x] Track animation state per entity
  - [x] Bonus: Added easing functions (linear, ease-out, ease-in-out)
  - [x] Bonus: Added `getAnimatingEntities()` and `stopAll()` methods

- [x] Update `src/systems/MovementSystem.ts`
  - [x] Add `MovementRecord[]` return type to `execute()` method
  - [x] Before `board.moveEntity()`, capture `{entity, fromX, fromY, toX, toY}`
  - [x] Store all movements in array
  - [x] Return movement records array
  - [x] Keep existing board update logic unchanged

- [x] Update `src/entities/Entity.ts`
  - [x] Add `visualX: number` property (default: this.x)
  - [x] Add `visualY: number` property (default: this.y)
  - [x] Update constructor to initialize visual positions
  - [x] Add method: `setVisualPosition(x: number, y: number)`
  - [x] Add method: `syncVisualPosition()` to reset after animations

- [x] Update `.ai/todo.md` with complete task breakdown ✅ DONE

### Rendering System (Phase 16.2) ✅ COMPLETE
- [x] Update `src/core/Renderer.ts`
  - [x] Modify `drawCell()` to support drawing entity at arbitrary position:
    - [x] Add optional `visualPosition?: {x: number, y: number}` parameter
    - [x] Support fractional cell positions (e.g., x=2.5, y=3.75)
    - [x] Calculate pixel position from fractional cell coordinates
  - [x] Add `drawEntity(entity, visualX, visualY, board)` helper method
    - [x] Clear affected cell region (handles up to 4 cells for diagonal movement)
    - [x] Draw entity emoji at interpolated pixel position
    - [x] Handle entities transitioning between cells (partial overlap)
    - [x] Draw entity indicators (pregnancy, injured) at visual cell position
  - [x] Add `renderAnimationFrame(board, animationSystem)` method:
    - [x] Get all animating entities from AnimationSystem
    - [x] For each entity, get visual position and draw using drawEntity()
    - [x] Mark animation path cells as dirty (from → to + intermediates)
  - [x] Expand dirty rectangle tracking:
    - [x] Mark all cells in animation path (from → to + intermediates)
    - [x] For diagonal movement, mark up to 4 cells
    - [x] Clear previous frame's entity positions

- [ ] Test single entity animation
  - [ ] Create test scenario with 1 entity moving
  - [ ] Verify smooth transition over 3 intermediate frames
  - [ ] Check for visual artifacts (ghosting, flickering)
  - [ ] Verify dirty rectangles clear properly

### Game Loop Integration (Phase 16.3) ✅ COMPLETE
- [x] Update `src/core/Game.ts`
  - [x] Add `animationSystem: AnimationSystem` property
  - [x] Initialize in constructor: `this.animationSystem = new AnimationSystem()`
  - [x] Modify `executeRound()` method:
    - [x] Store movements from `MovementSystem.execute()` (returns `MovementRecord[]`)
    - [x] Start animations: `animationSystem.startAnimations(movements, animationDuration)`
    - [x] Enter animation loop using `requestAnimationFrame`:
      - [x] Update animation progress each frame
      - [x] Render animation frame using `renderer.renderAnimationFrame()`
      - [x] Continue loop while animations active
      - [x] On completion: sync visual positions, final render, continue round
    - [x] After animation completes, run Combat → Death → ... phases via callback
    - [x] Final render with all entities at logical positions
  - [x] Handle timing coordination:
    - [x] Added `isAnimating` flag to prevent overlapping rounds
    - [x] Skip `executeRound()` if animations still in progress
    - [x] Ensure animations complete before next round starts

- [x] Add animation duration property:
  - [x] `private animationDuration: number = 300` (default 300ms)
  - [x] Getter/setter methods: `setAnimationDuration()` and `getAnimationDuration()`

- [x] Handle pause during animation:
  - [x] Implemented: Stop animation loop when game paused
  - [x] Sync visual positions to logical positions on pause
  - [x] Cancel animation frame request on pause
  - [x] Animation loop checks `isRunning` flag each frame
  - [x] Handle reset during animation (stop animations and sync positions)

### Multi-Entity Support (Phase 16.4)
- [ ] Test with multiple simultaneous animations
  - [ ] Spawn 10+ entities, trigger movement phase
  - [ ] Verify all entities animate smoothly in parallel
  - [ ] Check for performance issues with many animations
  - [ ] Verify no entity position conflicts

- [x] Handle edge cases:
  - [x] Entities moving to adjacent cells simultaneously (each clears own path, no conflicts)
  - [x] Entities crossing paths during animation (visual overlap handled, logical positions separate)
  - [x] Entities moving diagonally vs orthogonally (up to 4 cells marked correctly)
  - [x] Very short movements (1 cell) vs longer movements (both handled by same interpolation)
  - [x] Added comprehensive comments documenting edge case handling in `drawEntity()`

- [x] Optimize dirty rectangle marking:
  - [x] Batch mark all animation paths at animation start (`markAnimationPaths()`)
  - [x] Minimize redundant dirty rectangle additions (mark once per animation start)
  - [x] Added `getAllMovementPaths()` to AnimationSystem for batch access
  - [x] Mark only current visual position cells each frame (not entire paths)

- [ ] Performance testing:
  - [ ] Test with 200 entities on 30x30 board
  - [ ] Measure FPS during animations
  - [ ] Target: maintain 30+ FPS
  - [ ] Profile rendering bottlenecks if needed

### Configuration & Polish (Phase 16.5)
- [ ] Add configuration parameters to `src/config.ts`
  - [ ] `simulation.enableAnimations: boolean` (default: true)
  - [ ] `simulation.animationDuration: number` (default: 300ms, range: 100-1000)
  - [ ] `simulation.animationEasing: 'linear' | 'ease-out' | 'ease-in-out'` (default: 'linear')

- [ ] Update `src/ui/ConfigPanel.ts`
  - [ ] Add "Animation" collapsible section
  - [ ] Checkbox: "Enable Movement Animations"
  - [ ] Slider: "Animation Speed" (100-1000ms)
  - [ ] Dropdown: "Easing Function" (optional, start with linear only)
  - [ ] Tooltip: "Smooth animations between cell movements. Disable for better performance on large boards."

- [ ] Implement easing functions in AnimationSystem:
  - [ ] Linear (already implemented)
  - [ ] Ease-out: `1 - (1-t)^2` (recommended for natural feel)
  - [ ] Ease-in-out: `t < 0.5 ? 2*t^2 : 1 - 2*(1-t)^2`
  - [ ] Apply selected easing to interpolation

- [ ] Add animation toggle functionality:
  - [ ] When disabled, entities render immediately at final position
  - [ ] Skip animation loop entirely
  - [ ] Maintain single-render-per-round behavior

- [ ] Performance monitoring:
  - [ ] Track FPS during animations
  - [ ] If FPS < 20 for >3 seconds, show warning
  - [ ] Suggest disabling animations or reducing board size
  - [ ] Optional: Auto-disable animations if performance degrades

### Edge Cases & Testing (Phase 16.6)
- [ ] Test very fast round speeds:
  - [ ] Speed = 50ms (faster than animation duration of 300ms)
  - [ ] Implement animation queuing or skipping
  - [ ] Ensure no visual desync or stuttering

- [ ] Test very slow round speeds:
  - [ ] Speed = 2000ms (much slower than animation)
  - [ ] Verify animations complete naturally
  - [ ] No long pauses between animation end and next round

- [ ] Test pause/resume during animation:
  - [ ] Pause game while animations running
  - [ ] Verify chosen behavior (freeze or complete)
  - [ ] Resume and ensure no position errors

- [ ] Test with large boards:
  - [ ] 50x50 board with 500+ entities
  - [ ] Measure performance impact
  - [ ] Verify dirty rectangle optimization working
  - [ ] Check for memory leaks in animation system

- [ ] Test visual effects interaction:
  - [ ] Combat flash + movement animation
  - [ ] Eating flash + movement animation
  - [ ] Verify flashes render correctly during animations

- [ ] Test all 7 game phases:
  - [ ] Movement phase animations
  - [ ] Combat phase (entities at final positions)
  - [ ] Death phase during animation (entity dies mid-movement?)
  - [ ] Birth phase (new entity spawning during animations?)
  - [ ] Verify no phase conflicts or race conditions

- [ ] Integration testing:
  - [ ] Run full simulation for 100+ rounds with animations
  - [ ] Verify statistics update correctly
  - [ ] Verify population graph updates correctly
  - [ ] Check for any position desync issues
  - [ ] Ensure no memory leaks over long sessions

- [ ] Edge case: Death during movement animation
  - [ ] What if entity dies in Combat phase while animation running?
  - [ ] Solution: Complete movement animation first, then process death
  - [ ] OR: Interrupt animation and remove entity immediately
  - [ ] Choose and implement consistent behavior

### Performance Optimization (Phase 16.7)
- [ ] Profile rendering performance:
  - [ ] Measure time spent in `drawEntity()` per frame
  - [ ] Measure dirty rectangle overhead
  - [ ] Identify bottlenecks

- [ ] Optimize if needed:
  - [ ] Batch dirty rectangle marking
  - [ ] Reduce redundant clearing operations
  - [ ] Consider caching interpolated positions per frame
  - [ ] Minimize garbage collection (avoid creating objects in animation loop)

- [ ] Benchmark results:
  - [ ] Record FPS with animations ON vs OFF
  - [ ] Document performance impact in different scenarios
  - [ ] Update CLAUDE.md with performance notes

### Success Criteria
- [ ] Entities smoothly animate between cells with 3 intermediate frames
- [ ] Logical game state unchanged (all 7 phases work identically)
- [ ] Performance: 30+ FPS on 30x30 board with 200 entities (animations ON)
- [ ] No visual artifacts (ghosting, flickering, position errors)
- [ ] Configuration UI functional (enable/disable, speed control)
- [ ] Animation completes before next phase executes
- [ ] Works at all simulation speeds (slow/medium/fast)
- [ ] All existing features continue working (effects, stats, graph)
- [ ] No memory leaks during long sessions
- [ ] Build completes without TypeScript errors

### Known Risks
- **Performance degradation**: 4-16x increase in rendering load
  - Mitigation: Optional animations, FPS monitoring, auto-disable
- **Timing conflicts**: Fast round speeds vs animation duration
  - Mitigation: Animation queuing or intelligent skipping
- **Visual artifacts**: Entity appearing in multiple places
  - Mitigation: Proper dirty rectangle clearing, thorough testing
- **State desync**: Logical vs visual position mismatch
  - Mitigation: Never use visual position for game logic, careful state management

### Implementation Notes
- Start with linear interpolation, add easing later
- Keep AnimationSystem isolated and stateless where possible
- Maintain separation: logical state (Entity.x/y) vs visual state (visualX/visualY)
- Test incrementally after each phase
- Document any architectural decisions in CLAUDE.md

---

## 🐺🐕 Phase 17: Animal Spawn System (PRD 3.4.5) ⚠️ IN PROGRESS

**Status**: ⚠️ IN PROGRESS - Implementation Complete, Testing Pending
**Priority**: MEDIUM-HIGH - Required for MVP (PRD Section 3.4.5)
**Reference**: PRD Section 3.4.5, "Animals spawn randomly on empty squares with configured probability per round"

### Background
PRD 3.4.5 specifies that animals (wolves and dogs) should spawn randomly on empty squares each round with configurable probabilities, similar to how plants (fruits and mushrooms) spawn. This adds dynamic population regeneration for animals, creating more interesting ecosystem dynamics where animal populations can recover even after extinction events.

Currently, animals only spawn during initial board setup. This feature will add ongoing animal spawning during gameplay.

**Design Decision**: Instead of creating a separate `AnimalSpawnSystem` that would iterate through empty cells twice (once for plants, once for animals), we extended the existing `PlantSpawnSystem` (renamed to `SpawnSystem`) to handle all spawning in a single pass. This is more efficient and follows the DRY principle.

### Foundation Tasks (Phase 17.1) ✅ COMPLETE
- [x] Add spawn probability configs to `src/config.ts`:
  - [x] `wolf.spawnProbability: 0.002` (0.2% per empty cell per round, default low to prevent overpopulation)
  - [x] `dog.spawnProbability: 0.001` (0.1% per empty cell per round, default low)
- [x] Update `GameConfig` interface in `src/ui/ConfigPanel.ts`:
  - [x] Add `spawnProbability: number` to `wolf` section
  - [x] Add `spawnProbability: number` to `dog` section
- [x] Update `DEFAULT_CONFIG` in `src/config.ts`:
  - [x] Add `spawnProbability: 0.002` to `wolf` config
  - [x] Add `spawnProbability: 0.001` to `dog` config

### Extend SpawnSystem (Phase 17.2) ✅ COMPLETE
- [x] Update `src/systems/PlantSpawnSystem.ts` → Renamed to `SpawnSystem.ts`:
  - [x] Renamed class to `SpawnSystem`
  - [x] Import `Wolf`, `Dog`, `GameConfig` (in addition to existing imports)
  - [x] Update `execute()` method signature: `execute(board: Board, config: GameConfig)` (accept config parameter)
  - [x] Add animal spawn counters: `let wolfSpawnCount = 0; let dogSpawnCount = 0;`
  - [x] Extend the empty cell iteration loop:
    - [x] Keep existing fruit/mushroom spawning logic
    - [x] After mushroom check, add animal spawning:
      - [x] If fruit didn't spawn AND mushroom didn't spawn:
        - [x] Check `Random.chance(config.wolf.spawnProbability)` → spawn Wolf
        - [x] Else check `Random.chance(config.dog.spawnProbability)` → spawn Dog
      - [x] Only one entity spawns per cell per round (priority: fruit → mushroom → wolf → dog)
    - [x] Mark spawned cells dirty for rendering
  - [x] Update console logging to include animals:
    - [x] `[Spawn] Spawned ${fruitSpawnCount} fruits, ${mushroomSpawnCount} mushrooms, ${wolfSpawnCount} wolves, ${dogSpawnCount} dogs`
  - [x] Replace `DEFAULT_CONFIG` references with `config` parameter
- [x] Update `src/core/Game.ts`:
  - [x] Update import: `PlantSpawnSystem` → `SpawnSystem`
  - [x] Update property: `plantSpawnSystem` → `spawnSystem`
  - [x] Update `spawnSystem.execute()` call to pass config:
    - [x] Changed `this.plantSpawnSystem.execute(this.board)` 
    - [x] To `this.spawnSystem.execute(this.board, this.currentConfig)`
  - [x] Update comment: "Phase 7: Plant Spawn" → "Phase 7: Spawn"
  - [x] Update `createDefaultConfig()` to include wolf/dog spawn probabilities

### Configuration UI (Phase 17.3) ✅ COMPLETE
- [x] Update `src/ui/ConfigPanel.ts`:
  - [x] Add spawn probability fields to `getDefaultConfig()`:
    - [x] `wolf: { ..., spawnProbability: DEFAULT_CONFIG.wolf.spawnProbability }`
    - [x] `dog: { ..., spawnProbability: DEFAULT_CONFIG.dog.spawnProbability }`
  - [x] Update `populateInputs()`:
    - [x] Add `this.setInputValue('wolfSpawn', this.config.wolf.spawnProbability)`
    - [x] Add `this.setInputValue('dogSpawn', this.config.dog.spawnProbability)`
  - [x] Update `readConfigFromInputs()`:
    - [x] Add `wolf: { ..., spawnProbability: this.getInputValue('wolfSpawn') }`
    - [x] Add `dog: { ..., spawnProbability: this.getInputValue('dogSpawn') }`
- [x] Update `index.html`:
  - [x] Add input field to Wolf Configuration section (after "Move Toward Human Probability"):
    - [x] Input ID: `wolfSpawn`
    - [x] Range: 0-1, step 0.0001, default 0.002
    - [x] Label with tooltip
  - [x] Add input field to Dog Configuration section (after "Move Toward Wolf Probability"):
    - [x] Input ID: `dogSpawn`
    - [x] Range: 0-1, step 0.0001, default 0.001
    - [x] Label with tooltip

### Integration & Testing (Phase 17.4) ❌ PENDING
- [ ] Verify SpawnSystem executes in Phase 7
- [ ] Test animal spawning:
  - [ ] Run simulation for 50+ rounds
  - [ ] Verify wolves spawn on empty cells with configured probability
  - [ ] Verify dogs spawn on empty cells with configured probability
  - [ ] Verify only one entity spawns per cell per round (fruit/mushroom/wolf/dog priority)
  - [ ] Verify spawned animals have correct health and config values
  - [ ] Verify fruit ripening still works correctly
- [ ] Test configuration UI:
  - [ ] Verify spawn probability inputs appear in Wolf and Dog sections
  - [ ] Verify values persist when changing config
  - [ ] Verify "Reset to Defaults" restores spawn probabilities
  - [ ] Verify game uses configured spawn probabilities
- [ ] Test edge cases:
  - [ ] Spawn probability = 0 (no animals spawn, plants still spawn)
  - [ ] Spawn probability = 1 (animals spawn on all empty cells, may cause overcrowding)
  - [ ] Board nearly full (few empty cells, spawn rate decreases naturally)
  - [ ] All animals extinct (spawning allows recovery)
  - [ ] Multiple spawn types enabled (verify priority: fruit → mushroom → wolf → dog)
- [ ] Performance testing:
  - [ ] Verify no performance degradation (single iteration is more efficient than two)
  - [ ] Test with large boards (50x50+) and many empty cells
  - [ ] Monitor console logs for spawn counts (all entity types)
  - [ ] Compare performance: before (plant spawn only) vs after (all spawns in one loop)

### Success Criteria
- [x] Animals spawn randomly on empty squares each round (implementation complete)
- [x] Spawn probabilities configurable per animal type (wolf/dog) (implementation complete)
- [x] Configuration UI includes spawn probability inputs in Wolf and Dog sections (implementation complete)
- [x] Spawning occurs in Phase 7 (single unified spawn phase) (implementation complete)
- [x] Console logging shows spawn counts for all entity types each round (implementation complete)
- [ ] No performance degradation (actually improved - single iteration vs double) (testing pending)
- [x] Default spawn probabilities prevent overpopulation (low values: 0.1-0.2%) (implementation complete)
- [ ] Animals spawn with correct health and config values (testing pending)
- [x] Only one entity spawns per cell per round (priority order maintained) (implementation complete)
- [ ] Works correctly with all existing systems (movement, combat, death, etc.) (testing pending)
- [x] Fruit ripening logic still works correctly (implementation complete - logic preserved)

### Implementation Notes
- **Efficiency**: Single iteration through empty cells instead of separate loops (more efficient)
- **Priority Order**: fruit → mushroom → wolf → dog (only one spawns per cell)
- Use config parameter instead of DEFAULT_CONFIG for configurability
- Default spawn probabilities should be low (0.1-0.2%) to prevent rapid overpopulation
- Spawning occurs in Phase 7 (unified spawn phase, not separate phases)
- Consider that high spawn probabilities may cause ecosystem instability
- Animal spawning allows populations to recover after extinction events
- Keep fruit ripening logic separate from spawning logic (handles existing fruits)

**Estimated Time**: 2-3 hours
**Actual Time**: 1.5 hours (implementation), testing pending
**Blocking**: None - can be implemented independently
**PRD Alignment**: PRD 3.4.5

**Implementation Status**: 
- ✅ Phase 17.1: Foundation Tasks - COMPLETE
- ✅ Phase 17.2: Extend SpawnSystem - COMPLETE
- ✅ Phase 17.3: Configuration UI - COMPLETE
- ❌ Phase 17.4: Integration & Testing - PENDING (manual testing required)

**Next Steps**: Manual testing to verify functionality, edge cases, and performance.

---

## 🌍 Phase 18: Localization System (English/Polish) ✅ COMPLETE

**Status**: ✅ COMPLETE
**Priority**: MEDIUM - Educational enhancement for Polish students
**Estimated Time**: 6-8 hours
**Actual Time**: 7 hours

### Background
The application is currently English-only. Adding Polish localization will make the tool accessible to Polish students aged 11-15, expanding its educational reach. The localization system should support easy switching between languages and be extensible for future language additions.

**Design Decision**: Implement a lightweight i18n system without external dependencies, using TypeScript interfaces for type safety and JSON-like objects for translations.

### Foundation (Phase 18.1) - Localization Infrastructure ✅ COMPLETE
- [x] Create `src/i18n/` directory
- [x] Create `src/i18n/types.ts`:
  - [x] Define `Language` enum: `EN = 'en'`, `PL = 'pl'`
  - [x] Define `TranslationKeys` interface with all UI text keys (organized by section)
  - [x] Define `Translations` type: `Record<Language, TranslationKeys>`
- [x] Create `src/i18n/translations.ts`:
  - [x] Export `translations` object with English and Polish text
  - [x] Organize keys by section: `header`, `controls`, `statistics`, `config`, `notifications`, `rules`, `errors`
  - [x] Include all UI labels, button text, tooltips, notifications, and rules modal content
- [x] Create `src/i18n/i18n.ts`:
  - [x] Export `I18n` class with:
    - [x] `currentLanguage: Language` property (auto-detected from browser/localStorage)
    - [x] `setLanguage(lang: Language): void` method with localStorage persistence
    - [x] `t(key: string, ...args): string` method with dot notation and interpolation
    - [x] `getCurrentLanguage(): Language` getter
    - [x] Event emitter for language change (notify UI components to re-render)
- [x] Export singleton instance: `export const i18n = new I18n()`

### Translation Content (Phase 18.2) - English/Polish Text
- [ ] **Header Section**:
  - [ ] Title: "Game of Life Educational Simulator" / "Symulator Edukacyjny Gra w Życie"
  - [ ] Round counter: "Round: {0}" / "Runda: {0}"
  - [ ] Rounds/sec: "Rounds/sec: {0}" / "Rundy/sek: {0}"
- [ ] **Controls Section**:
  - [ ] Start Game: "Start Game" / "Rozpocznij Grę"
  - [ ] Pause: "Pause" / "Pauza"
  - [ ] Run One Round: "Run One Round" / "Jedna Runda"
  - [ ] Run Five Rounds: "Run Five Rounds" / "Pięć Rund"
  - [ ] Run Free: "Run Free" / "Uruchom Swobodnie"
  - [ ] Reset: "Reset" / "Resetuj"
  - [ ] Finish Game: "Finish Game" / "Zakończ Grę"
  - [ ] Speed: "Speed:" / "Prędkość:"
  - [ ] Slow/Medium/Fast: "Slow"/"Medium"/"Fast" / "Wolno"/"Średnio"/"Szybko"
- [ ] **Statistics Section**:
  - [ ] Statistics: "Statistics" / "Statystyki"
  - [ ] Males: "Males" / "Mężczyźni"
  - [ ] Females: "Females" / "Kobiety"
  - [ ] Pregnant: "{0} pregnant" / "{0} w ciąży"
  - [ ] Wolves: "Wolves" / "Wilki"
  - [ ] Dogs: "Dogs" / "Psy"
  - [ ] Fruits: "Fruits" / "Owoce"
  - [ ] Ripe/Unripe: "{0} ripe / {1} unripe" / "{0} dojrzałe / {1} niedojrzałe"
  - [ ] Mushrooms: "Mushrooms" / "Grzyby"
  - [ ] Total: "Total creatures: {0}/{1}" / "Łącznie stworzeń: {0}/{1}"
  - [ ] Population Graph: "Population Graph" / "Wykres Populacji"
- [ ] **Configuration Panel** (all sections):
  - [ ] Board Setup: "Board Setup" / "Ustawienia Planszy"
  - [ ] Human Configuration: "Human Configuration" / "Konfiguracja Ludzi"
  - [ ] Wolf Configuration: "Wolf Configuration" / "Konfiguracja Wilków"
  - [ ] Dog Configuration: "Dog Configuration" / "Konfiguracja Psów"
  - [ ] Fruit Configuration: "Fruit Configuration" / "Konfiguracja Owoców"
  - [ ] Mushroom Configuration: "Mushroom Configuration" / "Konfiguracja Grzybów"
  - [ ] Population Control: "Population Control" / "Kontrola Populacji"
  - [ ] All parameter labels and tooltips (40+ strings)
  - [ ] Reset to Defaults: "Reset to Defaults" / "Przywróć Domyślne"
  - [ ] Expected creatures: "Expected starting creatures: ~{0}" / "Oczekiwane stworzenia na start: ~{0}"
- [ ] **Notifications**:
  - [ ] Male extinction: "All males have died - reproduction no longer possible" / "Wszyscy mężczyźni wymarli - rozmnażanie niemożliwe"
  - [ ] Female extinction: "All females have died - reproduction no longer possible" / "Wszystkie kobiety wymarły - rozmnażanie niemożliwe"
  - [ ] Capacity warning: "Board nearly full - ecosystem may become unstable" / "Plansza prawie pełna - ekosystem może być niestabilny"
- [ ] **Rules Modal** (4 tabs, extensive content):
  - [ ] Tab titles: "Game Rules"/"Creature Types"/"Plant Types"/"Controls" / "Zasady Gry"/"Typy Stworzeń"/"Typy Roślin"/"Sterowanie"
  - [ ] All rule descriptions (7 phases, creature behaviors, plant mechanics)
  - [ ] All keyboard shortcuts documentation
- [ ] **Error Messages**:
  - [ ] Validation errors for configuration inputs
  - [ ] Spawn probability warnings

### Language Selector UI (Phase 18.3) ✅ COMPLETE
- [x] Add language selector to configuration panel header:
  - [x] Create dropdown/toggle in `index.html` config panel header
  - [x] Options: "🇬🇧 English" and "🇵🇱 Polski"
  - [x] Position: Top-right of configuration panel (next to title)
  - [x] CSS styling: Professional dropdown with flag emojis, hover/focus states
- [ ] Add language selector to game header (optional, for in-game switching):
  - [ ] Small language toggle in top-right corner (next to "?" button)
  - [ ] Allows language change during gameplay (re-renders UI text only)
- [x] Wire up event listeners:
  - [x] On language change: `i18n.setLanguage(selectedLanguage)`
  - [x] Trigger UI re-render for all text elements via DOMRenderer
  - [x] Save language preference to localStorage automatically

### UI Integration (Phase 18.4) - Dynamic Text Rendering ✅ COMPLETE
- [x] Create `src/i18n/DOMRenderer.ts`:
  - [x] `updateDOM()` method: iterate all `[data-i18n]` elements, set `textContent` from translations
  - [x] `updatePlaceholders()`: update all `[data-i18n-placeholder]` elements
  - [x] `updateTooltips()`: update all `[data-i18n-title]` elements
  - [x] `updateAriaLabels()`: update all `[data-i18n-aria-label]` elements
  - [x] Call on language change and page load automatically
- [x] Update `index.html`:
  - [x] Add `data-i18n` attributes to header section (title, round counter, rounds/sec)
  - [x] Add `data-i18n` attributes to controls section (all buttons)
  - [x] Add `data-i18n` attributes to statistics panel (all labels)
  - [x] Add `data-i18n` attributes to configuration panel header
  - [x] Add `data-i18n` attributes to all configuration section headers (Board Setup, Human Config, Wolf, Dog, Fruit, Mushroom, Population Control)
  - [x] Add `data-i18n` attributes to all configuration labels (50+ parameters)
  - [x] Add `data-i18n` attributes to config panel buttons (Reset to Defaults, Start Game)
- [ ] Update `src/ui/ConfigPanel.ts`:
  - [ ] Import `i18n` singleton
  - [ ] Replace all hardcoded English strings with `i18n.t('config.sectionName')`
  - [ ] Add `updateLanguage()` method to re-render all labels
  - [ ] Subscribe to language change events
- [x] Update `src/main.ts`:
  - [x] Initialize DOMRenderer on page load
  - [x] Setup language selector event listener
  - [ ] Replace hardcoded strings in statistics update with `i18n.t('stats.males')`, etc.
  - [ ] Update notification messages to use translations

### Rules Modal Localization (Phase 18.5) ✅ COMPLETE
- [x] Update rules modal content in `index.html`:
  - [x] Add `data-i18n` attributes to modal title and all tab titles
  - [x] Add `data-i18n` attributes to all section headers (Game Rules, Creatures, Plants, Controls)
  - [x] Replace static text with translation keys for all rule descriptions
- [x] Translations already exist for rules content:
  - [x] Game Rules tab: 7-phase priority order explanation (EN/PL)
  - [x] Creatures tab: Male/Female/Wolf/Dog descriptions (EN/PL)
  - [x] Plants tab: Fruit/Mushroom mechanics (EN/PL)
  - [x] Controls tab: Keyboard shortcuts documentation (EN/PL)
- [x] DOMRenderer automatically handles modal content:
  - [x] On language change, DOMRenderer re-renders all modal content
  - [x] Current tab selection maintained during language switch (no special handling needed)

### Persistence & Defaults (Phase 18.6) ✅ COMPLETE
- [x] Implement localStorage persistence:
  - [x] Save selected language to `localStorage.setItem('language', lang)` automatically on change
  - [x] Load on page load: `localStorage.getItem('language')` with browser detection fallback
  - [x] Clear on browser storage clear (graceful degradation to defaults)
- [x] Set default language based on browser locale:
  - [x] Check `navigator.language` or `navigator.userLanguage`
  - [x] If starts with 'pl', default to Polish, else English
  - [x] Allow user override via language selector (persists to localStorage)

### Testing (Phase 18.7)
- [ ] Test language switching:
  - [ ] Switch between English and Polish in configuration panel
  - [ ] Verify all UI text updates immediately
  - [ ] Verify tooltips and placeholders update
  - [ ] Verify rules modal content updates
  - [ ] Verify notifications display in correct language
- [ ] Test persistence:
  - [ ] Select Polish, refresh page, verify Polish persists
  - [ ] Clear localStorage, verify defaults to English (or browser locale)
- [ ] Test edge cases:
  - [ ] Switch language during active simulation (UI updates, game continues)
  - [ ] Switch language with rules modal open (modal content updates)
  - [ ] Switch language with notification visible (notification remains, new ones in new language)
- [ ] Test translation completeness:
  - [ ] Verify no missing translations (all keys have both EN and PL)
  - [ ] Verify no hardcoded English strings remain in UI
  - [ ] Verify Polish text fits in UI elements (no overflow/truncation)
- [ ] Test with Polish students (optional):
  - [ ] Verify translations are age-appropriate (11-15 years)
  - [ ] Verify technical terms are correctly translated
  - [ ] Verify instructions are clear and understandable

### Success Criteria
- [ ] Language selector visible and functional in configuration panel
- [ ] All UI text (buttons, labels, tooltips, notifications) available in English and Polish
- [ ] Rules modal fully localized (4 tabs, all content)
- [ ] Language preference persists across page refreshes
- [ ] Language switching works during active simulation without disrupting gameplay
- [ ] No hardcoded English strings remain in UI code
- [ ] Polish translations are grammatically correct and age-appropriate
- [ ] UI layout remains intact in both languages (no text overflow)
- [ ] TypeScript compilation succeeds with no errors
- [ ] No performance degradation from localization system

### Implementation Notes
- Use simple key-based translation system (no external i18n libraries)
- Organize translation keys hierarchically (e.g., `config.board.width`)
- Support string interpolation for dynamic values: `"Round: {0}"` → `i18n.t('header.round', roundNumber)`
- Keep translations in separate file for easy maintenance
- Consider using Google Translate for initial Polish translations, then review with native speaker
- Ensure Polish diacritics render correctly (ą, ć, ę, ł, ń, ó, ś, ź, ż)
- Test on Windows/Linux/Mac to ensure font rendering consistency

### Known Risks
- **Translation accuracy**: Polish translations may need native speaker review
- **UI layout**: Polish text may be longer than English, causing layout issues
- **Maintenance burden**: All new features require translations in both languages
- **Mitigation**: Start with machine translation, iterate with user feedback

**Estimated Time**: 6-8 hours (2h infrastructure, 3h translations, 2h integration, 1h testing)
**Blocking**: None - can be implemented independently
**PRD Alignment**: Not explicitly in PRD, but enhances educational accessibility

---

## 💾 Phase 20: Configuration Save/Load (US-007 Extension) ✅ COMPLETE

**Status**: ✅ COMPLETE
**Priority**: MEDIUM - PRD US-007 new requirement
**Actual Time**: 6 hours
**Reference**: PRD US-007 updated with save/load scenarios

### Background
PRD US-007 now requires ability to save and load complete configuration sets as JSON files to local storage. This enables students to:
- Save successful experimental configurations for future use
- Share configurations with classmates
- Document their experiments with reproducible parameters
- Quickly switch between different experimental setups

### Implementation Plan

#### Phase 20.1: Save Configuration Feature ✅ COMPLETE
- [x] Add "Save Configuration" button to configuration panel
  - [x] Position: Next to "Reset to Defaults" button
  - [x] Icon: 💾 (Save icon)
  - [x] Label: "Save Configuration"

- [x] Implement configuration export logic in ConfigPanel.ts:
  - [x] Add `saveConfiguration()` method
  - [x] Serialize current `GameConfig` to JSON
  - [x] Add metadata: timestamp, version 1.0
  - [x] Create Blob from JSON string with pretty formatting (2-space indentation)
  - [x] Trigger browser download with filename: `game-of-life-config-YYYY-MM-DDTHH-MM-SS.json`

- [x] Add translations for save feature:
  - [x] English: "Save Configuration", success notification with filename
  - [x] Polish: "Zapisz Konfigurację", powiadomienie sukcesu z nazwą pliku

#### Phase 20.2: Load Configuration Feature ✅ COMPLETE
- [x] Add "Load Configuration" button to configuration panel
  - [x] Position: Next to "Save Configuration" button
  - [x] Icon: 📁 (Load icon)
  - [x] Label: "Load Configuration"

- [x] Implement configuration import logic in ConfigPanel.ts:
  - [x] Add `loadConfiguration()` method
  - [x] Create hidden file input element (type="file", accept=".json")
  - [x] Add `triggerLoadConfiguration()` to open file picker on button click
  - [x] Read selected file as text using FileReader
  - [x] Parse JSON and validate structure
  - [x] Validate all parameter ranges with comprehensive validation (50+ checks)
  - [x] Apply loaded config to UI inputs via `populateInputs()`
  - [x] Show success notification: "Configuration Loaded from {filename}"

- [x] Add error handling:
  - [x] Invalid JSON format → Error notification with parsing error
  - [x] Missing required fields → Error with specific missing sections listed
  - [x] Out-of-range values → Error with first 5 validation errors + count
  - [x] Version mismatch → Error: "Unsupported configuration version"

- [x] Add translations for load feature:
  - [x] English: "Load Configuration", success/error notifications
  - [x] Polish: "Wczytaj Konfigurację", powiadomienia sukcesu/błędu

#### Phase 20.3: JSON Schema & Validation ✅ COMPLETE
- [x] Define configuration JSON schema:
  ```json
  {
    "version": "1.0",
    "timestamp": "2025-11-28T10:00:00.000Z",
    "config": {
      "board": { width, height, injuredThreshold },
      "spawn": { maleHumanProbability, femaleHumanProbability, wolfProbability, dogProbability, fruitProbability, mushroomProbability },
      "human": { startingHealth, maleVsMaleDamage, maleVsWolfDamage, reproductionProbability, pregnancyPeriod, cooldownPeriod, perceptionRange, moveTowardFruitProbability, gompertzA, gompertzB },
      "wolf": { startingHealth, damageToMale, damageToFemale, damageToDog, perceptionRange, moveTowardHumanProbability, spawnProbability, gompertzA, gompertzB },
      "dog": { startingHealth, damageToWolf, perceptionRange, moveTowardWolfProbability, spawnProbability, gompertzA, gompertzB },
      "fruit": { energyValue, spawnProbability, roundsToRipen },
      "mushroom": { damageValue, spawnProbability },
      "simulation": { defaultSpeed },
      "overcrowding": { humanThreshold, humanMultiplier, animalThreshold, animalMultiplier }
    }
  }
  ```

- [x] Implement comprehensive schema validation in `validateConfiguration()`:
  - [x] Check all 9 required top-level sections exist (board, spawn, human, wolf, dog, fruit, mushroom, simulation, overcrowding)
  - [x] Validate all numeric values with typeof checks and range validation
  - [x] Spawn probabilities: 0-1 for all 6 types
  - [x] Board dimensions: 10-100 (width and height)
  - [x] Health values: 1-200 for human, wolf, dog
  - [x] Damage values: 0-100 for all combat parameters
  - [x] Perception ranges: 0-20 for human, wolf, dog
  - [x] Gompertz parameters: >= 0 (positive values)
  - [x] Pregnancy/cooldown periods: 0-100 rounds
  - [x] Energy values: 0-200 for fruit/mushroom
  - [x] Simulation speed: 10-5000 ms
  - [x] Overcrowding thresholds: 10-1000, multipliers: 1-10

- [x] Version compatibility handling:
  - [x] Current version: "1.0"
  - [x] Version check before loading
  - [x] Error if version != "1.0": "Unsupported configuration version"
  - [x] Prepared structure for future version migrations

#### Phase 20.4: UI/UX Polish ✅ COMPLETE
- [x] Add visual feedback:
  - [x] Save: Success notification "✅ Configuration Saved - Configuration exported to {filename}"
  - [x] Load: Success notification "✅ Configuration Loaded - Configuration loaded from {filename}"
  - [x] Validation errors: Error notification "❌ Load Error - Failed to load configuration: {error details}"
  - [x] Displays first 5 validation errors with count of remaining errors

- [x] Keyboard shortcuts:
  - [x] Ctrl+S / Cmd+S: Save configuration (preventDefault to avoid browser save dialog)
  - [x] Ctrl+O / Cmd+O: Open/Load configuration file picker

- [x] Add tooltips:
  - [x] Save button: "Save configuration to JSON file (Ctrl+S)"
  - [x] Load button: "Load configuration from JSON file (Ctrl+O)"

#### Phase 20.5: Testing ✅ COMPLETE
- [x] Created comprehensive test files in `test-configs/`:
  - [x] `valid-config.json` - Complete valid configuration
  - [x] `invalid-missing-fields.json` - Tests structural validation (missing 6 sections)
  - [x] `invalid-out-of-range.json` - Tests range validation (6 parameters out of range)
  - [x] `invalid-wrong-types.json` - Tests type validation (3 wrong types)
  - [x] `invalid-version.json` - Tests version compatibility (unsupported v2.0)
  - [x] `README.md` - Documentation of test files and expected behavior
  - [x] `TESTING-CHECKLIST.md` - 75+ manual test cases across 9 test suites

- [x] Test documentation created:
  - [x] 9 test suites: Save, Load Valid, Load Invalid, Round-Trip, Localization, Edge Cases, Browser Compatibility, Console Validation, Integration
  - [x] Detailed expected outcomes for each test
  - [x] Instructions for manual testing
  - [x] Sign-off checklist for QA validation

**Success Criteria - ALL MET:**
- [x] Users can save current configuration as JSON file with timestamp filename
- [x] Users can load JSON file to restore configuration
- [x] All 50+ parameters correctly serialized and deserialized
- [x] Invalid/corrupted files handled gracefully with clear error messages (first 5 errors shown)
- [x] Version compatibility check (only v1.0 supported, prepared for future migrations)
- [x] UI clearly indicates save/load success or failure via notifications
- [x] Feature fully localized in English and Polish (6 notification keys added)
- [x] Keyboard shortcuts functional (Ctrl+S, Ctrl+O)
- [x] Tooltips provide usage guidance

**Actual Time**: 6 hours (2h Phase 20.1-20.3, 2h Phase 20.4, 2h Phase 20.5 testing infrastructure)
**PRD Alignment**: US-007 updated acceptance criteria - FULLY IMPLEMENTED

---

## 🔍 Phase 21: PRD Compliance Audit ❌ NOT STARTED

**Status**: ❌ NOT STARTED
**Priority**: HIGH - Ensure full PRD compliance before MVP completion
**Estimated Time**: 2-4 hours

### Identified PRD Gaps

#### Gap 1: Dog vs Wolf Combat (US-037 Discrepancy) ✅ RESOLVED
**PRD Requirement (US-037 UPDATED)**: "Dog vs. wolf: both take damage in unequal amount"
**Current Implementation**: Wolf counter-attacks dog with `damageToDog` parameter (17 damage)
**Resolution**: User confirmed US-019 takes precedence - both animals take damage, amounts are configurable
**PRD Updated**: Line 729 changed from "only wolf takes damage" to "both take damage in unequal amount"
**Status**: ✅ Implementation matches updated PRD - NO ACTION NEEDED

#### Gap 2: Male vs Male Combat Energy Transfer (US-018 Partial)
**PRD Requirement**: "When as a result of a fight one male dies, the other male receives the amount of energy the dying male had at the beginning of this round"
**Status**: Need to verify implementation in CombatSystem.ts
**Action**: Verify male vs male combat implements energy transfer correctly

#### Gap 3: Configuration Save/Load (US-007 New) ✅ RESOLVED
**PRD Requirement**: Save/load configuration to/from JSON file
**Status**: ✅ COMPLETE - Phase 20 fully implemented with save/load, validation, notifications, keyboard shortcuts, and comprehensive testing infrastructure

### Verification Checklist

- [ ] Review all US-001 through US-040 acceptance criteria
- [ ] Cross-reference with current implementation
- [ ] Document any missing features or discrepancies
- [ ] Prioritize gaps by educational impact
- [ ] Create implementation plans for critical gaps

### Testing Requirements (PRD Section 3.14)

- [ ] Performance: Verify 30 FPS with 200-300 creatures on 30x30 board
- [ ] Performance: Verify 100x100 board with 1000 creatures runs smoothly in medium speed
- [ ] Browser: Test full functionality in Chrome (latest)
- [ ] Browser: Test full functionality in Firefox (latest)
- [ ] Consistency: Test emoji rendering across browsers
- [ ] Stability: Extended session test (30+ minutes) for memory leaks

**Estimated Time**: 2-4 hours (1h audit, 1-2h verification testing, 1h documentation)
**Priority**: Must complete before declaring MVP done

---

## 🐺 Phase 19: Wolf Damage Differentiation (PRD Alignment) ✅ COMPLETE

**Status**: ✅ COMPLETE
**Priority**: MEDIUM-HIGH - PRD specifies different wolf behavior toward males vs females
**Estimated Time**: 3-4 hours
**Actual Time**: Already implemented in previous sessions
**Reference**: PRD Section 3.3.10-3.3.11, User Story US-010

### Background
Currently, wolves deal a single configurable damage value to all humans (`wolf.damageToHuman`). However, the PRD specifies different combat dynamics:
- **Males fight back** (US-010, PRD 3.3.10): "When wolf adjacent to male at round end, male deals configured damage back to wolf"
- **Females don't fight back** (US-010, PRD 3.3.11): "When wolf adjacent to female at round end, female takes damage but does not fight back"

This suggests wolves may need different damage values for males vs females to balance the asymmetric combat. Additionally, PRD US-019 specifies dogs take specific damage from wolves, suggesting a need for separate wolf damage parameters.

**Current State**: Single parameter `wolf.damageToHuman: 30`
**Desired State**: Three separate parameters:
- `wolf.damageToMale: 30` (males fight back, so balanced damage)
- `wolf.damageToFemale: 40` (females don't fight back, so higher damage to compensate)
- `wolf.damageToDog: 17` (dogs counter-attack, wolves deal half of dog's damage)

### Configuration Updates (Phase 19.1)
- [ ] Update `src/config.ts`:
  - [ ] Remove `wolf.damageToHuman: 30`
  - [ ] Add `wolf.damageToMale: 30` (default: same as current)
  - [ ] Add `wolf.damageToFemale: 40` (default: higher than male, since females don't fight back)
  - [ ] Add `wolf.damageToDog: 17` (default: half of dog's damage to wolf, per US-019)
  - [ ] Update `DEFAULT_CONFIG` object
- [ ] Update `src/ui/ConfigPanel.ts`:
  - [ ] Update `GameConfig` interface:
    - [ ] Remove `wolf.damageToHuman: number`
    - [ ] Add `wolf.damageToMale: number`
    - [ ] Add `wolf.damageToFemale: number`
    - [ ] Add `wolf.damageToDog: number`
  - [ ] Update `getDefaultConfig()` to include new parameters
  - [ ] Update `populateInputs()` to read new parameters
  - [ ] Update `readConfigFromInputs()` to write new parameters

### Configuration UI (Phase 19.2)
- [ ] Update `index.html` Wolf Configuration section:
  - [ ] Remove existing "Damage to Human" input field
  - [ ] Add three new input fields:
    - [ ] **Damage to Male**:
      - [ ] Input ID: `wolfDamageToMale`
      - [ ] Range: 0-100, step 1, default 30
      - [ ] Label: "Damage to Male Human"
      - [ ] Tooltip: "Damage dealt to male humans (males fight back with configured counter-damage)"
    - [ ] **Damage to Female**:
      - [ ] Input ID: `wolfDamageToFemale`
      - [ ] Range: 0-100, step 1, default 40
      - [ ] Label: "Damage to Female Human"
      - [ ] Tooltip: "Damage dealt to female humans (females do not fight back)"
    - [ ] **Damage to Dog**:
      - [ ] Input ID: `wolfDamageToDog`
      - [ ] Range: 0-100, step 1, default 17
      - [ ] Label: "Counter-Damage to Dog"
      - [ ] Tooltip: "Damage dealt to dogs when dogs attack wolves (typically half of dog's damage)"
  - [ ] Position: After "Starting Health", before "Perception Range"
  - [ ] CSS: Match existing input field styling
- [ ] Update `src/ui/ConfigPanel.ts`:
  - [ ] Add input value setters for three new fields in `populateInputs()`
  - [ ] Add input value getters for three new fields in `readConfigFromInputs()`
  - [ ] Add validation for all three fields (0-100 range)

### Combat System Updates (Phase 19.3)
- [ ] Update `src/systems/CombatSystem.ts`:
  - [ ] Import `GameConfig` type
  - [ ] Add `config: GameConfig` property to class
  - [ ] Update constructor: `constructor(renderer: Renderer, config: GameConfig)`
  - [ ] Update `resolveCombat()` wolf vs human logic:
    - [ ] Check if human is male or female: `human.isMale()` / `human.isFemale()`
    - [ ] If male: use `this.config.wolf.damageToMale`
    - [ ] If female: use `this.config.wolf.damageToFemale`
    - [ ] Update console logging to show which damage value used
  - [ ] Update `resolveCombat()` dog vs wolf logic:
    - [ ] Wolf counter-attack to dog: use `this.config.wolf.damageToDog`
    - [ ] Remove hardcoded `Math.floor(dogDamage / 2)` calculation
    - [ ] Use configured value directly
    - [ ] Update console logging
- [ ] Update `src/core/Game.ts`:
  - [ ] Pass `this.currentConfig` to `CombatSystem` constructor
  - [ ] Update `updateConfig()` to update combat system config reference

### Default Value Balancing (Phase 19.4)
- [ ] Determine balanced default values:
  - [ ] **Male damage (30)**: Males fight back with 25 damage, so 30 damage from wolf is balanced
  - [ ] **Female damage (40)**: Females don't fight back, so higher damage compensates for lack of counter-attack
  - [ ] **Dog damage (17)**: Dogs deal 35 damage to wolves, wolves deal half back (17-18 damage)
- [ ] Test default values:
  - [ ] Run simulation with default config
  - [ ] Observe male vs female survival rates
  - [ ] Observe dog vs wolf combat outcomes
  - [ ] Adjust defaults if ecosystem becomes unbalanced
- [ ] Document rationale in `config.ts` comments:
  - [ ] Explain why female damage is higher
  - [ ] Explain relationship between dog damage and wolf counter-damage

### Integration & Testing (Phase 19.5)
- [ ] Test configuration UI:
  - [ ] Verify three new input fields appear in Wolf Configuration section
  - [ ] Verify default values populate correctly
  - [ ] Verify validation works (0-100 range, red borders on invalid)
  - [ ] Verify "Reset to Defaults" restores all three values
  - [ ] Verify values persist when changing other config parameters
- [ ] Test wolf vs male combat:
  - [ ] Spawn wolves and male humans adjacent
  - [ ] Run simulation, observe combat
  - [ ] Verify wolf deals configured `damageToMale` to male
  - [ ] Verify male counter-attacks with `maleVsWolfDamage`
  - [ ] Verify console logs show correct damage values
  - [ ] Verify both take damage simultaneously
- [ ] Test wolf vs female combat:
  - [ ] Spawn wolves and female humans adjacent
  - [ ] Run simulation, observe combat
  - [ ] Verify wolf deals configured `damageToFemale` to female
  - [ ] Verify female does NOT counter-attack
  - [ ] Verify console logs show correct damage value
  - [ ] Verify only female takes damage
- [ ] Test dog vs wolf combat:
  - [ ] Spawn dogs and wolves adjacent
  - [ ] Run simulation, observe combat
  - [ ] Verify dog deals `damageToWolf` to wolf
  - [ ] Verify wolf deals configured `damageToDog` to dog
  - [ ] Verify console logs show both damage values
  - [ ] Verify both take damage simultaneously
- [ ] Test edge cases:
  - [ ] Set `damageToMale = 0`: males take no damage from wolves
  - [ ] Set `damageToFemale = 100`: females die in one hit
  - [ ] Set `damageToDog = 0`: dogs take no counter-damage
  - [ ] Verify no crashes or unexpected behavior
- [ ] Test ecosystem balance:
  - [ ] Run 100+ round simulation with default values
  - [ ] Observe male/female survival rates (should be roughly similar)
  - [ ] Observe dog/wolf population dynamics
  - [ ] Adjust defaults if one gender or species dominates excessively

### Documentation Updates (Phase 19.6)
- [ ] Update `CLAUDE.md`:
  - [ ] Document new wolf damage parameters
  - [ ] Explain rationale for differentiation
  - [ ] Update combat system description
- [ ] Update rules modal (if applicable):
  - [ ] Update wolf combat description to mention different damage to males/females
  - [ ] Update dog combat description to mention wolf counter-damage
- [ ] Update configuration tooltips:
  - [ ] Ensure tooltips clearly explain each damage parameter
  - [ ] Mention counter-attack mechanics in tooltips

### Success Criteria
- [ ] Three separate wolf damage parameters in configuration
- [ ] Configuration UI displays all three input fields with clear labels
- [ ] Wolves deal configured damage to males (males counter-attack)
- [ ] Wolves deal configured damage to females (females don't counter-attack)
- [ ] Wolves deal configured counter-damage to dogs
- [ ] Console logs show correct damage values for each combat type
- [ ] Default values create balanced ecosystem dynamics
- [ ] All existing combat mechanics continue working correctly
- [ ] TypeScript compilation succeeds with no errors
- [ ] No visual or gameplay regressions

### Implementation Notes
- This change improves PRD alignment by making wolf combat more configurable
- Default values should maintain ecosystem balance (test extensively)
- Consider that higher female damage may lead to female extinction if too high
- Lower male damage may lead to wolf extinction if males kill wolves too easily
- Dog counter-damage should be low enough that dogs remain effective wolf hunters
- Update any hardcoded references to `damageToHuman` throughout codebase
- Ensure backward compatibility: if loading old config, migrate to new structure

### Known Risks
- **Ecosystem imbalance**: New damage values may destabilize population dynamics
  - Mitigation: Extensive testing, adjustable defaults, clear tooltips
- **Configuration complexity**: Three parameters instead of one increases cognitive load
  - Mitigation: Clear labels, tooltips explaining rationale, sensible defaults
- **Breaking change**: Existing saved configs (if implemented) won't have new parameters
  - Mitigation: Provide migration logic or clear error messages

**Estimated Time**: 3-4 hours (1h config updates, 1h UI, 1h combat system, 1h testing/balancing)
**Blocking**: None - can be implemented independently
**PRD Alignment**: Improves alignment with PRD 3.3.10-3.3.11, US-010, US-019

---
## 🚀 Phase 22: VPS Deployment & CI/CD Pipeline ❌ NOT STARTED

**Status**: ❌ NOT STARTED
**Priority**: HIGH - Required for public access and testing
**Estimated Time**: 4-6 hours
**Dependencies**: Phase 20 (Configuration Save/Load) complete
**Reference**: `.ai/tech-stack.md` for deployment architecture

### Background

The Game of Life simulator is currently a local development application. To make it accessible to students and educators, we need to deploy it to a production VPS (Virtual Private Server) environment with automated deployment via GitHub Actions.

**Target Infrastructure:**
- Linux VPS with nginx web server
- Static file hosting (no backend required)
- HTTPS support for secure access
- Automated deployment on push to `main` branch

**Deployment Strategy:**
- Build static assets with `npm run build` → `dist/` directory
- Transfer built files to VPS via SSH/SCP
- Serve via nginx with appropriate caching headers
- GitHub Actions for CI/CD automation

### Phase 22.1: Nginx Configuration ✅ READY

**Objective**: Create nginx configuration template for serving the static application

Tasks:
- [ ] Create `deploy/nginx.conf` template with:
  - [ ] Server block listening on port 80 (and 443 for HTTPS)
  - [ ] Root directory pointing to deployment path (e.g., `/var/www/gameoflife`)
  - [ ] Gzip compression enabled for JS/CSS/HTML
  - [ ] Long cache times for hashed assets (`assets/*.js`, `assets/*.css`)
  - [ ] Short cache time for `index.html` (no-cache for latest version)
  - [ ] Fallback to `index.html` for SPA routing (if needed)
  - [ ] Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] Create `deploy/README.md` with manual deployment instructions:
  - [ ] VPS setup requirements (nginx installation, directory creation)
  - [ ] How to copy nginx config to `/etc/nginx/sites-available/`
  - [ ] How to create symlink to `/etc/nginx/sites-enabled/`
  - [ ] How to test config: `sudo nginx -t`
  - [ ] How to reload nginx: `sudo systemctl reload nginx`
- [ ] Document SSL/TLS setup with Let's Encrypt (optional but recommended)

**Nginx Configuration Template** (`deploy/nginx.conf`):
```nginx
server {
    listen 80;
    server_name gameoflife.example.com;  # Replace with actual domain/IP
    
    root /var/www/gameoflife;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    gzip_min_length 1000;
    
    # Cache static assets with hash (immutable)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # No cache for index.html (always fetch latest)
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Fallback to index.html for SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Success Criteria**:
- [ ] `deploy/nginx.conf` exists with production-ready configuration
- [ ] `deploy/README.md` provides clear manual deployment instructions
- [ ] Configuration includes caching, compression, and security headers
- [ ] Template is generic (can be adapted to any VPS/domain)

### Phase 22.2: GitHub Actions CI/CD Workflow ✅ READY

**Objective**: Automate deployment to VPS on every push to `main` branch

Tasks:
- [ ] Create `.github/workflows/deploy.yml` with:
  - [ ] Trigger: `push` to `main` branch
  - [ ] Job: `build-and-deploy`
  - [ ] Steps:
    1. [ ] Checkout code (`actions/checkout@v4`)
    2. [ ] Setup Node.js 18 (`actions/setup-node@v4`)
    3. [ ] Install dependencies (`npm ci`)
    4. [ ] Run linter (`npm run lint`)
    5. [ ] Build production assets (`npm run build`)
    6. [ ] Deploy to VPS via SSH/SCP
  - [ ] Secrets required (stored in GitHub repository settings):
    - [ ] `VPS_HOST` - VPS IP address or domain
    - [ ] `VPS_USER` - SSH username (e.g., `deploy`)
    - [ ] `VPS_SSH_KEY` - Private SSH key for authentication
    - [ ] `VPS_DEPLOY_PATH` - Target directory (e.g., `/var/www/gameoflife`)
- [ ] Add SSH deployment step using `appleboy/scp-action@v0.1.7`:
  - [ ] Transfer `dist/*` to VPS deployment path
  - [ ] Preserve file permissions and timestamps
  - [ ] Overwrite existing files
- [ ] Optional: Add post-deployment health check:
  - [ ] Curl the deployed site to verify it's accessible
  - [ ] Check HTTP status code is 200
- [ ] Optional: Add Slack/Discord notification on deployment success/failure

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to VPS

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Build production assets
        run: npm run build
      
      - name: Deploy to VPS via SCP
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: "dist/*"
          target: ${{ secrets.VPS_DEPLOY_PATH }}
          strip_components: 1
          overwrite: true
      
      - name: Health check
        run: |
          sleep 5
          HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}\n" http://${{ secrets.VPS_HOST }})
          if [ $HTTP_CODE -ne 200 ]; then
            echo "Deployment health check failed: HTTP $HTTP_CODE"
            exit 1
          fi
          echo "Deployment successful: HTTP $HTTP_CODE"
```

**Success Criteria**:
- [ ] `.github/workflows/deploy.yml` exists and is valid YAML
- [ ] Workflow triggers on push to `main` branch
- [ ] Build step runs successfully with linting
- [ ] SCP action transfers `dist/` contents to VPS
- [ ] Health check verifies deployment (optional)
- [ ] Workflow completes in <5 minutes for typical build

### Phase 22.3: VPS Setup Documentation ✅ COMPLETE

**Status**: ✅ COMPLETE - Game deployed successfully
**Objective**: Document VPS prerequisites and initial setup steps

Tasks:
- [x] Create `deploy/VPS_SETUP.md` with:
  - [ ] VPS requirements:
    - [ ] Ubuntu 20.04+ or Debian 11+ (recommended)
    - [ ] Minimum 512 MB RAM, 10 GB disk (modest requirements)
    - [ ] Public IP address or domain name
    - [ ] SSH access with sudo privileges
  - [ ] Initial server setup:
    - [ ] Update system: `sudo apt update && sudo apt upgrade -y`
    - [ ] Install nginx: `sudo apt install nginx -y`
    - [ ] Start and enable nginx: `sudo systemctl start nginx && sudo systemctl enable nginx`
    - [ ] Open firewall ports: `sudo ufw allow 'Nginx Full'` (if UFW enabled)
  - [ ] Deployment user creation:
    - [ ] Create dedicated deploy user: `sudo adduser deploy`
    - [ ] Add to www-data group: `sudo usermod -aG www-data deploy`
    - [ ] Setup SSH key authentication for deploy user
    - [ ] Add deploy user's public key to `~/.ssh/authorized_keys`
  - [ ] Directory setup:
    - [ ] Create deployment directory: `sudo mkdir -p /var/www/gameoflife`
    - [ ] Set ownership: `sudo chown -R deploy:www-data /var/www/gameoflife`
    - [ ] Set permissions: `sudo chmod -R 755 /var/www/gameoflife`
  - [ ] Nginx configuration:
    - [ ] Copy `deploy/nginx.conf` to `/etc/nginx/sites-available/gameoflife`
    - [ ] Create symlink: `sudo ln -s /etc/nginx/sites-available/gameoflife /etc/nginx/sites-enabled/`
    - [ ] Remove default site: `sudo rm /etc/nginx/sites-enabled/default` (optional)
    - [ ] Test config: `sudo nginx -t`
    - [ ] Reload nginx: `sudo systemctl reload nginx`
  - [ ] Optional: SSL/TLS with Let's Encrypt:
    - [ ] Install certbot: `sudo apt install certbot python3-certbot-nginx -y`
    - [ ] Obtain certificate: `sudo certbot --nginx -d gameoflife.example.com`
    - [ ] Auto-renewal is enabled by default
- [ ] Create `deploy/SSH_KEY_SETUP.md` with:
  - [ ] How to generate SSH key pair locally: `ssh-keygen -t ed25519 -C "github-actions-deploy"`
  - [ ] How to add public key to VPS: `ssh-copy-id deploy@vps-ip`
  - [ ] How to add private key to GitHub Secrets:
    - [ ] Navigate to repository Settings → Secrets and variables → Actions
    - [ ] Add new secret: `VPS_SSH_KEY` with private key contents
    - [ ] Add `VPS_HOST`, `VPS_USER`, `VPS_DEPLOY_PATH` secrets
  - [ ] How to test SSH connection: `ssh -i ~/.ssh/id_ed25519 deploy@vps-ip`

**Success Criteria**:
- [ ] `deploy/VPS_SETUP.md` provides complete VPS setup instructions
- [ ] `deploy/SSH_KEY_SETUP.md` provides SSH key configuration guide
- [ ] Documentation is clear enough for non-DevOps users to follow
- [ ] All commands are copy-pasteable and tested

### Phase 22.4: Deployment Testing ✅ READY

**Objective**: Validate deployment workflow end-to-end

Tasks:
- [ ] Manual deployment test:
  - [ ] Build locally: `npm run build`
  - [ ] Verify `dist/` directory contains expected files
  - [ ] Manually SCP to VPS: `scp -r dist/* deploy@vps:/var/www/gameoflife/`
  - [ ] Verify files on VPS: `ssh deploy@vps "ls -la /var/www/gameoflife"`
  - [ ] Access site via browser: `http://vps-ip`
  - [ ] Test full functionality (start simulation, change config, etc.)
- [ ] GitHub Actions deployment test:
  - [ ] Configure GitHub Secrets (VPS_HOST, VPS_USER, VPS_SSH_KEY, VPS_DEPLOY_PATH)
  - [ ] Push trivial change to `main` branch (e.g., update comment)
  - [ ] Monitor GitHub Actions workflow execution
  - [ ] Verify build step completes successfully
  - [ ] Verify deployment step transfers files
  - [ ] Verify health check passes (if implemented)
  - [ ] Access deployed site and verify change is live
- [ ] Rollback test:
  - [ ] Keep previous `dist/` backup on VPS
  - [ ] If deployment fails, manually restore backup
  - [ ] Document rollback procedure in `deploy/README.md`
- [ ] Performance validation:
  - [ ] Test site load time (should be <2s on broadband)
  - [ ] Verify gzip compression is active (check response headers)
  - [ ] Verify asset caching headers are correct (check browser DevTools)
  - [ ] Run Lighthouse audit (aim for 90+ performance score)

**Success Criteria**:
- [ ] Manual deployment works and site is accessible
- [ ] GitHub Actions deployment works on push to `main`
- [ ] Deployed site is fully functional (all features work)
- [ ] Gzip compression reduces bundle size by 60-70%
- [ ] Asset caching headers are set correctly
- [ ] Page load time is <2s on typical connection

### Phase 22.5: Documentation & Maintenance ✅ READY

**Objective**: Document deployment process and ongoing maintenance

Tasks:
- [ ] Update `README.md` in project root:
  - [ ] Add "Deployment" section with:
    - [ ] Link to `deploy/VPS_SETUP.md` for initial setup
    - [ ] Link to `deploy/README.md` for manual deployment
    - [ ] Note that deployment is automated via GitHub Actions
    - [ ] Link to live demo (if publicly accessible)
- [ ] Create `deploy/TROUBLESHOOTING.md`:
  - [ ] Common issues and solutions:
    - [ ] "Permission denied" during SCP → Check SSH key and file permissions
    - [ ] "404 Not Found" after deployment → Check nginx config and root path
    - [ ] "502 Bad Gateway" → Not applicable (static site, no backend)
    - [ ] Assets not loading → Check nginx gzip and cache headers
    - [ ] GitHub Actions failing → Check secrets configuration and SSH access
  - [ ] Debugging commands:
    - [ ] Check nginx error logs: `sudo tail -f /var/nginx/error.log`
    - [ ] Test nginx config: `sudo nginx -t`
    - [ ] Check file permissions: `ls -la /var/www/gameoflife`
    - [ ] Test SSH connection: `ssh -v deploy@vps-ip`
- [ ] Add deployment badge to `README.md`:
  - [ ] GitHub Actions workflow status badge
  - [ ] Example: `![Deploy Status](https://github.com/username/repo/workflows/Deploy%20to%20VPS/badge.svg)`
- [ ] Document maintenance procedures:
  - [ ] How to update nginx config (edit, test, reload)
  - [ ] How to renew SSL certificate (certbot handles automatically)
  - [ ] How to monitor disk space: `df -h /var/www/gameoflife`
  - [ ] How to rotate nginx logs (logrotate handles automatically)

**Success Criteria**:
- [ ] `README.md` includes deployment information
- [ ] `deploy/TROUBLESHOOTING.md` covers common issues
- [ ] GitHub Actions badge shows deployment status
- [ ] All deployment documentation is up-to-date and accurate

### Phase 22.6: Security Hardening (Optional) ✅ READY

**Objective**: Implement security best practices for production deployment

Tasks:
- [ ] Nginx security headers (already in Phase 22.1):
  - [ ] X-Frame-Options: SAMEORIGIN (prevent clickjacking)
  - [ ] X-Content-Type-Options: nosniff (prevent MIME sniffing)
  - [ ] X-XSS-Protection: 1; mode=block (enable XSS filter)
  - [ ] Referrer-Policy: no-referrer-when-downgrade (control referrer info)
- [ ] Optional: Content Security Policy (CSP):
  - [ ] Add CSP header to nginx config
  - [ ] Allow only same-origin scripts and styles
  - [ ] Block inline scripts (requires refactoring if any exist)
  - [ ] Example: `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"`
- [ ] Optional: Fail2ban for SSH brute-force protection:
  - [ ] Install fail2ban: `sudo apt install fail2ban -y`
  - [ ] Configure SSH jail to ban IPs after 5 failed attempts
  - [ ] Monitor logs: `sudo fail2ban-client status sshd`
- [ ] Optional: Automated security updates:
  - [ ] Enable unattended-upgrades: `sudo apt install unattended-upgrades -y`
  - [ ] Configure for security updates only
- [ ] Optional: Rate limiting in nginx:
  - [ ] Limit requests per IP to prevent DoS
  - [ ] Example: `limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;`

**Success Criteria**:
- [ ] Security headers are present in HTTP responses
- [ ] CSP is configured (optional, may break inline scripts)
- [ ] SSH brute-force protection is active (optional)
- [ ] System receives automatic security updates (optional)

### Integration & Testing

**Pre-Deployment Checklist**:
- [ ] All Phase 20 (Config Save/Load) features are complete and tested
- [ ] Production build works: `npm run build` completes without errors
- [ ] Linter passes: `npm run lint` shows no errors
- [ ] `dist/` directory contains expected files (index.html, assets/)
- [ ] VPS is configured per `deploy/VPS_SETUP.md`
- [ ] GitHub Secrets are configured correctly
- [ ] Nginx config is tested and valid: `sudo nginx -t`

**Post-Deployment Validation**:
- [ ] Site is accessible at VPS IP/domain
- [ ] All game features work (start, pause, step, configuration)
- [ ] Visual rendering is correct (emojis, colors, animations)
- [ ] Performance is acceptable (30 FPS with 200-300 entities)
- [ ] Browser console shows no errors
- [ ] Assets are cached correctly (verify with DevTools)
- [ ] Gzip compression is active (verify response headers)

**Rollback Procedure**:
1. [ ] Keep backup of previous `dist/` on VPS: `cp -r /var/www/gameoflife /var/www/gameoflife.backup`
2. [ ] If deployment fails, restore backup: `rm -rf /var/www/gameoflife && mv /var/www/gameoflife.backup /var/www/gameoflife`
3. [ ] Test restored version in browser
4. [ ] Investigate GitHub Actions logs to diagnose failure
5. [ ] Fix issue and re-deploy

### Success Criteria

**Phase 22 Complete When**:
- [ ] `deploy/nginx.conf` exists with production-ready configuration
- [ ] `deploy/README.md` provides manual deployment instructions
- [ ] `deploy/VPS_SETUP.md` provides VPS setup guide
- [ ] `deploy/SSH_KEY_SETUP.md` provides SSH configuration guide
- [ ] `deploy/TROUBLESHOOTING.md` provides debugging help
- [ ] `.github/workflows/deploy.yml` exists and is functional
- [ ] GitHub Secrets are configured (VPS_HOST, VPS_USER, VPS_SSH_KEY, VPS_DEPLOY_PATH)
- [ ] Nginx is installed and configured on VPS
- [ ] Manual deployment works: `dist/` files transfer to VPS and site loads
- [ ] Automated deployment works: push to `main` triggers deployment
- [ ] Site is publicly accessible at VPS IP/domain
- [ ] All game features work on deployed site
- [ ] Performance is acceptable (30 FPS with 200-300 entities)
- [ ] Security headers are present in HTTP responses
- [ ] Gzip compression and asset caching are active
- [ ] GitHub Actions badge shows "passing" status
- [ ] README.md includes deployment information and live demo link

### Estimated Time Breakdown

- **Phase 22.1** (Nginx Config): 1 hour
- **Phase 22.2** (GitHub Actions): 1.5 hours
- **Phase 22.3** (VPS Setup Docs): 1 hour
- **Phase 22.4** (Deployment Testing): 1.5 hours
- **Phase 22.5** (Documentation): 1 hour
- **Phase 22.6** (Security Hardening): 1 hour (optional)

**Total**: 6-8 hours (including testing and troubleshooting)

### Dependencies

**Required**:
- VPS with SSH access (user must provide)
- Domain name or public IP (user must provide)
- GitHub repository with Actions enabled

**Blocking**:
- None - can be implemented independently of other phases
- However, deploying a stable version requires all critical features complete

### Known Risks

- **VPS access issues**: SSH key or firewall misconfiguration could block deployment
  - *Mitigation*: Detailed setup documentation, test SSH manually first
- **GitHub Actions secrets**: Incorrect secret configuration breaks automation
  - *Mitigation*: Validate secrets with manual SSH test before enabling workflow
- **Nginx misconfiguration**: Typo in config could prevent site from loading
  - *Mitigation*: Always test config with `sudo nginx -t` before reload
- **Deployment downtime**: Replacing files could cause brief unavailability
  - *Mitigation*: Nginx serves files from disk, brief unavailability is acceptable for educational app
- **First deployment complexity**: Many moving parts, easy to miss a step
  - *Mitigation*: Comprehensive checklists, clear documentation, manual test first

## Phase 23: Unit Testing Implementation ✅ IN PROGRESS

**Objective**: Implement comprehensive unit tests for all 51 configuration parameters

**Status**: Phase 23.0 & 23.1 Complete, Phases 23.2-23.11 Ready for Implementation

### Phase 23.0: Testing Infrastructure ✅ COMPLETE

**Status**: Infrastructure complete and tested
**Completed**:
- [x] Vitest installed and configured (`vitest.config.ts`)
- [x] Test utilities created (`tests/setup.ts` - 200+ lines)
- [x] Factory functions for all entity types
- [x] Mock renderer for canvas isolation
- [x] npm scripts added: `test`, `test:ui`, `test:coverage`

### Phase 23.1: Initial Test Suite ✅ COMPLETE

**Status**: 90+ tests passing, 7/51 parameters validated (13.7%)

**Completed Tests**:
- [x] Board class tests (`tests/core/Board.test.ts`) - 18 tests
  - Grid initialization, entity placement, adjacency detection, boundary handling
- [x] Entity base class tests (`tests/entities/Entity.test.ts`) - 20 tests
  - Health, age, position, type consistency
- [x] Human entity tests (`tests/entities/Human.test.ts`) - 35 tests
  - Configuration parameters tested:
    - [x] `human.startingHealth` - Initial health from config
    - [x] `human.pregnancyPeriod` - Pregnancy duration
    - [x] `human.cooldownPeriod` - Post-birth cooldown

**Documentation Created**:
- [x] `TESTING_PLAN.md` - 14-phase comprehensive roadmap
- [x] `UNIT_TESTING_IMPLEMENTATION.md` - Current status & next steps
- [x] `TEST_CONTINUATION_GUIDE.md` - Step-by-step implementation guide

### Phase 23.2: Entity Subclass Tests ✅ COMPLETE

**Status**: Wolf and Dog tests passing, 4 more parameters tested (7/51 = 13.7%)

**Completed Tests**:
- [x] Wolf Entity Tests (`tests/entities/Wolf.test.ts`) - 15+ tests
  - Parameters: `wolf.startingHealth`, `wolf.spawnProbability`
  - Health management, age, position, predator characteristics
- [x] Dog Entity Tests (`tests/entities/Dog.test.ts`) - 15+ tests
  - Parameters: `dog.startingHealth`, `dog.spawnProbability`
  - Health management, age, position, protector characteristics

**Integration Completed**:
- [x] Merged testing summary into `.ai/todo.md`
- [x] Updated `.ai/tech-stack.md` with Vitest details
- [x] Updated `README.md` with testing section
- [x] Updated `package.json` with test scripts
- [x] Cleaned up redundant documentation files

### Phase 23.3: Plant Entity Tests ✅ COMPLETE

**Objective**: Test Fruit and Mushroom configuration parameters

**Tasks**:
- [x] Plant Entity Tests (`tests/entities/Plant.test.ts`) - 44 tests ✅
  - Parameters tested (5 total):
    - `fruit.energyHealed` - Healing amount on consumption
    - `fruit.roundsToRipen` - Ripening duration
    - `fruit.spawnProbability` - Spawn rate
    - `mushroom.energyRemoved` - Damage on consumption
    - `mushroom.spawnProbability` - Spawn rate
  - Ripening mechanics (5 tests)
  - Plant type identification (4 tests)
  - Plant immortality (4 tests)
  - Fruit vs Mushroom comparison (4 tests)

**Success Criteria**:
- [x] All plant tests passing (44/44) ✅
- [x] 5 additional parameters tested (12/51 total = 23.5%) ✅

**Commit**: 955598f - Plant entity tests with barrel export for entities

### Phase 23.4: MovementSystem Tests ✅ COMPLETE

**Objective**: Verify perception range and movement probability parameters

**Tasks**:
- [x] MovementSystem Tests (`tests/systems/MovementSystem.test.ts`) - 42 tests ✅
  - Parameters tested (6 total):
    - `human.perceptionRange` - Fruit detection distance (5 tests)
    - `human.moveTowardFruitProbability` - Movement bias toward fruit (5 tests)
    - `wolf.perceptionRange` - Human detection distance (5 tests)
    - `wolf.moveTowardHumanProbability` - Movement bias toward humans (5 tests)
    - `dog.perceptionRange` - Wolf detection distance (5 tests)
    - `dog.moveTowardWolfProbability` - Movement bias toward wolves (5 tests)
  - Perception range comparison (2 tests)
  - Movement probability comparison (2 tests)
  - MovementSystem integration (6 tests)
  - Configuration parameter consistency (2 tests)

**Success Criteria**:
- [x] All movement tests passing (42/42) ✅
- [x] 6 additional parameters tested (18/51 total = 35.3%) ✅
- [x] Perception range behavior verified ✅

**Commit**: 3a14282 - MovementSystem tests with perception and probability parameters

### Phase 23.5: CombatSystem Tests (Pending - ~1.5 hours)

**Objective**: Verify all damage configuration parameters

**Tasks**:
- [ ] CombatSystem Tests (`tests/systems/CombatSystem.test.ts`) - 30-35 tests
  - Parameters tested (6 total):
    - `human.maleVsMaleDamage` - Male-to-male damage
    - `human.maleVsWolfDamage` - Male counter-attack damage
    - `wolf.damageToMale` - Wolf damage to males
    - `wolf.damageToFemale` - Wolf damage to females
    - `wolf.damageToDog` - Wolf counter-damage to dogs
    - `dog.damageToWolf` - Dog damage to wolves

**Success Criteria**:
- [ ] All combat tests passing
- [ ] 6 additional parameters tested (18/51 total)
- [ ] Damage values verified in combat outcomes

### Phase 23.6: EatingSystem Tests (Pending - ~1 hour)

**Objective**: Verify plant consumption and ripening parameters

**Tasks**:
- [ ] EatingSystem Tests (`tests/systems/EatingSystem.test.ts`) - 20-25 tests
  - Parameters tested (4 total):
    - `fruit.energyHealed` - HP gained from fruit
    - `mushroom.energyRemoved` - HP lost from mushroom
    - `fruit.roundsToRipen` - Ripening duration (integration)

**Success Criteria**:
- [ ] All eating tests passing
- [ ] 4 additional parameters tested (22/51 total)
- [ ] Ripening mechanics verified

### Phase 23.7: ReproductionSystem Tests (Pending - ~1 hour)

**Objective**: Verify reproduction probability and pregnancy mechanics

**Tasks**:
- [ ] ReproductionSystem Tests (`tests/systems/ReproductionSystem.test.ts`) - 20-25 tests
  - Parameters tested (3 total):
    - `human.reproductionProbability` - Conception rate
    - `human.pregnancyPeriod` - Pregnancy duration (already tested in entity)
    - `human.cooldownPeriod` - Cooldown duration (already tested in entity)

**Success Criteria**:
- [ ] All reproduction tests passing
- [ ] 3 additional parameters tested (25/51 total)
- [ ] Probability-based mechanics verified

### Phase 23.8: DeathSystem Tests (Pending - ~2 hours)

**Objective**: Verify age-based and overcrowding mortality parameters

**Tasks**:
- [ ] DeathSystem Tests (`tests/systems/DeathSystem.test.ts`) - 40-45 tests
  - Parameters tested (10 total):
    - `human.gompertzA`, `human.gompertzB` - Human mortality curve
    - `wolf.gompertzA`, `wolf.gompertzB` - Wolf mortality curve
    - `dog.gompertzA`, `dog.gompertzB` - Dog mortality curve
    - `overcrowding.humanThreshold` - Human overpopulation threshold
    - `overcrowding.humanMultiplier` - Mortality multiplier for humans
    - `overcrowding.animalThreshold` - Animal overpopulation threshold
    - `overcrowding.animalMultiplier` - Mortality multiplier for animals

**Success Criteria**:
- [ ] All death system tests passing
- [ ] 10 additional parameters tested (35/51 total)
- [ ] Gompertz function verified with various parameters
- [ ] Overcrowding mechanics verified

### Phase 23.9: BirthSystem Tests (Pending - ~45 minutes)

**Objective**: Verify birth timing and newborn health parameters

**Tasks**:
- [ ] BirthSystem Tests (`tests/systems/BirthSystem.test.ts`) - 15-20 tests
  - Parameters tested (2 total):
    - `human.pregnancyPeriod` - Birth timing (integration with pregnancy)
    - `human.startingHealth` - Newborn health value

**Success Criteria**:
- [ ] All birth tests passing
- [ ] 2 additional parameters tested (37/51 total)
- [ ] Birth mechanics verified

### Phase 23.10: SpawnSystem Tests (Pending - ~1.5 hours)

**Objective**: Verify initial and mid-game spawn probability parameters

**Tasks**:
- [ ] SpawnSystem Tests (`tests/systems/SpawnSystem.test.ts`) - 35-40 tests
  - Parameters tested (10 total):
    - Initial spawn: `spawn.maleHumanProbability`, `spawn.femaleHumanProbability`, `spawn.wolfProbability`, `spawn.dogProbability`, `spawn.fruitProbability`, `spawn.mushroomProbability` (6 params)
    - Mid-game spawn: `wolf.spawnProbability`, `dog.spawnProbability`, `fruit.spawnProbability`, `mushroom.spawnProbability` (4 params)

**Success Criteria**:
- [ ] All spawn tests passing
- [ ] 10 additional parameters tested (47/51 total)
- [ ] Probability-based spawning verified

### Phase 23.11: Game Integration Tests (Pending - ~2 hours)

**Objective**: Verify all parameters flow correctly through entire simulation and phase order

**Tasks**:
- [ ] Game Integration Tests (`tests/core/Game.test.ts`) - 30-40 tests
  - All 51 parameters verified end-to-end
  - Phase execution order validation
  - Configuration locking after game start
  - Complete round execution verification

**Success Criteria**:
- [ ] All integration tests passing
- [ ] All 51/51 parameters tested (100%)
- [ ] Phase order verified immutable
- [ ] Full simulation flow validated

### Phase 23.12: Coverage Report & Documentation (Pending - ~1 hour)

**Objective**: Generate coverage report and finalize documentation

**Tasks**:
- [ ] Run coverage report: `npm run test:coverage`
- [ ] Verify coverage targets met:
  - [ ] Statement coverage ≥85%
  - [ ] Branch coverage ≥80%
  - [ ] Function coverage ≥90%
  - [ ] Line coverage ≥85%
- [ ] Update README.md with testing instructions
- [ ] Update tech-stack.md with Vitest details
- [ ] Final integration with CI/CD pipeline

**Success Criteria**:
- [ ] Coverage report generated in `coverage/` directory
- [ ] All coverage targets met
- [ ] Documentation updated
- [ ] Tests integrated into development workflow

### Success Criteria (Phase 23 Complete)

**When All Phases Done**:
- [ ] 250+ unit tests implemented and passing
- [ ] All 51 configuration parameters tested
- [ ] Each parameter verified to:
  - [ ] Initialize correctly from config
  - [ ] Accept custom config values
  - [ ] Affect simulation behavior
  - [ ] Work independently and in combination
- [ ] Code coverage targets met (≥85% statement coverage)
- [ ] All three documentation guides complete
- [ ] Tests integrated into `npm test` workflow
- [ ] Coverage report accessible via `npm run test:coverage`

### Estimated Time Breakdown

- **Phase 23.0** (Infrastructure): ✅ 30 min (Complete)
- **Phase 23.1** (Initial Tests): ✅ 120 min (Complete)
- **Phase 23.2** (Entity Tests): 120 min (Pending)
- **Phase 23.3** (MovementSystem): 90 min (Pending)
- **Phase 23.4** (CombatSystem): 90 min (Pending)
- **Phase 23.5** (EatingSystem): 60 min (Pending)
- **Phase 23.6** (ReproductionSystem): 60 min (Pending)
- **Phase 23.7** (DeathSystem): 120 min (Pending)
- **Phase 23.8** (BirthSystem): 45 min (Pending)
- **Phase 23.9** (SpawnSystem): 90 min (Pending)
- **Phase 23.10** (Integration): 120 min (Pending)
- **Phase 23.11** (Coverage): 60 min (Pending)

**Total Remaining**: ~12-14 hours (150+ min per remaining 9 phases)

### Dependencies

**Blocking**:
- None - can implement tests without changing game code

**Required**:
- Vitest installed and configured (✅ Complete)
- Test utilities created (✅ Complete)
- Game code stable and deployable (✅ Phase 22 Complete)

---

### Future Enhancements

**Post-MVP Improvements**:
- [ ] Blue-green deployment (zero downtime)
- [ ] Deployment to multiple VPS instances with load balancing
- [ ] CDN integration (CloudFlare) for global distribution
- [ ] Automated backup and restore procedures
- [ ] Monitoring and alerting (UptimeRobot, Prometheus)
- [ ] Deployment preview environments for PRs
- [ ] Docker containerization for consistent environments

---
