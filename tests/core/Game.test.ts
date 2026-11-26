import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Game, CONFIG_LOCKED_MESSAGE } from '../../src/core/Game';
import { Board } from '../../src/core/Board';
import { Human, Wolf, Fruit } from '../../src/entities';
import { EntityType, Sex } from '../../src/types';
import { Random } from '../../src/utils/Random';
import type { BoardLayout, PlaceableKind } from '../../src/core/simulationEvents';
import type { GameConfig } from '../../src/ui/ConfigPanel';
import { createConfig, createMockRenderer, type ConfigOverrides } from '../setup';

/**
 * Game orchestration tests: phase order, config locking, round lifecycle
 * (continuous / step / stepRounds / pause mid-animation) and callbacks.
 *
 * Timers, requestAnimationFrame and performance.now are faked so animations
 * progress only when the test advances time.
 */

const PHASES = ['movement', 'combat', 'eating', 'reproduction', 'death', 'birth', 'spawn'] as const;
const SYSTEM_FIELDS: Record<(typeof PHASES)[number], string> = {
  movement: 'movementSystem',
  combat: 'combatSystem',
  eating: 'eatingSystem',
  reproduction: 'reproductionSystem',
  death: 'deathSystem',
  birth: 'birthSystem',
  spawn: 'spawnSystem',
};

/** A config where nothing spawns and nothing dies of age (only explicit rules act). */
function quietConfig(overrides: ConfigOverrides = {}): GameConfig {
  const base = createConfig({
    spawn: {
      maleHumanProbability: 0,
      femaleHumanProbability: 0,
      wolfProbability: 0,
      dogProbability: 0,
      fruitProbability: 0,
      mushroomProbability: 0,
    },
    fruit: { spawnProbability: 0 },
    mushroom: { spawnProbability: 0 },
    wolf: { spawnProbability: 0, gompertzA: 0 },
    dog: { spawnProbability: 0, gompertzA: 0 },
    human: { gompertzA: 0 },
  });
  for (const [k, v] of Object.entries(overrides)) Object.assign((base as any)[k], v);
  return base;
}

describe('Game', () => {
  let board: Board;
  let renderer: ReturnType<typeof createMockRenderer>;
  let game: Game;

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
        'Date',
      ],
    });
    board = new Board(10, 10);
    renderer = createMockRenderer();
    game = new Game(board, renderer);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Start a game on an empty board with a quiet config, then place entities. */
  function newGame(config: GameConfig = quietConfig()): void {
    game.updateConfig(config);
    game.initializeBoard();
  }

  /**
   * newGame() plus a human boxed into the corner by unripe fruit: it never moves,
   * eats or dies, so the game does not end with humansExtinct.
   */
  function newLiveGame(config: GameConfig = quietConfig()): void {
    newGame(config);
    board.setEntity(9, 9, new Human(9, 9, Sex.FEMALE));
    for (const [x, y] of [
      [8, 8],
      [8, 9],
      [9, 8],
    ]) {
      board.setEntity(x, y, new Fruit(x, y, 30, 10_000));
    }
  }

  function wanderingWolf(x = 5, y = 5): Wolf {
    const wolf = new Wolf(x, y, 80, 0, 0);
    board.setEntity(x, y, wolf);
    return wolf;
  }

  /** 2×1 board started with a wolf next to a weak female; the female dies in round 1. */
  function doomedHumans(): void {
    board.resize(2, 1);
    game.initializeFromLayout(
      { width: 2, height: 1, cells: ['wolf', 'female'] },
      quietConfig({ human: { startingHealth: 10, gompertzA: 0 } }),
    );
    game.setAnimationDuration(0);
  }

  function spyPhases(): string[] {
    const calls: string[] = [];
    for (const phase of PHASES) {
      const system = (game as any)[SYSTEM_FIELDS[phase]];
      const original = system.execute.bind(system);
      vi.spyOn(system, 'execute').mockImplementation((...args: unknown[]) => {
        calls.push(phase);
        return original(...args);
      });
    }
    return calls;
  }

  describe('phase order', () => {
    it('runs movement, combat, eating, reproduction, death, birth, spawn in order (no animation)', () => {
      newGame();
      game.setAnimationDuration(0);
      wanderingWolf();
      const calls = spyPhases();

      game.step();

      expect(calls).toEqual([...PHASES]);
      expect(board.round).toBe(1);
    });

    it('keeps the order when movement is animated, running phases 2–7 only after the animation', () => {
      newGame();
      wanderingWolf();
      const calls = spyPhases();

      game.step();
      expect(calls).toEqual(['movement']);
      expect(game.isAnimatingNow()).toBe(true);

      vi.advanceTimersByTime(game.getAnimationDuration() + 100);

      expect(calls).toEqual([...PHASES]);
      expect(game.isAnimatingNow()).toBe(false);
      expect(board.round).toBe(1);
    });

    it('passes the game config to every system', () => {
      const config = quietConfig({ human: { maleVsMaleDamage: 42 } });
      newGame(config);
      game.setAnimationDuration(0);
      const spies = PHASES.map((p) => vi.spyOn((game as any)[SYSTEM_FIELDS[p]], 'execute'));

      game.step();

      for (const spy of spies) {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][0]).toBe(board);
        expect((spy.mock.calls[0][1] as GameConfig).human.maleVsMaleDamage).toBe(42);
      }
    });
  });

  describe('same-round consequences', () => {
    it('a creature killed in combat is removed in the death phase of the same round', () => {
      board.resize(2, 1);
      newGame();
      game.setAnimationDuration(0);
      const wolf = new Wolf(0, 0, 80, 0, 0);
      const female = new Human(1, 0, Sex.FEMALE, 10, 0, 0);
      board.setEntity(0, 0, wolf);
      board.setEntity(1, 0, female);

      game.step();

      expect(board.getEntity(1, 0)).toBeNull();
      expect(board.getEntity(0, 0)).toBe(wolf);
    });
  });

  describe('configuration', () => {
    it('stores a deep-frozen copy and notifies the renderer of the injured threshold', () => {
      const config = quietConfig({ board: { injuredThreshold: 33 } });
      game.updateConfig(config);

      const stored = game.getConfig();
      expect(stored).not.toBe(config);
      expect(stored).toEqual(config);
      expect(Object.isFrozen(stored)).toBe(true);
      expect(Object.isFrozen(stored.human)).toBe(true);
      expect(() => {
        (stored.human as { startingHealth: number }).startingHealth = 1;
      }).toThrow();

      config.human.startingHealth = 999;
      expect(game.getConfig().human.startingHealth).not.toBe(999);
      expect(renderer.setInjuredThreshold).toHaveBeenCalledWith(33);
    });

    it('is locked by initializeBoard and unlocked by reset', () => {
      expect(game.isConfigLocked()).toBe(false);
      game.initializeBoard();
      expect(game.isConfigLocked()).toBe(true);
      expect(() => game.updateConfig(quietConfig())).toThrow(CONFIG_LOCKED_MESSAGE);
      expect(CONFIG_LOCKED_MESSAGE).toBe('Configuration is locked while a game is in progress');

      game.reset();
      expect(game.isConfigLocked()).toBe(false);
      expect(() => game.updateConfig(quietConfig())).not.toThrow();
    });

    it('initializeBoard(config) populates the board with configured entities', () => {
      const config = quietConfig({
        spawn: {
          maleHumanProbability: 0.5,
          femaleHumanProbability: 0,
          wolfProbability: 0,
          dogProbability: 0,
          fruitProbability: 0.5,
          mushroomProbability: 0,
        },
        human: { startingHealth: 60, gompertzA: 0.002, gompertzB: 0.2 },
        fruit: { energyHealed: 9, roundsToRipen: 5, spawnProbability: 0 },
      });
      game.initializeBoard(config);

      const entities = board.getAllEntities();
      expect(entities).toHaveLength(100);
      const humans = entities.filter((e): e is Human => e instanceof Human);
      const fruits = entities.filter((e): e is Fruit => e instanceof Fruit);
      expect(humans.length + fruits.length).toBe(100);
      for (const h of humans) {
        expect(h.sex).toBe(Sex.MALE);
        expect(h.health).toBeLessThanOrEqual(60);
        expect(h.gompertzA).toBe(0.002);
        expect(h.gompertzB).toBe(0.2);
      }
      for (const f of fruits) {
        expect(f.energyHealed).toBe(9);
        expect(f.ripeningCounter).toBe(5);
      }
      expect(game.getConfig().human.startingHealth).toBe(60);
      expect(game.getPopulationHistory()).toEqual([humans.length]);
    });
  });

  describe('pause during movement animation (H2)', () => {
    it('snaps positions and completes the round exactly once', () => {
      newGame();
      const wolf = wanderingWolf();
      const combat = vi.spyOn((game as any).combatSystem, 'execute');
      const onRound = vi.fn();
      game.onRoundComplete = onRound;

      game.start();
      expect(game.isAnimatingNow()).toBe(true);
      const afterMove = { x: wolf.x, y: wolf.y };
      vi.advanceTimersByTime(game.getAnimationDuration() / 2);

      game.pause();

      expect(game.running()).toBe(false);
      expect(game.isAnimatingNow()).toBe(false);
      expect(board.round).toBe(1);
      expect(combat).toHaveBeenCalledTimes(1);
      expect(onRound).toHaveBeenCalledTimes(1);
      expect([wolf.visualX, wolf.visualY]).toEqual([wolf.x, wolf.y]);
      expect([wolf.x, wolf.y]).toEqual([afterMove.x, afterMove.y]);

      // Nothing else happens afterwards
      vi.advanceTimersByTime(5000);
      expect(board.round).toBe(1);
      expect(combat).toHaveBeenCalledTimes(1);
      expect([wolf.x, wolf.y]).toEqual([afterMove.x, afterMove.y]);
    });

    it('resuming starts a fresh round', () => {
      newLiveGame();
      wanderingWolf();
      game.start();
      game.pause();
      expect(board.round).toBe(1);

      game.start();
      vi.advanceTimersByTime(game.getAnimationDuration() + 50);
      expect(board.round).toBeGreaterThanOrEqual(2);
      game.pause();
    });
  });

  describe('stepping', () => {
    it('stepRounds(5) advances exactly 5 rounds and fires onStepComplete once (animated)', () => {
      newLiveGame();
      wanderingWolf();
      const onStep = vi.fn();
      const onRound = vi.fn();
      game.onStepComplete = onStep;
      game.onRoundComplete = onRound;

      game.stepRounds(5);
      vi.advanceTimersByTime(20_000);

      expect(board.round).toBe(5);
      expect(onRound).toHaveBeenCalledTimes(5);
      expect(onStep).toHaveBeenCalledTimes(1);
      expect(game.isStepping()).toBe(false);
    });

    it('stepRounds(5) also works when nothing moves', () => {
      newLiveGame();
      const onStep = vi.fn();
      game.onStepComplete = onStep;

      game.stepRounds(5);
      vi.advanceTimersByTime(20_000);

      expect(board.round).toBe(5);
      expect(onStep).toHaveBeenCalledTimes(1);
    });

    it('step() runs one round and fires onStepComplete after it', () => {
      newLiveGame();
      wanderingWolf();
      const onStep = vi.fn();
      game.onStepComplete = onStep;

      game.step();
      expect(onStep).not.toHaveBeenCalled();
      vi.advanceTimersByTime(game.getAnimationDuration() + 50);

      expect(board.round).toBe(1);
      expect(onStep).toHaveBeenCalledTimes(1);
    });

    it('ignores step requests while a step is in progress or the game is running', () => {
      newLiveGame();
      wanderingWolf();
      game.stepRounds(2);
      game.step();
      game.stepRounds(3);
      vi.advanceTimersByTime(20_000);
      expect(board.round).toBe(2);

      game.start();
      const roundAtStart = board.round;
      game.stepRounds(50);
      game.pause();
      expect(board.round).toBeLessThanOrEqual(roundAtStart + 1);
    });

    it('start() during a step sequence takes over without firing onStepComplete', () => {
      newGame();
      const onStep = vi.fn();
      game.onStepComplete = onStep;
      game.stepRounds(10);
      game.start();
      vi.advanceTimersByTime(game.getSpeed() * 3 + 10);
      game.pause();
      expect(onStep).not.toHaveBeenCalled();
      expect(game.isStepping()).toBe(false);
    });
  });

  describe('continuous run', () => {
    it('fires onRoundComplete every round and never onStepComplete', () => {
      newLiveGame();
      const onRound = vi.fn();
      const onStep = vi.fn();
      game.onRoundComplete = onRound;
      game.onStepComplete = onStep;

      game.start(); // nothing moves → one round per getSpeed() ms
      vi.advanceTimersByTime(game.getSpeed() * 4 + 10);
      game.pause();

      expect(board.round).toBe(5);
      expect(onRound).toHaveBeenCalledTimes(5);
      expect(onStep).not.toHaveBeenCalled();
    });

    it('setSpeed changes the delay between rounds', () => {
      newLiveGame();
      game.start(); // round 1 runs immediately
      game.setSpeed(1000);
      expect(game.getSpeed()).toBe(1000);
      vi.advanceTimersByTime(999);
      expect(board.round).toBe(1);
      vi.advanceTimersByTime(2);
      expect(board.round).toBe(2);
      game.pause();
    });

    it('records population after initialization and every round', () => {
      newGame();
      game.setAnimationDuration(0);
      board.setEntity(0, 0, new Human(0, 0, Sex.MALE, 50, 0, 0));
      game.step();
      game.step();
      expect(game.getPopulationHistory()).toEqual([0, 1, 1]);
    });
  });

  describe('reset', () => {
    it('stops the game, clears board, round, history and visual effects', () => {
      newGame();
      wanderingWolf();
      game.start();
      game.reset();

      expect(game.running()).toBe(false);
      expect(game.isAnimatingNow()).toBe(false);
      expect(board.getAllEntities()).toHaveLength(0);
      expect(board.round).toBe(0);
      expect(game.getPopulationHistory()).toEqual([]);
      expect(renderer.clearVisualEffects).toHaveBeenCalled();

      vi.advanceTimersByTime(5000);
      expect(board.round).toBe(0);
    });

    it('during stepRounds mid-animation fires no onStepComplete and leaves no pending timer or frame', () => {
      newGame();
      wanderingWolf();
      const onStep = vi.fn();
      game.onStepComplete = onStep;
      game.stepRounds(3);
      expect(game.isAnimatingNow()).toBe(true);

      game.reset();

      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(10_000);
      expect(onStep).not.toHaveBeenCalled();
      expect(board.round).toBe(0);
    });
  });

  describe('control guard branches', () => {
    it('start() twice schedules only one round loop', () => {
      newLiveGame();
      const movement = vi.spyOn((game as any).movementSystem, 'execute');
      game.start();
      game.start();
      expect(movement).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(1);
      vi.advanceTimersByTime(game.getSpeed() + 1);
      expect(board.round).toBe(2);
      game.pause();
    });

    it('start() during an animated step waits for the animation, then keeps running', () => {
      newLiveGame();
      wanderingWolf();
      const onStep = vi.fn();
      game.onStepComplete = onStep;
      const movement = vi.spyOn((game as any).movementSystem, 'execute');

      game.step();
      game.start();
      expect(movement).toHaveBeenCalledTimes(1); // no second round while animating
      expect(board.round).toBe(0);

      vi.advanceTimersByTime(game.getAnimationDuration() * 3 + 100);
      expect(board.round).toBeGreaterThanOrEqual(2);
      expect(game.running()).toBe(true);
      expect(onStep).not.toHaveBeenCalled();
      game.pause();
    });

    it('pause() when not running is a no-op (an animated step keeps animating)', () => {
      newGame();
      wanderingWolf();
      game.step();
      game.pause();
      expect(game.isAnimatingNow()).toBe(true);
      expect(board.round).toBe(0);
      vi.advanceTimersByTime(game.getAnimationDuration() + 50);
      expect(board.round).toBe(1);
    });

    it.each([
      [0, 0],
      [-1, 0],
      [Number.NaN, 0],
      [2.7, 2],
    ])('stepRounds(%s) runs %i rounds', (n, expected) => {
      newLiveGame();
      game.setAnimationDuration(0);
      const onStep = vi.fn();
      game.onStepComplete = onStep;
      game.stepRounds(n);
      vi.advanceTimersByTime(20_000);
      expect(board.round).toBe(expected);
      expect(onStep).toHaveBeenCalledTimes(expected > 0 ? 1 : 0);
    });

    it('a stale animation frame delivered after pause does nothing', () => {
      const frames: FrameRequestCallback[] = [];
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
      vi.stubGlobal('cancelAnimationFrame', () => {}); // keep the stale callback deliverable
      newGame();
      wanderingWolf();
      const onRound = vi.fn();
      game.onRoundComplete = onRound;

      game.start();
      expect(frames).toHaveLength(1);
      game.pause();
      expect(board.round).toBe(1);
      renderer.renderAnimationFrame.mockClear();

      frames[0](performance.now());

      expect(renderer.renderAnimationFrame).not.toHaveBeenCalled();
      expect(board.round).toBe(1);
      expect(onRound).toHaveBeenCalledTimes(1);
    });
  });

  describe('history (RoundRecord per round)', () => {
    it('records round 0 and one record per round with board counts', () => {
      newGame();
      game.setAnimationDuration(0);
      const female = new Human(0, 0, Sex.FEMALE, 50, 0, 0);
      female.pregnancyCounter = 5;
      board.setEntity(0, 0, female);
      board.setEntity(9, 9, new Human(9, 9, Sex.MALE, 50, 0, 0));

      game.step();

      const records = game.getHistory().getRecords();
      expect(records).toHaveLength(2);
      expect(records[0].round).toBe(0);
      expect(records[0].males + records[0].females).toBe(0); // board was empty at initialization
      expect(records[1]).toMatchObject({
        round: 1,
        males: 1,
        females: 1,
        pregnant: 1,
        wolves: 0,
        dogs: 0,
        fruits: 0,
        mushrooms: 0,
      });
      expect(game.getPopulationHistory()).toEqual([0, 2]);
    });

    it('aggregates the events reported by the systems into the round record', () => {
      newGame();
      game.setAnimationDuration(0);
      const metabolismDeath = { species: 'male', cause: 'metabolism', age: 4 } as const;
      const combatDeath = { species: 'female', cause: 'wolfAttack', age: 2 } as const;
      const childbirth = { species: 'female', cause: 'childbirth', age: 9 } as const;
      vi.spyOn((game as any).movementSystem, 'execute').mockReturnValue(
        Object.assign([], { deaths: [metabolismDeath] }),
      );
      vi.spyOn((game as any).eatingSystem, 'execute').mockReturnValue({ fruits: 4, mushrooms: 1 });
      vi.spyOn((game as any).reproductionSystem, 'execute').mockReturnValue(3);
      vi.spyOn((game as any).deathSystem, 'execute').mockReturnValue([combatDeath]);
      vi.spyOn((game as any).birthSystem, 'execute').mockReturnValue({ births: 2, deaths: [childbirth] });

      game.step();

      expect(game.getHistory().getLatest()?.events).toEqual({
        deaths: [metabolismDeath, combatDeath, childbirth],
        births: 2,
        newPregnancies: 3,
        fruitsEaten: 4,
        mushroomsEaten: 1,
      });
    });

    it('accepts a movement result of the form { movements, deaths }', () => {
      newGame();
      game.setAnimationDuration(0);
      const death = { species: 'wolf', cause: 'metabolism', age: 1 } as const;
      vi.spyOn((game as any).movementSystem, 'execute').mockReturnValue({ movements: [], deaths: [death] });
      game.step();
      expect(game.getHistory().getLatest()?.events.deaths).toEqual([death]);
      expect(board.round).toBe(1);
    });

    it('tolerates systems that return nothing (empty events)', () => {
      newGame();
      game.setAnimationDuration(0);
      for (const phase of PHASES) {
        vi.spyOn((game as any)[SYSTEM_FIELDS[phase]], 'execute').mockReturnValue(undefined);
      }
      game.step();
      expect(board.round).toBe(1);
      expect(game.getHistory().getLatest()?.events).toEqual({
        deaths: [],
        births: 0,
        newPregnancies: 0,
        fruitsEaten: 0,
        mushroomsEaten: 0,
      });
    });
  });

  describe('end conditions (auto-stop)', () => {
    it('stops with humansExtinct when the last human dies, firing onRoundComplete then onGameOver once', () => {
      doomedHumans();
      const calls: string[] = [];
      game.onRoundComplete = () => calls.push('round');
      game.onGameOver = (reason) => calls.push(`over:${reason}`);
      game.onStepComplete = () => calls.push('step');

      game.start();

      expect(calls).toEqual(['round', 'over:humansExtinct']);
      expect(game.running()).toBe(false);
      expect(game.isOver()).toBe(true);
      expect(game.getEndReason()).toBe('humansExtinct');
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(10_000);
      expect(board.round).toBe(1);
    });

    it('when over: start() and step() are no-ops, config stays locked until reset()', () => {
      doomedHumans();
      game.step();
      expect(game.isOver()).toBe(true);

      game.start();
      game.step();
      game.stepRounds(5);
      vi.advanceTimersByTime(10_000);
      expect(board.round).toBe(1);
      expect(game.running()).toBe(false);
      expect(game.isConfigLocked()).toBe(true);

      game.reset();
      expect(game.isOver()).toBe(false);
      expect(game.getEndReason()).toBeNull();
      expect(game.isConfigLocked()).toBe(false);
    });

    it('stepRounds ends early on game over without onStepComplete', () => {
      doomedHumans();
      const onStep = vi.fn();
      game.onStepComplete = onStep;
      game.stepRounds(5);
      vi.advanceTimersByTime(10_000);
      expect(board.round).toBe(1);
      expect(game.isStepping()).toBe(false);
      expect(onStep).not.toHaveBeenCalled();
    });

    it('stops with humansSafe at round 10 when no wolves or mushrooms remain', () => {
      newGame();
      game.setAnimationDuration(0);
      board.setEntity(4, 4, new Human(4, 4, Sex.MALE, 100, 0, 0));
      const onOver = vi.fn();
      game.onGameOver = onOver;

      game.start();
      vi.advanceTimersByTime(game.getSpeed() * 20);

      expect(board.round).toBe(10);
      expect(onOver).toHaveBeenCalledTimes(1);
      expect(onOver).toHaveBeenCalledWith('humansSafe');
      expect(game.getHistory().getRecords()).toHaveLength(11);
    });

    it('a new initialization clears the end reason', () => {
      doomedHumans();
      game.step();
      expect(game.isOver()).toBe(true);
      game.initializeBoard();
      expect(game.isOver()).toBe(false);
    });
  });

  describe('stop() and finish()', () => {
    it('stop() mid-animation halts without finishing the round (no extra round, R12)', () => {
      newGame();
      const wolf = wanderingWolf();
      const combat = vi.spyOn((game as any).combatSystem, 'execute');
      const onRound = vi.fn();
      game.onRoundComplete = onRound;
      game.start();
      vi.advanceTimersByTime(game.getAnimationDuration() / 2);

      game.stop();

      expect(game.running()).toBe(false);
      expect(game.isAnimatingNow()).toBe(false);
      expect([wolf.visualX, wolf.visualY]).toEqual([wolf.x, wolf.y]);
      expect(board.round).toBe(0);
      expect(combat).not.toHaveBeenCalled();
      expect(onRound).not.toHaveBeenCalled();
      expect(game.getHistory().length).toBe(1);
      expect(game.isConfigLocked()).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(10_000);
      expect(board.round).toBe(0);
    });

    it('stop() during a step sequence fires no onStepComplete', () => {
      newGame();
      wanderingWolf();
      const onStep = vi.fn();
      game.onStepComplete = onStep;
      game.stepRounds(3);
      game.stop();
      vi.advanceTimersByTime(10_000);
      expect(onStep).not.toHaveBeenCalled();
      expect(game.isStepping()).toBe(false);
    });

    it('finish() stops and records userFinished once', () => {
      newGame();
      wanderingWolf();
      const onOver = vi.fn();
      game.onGameOver = onOver;
      game.start();

      expect(game.finish()).toBe('userFinished');
      expect(game.finish()).toBe('userFinished');

      expect(onOver).toHaveBeenCalledTimes(1);
      expect(onOver).toHaveBeenCalledWith('userFinished');
      expect(game.running()).toBe(false);
      expect(board.round).toBe(0);
      expect(game.isOver()).toBe(true);
      expect(game.isConfigLocked()).toBe(true);
    });

    it('finish() after an automatic end keeps the earlier reason and does not fire again', () => {
      doomedHumans();
      const onOver = vi.fn();
      game.onGameOver = onOver;
      game.step();

      expect(game.finish()).toBe('humansExtinct');
      expect(onOver).toHaveBeenCalledTimes(1);
    });
  });

  describe('initializeFromLayout', () => {
    function layoutOf(width: number, height: number, cells: Record<number, PlaceableKind>): BoardLayout {
      const layout: BoardLayout = { width, height, cells: new Array(width * height).fill(null) };
      for (const [index, kind] of Object.entries(cells)) layout.cells[Number(index)] = kind;
      return layout;
    }

    it('places one entity per non-null cell using the given config, locks it and records round 0', () => {
      board.resize(3, 2);
      const config = quietConfig({ wolf: { startingHealth: 77 } });
      game.initializeFromLayout(
        layoutOf(3, 2, { 0: 'male', 2: 'female', 3: 'wolf', 4: 'dog', 5: 'fruit', 1: 'mushroom' }),
        config,
      );

      expect(board.getEntity(0, 0)?.type).toBe(EntityType.MALE);
      expect(board.getEntity(1, 0)?.type).toBe(EntityType.MUSHROOM);
      expect(board.getEntity(2, 0)?.type).toBe(EntityType.FEMALE);
      expect(board.getEntity(0, 1)).toBeInstanceOf(Wolf);
      expect(board.getEntity(0, 1)?.health).toBe(77);
      expect(board.getEntity(1, 1)?.type).toBe(EntityType.DOG);
      expect((board.getEntity(2, 1) as Fruit).isRipe()).toBe(false);
      expect(game.isConfigLocked()).toBe(true);
      expect(game.getConfig().wolf.startingHealth).toBe(77);
      expect(game.getHistory().getRecords()).toEqual([
        {
          round: 0,
          males: 1,
          females: 1,
          pregnant: 0,
          wolves: 1,
          dogs: 1,
          fruits: 1,
          mushrooms: 1,
          events: { deaths: [], births: 0, newPregnancies: 0, fruitsEaten: 0, mushroomsEaten: 0 },
        },
      ]);
      expect(renderer.render).toHaveBeenCalled();
    });

    it('replaces whatever was on the board before', () => {
      board.resize(2, 1);
      game.initializeFromLayout(layoutOf(2, 1, { 0: 'wolf', 1: 'wolf' }), quietConfig());
      game.reset();
      game.initializeFromLayout(layoutOf(2, 1, { 1: 'dog' }));
      expect(board.getEntity(0, 0)).toBeNull();
      expect(board.getEntity(1, 0)?.type).toBe(EntityType.DOG);
    });

    it('throws on a size mismatch and changes nothing', () => {
      board.resize(2, 2);
      board.setEntity(0, 0, new Wolf(0, 0, 80, 0, 0));
      expect(() => game.initializeFromLayout(layoutOf(3, 2, {}))).toThrow(/does not match board size 2x2/);
      expect(() => game.initializeFromLayout({ width: 2, height: 2, cells: [null] })).toThrow();
      expect(game.isConfigLocked()).toBe(false);
      expect(board.getEntity(0, 0)).toBeInstanceOf(Wolf);
    });
  });

  describe('initializeBoardAsync', () => {
    const spawnConfig = () =>
      createConfig({
        spawn: {
          maleHumanProbability: 0.1,
          femaleHumanProbability: 0.1,
          wolfProbability: 0.05,
          dogProbability: 0.05,
          fruitProbability: 0.1,
          mushroomProbability: 0.05,
        },
      });
    const serialize = (b: Board) => b.getAllEntities().map((e) => `${e.type}@${e.x},${e.y}:${e.health}`);
    const immediate = () => Promise.resolve();

    it('produces the same board as initializeBoard for the same seed and reports progress', async () => {
      Random.seed(11);
      game.initializeBoard(spawnConfig());
      const expected = serialize(board);
      game.reset();

      Random.seed(11);
      const progress: number[] = [];
      const done = await game.initializeBoardAsync(spawnConfig(), {
        chunks: 4,
        onProgress: (f) => progress.push(f),
        yieldToEventLoop: immediate,
      });

      expect(done).toBe(true);
      expect(serialize(board)).toEqual(expected);
      expect(expected.length).toBeGreaterThan(0);
      expect(progress[0]).toBe(0);
      expect(progress[progress.length - 1]).toBe(1);
      expect(progress).toHaveLength(5); // 0 + one per chunk (10 rows / 4 chunks → 3,3,3,1 rows)
      expect([...progress].sort((a, b) => a - b)).toEqual(progress);
      expect(game.isConfigLocked()).toBe(true);
      expect(game.isInitializing()).toBe(false);
      expect(game.getHistory().length).toBe(1);
    });

    it('uses a 0 ms timeout to yield by default', async () => {
      const promise = game.initializeBoardAsync(spawnConfig());
      expect(game.isInitializing()).toBe(true);
      await vi.runAllTimersAsync();
      expect(await promise).toBe(true);
      expect(game.getHistory().length).toBe(1);
    });

    it('reset() during initialization aborts it: board empty, config unlocked, no history', async () => {
      let release: () => void = () => {};
      const promise = game.initializeBoardAsync(spawnConfig(), {
        chunks: 5,
        yieldToEventLoop: () => new Promise<void>((resolve) => (release = resolve)),
      });
      expect(board.getAllEntities().length).toBeGreaterThan(0); // first chunk already placed
      expect(game.isConfigLocked()).toBe(true);

      game.reset();
      release();

      expect(await promise).toBe(false);
      expect(board.getAllEntities()).toHaveLength(0);
      expect(game.isConfigLocked()).toBe(false);
      expect(game.getHistory().length).toBe(0);
      expect(game.isInitializing()).toBe(false);
    });

    it('rounds cannot start while the board is being populated', async () => {
      let release: () => void = () => {};
      const promise = game.initializeBoardAsync(quietConfig(), {
        yieldToEventLoop: () => new Promise<void>((resolve) => (release = resolve)),
      });
      game.start();
      game.step();
      expect(game.running()).toBe(false);
      expect(board.round).toBe(0);

      for (let i = 0; i < 20 && game.isInitializing(); i++) {
        release();
        await Promise.resolve();
        await Promise.resolve();
      }
      expect(await promise).toBe(true);
      game.setAnimationDuration(0);
      game.step();
      expect(board.round).toBe(1);
    });

    it('a newer initialization aborts the pending one, which leaves the board alone', async () => {
      let release: () => void = () => {};
      const promise = game.initializeBoardAsync(spawnConfig(), {
        yieldToEventLoop: () => new Promise<void>((resolve) => (release = resolve)),
      });
      board.resize(2, 1);
      game.initializeFromLayout({ width: 2, height: 1, cells: ['wolf', null] });
      release();

      expect(await promise).toBe(false);
      expect(serialize(board)).toEqual([`${EntityType.WOLF}@0,0:${game.getConfig().wolf.startingHealth}`]);
      expect(game.getHistory().length).toBe(1);
    });
  });
});
