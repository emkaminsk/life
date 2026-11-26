import { describe, expect, it, vi } from 'vitest';
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
import type { PlaceableKind, RoundRecord } from '../../src/core/simulationEvents';
import { Random } from '../../src/utils/Random';
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

describe('Game with a challenge', () => {
  /** A game on a one-row board with nothing spawning later, started from `cells`. */
  function layoutGame(cells: (PlaceableKind | null)[]) {
    const width = cells.length;
    const board = new Board(width, 1);
    const game = new Game(board, createMockRenderer());
    game.setAnimationDuration(0);
    const config = createConfig({
      fruit: { spawnProbability: 0 },
      mushroom: { spawnProbability: 0 },
      wolf: { spawnProbability: 0 },
      dog: { spawnProbability: 0 },
      human: { gompertzA: 0 },
    });
    return { board, game, start: () => game.initializeFromLayout({ width, height: 1, cells }, config) };
  }

  it('ends with challengeComplete and fires onGameOver once', () => {
    Random.seed(1);
    const { game, start } = layoutGame(['male', null, null, 'female']);
    game.setChallenge(getChallenge('clearDangers'));
    const onGameOver = vi.fn();
    game.onGameOver = onGameOver;
    start();
    expect(game.getChallengeProgress()).toMatchObject({ status: 'inProgress', round: 0 });
    game.step();
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith('challengeComplete');
    expect(game.getChallengeProgress()).toMatchObject({ id: 'clearDangers', status: 'complete', round: 1 });
    game.step();
    expect(game.finish()).toBe('challengeComplete');
    expect(onGameOver).toHaveBeenCalledTimes(1);
  });

  it('ends with challengeFailed when the humans die out', () => {
    const { game, start } = layoutGame(['male']);
    game.setChallenge(getChallenge('survive'));
    const onGameOver = vi.fn();
    game.onGameOver = onGameOver;
    start();
    game.getBoard().getEntity(0, 0)?.kill('oldAge');
    game.step();
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith('challengeFailed');
    expect(game.getChallengeProgress()).toMatchObject({ status: 'failed', failReason: 'humansExtinct' });
  });

  it('humansSafe does not end a game with a challenge', () => {
    Random.seed(2);
    const { game, start } = layoutGame(['male', null, null, null, 'female']);
    game.setChallenge(getChallenge('survive'));
    start();
    for (let i = 0; i < 12; i++) game.step();
    expect(game.isOver()).toBe(false);
    expect(game.getChallengeProgress()).toMatchObject({ value: 12, status: 'inProgress' });
  });

  it('free play without humans ends with humansExtinct after round 1', () => {
    const { game, start } = layoutGame(['wolf', null]);
    const onGameOver = vi.fn();
    game.onGameOver = onGameOver;
    start();
    expect(game.isOver()).toBe(false);
    game.step();
    expect(onGameOver).toHaveBeenCalledWith('humansExtinct');
    expect(game.getChallengeProgress()).toBeNull();
  });

  it('the incremental progress equals evaluateChallenge over the history (seeded random game)', () => {
    for (const c of CHALLENGES) {
      Random.seed(7);
      const board = new Board(12, 12);
      const game = new Game(board, createMockRenderer());
      game.setAnimationDuration(0);
      game.updateConfig(createConfig());
      game.setChallenge(c); // after updateConfig, as app.ts does
      game.initializeBoard();
      for (let i = 0; i < 30 && !game.isOver(); i++) {
        game.step();
        expect(game.getChallengeProgress()).toEqual(evaluateChallenge(c, game.getHistory().getRecords()));
      }
    }
  });
});
