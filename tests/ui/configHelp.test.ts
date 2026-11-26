import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '../../src/i18n/i18n';
import { en, pl } from '../../src/i18n/sections/configHelp';
import { Language } from '../../src/i18n/types';
import { attachFieldHelp, rangeHint } from '../../src/ui/configHelp';
import { FIELD_RULES, type FieldRule } from '../../src/ui/configValidation';
import { bodyHtml, input } from './configFixture';

const helpTexts = (lang: typeof en) => lang as unknown as Record<string, unknown>;

describe('config field help texts (F2)', () => {
  it('every config field has a non-empty EN and PL explanation that differ', () => {
    for (const rule of FIELD_RULES) {
      const e = helpTexts(en)[rule.id];
      const p = helpTexts(pl)[rule.id];
      expect(typeof e === 'string' && e.length > 20, rule.id).toBe(true);
      expect(typeof p === 'string' && p.length > 20, rule.id).toBe(true);
      expect(p, rule.id).not.toBe(e);
    }
  });

  it('every config field exists in the real markup with a label', () => {
    document.body.innerHTML = bodyHtml;
    for (const rule of FIELD_RULES) {
      expect(input(rule.id), rule.id).toBeInstanceOf(HTMLInputElement);
      expect(document.querySelector(`label[for="${rule.id}"]`), rule.id).not.toBeNull();
    }
  });
});

describe('rangeHint', () => {
  const t = i18n.t.bind(i18n);
  beforeEach(() => i18n.setLanguage(Language.EN));

  it('describes min/max, open ranges and whole numbers', () => {
    const rule = (r: Partial<FieldRule>): FieldRule => ({ id: 'x', section: 'board', key: 'width', min: 0, ...r });
    expect(rangeHint(rule({ min: 10, max: 100, integer: true }), t)).toBe(
      'Valid range: 10 to 100 (whole numbers only)',
    );
    expect(rangeHint(rule({ min: 1 }), t)).toBe('Valid range: 1 or more');
  });
});

describe('attachFieldHelp', () => {
  beforeEach(() => {
    i18n.setLanguage(Language.EN);
    document.body.innerHTML = bodyHtml;
  });

  afterEach(() => i18n.setLanguage(Language.EN));

  it('adds an info button and a role=tooltip text to every field', () => {
    attachFieldHelp(FIELD_RULES);
    for (const rule of FIELD_RULES) {
      const tip = document.getElementById(`${rule.id}-help`)!;
      expect(tip.getAttribute('role'), rule.id).toBe('tooltip');
      expect(tip.querySelector('.field-help-text')!.textContent).toBe(helpTexts(en)[rule.id]);
      expect(tip.querySelector('.field-help-range')!.textContent).toBe(rangeHint(rule));

      const btn = tip.parentElement!.querySelector<HTMLButtonElement>('.field-help-btn')!;
      expect(btn.type).toBe('button');
      expect(btn.getAttribute('aria-describedby')).toBe(`${rule.id}-help`);
      expect(btn.getAttribute('aria-label')).toMatch(/^More about: \S/);
      expect(btn.getAttribute('aria-label')).not.toMatch(/:$/);
      // the button sits in the field's row, before the input it explains
      expect(btn.compareDocumentPosition(input(rule.id)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      expect(input(rule.id).getAttribute('aria-describedby')).toBe(`${rule.id}-error ${rule.id}-help`);
      expect(input(rule.id).title).toBe(`${helpTexts(en)[rule.id]}\n${rangeHint(rule)}`);
    }
  });

  it('names the button after the field label', () => {
    attachFieldHelp(FIELD_RULES);
    const btn = document.getElementById('boardWidth-help')!.parentElement!.querySelector('.field-help-btn')!;
    expect(btn.getAttribute('aria-label')).toBe('More about: Board Width');
  });

  it('is idempotent and re-translates on a second call', () => {
    attachFieldHelp(FIELD_RULES);
    i18n.setLanguage(Language.PL);
    attachFieldHelp(FIELD_RULES);
    expect(document.querySelectorAll('.field-help-btn')).toHaveLength(FIELD_RULES.length);
    expect(document.querySelectorAll('[role="tooltip"].field-help')).toHaveLength(FIELD_RULES.length);
    expect(document.getElementById('humanGompertzB-help')!.textContent).toContain(pl.humanGompertzB);
    expect(document.getElementById('humanHealth-help')!.textContent).toContain('Prawidłowy zakres: 1 lub więcej');
  });

  it('shows bounds passed in the rules (e.g. a dynamic max)', () => {
    const rule = FIELD_RULES.find((r) => r.id === 'humanThreshold')!;
    attachFieldHelp([{ ...rule, max: 900 }]);
    expect(document.getElementById('humanThreshold-help')!.textContent).toContain('Valid range: 10 to 900');
  });

  it('skips rules without an input', () => {
    attachFieldHelp([{ id: 'doesNotExist', section: 'board', key: 'width', min: 0 }]);
    expect(document.getElementById('doesNotExist-help')).toBeNull();
  });

  describe('interaction', () => {
    const wrap = () => document.getElementById('dogHealth-help')!.parentElement!;
    const btn = () => wrap().querySelector<HTMLButtonElement>('.field-help-btn')!;

    beforeEach(() => attachFieldHelp(FIELD_RULES));

    it('click toggles the tooltip open (touch screens)', () => {
      btn().click();
      expect(wrap().classList.contains('open')).toBe(true);
      btn().click();
      expect(wrap().classList.contains('open')).toBe(false);
    });

    it('Escape dismisses without bubbling; blur or mouse leave resets', () => {
      const outer = vi.fn();
      document.addEventListener('keydown', outer);
      btn().focus();
      btn().click();
      btn().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(wrap().classList.contains('dismissed')).toBe(true);
      expect(wrap().classList.contains('open')).toBe(false);
      expect(outer).not.toHaveBeenCalled();

      // a second Escape (tooltip already hidden) is left to outer handlers
      btn().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(outer).toHaveBeenCalledTimes(1);

      btn().blur();
      expect(wrap().classList.contains('dismissed')).toBe(false);
      btn().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      wrap().dispatchEvent(new MouseEvent('mouseleave'));
      expect(wrap().classList.contains('dismissed')).toBe(false);
      document.removeEventListener('keydown', outer);
    });

    it('other keys do nothing', () => {
      btn().dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      expect(wrap().classList.contains('dismissed')).toBe(false);
    });
  });
});
