import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ChallengeProgress } from '../../../src/core/challenges';
import { i18n } from '../../../src/i18n/i18n';
import { Language } from '../../../src/i18n/types';
import { type ChallengeHud, challengeStatusText, createChallengeHud } from '../../../src/ui/challenge/ChallengeHud';

const progress = (p: Partial<ChallengeProgress> = {}): ChallengeProgress => ({
  id: 'babyBoom',
  value: 25,
  target: 100,
  status: 'inProgress',
  round: 10,
  ...p,
});

describe('ChallengeHud', () => {
  let mount: HTMLElement;
  let hud: ChallengeHud;
  const q = (selector: string) => mount.querySelector(selector) as HTMLElement;

  beforeEach(() => {
    i18n.setLanguage(Language.EN);
    mount = document.createElement('section');
    mount.hidden = true;
    document.body.replaceChildren(mount);
    hud = createChallengeHud(mount);
  });

  afterEach(() => {
    hud.destroy();
    i18n.setLanguage(Language.EN);
  });

  it('stays hidden until shown (free play)', () => {
    expect(mount.hidden).toBe(true);
    hud.update(progress()); // updating a hidden HUD does not show it
    expect(mount.hidden).toBe(true);
  });

  it('renders emoji, name, goal, progress bar with aria values and status', () => {
    hud.show(progress());
    expect(mount.hidden).toBe(false);
    expect(q('.challenge-hud-emoji').textContent).toBe('👶');
    expect(q('.challenge-hud-name').textContent).toBe('Baby boom');
    expect(q('.challenge-hud-goal').textContent).toBe('Get 100 babies born.');
    const bar = q('[role="progressbar"]');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuenow')).toBe('25');
    expect(bar.getAttribute('aria-valuetext')).toBe('25 / 100');
    expect(bar.getAttribute('aria-label')).toBe('Challenge progress');
    expect(q('.challenge-bar-fill').style.width).toBe('25%');
    expect(q('.challenge-hud-value').textContent).toBe('25 / 100');
    expect(q('.challenge-badge').textContent).toBe('In progress');
  });

  it('updates after a round: complete and failed with a reason', () => {
    hud.show(progress());
    hud.update(progress({ value: 100, status: 'complete' }));
    expect(q('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('100');
    expect(q('.challenge-badge').textContent).toBe('Complete ✓');
    expect(q('.challenge-badge').dataset.status).toBe('complete');
    hud.update(
      progress({ id: 'noCrowding', value: 40, target: 150, status: 'failed', failReason: 'overcrowdingDeath' }),
    );
    expect(q('.challenge-badge').textContent).toBe('Failed ✗ – someone died of overcrowding');
    expect(q('.challenge-hud-emoji').textContent).toBe('🏘️');
  });

  it('a target of 0 shows an empty bar until complete, then a full one', () => {
    hud.show(progress({ id: 'clearDangers', value: 0, target: 0 }));
    expect(q('.challenge-bar-fill').style.width).toBe('0%');
    hud.update(progress({ id: 'clearDangers', value: 0, target: 0, status: 'complete' }));
    expect(q('.challenge-bar-fill').style.width).toBe('100%');
  });

  it('relabels on language change; hide() hides it again', () => {
    hud.show(progress());
    i18n.setLanguage(Language.PL);
    expect(q('.challenge-hud-name').textContent).toBe('Wyż demograficzny');
    expect(q('.challenge-badge').textContent).toBe('W toku');
    hud.hide();
    expect(mount.hidden).toBe(true);
    i18n.setLanguage(Language.EN); // hidden: nothing to re-render
    expect(q('.challenge-hud-name').textContent).toBe('Wyż demograficzny');
  });

  it('challengeStatusText: failed without a reason uses the plain status', () => {
    expect(challengeStatusText(progress({ status: 'failed' }))).toBe('Failed ✗');
  });

  it('destroy empties and hides the mount', () => {
    hud.show(progress());
    hud.destroy();
    expect(mount.hidden).toBe(true);
    expect(mount.childElementCount).toBe(0);
  });
});
