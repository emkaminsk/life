import { vi } from 'vitest';
import { DEFAULT_CONFIG } from '../src/config';
import type { GameConfig } from '../src/ui/ConfigPanel';
import { Board } from '../src/core/Board';
import type { Renderer } from '../src/core/Renderer';
import { Human, Wolf } from '../src/entities';
import { Sex } from '../src/types';

/**
 * Test utilities and factory functions for consistent test setup
 */

export type ConfigOverrides = { [K in keyof GameConfig]?: Partial<GameConfig[K]> };

/**
 * Create a deep copy of DEFAULT_CONFIG with optional (per-section, partial) overrides
 * Useful for testing how parameter changes affect behavior
 */
export function createConfig(overrides: ConfigOverrides = {}): GameConfig {
  const { simulation: _simulation, ...config } = structuredClone(DEFAULT_CONFIG);

  // Apply overrides while preserving nested structure
  Object.entries(overrides).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      Object.assign((config as any)[key], value);
    } else {
      (config as any)[key] = value;
    }
  });

  return config;
}

/**
 * Create a test board with specified dimensions
 */
export function createBoard(width: number = 30, height: number = 30): Board {
  return new Board(width, height);
}

/**
 * Factory for creating test humans
 */
export function createHuman(
  x: number = 15,
  y: number = 15,
  sex: Sex = Sex.MALE,
  config: GameConfig = DEFAULT_CONFIG,
): Human {
  const human = new Human(x, y, sex);
  // Respect genome.maxHealth - health should never exceed it
  human.health = Math.min(config.human.startingHealth, human.genome.maxHealth);
  return human;
}

/**
 * Factory for creating test females
 */
export function createFemale(x: number = 15, y: number = 15, config: GameConfig = DEFAULT_CONFIG): Human {
  return createHuman(x, y, Sex.FEMALE, config);
}

/**
 * Factory for creating test males
 */
export function createMale(x: number = 15, y: number = 15, config: GameConfig = DEFAULT_CONFIG): Human {
  return createHuman(x, y, Sex.MALE, config);
}

/**
 * Factory for creating test wolves
 */
export function createWolf(x: number = 10, y: number = 10, config: GameConfig = DEFAULT_CONFIG): Wolf {
  const wolf = new Wolf(x, y);
  wolf.health = config.wolf.startingHealth;
  return wolf;
}

/**
 * Place an entity on the board at a specific location
 */
export function placeEntity(board: Board, entity: any, x: number, y: number): void {
  board.setEntity(x, y, entity);
}

/** Mock functions of the Renderer methods used by Game and the systems. */
export interface MockRendererFns {
  render: ReturnType<typeof vi.fn>;
  renderFull: ReturnType<typeof vi.fn>;
  addVisualEffect: ReturnType<typeof vi.fn>;
  markDirty: ReturnType<typeof vi.fn>;
  markAllDirty: ReturnType<typeof vi.fn>;
  markAnimationPaths: ReturnType<typeof vi.fn>;
  renderAnimationFrame: ReturnType<typeof vi.fn>;
  setInjuredThreshold: ReturnType<typeof vi.fn>;
  resize: ReturnType<typeof vi.fn>;
  clearVisualEffects: ReturnType<typeof vi.fn>;
  getCellSize: ReturnType<typeof vi.fn>;
  fitToWidth: ReturnType<typeof vi.fn>;
}

/**
 * Create a mock Renderer that does nothing (avoids canvas dependency in tests).
 * Typed as Renderer for passing to Game/systems; cast to MockRendererFns (or use
 * vi.mocked) to inspect calls.
 */
export function createMockRenderer(): Renderer & MockRendererFns {
  const mock: MockRendererFns = {
    render: vi.fn(),
    renderFull: vi.fn(),
    addVisualEffect: vi.fn(),
    markDirty: vi.fn(),
    markAllDirty: vi.fn(),
    markAnimationPaths: vi.fn(),
    renderAnimationFrame: vi.fn(),
    setInjuredThreshold: vi.fn(),
    resize: vi.fn(),
    clearVisualEffects: vi.fn(),
    getCellSize: vi.fn().mockReturnValue(20),
    fitToWidth: vi.fn(),
  };
  return mock as unknown as Renderer & MockRendererFns;
}
