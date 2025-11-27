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
- [ ] Wolf health decreases by configured damage, dogs health decreases by half of the configured damage
  - ⚠️ **INCOMPLETE**: Currently wolves don't counter-attack dogs at all. PRD US-019 requires wolves to deal half damage back to dogs. See Phase 5.7 for fix.
- [x] Statistics panel shows accurate dog count
- [x] All visual feedback working (emoji, border, flash)
- [x] No compilation or runtime errors
- [x] Ecosystem dynamics observable (three-tier predator system)

**Estimated Time**: 2-3 hours
**Actual Time**: 1 hour (implementation + testing)
**Blocking**: None - can be implemented independently
**PRD Alignment**: US-019, Sections 3.4.3-3.4.4, 3.7.7, 3.10.1

**Note**: Dog implementation is functionally complete except for wolf counter-attack behavior. This is a minor PRD compliance issue tracked in Phase 5.7.

## 🍄 Phase 5.6: Mushroom Implementation (CRITICAL - Missing from PoC)

**Status**: ❌ NOT STARTED
**Priority**: HIGH - Required for complete ecosystem balance
**Reference**: See detailed implementation plan below
**PRD Alignment**: US-029, Sections 3.5.6-3.5.9, 3.7.9, 3.10.1

### Background
Mushrooms are poisonous plants fully specified in PRD but completely missing from PoC implementation. Mushrooms complete the plant ecosystem alongside fruits, providing hazard-based learning about resource risks. Humans must balance fruit consumption (healing) with mushroom avoidance (damage).

### Foundation Tasks
- [ ] Add `MUSHROOM` to `EntityType` enum in `src/types.ts`
- [ ] Create `src/entities/Mushroom.ts` entity class
  - [ ] Extends Entity base class
  - [ ] Constructor: `Mushroom(x: number, y: number)`
  - [ ] Set `type = EntityType.MUSHROOM`
  - [ ] No ripening logic (always poisonous)
  - [ ] Health set to 1 for consistency
- [ ] Add `mushroom` configuration section to `src/config.ts`:
  - [ ] `energyRemoved: -40` (damage to human)
  - [ ] `spawnProbability: 0.005` (0.5% per empty cell per round)
- [ ] Add `mushroomProbability: 0.005` to spawn config section

### Plant Spawn System Updates
- [ ] Update `src/systems/PlantSpawnSystem.ts`:
  - [ ] Import Mushroom entity class
  - [ ] Add mushroom spawning logic alongside fruit spawning
  - [ ] Each empty cell: `spawnProbability` chance to spawn mushroom
  - [ ] Spawn new Mushroom entity at selected empty cells
  - [ ] Console logging: new mushrooms spawned per round

### Eating System Updates
- [ ] Update `src/systems/EatingSystem.ts`:
  - [ ] Import Mushroom entity class
  - [ ] Add mushroom poisoning logic:
    - [ ] Find humans adjacent to mushrooms
    - [ ] One random adjacent human eats mushroom
    - [ ] Human loses `energyRemoved` health (40 damage)
    - [ ] Remove mushroom from board
    - [ ] Add red visual effect flash at eating location
    - [ ] Console logging: mushroom poisoning events

### Renderer Integration
- [ ] Update `src/core/Renderer.ts:getEntityEmoji()`:
  - [ ] Add case for `EntityType.MUSHROOM` returning '🍄'
  - [ ] Mushrooms don't show injured border (plants don't have health)

### Statistics Display
- [ ] Update `index.html` statistics panel:
  - [ ] Add mushroom count stat row after fruits:
    ```html
    <div class="stat-row">
      <span class="stat-label">🍄 Mushrooms</span>
      <span class="stat-value" id="mushroomCount">0</span>
    </div>
    ```
- [ ] Update `src/main.ts:updateStatistics()`:
  - [ ] Add mushroom count calculation: `entities.filter(e => e.type === EntityType.MUSHROOM).length`
  - [ ] Update `#mushroomCount` element with calculated value

### Build & Testing
- [ ] Run `npm run build` and verify no TypeScript errors
- [ ] Test initialization: mushrooms spawn at ~0.5% (expect ~4-5 mushrooms on 30x30 board)
- [ ] Test visual: 🍄 emoji renders correctly
- [ ] Test poisoning: humans adjacent to mushrooms take 40 damage, mushroom removed
- [ ] Test statistics: mushroom count displays and updates correctly
- [ ] Test ecosystem: observe mushroom hazards affecting human survival

### Success Criteria
- [ ] Mushrooms spawn on board initialization (~4-5 on 30x30 board)
- [ ] Mushrooms poison adjacent humans (40 damage)
- [ ] Poisoned mushroom removed from board
- [ ] Statistics panel shows accurate mushroom count
- [ ] Red flash effect displays on poisoning
- [ ] No compilation or runtime errors
- [ ] Ecosystem dynamics observable (resource hazard learning)

**Estimated Time**: 2 hours
**Blocking**: None - can be implemented independently

## 🔧 Phase 5.7: PRD Corrections Implementation

**Status**: ❌ NOT STARTED
**Priority**: HIGH - Required for PRD compliance
**Reference**: Recent PRD updates requiring system changes

### Dog vs Wolf Counter-Attack (US-019)
- [ ] Update `src/systems/CombatSystem.ts` dog vs wolf combat:
  - [ ] Currently wolves don't counter-attack dogs at all
  - [ ] PRD US-019 requires: "Wolf health decreases by configured damage, dogs health decreases by half of the configured damage"
  - [ ] Add wolf counter-attack dealing half of `damageToWolf` back to dog
  - [ ] Console logging: show both damage values
  - [ ] Test: Verify both dog and wolf take damage in combat

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
1. ⚠️ All 7 system phases implemented and functional (6/7 complete - missing Mushrooms)
2. ❌ All 10 success criteria pass (pending PRD corrections and testing)
3. ❌ Performance target met (30+ FPS with 200+ creatures) - needs testing
4. ✅ All visual indicators working (flashes, borders, pregnancy)
5. ❌ Basic README.md with run instructions
6. ⚠️ No critical bugs blocking simulation (one PRD compliance issue: wolf counter-attack)

## 📊 Current Implementation Status (as of latest review)

### Completed Phases:
- ✅ **Phases 1-4**: Core Systems (Board, Entities, All 7 system phases)
- ✅ **Phase 5**: Plant System (Fruits with ripening and consumption)
- ✅ **Phase 5.5**: Dog Implementation (functionally complete, one PRD issue)
- ✅ **Phase 6**: Visual Polish (pregnancy indicator, fruit ripening, all effects, FPS counter)

### In Progress / Not Started:
- ❌ **Phase 5.6**: Mushroom Implementation (NOT STARTED - HIGH PRIORITY)
- ❌ **Phase 5.7**: PRD Corrections (NOT STARTED - includes wolf counter-attack, eating logic, birth edge case, male combat energy transfer)
- ❌ **Phase 7**: UI/UX Enhancements (NOT STARTED - button consolidation, reset functionality)
- 🔶 **Phase 8**: Performance Optimization (PARTIAL - dirty rectangles ✅, emoji caching ✅, testing needed)
- ❌ **Testing & Validation**: Edge cases, performance benchmarks
- ❌ **Documentation**: README.md, code comments

## 📋 Post-MVP Enhancements (Future)

Items deferred beyond MVP scope:
- [ ] Configurable simulation speed slider
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

**Estimated Remaining Work**: ~8-12 hours for MVP completion
**Priority Order**:
1. Phase 5.6 (Mushroom Implementation) - 2 hours
2. Phase 5.7 (PRD Corrections) - 2-3 hours
3. Phase 7 (UI/UX - Reset button) - 1 hour
4. Phase 8 (Performance Testing) - 1-2 hours
5. Testing & Validation - 2-3 hours
6. Documentation (README.md) - 1 hour
