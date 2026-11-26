import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/ui/notifications', () => ({ showNotification: vi.fn() }));

import { createClassicConfigForm, DEFAULT_CLASSIC_CONFIG, parseBoardSize } from '../../src/classic/ClassicConfigForm';
import { i18n } from '../../src/i18n/i18n';
import { Language } from '../../src/i18n/types';
import { ConfigPanel } from '../../src/ui/ConfigPanel';
import { bodyHtml, startBtn } from '../ui/configFixture';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const type = (id: string, value: string) => {
  const el = $<HTMLInputElement>(id);
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
};
const choose = (id: string, value: string) => {
  const el = $<HTMLSelectElement>(id);
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
};
const pickStart = (kind: string) => {
  const radio = document.querySelector<HTMLInputElement>(`input[name="classicStart"][value="${kind}"]`)!;
  radio.checked = true;
  radio.dispatchEvent(new Event('change', { bubbles: true }));
};
const row = (id: string) => $(id).closest<HTMLElement>('.classic-field')!;
const errorOf = (id: string) => row(id).querySelector('.field-error')?.textContent ?? '';

describe('ClassicConfigForm', () => {
  let panel: ConfigPanel;
  let form: ReturnType<typeof createClassicConfigForm>;

  beforeEach(() => {
    i18n.setLanguage(Language.EN);
    document.body.innerHTML = bodyHtml;
    panel = new ConfigPanel();
    form = createClassicConfigForm($('classicConfigMount'), panel);
    panel.setMode('classic');
  });

  afterEach(() => {
    form.destroy();
    panel.destroy();
  });

  it('renders the defaults and emits them on Start with mode classic', () => {
    expect(form.read()).toEqual(DEFAULT_CLASSIC_CONFIG);
    expect(form.validate?.('classic')).toBe(0);
    expect(form.startOptions?.()).toEqual({ mode: 'classic', classic: DEFAULT_CLASSIC_CONFIG });
    expect($<HTMLInputElement>('classicWidth').min).toBe('10');
    expect($<HTMLInputElement>('classicWidth').max).toBe('200');
    expect(row('classicRuleCustom').hidden).toBe(true);
    expect(row('classicDensity').hidden).toBe(false);
    expect(row('classicPattern').hidden).toBe(true);
    expect(document.querySelector('label[for="classicDensity"]')?.textContent).toBe('Live cells at start: 30%');
    const onStart = vi.fn();
    panel.onStart(onStart);
    startBtn().click();
    expect(onStart.mock.calls[0][1]).toMatchObject({ mode: 'classic', classic: DEFAULT_CLASSIC_CONFIG });
  });

  it('validates the board size live (10–200 whole numbers)', () => {
    expect(parseBoardSize(' 42 ')).toBe(42);
    for (const bad of ['9', '201', '12.5', '', 'abc']) {
      type('classicWidth', bad);
      expect(form.validate?.('classic'), bad).toBe(1);
      expect(errorOf('classicWidth')).toBe('Enter a whole number from 10 to 200.');
      expect(startBtn().disabled).toBe(true);
    }
    type('classicHeight', '0');
    expect(form.validate?.('classic')).toBe(2);
    expect(form.validate?.('ecosystem')).toBe(0); // only counts in classic mode
    expect(form.read().width).toBe(50); // invalid → default
    type('classicWidth', '200');
    type('classicHeight', '10');
    expect(form.validate?.('classic')).toBe(0);
    expect(startBtn().disabled).toBe(false);
    expect(form.read()).toMatchObject({ width: 200, height: 10 });
  });

  it('shows the custom rule field only for "custom"; an invalid rule blocks Start with an inline error', () => {
    choose('classicRulePreset', 'custom');
    expect(row('classicRuleCustom').hidden).toBe(false);
    type('classicRuleCustom', 'B3/S2x');
    expect(form.validate?.('classic')).toBeGreaterThanOrEqual(1);
    expect(errorOf('classicRuleCustom')).toContain('B3/S23');
    expect($('classicRuleCustom').getAttribute('aria-invalid')).toBe('true');
    expect(startBtn().disabled).toBe(true);
    type('classicRuleCustom', 'b36/s125');
    expect(form.validate?.('classic')).toBe(0);
    expect(errorOf('classicRuleCustom')).toBe('');
    expect(form.read().rule).toBe('B36/S125');
    expect(document.querySelector('.classic-settings .classic-rule-text')?.textContent).toContain(
      'a dead cell with 3 or 6 neighbours is born',
    );
    choose('classicRulePreset', 'seeds');
    expect(row('classicRuleCustom').hidden).toBe(true);
    expect(form.read().rule).toBe('B2/S');
  });

  it('start options: density slider, pattern select (with a size check) and draw', () => {
    type('classicDensity', '55');
    expect(form.read().start).toEqual({ kind: 'random', density: 0.55 });
    expect(document.querySelector('label[for="classicDensity"]')?.textContent).toBe('Live cells at start: 55%');
    pickStart('pattern');
    expect(row('classicDensity').hidden).toBe(true);
    expect(row('classicPattern').hidden).toBe(false);
    expect(form.read().start).toEqual({ kind: 'pattern', patternId: 'gosperGun' });
    type('classicWidth', '20');
    expect(form.validate?.('classic')).toBe(1);
    expect(errorOf('classicPattern')).toBe('This pattern needs a board of at least 36×9 cells.');
    choose('classicPattern', 'glider');
    expect(form.validate?.('classic')).toBe(0);
    pickStart('draw');
    expect(form.read().start).toEqual({ kind: 'draw' });
    expect(document.querySelector<HTMLElement>('.classic-draw-info')?.hidden).toBe(false);
  });

  it('save → load round-trips through the config panel file format', () => {
    type('classicWidth', '120');
    type('classicHeight', '80');
    choose('classicRulePreset', 'custom');
    type('classicRuleCustom', 'B36/S125');
    pickStart('pattern');
    choose('classicPattern', 'acorn');
    const saved = form.save?.();
    expect(saved).toEqual({ width: 120, height: 80, rule: 'B36/S125', start: { kind: 'pattern', patternId: 'acorn' } });

    form.load?.(DEFAULT_CLASSIC_CONFIG);
    expect(form.read()).toEqual(DEFAULT_CLASSIC_CONFIG);
    panel.applyLoadedData({ config: {}, mode: 'classic', plugins: { classic: saved } }, 'saved.json');
    expect(form.read()).toEqual(saved);

    form.load?.({ rule: 'B3678/S34678', start: { kind: 'random', density: 2 } });
    expect($<HTMLSelectElement>('classicRulePreset').value).toBe('dayNight');
    expect(form.read().start).toEqual({ kind: 'random', density: 0.9 }); // clamped to the slider
  });

  it('ignores malformed saved data', () => {
    const before = form.read();
    form.load?.(null);
    form.load?.('x');
    form.load?.({ width: '7', start: { kind: 'teleport' } });
    form.load?.({ start: { kind: 'pattern', patternId: 'nope' } });
    expect(form.read()).toEqual({ ...before, start: { kind: 'pattern', patternId: 'gosperGun' } });
  });

  it('relabels on language change and keeps the values', () => {
    type('classicWidth', '77');
    i18n.setLanguage(Language.PL);
    expect(document.querySelector('label[for="classicWidth"]')?.textContent).toBe('Szerokość planszy (komórki):');
    expect($<HTMLSelectElement>('classicRulePreset').selectedOptions[0].textContent).toBe('Życie Conwaya (B3/S23)');
    expect($<HTMLInputElement>('classicWidth').value).toBe('77');
    i18n.setLanguage(Language.EN);
  });

  it('destroy() removes the form and stops listening', () => {
    form.destroy();
    expect($('classicConfigMount').childElementCount).toBe(0);
    i18n.setLanguage(Language.PL); // no listener left to throw on detached nodes
    i18n.setLanguage(Language.EN);
  });
});
