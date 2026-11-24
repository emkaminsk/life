# Code Review & Remediation Plan (2026-11)

Consolidated findings from three parallel reviews (requirements compliance, test
quality/coverage, visual/performance) of `src/` against `.ai/prd.md`, `CLAUDE.md`,
`README.md` and `docs/`. Implemented on branch `claude/code-review-testing-otko2g`.

Baseline: `tsc` clean, 346 tests passing (one flaky), 46% statement coverage
(Renderer, i18n, TooltipManager, TraitChart at 0%), tests not type-checked
(121 type errors), `coverage/` committed. Dense 100×100 board (~4,200 creatures)
ran at ~10 FPS with 733 ms worst frame; ~60% CPU in `MovementSystem` filters.

## Workstreams and file ownership

| WS | Scope | Owns |
|----|-------|------|
| 0 | Infra (done first) | `vitest.config.ts`, `tests/vitest.setup.ts`, `tests/tsconfig.json`, `package.json`, `.gitignore`, `src/utils/Random.ts` |
| A | Simulation correctness & perf | `src/systems/*`, `src/entities/*`, `src/utils/{Gompertz,GenomeUtils}.ts`, `src/core/{Game,Board}.ts`, `src/config.ts`, `src/types.ts`, `tests/{systems,entities,core}/*`, `tests/setup.ts`, `tests/utils/*` |
| B | Rendering & animation | `src/core/{Renderer,AnimationSystem}.ts`, `tests/rendering/*` |
| C | UI, controls, i18n, styling | `index.html`, `src/main.ts`, `src/ui/*`, `src/i18n/*`, `tests/ui/*`, `tests/i18n/*` |
| D | Docs reconciliation | `CLAUDE.md`, `README.md`, `.ai/prd.md` |

## Findings → fixes

### High
| ID | Finding | Fix | WS |
|----|---------|-----|----|
| H1 | Systems read `DEFAULT_CONFIG` (perception, move-toward probabilities, reproduction probability, pregnancy/cooldown, overcrowding, injured threshold); ConfigPanel values silently ignored | Every system takes `execute(board, config)`; entities get config values passed in | A, B |
| H2 | Pausing during movement animation abandons the round (combat…spawn skipped, creatures move twice) | On pause mid-animation, snap positions and finish the round | A |
| H3 | Config never frozen/locked after start | Deep-clone + deep-freeze on start; `updateConfig` refused while a game is in progress; unlocked by `reset()` | A, C |
| H4 | Up arrow runs 1 round instead of 5; no "Run Five Rounds" button | `Game.stepRounds(n)` queue; button + shortcut | A, C |
| H5 | Male-vs-male "both die" always random (health clamped to 0 before compare) | Compare unclamped `initial - damage` | A |
| P1 | Movement is O(creatures × entities) with allocations; "nearest" target is actually first in scan order | Grid scan within perception radius returning true nearest, random tie-break | A |
| P2 | Combat pair dedupe uses `indexOf` inside neighbour loop (O(n²)) | Process only forward neighbours / identity map | A |

### Medium
| ID | Finding | Fix | WS |
|----|---------|-----|----|
| M1 | Dead creatures keep fighting / eating / fathering within the same round | Skip `isDead()` entities in later phases | A |
| M2 | Pregnancy is one round shorter than configured | Don't advance pregnancies started this round | A |
| M3 | Flashes 300–500 ms (spec ≈1 s), stack alpha per cell, freeze when paused | 1000 ms, one effect per cell, self-driven rAF fade loop | A, B |
| M4 | Spawned plants ignore configured heal/damage/ripening; babies use default Gompertz; genome health baseline ignores configured starting health | Pass config through | A |
| M5 | Unclamped Gaussian genome → negative maxHealth/strength/metabolism possible | Clamp genes to sane minimums | A |
| M6 | Validation doesn't block Start; NaN inputs accepted; artificial `max` limits contradict "no upper limits except board size" | Full validation gating Start; remove non-board `max` caps | C |
| M7 | Simulation doesn't auto-start after init (PRD 3.13.6) | Start after initialization | C |
| M8 | Stats panel missing ripe/unripe fruit split and "Total creatures X / fields" (PRD 3.10.1) | Add | C |
| M9 | Step button re-enabled during continuous run; Space on a focused button double-fires | Fix control state machine | C |
| M10 | Ghost sprite fragments after animation; per-frame string keys + `split`, `includes` O(n²) in animation frame | Mark all covered cells (current+previous), typed-array dirty set, `Map.has` lookup | B |
| M11 | No HiDPI; emoji clipped/low (Arial font, middle baseline); 💔 icon 8 px unreadable; dogs never shown injured; threshold absolute not % | DPR-aware canvas & cache, emoji font stack, larger icon, `health/maxHealth` %, include dogs | B |
| M12 | Canvas never fits (100×100 → 2000 px wide page) | Fit cell size to available width (clamped) | B, C |
| M13 | 100 ms polling loop recounts the board + redraws graph even when paused; `Math.max(...history)` overflow | Update per round via `onRoundComplete`; single counting pass; running max | C |
| M14 | "Rounds/sec" shows renderer call rate; no debug FPS | Real rounds/s; FPS only with `?debug` | B, C |

### Low
| ID | Finding | Fix | WS |
|----|---------|-----|----|
| L1 | Randomness not seedable; direct `Math.random` in 5 modules | Central seedable `Random` (done) | 0 |
| L2 | Hard-coded English strings (Pause/Resume, progress, round counter) | i18n keys (EN+PL) | C |
| L3 | CSS: duplicated `.btn-primary`, disabled styles only on one class, low contrast greens, no `:focus-visible`, clickable `div` headers, modals lack dialog roles, notifications via `innerHTML` without `aria-live`, help button overlaps header, no narrow-width layout | CSS/markup fixes | C |
| L4 | Tooltip stale when creature moves under still cursor; tooltip maths assumes canvas px = CSS px | Refresh per round, use bounding rect | C |
| L5 | Unconditional `console.log` in hot paths (50+/round) | `debugLog` behind a flag | A, B |
| L6 | Stale docs (CLAUDE.md method names/lines, "no tests", README borders, PRD "vanilla JavaScript", injured border vs icon) | Reconcile docs to code / decisions | D |

### Test quality (all WS)
- ~40–50% of tests were tautological (asserting config objects or own arithmetic). Replace with behaviour tests that call the system.
- Wrong-argument `board.setEntity(entity, x, y)` calls hidden by tests not being type-checked.
- Random-dependent tests controlled via fragile `mockReturnValueOnce` sequences; use `Random.seed()` or explicit stubs.
- New coverage: phase order, death-after-combat same round, config freeze, pause mid-animation, stepRounds, movement nearest/tie-break/blocked, Gompertz in DeathSystem, overcrowding, Renderer (cache, dirty rects, flash colours, emoji mapping), AnimationSystem, i18n (incl. EN/PL key parity), GenomeUtils, TooltipManager, TraitChart, keyboard handler, statistics.
- Targets: `npm run typecheck` clean; coverage ≥ 80% statements.

## Decisions recorded
- **Injured indicator**: keep the 💔 overlay (Phase 24 deliberately replaced borders); the PRD is updated. Threshold is a % of max health and applies to all creatures.
- **Poison flash**: red (CLAUDE.md/README); PRD US-012 updated.
- **Flash duration**: 1000 ms per spec; one flash per cell (newest wins).
- **Out of scope** (pending in todo): PRD 3.16 energy states, 3.17 longevity, 3.18 genome evolution graph (TraitChart exists but is not yet wired), 3.19 dog mushroom immunity.

## Outcome

| Metric | Before | After |
|--------|--------|-------|
| Tests | 346 (1 flaky, ~40-50% tautological) | 419 behaviour tests, stable across repeated runs |
| Statement coverage | 46% | 98% (thresholds enforced at 80%) |
| Test type errors | 121 (tests not type-checked) | 0 (`npm run typecheck`) |
| Biome lint errors in `src/` | several | 0 |
| Dense 100×100 board (~4,900 entities, headless) | ~10 FPS, 733 ms worst frame | ~19 FPS, 144 ms worst frame |

All High/Medium/Low findings above are implemented, with these remaining items:
- **US-029 real progress bar** for large boards needs a chunked/async `Game.initializeBoard`; the overlay is now honest (indeterminate until done) rather than a fake percentage.
- **TraitChart** (PRD 3.18) is tested and translated but intentionally not wired; it belongs to the pending genome-evolution phase.
- Biome *formatting* (not lint) differences were left alone to keep the diff reviewable; run `npm run format` in a separate commit if desired.
