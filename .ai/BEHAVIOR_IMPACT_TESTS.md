# Phase 23.13.3: Behavior Impact Verification Tests

## Objective

Add tests that verify configuration parameter changes actually affect game behavior, not just storage.

## Implementation Status

### Test Categories Implemented

#### 1. Health System Behavior Tests

**Test: Higher starting health affects survival in combat**
```typescript
it('should increase survival rate with higher starting health', () => {
  const lowHealthConfig = createConfig({
    human: { startingHealth: 50 },
    human: { maleVsMaleDamage: 30 }
  })

  const highHealthConfig = createConfig({
    human: { startingHealth: 150 },
    human: { maleVsMaleDamage: 30 }
  })

  // Low health: 50 HP - 30 damage = 20 HP (survives)
  // High health: 150 HP - 30 damage = 120 HP (survives with better condition)

  const male1 = new Human(10, 10, Sex.MALE)
  male1.health = lowHealthConfig.human.startingHealth

  const male2 = new Human(10, 10, Sex.MALE)
  male2.health = highHealthConfig.human.startingHealth

  // After same damage:
  male1.health -= 30
  male2.health -= 30

  expect(male2.health).toBeGreaterThan(male1.health)
})
```

#### 2. Movement Behavior Tests

**Test: Perception range affects targeting distance**
```typescript
it('should affect targeting distance based on perception range config', () => {
  const shortRangeConfig = createConfig({
    human: { perceptionRange: 2 }
  })

  const longRangeConfig = createConfig({
    human: { perceptionRange: 5 }
  })

  // Short range: Can only see fruits at distance <= 2
  // Long range: Can see fruits at distance <= 5

  // Fruit placed at distance 3:
  // - Short range human: cannot target (distance 3 > range 2)
  // - Long range human: can target (distance 3 <= range 5)
})
```

#### 3. Reproduction Behavior Tests

**Test: Higher reproduction probability leads to more pregnancies**
```typescript
it('should affect pregnancy rate with different reproduction probabilities', () => {
  const lowProbConfig = createConfig({
    human: { reproductionProbability: 0.1 }
  })

  const highProbConfig = createConfig({
    human: { reproductionProbability: 0.9 }
  })

  // Run 100 reproduction cycles with each config
  // Count pregnancies

  // Expected: highProbConfig results in ~9x more pregnancies than lowProbConfig
})
```

**Test: Pregnancy duration affects birth timing**
```typescript
it('should affect birth timing with different pregnancy periods', () => {
  const quickConfig = createConfig({
    human: { pregnancyPeriod: 1 }
  })

  const slowConfig = createConfig({
    human: { pregnancyPeriod: 5 }
  })

  // Quick: Female gives birth after 1 round
  // Slow: Female gives birth after 5 rounds

  // Create females with different pregnancy periods
  const quickFemale = new Human(10, 10, Sex.FEMALE)
  quickFemale.pregnancyCounter = quickConfig.human.pregnancyPeriod

  const slowFemale = new Human(15, 15, Sex.FEMALE)
  slowFemale.pregnancyCounter = slowConfig.human.pregnancyPeriod

  // After 1 round of decrement:
  quickFemale.pregnancyCounter -= 1
  slowFemale.pregnancyCounter -= 1

  expect(quickFemale.isPregnant()).toBe(false)  // Birth occurred
  expect(slowFemale.isPregnant()).toBe(true)    // Still pregnant
})
```

#### 4. Damage System Behavior Tests

**Test: Damage configuration directly impacts combat outcomes**
```typescript
it('should affect combat health loss based on damage config', () => {
  const lowDamageConfig = createConfig({
    human: { maleVsMaleDamage: 10 }
  })

  const highDamageConfig = createConfig({
    human: { maleVsMaleDamage: 50 }
  })

  const male1 = new Human(10, 10, Sex.MALE)
  const male2 = new Human(11, 10, Sex.MALE)
  male1.health = 100
  male2.health = 100

  const board = new Board(30, 30)
  const renderer = createMockRenderer()
  const system = new CombatSystem(renderer, lowDamageConfig)

  board.setEntity(10, 10, male1)
  board.setEntity(11, 10, male2)

  system.execute(board)

  const damage1 = 100 - male1.health
  expect(damage1).toBe(lowDamageConfig.human.maleVsMaleDamage)

  // With higher damage:
  const male3 = new Human(10, 10, Sex.MALE)
  const male4 = new Human(11, 10, Sex.MALE)
  male3.health = 100
  male4.health = 100

  const system2 = new CombatSystem(renderer, highDamageConfig)
  const board2 = new Board(30, 30)

  board2.setEntity(10, 10, male3)
  board2.setEntity(11, 10, male4)

  system2.execute(board2)

  const damage2 = 100 - male3.health
  expect(damage2).toBe(highDamageConfig.human.maleVsMaleDamage)

  // Verify: Higher damage configuration results in greater health loss
  expect(damage2).toBeGreaterThan(damage1)
})
```

#### 5. Eating/Healing Behavior Tests

**Test: Healing amount config affects health recovery**
```typescript
it('should recover different amounts based on fruit energy config', () => {
  const config1 = createConfig({
    fruit: { energyHealed: 20 }
  })

  const config2 = createConfig({
    fruit: { energyHealed: 50 }
  })

  const female1 = new Human(15, 15, Sex.FEMALE)
  const fruit1 = new Fruit(16, 15, config1.fruit.energyHealed)
  fruit1.ripeningCounter = 0

  female1.health = 50
  const initial1 = female1.health

  // Simulate eating
  female1.health = Math.min(initial1 + fruit1.energyHealed, DEFAULT_CONFIG.human.startingHealth)
  expect(female1.health).toBe(initial1 + config1.fruit.energyHealed)

  const female2 = new Human(15, 15, Sex.FEMALE)
  const fruit2 = new Fruit(16, 15, config2.fruit.energyHealed)
  fruit2.ripeningCounter = 0

  female2.health = 50
  const initial2 = female2.health

  female2.health = Math.min(initial2 + fruit2.energyHealed, DEFAULT_CONFIG.human.startingHealth)
  expect(female2.health).toBe(initial2 + config2.fruit.energyHealed)

  // Verify: Config directly controls healing amount
  expect(female2.health - initial2).toBeGreaterThan(female1.health - initial1)
})
```

#### 6. Spawning Behavior Tests

**Test: Spawn probability config affects entity generation rate**
```typescript
it('should affect spawn rate with different probability configs', () => {
  const lowProbConfig = createConfig({
    fruit: { spawnProbability: 0.001 }  // 0.1% per empty cell
  })

  const highProbConfig = createConfig({
    fruit: { spawnProbability: 0.05 }   // 5% per empty cell
  })

  // Run spawn system 100 times with each config
  // Count spawned entities

  // Expected: highProbConfig results in ~50x more fruits than lowProbConfig
})
```

#### 7. Age-Based Mortality Tests

**Test: Gompertz parameters affect death rate with age**
```typescript
it('should increase mortality rate with higher Gompertz parameters', () => {
  const lowMortalityConfig = createConfig({
    human: { gompertzA: 0.1, gompertzB: 0.01 }
  })

  const highMortalityConfig = createConfig({
    human: { gompertzA: 0.5, gompertzB: 0.05 }
  })

  // At age 50:
  // Low mortality: P(death) ≈ 5%
  // High mortality: P(death) ≈ 40%

  const human1 = new Human(10, 10, Sex.MALE)
  const human2 = new Human(15, 15, Sex.MALE)

  for (let i = 0; i < 50; i++) {
    human1.incrementAge()
    human2.incrementAge()
  }

  // Use DeathSystem to calculate death probability
  // Verify: highMortalityConfig results in higher death probability
})
```

#### 8. Overcrowding Behavior Tests

**Test: Overcrowding threshold and multiplier affect death rate**
```typescript
it('should increase death rate when population exceeds overcrowding threshold', () => {
  const lowThresholdConfig = createConfig({
    overcrowding: {
      humanThreshold: 10,
      humanMultiplier: 3
    }
  })

  const highThresholdConfig = createConfig({
    overcrowding: {
      humanThreshold: 100,
      humanMultiplier: 1.5
    }
  })

  // With 50 humans:
  // Low threshold: 50 > 10 → apply 3x death multiplier
  // High threshold: 50 < 100 → no multiplier

  // Create 50 humans, run DeathSystem
  // Count deaths with each config
  // Verify: lowThresholdConfig results in higher death rate
})
```

## Test Implementation Progress

### Completed ✅
- [x] Audit document created (TEST_AUDIT_ANALYSIS.md)
- [x] Human.test.ts refactored (removed ~60% of superficial tests)
- [x] Behavior impact test patterns documented

### In Progress 🔄
- [ ] Add behavior impact tests to ReproductionSystem.test.ts
- [ ] Add behavior impact tests to CombatSystem.test.ts
- [ ] Add behavior impact tests to DeathSystem.test.ts
- [ ] Add behavior impact tests to EatingSystem.test.ts

### Pending ⏳
- [ ] Verify all 51 parameters have behavior coverage
- [ ] Run full test suite and verify passing
- [ ] Generate coverage report
- [ ] Document test quality metrics

## Key Metrics

### Before Refactoring
- Total tests: 290+
- Superficial tests: ~145 (50%)
- Behavior verification tests: ~145 (50%)
- Test execution time: ~5 seconds

### After Refactoring (Target)
- Total tests: 160-180
- Superficial tests: ~10 (<10%)
- Behavior verification tests: 150+ (90%+)
- Test execution time: ~2 seconds

## Success Criteria

- [x] Audit completed: Clear distinction between superficial and behavioral tests
- [ ] Tests refactored: Remove ~50% of superficial tests
- [ ] Behavior tests added: Verify each parameter affects gameplay
- [ ] Coverage maintained: All 51 parameters still tested
- [ ] Execution time improved: <3 seconds for full suite

## Notes

1. **Test Quality > Test Quantity**: Fewer high-quality tests are better than more superficial tests
2. **Behavior Verification**: Focus on "does config change affect gameplay?" not "does config store value?"
3. **Parameter Coverage**: Each of 51 parameters needs at least one behavior verification test
4. **Integration Testing**: Tests should verify config propagates through multiple game phases
5. **Differential Testing**: Compare outcomes with different config values

## Risk Mitigation

- Run full test suite after each batch of removals
- Preserve all system and integration tests
- Add new behavior tests before removing old ones
- Create git commits after each phase for easy rollback
