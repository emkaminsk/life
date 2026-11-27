import type { ControllableGame } from '../ui/controls';

/**
 * Classic Life (Conway-style cellular automaton) contracts (frozen, see tasks/todo.md).
 * Edges wrap around (toroidal). `rule` is B/S notation, e.g. "B3/S23".
 */
export type ClassicStart =
  | { kind: 'random'; density: number }
  | { kind: 'pattern'; patternId: string }
  | { kind: 'draw' };

export interface ClassicConfig {
  width: number;
  height: number;
  rule: string;
  start: ClassicStart;
}

/**
 * One classic game, driven by GameControls through app.ts's control proxy.
 * - begin() sets up generation 0 and starts running unless `startPaused`
 *   (a 'draw' start always begins paused); app.ts then calls
 *   controls.begin(!session.running()), so start() must be a no-op while running.
 * - step()/stepRounds() fire onRoundComplete per generation and onStepComplete
 *   when the sequence is done; onGameOver fires once if the session ends by itself.
 */
export interface ClassicSession extends ControllableGame {
  begin(config: ClassicConfig, opts: { startPaused: boolean }): void;
  /** Stop and clear the board (Reset). */
  end(): void;
  setSpeed(ms: number): void;
  /** Fit the canvas into the available CSS pixels. */
  fit(availW: number, availH: number): void;
  getGeneration(): number;
  isOver(): boolean;
  /** Remove every listener and timer. */
  destroy(): void;
  onRoundComplete?(): void;
  onStepComplete?(): void;
  onGameOver?(): void;
}
