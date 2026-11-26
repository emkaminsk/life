import { describe, expect, it } from 'vitest';
import { crossingRounds, MAX_CONCLUSIONS, summarize } from '../../src/core/gameSummary';
import type { DeathCause, DeathRecord, RoundRecord, Species } from '../../src/core/simulationEvents';

type Partial2 = Partial<Omit<RoundRecord, 'events'>> & { events?: Partial<RoundRecord['events']> };

function rec(round: number, over: Partial2 = {}): RoundRecord {
  const { events, ...rest } = over;
  return {
    round,
    males: 0,
    females: 0,
    pregnant: 0,
    wolves: 0,
    dogs: 0,
    fruits: 0,
    mushrooms: 0,
    ...rest,
    events: { deaths: [], births: 0, newPregnancies: 0, fruitsEaten: 0, mushroomsEaten: 0, ...events },
  };
}

const deaths = (species: Species, cause: DeathCause, n: number): DeathRecord[] =>
  Array.from({ length: n }, () => ({ species, cause, age: 10 }));

const keys = (records: RoundRecord[], reason: Parameters<typeof summarize>[1]) =>
  summarize(records, reason).conclusions.map((c) => c.key);

describe('crossingRounds', () => {
  it('reports the first round reaching exactly 50%, 10%, 0% and 200%', () => {
    expect(crossingRounds([10, 8, 5, 1, 0], 10)).toEqual({
      pct50: 2,
      pct10: 3,
      pct0: 4,
      pct200: null,
      applicable: true,
    });
    expect(crossingRounds([10, 15, 20, 30], 10)).toEqual({
      pct50: null,
      pct10: null,
      pct0: null,
      pct200: 2,
      applicable: true,
    });
  });

  it('keeps the first crossing even when the population recovers later', () => {
    expect(crossingRounds([4, 2, 6, 1], 4).pct50).toBe(1);
  });

  it('a single jump can cross several thresholds in the same round', () => {
    expect(crossingRounds([10, 0], 10)).toMatchObject({ pct50: 1, pct10: 1, pct0: 1 });
  });

  it('never reached → null; round 0 never counts', () => {
    const r = crossingRounds([10, 9, 8], 10);
    expect([r.pct50, r.pct10, r.pct0, r.pct200]).toEqual([null, null, null, null]);
    // round 0 is the start: being at 0% "already" is not a crossing
    expect(crossingRounds([0, 0], 1).pct0).toBe(1);
  });

  it('initial 0 is not applicable (n/a) even if the group appears later', () => {
    expect(crossingRounds([0, 3, 0], 0)).toEqual({
      pct50: null,
      pct10: null,
      pct0: null,
      pct200: null,
      applicable: false,
    });
  });

  it('uses the given round numbers instead of indices', () => {
    expect(crossingRounds([10, 4], 10, [0, 7]).pct50).toBe(7);
  });
});

describe('summarize facts', () => {
  const history = [
    rec(0, { males: 4, females: 4, wolves: 2, dogs: 1 }),
    rec(1, { males: 4, females: 4, wolves: 2, dogs: 1 }),
    rec(2, { males: 3, females: 4, pregnant: 1, wolves: 2, dogs: 1, events: { newPregnancies: 1 } }),
    rec(3, { males: 5, females: 5, pregnant: 1, wolves: 1, dogs: 1, events: { births: 2, newPregnancies: 1 } }),
    rec(4, { males: 2, females: 6, wolves: 1, dogs: 0, events: { births: 1 } }),
  ];

  it('counts rounds, first pregnancy, babies, peak and start/end populations', () => {
    const s = summarize(history, 'userFinished');
    expect(s.roundsPlayed).toBe(4);
    expect(s.firstPregnancyRound).toBe(2);
    expect(s.babiesBorn).toBe(3);
    expect(s.peakHumans).toEqual({ value: 10, round: 3 });
    expect(s.initial).toEqual({ males: 4, females: 4, wolves: 2, dogs: 1 });
    expect(s.final).toEqual({ males: 2, females: 6, wolves: 1, dogs: 0 });
    expect(s.males.pct50).toBe(4);
    expect(s.females.pct200).toBeNull();
  });

  it('no pregnancy at all → firstPregnancyRound null', () => {
    const s = summarize([rec(0, { males: 1, females: 1 }), rec(1, { males: 1, females: 1 })], 'userFinished');
    expect(s.firstPregnancyRound).toBeNull();
    expect(s.babiesBorn).toBe(0);
  });

  it('tallies deaths per species and cause', () => {
    const s = summarize(
      [
        rec(0, { males: 3, wolves: 2 }),
        rec(1, {
          males: 1,
          wolves: 1,
          events: { deaths: [...deaths('male', 'wolfAttack', 2), ...deaths('wolf', 'dogAttack', 1)] },
        }),
      ],
      'userFinished',
    );
    expect(s.deaths).toEqual({ male: { wolfAttack: 2 }, female: {}, wolf: { dogAttack: 1 }, dog: {} });
  });

  it('copes with an empty history', () => {
    const s = summarize([], 'userFinished');
    expect(s.roundsPlayed).toBe(0);
    expect(s.males.applicable).toBe(false);
    expect(s.conclusions).toEqual([{ key: 'outcomeNoHumans', args: [0] }]);
  });
});

describe('summarize conclusions', () => {
  it('outcome sentence follows the end reason and the population trend', () => {
    const start = rec(0, { males: 5, females: 5 });
    expect(keys([start, rec(3)], 'humansExtinct')[0]).toBe('outcomeExtinct');
    expect(summarize([start, rec(4, { males: 5, females: 5 })], 'challengeComplete').conclusions[0]).toEqual({
      key: 'outcomeChallengeComplete',
      args: [4],
    });
    expect(keys([start, rec(3)], 'challengeFailed')[0]).toBe('outcomeChallengeFailed');
    expect(summarize([start, rec(12, { males: 3, females: 3 })], 'humansSafe').conclusions[0]).toEqual({
      key: 'outcomeSafe',
      args: [12, 6],
    });
    expect(keys([start, rec(1, { males: 10, females: 10 })], 'userFinished')[0]).toBe('outcomeGrew');
    expect(keys([start, rec(1, { males: 2, females: 3 })], 'userFinished')[0]).toBe('outcomeShrank');
    expect(keys([start, rec(1, { males: 4, females: 5 })], 'userFinished')[0]).toBe('outcomeStable');
  });

  it('no pregnancy with both sexes present', () => {
    expect(keys([rec(0, { males: 2, females: 2 }), rec(1, { males: 2, females: 2 })], 'userFinished')).toContain(
      'noPregnancy',
    );
  });

  it('no pregnancy because only one sex existed', () => {
    expect(keys([rec(0, { females: 3 }), rec(1, { females: 3 })], 'userFinished')).toContain('noPregnancyOneSex');
  });

  it('names the top cause of human deaths with its share, only when it is ≥ 30%', () => {
    const s = summarize(
      [
        rec(0, { males: 5, females: 5 }),
        rec(1, {
          males: 2,
          females: 3,
          events: {
            newPregnancies: 1,
            deaths: [
              ...deaths('male', 'wolfAttack', 2),
              ...deaths('female', 'wolfAttack', 1),
              ...deaths('male', 'oldAge', 1),
            ],
          },
        }),
      ],
      'userFinished',
    );
    expect(s.conclusions).toContainEqual({ key: 'topCause.wolfAttack', args: [75, 3] });

    // 4 causes with 1 death each → 25% → no "biggest danger" sentence
    const spread = summarize(
      [
        rec(0, { males: 5, females: 5 }),
        rec(1, {
          males: 4,
          females: 2,
          events: {
            newPregnancies: 1,
            deaths: [
              ...deaths('male', 'mushroom', 1),
              ...deaths('female', 'metabolism', 1),
              ...deaths('female', 'oldAge', 1),
              ...deaths('female', 'childbirth', 1),
            ],
          },
        }),
      ],
      'userFinished',
    );
    expect(spread.conclusions.some((c) => c.key.startsWith('topCause.'))).toBe(false);
  });

  it('breaks ties between causes in the fixed DEATH_CAUSES order', () => {
    const history = [
      rec(0, { males: 5, females: 5 }),
      rec(1, {
        males: 3,
        females: 5,
        events: { newPregnancies: 1, deaths: [...deaths('male', 'mushroom', 1), ...deaths('male', 'maleFight', 1)] },
      }),
    ];
    expect(keys(history, 'userFinished')).toContain('topCause.maleFight'); // maleFight precedes mushroom
  });

  it('males died out first, with a note when male fights caused ≥ 40% of male deaths', () => {
    const fights = summarize(
      [
        rec(0, { males: 2, females: 4 }),
        rec(1, { males: 1, females: 4, events: { newPregnancies: 1, deaths: deaths('male', 'maleFight', 1) } }),
        rec(2, { males: 0, females: 4, events: { deaths: deaths('male', 'oldAge', 1) } }),
      ],
      'userFinished',
    );
    expect(fights.conclusions).toContainEqual({ key: 'malesFirstFights', args: [2, 50] });

    const plain = keys(
      [
        rec(0, { males: 3, females: 4 }),
        rec(1, { males: 0, females: 4, events: { newPregnancies: 1, deaths: deaths('male', 'oldAge', 3) } }),
      ],
      'userFinished',
    );
    expect(plain).toContain('malesFirst');
  });

  it('females died out first, or both in the same round', () => {
    expect(
      keys(
        [
          rec(0, { males: 3, females: 1 }),
          rec(1, { males: 3, females: 1, events: { newPregnancies: 1 } }),
          rec(2, { males: 3, females: 0 }),
        ],
        'userFinished',
      ),
    ).toContain('femalesFirst');
    expect(
      keys(
        [rec(0, { males: 1, females: 1 }), rec(1, { males: 1, females: 1, events: { newPregnancies: 1 } }), rec(2)],
        'humansExtinct',
      ),
    ).toContain('bothSexesSameRound');
  });

  it('compares births with human deaths', () => {
    const fewer = summarize(
      [
        rec(0, { males: 5, females: 5 }),
        rec(1, {
          males: 4,
          females: 4,
          events: {
            newPregnancies: 1,
            births: 1,
            deaths: [
              ...deaths('male', 'oldAge', 1),
              ...deaths('female', 'mushroom', 1),
              ...deaths('male', 'metabolism', 1),
            ],
          },
        }),
      ],
      'userFinished',
    );
    expect(fewer.conclusions).toContainEqual({ key: 'fewerBirths', args: [1, 3] });

    const more = keys(
      [rec(0, { males: 5, females: 5 }), rec(1, { males: 6, females: 6, events: { newPregnancies: 2, births: 2 } })],
      'userFinished',
    );
    expect(more).toContain('moreBirths');
  });

  it('expansion peak and crowding-limited growth', () => {
    const s = summarize(
      [
        rec(0, { males: 2, females: 2 }),
        rec(1, { males: 2, females: 2, events: { newPregnancies: 2 } }),
        rec(2, { males: 5, females: 5, events: { births: 6 } }),
        rec(3, { males: 4, females: 4, events: { deaths: deaths('male', 'overcrowding', 2) } }),
      ],
      'userFinished',
    );
    // outcome (grew) + topCause overcrowding + moreBirths fill the slots before expansion
    expect(s.conclusions.map((c) => c.key)).toEqual([
      'outcomeGrew',
      'topCause.overcrowding',
      'moreBirths',
      'expansionPeak',
    ]);
    expect(s.conclusions[3].args).toEqual([10, 2]);

    // without a dominant cause the crowding sentence appears
    const crowded = keys(
      [
        rec(0, { males: 2, females: 2 }),
        rec(1, { males: 2, females: 2, events: { newPregnancies: 1 } }),
        rec(2, {
          males: 2,
          females: 3,
          events: {
            births: 5,
            deaths: [
              ...deaths('male', 'overcrowding', 1),
              ...deaths('male', 'oldAge', 1),
              ...deaths('female', 'mushroom', 1),
              ...deaths('female', 'metabolism', 1),
            ],
          },
        }),
      ],
      'userFinished',
    );
    expect(crowded).toContain('crowdingLimited');
  });

  it('predators: wolves killing humans and dogs killing wolves', () => {
    const s = summarize(
      [
        rec(0, { males: 5, females: 5, wolves: 3, dogs: 2 }),
        rec(1, {
          males: 5,
          females: 5,
          wolves: 2,
          dogs: 2,
          events: { newPregnancies: 1, births: 0, deaths: deaths('wolf', 'dogAttack', 1) },
        }),
      ],
      'userFinished',
    );
    expect(s.conclusions).toContainEqual({ key: 'predators', args: [0, 1] });
  });

  it('is deterministic and never exceeds MAX_CONCLUSIONS', () => {
    const history = [
      rec(0, { males: 2, females: 4, wolves: 2 }),
      rec(1, {
        males: 0,
        females: 3,
        events: {
          deaths: [
            ...deaths('male', 'maleFight', 1),
            ...deaths('male', 'wolfAttack', 1),
            ...deaths('female', 'wolfAttack', 1),
          ],
        },
      }),
    ];
    const a = summarize(history, 'userFinished');
    const b = summarize(history, 'userFinished');
    expect(a.conclusions).toEqual(b.conclusions);
    expect(a.conclusions.length).toBe(MAX_CONCLUSIONS);
    expect(a.conclusions.map((c) => c.key)).toEqual([
      'outcomeShrank',
      'noPregnancy',
      'topCause.wolfAttack',
      'malesFirstFights',
    ]);
  });
});
