import { humansIn } from './GameHistory';
import type { EndReason, RoundRecord } from './simulationEvents';

/** Earliest round at which "humans safe" can end the game. */
export const HUMANS_SAFE_MIN_ROUND = 10;

/**
 * Decides when a game ends on its own.
 * - humansExtinct: there were humans at some point (initially or later) and now there are none.
 * - humansSafe (literal rule, user decision): no wolves and no mushrooms, at least one human,
 *   and round ≥ HUMANS_SAFE_MIN_ROUND. Ends the first round this holds.
 */
export class EndConditionTracker {
  private hadHumans = false;

  /** Begin tracking a new game from its initial (round 0) record. */
  start(initial: RoundRecord): void {
    this.hadHumans = humansIn(initial) > 0;
  }

  /** The reason the game ends after the round described by `current`, or null to continue. */
  check(current: RoundRecord): EndReason | null {
    const humans = humansIn(current);
    if (humans > 0) this.hadHumans = true;
    if (this.hadHumans && humans === 0) return 'humansExtinct';
    if (current.wolves === 0 && current.mushrooms === 0 && humans > 0 && current.round >= HUMANS_SAFE_MIN_ROUND) {
      return 'humansSafe';
    }
    return null;
  }
}
