import type { ChallengeProgress } from '../../core/challenges';

export interface ChallengeHud {
  /** Show the HUD for a new game (round 0). */
  show(progress: ChallengeProgress): void;
  /** Refresh after a round. */
  update(progress: ChallengeProgress): void;
  hide(): void;
  destroy(): void;
}

/**
 * W0 stub of the challenge HUD: only toggles the mount's visibility.
 * Workstream W-B renders the goal and progress bar.
 */
export function createChallengeHud(mount: HTMLElement): ChallengeHud {
  return {
    show(): void {
      mount.hidden = false;
    },
    update(): void {},
    hide(): void {
      mount.hidden = true;
    },
    destroy(): void {
      mount.hidden = true;
    },
  };
}
