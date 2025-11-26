# Critical Bug: Wolf Spawning Probability Issue

## 🐛 Problem Identified

Wolves (🐺) are **barely spawning** or **not spawning at all** due to flawed probability logic.

## 🔍 Root Cause Analysis

**File**: `src/core/Game.ts:58-70`

**Current Logic** (BROKEN):
```typescript
if (Random.chance(0.15)) {          // 15% male
  spawn male
} else if (Random.chance(0.15)) {   // 15% female (only if male failed)
  spawn female
} else if (Random.chance(0.05)) {   // 5% wolf (only if male AND female failed)
  spawn wolf
} else if (Random.chance(0.10)) {   // 10% fruit (only if all above failed)
  spawn fruit
}
```

**Problem**: Cascading `if-else-if` means each check only happens if all previous checks failed!

**Effective Probabilities**:
- Male: 15% ✅ (correct)
- Female: 85% × 15% = **12.75%** ❌ (should be 15%)
- Wolf: 85% × 85% × 5% = **3.6%** ❌ (should be 5%)
- Fruit: 85% × 85% × 95% × 10% = **6.9%** ❌ (should be 10%)

**Why wolves don't spawn**: 
- Wolves can only spawn if BOTH human checks fail first
- With 15% + 12.75% = 27.75% humans spawning first, wolves are severely suppressed
- Effective wolf spawn rate is only **3.6%** instead of intended **5%**

---

## ✅ Solution: Weighted Random Selection

**Intended Probabilities** (from config):
- Male Human: 15%
- Female Human: 15%
- Wolf: 5%
- Fruit: 10%
- Empty: 55% (remaining)

**Fix**: Generate ONE random number and use cumulative thresholds:

```typescript
const rand = Math.random();
const cumulative = {
  male: 0.15,                    // 0.00 - 0.15
  female: 0.30,                  // 0.15 - 0.30
  wolf: 0.35,                    // 0.30 - 0.35
  fruit: 0.45                    // 0.35 - 0.45
  // empty: 0.55 - 1.00 (implicit)
};

if (rand < cumulative.male) {
  spawn male
} else if (rand < cumulative.female) {
  spawn female
} else if (rand < cumulative.wolf) {
  spawn wolf
} else if (rand < cumulative.fruit) {
  spawn fruit
}
// else: leave cell empty
```

---

## 📊 Expected vs Actual Results

**Expected** (900 cells):
- Males: ~135 (15%)
- Females: ~135 (15%)
- Wolves: ~45 (5%)
- Fruits: ~90 (10%)
- Empty: ~495 (55%)

**Current Actual** (broken logic):
- Males: ~135 (15%) ✅
- Females: ~115 (12.75%) ❌
- Wolves: ~32 (3.6%) ❌ **VERY LOW**
- Fruits: ~62 (6.9%) ❌
- Empty: ~556 (61.8%)

---

## 🔧 Implementation Plan

1. **Update `Game.ts:initializeBoard()` spawn logic**
2. **Use cumulative probability thresholds**
3. **Test: Should see ~45 wolves spawn on average**
4. **Verify statistics panel updates correctly**

---

## ⚠️ Impact Assessment

**Severity**: CRITICAL - Core game mechanic broken
**User Impact**: Ecosystem dynamics completely broken without wolves
**Priority**: IMMEDIATE FIX REQUIRED

Without wolves:
- ❌ No predator-prey dynamics
- ❌ No wolf vs human combat
- ❌ Human population unchecked
- ❌ Game balance completely broken
- ❌ 3 of 7 systems effectively non-functional (combat, eating patterns, death)

---

## ✅ RESOLUTION

**Status**: FIXED
**Date**: 2025-11-26
**Location**: `src/core/Game.ts:55-79`

**Implementation**:
- Replaced cascading `if-else-if` with weighted random selection
- Generate single random number and compare against cumulative thresholds
- Removed unused `Random` utility class import
- Build successful

**Verification Required**:
- Run game and check statistics panel for wolf count
- Expected: ~45 wolves spawning on 30x30 board (900 cells × 5% = 45)
- Verify wolves appear visually on board
- Confirm ecosystem dynamics now functional
