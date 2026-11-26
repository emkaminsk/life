import { describe, expect, it } from 'vitest';
import {
  CONWAY_RULE,
  describeRule,
  findPreset,
  formatRule,
  parseRule,
  RULE_PRESETS,
  ruleOrConway,
} from '../../src/classic/rules';
import { i18n } from '../../src/i18n/i18n';
import { Language } from '../../src/i18n/types';

const t = (key: string, ...args: (string | number)[]) => i18n.t(key, ...args);

describe('parseRule', () => {
  it('parses B3/S23 into 9-bit masks', () => {
    const r = parseRule('B3/S23');
    expect(r).toEqual({ ok: true, rule: { birth: 0b1000, survive: 0b1100 }, text: 'B3/S23' });
  });

  it('is case-insensitive, trims and canonicalises digit order', () => {
    expect(parseRule('  b63/s32 ')).toEqual({ ok: true, rule: { birth: 0b1001000, survive: 0b1100 }, text: 'B36/S23' });
  });

  it('accepts an empty side (Seeds B2/S) and all counts 0–8', () => {
    expect(parseRule('B2/S')).toEqual({ ok: true, rule: { birth: 0b100, survive: 0 }, text: 'B2/S' });
    expect(parseRule('B012345678/S012345678')).toMatchObject({ ok: true, rule: { birth: 511, survive: 511 } });
  });

  it.each([
    '',
    'B9/S23',
    'S23/B3',
    '23/3',
    'B3S23',
    'B3/S2 3',
    'hello',
    'B3/S23/',
  ])('returns an error result for %j instead of throwing', (text) => {
    expect(parseRule(text)).toEqual({ ok: false, error: 'invalidRule' });
  });

  it('formatRule round-trips the presets', () => {
    for (const preset of RULE_PRESETS) {
      const r = parseRule(preset.rule);
      expect(r.ok && formatRule(r.rule)).toBe(preset.rule);
      expect(findPreset(preset.rule.toLowerCase())).toBe(preset.id);
    }
    expect(RULE_PRESETS.map((p) => p.rule)).toEqual(['B3/S23', 'B36/S23', 'B2/S', 'B3678/S34678']);
    expect(findPreset('B36/S125')).toBeNull();
    expect(findPreset('nope')).toBeNull();
  });

  it('ruleOrConway falls back to B3/S23', () => {
    expect(ruleOrConway('bad')).toEqual({ rule: { ...CONWAY_RULE }, text: 'B3/S23' });
    expect(ruleOrConway('B2/S').text).toBe('B2/S');
  });
});

describe('describeRule', () => {
  it('explains rules in plain English and Polish', () => {
    i18n.setLanguage(Language.EN);
    const conway = parseRule('B3/S23');
    if (!conway.ok) throw new Error('parse');
    expect(describeRule(conway.rule, t)).toBe(
      'B3/S23: a dead cell with exactly 3 neighbours is born; a live cell with 2 or 3 survives.',
    );
    const dn = parseRule('B3678/S34678');
    if (!dn.ok) throw new Error('parse');
    expect(describeRule(dn.rule, t)).toContain('3, 6, 7 or 8 neighbours is born');
    expect(describeRule({ birth: 0, survive: 0 }, t)).toBe(
      'B/S: no new cells are ever born; every live cell dies after one generation.',
    );
    i18n.setLanguage(Language.PL);
    expect(describeRule(conway.rule, t)).toBe(
      'B3/S23: martwa komórka z dokładnie 3 sąsiadami ożywa; żywa komórka z 2 lub 3 sąsiadami przeżywa.',
    );
    i18n.setLanguage(Language.EN);
  });
});
