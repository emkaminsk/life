# Plan: TODO.md features + requirements/test review (branch `feat/todo-and-review-2026-11`)

Sources: `TODO.md`, leftovers in `docs/code-review-plan.md`, and three reviews (requirements R1–R15,
test review T1–T9, feature design F1–F8). Review reports live in the session scratchpad; the
contracts that matter are copied below.

## User decisions
- **"Humans safe" win (TODO)**: literal rule. The game ends with `humansSafe` the first round
  `wolves === 0 && mushrooms === 0 && humans > 0 && round >= 10`. Open gap recorded in TODO.md
  (respawn rates adaptive to population + sustained-for-N-rounds rule).
- **Humans extinct**: game ends when `males + females === 0` (and nobody is pregnant, because a dead
  female has no baby, so it simply means 0 humans).

## Decisions made by default (document in PRD)
- Finish → pause, show summary (`userFinished`), then config. Reset → straight to config, no summary.
  Finish/Reset halt immediately (no extra round when pressed mid-animation, R12).
- R3 reproduction energy modifier uses the **male's** energy state (PRD 3.16.4).
- R14: drop "max 1000 creatures enforced" from PRD; overcrowding threshold max = board area; soft
  perf warning when expected creatures > 1000.
- R15: 👨 is the male emoji everywhere.

## Shared contracts (created in W0, then frozen)
```ts
// src/core/simulationEvents.ts
type DeathCause = 'wolfAttack'|'maleFight'|'dogAttack'|'humanDefense'|'mushroom'|'metabolism'|'oldAge'|'overcrowding'|'childbirth'|'unknown'
type Species = 'male'|'female'|'wolf'|'dog'
interface DeathRecord { species: Species; cause: DeathCause; age: number }
interface RoundEvents { deaths: DeathRecord[]; births: number; newPregnancies: number; fruitsEaten: number; mushroomsEaten: number }
interface RoundRecord { round: number; males: number; females: number; pregnant: number; wolves: number; dogs: number; fruits: number; mushrooms: number; events: RoundEvents }
type EndReason = 'humansExtinct'|'humansSafe'|'userFinished'
type PlaceableKind = 'male'|'female'|'wolf'|'dog'|'fruit'|'mushroom'
interface BoardLayout { width: number; height: number; cells: (PlaceableKind|null)[] } // row-major
// Entity: deathCause: DeathCause|null; takeDamage(amount, cause?) sets cause only on >0 → ≤0; kill(cause)
// System return values: Death → DeathRecord[]; Birth → {births, deaths: DeathRecord[]};
//   Reproduction → number (new pregnancies); Eating → {fruits, mushrooms}; Movement → existing + deaths: DeathRecord[]
// Genome gains longevity (0.5–2.0, mean 1). Config gains human.avgCaution / avgMetabolism (see R6).
// createEntity(kind, x, y, config) in src/core/entityFactory.ts
// Game (C2): initializeFromLayout(layout, config?), initializeBoardAsync(config?, {onProgress, chunks, yieldToEventLoop}),
//   stop(), onGameOver?(reason), getEndReason(), isOver(), getHistory(): GameHistory
```

## Workstreams (disjoint file ownership; parallel ones run in git worktrees)
- [x] **Fmt** Biome config aligned with code style, src+tests formatted (commit 940f1a0)
- [ ] **W0 Foundation** (alone, first): i18n split into `src/i18n/sections/*.ts`; `simulationEvents.ts`;
      Entity death-cause API; Genome.longevity + GENE_BOUNDS; new config fields; `entityFactory.ts`;
      index.html mount points (`#setupView`, `#summaryModal`, `#traitPanel`, `#appVersion`);
      `Random.test.ts`, remove dead `Random.int`/`getEntitiesInRange` if unused (T).
- [ ] **A Manual setup (F1)**: `BoardLayout.ts`, `src/ui/setup/*` (SetupView, pure keyboard reducer, css), setup i18n.
- [ ] **B Config panel (F2, F3, F1 switch, R11, R14, R6 UI)**: ConfigPanel, configHelp, configValidation,
      config region of index.html, configHelp i18n; tests for Ctrl+S/Ctrl+O, listener leak (T).
- [ ] **C1 Systems I (F5 causes, R2, R5)**: Entity, Combat, Eating (dog immunity), Death (longevity,
      oldAge vs overcrowding with one draw), Birth, Wolf/Dog/Plant entities; replace tautological entity tests (T).
- [ ] **C3 Systems II (R3, R6, R10)**: Human energy states + modifier table, Movement (energy greed/caution,
      desperate males flee, metabolism per actual move + cause), Reproduction (per-male rolls, male energy),
      GenomeUtils (mutation scale, longevity inheritance), TooltipManager (energy + longevity rows).
- [ ] **C2 Game core (F4, F5 history, F7, F1 API)**: Game.ts, GameHistory, endConditions, seeded
      multi-round invariant integration tests, Game guard-branch tests (T).
- [ ] **D Summary & controls (F5 UI, F4 controls, R7, R8, R12)**: gameSummary, SummaryDialog, controls
      `over` state, statistics.ts (alert re-arm, overcrowding indicator), dialog focus-trap tests (T).
- [ ] **E Genome chart (F8, R4)**: genomeStats, TraitChart refactor (shared per-trait ranges, 6 traits,
      i18n legend with current values), TraitPanel.
- [ ] **F App shell (F6, F7 overlay, R9)**: vite define + `src/version.ts`, determinate initProgress,
      rules modal content (rules i18n section + modal markup).
- [ ] **Z Integration** (alone, last): merge, main.ts wiring (`createApp` testable), keyboard blocking,
      docs (PRD/README/CLAUDE.md), TODO.md cleanup, Playwright smoke run, final review.

## Verification gates (every workstream)
`npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run format:check`, coverage ≥ 80%.
Behaviour tests over config-value tests; `Random.seed()` over Math.random sequences.

## Review
(filled in at the end)
