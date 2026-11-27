import { humansIn } from './GameHistory';
import type { BoardLayout, PlaceableKind, RoundRecord } from './simulationEvents';

/**
 * Challenges (frozen contract, see tasks/todo.md): optional goals for an
 * ecosystem game. A challenge is a pure fold over the round history:
 * init(round 0) → step(state, record) per round → progress(state, round).
 *
 * Common rules (applied by defineChallenge to every challenge):
 * - The status is decided only from round 1 on (round 0 is never final).
 * - No humans left in a round ≥ 1 → failed('humansExtinct').
 * - Failure beats completion in the same round; a win needs at least one living human.
 * - Once decided (complete or failed) the state no longer changes.
 */
export type ChallengeId =
  | 'free'
  | 'survive'
  | 'clearDangers'
  | 'babyBoom'
  | 'noDogs'
  | 'noFruits'
  | 'doublePopulation'
  | 'balance'
  | 'noCrowding'
  | 'wiseElders';

export type ChallengeStatus = 'inProgress' | 'complete' | 'failed';
export type ChallengeFailReason = 'humansExtinct' | 'overcrowdingDeath';

/** Config input id → forced value (the input is disabled and shows a 🔒 hint). */
export type ConfigLocks = Readonly<Record<string, number>>;

export interface ChallengeProgress {
  id: Exclude<ChallengeId, 'free'>;
  value: number;
  target: number;
  status: ChallengeStatus;
  failReason?: ChallengeFailReason;
  round: number;
}

export interface ChallengeDef<S = unknown> {
  id: Exclude<ChallengeId, 'free'>;
  emoji: string;
  locks: ConfigLocks;
  /** Kinds that may not be placed in manual setup (removed by sanitizeLayout). */
  forbiddenKinds?: readonly PlaceableKind[];
  init(initial: RoundRecord): S;
  step(state: S, record: RoundRecord): S;
  progress(state: S, round: number): Omit<ChallengeProgress, 'id'>;
}

type DefinedId = Exclude<ChallengeId, 'free'>;

/** What a challenge adds to the common rules: its own fold, its goal and an optional early failure. */
interface ChallengeSpec<S> {
  id: DefinedId;
  emoji: string;
  locks?: ConfigLocks;
  forbiddenKinds?: readonly PlaceableKind[];
  /** Goal value, fixed from the initial record. */
  target(initial: RoundRecord): number;
  init(initial: RoundRecord): S;
  step(state: S, record: RoundRecord): S;
  /** Value after `record` (shown capped to 0…target). */
  value(state: S, record: RoundRecord): number;
  /** Goal reached after this record (default: value ≥ target). */
  reached?(record: RoundRecord): boolean;
  /** A challenge-specific reason to fail in this record, if any. */
  failure?(record: RoundRecord): ChallengeFailReason | null;
}

/** State of every challenge: the specific fold plus the common bookkeeping. */
export interface ChallengeState<S> {
  readonly inner: S;
  readonly target: number;
  readonly value: number;
  readonly status: ChallengeStatus;
  readonly failReason?: ChallengeFailReason;
}

const clamp = (value: number, target: number) => Math.max(0, Math.min(value, target));

/** Wrap a spec with the common rules (round 0 never final, extinction, failure first, frozen when decided). */
function defineChallenge<S>(spec: ChallengeSpec<S>): ChallengeDef<ChallengeState<S>> {
  return {
    id: spec.id,
    emoji: spec.emoji,
    locks: spec.locks ?? {},
    ...(spec.forbiddenKinds ? { forbiddenKinds: spec.forbiddenKinds } : {}),
    init(initial) {
      const target = spec.target(initial);
      const inner = spec.init(initial);
      return { inner, target, value: clamp(spec.value(inner, initial), target), status: 'inProgress' };
    },
    step(state, record) {
      if (state.status !== 'inProgress') return state;
      const inner = spec.step(state.inner, record);
      const raw = spec.value(inner, record);
      const next = { inner, target: state.target, value: clamp(raw, state.target) };
      if (record.round < 1) return { ...next, status: 'inProgress' };
      const failReason = humansIn(record) === 0 ? 'humansExtinct' : (spec.failure?.(record) ?? null);
      if (failReason) return { ...next, status: 'failed', failReason };
      const reached = spec.reached ? spec.reached(record) : raw >= state.target;
      return { ...next, status: reached ? 'complete' : 'inProgress' };
    },
    progress({ value, target, status, failReason }, round) {
      return failReason ? { value, target, status, failReason, round } : { value, target, status, round };
    },
  };
}

/** Survive until round `rounds` (value = the last round played). */
function survive(id: DefinedId, emoji: string, rounds: number, extra: Partial<ChallengeSpec<null>> = {}) {
  return defineChallenge<null>({
    id,
    emoji,
    target: () => rounds,
    init: () => null,
    step: () => null,
    value: (_, record) => record.round,
    ...extra,
  });
}

/** Sum of `count(record)` over the rounds played (round 0 not included). */
function tally(id: DefinedId, emoji: string, goal: number, count: (record: RoundRecord) => number) {
  return defineChallenge<number>({
    id,
    emoji,
    target: () => goal,
    init: () => 0,
    step: (sum, record) => sum + count(record),
    value: (sum) => sum,
  });
}

const dangersIn = (record: RoundRecord) => record.wolves + record.mushrooms;
const isHuman = (species: string) => species === 'male' || species === 'female';

/** balance: a round counts when the humans are within ±BALANCE_TOLERANCE of the initial number. */
export const BALANCE_TOLERANCE = 0.25;

// biome-ignore lint/suspicious/noExplicitAny: each challenge has its own state type
export const CHALLENGES: readonly ChallengeDef<any>[] = [
  survive('survive', '⏳', 300),
  defineChallenge<number>({
    id: 'clearDangers',
    emoji: '🧹',
    target: dangersIn,
    init: dangersIn, // the initial danger count
    step: (initialDangers) => initialDangers,
    value: (initialDangers, record) => initialDangers - dangersIn(record),
    reached: (record) => dangersIn(record) === 0,
  }),
  tally('babyBoom', '👶', 100, (record) => record.events.births),
  survive('noDogs', '🦴', 200, { locks: { spawnDog: 0, dogSpawn: 0 }, forbiddenKinds: ['dog'] }),
  survive('noFruits', '🍂', 100, { locks: { spawnFruit: 0, fruitSpawn: 0 }, forbiddenKinds: ['fruit'] }),
  defineChallenge<null>({
    id: 'doublePopulation',
    emoji: '📈',
    target: (initial) => Math.max(10, 2 * humansIn(initial)),
    init: () => null,
    step: () => null,
    value: (_, record) => humansIn(record),
  }),
  defineChallenge<{ initial: number; streak: number }>({
    id: 'balance',
    emoji: '⚖️',
    target: () => 100,
    init: (initial) => ({ initial: humansIn(initial), streak: 0 }),
    step: ({ initial, streak }, record) => ({
      initial,
      streak: Math.abs(humansIn(record) - initial) <= initial * BALANCE_TOLERANCE ? streak + 1 : 0,
    }),
    value: ({ streak }) => streak,
  }),
  survive('noCrowding', '🏘️', 150, {
    failure: (record) => (record.events.deaths.some((d) => d.cause === 'overcrowding') ? 'overcrowdingDeath' : null),
  }),
  tally(
    'wiseElders',
    '👴',
    25,
    (record) => record.events.deaths.filter((d) => d.cause === 'oldAge' && isHuman(d.species)).length,
  ),
];

/** The challenge with this id; null for free play, an unknown id or no id. */
// biome-ignore lint/suspicious/noExplicitAny: see CHALLENGES
export function getChallenge(id?: ChallengeId): ChallengeDef<any> | null {
  if (!id || id === 'free') return null;
  return CHALLENGES.find((c) => c.id === id) ?? null;
}

/** Incremental evaluation: start from round 0, step once per completed round (used by Game). */
export class ChallengeTracker {
  private readonly def: ChallengeDef<unknown>;
  private state: unknown;
  private round: number;

  // biome-ignore lint/suspicious/noExplicitAny: see CHALLENGES
  constructor(def: ChallengeDef<any>, initial: RoundRecord) {
    this.def = def;
    this.state = def.init(initial);
    this.round = initial.round;
  }

  step(record: RoundRecord): void {
    this.state = this.def.step(this.state, record);
    this.round = record.round;
  }

  progress(): ChallengeProgress {
    return { id: this.def.id, ...this.def.progress(this.state, this.round) };
  }
}

/**
 * Progress after the last record. `records[0]` is the initial state (round 0).
 * @throws Error when there are no records
 */
// biome-ignore lint/suspicious/noExplicitAny: see CHALLENGES
export function evaluateChallenge(def: ChallengeDef<any>, records: readonly RoundRecord[]): ChallengeProgress {
  if (records.length === 0) throw new Error('evaluateChallenge needs at least the round-0 record');
  const tracker = new ChallengeTracker(def, records[0]);
  for (let i = 1; i < records.length; i++) tracker.step(records[i]);
  return tracker.progress();
}

/** A manual layout without the challenge's forbidden kinds (the same object when nothing is forbidden). */
// biome-ignore lint/suspicious/noExplicitAny: see CHALLENGES
export function sanitizeLayout(def: ChallengeDef<any> | null, layout: BoardLayout): BoardLayout {
  const forbidden = def?.forbiddenKinds ?? [];
  if (forbidden.length === 0) return layout;
  return { ...layout, cells: layout.cells.map((kind) => (kind && forbidden.includes(kind) ? null : kind)) };
}
