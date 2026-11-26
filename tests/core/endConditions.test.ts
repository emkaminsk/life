import { describe, it, expect } from 'vitest';
import { EndConditionTracker, HUMANS_SAFE_MIN_ROUND } from '../../src/core/endConditions';
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

describe('EndConditionTracker', () => {
  it('humansExtinct when the initial humans are all gone', () => {
    const tracker = new EndConditionTracker();
    tracker.start(rec(0, { males: 2, females: 1, wolves: 3 }));
    expect(tracker.check(rec(1, { males: 1, wolves: 3 }))).toBeNull();
    expect(tracker.check(rec(2, { wolves: 3 }))).toBe('humansExtinct');
  });

  it('humansExtinct also counts humans that appeared later (e.g. placed after start)', () => {
    const tracker = new EndConditionTracker();
    tracker.start(rec(0, { wolves: 1 }));
    expect(tracker.check(rec(1, { wolves: 1 }))).toBeNull(); // never had humans → keeps going
    expect(tracker.check(rec(2, { females: 1, wolves: 1 }))).toBeNull();
    expect(tracker.check(rec(3, { wolves: 1 }))).toBe('humansExtinct');
  });

  it('a game that never had humans never ends by itself', () => {
    const tracker = new EndConditionTracker();
    tracker.start(rec(0));
    for (let round = 1; round <= 30; round++) expect(tracker.check(rec(round))).toBeNull();
  });

  it(`humansSafe from round ${HUMANS_SAFE_MIN_ROUND} when there are humans and no wolves or mushrooms`, () => {
    const tracker = new EndConditionTracker();
    const safe = { males: 1, females: 1, dogs: 2, fruits: 5 };
    tracker.start(rec(0, safe));
    expect(HUMANS_SAFE_MIN_ROUND).toBe(10);
    expect(tracker.check(rec(9, safe))).toBeNull();
    expect(tracker.check(rec(10, safe))).toBe('humansSafe');
  });

  it('humansSafe requires both wolves and mushrooms to be gone', () => {
    const tracker = new EndConditionTracker();
    tracker.start(rec(0, { males: 1 }));
    expect(tracker.check(rec(12, { males: 1, wolves: 1 }))).toBeNull();
    expect(tracker.check(rec(12, { males: 1, mushrooms: 1 }))).toBeNull();
    expect(tracker.check(rec(12, { males: 1 }))).toBe('humansSafe');
  });

  it('start() resets the memory of earlier humans', () => {
    const tracker = new EndConditionTracker();
    tracker.start(rec(0, { males: 1, wolves: 1 }));
    tracker.start(rec(0, { wolves: 1 }));
    expect(tracker.check(rec(1, { wolves: 1 }))).toBeNull();
  });
});
