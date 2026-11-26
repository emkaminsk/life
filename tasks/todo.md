# Plan: challenges, classic Life, start-paused, mobile (branch `feat/challenges-classic-mobile`)

Previous round: `tasks/archive/2026-11-todo-and-review.md` (its Review lists the inputs for this round).

## User decisions
- **Challenges**: optional picker in config (default *Free play*). The HUD shows the goal and a progress bar. Reaching the goal ends the game as `challengeComplete`; humans dying out first ends it as `challengeFailed`. Constraint challenges lock config fields.
- **Classic Life**: rule presets Conway B3/S23, HighLife B36/S23, Seeds B2/S and Day & Night B3678/S34678, plus a custom B/S rule. Starts from a random fill (density slider), a centred pattern preset, or drawing by tap/click. Edges wrap around (toroidal).
- **Humans safe**: unchanged (literal rule); the gap stays in TODO.md. It is disabled while a challenge is active.
- **Start**: two buttons, *Start* and *Start paused* (paused → step round by round).

## Shared contracts (written by W0, frozen afterwards)
```ts
// src/ui/ConfigPanel.ts
export type GameMode = 'ecosystem' | 'classic'
export interface StartOptions { setupMode: SetupMode; startPaused?: boolean; challengeId?: ChallengeId; mode?: GameMode; classic?: ClassicConfig }
export interface ConfigPanelPlugin {
  validate?(mode: GameMode): number            // problems, 0 = valid
  startOptions?(): Partial<StartOptions>
  lockedFields?(): ConfigLocks                 // input id → forced value; disabled + 🔒 hint
  save?(): unknown; load?(data: unknown): void
}
// ConfigPanel: registerPlugin(p), refresh(), getMode(); classic mode hides .ecosystem-only and skips their validation

// src/core/challenges.ts
export type ChallengeId = 'free'|'survive'|'clearDangers'|'babyBoom'|'noDogs'|'noFruits'|'doublePopulation'|'balance'|'noCrowding'|'wiseElders'
export type ChallengeStatus = 'inProgress'|'complete'|'failed'
export type ChallengeFailReason = 'humansExtinct'|'overcrowdingDeath'
export type ConfigLocks = Readonly<Record<string, number>>
export interface ChallengeProgress { id: Exclude<ChallengeId,'free'>; value: number; target: number; status: ChallengeStatus; failReason?: ChallengeFailReason; round: number }
export interface ChallengeDef<S = unknown> {
  id: Exclude<ChallengeId,'free'>; emoji: string; locks: ConfigLocks; forbiddenKinds?: readonly PlaceableKind[]
  init(initial: RoundRecord): S; step(state: S, record: RoundRecord): S; progress(state: S, round: number): Omit<ChallengeProgress,'id'>
}
export const CHALLENGES: readonly ChallengeDef<any>[]
export function getChallenge(id?: ChallengeId): ChallengeDef<any> | null
export function evaluateChallenge(def: ChallengeDef<any>, records: readonly RoundRecord[]): ChallengeProgress
export function sanitizeLayout(def: ChallengeDef<any> | null, layout: BoardLayout): BoardLayout
// simulationEvents: EndReason += 'challengeComplete' | 'challengeFailed'
// Game: setChallenge(def|null) (throws while locked), getChallengeProgress(): ChallengeProgress|null
// gameSummary: summarize(records, reason, challenge?) → GameSummary.challenge?
// src/ui/challenge: createChallengePicker(mount, panel): ConfigPanelPlugin & {destroy()}
//                   createChallengeHud(mount): { show(p), update(p), hide(), destroy() }

// src/classic/types.ts, ClassicSession.ts, ClassicConfigForm.ts
export type ClassicStart = {kind:'random'; density:number} | {kind:'pattern'; patternId:string} | {kind:'draw'}
export interface ClassicConfig { width: number; height: number; rule: string; start: ClassicStart }
export interface ClassicSession extends ControllableGame {
  begin(config: ClassicConfig, opts: {startPaused: boolean}): void   // 'draw' always starts paused
  end(): void; setSpeed(ms: number): void; fit(availW: number, availH: number): void
  getGeneration(): number; isOver(): boolean; destroy(): void
  onRoundComplete?(): void; onStepComplete?(): void; onGameOver?(): void
}
export function createClassicSession(canvas: HTMLCanvasElement, panel: HTMLElement): ClassicSession
export function createClassicConfigForm(mount: HTMLElement, panel: ConfigPanel): ConfigPanelPlugin & { read(): ClassicConfig; destroy(): void }
```
`app.ts` drives both engines through one `GameControls` with a proxy: `active = () => mode === 'classic' ? classic : game`.

## Challenge set
| id | goal | locks | fails early |
|---|---|---|---|
| survive | reach round 300 | – | extinction |
| clearDangers | 0 wolves and 0 mushrooms at the end of the same round | – | extinction |
| babyBoom | 100 births | – | extinction |
| noDogs | survive 200 rounds | dog spawn 0 | extinction |
| noFruits | survive 100 rounds | fruit spawn 0 | extinction |
| doublePopulation | humans ≥ 2× initial (min 10) | – | extinction |
| balance | humans within ±25% of initial for 100 rounds in a row | – | extinction |
| noCrowding | survive 150 rounds | – | first overcrowding death |
| wiseElders | 25 humans die of old age | – | extinction |

Final status is decided only from round 1. Failure beats completion in the same round. A win needs at least one living human.

## Workstreams (disjoint files; parallel ones run in worktrees)
Phase 1 (parallel)
- [ ] **W0 Foundation + start-paused + control bugs**: `index.html` (start-paused button, mode radios, mounts `#challengeMount #classicConfigMount #challengePanel #classicPanel #classicCanvas`, `.ecosystem-only/.classic-only` + `body[data-mode]`), `src/app.ts` (mode dispatch, control proxy, challenge wiring), `ConfigPanel.ts` (plugin API, locks, mode switch, two buttons), `controls.ts` (`begin(paused)`, pause()-over bug, `reportStartError` → idle), `dialog.ts` leak, i18n `types.ts`/`translations.ts` + stub sections `challenges.ts`/`classic.ts`, `simulationEvents.ts` EndReason, summary.ts endReason strings, `Game.ts`/`gameSummary.ts` stubs, stub files for B/C. Tests: app, ConfigPanel, controls.
- [ ] **W-D Mobile setup**: `src/ui/setup/**`, `src/i18n/sections/setup.ts`, `tests/ui/setup/**`. CSS collapse fix, `fitCellSize` for narrow screens, Pointer Events (tap and drag-select on touch, tap palette then tap board instead of HTML5 DnD), help text mentions tap, flat setup header.

Phase 2 (parallel, after W0 is merged)
- [ ] **W-B Challenges**: `src/core/{challenges,endConditions,Game,gameSummary}.ts`, `src/ui/{SummaryDialog.ts,summary.css}`, `src/ui/challenge/**`, i18n `challenges.ts`/`summary.ts`, tests. Also: 0 humans at start → `humansExtinct` after round 1; summary table readable on phones.
- [ ] **W-C Classic Life**: `src/classic/**`, i18n `classic.ts`, `tests/classic/**`.
- [ ] **W-R Responsive shell**: `index.html` CSS + `src/app.ts` `fitCanvas` (board fits width *and* height), compact control grid on phones, compact config footer at `max-height:500px`, `@media (pointer: coarse)` 44px tap targets, trait-panel css, tooltip/debounce cleanup in `destroy()`.

Phase 3
- [ ] **W-E Integration** (main session): merge; `SetupView.open({disabledKinds})` fed from the challenge; rules text for challenges and classic; CLAUDE.md/README/PRD/TODO.md; full gates; Playwright smoke on phone and desktop with screenshots.

## Verification gates (every workstream)
`npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run format:check`; coverage stays ≥ 95% statements on touched files. Behaviour tests, `Random.seed()`.

## Review
(filled in at the end)
