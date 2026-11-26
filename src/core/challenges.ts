import type { BoardLayout, PlaceableKind, RoundRecord } from './simulationEvents';

/**
 * Challenges (frozen contract, see tasks/todo.md): optional goals for an
 * ecosystem game. A challenge is a pure fold over the round history:
 * init(round 0) → step(state, record) per round → progress(state, round).
 *
 * W0 stub: the challenge set is empty (W-B fills CHALLENGES).
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

// biome-ignore lint/suspicious/noExplicitAny: each challenge has its own state type
export const CHALLENGES: readonly ChallengeDef<any>[] = [];

/** The challenge with this id; null for free play, an unknown id or no id. */
// biome-ignore lint/suspicious/noExplicitAny: see CHALLENGES
export function getChallenge(id?: ChallengeId): ChallengeDef<any> | null {
  if (!id || id === 'free') return null;
  return CHALLENGES.find((c) => c.id === id) ?? null;
}

/**
 * Progress after the last record. `records[0]` is the initial state (round 0).
 * @throws Error when there are no records
 */
// biome-ignore lint/suspicious/noExplicitAny: see CHALLENGES
export function evaluateChallenge(def: ChallengeDef<any>, records: readonly RoundRecord[]): ChallengeProgress {
  if (records.length === 0) throw new Error('evaluateChallenge needs at least the round-0 record');
  let state = def.init(records[0]);
  for (let i = 1; i < records.length; i++) state = def.step(state, records[i]);
  const round = records[records.length - 1].round;
  return { id: def.id, ...def.progress(state, round) };
}

/** A manual layout without the challenge's forbidden kinds. W0 stub: returns the layout unchanged. */
// biome-ignore lint/suspicious/noExplicitAny: see CHALLENGES
export function sanitizeLayout(_def: ChallengeDef<any> | null, layout: BoardLayout): BoardLayout {
  return layout;
}
