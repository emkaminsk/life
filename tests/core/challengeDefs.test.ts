import { describe, expect, it } from 'vitest';
import {
  BALANCE_TOLERANCE,
  CHALLENGES,
  ChallengeTracker,
  type ChallengeDef,
  evaluateChallenge,
  getChallenge,
  sanitizeLayout,
} from '../../src/core/challenges';
import type { ChallengeId } from '../../src/core/challenges';
import type { DeathRecord, RoundRecord } from '../../src/core/simulationEvents';

interface RecOptions {
  males?: number;
  females?: number;
  wolves?: number;
  mushrooms?: number;
  births?: number;
  deaths?: DeathRecord[];
}

/** A synthetic round record; humans default to 2 (1 male + 1 female). */
function rec(round: number, o: RecOptions = {}): RoundRecord {
  return {
    round,
    males: o.males ?? 1,
    females: o.females ?? 1,
    pregnant: 0,
    wolves: o.wolves ?? 0,
    dogs: 0,
    fruits: 0,
    mushrooms: o.mushrooms ?? 0,
    events: {
      deaths: o.deaths ?? [],
      births: o.births ?? 0,
      newPregnancies: 0,
      fruitsEaten: 0,
      mushroomsEaten: 0,
    },
  };
}

/** Round 0 plus rounds 1..n built by `make(round)`. */
function history(n: number, make: (round: number) => RoundRecord = (r) => rec(r), initial = rec(0)): RoundRecord[] {
  const records = [initial];
  for (let r = 1; r <= n; r++) records.push(make(r));
  return records;
}

// biome-ignore lint/suspicious/noExplicitAny: each challenge has its own state type
function def(id: Exclude<ChallengeId, 'free'>): ChallengeDef<any> {
  const d = getChallenge(id);
  if (!d) throw new Error(`missing challenge ${id}`);
  return d;
}

const extinct = (round: number) => rec(round, { males: 0, females: 0 });

describe('challenge set', () => {
  it('has the 9 challenges of the plan, each with an emoji and found by getChallenge', () => {
    expect(CHALLENGES.map((c) => c.id)).toEqual([
      'survive',
      'clearDangers',
      'babyBoom',
      'noDogs',
      'noFruits',
      'doublePopulation',
      'balance',
      'noCrowding',
      'wiseElders',
    ]);
    for (const c of CHALLENGES) {
      expect(c.emoji.length).toBeGreaterThan(0);
      expect(getChallenge(c.id)).toBe(c);
    }
  });

  it('only noDogs and noFruits lock config fields and forbid kinds', () => {
    expect(def('noDogs').locks).toEqual({ spawnDog: 0, dogSpawn: 0 });
    expect(def('noDogs').forbiddenKinds).toEqual(['dog']);
    expect(def('noFruits').locks).toEqual({ spawnFruit: 0, fruitSpawn: 0 });
    expect(def('noFruits').forbiddenKinds).toEqual(['fruit']);
    for (const c of CHALLENGES.filter((c) => c.id !== 'noDogs' && c.id !== 'noFruits')) {
      expect(c.locks).toEqual({});
      expect(c.forbiddenKinds ?? []).toEqual([]);
    }
  });

  it('round 0 is never final, even when the goal already holds or nobody is alive', () => {
    const goalAtStart = rec(0, { births: 500 });
    for (const c of CHALLENGES) {
      expect(evaluateChallenge(c, [goalAtStart]).status).toBe('inProgress');
      expect(evaluateChallenge(c, [rec(0, { males: 0, females: 0 })]).status).toBe('inProgress');
    }
    // clearDangers: no dangers at the start is not yet a win
    expect(evaluateChallenge(def('clearDangers'), [rec(0)])).toMatchObject({ status: 'inProgress', round: 0 });
  });

  it('every challenge fails with humansExtinct when no human is left in a round ≥ 1', () => {
    for (const c of CHALLENGES) {
      const wolf = (round: number) => rec(round, { wolves: 1 });
      const p = evaluateChallenge(c, [wolf(0), wolf(1), extinct(2)]);
      expect(p).toMatchObject({ id: c.id, status: 'failed', failReason: 'humansExtinct', round: 2 });
    }
  });

  it('a decided status stays frozen in later records', () => {
    const p = evaluateChallenge(def('babyBoom'), [rec(0), extinct(1), rec(2, { births: 200 })]);
    expect(p).toMatchObject({ status: 'failed', failReason: 'humansExtinct', value: 0, round: 2 });
  });
});

describe('survive-type challenges', () => {
  it.each([
    ['survive', 300],
    ['noDogs', 200],
    ['noFruits', 100],
    ['noCrowding', 150],
  ] as const)('%s: complete in round %i', (id, target) => {
    const before = evaluateChallenge(def(id), history(target - 1));
    expect(before).toMatchObject({ value: target - 1, target, status: 'inProgress' });
    expect(evaluateChallenge(def(id), history(target))).toMatchObject({ value: target, target, status: 'complete' });
  });

  it('failure beats completion in the same round', () => {
    expect(
      evaluateChallenge(
        def('noFruits'),
        history(100, (r) => (r === 100 ? extinct(r) : rec(r))),
      ),
    ).toMatchObject({
      status: 'failed',
      failReason: 'humansExtinct',
    });
  });

  it('noCrowding fails on the first overcrowding death of any species', () => {
    const crowded = (round: number) => rec(round, { deaths: [{ species: 'wolf', cause: 'overcrowding', age: 3 }] });
    const p = evaluateChallenge(def('noCrowding'), [rec(0), rec(1), crowded(2), rec(3)]);
    expect(p).toMatchObject({ status: 'failed', failReason: 'overcrowdingDeath', value: 2, round: 3 });
    // other causes of death are fine
    const fine = rec(1, { deaths: [{ species: 'male', cause: 'wolfAttack', age: 3 }] });
    expect(evaluateChallenge(def('noCrowding'), [rec(0), fine]).status).toBe('inProgress');
  });

  it('noCrowding: an overcrowding death in the winning round still fails', () => {
    const p = evaluateChallenge(
      def('noCrowding'),
      history(150, (r) =>
        r === 150 ? rec(r, { deaths: [{ species: 'female', cause: 'overcrowding', age: 9 }] }) : rec(r),
      ),
    );
    expect(p).toMatchObject({ status: 'failed', failReason: 'overcrowdingDeath' });
  });
});

describe('clearDangers', () => {
  it('shows dangers removed out of the initial count and completes at 0 wolves + 0 mushrooms', () => {
    const c = def('clearDangers');
    const start = rec(0, { wolves: 3, mushrooms: 2 });
    expect(evaluateChallenge(c, [start])).toMatchObject({ value: 0, target: 5 });
    expect(evaluateChallenge(c, [start, rec(1, { wolves: 1, mushrooms: 2 })])).toMatchObject({
      value: 2,
      status: 'inProgress',
    });
    // more dangers than at the start never shows a negative value
    expect(evaluateChallenge(c, [start, rec(1, { wolves: 9, mushrooms: 9 })]).value).toBe(0);
    expect(evaluateChallenge(c, [start, rec(1, { wolves: 1 }), rec(2)])).toMatchObject({
      value: 5,
      target: 5,
      status: 'complete',
      round: 2,
    });
  });

  it('wolves gone but a mushroom left is not complete', () => {
    expect(evaluateChallenge(def('clearDangers'), [rec(0, { wolves: 1 }), rec(1, { mushrooms: 1 })]).status).toBe(
      'inProgress',
    );
  });

  it('a board without dangers completes in round 1 (0/0); the last human dying fails it', () => {
    expect(evaluateChallenge(def('clearDangers'), [rec(0), rec(1)])).toMatchObject({
      value: 0,
      target: 0,
      status: 'complete',
    });
    expect(evaluateChallenge(def('clearDangers'), [rec(0, { wolves: 1 }), extinct(1)])).toMatchObject({
      status: 'failed',
    });
  });
});

describe('babyBoom and wiseElders', () => {
  it('babyBoom counts births up to 100 (value capped at the target)', () => {
    const c = def('babyBoom');
    expect(
      evaluateChallenge(
        c,
        history(9, () => rec(1, { births: 10 })),
      ),
    ).toMatchObject({
      value: 90,
      target: 100,
      status: 'inProgress',
    });
    expect(
      evaluateChallenge(
        c,
        history(11, () => rec(1, { births: 10 })),
      ),
    ).toMatchObject({
      value: 100,
      status: 'complete',
    });
  });

  it('babyBoom: births in round 0 do not count', () => {
    expect(evaluateChallenge(def('babyBoom'), [rec(0, { births: 99 }), rec(1, { births: 1 })]).value).toBe(1);
  });

  it('wiseElders counts human deaths of old age only', () => {
    const deaths: DeathRecord[] = [
      { species: 'male', cause: 'oldAge', age: 90 },
      { species: 'female', cause: 'oldAge', age: 90 },
      { species: 'wolf', cause: 'oldAge', age: 30 },
      { species: 'male', cause: 'wolfAttack', age: 20 },
    ];
    const c = def('wiseElders');
    expect(evaluateChallenge(c, [rec(0), rec(1, { deaths })])).toMatchObject({ value: 2, target: 25 });
    expect(
      evaluateChallenge(
        c,
        history(13, (r) => rec(r, { deaths })),
      ),
    ).toMatchObject({
      value: 25,
      status: 'complete',
      round: 13,
    });
  });

  it('wiseElders: the last elder dying with the last human is a failure', () => {
    const many: DeathRecord[] = Array.from({ length: 25 }, () => ({ species: 'male', cause: 'oldAge', age: 80 }));
    expect(
      evaluateChallenge(def('wiseElders'), [rec(0), rec(1, { males: 0, females: 0, deaths: many })]),
    ).toMatchObject({ status: 'failed', failReason: 'humansExtinct', value: 25 });
  });
});

describe('doublePopulation', () => {
  it('target is 2 × the initial humans', () => {
    const c = def('doublePopulation');
    const start = rec(0, { males: 4, females: 4 });
    expect(evaluateChallenge(c, [start, rec(1, { males: 7, females: 8 })])).toMatchObject({
      value: 15,
      target: 16,
      status: 'inProgress',
    });
    expect(evaluateChallenge(c, [start, rec(1, { males: 8, females: 9 })])).toMatchObject({
      value: 16,
      target: 16,
      status: 'complete',
    });
  });

  it('target is at least 10', () => {
    const c = def('doublePopulation');
    expect(evaluateChallenge(c, [rec(0, { males: 1, females: 1 })]).target).toBe(10);
    expect(evaluateChallenge(c, [rec(0, { males: 0, females: 0 })]).target).toBe(10);
    expect(evaluateChallenge(c, [rec(0), rec(1, { males: 2, females: 2 })]).status).toBe('inProgress');
  });
});

describe('balance', () => {
  const c = def('balance');
  const start = rec(0, { males: 10, females: 10 });
  const humans = (round: number, n: number) => rec(round, { males: Math.floor(n / 2), females: Math.ceil(n / 2) });

  it('counts a streak of rounds within ±25% of the initial humans; target 100', () => {
    expect(BALANCE_TOLERANCE).toBe(0.25);
    const records = [start, humans(1, 15), humans(2, 25), humans(3, 20)];
    expect(evaluateChallenge(c, records)).toMatchObject({ value: 3, target: 100, status: 'inProgress' });
  });

  it('a round outside the band resets the streak', () => {
    const records = [start, humans(1, 20), humans(2, 20), humans(3, 26), humans(4, 20)];
    expect(evaluateChallenge(c, records).value).toBe(1);
    expect(evaluateChallenge(c, [start, humans(1, 20), humans(2, 14)]).value).toBe(0);
  });

  it('completes after 100 rounds in a row', () => {
    const records = history(110, (r) => humans(r, r <= 10 ? 40 : 20), start);
    expect(evaluateChallenge(c, records.slice(0, 110))).toMatchObject({ value: 99, status: 'inProgress' });
    expect(evaluateChallenge(c, records)).toMatchObject({ value: 100, status: 'complete', round: 110 });
  });
});

describe('ChallengeTracker (incremental)', () => {
  it('gives the same progress as evaluateChallenge after every record', () => {
    const records = history(40, (r) =>
      rec(r, {
        males: 1 + (r % 5),
        females: 1 + (r % 3),
        wolves: Math.max(0, 5 - r),
        births: r % 4,
        deaths: r % 7 === 0 ? [{ species: 'male', cause: 'oldAge', age: 70 }] : [],
      }),
    );
    for (const c of CHALLENGES) {
      const tracker = new ChallengeTracker(c, records[0]);
      expect(tracker.progress()).toEqual(evaluateChallenge(c, records.slice(0, 1)));
      for (let i = 1; i < records.length; i++) {
        tracker.step(records[i]);
        expect(tracker.progress()).toEqual(evaluateChallenge(c, records.slice(0, i + 1)));
      }
    }
  });
});

describe('sanitizeLayout', () => {
  const layout = { width: 3, height: 2, cells: ['dog', 'fruit', 'male', null, 'dog', 'wolf'] as const };

  it('removes the forbidden kinds and keeps everything else', () => {
    const copy = { ...layout, cells: [...layout.cells] };
    expect(sanitizeLayout(def('noDogs'), copy)).toEqual({
      width: 3,
      height: 2,
      cells: [null, 'fruit', 'male', null, null, 'wolf'],
    });
    expect(sanitizeLayout(def('noFruits'), copy).cells).toEqual(['dog', null, 'male', null, 'dog', 'wolf']);
    expect(copy.cells).toEqual(layout.cells); // input untouched
  });

  it('returns the layout as is without a challenge or forbidden kinds', () => {
    const copy = { ...layout, cells: [...layout.cells] };
    expect(sanitizeLayout(null, copy)).toBe(copy);
    expect(sanitizeLayout(def('survive'), copy)).toBe(copy);
  });
});
