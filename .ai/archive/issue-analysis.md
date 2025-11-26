# Issue Analysis & Fix Plan

## 🔍 Investigation Results

### Issue 1: FPS Counter Shows 5-6 Instead of 60 ✅ EXPLAINED

**Root Cause**: Working as designed, not a bug.

**Explanation**:
- Game loop runs at `defaultSpeed: 200ms` = 5 rounds per second
- Render is called once per game round via `executeRound()`
- FPS counter measures actual render calls: 5 renders/sec = 5 FPS
- Visual effects animate between renders, but base rendering is 5 FPS

**Why not 60 FPS?**:
- To achieve 60 FPS, need separate render loop from game logic loop
- Current architecture: Game Logic Loop = Render Loop (coupled)
- For PoC, this is acceptable

**Options**:
1. **Keep as-is** - Accurate representation of render rate
2. **Rename** - Change "FPS" to "Rounds/sec" or "Updates/sec"
3. **Decouple** - Separate render loop (60 FPS) from game loop (5 rounds/sec) - significant refactor
4. **Remove** - Delete FPS counter entirely

**Recommendation**: Option 2 (Rename to "Rounds/sec") - clearer and accurate

---

### Issue 2: Red Border on Green Apples 🐛 BUG

**Root Cause**: `Renderer.ts:103` checks `isInjured()` on ALL entities including fruits.

**Bug Logic**:
```typescript
// Fruit health = 1 (set in Fruit constructor)
// Injured threshold = 50
// 1 < 50 = true → Red border appears!
```

**Fix**: Only apply injured border to creatures (Human, Wolf), not fruits.

```typescript
// CURRENT (line 103)
else if (entity.isInjured(DEFAULT_CONFIG.board.injuredThreshold)) {

// FIXED
else if ((entity instanceof Human || entity instanceof Wolf) && 
         entity.isInjured(DEFAULT_CONFIG.board.injuredThreshold)) {
```

**Priority**: HIGH - Confusing visual bug

---

### Issue 3: Combat Flash Too Overwhelming 🎨 UX ISSUE

**Root Cause**: `Renderer.ts:128` uses `alpha * 0.5` for combat flash (50% opacity red).

**Current**:
```typescript
case 'combat':
  color = `rgba(255, 0, 0, ${alpha * 0.5})`; // 50% opacity
```

**Fix**: Reduce to 25-30% opacity
```typescript
case 'combat':
  color = `rgba(255, 0, 0, ${alpha * 0.25})`; // 25% opacity
```

**Priority**: MEDIUM - UX improvement

---

### Issue 4: FPS Counter Placement 🎨 UX ISSUE

**Root Cause**: `Renderer.ts:168-170` draws FPS on canvas instead of HTML.

**Current**: FPS rendered as canvas text overlaying the board

**Fix**: Move to HTML in header bar (next to Round counter)

**Changes needed**:
1. Add FPS display element to `index.html` header
2. Update FPS via DOM instead of canvas drawing
3. Remove `displayFps()` canvas drawing from `Renderer.ts`
4. Add `updateFpsDisplay()` method in `main.ts`

**Priority**: LOW - Nice to have

---

### Issue 5: Button UX (Start/Pause/Run Consolidation) 🎨 UX ISSUE

**Root Cause**: Three separate buttons for one logical state machine.

**Current State Machine**:
```
[Not Started] --Start Game--> [Paused] --Run--> [Running] --Pause--> [Paused]
```

**Proposed State Machine**:
```
State: NOT_STARTED   → Button: "Start Game"  → Action: Initialize board
State: PAUSED        → Button: "Run"          → Action: Start continuous loop
State: RUNNING       → Button: "Pause"        → Action: Pause loop
```

**Fix**: Single button that changes text/action based on game state

**Changes needed**:
1. Add game state enum: `NOT_STARTED | PAUSED | RUNNING`
2. Replace 3 buttons with 1 dynamic button
3. Update button text/handler based on state
4. Keep "Step" button separate (useful for debugging)

**Priority**: MEDIUM - Improves UX clarity

---

### Issue 6: Missing Reset Button 🎨 FEATURE REQUEST

**Requirement**: Button to reset board to empty and round to 0.

**Implementation**:
1. Add `reset()` method to `Game` class
2. Clear board grid
3. Reset round counter to 0
4. Mark all cells dirty
5. Render empty board
6. Reset game state to `NOT_STARTED`
7. Update statistics to show zeros

**Priority**: MEDIUM - Useful feature

---

## 📋 Recommended Fix Order

### Priority 1: Critical Bugs
1. ✅ **Red border on fruits** - Confusing, breaks visual clarity

### Priority 2: UX Improvements
2. ✅ **Combat flash intensity** - Too overwhelming, reduce opacity
3. ✅ **FPS counter rename** - Change to "Rounds/sec" for clarity

### Priority 3: UI Enhancements  
4. ⏳ **Button consolidation** - Cleaner UI, better UX
5. ⏳ **Reset button** - Useful feature
6. ⏳ **FPS placement** - Move to header (optional)

---

## 🔧 Quick Fix Implementation

### Fix 1: Red Border on Fruits
**File**: `src/core/Renderer.ts:103`
```typescript
// Change from:
else if (entity.isInjured(DEFAULT_CONFIG.board.injuredThreshold)) {

// To:
else if ((entity instanceof Human || entity instanceof Wolf) && 
         entity.isInjured(DEFAULT_CONFIG.board.injuredThreshold)) {
```

### Fix 2: Combat Flash Intensity
**File**: `src/core/Renderer.ts:128`
```typescript
// Change from:
color = `rgba(255, 0, 0, ${alpha * 0.5})`;

// To:
color = `rgba(255, 0, 0, ${alpha * 0.25})`;
```

### Fix 3: FPS Counter Label
**File**: `src/core/Renderer.ts:170` and add to `index.html`
- Option A: Change canvas text from "FPS" to "Rounds/sec"
- Option B: Move to HTML header as "Updates/sec: 5"

---

## 🚀 Implementation Plan

**Phase 1 (Immediate - 10 min)**:
- Fix red border on fruits
- Reduce combat flash intensity
- Rename FPS to "Rounds/sec"

**Phase 2 (Short-term - 30 min)**:
- Consolidate Start/Pause/Run into single state button
- Add Reset button
- Move counter to header (optional)

**Would you like me to implement Phase 1 fixes now?**
