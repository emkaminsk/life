# Manual Testing Guide - Game of Life Simulator

**Quick Start**: `npm run dev` → Open browser → Click "Start Game"

---

## 🎯 Quick Validation (5 minutes)

### 1. Initial Spawn & Rendering
- Click **"Start Game"**
- ✅ Verify: Mixed entities appear (👨 males, 👩 females, 🐺 wolves, 🍏 green fruits)
- ✅ Verify: Statistics panel shows correct counts
- ✅ Verify: FPS counter shows ~60 FPS

### 2. Movement (Rounds 1-5)
- Click **"Run"** or press **Spacebar**
- ✅ Verify: Entities move across board
- ✅ Verify: Old positions clear (no ghost entities)
- ✅ Verify: Statistics counts stay consistent with visible entities

### 3. Visual Effects (Rounds 5-20)
- Let simulation run
- ✅ Red flashes = Combat (male vs male, wolf vs human)
- ✅ Green flashes = Reproduction/Birth
- ✅ Yellow flashes = Eating (human consumes fruit)
- ✅ Red borders = Injured creatures (health <50)
- ✅ Pink borders = Pregnant females

### 4. Fruit System (Rounds 5-15)
- ✅ Fruits start as 🍏 (green - unripe)
- ✅ After 2 rounds → 🍎 (red - ripe)
- ✅ Humans eat ripe fruits (yellow flash, fruit disappears)
- ✅ New fruits spawn randomly in empty cells

### 5. Life Cycle (Rounds 10-30)
- ✅ Pregnancies: Pink border appears on female near male
- ✅ Births: After 3 rounds, baby spawns adjacent (new 👨 or 👩)
- ✅ Deaths: Creatures disappear when health ≤ 0 or age-based
- ✅ Population dynamics: births vs deaths visible in statistics

---

## 🐛 Bug Checklist

### Critical Issues to Watch For
- [ ] **Ghost entities**: Do entities disappear from old positions when moving?
- [ ] **Count mismatch**: Do statistics match visible entities on board?
- [ ] **Visual lag**: Does FPS drop below 30 with <100 creatures?
- [ ] **Stuck simulation**: Does game freeze or stop updating?

### Edge Cases
- [ ] Birth with no space: Console should log "no space available"
- [ ] Injured creatures eating: Red border should disappear after healing
- [ ] Pregnancy priority: Pink border should override red border
- [ ] Fruit ripening: All fruits should ripen after 2 rounds

---

## 🎮 Controls Reference

| Action | Control |
|--------|---------|
| Initialize board | **Start Game** button |
| Run continuous | **Run** button or **Spacebar** |
| Pause/Resume | **Pause** button or **Spacebar** |
| Single step | **Step** button |

---

## 📊 Expected Behavior by Round

**Rounds 1-5**: Movement establishes, first combats
**Rounds 5-10**: Fruits ripen, eating begins
**Rounds 10-15**: First pregnancies occur
**Rounds 15-20**: First births (3 rounds after pregnancy)
**Rounds 20-30**: Population stabilizes, ecosystem dynamics visible
**Rounds 30+**: Age-based deaths start appearing (check console)

---

## 🔍 Console Logging

Open browser DevTools (F12) → Console tab

**Expected logs per round:**
```
=== Round X ===
[Movement] Moved Y creatures
[Combat] Found Z combat pairs
[Eating] Total fruits consumed: N
[Reproduction] M new pregnancies
[Death] Total deaths: A (health: B, age: C)
[Birth] Total births this round: D
[Spawn] Spawned E new fruits
```

---

## ✅ Success Criteria

Simulation is working correctly if:
1. ✅ Statistics match visible entity counts
2. ✅ Entities move smoothly, old positions clear
3. ✅ All visual effects appear (red/green/yellow flashes, borders)
4. ✅ Fruits ripen visually (green → red after 2 rounds)
5. ✅ Life cycle works (pregnancy → birth after 3 rounds)
6. ✅ Population changes over time (not static)
7. ✅ FPS stays above 30 with reasonable entity counts

---

## 🚨 If Something Goes Wrong

**Issue**: Statistics don't match visual count
- **Check**: Are there ghost entities (old positions not clearing)?
- **Fix**: Verify latest build has dirty rectangle fix

**Issue**: No visual effects appearing
- **Check**: Are combats/eating/births happening? (check console)
- **Try**: Let simulation run longer (20+ rounds)

**Issue**: Performance problems (FPS <30)
- **Check**: How many entities? (should handle 100-200)
- **Try**: Restart simulation with fresh board

**Issue**: Simulation stops updating
- **Check**: Browser console for errors
- **Try**: Refresh page and restart

---

**Current Build**: 16.97 kB (22 modules)
**Fixed Issues**: Dirty rectangle bug (ghost entities) - RESOLVED
