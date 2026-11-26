import { describe, it, expect, afterEach, vi } from 'vitest';
import { Game } from '../../src/core/Game';
import { Board } from '../../src/core/Board';
import { Random } from '../../src/utils/Random';
import { countPopulation } from '../../src/ui/statistics';
import type { GameConfig } from '../../src/ui/ConfigPanel';
import { createConfig, createMockRenderer, type ConfigOverrides } from '../setup';

/**
 * Seeded multi-round runs of the real systems together. After every round the board
 * must stay consistent with itself, with the statistics and with the game history.
 */

const ROUNDS = 60;

interface Scenario {
  name: string;
  width: number;
  height: number;
  overrides: ConfigOverrides;
}

const SCENARIOS: Scenario[] = [
  { name: 'default 20x20', width: 20, height: 20, overrides: {} },
  { name: '1x1 board', width: 1, height: 1, overrides: {} },
  { name: '1x5 strip', width: 1, height: 5, overrides: {} },
  {
    name: 'full board',
    width: 6,
    height: 6,
    overrides: {
      spawn: {
        maleHumanProbability: 0.3,
        femaleHumanProbability: 0.3,
        wolfProbability: 0.2,
        dogProbability: 0.1,
        fruitProbability: 0.1,
        mushroomProbability: 0,
      },
    },
  },
  {
    name: 'spawn probabilities summing over 100%',
    width: 8,
    height: 8,
    overrides: {
      spawn: {
        maleHumanProbability: 0.9,
        femaleHumanProbability: 0.9,
        wolfProbability: 0.9,
        dogProbability: 0.9,
        fruitProbability: 0.9,
        mushroomProbability: 0.9,
      },
    },
  },
  {
    name: 'zero periods and ranges',
    width: 8,
    height: 8,
    overrides: {
      human: { startingHealth: 1, pregnancyPeriod: 0, cooldownPeriod: 0 },
      wolf: { perceptionRange: 0 },
      fruit: { roundsToRipen: 0, energyHealed: 0 },
    },
  },
  {
    name: 'extreme Gompertz, plants everywhere',
    width: 10,
    height: 10,
    overrides: {
      human: { gompertzA: 1, gompertzB: 5 },
      fruit: { spawnProbability: 1 },
      mushroom: { spawnProbability: 1 },
    },
  },
];

function scenarioConfig({ width, height, overrides }: Scenario): GameConfig {
  const config = createConfig(overrides);
  config.board.width = width;
  config.board.height = height;
  return config;
}

/** Problems with the board itself: duplicates, coordinates, health. */
function boardProblems(board: Board, tag: string): string[] {
  const seen = new Set<object>();
  const problems: string[] = [];
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const e = board.getEntity(x, y);
      if (!e) continue;
      if (seen.has(e)) problems.push(`${tag}: entity in two cells (${x},${y})`);
      seen.add(e);
      if (e.x !== x || e.y !== y) problems.push(`${tag}: ${e.type} at (${x},${y}) thinks it is at (${e.x},${e.y})`);
      if (Number.isNaN(e.health)) problems.push(`${tag}: NaN health ${e.type}`);
      else if (e.health <= 0) problems.push(`${tag}: dead ${e.type} left on board (${e.health})`);
      else if (e.health > e.maxHealth + 1e-9) problems.push(`${tag}: ${e.type} health ${e.health} > ${e.maxHealth}`);
    }
  }
  return problems;
}

/** Problems with statistics and history relative to the board. */
function bookkeepingProblems(game: Game, board: Board, tag: string): string[] {
  const problems: string[] = [];
  const entities = board.getAllEntities().length;
  const c = countPopulation(board);
  const sum = c.total + c.ripeFruits + c.unripeFruits + c.mushrooms;
  if (sum !== entities) problems.push(`${tag}: statistics sum ${sum} vs ${entities} entities`);

  const records = game.getHistory().getRecords();
  if (records.length !== board.round + 1) problems.push(`${tag}: ${records.length} records for round ${board.round}`);
  const last = records[records.length - 1];
  const expected = {
    round: board.round,
    males: c.males,
    females: c.females,
    pregnant: c.pregnant,
    wolves: c.wolves,
    dogs: c.dogs,
    fruits: c.ripeFruits + c.unripeFruits,
    mushrooms: c.mushrooms,
  };
  for (const [key, value] of Object.entries(expected)) {
    const actual = last[key as keyof typeof expected];
    if (actual !== value) problems.push(`${tag}: record.${key} ${actual} vs board ${value}`);
  }
  const population = game.getPopulationHistory();
  if (population[population.length - 1] !== c.males + c.females) problems.push(`${tag}: population history stale`);
  return problems;
}

function newGame(scenario: Scenario, seed: number): { game: Game; board: Board } {
  Random.seed(seed);
  const board = new Board(scenario.width, scenario.height);
  const game = new Game(board, createMockRenderer());
  game.setAnimationDuration(0);
  game.initializeBoard(scenarioConfig(scenario));
  return { game, board };
}

/** Run up to `rounds` rounds (fewer when the game ends) checking every invariant after each. */
function runChecked(game: Game, board: Board, rounds: number): string[] {
  const problems = [...boardProblems(board, 'init'), ...bookkeepingProblems(game, board, 'init')];
  for (let i = 0; i < rounds && !game.isOver(); i++) {
    const before = board.round;
    game.step();
    const tag = `round ${board.round}`;
    if (board.round !== before + 1) problems.push(`${tag}: expected round ${before + 1}`);
    problems.push(...boardProblems(board, tag), ...bookkeepingProblems(game, board, tag));
  }
  return problems;
}

function serialize(board: Board): string {
  return board
    .getAllEntities()
    .map((e) => `${e.type}@${e.x},${e.y}:${e.health}:${e.age}`)
    .join('|');
}

afterEach(() => {
  Random.useMathRandom();
});

describe('seeded multi-round simulation invariants', () => {
  describe.each(SCENARIOS)('$name', (scenario) => {
    it.each([1, 2, 3, 42])('seed %i: board, statistics and history stay consistent', (seed) => {
      const { game, board } = newGame(scenario, seed);
      expect(runChecked(game, board, ROUNDS).slice(0, 10)).toEqual([]);

      if (game.isOver()) {
        // Auto-stop: the end reason matches the final record and nothing runs afterwards
        const last = game.getHistory().getLatest()!;
        const humans = last.males + last.females;
        if (game.getEndReason() === 'humansExtinct') expect(humans).toBe(0);
        else expect([game.getEndReason(), last.wolves, last.mushrooms]).toEqual(['humansSafe', 0, 0]);
        const round = board.round;
        game.step();
        expect(board.round).toBe(round);
      } else {
        expect(board.round).toBe(ROUNDS);
      }
    });
  });

  it('a full board initializes with every cell occupied (earlier categories win)', () => {
    const scenario = SCENARIOS.find((s) => s.name.startsWith('spawn probabilities'))!;
    const { board } = newGame(scenario, 5);
    expect(board.getAllEntities()).toHaveLength(64);
    const c = countPopulation(board);
    // male 0.9, female cumulative 1.8 ≥ any draw: only the first two categories can appear
    expect(c.males + c.females).toBe(64);
    expect(c.males).toBeGreaterThan(c.females);
  });

  it('the same seed reproduces the same board; a different seed does not', () => {
    const run = (seed: number) => {
      const { game, board } = newGame({ name: 'det', width: 15, height: 15, overrides: {} }, seed);
      for (let i = 0; i < 40 && !game.isOver(); i++) game.step();
      return `${board.round}#${serialize(board)}`;
    };
    const first = run(7);
    expect(first.length).toBeGreaterThan(10);
    expect(run(7)).toBe(first);
    expect(run(8)).not.toBe(first);
  });

  it('async initialization yields the same simulation as sync initialization', async () => {
    const scenario = SCENARIOS[0];
    const { game, board } = newGame(scenario, 9);
    for (let i = 0; i < 20; i++) game.step();
    const expected = serialize(board);

    Random.seed(9);
    const asyncBoard = new Board(scenario.width, scenario.height);
    const asyncGame = new Game(asyncBoard, createMockRenderer());
    asyncGame.setAnimationDuration(0);
    await asyncGame.initializeBoardAsync(scenarioConfig(scenario), {
      chunks: 3,
      yieldToEventLoop: () => Promise.resolve(),
    });
    for (let i = 0; i < 20; i++) asyncGame.step();

    expect(serialize(asyncBoard)).toBe(expected);
  });
});

describe('animated run with pause/resume at arbitrary points', () => {
  it('keeps positions snapped and invariants intact; one onRoundComplete per round', () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'],
    });
    try {
      Random.seed(3);
      const scenario = SCENARIOS[0];
      const board = new Board(scenario.width, scenario.height);
      const game = new Game(board, createMockRenderer());
      game.setSpeed(200);
      game.initializeBoard(scenarioConfig(scenario));
      let rounds = 0;
      game.onRoundComplete = () => rounds++;

      const problems: string[] = [];
      for (let i = 0; i < 30 && !game.isOver(); i++) {
        game.start();
        vi.advanceTimersByTime(37 + ((i * 53) % 400)); // pause at varying animation phases
        game.pause();
        expect(game.isAnimatingNow()).toBe(false);
        for (const e of board.getAllEntities()) {
          if (e.visualX !== e.x || e.visualY !== e.y) problems.push(`pause ${i}: ${e.type} not snapped`);
        }
        problems.push(...boardProblems(board, `pause ${i}`), ...bookkeepingProblems(game, board, `pause ${i}`));
      }

      expect(problems.slice(0, 10)).toEqual([]);
      expect(rounds).toBe(board.round);
      expect(board.round).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
