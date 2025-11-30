# Test Implementation Continuation Guide

## Overview

This guide explains how to continue implementing the remaining unit tests to achieve full parameter coverage (51/51 parameters).

---

## Current State

**Tests Implemented:** 73 test cases across 3 files
**Parameters Tested:** 3/51 (5.9%)
**Infrastructure:** Complete ✅

**Coverage:**
- ✅ Board class (foundational)
- ✅ Entity base class (foundational)
- ✅ Human entity (3/10 parameters)
- ⏳ Wolf entity (pending - 0/9)
- ⏳ Dog entity (pending - 0/7)
- ⏳ Fruit/Mushroom (pending - 0/5)
- ⏳ All 7 systems (pending - 0/23)

---

## Pattern for Each Test File

All remaining tests follow the same proven pattern from `Human.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { describe, it, expect, beforeEach } from 'vitest'
import { TargetClass } from '../../src/path/to/class'
import { createConfig, createEntity, DEFAULT_CONFIG } from '../setup'

describe('TargetClass or System Name', () => {
  describe('Configuration: Parameter Name', () => {
    it('should initialize with config value', () => {
      // Create entity with default config
      const entity = createEntity()
      // Verify it matches config
      expect(entity.property).toBe(DEFAULT_CONFIG.section.parameter)
    })

    it('should apply custom value from config override', () => {
      // Create custom config
      const customConfig = createConfig({
        section: { parameter: customValue }
      })
      // Create entity with custom config
      const entity = createEntity()
      entity.property = customConfig.section.parameter
      // Verify custom value applied
      expect(entity.property).toBe(customValue)
    })

    it('should affect [relevant behavior]', () => {
      // Test actual behavioral consequence
      // Not just that value is stored, but that it matters
    })
  })
})
```

---

## Next Files to Implement (In Order)

### Priority 1: Entity Tests (Quick - Low Complexity)

#### 1. Wolf Entity Tests (`tests/entities/Wolf.test.ts`)
**Parameters to Test (3 + combat-related later):**
- `wolf.startingHealth` - Initial health value
- `wolf.spawnProbability` - Birth rate during game
- (Additional combat parameters tested in CombatSystem tests)

**Test Structure:**
```typescript
describe('Wolf Entity', () => {
  describe('Configuration: Starting Health', () => {
    it('should initialize with config starting health', () => { ... })
    it('should apply custom starting health from config', () => { ... })
    it('should support various health values', () => { ... })
  })

  describe('Spawn Probability', () => {
    it('should have correct spawn probability from config', () => { ... })
  })
})
```

**Time Estimate:** 30 minutes
**Test Cases:** ~15-20

#### 2. Dog Entity Tests (`tests/entities/Dog.test.ts`)
**Parameters to Test (3 + combat-related later):**
- `dog.startingHealth` - Initial health value
- `dog.spawnProbability` - Birth rate during game
- (Additional combat parameters tested in CombatSystem tests)

**Identical structure to Wolf tests**
**Time Estimate:** 30 minutes
**Test Cases:** ~15-20

#### 3. Plant Entity Tests (`tests/entities/Plant.test.ts`)
**Parameters to Test:**
- `fruit.roundsToRipen` - Ripening duration
- `fruit.spawnProbability` - Initial spawn rate
- `mushroom.spawnProbability` - Initial spawn rate

**Test Structure:**
```typescript
describe('Fruit', () => {
  describe('Configuration: Ripening Duration', () => {
    it('should initialize unripe', () => { ... })
    it('should ripen after roundsToRipen advances', () => { ... })
    it('should apply custom ripening config', () => { ... })
  })

  describe('Spawn Probability', () => {
    it('should store spawn probability from config', () => { ... })
  })
})

describe('Mushroom', () => {
  describe('Configuration: Spawn Probability', () => {
    it('should store spawn probability from config', () => { ... })
  })
})
```

**Time Estimate:** 45 minutes
**Test Cases:** ~20-25

**Priority 1 Total:** ~110 minutes, ~50-65 test cases, 6 more parameters covered

---

### Priority 2: System Tests (Medium Complexity)

Each system test verifies that configuration parameters used in that phase actually affect behavior. Key pattern:

1. **Create board with entities** using factories
2. **Execute system with default config** → measure outcome
3. **Execute system with custom config** → verify different outcome
4. **Assert config parameter caused the difference**

#### 4. MovementSystem Tests (`tests/systems/MovementSystem.test.ts`)
**Parameters to Test (6):**
- `human.perceptionRange` - How far humans see fruit
- `human.moveTowardFruitProbability` - Chance to move toward fruit
- `wolf.perceptionRange` - How far wolves see humans
- `wolf.moveTowardHumanProbability` - Chance to move toward humans
- `dog.perceptionRange` - How far dogs see wolves
- `dog.moveTowardWolfProbability` - Chance to move toward wolves

**Test Pattern:**
```typescript
describe('MovementSystem', () => {
  describe('Human Movement Configuration', () => {
    describe('Perception Range', () => {
      it('should detect fruit within perceptionRange', () => {
        const config = DEFAULT_CONFIG
        const board = createDefaultBoard()
        const human = createHuman(15, 15)
        const fruit = createFruit(15 + config.human.perceptionRange, 15)

        // Place on board, run movement system
        // Verify human moved toward fruit
      })

      it('should ignore fruit beyond perceptionRange', () => {
        const config = DEFAULT_CONFIG
        const board = createDefaultBoard()
        const human = createHuman(15, 15)
        const fruit = createFruit(15 + config.human.perceptionRange + 1, 15)

        // Place on board, run movement system
        // Verify human moved randomly (not toward fruit)
      })

      it('should apply custom perception range from config', () => {
        const customConfig = createConfig({
          human: { perceptionRange: 10 }
        })
        // Verify fruits detected at distance 10 but not 11
      })
    })

    describe('Move Toward Fruit Probability', () => {
      it('should move toward fruit with moveTowardFruitProbability chance', () => {
        // Test with probability 1.0 → always moves toward fruit
        // Test with probability 0.0 → always random movement
        // Test with probability 0.5 → mixed behavior
      })

      it('should apply custom moveTowardFruitProbability', () => {
        // Verify parameter affects movement probability
      })
    })
  })

  describe('Wolf Movement Configuration', () => {
    // Identical pattern for wolf perception and probability
  })

  describe('Dog Movement Configuration', () => {
    // Identical pattern for dog perception and probability
  })
})
```

**Time Estimate:** 90 minutes
**Test Cases:** ~35-40

#### 5. CombatSystem Tests (`tests/systems/CombatSystem.test.ts`)
**Parameters to Test (6):**
- `human.maleVsMaleDamage` - Damage males deal to each other
- `human.maleVsWolfDamage` - Counter-damage males deal to wolves
- `wolf.damageToMale` - Damage wolves deal to male humans
- `wolf.damageToFemale` - Damage wolves deal to female humans
- `wolf.damageToDog` - Counter-damage wolves deal to dogs
- `dog.damageToWolf` - Damage dogs deal to wolves

**Test Pattern:**
```typescript
describe('CombatSystem', () => {
  describe('Male vs Male Combat', () => {
    it('should deal maleVsMaleDamage to opponent', () => {
      const male1 = createMale(15, 15)
      const male2 = createMale(16, 15)

      // Run combat system
      // Verify both took maleVsMaleDamage from config
    })

    it('should apply custom damage from config override', () => {
      const customConfig = createConfig({
        human: { maleVsMaleDamage: 50 }
      })
      // Verify damage is 50, not default 20
    })
  })

  describe('Wolf vs Human Combat', () => {
    it('should deal damageToMale to male humans', () => { ... })
    it('should deal damageToFemale to female humans', () => { ... })
    it('should receive maleVsWolfDamage counter from males', () => { ... })
    it('should receive no counter from females', () => { ... })
  })

  describe('Dog vs Wolf Combat', () => {
    it('should deal damageToWolf to wolves', () => { ... })
    it('should receive damageToDog counter from wolves', () => { ... })
  })
})
```

**Time Estimate:** 90 minutes
**Test Cases:** ~30-35

#### 6. EatingSystem Tests (`tests/systems/EatingSystem.test.ts`)
**Parameters to Test (4):**
- `fruit.energyHealed` - HP gained from fruit
- `mushroom.energyRemoved` - HP lost from mushroom
- `fruit.roundsToRipen` - Only ripe fruit can be eaten

**Test Pattern:**
```typescript
describe('EatingSystem', () => {
  describe('Fruit Consumption', () => {
    it('should heal energyHealed HP from ripe fruit', () => {
      const human = createHuman(15, 15)
      human.health = 50
      const fruit = createFruit(16, 15, true) // ripe

      // Run eating system
      // Verify human health increased by energyHealed from config
    })

    it('should not eat unripe fruit', () => {
      const human = createHuman(15, 15)
      human.health = 50
      const fruit = createFruit(16, 15, false) // unripe

      // Run eating system
      // Verify human health unchanged
    })

    it('should apply custom energyHealed from config', () => {
      const customConfig = createConfig({
        fruit: { energyHealed: 50 }
      })
      // Verify healing is 50, not default 30
    })

    it('should respect roundsToRipen ripening duration', () => {
      const customConfig = createConfig({
        fruit: { roundsToRipen: 5 }
      })
      const fruit = createFruit(16, 15, false)
      fruit.ripeningCounter = 5

      // Advance ripening for 4 rounds → still unripe
      // Advance 5th round → now ripe
    })
  })

  describe('Mushroom Consumption', () => {
    it('should damage energyRemoved HP from mushroom', () => {
      const human = createHuman(15, 15)
      human.health = 100
      const mushroom = createMushroom(16, 15)

      // Run eating system
      // Verify human health decreased by energyRemoved from config
    })

    it('should apply custom energyRemoved from config', () => {
      const customConfig = createConfig({
        mushroom: { energyRemoved: 60 }
      })
      // Verify damage is 60, not default 40
    })
  })
})
```

**Time Estimate:** 60 minutes
**Test Cases:** ~20-25

#### 7. ReproductionSystem Tests (`tests/systems/ReproductionSystem.test.ts`)
**Parameters to Test (3):**
- `human.reproductionProbability` - Conception probability
- `human.pregnancyPeriod` - Duration of pregnancy
- `human.cooldownPeriod` - Post-birth cooldown

**Test Pattern:**
```typescript
describe('ReproductionSystem', () => {
  describe('Conception Probability', () => {
    it('should initiate pregnancy with reproductionProbability chance', () => {
      // Test with probability 1.0 → always conceive
      // Test with probability 0.0 → never conceive
      // Test with probability 0.5 → mixed behavior
    })

    it('should apply custom reproductionProbability from config', () => {
      const customConfig = createConfig({
        human: { reproductionProbability: 0.8 }
      })
      // Verify conception rate matches 0.8
    })
  })

  describe('Pregnancy Duration', () => {
    it('should track pregnancy for pregnancyPeriod rounds', () => {
      const female = createFemale(15, 15)
      female.isPregnant = true
      female.pregnancyCounter = DEFAULT_CONFIG.human.pregnancyPeriod

      // Advance rounds and verify birth timing
    })

    it('should apply custom pregnancyPeriod from config', () => {
      const customConfig = createConfig({
        human: { pregnancyPeriod: 5 }
      })
      // Verify pregnancy lasts 5 rounds, not 3
    })
  })

  describe('Cooldown Period', () => {
    it('should apply cooldownPeriod after birth', () => {
      // Verify cooldown duration from config
    })

    it('should prevent conception during cooldown', () => {
      // Verify cooldown prevents pregnancy initiation
    })
  })
})
```

**Time Estimate:** 60 minutes
**Test Cases:** ~20-25

#### 8. DeathSystem Tests (`tests/systems/DeathSystem.test.ts`)
**Parameters to Test (10):**
- `human.gompertzA` - Base mortality rate
- `human.gompertzB` - Age acceleration
- `wolf.gompertzA` - Base mortality rate
- `wolf.gompertzB` - Age acceleration
- `dog.gompertzA` - Base mortality rate
- `dog.gompertzB` - Age acceleration
- `overcrowding.humanThreshold` - Population threshold
- `overcrowding.humanMultiplier` - Mortality multiplier
- `overcrowding.animalThreshold` - Population threshold
- `overcrowding.animalMultiplier` - Mortality multiplier

**Test Pattern:**
```typescript
describe('DeathSystem', () => {
  describe('Health-Based Death', () => {
    it('should kill entities with health <= 0', () => { ... })
  })

  describe('Gompertz Mortality (Human)', () => {
    it('should increase death probability with age', () => {
      // Create humans at different ages
      // Verify older age → higher mortality from config
    })

    it('should apply gompertzA parameter', () => {
      const customConfig = createConfig({
        human: { gompertzA: 0.001 }
      })
      // Verify higher A → higher mortality rate
    })

    it('should apply gompertzB parameter', () => {
      const customConfig = createConfig({
        human: { gompertzB: 0.2 }
      })
      // Verify higher B → faster age-based acceleration
    })
  })

  describe('Gompertz Mortality (Wolf)', () => {
    // Identical pattern for wolf with wolf.gompertzA/B
  })

  describe('Gompertz Mortality (Dog)', () => {
    // Identical pattern for dog with dog.gompertzA/B
  })

  describe('Overcrowding Effect (Humans)', () => {
    it('should increase mortality when humans exceed humanThreshold', () => {
      const board = createDefaultBoard()
      // Spawn humans up to threshold
      // Verify normal mortality

      // Spawn more humans beyond threshold
      // Verify mortality multiplied by humanMultiplier
    })

    it('should apply custom humanThreshold from config', () => {
      const customConfig = createConfig({
        overcrowding: { humanThreshold: 50 }
      })
      // Verify effect triggers at 50 humans, not 100
    })

    it('should apply custom humanMultiplier from config', () => {
      const customConfig = createConfig({
        overcrowding: { humanMultiplier: 3 }
      })
      // Verify mortality × 3 when overcrowded, not × 2
    })
  })

  describe('Overcrowding Effect (Animals)', () => {
    it('should increase mortality when wolves+dogs exceed animalThreshold', () => { ... })
    it('should apply custom animalThreshold from config', () => { ... })
    it('should apply custom animalMultiplier from config', () => { ... })
  })
})
```

**Time Estimate:** 120 minutes
**Test Cases:** ~40-45

#### 9. BirthSystem Tests (`tests/systems/BirthSystem.test.ts`)
**Parameters to Test (2):**
- `human.pregnancyPeriod` - Birth timing (already partially tested)
- `human.startingHealth` - Newborn initial health (already partially tested)

**Test Pattern:**
```typescript
describe('BirthSystem', () => {
  describe('Birth Timing', () => {
    it('should birth after pregnancyPeriod rounds', () => {
      const female = createFemale(15, 15)
      female.isPregnant = true
      female.pregnancyCounter = DEFAULT_CONFIG.human.pregnancyPeriod

      // Run BirthSystem - should spawn baby
    })

    it('should apply custom pregnancyPeriod timing', () => {
      const customConfig = createConfig({
        human: { pregnancyPeriod: 5 }
      })
      // Verify birth at round 5
    })
  })

  describe('Newborn Health', () => {
    it('should spawn baby with startingHealth from config', () => {
      // Verify newborn has config.human.startingHealth
    })

    it('should apply custom newborn health from config', () => {
      const customConfig = createConfig({
        human: { startingHealth: 150 }
      })
      // Verify newborn has 150 HP
    })
  })

  describe('Post-Birth State', () => {
    it('should apply cooldown after birth', () => {
      const config = DEFAULT_CONFIG
      // Verify mother gets cooldownPeriod after birth
    })
  })
})
```

**Time Estimate:** 45 minutes
**Test Cases:** ~15-20

#### 10. SpawnSystem Tests (`tests/systems/SpawnSystem.test.ts`)
**Parameters to Test (10):**
- `spawn.maleHumanProbability` - Initial male human spawn rate
- `spawn.femaleHumanProbability` - Initial female human spawn rate
- `spawn.wolfProbability` - Initial wolf spawn rate
- `spawn.dogProbability` - Initial dog spawn rate
- `spawn.fruitProbability` - Initial fruit spawn rate
- `spawn.mushroomProbability` - Initial mushroom spawn rate
- `wolf.spawnProbability` - Mid-game wolf spawn rate
- `dog.spawnProbability` - Mid-game dog spawn rate
- `fruit.spawnProbability` - Mid-game fruit spawn rate
- `mushroom.spawnProbability` - Mid-game mushroom spawn rate

**Test Pattern:**
```typescript
describe('SpawnSystem', () => {
  describe('Initial Spawn (Board Initialization)', () => {
    describe('Human Spawn', () => {
      it('should spawn males at maleHumanProbability rate', () => {
        const config = createConfig()
        // Count spawned males
        // Verify count ≈ cells × probability
      })

      it('should apply custom maleHumanProbability', () => {
        const customConfig = createConfig({
          spawn: { maleHumanProbability: 0.25 }
        })
        // Verify spawn rate is 25%, not 15%
      })
    })

    // Similar pattern for females, wolves, dogs, fruits, mushrooms
  })

  describe('Mid-Game Spawn', () => {
    describe('Wolf Spawn', () => {
      it('should spawn wolves at wolf.spawnProbability per round', () => {
        const config = DEFAULT_CONFIG
        const board = createDefaultBoard()
        // Run SpawnSystem
        // Verify wolves spawn at correct rate
      })

      it('should apply custom wolf.spawnProbability', () => {
        const customConfig = createConfig({
          wolf: { spawnProbability: 0.01 }
        })
        // Verify spawn rate is 0.01, not 0.002
      })
    })

    // Similar pattern for dogs, fruits, mushrooms
  })

  describe('Spawn Probability Integration', () => {
    it('should only spawn on empty cells', () => {
      // Verify no entities overwritten
    })

    it('should maintain board cell integrity', () => {
      // Verify no entities lost or duplicated
    })
  })
})
```

**Time Estimate:** 90 minutes
**Test Cases:** ~35-40

**Priority 2 Total:** ~585 minutes (≈9.75 hours), ~200-230 test cases, 23 more parameters covered

---

### Priority 3: Integration Tests

#### 11. Game Integration Tests (`tests/core/Game.test.ts`)
**Verifies:**
- All 51 parameters flow correctly through entire simulation
- 7-phase execution order maintained
- Config locking after game start
- Full parameter → outcome mapping

**Time Estimate:** 120 minutes
**Test Cases:** ~30-40

---

## Implementation Timeline

### Minimum Viable Test Suite
**Goal:** All 51 parameters tested
**Current:** 3/51 (5.9%)
**Remaining:** 48 parameters

**Realistic Timeline:**
- Priority 1 (Entity tests): 2-3 hours → 9/51 parameters (17.6%)
- Priority 2 (System tests): 9-10 hours → 45/51 parameters (88.2%)
- Priority 3 (Integration): 2-3 hours → 51/51 parameters (100%)

**Total Estimated Time:** 13-16 hours
**Final Test Count:** ~250-300 test cases

### Recommended Implementation Order

1. **Wolf.test.ts** (30 min) - Similar to Human.test.ts
2. **Dog.test.ts** (30 min) - Identical to Wolf.test.ts
3. **Plant.test.ts** (45 min) - New patterns for ripening
4. **MovementSystem.test.ts** (90 min) - First system test (largest)
5. **CombatSystem.test.ts** (90 min) - Similar structure
6. **EatingSystem.test.ts** (60 min) - Smaller system test
7. **ReproductionSystem.test.ts** (60 min) - Familiar from Human tests
8. **DeathSystem.test.ts** (120 min) - Most complex system
9. **BirthSystem.test.ts** (45 min) - Small system test
10. **SpawnSystem.test.ts** (90 min) - Mid-game spawning
11. **Game.test.ts** (120 min) - Full integration

---

## How to Verify Your Tests Work

```bash
# After creating each test file:
npm test tests/[path]/[FileName].test.ts

# Should see:
# ✓ tests/[path]/[FileName].test.ts (XX) XX ms
#   ✓ ClassName/SystemName
#     ✓ should ...
#     ✓ should ...
#   ...
#   ✓ XX passed (XX ms)
```

If tests fail, check:
1. Imports are correct (check relative paths)
2. Entity factories exist in `tests/setup.ts`
3. Config structure matches `GameConfig` interface
4. Parameter names match `DEFAULT_CONFIG` paths

---

## Testing Tips

### For Entity Tests
- Use factory functions (`createHuman()`, `createWolf()`, etc.)
- Test with both default and custom configs
- Verify parameter affects both state and behavior
- Test edge cases (0, 1, very large values)

### For System Tests
- Use `createDefaultBoard()` for consistent test environment
- Place entities before running system
- Verify outcome changed based on parameter value
- Test with config value 0.0 and 1.0 when probability-based

### For Integration Tests
- Verify all phases execute in order
- Test that config locked after `game.start()`
- Run multiple rounds to verify consistency
- Test with multiple different parameter combinations

---

## Common Pitfalls to Avoid

❌ **Testing property storage without behavior verification**
- Only testing that entity.health = config.health is not enough
- Must verify that health actually affects combat outcome

❌ **Not using factory functions**
- Don't manually instantiate entities in tests
- Use `createHuman()`, `createWolf()`, etc. from setup.ts

❌ **Hardcoding default values**
- Don't hardcode "expect(X).toBe(100)"
- Use `DEFAULT_CONFIG` or `config.human.startingHealth`

❌ **Sharing state between tests**
- Each test should be completely independent
- Use `beforeEach()` to reset state if needed

❌ **Testing unrelated behavior**
- Focus on parameter validation, not all possible behaviors
- Save edge case testing for later

---

## Questions?

Refer to:
- **TESTING_PLAN.md** - Comprehensive testing strategy
- **UNIT_TESTING_IMPLEMENTATION.md** - Current implementation status
- **tests/setup.ts** - Available factory functions and utilities
- **tests/entities/Human.test.ts** - Reference implementation pattern

