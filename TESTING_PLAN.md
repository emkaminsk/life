# Game of Life Unit Testing Plan

## Overview

This document outlines the comprehensive unit testing strategy for the Game of Life MVP. The focus is on verifying that each parameter accessible via the ConfigPanel dialog is correctly passed through the simulation systems and actually affects game behavior.

**Total Parameters to Test**: 51 configuration parameters across 10 domains
**Test Phases**: 14 phases covering infrastructure, entity systems, simulation systems, and integration

---

## Phase 1: Testing Infrastructure Setup

### Objective
Establish testing framework and utilities for all subsequent tests.

### Tasks
- [ ] Install and configure Vitest as test runner
- [ ] Install @testing-library utilities for test helpers
- [ ] Create `tests/` directory structure
- [ ] Create `tests/setup.ts` with test utilities:
  - Random seed management for reproducible tests
  - Board factory for test board creation
  - Entity factory for test entity creation
  - Configuration factory with parameter overrides

### Files to Create
- `tests/setup.ts` - Global test setup and utilities
- `vitest.config.ts` - Vitest configuration
- `tests/factories/` - Factory functions for test data

---

## Phase 2: Board Class Tests (`tests/core/Board.test.ts`)

### Configuration Parameters Tested
None (Board doesn't use config parameters directly)

### Test Cases
- [x] **Initialization**: Board creates correctly sized grid (width × height)
- [x] **Empty State**: All cells initially empty
- [x] **Entity Placement**: Can place entity at specific coordinate
- [x] **Entity Retrieval**: Can retrieve entity from coordinate
- [x] **Entity Removal**: Can remove entity from board
- [x] **Adjacent Cell Detection**: Correctly identifies adjacent cells
- [x] **Out of Bounds**: Handles coordinates outside grid properly
- [x] **Cell Iteration**: Iterates through all cells in correct order
- [x] **Spatial Queries**: Finds cells within distance radius

### Files to Create
- `tests/core/Board.test.ts`

---

## Phase 3: Entity Base Class Tests (`tests/entities/Entity.test.ts`)

### Configuration Parameters Tested
None (Base class tests foundational behavior)

### Test Cases
- [x] **Initialization**: Entity created with correct initial properties
- [x] **Health Tracking**: Health decreases with damage
- [x] **Age Advancement**: Age increments each round
- [x] **Position Management**: Position updates correctly
- [x] **Type Assignment**: Entity type set correctly for all subclasses

### Files to Create
- `tests/entities/Entity.test.ts`

---

## Phase 4: Human Entity Tests (`tests/entities/Human.test.ts`)

### Configuration Parameters Tested
- `human.startingHealth` - Initial health value
- `human.pregnancyPeriod` - Pregnancy duration
- `human.cooldownPeriod` - Cooldown after birth

### Test Cases
- [x] **Initialization**: Human created with correct starting health from config
- [x] **Sex Assignment**: Male and Female humans created correctly
- [x] **Pregnancy Tracking**: Female can become pregnant
- [x] **Pregnancy Duration**: Pregnancy lasts exactly `pregnancyPeriod` rounds
- [x] **Cooldown Tracking**: Cooldown after birth lasts exactly `cooldownPeriod` rounds
- [x] **Cooldown Prevents Pregnancy**: Female in cooldown cannot get pregnant

### Files to Create
- `tests/entities/Human.test.ts`

---

## Phase 5: Wolf Entity Tests (`tests/entities/Wolf.test.ts`)

### Configuration Parameters Tested
- `wolf.startingHealth` - Initial health value
- `wolf.spawnProbability` - Used in spawn tests

### Test Cases
- [x] **Initialization**: Wolf created with correct starting health from config
- [x] **Health Management**: Wolf health decreases with damage
- [x] **Predator Type**: Wolf correctly identified as predator

### Files to Create
- `tests/entities/Wolf.test.ts`

---

## Phase 6: Dog Entity Tests (`tests/entities/Dog.test.ts`)

### Configuration Parameters Tested
- `dog.startingHealth` - Initial health value
- `dog.spawnProbability` - Used in spawn tests

### Test Cases
- [x] **Initialization**: Dog created with correct starting health from config
- [x] **Health Management**: Dog health decreases with damage
- [x] **Hunter Type**: Dog correctly identified as wolf hunter

### Files to Create
- `tests/entities/Dog.test.ts`

---

## Phase 7: Fruit & Mushroom Entity Tests (`tests/entities/Plant.test.ts`)

### Configuration Parameters Tested
- `fruit.roundsToRipen` - Ripening duration
- `fruit.spawnProbability` - Used in spawn tests
- `mushroom.spawnProbability` - Used in spawn tests

### Test Cases
- **Fruit Tests**:
  - [x] **Initialization**: Fruit created in unripe state
  - [x] **Ripening Duration**: Fruit ripens after exactly `roundsToRipen` rounds
  - [x] **Ripe State**: Fruit correctly marked as ripe after ripening
  - [x] **Unripe Consumption**: Humans cannot consume unripe fruit

- **Mushroom Tests**:
  - [x] **Initialization**: Mushroom created correctly
  - [x] **Poison State**: Mushroom always considered poisonous

### Files to Create
- `tests/entities/Plant.test.ts`

---

## Phase 8: MovementSystem Tests (`tests/systems/MovementSystem.test.ts`)

### Configuration Parameters Tested
- `human.perceptionRange` - How far humans see fruit
- `human.moveTowardFruitProbability` - Probability of moving toward detected fruit
- `wolf.perceptionRange` - How far wolves see humans
- `wolf.moveTowardHumanProbability` - Probability of moving toward detected humans
- `dog.perceptionRange` - How far dogs see wolves
- `dog.moveTowardWolfProbability` - Probability of moving toward detected wolves

### Test Cases
- **Human Movement**:
  - [x] **Perception Range**: Fruit outside range not detected
  - [x] **Target Detection**: Fruit inside range correctly detected
  - [x] **Targeted Movement**: `moveTowardFruitProbability` affects movement direction
  - [x] **Random Movement**: Without target, movement is random

- **Wolf Movement**:
  - [x] **Perception Range**: Humans outside range not detected
  - [x] **Target Detection**: Humans inside range correctly detected
  - [x] **Targeted Movement**: `moveTowardHumanProbability` affects movement direction

- **Dog Movement**:
  - [x] **Perception Range**: Wolves outside range not detected
  - [x] **Target Detection**: Wolves inside range correctly detected
  - [x] **Targeted Movement**: `moveTowardWolfProbability` affects movement direction

### Files to Create
- `tests/systems/MovementSystem.test.ts`

---

## Phase 9: CombatSystem Tests (`tests/systems/CombatSystem.test.ts`)

### Configuration Parameters Tested
- `human.maleVsMaleDamage` - Damage male humans deal to each other
- `human.maleVsWolfDamage` - Counter-damage males deal to wolves
- `wolf.damageToMale` - Damage wolves deal to male humans
- `wolf.damageToFemale` - Damage wolves deal to female humans
- `wolf.damageToDog` - Counter-damage wolves deal to dogs
- `dog.damageToWolf` - Damage dogs deal to wolves

### Test Cases
- **Male vs Male Combat**:
  - [x] **Damage Applied**: Adjacent male combats deal exactly `maleVsMaleDamage` HP
  - [x] **Mutual Damage**: Both males damaged in combat

- **Wolf vs Human Combat**:
  - [x] **Damage to Male**: Wolves deal exactly `damageToMale` to male humans
  - [x] **Damage to Female**: Wolves deal exactly `damageToFemale` to female humans
  - [x] **Counter-Damage**: Males deal exactly `maleVsWolfDamage` counter-damage
  - [x] **No Counter**: Females deal no counter-damage

- **Dog vs Wolf Combat**:
  - [x] **Damage to Wolf**: Dogs deal exactly `damageToWolf` to wolves
  - [x] **Counter-Damage**: Wolves deal exactly `damageToDog` counter-damage

### Files to Create
- `tests/systems/CombatSystem.test.ts`

---

## Phase 10: EatingSystem Tests (`tests/systems/EatingSystem.test.ts`)

### Configuration Parameters Tested
- `fruit.energyHealed` - HP gained from eating fruit
- `mushroom.energyRemoved` - HP lost from eating mushroom
- `fruit.roundsToRipen` - Only ripe fruit can be eaten

### Test Cases
- **Fruit Consumption**:
  - [x] **Adjacent Consumption**: Only adjacent humans can eat fruit
  - [x] **Ripe Only**: Unripe fruit cannot be consumed
  - [x] **Health Healing**: Human gains exactly `energyHealed` HP
  - [x] **Health Cap**: Health doesn't exceed species maximum
  - [x] **Fruit Removal**: Consumed fruit removed from board

- **Mushroom Consumption**:
  - [x] **Adjacent Consumption**: Only adjacent humans can eat mushroom
  - [x] **Health Damage**: Human loses exactly `energyRemoved` HP
  - [x] **Mushroom Removal**: Consumed mushroom removed from board
  - [x] **Instant Effect**: Damage applied immediately

### Files to Create
- `tests/systems/EatingSystem.test.ts`

---

## Phase 11: ReproductionSystem Tests (`tests/systems/ReproductionSystem.test.ts`)

### Configuration Parameters Tested
- `human.reproductionProbability` - Chance of pregnancy initiation per adjacent pair
- `human.pregnancyPeriod` - Duration of pregnancy
- `human.cooldownPeriod` - Duration of post-birth cooldown

### Test Cases
- **Pregnancy Initiation**:
  - [x] **Probability Application**: `reproductionProbability` affects conception rate
  - [x] **Adjacent Requirement**: Only adjacent males and females can reproduce
  - [x] **Sex Requirement**: Requires male + female pair
  - [x] **Cooldown Prevention**: Females in cooldown cannot conceive

- **Pregnancy Management**:
  - [x] **Pregnancy Duration**: Pregnancy lasts exactly `pregnancyPeriod` rounds
  - [x] **Status Tracking**: Female correctly marked as pregnant

- **Cooldown Management**:
  - [x] **Cooldown Duration**: Cooldown lasts exactly `cooldownPeriod` rounds
  - [x] **Prevents Conception**: Females in cooldown cannot conceive

### Files to Create
- `tests/systems/ReproductionSystem.test.ts`

---

## Phase 12: DeathSystem Tests (`tests/systems/DeathSystem.test.ts`)

### Configuration Parameters Tested
- `human.gompertzA` - Gompertz mortality parameter A (base rate)
- `human.gompertzB` - Gompertz mortality parameter B (acceleration)
- `wolf.gompertzA` - Gompertz mortality parameter A (base rate)
- `wolf.gompertzB` - Gompertz mortality parameter B (acceleration)
- `dog.gompertzA` - Gompertz mortality parameter A (base rate)
- `dog.gompertzB` - Gompertz mortality parameter B (acceleration)
- `overcrowding.humanThreshold` - Population threshold for humans
- `overcrowding.humanMultiplier` - Death probability multiplier for humans
- `overcrowding.animalThreshold` - Population threshold for animals
- `overcrowding.animalMultiplier` - Death probability multiplier for animals

### Test Cases
- **Health-Based Death**:
  - [x] **Instant Death**: Entities with health ≤ 0 die immediately
  - [x] **Health Preservation**: Healthy entities don't die from health alone

- **Age-Based Death (Gompertz)**:
  - [x] **Gompertz A Effect**: Higher `gompertzA` increases mortality rate
  - [x] **Gompertz B Effect**: Higher `gompertzB` increases age-acceleration
  - [x] **Age Progression**: Older entities have higher death probability
  - [x] **Parameter Independence**: Different species use their own parameters

- **Overcrowding Effects**:
  - [x] **Human Threshold**: Death rate increases when humans > `humanThreshold`
  - [x] **Human Multiplier**: Mortality multiplied by `humanMultiplier` when overcrowded
  - [x] **Animal Threshold**: Death rate increases when animals > `animalThreshold`
  - [x] **Animal Multiplier**: Mortality multiplied by `animalMultiplier` when overcrowded
  - [x] **No Threshold Effect**: Normal mortality when under thresholds

### Files to Create
- `tests/systems/DeathSystem.test.ts`

---

## Phase 13: BirthSystem & SpawnSystem Tests

### Phase 13a: BirthSystem (`tests/systems/BirthSystem.test.ts`)

**Configuration Parameters Tested**
- `human.pregnancyPeriod` - Birth occurs after this duration
- Newborn inherits configuration-driven starting health

**Test Cases**
- [x] **Birth Timing**: Baby born after exactly `pregnancyPeriod` rounds
- [x] **Baby Placement**: Baby placed on board at birth location
- [x] **Starting Health**: Newborn human has correct starting health
- [x] **Sex Assignment**: Newborns randomly assigned male/female
- [x] **Cooldown Application**: Mother receives cooldown period after birth

### Phase 13b: SpawnSystem (`tests/systems/SpawnSystem.test.ts`)

**Configuration Parameters Tested**
- `spawn.maleHumanProbability` - Initial male human spawn rate
- `spawn.femaleHumanProbability` - Initial female human spawn rate
- `spawn.wolfProbability` - Initial wolf spawn rate
- `spawn.dogProbability` - Initial dog spawn rate
- `spawn.fruitProbability` - Initial fruit spawn rate
- `spawn.mushroomProbability` - Initial mushroom spawn rate
- `wolf.spawnProbability` - Wolf spawning during game
- `dog.spawnProbability` - Dog spawning during game
- `fruit.spawnProbability` - Fruit spawning during game
- `mushroom.spawnProbability` - Mushroom spawning during game

**Test Cases**
- **Initial Spawn** (via `Game.initializeBoard()`):
  - [x] **Male Humans**: Spawn rate matches `maleHumanProbability`
  - [x] **Female Humans**: Spawn rate matches `femaleHumanProbability`
  - [x] **Wolves**: Spawn rate matches `wolfProbability`
  - [x] **Dogs**: Spawn rate matches `dogProbability`
  - [x] **Fruits**: Spawn rate matches `fruitProbability`
  - [x] **Mushrooms**: Spawn rate matches `mushroomProbability`

- **Mid-Game Spawn** (via `SpawnSystem.process()`):
  - [x] **Wolf Spawn**: New wolves spawn at rate `wolf.spawnProbability`
  - [x] **Dog Spawn**: New dogs spawn at rate `dog.spawnProbability`
  - [x] **Fruit Spawn**: New fruits spawn at rate `fruit.spawnProbability`
  - [x] **Mushroom Spawn**: New mushrooms spawn at rate `mushroom.spawnProbability`
  - [x] **Empty Cell Requirement**: Spawns only on empty cells

### Files to Create
- `tests/systems/BirthSystem.test.ts`
- `tests/systems/SpawnSystem.test.ts`

---

## Phase 14: Game Integration Tests (`tests/core/Game.test.ts`)

### Configuration Parameters Tested
- All 51 parameters in integrated flow

### Test Cases
- **Initialization**:
  - [x] **Config Acceptance**: Game accepts custom configuration
  - [x] **Config Locking**: Configuration locked after `game.start()`
  - [x] **Board Creation**: Board created with config dimensions
  - [x] **Initial Entities**: Initial entities spawned per config probabilities

- **Phase Order**:
  - [x] **Movement Before Combat**: Movement completes before combat
  - [x] **Combat Before Eating**: Combat completes before eating
  - [x] **Eating Before Reproduction**: Eating completes before reproduction
  - [x] **Reproduction Before Death**: Reproduction completes before death
  - [x] **Death Before Birth**: Death completes before birth
  - [x] **Birth Before Spawn**: Birth completes before spawn
  - [x] **Spawn Last**: Spawn system completes last

- **Parameter Flow**:
  - [x] **Movement Respects Config**: Movement uses configured perception ranges
  - [x] **Combat Respects Config**: Combat uses configured damage values
  - [x] **Eating Respects Config**: Eating uses configured healing values
  - [x] **Reproduction Respects Config**: Reproduction uses configured probabilities
  - [x] **Death Respects Config**: Death uses configured Gompertz parameters
  - [x] **Spawn Respects Config**: Spawn uses configured probabilities

- **Simulation Integrity**:
  - [x] **Round Execution**: Complete round executes all phases
  - [x] **Entity State Consistency**: Entity state consistent across phases
  - [x] **Board State Consistency**: Board state consistent across phases

### Files to Create
- `tests/core/Game.test.ts`

---

## Configuration Parameter Summary

Total parameters: **51**

### By Category

| Category | Parameters | Count |
|----------|------------|-------|
| Board | width, height, injuredThreshold | 3 |
| Spawn (Initial) | maleHumanProbability, femaleHumanProbability, wolfProbability, dogProbability, fruitProbability, mushroomProbability | 6 |
| Human | startingHealth, maleVsMaleDamage, maleVsWolfDamage, reproductionProbability, pregnancyPeriod, cooldownPeriod, perceptionRange, moveTowardFruitProbability, gompertzA, gompertzB | 10 |
| Wolf | startingHealth, damageToMale, damageToFemale, damageToDog, perceptionRange, moveTowardHumanProbability, spawnProbability, gompertzA, gompertzB | 9 |
| Dog | startingHealth, damageToWolf, perceptionRange, moveTowardWolfProbability, spawnProbability, gompertzA, gompertzB | 7 |
| Fruit | energyHealed, spawnProbability, roundsToRipen | 3 |
| Mushroom | energyRemoved, spawnProbability | 2 |
| Overcrowding | humanThreshold, humanMultiplier, animalThreshold, animalMultiplier | 4 |

**Total: 51 parameters**

---

## Test Implementation Strategy

### File Organization
```
tests/
├── setup.ts                    # Test utilities and factories
├── vitest.config.ts           # Vitest configuration
├── core/
│   ├── Board.test.ts          # Board spatial operations
│   └── Game.test.ts           # Integration tests
├── entities/
│   ├── Entity.test.ts         # Base entity class
│   ├── Human.test.ts          # Human-specific logic
│   ├── Wolf.test.ts           # Wolf-specific logic
│   ├── Dog.test.ts            # Dog-specific logic
│   └── Plant.test.ts          # Fruit & Mushroom logic
└── systems/
    ├── MovementSystem.test.ts      # Movement with perception
    ├── CombatSystem.test.ts        # Combat damage values
    ├── EatingSystem.test.ts        # Fruit/mushroom consumption
    ├── ReproductionSystem.test.ts  # Pregnancy mechanics
    ├── DeathSystem.test.ts         # Age & overcrowding death
    ├── BirthSystem.test.ts         # Birth timing
    └── SpawnSystem.test.ts         # Entity spawning
```

### Test Execution Order
Tests should be executed in dependency order:
1. Entities (don't depend on systems)
2. Systems (depend on entities)
3. Game integration (depends on all)

### Coverage Goals
- **Statement Coverage**: ≥85%
- **Branch Coverage**: ≥80%
- **Function Coverage**: ≥90%
- **Line Coverage**: ≥85%

### Parameter Validation Focus
Each test that involves a configurable parameter should:
1. Create a configuration with custom value
2. Initialize game/entity with custom config
3. Execute relevant game phase
4. Assert that custom value affected behavior
5. Compare against default config behavior

---

## Notes for Implementation

- Use factory functions in `setup.ts` to reduce test boilerplate
- Seed random number generator for reproducible tests
- Mock the Renderer where needed to avoid canvas dependencies
- Create isolated test boards for each test case
- Test both boundary conditions and typical values
- Document parameter effects in test comments for future reference

