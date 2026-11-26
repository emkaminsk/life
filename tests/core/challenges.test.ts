import { describe, expect, it } from 'vitest';
import { Board } from '../../src/core/Board';
import {
  CHALLENGES,
  type ChallengeDef,
  evaluateChallenge,
  getChallenge,
  sanitizeLayout,
} from '../../src/core/challenges';
import { CONFIG_LOCKED_MESSAGE, Game } from '../../src/core/Game';
import { summarize } from '../../src/core/gameSummary';
import type { RoundRecord } from '../../src/core/simulationEvents';
import { createConfig, createMockRenderer } from '../setup';

function rec(round: number, births = 0, males = 1): RoundRecord {
  return {
    round,
    males,
    females: 0,
    pregnant: 0,
    wolves: 0,
    dogs: 0,
    fruits: 0,
    mushrooms: 0,
    events: { deaths: [], births, newPregnancies: 0, fruitsEaten: 0, mushroomsEaten: 0 },
  };
}

/** Counts births; complete at 3. */
const births: ChallengeDef<number> = {
  id: 'babyBoom',
  emoji: '👶',
  locks: {},
  init: () => 0,
  step: (n, r) => n + r.events.births,
  progress: (n, round) => ({ value: n, target: 3, status: n >= 3 ? 'complete' : 'inProgress', round }),
};

describe('challenges contract', () => {
  it('getChallenge: free play, no id and unknown ids give null', () => {
    expect(getChallenge()).toBeNull();
    expect(getChallenge('free')).toBeNull();
    expect(getChallenge('survive')).toBe(CHALLENGES.find((c) => c.id === 'survive') ?? null);
  });

  it('evaluateChallenge folds the history from round 0', () => {
    expect(evaluateChallenge(births, [rec(0, 5)])).toEqual({
      id: 'babyBoom',
      value: 0,
      target: 3,
      status: 'inProgress',
      round: 0,
    });
    expect(evaluateChallenge(births, [rec(0), rec(1, 2), rec(2, 1)])).toMatchObject({
      value: 3,
      status: 'complete',
      round: 2,
    });
    expect(() => evaluateChallenge(births, [])).toThrow();
  });

  it('sanitizeLayout returns a layout', () => {
    const layout = { width: 1, height: 1, cells: ['dog' as const] };
    expect(sanitizeLayout(null, layout)).toEqual(layout);
  });

  it('Game.setChallenge throws while locked; progress follows the history', () => {
    const board = new Board(2, 1);
    const game = new Game(board, createMockRenderer());
    expect(game.getChallengeProgress()).toBeNull();
    game.setChallenge(births);
    expect(game.getChallengeProgress()).toBeNull(); // no history yet
    game.initializeFromLayout({ width: 2, height: 1, cells: ['male', null] }, createConfig());
    expect(game.getChallengeProgress()).toMatchObject({ id: 'babyBoom', value: 0, round: 0 });
    expect(() => game.setChallenge(null)).toThrow(CONFIG_LOCKED_MESSAGE);
    game.reset();
    game.setChallenge(null);
    expect(game.getChallengeProgress()).toBeNull();
  });

  it('summarize stores the challenge progress (absent in free play)', () => {
    const progress = evaluateChallenge(births, [rec(0), rec(1, 3)]);
    expect(summarize([rec(0), rec(1, 3)], 'challengeComplete', progress).challenge).toEqual(progress);
    expect(summarize([rec(0)], 'userFinished').challenge).toBeUndefined();
    expect(summarize([rec(0)], 'userFinished', null).challenge).toBeUndefined();
  });
});
