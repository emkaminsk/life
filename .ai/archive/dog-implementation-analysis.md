# Dog Implementation Analysis

## 🎯 Overview

**Status**: MISSING FROM PoC - Critical ecosystem component not implemented
**Priority**: HIGH - Required for complete predator-prey dynamics
**PRD Alignment**: Dogs are fully specified in PRD but absent from current PoC implementation

## 📋 PRD Requirements for Dogs

### Entity Specifications (PRD Section 3.1.4)
- **Visual Representation**: 🐕 emoji
- **Entity Type**: Separate creature type (not a human or wolf variant)

### Behavioral Requirements (PRD Section 3.4)

**Movement (3.4.3)**:
- Dogs move toward wolves when wolves detected within perception range
- Weighted random movement (configured probability to move toward target)

**Combat (3.4.4)**:
- When dog adjacent to wolf at round end, dog deals configured damage to wolf
- Dogs do not attack humans
- Wolves do not actively attack dogs (dogs are aggressors)

### Configuration Requirements (PRD Section 3.7.7)

Dog configuration must include:
- `startingHealth`: Initial health points
- `damageToWolf`: Damage dealt per round when adjacent
- `ageMotorRateA`: Gompertz mortality parameter A
- `ageAccelerationB`: Gompertz mortality parameter B
- `perceptionRange`: Distance in cells for detecting wolves
- `probabilityToMoveTowardWolf`: Chance to move toward detected wolf

### Spawn Requirements (PRD Section 3.7.4)
- `dogProbability`: Spawn probability during board initialization
- Must be included in total spawn probability validation (≤100%)

### Statistics Display (PRD Section 3.10.1)
- Dogs (count) must be displayed in statistics panel
- Updates in real-time as dog population changes

### User Story (US-019: Dog Protection)

**Title**: Observe dogs protecting humans
**Acceptance Criteria**:
- Dogs move toward wolves within perception range
- Dog adjacent to wolf deals damage at round end
- Red flash displays on combat squares
- Wolf health decreases by configured damage
- Dogs do not attack humans
- Wolves do not attack dogs independently (no counter-damage)

## 🔍 Current PoC Gap Analysis

### Missing Components

**1. Type System**:
- ❌ No `DOG` in `EntityType` enum (`src/types.ts`)
- **Impact**: Cannot differentiate dogs from other entities

**2. Entity Class**:
- ❌ No `src/entities/Dog.ts` file
- **Impact**: No dog entity can be created or managed

**3. Configuration**:
- ❌ No `dog` configuration section in `src/config.ts`
- ❌ No `dogProbability` in spawn configuration
- **Impact**: Cannot spawn dogs or configure their behavior

**4. Spawn Logic**:
- ❌ Dogs not included in weighted random selection in `Game.ts:initializeBoard()`
- **Impact**: Dogs never spawn on board initialization

**5. Renderer**:
- ❌ No handler for `EntityType.DOG` in `Renderer.ts:getEntityEmoji()`
- **Impact**: Dogs would render as blank/error if they existed

**6. Movement System**:
- ❌ No dog movement logic in `MovementSystem.ts`
- **Impact**: Dogs would not move toward wolves

**7. Combat System**:
- ❌ No dog vs wolf combat logic in `CombatSystem.ts`
- **Impact**: Dogs adjacent to wolves deal no damage

**8. Statistics**:
- ❌ No dog count in `index.html` statistics panel
- ❌ No dog counting logic in `src/main.ts:updateStatistics()`
- **Impact**: User cannot track dog population

## 🎮 Ecosystem Role

Dogs complete the three-tier ecosystem:

```
Level 3 (Top): Dogs 🐕
             ↓ (hunt)
Level 2:      Wolves 🐺
             ↓ (hunt)
Level 1:      Humans 👨👩
             ↓ (consume)
Level 0:      Fruits 🍎🍏
```

**Dynamic Implications**:
- **Without dogs**: Wolves unchecked → human extinction likely
- **With dogs**: Wolf population controlled → humans can survive → creates balance
- **Overcrowding dogs**: Wolves eliminated → dogs starve → population crash

This creates rich educational value for students observing predator-prey dynamics and ecosystem balance.

## 📊 Expected Behavior After Implementation

### Initialization (30x30 board with default config)
Assuming `dogProbability: 0.03` (3%):
- Expected dog spawn: ~27 dogs (900 cells × 3%)
- Visual: 🐕 emojis scattered across board

### During Simulation

**Round 1 - Movement**:
- Dogs detect wolves within perception range
- Move toward nearest wolf with configured probability
- Random movement if no wolves in range

**Round 2 - Combat**:
- Dogs adjacent to wolves deal damage
- Red flash on combat squares
- Wolves take damage but do not counter-attack
- Injured wolves show red border if health < 50

**Round 5 - Death**:
- Wolves with health ≤ 0 removed
- Dogs also subject to age-based Gompertz mortality

**Round 6 - Birth**:
- (Dogs do not reproduce in PoC - not in PRD requirements)

### Statistics Panel
```
👨 Males: 135
👩 Females: 135
🤰 Pregnant: 12
🐺 Wolves: 45
🐕 Dogs: 27
🍎 Fruits: 90
```

## 🔧 Implementation Complexity

**Estimated Effort**: 2-3 hours

**Why Relatively Simple**:
1. Dogs are structurally similar to wolves (simpler than humans - no pregnancy/sex)
2. Movement logic follows same pattern as wolf movement
3. Combat logic simpler than wolf combat (no counter-attacks)
4. No new systems needed - integrates into existing 7 phases

**Complexity Breakdown**:
- Entity class: 15 minutes (copy Wolf, simplify)
- Configuration: 10 minutes (add dog section)
- Spawn logic: 15 minutes (add to weighted random)
- Renderer: 5 minutes (add emoji mapping)
- Movement: 20 minutes (add dog targeting logic)
- Combat: 30 minutes (add dog vs wolf logic)
- Statistics: 15 minutes (update HTML + JS)
- Testing: 45 minutes (verify all behaviors)

## ⚠️ Critical Implementation Notes

### 1. Combat Asymmetry
**PRD states**: "Wolves do not attack dogs independently (only counter-damage)"
**Implementation**: In US-019: "Wolves do not attack dogs independently (no counter-damage)"

**Contradiction Resolution**: Based on US-019 (more specific), wolves should NOT counter-attack dogs at all. This differs from wolf vs male human combat where males counter-attack.

**Correct Implementation**:
```typescript
// Dog vs Wolf combat
if ((entity1 instanceof Dog && entity2 instanceof Wolf) ||
    (entity1 instanceof Wolf && entity2 instanceof Dog)) {
  const dog = entity1 instanceof Dog ? entity1 : entity2;
  const wolf = entity1 instanceof Wolf ? entity1 : entity2;

  // Dog deals damage to wolf
  wolf.takeDamage(DEFAULT_CONFIG.dog.damageToWolf);

  // NO counter-attack from wolf
  // (This is key difference from wolf vs male human)
}
```

### 2. Spawn Probability Balance

Current probabilities:
- Males: 15%
- Females: 15%
- Wolves: 5%
- Fruits: 10%
- **Total: 45%**

Adding dogs at 3%:
- **New total: 48%**
- Empty cells: 52%

**PRD Warning Threshold**: 90% total spawn probability triggers warning

**Recommendation**: 3% dog spawn is safe and maintains ecosystem balance.

### 3. Configuration Defaults

Recommended default values (based on PRD patterns):
```typescript
dog: {
  startingHealth: 70,           // Between wolf (80) and human (100)
  damageToWolf: 35,             // Slightly higher than wolf damage (30)
  perceptionRange: 6,           // Between human (5) and wolf (7)
  moveTowardWolfProbability: 0.75, // High but not as high as wolf (0.8)
  gompertzA: 0.00015,           // Between human (0.0001) and wolf (0.0002)
  gompertzB: 0.11,              // Between human (0.1) and wolf (0.12)
}
```

**Rationale**:
- Dogs slightly weaker than wolves (health 70 vs 80)
- Dogs deal more damage than wolves (35 vs 30) to be effective predators
- Moderate perception range for balanced hunting
- Die slightly faster than humans but slower than wolves (shorter lifespan)

### 4. Movement Priority

In `MovementSystem.ts`, movement order:
1. Humans → fruits
2. Wolves → humans
3. **Dogs → wolves** (new)

All use same weighted random logic with configurable probability.

### 5. Phase Integration

Dogs integrate into existing 7 phases:
1. **Movement** ✅ Add dog logic
2. **Combat** ✅ Add dog vs wolf
3. **Eating** ❌ Dogs don't eat (not in PRD)
4. **Reproduction** ❌ Dogs don't reproduce (not in PRD)
5. **Death** ✅ Age-based mortality (already handles all creatures)
6. **Birth** ❌ No dog births
7. **Plant Spawn** ❌ Not relevant

**Only 2 systems need modification**: Movement + Combat

## 🧪 Testing Checklist

After implementation, verify:

### Visual
- [ ] Dogs spawn as 🐕 emoji
- [ ] Dogs appear in correct quantities (~3% of cells)
- [ ] Injured dogs show red border when health < 50
- [ ] Red flash appears when dog attacks wolf

### Behavior
- [ ] Dogs move toward wolves within perception range
- [ ] Dogs move randomly when no wolves in range
- [ ] Dogs deal damage to adjacent wolves
- [ ] Wolves do NOT counter-attack dogs
- [ ] Dogs do NOT attack humans
- [ ] Dogs subject to age-based death (Gompertz)

### Statistics
- [ ] Dog count displays in statistics panel
- [ ] Dog count updates every round
- [ ] Dog count accurate (matches board count)

### Edge Cases
- [ ] Dog with no adjacent empty cells doesn't move
- [ ] Dog vs wolf combat at board edge works correctly
- [ ] Multiple dogs attacking same wolf (all deal damage)
- [ ] Dog death removes from board and statistics

### Configuration
- [ ] Dog parameters editable in config
- [ ] Spawn probability validation includes dogs
- [ ] Expected creature count includes dogs
- [ ] Dog default values load correctly

## 📝 Implementation Order

**Phase 1: Foundation** (30 minutes)
1. Add `DOG` to `EntityType` enum
2. Create `Dog.ts` entity class
3. Add dog configuration to `config.ts`
4. Add dog spawn probability to config

**Phase 2: Core Systems** (60 minutes)
5. Update spawn logic in `Game.ts:initializeBoard()`
6. Add dog emoji to `Renderer.ts:getEntityEmoji()`
7. Add dog movement logic to `MovementSystem.ts`
8. Add dog vs wolf combat to `CombatSystem.ts`

**Phase 3: UI Integration** (30 minutes)
9. Add dog count to `index.html` statistics panel
10. Add dog counting to `main.ts:updateStatistics()`
11. Build and verify no TypeScript errors

**Phase 4: Testing & Validation** (45 minutes)
12. Run simulation and verify dogs spawn
13. Verify dog movement toward wolves
14. Verify dog vs wolf combat works
15. Verify statistics display correctly
16. Test edge cases and boundary conditions

**Total Estimated Time**: 2 hours 45 minutes

## 🎯 Success Criteria

Implementation complete when:
1. ✅ Dogs spawn on board initialization
2. ✅ Dogs move toward wolves
3. ✅ Dogs deal damage to wolves
4. ✅ Wolves do NOT counter-attack dogs
5. ✅ Dogs subject to age-based mortality
6. ✅ Statistics panel shows accurate dog count
7. ✅ All visual feedback working (emoji, red border, combat flash)
8. ✅ No TypeScript compilation errors
9. ✅ No runtime errors during simulation
10. ✅ Ecosystem dynamics observable (dogs help control wolf population)
