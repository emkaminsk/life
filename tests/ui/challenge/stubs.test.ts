import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/ui/notifications', () => ({ showNotification: vi.fn() }));

import type { ChallengeProgress } from '../../../src/core/challenges';
import { createChallengeHud } from '../../../src/ui/challenge/ChallengeHud';
import { createChallengePicker } from '../../../src/ui/challenge/ChallengePicker';
import { ConfigPanel } from '../../../src/ui/ConfigPanel';
import { bodyHtml } from '../configFixture';

describe('challenge UI (W0 stubs)', () => {
  it('the picker registers as a plugin and always picks free play', () => {
    document.body.innerHTML = bodyHtml;
    const panel = new ConfigPanel();
    const picker = createChallengePicker(document.getElementById('challengeMount')!, panel);
    const onStart = vi.fn();
    panel.onStart(onStart);
    document.getElementById('startGameBtn')!.click();
    expect(onStart.mock.calls[0][1].challengeId).toBe('free');
    picker.destroy();
    panel.destroy();
  });

  it('the HUD toggles its mount', () => {
    const mount = document.createElement('section');
    mount.hidden = true;
    const hud = createChallengeHud(mount);
    const progress: ChallengeProgress = { id: 'survive', value: 0, target: 300, status: 'inProgress', round: 0 };
    hud.show(progress);
    expect(mount.hidden).toBe(false);
    hud.update(progress);
    hud.hide();
    expect(mount.hidden).toBe(true);
    hud.show(progress);
    hud.destroy();
    expect(mount.hidden).toBe(true);
  });
});
