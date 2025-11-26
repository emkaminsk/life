# Critical Fixes Applied - 2025-11-26

## ✅ Fixes Implemented

### Fix 1: Red Border on Fruits 🐛 FIXED
**Problem**: All fruits showed red borders (health=1 < injuredThreshold=50)

**Solution**: Added type check to only show injured border on creatures
```typescript
// BEFORE
else if (entity.isInjured(DEFAULT_CONFIG.board.injuredThreshold)) {

// AFTER  
else if ((entity instanceof Human || entity instanceof Wolf) &&
         entity.isInjured(DEFAULT_CONFIG.board.injuredThreshold)) {
```

**File**: `src/core/Renderer.ts:104`

---

### Fix 2: Combat Flash Too Overwhelming 🎨 FIXED
**Problem**: Combat flashes at 50% opacity were too bright and distracting

**Solution**: Reduced opacity from 50% to 25%
```typescript
// BEFORE
case 'combat':
  color = `rgba(255, 0, 0, ${alpha * 0.5})`;

// AFTER
case 'combat':
  color = `rgba(255, 0, 0, ${alpha * 0.25})`;
```

**File**: `src/core/Renderer.ts:143`

---

### Fix 3: FPS Counter Placement & Naming 🎨 FIXED
**Problem**: 
1. FPS counter drawn on canvas (overlays game board)
2. Shows 5-6 which seemed wrong (actually correct - 200ms per round = 5 rounds/sec)
3. "FPS" label misleading

**Solution**: 
1. Moved counter to HTML header bar (next to Round counter)
2. Renamed "FPS" to "Rounds/sec" for accuracy
3. Removed canvas drawing, added HTML display
4. Updates via DOM every 100ms

**Files**: 
- `src/core/Renderer.ts:170-187` - Removed canvas drawing, added getCurrentFps() getter
- `index.html:166-169` - Added Rounds/sec display in header
- `src/main.ts:24-30, 53` - Added updateRoundsPerSec() function

---

## 📋 Build Status

**Before**: 16.97 kB (22 modules)
**After**: 17.02 kB (22 modules) - minimal size increase

**Build**: ✅ Successful
**TypeScript**: ✅ No errors

---

## 🧪 Testing Recommendations

1. **Red Border Fix**: 
   - ✅ Fruits should NOT have red borders
   - ✅ Injured creatures (health <50) SHOULD have red borders
   - ✅ Pregnant females should have pink borders (takes priority over red)

2. **Combat Flash**:
   - ✅ Red flashes should be visible but less overwhelming
   - ✅ Should be able to see which creatures are fighting

3. **Rounds/sec Counter**:
   - ✅ Should show in header next to Round counter
   - ✅ Should display "5" when game running (200ms intervals)
   - ✅ No text overlay on canvas

---

## 📝 Added to Todo List

The following UI enhancements were added to `.ai/todo.md` Phase 7:

### Phase 7: UI/UX Enhancements
1. **Button Consolidation**: Merge Start/Pause/Run into single state-based button
2. **Reset Button**: Add reset functionality to clear board and restart

---

## 🎯 Next Steps

User is testing the game now. Awaiting feedback before proceeding with Phase 7 enhancements.
