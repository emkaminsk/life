import { describe, it, expect } from 'vitest';
import type { ChallengeProgress } from '../../src/core/challenges';
import { checkEnd, HUMANS_SAFE_MIN_ROUND } from '../../src/core/endConditions';
import { emptyRoundEvents } from '../../src/core/GameHistory';
import type { RoundRecord } from '../../src/core/simulationEvents';

function rec(round: number, counts: Partial<Omit<RoundRecord, 'round' | 'events'>> = {}): RoundRecord {
  return {
    round,
    males: 0,
    females: 0,
    pregnant: 0,
    wolves: 0,
    dogs: 0,
    fruits: 0,
    mushrooms: 0,
    ...counts,
    events: emptyRoundEvents(),
  };
}

const progress = (status: ChallengeProgress['status'], round = 5): ChallengeProgress => ({
  id: 'survive',
  value: 1,
  target: 300,
  status,
  round,
});

describe('checkEnd without a challenge', () => {
  it('humansExtinct when no humans are left after a round', () => {
    expect(checkEnd(rec(1, { males: 1, wolves: 3 }))).toBeNull();
    expect(checkEnd(rec(2, { wolves: 3 }))).toBe('humansExtinct');
  });

  it('a game that starts without humans ends with humansExtinct after round 1', () => {
    expect(checkEnd(rec(0, { wolves: 1 }))).toBeNull(); // round 0 never ends a game
    expect(checkEnd(rec(1, { wolves: 1 }))).toBe('humansExtinct');
    expect(checkEnd(rec(1), null)).toBe('humansExtinct');
  });

  it(`humansSafe from round ${HUMANS_SAFE_MIN_ROUND} when there are humans and no wolves or mushrooms`, () => {
    const safe = { males: 1, females: 1, dogs: 2, fruits: 5 };
    expect(HUMANS_SAFE_MIN_ROUND).toBe(10);
    expect(checkEnd(rec(9, safe))).toBeNull();
    expect(checkEnd(rec(10, safe))).toBe('humansSafe');
  });

  it('humansSafe requires both wolves and mushrooms to be gone', () => {
    expect(checkEnd(rec(12, { males: 1, wolves: 1 }))).toBeNull();
    expect(checkEnd(rec(12, { males: 1, mushrooms: 1 }))).toBeNull();
    expect(checkEnd(rec(12, { males: 1 }))).toBe('humansSafe');
  });
});

describe('checkEnd with a challenge', () => {
  it('humansSafe is disabled', () => {
    expect(checkEnd(rec(12, { males: 1 }), progress('inProgress', 12))).toBeNull();
  });

  it('complete → challengeComplete, failed → challengeFailed', () => {
    expect(checkEnd(rec(5, { males: 1 }), progress('complete'))).toBe('challengeComplete');
    expect(checkEnd(rec(5, { males: 1 }), progress('failed'))).toBe('challengeFailed');
  });

  it('extinction always fails the challenge', () => {
    expect(checkEnd(rec(5), progress('failed'))).toBe('challengeFailed');
    expect(checkEnd(rec(5), progress('inProgress'))).toBe('challengeFailed');
    expect(checkEnd(rec(5), progress('complete'))).toBe('challengeFailed');
  });

  it('round 0 never ends a game', () => {
    expect(checkEnd(rec(0), progress('failed', 0))).toBeNull();
  });
});
