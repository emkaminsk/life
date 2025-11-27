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

## 🎮 Phase 7: UI/UX Enhancements

**Status**: ⚠️ PARTIAL - Reset button complete, button consolidation deferred

### Button Consolidation (DEFERRED - Not required for MVP)
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
- ❌ **Phase 12**: Configuration UI (NOT STARTED - **CRITICAL MVP BLOCKER**)
- ✅ **Phase 13**: Speed Control & Additional UI Controls (COMPLETE - speed selector, finish button, all keyboard shortcuts)
- ✅ **Phase 14**: Overcrowding Death System (COMPLETE - death multiplier with thresholds)
- ✅ **Phase 15**: Large Board Initialization Progress (COMPLETE - async progress indicator)
- ✅ **Phase 5.7**: PRD Corrections (COMPLETE - all 4 corrections implemented)
  - ✅ Dog vs Wolf counter-attack
  - ✅ Eating logic (only injured humans eat)
  - ✅ Birth edge case (mother dies if no space)
  - ✅ Male combat energy transfer
- 🔶 **Phase 8**: Performance Optimization (PARTIAL - dirty rectangles ✅, emoji caching ✅, testing needed)
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

**Status**: ❌ NOT STARTED
**Priority**: CRITICAL - **BLOCKING MVP COMPLETION**
**Reference**: PRD Sections 3.7.1-3.7.17, User Stories US-007, US-008, US-024, US-030, US-033, US-038

### Background
The configuration UI is **completely missing** from the current implementation. Parameters are hardcoded in `config.ts` with no way for users to modify them between games. This violates the core requirement: "allow users to modify parameters between games (so that new game is run on current set of parameters defined in UI)".

The PRD extensively documents a configuration panel system, but it's not implemented and was missing from the TODO entirely.

### Configuration Panel Structure
- [x] Modal overlay design (displays before game starts or after game finishes)
- [ ] Create `src/ui/ConfigPanel.ts` module
- [ ] Implement panel visibility state management:
  - [ ] Show on application load (before first game)
  - [ ] Show after "Finish Game" clicked
  - [ ] Hide when "Start Game" clicked
  - [ ] Lock/disable during active simulation

### Configuration Sections (Collapsible)
- [ ] **Board Setup Section**:
  - [ ] Width input (10-100, default 30)
  - [ ] Height input (10-100, default 30)
  - [ ] Injured threshold input (0-100, default 50)
  - [ ] Male human spawn probability (0-1, default 0.15)
  - [ ] Female human spawn probability (0-1, default 0.15)
  - [ ] Wolf spawn probability (0-1, default 0.05)
  - [ ] Dog spawn probability (0-1, default 0.03)
  - [ ] Fruit spawn probability (0-1, default 0.10)
  - [ ] Mushroom spawn probability (0-1, default 0.01)

- [ ] **Human Configuration Section**:
  - [ ] Starting health (1-200, default 100)
  - [ ] Male vs male damage (1-100, default 20)
  - [ ] Male vs wolf damage (1-100, default 25)
  - [ ] Reproduction probability (0-1, default 0.3)
  - [ ] Pregnancy period rounds (1-20, default 3)
  - [ ] Cooldown period rounds (0-20, default 2)
  - [ ] Perception range (1-15, default 5)
  - [ ] Move toward fruit probability (0-1, default 0.7)
  - [ ] Gompertz A (0.0001-0.01, default 0.0001)
  - [ ] Gompertz B (0.01-0.5, default 0.1)

- [ ] **Wolf Configuration Section**:
  - [ ] Starting health (1-200, default 80)
  - [ ] Damage to human (1-100, default 30)
  - [ ] Perception range (1-15, default 7)
  - [ ] Move toward human probability (0-1, default 0.8)
  - [ ] Gompertz A (0.0001-0.01, default 0.0002)
  - [ ] Gompertz B (0.01-0.5, default 0.12)

- [ ] **Dog Configuration Section**:
  - [ ] Starting health (1-200, default 70)
  - [ ] Damage to wolf (1-100, default 35)
  - [ ] Perception range (1-15, default 6)
  - [ ] Move toward wolf probability (0-1, default 0.75)
  - [ ] Gompertz A (0.0001-0.01, default 0.00015)
  - [ ] Gompertz B (0.01-0.5, default 0.11)

- [ ] **Plant Configuration Section**:
  - [ ] Fruit energy healed (1-100, default 30)
  - [ ] Fruit spawn probability per round (0-0.1, default 0.01)
  - [ ] Rounds to ripen (0-10, default 2)
  - [ ] Mushroom energy removed (1-100, default 40)
  - [ ] Mushroom spawn probability per round (0-0.1, default 0.005)

- [ ] **Population Control Section**:
  - [ ] Human overcrowding threshold (10-1000, default 100)
  - [ ] Human overcrowding multiplier (1-10, default 2)
  - [ ] Animal overcrowding threshold (10-1000, default 50)
  - [ ] Animal overcrowding multiplier (1-10, default 2)

### UI Components
- [ ] Input field component with validation
- [ ] Tooltip system for parameter descriptions
- [ ] Collapsible section component
- [ ] Visual error indicators (red borders for invalid values)
- [ ] Real-time spawn probability validation
- [ ] Expected creature count calculator

### Validation System
- [ ] Real-time numeric range validation
- [ ] Spawn probability sum validation (≤ 100%)
- [ ] Warning at 90% total spawn probability
- [ ] Display "Expected starting creatures: ~X"
- [ ] Disable "Start Game" when validation fails
- [ ] Clear error messages with tooltips

### Control Buttons
- [ ] "Reset to Defaults" button
  - [ ] Restore all parameters to DEFAULT_CONFIG values
  - [ ] Visual confirmation of reset
- [ ] "Start Game" button
  - [ ] Apply configuration to game
  - [ ] Hide configuration panel
  - [ ] Initialize game with custom config
  - [ ] Enable/disable based on validation state

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
