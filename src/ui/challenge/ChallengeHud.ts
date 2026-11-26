import { type ChallengeProgress, getChallenge } from '../../core/challenges';
import { i18n } from '../../i18n/i18n';
import './challenge.css';

export interface ChallengeHud {
  /** Show the HUD for a new game (round 0). */
  show(progress: ChallengeProgress): void;
  /** Refresh after a round. */
  update(progress: ChallengeProgress): void;
  hide(): void;
  destroy(): void;
}

/** Text of the status badge, e.g. "Failed ✗ – all humans died out". */
export function challengeStatusText(progress: ChallengeProgress): string {
  if (progress.status === 'failed' && progress.failReason) {
    return i18n.t('challenges.failedWithReason', i18n.t(`challenges.failReason.${progress.failReason}`));
  }
  return i18n.t(`challenges.status.${progress.status}`);
}

/** Bar fill in percent; a target of 0 is full once complete. */
function percent({ value, target, status }: ChallengeProgress): number {
  if (target <= 0) return status === 'complete' ? 100 : 0;
  return Math.max(0, Math.min(100, (value / target) * 100));
}

/**
 * Challenge HUD in the side panel (#challengePanel): emoji + name, the goal,
 * a progress bar (role="progressbar" with aria values) labelled
 * "{value} / {target}", and a status badge. Hidden in free play (app.ts
 * calls hide()); re-renders the last progress when the language changes.
 */
export function createChallengeHud(mount: HTMLElement): ChallengeHud {
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string) => {
    const node = document.createElement(tag);
    node.className = className;
    return node;
  };
  const root = el('div', 'challenge-hud');
  const head = el('div', 'challenge-hud-head');
  const emoji = el('span', 'challenge-hud-emoji');
  emoji.setAttribute('aria-hidden', 'true');
  const name = el('h2', 'challenge-hud-name');
  const badge = el('span', 'challenge-badge');
  badge.setAttribute('role', 'status');
  head.append(emoji, name, badge);
  const goal = el('p', 'challenge-hud-goal');
  const row = el('div', 'challenge-hud-row');
  const bar = el('div', 'challenge-bar');
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuemin', '0');
  const fill = el('div', 'challenge-bar-fill');
  bar.append(fill);
  const value = el('span', 'challenge-hud-value');
  row.append(bar, value);
  root.append(head, goal, row);
  mount.replaceChildren(root);

  let current: ChallengeProgress | null = null;

  function render(): void {
    const p = current;
    if (!p) return;
    const def = getChallenge(p.id);
    emoji.textContent = def?.emoji ?? '🏆';
    name.textContent = i18n.t(`challenges.${p.id}.name`);
    goal.textContent = i18n.t(`challenges.${p.id}.goal`);
    const label = i18n.t('challenges.progress', p.value, p.target);
    value.textContent = label;
    bar.setAttribute('aria-label', i18n.t('challenges.progressLabel'));
    bar.setAttribute('aria-valuemax', String(p.target));
    bar.setAttribute('aria-valuenow', String(p.value));
    bar.setAttribute('aria-valuetext', label);
    fill.style.width = `${percent(p)}%`;
    badge.textContent = challengeStatusText(p);
    badge.dataset.status = p.status;
    root.dataset.status = p.status;
  }

  const hud: ChallengeHud = {
    show(progress) {
      current = progress;
      render();
      mount.hidden = false;
    },
    update(progress) {
      current = progress;
      render();
    },
    hide() {
      current = null;
      mount.hidden = true;
    },
    destroy() {
      i18n.offLanguageChange(render);
      hud.hide();
      mount.replaceChildren();
    },
  };
  i18n.onLanguageChange(render);
  return hud;
}
