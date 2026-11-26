import { describe, it, expect } from 'vitest';
import { GameHistory, emptyRoundEvents, humansIn } from '../../src/core/GameHistory';
import type { RoundRecord } from '../../src/core/simulationEvents';

function record(round: number, males: number, females: number): RoundRecord {
  return {
    round,
    males,
    females,
    pregnant: 0,
    wolves: 1,
    dogs: 0,
    fruits: 0,
    mushrooms: 0,
    events: emptyRoundEvents(),
  };
}

describe('GameHistory', () => {
  it('start() begins a new series with the round 0 record, discarding the previous game', () => {
    const history = new GameHistory();
    history.start(record(0, 1, 1));
    history.record(record(1, 2, 1));
    history.start(record(0, 5, 0));

    expect(history.getRecords().map((r) => r.round)).toEqual([0]);
    expect(history.getHumanPopulation()).toEqual([5]);
    expect(history.length).toBe(1);
  });

  it('record() appends records and keeps the human population series in step', () => {
    const history = new GameHistory();
    history.start(record(0, 3, 2));
    history.record(record(1, 2, 2));
    history.record(record(2, 0, 1));

    expect(history.getRecords().map((r) => r.round)).toEqual([0, 1, 2]);
    expect(history.getHumanPopulation()).toEqual([5, 4, 1]);
    expect(history.getLatest()?.round).toBe(2);
  });

  it('clear() empties records and population', () => {
    const history = new GameHistory();
    history.start(record(0, 1, 0));
    history.clear();
    expect(history.getRecords()).toEqual([]);
    expect(history.getHumanPopulation()).toEqual([]);
    expect(history.getLatest()).toBeUndefined();
  });

  it('emptyRoundEvents returns a fresh object each time (no shared deaths array)', () => {
    const a = emptyRoundEvents();
    a.deaths.push({ species: 'male', cause: 'oldAge', age: 3 });
    expect(emptyRoundEvents().deaths).toEqual([]);
  });

  it('humansIn counts males and females only', () => {
    expect(humansIn(record(0, 2, 3))).toBe(5);
  });
});
