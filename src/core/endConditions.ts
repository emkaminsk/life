import type { ChallengeProgress } from './challenges';
import { humansIn } from './GameHistory';
import type { EndReason, RoundRecord } from './simulationEvents';

/** Earliest round at which "humans safe" can end the game. */
export const HUMANS_SAFE_MIN_ROUND = 10;

/**
 * Decides whether the game ends after the round described by `current` (null = continue).
 * Round 0 (the initial board) never ends a game.
 *
 * Free play (no challenge):
 * - humansExtinct: no humans left after a round ≥ 1 (also when there were none at the start).
 * - humansSafe (literal rule, user decision): no wolves and no mushrooms, at least one human,
 *   and round ≥ HUMANS_SAFE_MIN_ROUND.
 *
 * With a challenge (its progress after `current`), humansSafe is disabled:
 * - challengeFailed: the challenge failed, or no humans are left.
 * - challengeComplete: the challenge is complete.
 */
export function checkEnd(current: RoundRecord, challenge?: ChallengeProgress | null): EndReason | null {
  if (current.round < 1) return null;
  const humans = humansIn(current);
  if (challenge) {
    if (humans === 0 || challenge.status === 'failed') return 'challengeFailed';
    return challenge.status === 'complete' ? 'challengeComplete' : null;
  }
  if (humans === 0) return 'humansExtinct';
  if (current.wolves === 0 && current.mushrooms === 0 && current.round >= HUMANS_SAFE_MIN_ROUND) {
    return 'humansSafe';
  }
  return null;
}
