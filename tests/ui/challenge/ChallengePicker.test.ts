import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/ui/notifications', () => ({ showNotification: vi.fn() }));

import { CHALLENGES } from '../../../src/core/challenges';
import { i18n } from '../../../src/i18n/i18n';
import { Language } from '../../../src/i18n/types';
import { type ChallengePicker, createChallengePicker } from '../../../src/ui/challenge/ChallengePicker';
import { ConfigPanel } from '../../../src/ui/ConfigPanel';
import { bodyHtml, input, setInput, startBtn } from '../configFixture';

describe('ChallengePicker', () => {
  let panel: ConfigPanel;
  let picker: ChallengePicker;
  const select = () => document.getElementById('challengeSelect') as HTMLSelectElement;
  const mount = () => document.getElementById('challengeMount')!;
  const choose = (value: string) => {
    select().value = value;
    select().dispatchEvent(new Event('change'));
  };

  beforeEach(() => {
    i18n.setLanguage(Language.EN);
    document.body.innerHTML = bodyHtml;
    panel = new ConfigPanel();
    panel.show();
    picker = createChallengePicker(mount(), panel);
  });

  afterEach(() => {
    picker.destroy();
    panel.destroy();
    i18n.setLanguage(Language.EN);
  });

  it('lists free play and the 9 challenges with emoji and name; free play by default', () => {
    const options = Array.from(select().options);
    expect(options.map((o) => o.value)).toEqual(['free', ...CHALLENGES.map((c) => c.id)]);
    expect(options[0].textContent).toBe('Free play');
    expect(options.find((o) => o.value === 'babyBoom')?.textContent).toBe('👶 Baby boom');
    expect(select().value).toBe('free');
    expect(picker.getSelected()).toBe('free');
    expect(mount().querySelector('label')?.htmlFor).toBe('challengeSelect');
    expect(mount().textContent).toContain('No goal');
  });

  it('shows the goal and the tip of the chosen challenge', () => {
    choose('babyBoom');
    expect(mount().querySelector('.challenge-picker-goal')?.textContent).toBe('Goal: Get 100 babies born.');
    expect(mount().querySelector('.challenge-picker-hint')?.textContent).toMatch(/^💡 Tip: /);
    expect((mount().querySelector('.challenge-picker-locked') as HTMLElement).hidden).toBe(true);
  });

  it('Start emits the chosen challengeId', () => {
    const onStart = vi.fn();
    panel.onStart(onStart);
    choose('survive');
    startBtn().click();
    expect(onStart.mock.calls[0][1].challengeId).toBe('survive');
  });

  it('locks the dog spawn fields for noDogs and restores the values when released', () => {
    setInput('spawnDog', '0.03');
    setInput('dogSpawn', '0.002');
    choose('noDogs');
    expect(input('spawnDog').value).toBe('0');
    expect(input('dogSpawn').value).toBe('0');
    expect(input('spawnDog').disabled).toBe(true);
    expect(input('dogSpawn').disabled).toBe(true);
    expect(document.getElementById('spawnDog-lock')).not.toBeNull();
    expect((mount().querySelector('.challenge-picker-locked') as HTMLElement).hidden).toBe(false);
    expect(picker.lockedFields?.()).toEqual({ spawnDog: 0, dogSpawn: 0 });

    const onStart = vi.fn();
    panel.onStart(onStart);
    startBtn().click();
    expect(onStart.mock.calls[0][0].spawn.dogProbability).toBe(0);
    expect(onStart.mock.calls[0][0].dog.spawnProbability).toBe(0);

    panel.show();
    choose('noFruits');
    expect(input('spawnDog').value).toBe('0.03');
    expect(input('dogSpawn').value).toBe('0.002');
    expect(input('spawnDog').disabled).toBe(false);
    expect(input('spawnFruit').value).toBe('0');
    expect(input('fruitSpawn').value).toBe('0');

    choose('free');
    expect(input('spawnFruit').disabled).toBe(false);
    expect(picker.lockedFields?.()).toEqual({});
  });

  it('saves the id and loads it back (unknown data → free play)', () => {
    choose('balance');
    expect(picker.save?.()).toBe('balance');
    panel.applyLoadedData({ config: {}, plugins: { challenge: 'noFruits' } }, 'x.json');
    expect(select().value).toBe('noFruits');
    expect(input('fruitSpawn').disabled).toBe(true);
    picker.load?.('nonsense');
    expect(picker.getSelected()).toBe('free');
    expect(input('fruitSpawn').disabled).toBe(false);
    picker.select('wiseElders');
    expect(select().value).toBe('wiseElders');
  });

  it('relabels when the language changes', () => {
    choose('survive');
    i18n.setLanguage(Language.PL);
    expect(select().options[0].textContent).toBe('Swobodna gra');
    expect(select().selectedOptions[0].textContent).toBe('⏳ Przetrwanie');
    expect(mount().querySelector('label')?.textContent).toBe('🏆 Wyzwanie');
    expect(mount().querySelector('.challenge-picker-goal')?.textContent).toMatch(/^Cel: /);
  });

  it('destroy removes the picker and stops relabelling', () => {
    picker.destroy();
    expect(document.getElementById('challengeSelect')).toBeNull();
    i18n.setLanguage(Language.PL); // no error from a detached listener
  });
});
