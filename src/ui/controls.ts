import { i18n } from '../i18n/i18n';

/** The subset of Game the control buttons drive. */
export interface ControllableGame {
  running(): boolean;
  start(): void;
  pause(): void;
  step(): void;
  stepRounds(n: number): void;
}

export interface ControlButtons {
  pause: HTMLButtonElement;
  step: HTMLButtonElement;
  runFive: HTMLButtonElement;
  run: HTMLButtonElement;
  reset: HTMLButtonElement;
  finish: HTMLButtonElement;
}

/**
 * - idle: no game on the board (config panel showing); everything disabled.
 * - running: continuous simulation; only Pause / Reset / Finish usable.
 * - paused: Resume, Step, Run Five Rounds, Run Free, Reset, Finish usable.
 * - stepping: a step / five-round sequence is executing; stepping and
 *   play/pause are disabled until Game.onStepComplete (PRD 3.8.8).
 */
export type ControlState = 'idle' | 'running' | 'paused' | 'stepping';

export const FIVE_ROUNDS = 5;

/**
 * State machine for the sidebar buttons. All user actions (mouse and keyboard)
 * go through here so button state and game state cannot drift apart.
 */
export class GameControls {
  private state: ControlState = 'idle';

  /** Called after every state transition (e.g. to reset the rounds/sec meter). */
  onStateChange?: (state: ControlState) => void;

  constructor(
    private readonly game: ControllableGame,
    private readonly buttons: ControlButtons,
    private readonly t: (key: string) => string = (key) => i18n.t(key),
  ) {
    this.apply();
  }

  getState(): ControlState {
    return this.state;
  }

  canStep(): boolean {
    return this.state === 'paused';
  }

  /** A new game has been initialized: start it automatically (PRD 3.13.6). */
  begin(): void {
    this.game.start();
    this.setState('running');
  }

  /** No game on the board (after Reset / Finish or before the first start). */
  setIdle(): void {
    if (this.game.running()) this.game.pause();
    this.setState('idle');
  }

  /** Space / Pause-Resume button. */
  togglePause(): void {
    if (this.state === 'running') this.pause();
    else if (this.state === 'paused') this.runFree();
  }

  pause(): void {
    if (this.state !== 'running') return;
    this.game.pause();
    this.setState('paused');
  }

  runFree(): void {
    if (this.state !== 'paused') return;
    this.game.start();
    this.setState('running');
  }

  step(): void {
    if (!this.canStep()) return;
    this.setState('stepping');
    this.game.step();
  }

  stepFive(): void {
    if (!this.canStep()) return;
    this.setState('stepping');
    this.game.stepRounds(FIVE_ROUNDS);
  }

  /**
   * Wire to Game.onStepComplete. Only a finished step sequence re-enables the
   * step buttons; it never does so while the simulation runs continuously.
   */
  handleStepComplete(): void {
    if (this.state === 'stepping' && !this.game.running()) {
      this.setState('paused');
    }
  }

  /** Re-apply translated labels (Pause vs Resume) after a language change. */
  refreshLabels(): void {
    this.buttons.pause.textContent = this.t(this.state === 'paused' ? 'controls.resume' : 'controls.pause');
  }

  private setState(state: ControlState): void {
    this.state = state;
    this.apply();
    this.onStateChange?.(state);
  }

  private apply(): void {
    const { pause, step, runFive, run, reset, finish } = this.buttons;
    const s = this.state;
    pause.disabled = !(s === 'running' || s === 'paused');
    step.disabled = s !== 'paused';
    runFive.disabled = s !== 'paused';
    run.disabled = s !== 'paused';
    reset.disabled = s === 'idle';
    finish.disabled = s === 'idle';
    this.refreshLabels();
  }
}
