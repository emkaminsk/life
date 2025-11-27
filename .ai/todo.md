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

## 🔧 Phase 5.7: PRD Corrections Implementation

**Status**: ⚠️ PARTIAL - 1 of 4 items complete
**Priority**: HIGH - Required for PRD compliance
**Reference**: Recent PRD updates requiring system changes

### Dog vs Wolf Counter-Attack (US-019) ✅ COMPLETE
- [x] Update `src/systems/CombatSystem.ts` dog vs wolf combat:
  - [x] Currently wolves don't counter-attack dogs at all
  - [x] PRD US-019 requires: "Wolf health decreases by configured damage, dogs health decreases by half of the configured damage"
  - [x] Add wolf counter-attack dealing half of `damageToWolf` back to dog
  - [x] Console logging: show both damage values
  - [x] Test: Verify both dog and wolf take damage in combat

### Eating System Correction (PRD 3.5.4)
- [ ] Update `src/systems/EatingSystem.ts`:
  - [ ] Change fruit eating logic from "first adjacent ripe fruit" to "one random human with health < max"
  - [ ] Find all ripe fruits and humans with health < startingHealth
  - [ ] For each ripe fruit, select one random eligible human from adjacent humans
  - [ ] If no eligible humans adjacent, fruit remains uneaten
  - [ ] Console logging: specify which human ate which fruit

### Birth System Correction (US-026)
- [ ] Update `src/systems/BirthSystem.ts`:
  - [ ] When pregnant woman ready to give birth but no empty adjacent spaces:
    - [ ] Spawn baby on mother's position instead of adjacent space
    - [ ] Remove mother entity (dies after birth)
    - [ ] Add birth visual effect on mother's position
    - [ ] Console logging: "Mother died giving birth, baby occupies her position"
  - [ ] Test: Verify mother death and baby placement when no space available

### Combat System Correction (US-018)
- [ ] Update `src/systems/CombatSystem.ts` `resolveCombat()` for male vs male:
  - [ ] Store original health of both males before damage
  - [ ] Apply simultaneous damage to both
  - [ ] Check post-damage health:
    - [ ] If one male health ≤ 0: he dies, survivor gains his remaining energy
    - [ ] If both males health ≤ 0: compare final health, lower health dies, survivor gains remaining energy
    - [ ] If health equal when both ≤ 0: random selection, survivor gains remaining energy
  - [ ] Console logging: show damage dealt and energy transfer

### Testing Corrections
- [ ] Test dog vs wolf: verify both take damage (wolf full, dog half)
- [ ] Test updated eating: verify only humans with health < 100 eat fruits
- [ ] Test birth death: pregnant woman dies when no adjacent space, baby occupies her position
- [ ] Test male combat: verify energy transfer mechanics work correctly
- [ ] Integration test: run simulation with all corrections active

**Estimated Time**: 2-3 hours
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
- ❌ **Phase 9**: Notification System (NOT STARTED - extinction alerts, capacity warnings)
- ❌ **Phase 10**: Population Graph (NOT STARTED - **REQUIRED FOR MVP** per PRD 4.1)
- ❌ **Phase 11**: Rules Reference Modal (NOT STARTED - "?" button with documentation)
- ❌ **Phase 12**: Configuration UI (NOT STARTED - **CRITICAL MVP BLOCKER**)
- ❌ **Phase 13**: Speed Control & Additional UI Controls (NOT STARTED - speed slider, finish button, keyboard shortcuts)
- ❌ **Phase 14**: Overcrowding Death System (NOT STARTED - death multiplier implementation)
- ❌ **Phase 15**: Large Board Initialization Progress (NOT STARTED - progress indicator)
- ⚠️ **Phase 5.7**: PRD Corrections (PARTIAL - 1 of 4 complete)
  - ✅ Dog vs Wolf counter-attack
  - ❌ Eating logic (only injured humans eat)
  - ❌ Birth edge case (mother dies if no space)
  - ❌ Male combat energy transfer
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

## 📊 Phase 10: Population Graph (MISSING MVP FEATURE)

**Status**: ❌ NOT STARTED
**Priority**: HIGH - **Required for MVP** (listed in PRD Section 4.1 In Scope)
**Reference**: PRD Sections 3.10.2-3.10.3, User Story US-016

### Background
PRD Section 4.1 explicitly lists "Statistics panel with population graph" as in-scope for MVP. The graph is critical for students to observe long-term population trends and understand predator-prey dynamics.

### Graph Requirements
- [ ] Line graph in statistics panel showing human population over time
- [ ] X-axis: Rounds elapsed
- [ ] Y-axis: Total human population (males + females)
- [ ] Real-time updates as simulation progresses
- [ ] Maintain full history from game start
- [ ] Auto-scaling to data range
- [ ] Clear axis labels and readable design

### Implementation Options
- [ ] Option A: Canvas-based graph (consistent with game rendering)
- [ ] Option B: SVG-based graph (cleaner scaling)
- [ ] Option C: Simple HTML/CSS bar chart (minimal complexity)

### Technical Tasks
- [ ] Add population history array to Game class
- [ ] Record population each round
- [ ] Create graph rendering function
- [ ] Add graph container to statistics panel HTML
- [ ] Update graph rendering in UI update loop
- [ ] Clear history on game reset

**Estimated Time**: 3-4 hours
**PRD Alignment**: PRD 3.10.2-3.10.3, 4.1, US-016

---

## ❓ Phase 11: Rules Reference Modal (MISSING MVP FEATURE)

**Status**: ❌ NOT STARTED
**Priority**: MEDIUM-HIGH - Required for MVP
**Reference**: PRD Section 3.11, User Story US-017

### Background
The PRD specifies a comprehensive rules reference system with "?" button. This is critical for educational use - students need to reference game mechanics without stopping simulation.

### Modal Structure (US-017)
- [ ] Add "?" button to top-right corner of header
- [ ] Create modal overlay component
- [ ] Implement tabbed sections:
  - [ ] **Game Rules** tab: Priority order prominently displayed
  - [ ] **Creature Types** tab: Qualitative descriptions (e.g., "Wolves hunt humans")
  - [ ] **Plant Types** tab: Fruit and mushroom mechanics
  - [ ] **Controls** tab: All keyboard shortcuts documented

### Content Requirements
- [ ] Document 7-phase priority order clearly
- [ ] Describe each creature type behavior
- [ ] Explain fruit ripening and mushroom poisoning
- [ ] List all keyboard shortcuts
- [ ] Use student-friendly language (ages 11-15)

### Interaction
- [ ] Modal closeable by clicking outside
- [ ] Modal closeable by pressing Escape key
- [ ] Modal closeable by clicking close button
- [ ] Simulation continues while modal open
- [ ] Tab switching functionality

### Implementation
- [ ] Add "?" button to index.html header
- [ ] Create modal HTML structure
- [ ] CSS for modal overlay and tabs
- [ ] JavaScript for show/hide/tab switching
- [ ] Escape key handler

**Estimated Time**: 3-4 hours
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

## ⚡ Phase 13: Speed Control & Additional UI Controls (MISSING MVP FEATURES)

**Status**: ❌ NOT STARTED
**Priority**: MEDIUM-HIGH - Required for MVP
**Reference**: PRD Sections 3.8.5-3.8.7, User Stories US-005, US-020, US-023

### Background
Several UI controls specified in PRD are missing from implementation:
1. **Speed Slider** - Currently in "Post-MVP" but PRD 3.8.6 and US-005 explicitly require it for MVP
2. **Finish Game Button** - PRD 3.8.5 requires this to end simulation and return to config
3. **Keyboard Shortcuts** - Only Space is implemented; missing 4 additional shortcuts

### Speed Control Slider (US-005)
- [ ] Add speed slider to controls panel
- [ ] Three speed settings:
  - [ ] Slow: 500ms per round
  - [ ] Medium: 200ms per round (current default)
  - [ ] Fast: 50ms per round
- [ ] Speed changes take effect immediately during continuous execution
- [ ] Speed setting persists when pausing and resuming
- [ ] Update game loop to use selected speed

### Finish Game Button (US-023)
- [ ] Add "Finish Game" button to controls panel
- [ ] Clicking stops simulation immediately
- [ ] Returns to configuration panel (Phase 12 dependency)
- [ ] Previous configuration values retained (US-033)
- [ ] Statistics reset to zero
- [ ] Graph cleared (Phase 10 dependency)
- [ ] Board cleared
- [ ] "Start Game" re-enabled for new simulation

### Complete Keyboard Shortcuts (US-020, PRD 3.8.7)
Currently implemented:
- [x] Space: Pause/play toggle

Missing shortcuts:
- [ ] Right arrow: Advance 1 round when paused
- [ ] Up arrow: Advance 5 rounds when paused
- [ ] Down arrow: Pause continuous simulation
- [ ] Left arrow: Pause continuous simulation
- [ ] Prevent shortcuts when input fields focused
- [ ] Document all shortcuts in rules modal (Phase 11)

### Implementation
- [ ] Add speed slider HTML input
- [ ] Add "Finish Game" button to HTML
- [ ] Implement speed change handler
- [ ] Implement finish game handler
- [ ] Add keyboard event listeners for arrow keys
- [ ] Update Game class to accept speed parameter
- [ ] Test all keyboard shortcuts work correctly

**Estimated Time**: 2-3 hours
**PRD Alignment**: PRD 3.8.5-3.8.7, US-005, US-020, US-023

---

## 🎲 Phase 14: Overcrowding Death System (MISSING MVP FEATURE)

**Status**: ❌ NOT STARTED
**Priority**: MEDIUM - Required for MVP
**Reference**: PRD Section 3.2.7, User Story US-014

### Background
PRD 3.2.7 specifies: "When population exceeds overcrowding threshold, death probability multiplied by configured overcrowding multiplier". The overcrowding parameters exist in config.ts but are NOT implemented in DeathSystem.

### Current Implementation Gap
- ✅ Overcrowding config parameters added to config.ts
- ❌ DeathSystem does NOT check population thresholds
- ❌ DeathSystem does NOT apply multiplier to death probability

### Implementation Requirements
- [ ] Track total human count each round
- [ ] Track total animal count (wolves + dogs) each round
- [ ] In DeathSystem.execute():
  - [ ] Check if humanCount > config.overcrowding.humanThreshold
  - [ ] Check if animalCount > config.overcrowding.animalThreshold
  - [ ] Apply multiplier to Gompertz death probability for affected populations
  - [ ] Console log overcrowding status when active

### Gompertz Multiplier Logic
- [ ] Modify Gompertz.shouldDie() to accept optional multiplier parameter
- [ ] Current: `P(death) = 1 - e^(-A × e^(B × age))`
- [ ] With overcrowding: `P(death) = 1 - e^(-A × multiplier × e^(B × age))`
- [ ] OR: Calculate base probability, then multiply result by overcrowding multiplier

### Testing
- [ ] Set low thresholds (e.g., 20 humans)
- [ ] Observe increased death rate when threshold exceeded
- [ ] Verify console logging shows overcrowding active
- [ ] Verify death rate returns to normal when population drops

**Estimated Time**: 2-3 hours
**PRD Alignment**: PRD 3.2.7, US-014

---

## 🔄 Phase 15: Large Board Initialization Progress (MISSING MVP FEATURE)

**Status**: ❌ NOT STARTED
**Priority**: LOW-MEDIUM - Required for MVP (large boards only)
**Reference**: PRD Sections 3.13.1-3.13.2, User Story US-029

### Background
PRD 3.13.1-3.13.2 specifies progress indicators for boards >50x50 to prevent browser appearing frozen during initialization.

### Requirements
- [ ] Detect when board dimensions > 50x50
- [ ] Display "Initializing game..." message overlay
- [ ] Show progress indicator: "Spawning creatures: X%"
- [ ] Update progress at least every 10% increment
- [ ] Ensure initialization doesn't freeze browser (use async if needed)
- [ ] Hide message when initialization complete
- [ ] Simulation starts automatically after initialization

### Implementation
- [ ] Add initialization overlay HTML/CSS
- [ ] Modify Game.initializeBoard() to accept progress callback
- [ ] Calculate total cells and report progress
- [ ] Use requestAnimationFrame or setTimeout for async initialization
- [ ] Test with 100x100 board

**Estimated Time**: 2-3 hours
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

**Estimated Remaining Work**: ~30-40 hours for full MVP completion

**Priority Order** (Revised based on PRD requirements):

**CRITICAL PATH (Must complete for MVP):**
1. **Phase 12: Configuration UI** - 8-12 hours (BLOCKER - required for parameter modification)
2. **Phase 10: Population Graph** - 3-4 hours (Explicitly listed in PRD 4.1 In Scope)
3. **Phase 13: Speed Control & UI Controls** - 2-3 hours (Speed slider + Finish Game button + keyboard shortcuts)

**HIGH PRIORITY (MVP features):**
4. **Phase 9: Notification System** - 2-3 hours (Extinction alerts + capacity warnings)
5. **Phase 11: Rules Reference Modal** - 3-4 hours (Educational requirement)
6. **Phase 14: Overcrowding Death System** - 2-3 hours (Game mechanic specified in PRD)

**MEDIUM PRIORITY (MVP features):**
7. **Phase 15: Large Board Initialization** - 2-3 hours (UX for large boards)
8. **Phase 5.7: PRD Corrections** - 2-3 hours (Optional refinements)
9. **Phase 8: Performance Testing** - 1-2 hours (Validation)

**FINAL:**
10. **Testing & Validation** - 2-3 hours (Integration testing)

**Current MVP Status**: Core game mechanics complete, but **7 MAJOR MVP FEATURES ARE MISSING**:
1. ❌ Configuration UI (CRITICAL)
2. ❌ Population Graph (Required per PRD 4.1)
3. ❌ Rules Reference Modal
4. ❌ Speed Control Slider
5. ❌ Finish Game Button
6. ❌ Complete Keyboard Shortcuts
7. ❌ Notification System
8. ❌ Overcrowding System Implementation

Users currently cannot modify parameters between games, cannot see population trends, cannot reference rules, and missing several core UI controls specified in PRD.
