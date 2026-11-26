/**
 * Life-like rules in B/S notation ("B3/S23": born with 3 neighbours, survives with 2 or 3).
 * Each side is a 9-bit mask: bit n set ⇔ the rule applies with n live neighbours.
 */
export interface LifeRule {
  birth: number;
  survive: number;
}

export type RuleParseResult = { ok: true; rule: LifeRule; text: string } | { ok: false; error: 'invalidRule' };

export type RulePresetId = 'conway' | 'highlife' | 'seeds' | 'dayNight';

export const RULE_PRESETS: readonly { id: RulePresetId; rule: string }[] = [
  { id: 'conway', rule: 'B3/S23' },
  { id: 'highlife', rule: 'B36/S23' },
  { id: 'seeds', rule: 'B2/S' },
  { id: 'dayNight', rule: 'B3678/S34678' },
];

const RULE_PATTERN = /^B([0-8]*)\/S([0-8]*)$/;

const toMask = (digits: string): number => {
  let mask = 0;
  for (const d of digits) mask |= 1 << Number(d);
  return mask;
};

const toDigits = (mask: number): number[] => {
  const digits: number[] = [];
  for (let n = 0; n <= 8; n++) if (mask & (1 << n)) digits.push(n);
  return digits;
};

/** Parse "B3/S23" (any case, surrounding spaces ignored). Never throws. */
export function parseRule(text: string): RuleParseResult {
  const match = RULE_PATTERN.exec(String(text).trim().toUpperCase());
  if (!match) return { ok: false, error: 'invalidRule' };
  const rule = { birth: toMask(match[1]), survive: toMask(match[2]) };
  return { ok: true, rule, text: formatRule(rule) };
}

/** Canonical text, digits sorted and unique: {birth: 0b1000, survive: 0b1100} → "B3/S23". */
export function formatRule(rule: LifeRule): string {
  return `B${toDigits(rule.birth).join('')}/S${toDigits(rule.survive).join('')}`;
}

/** Conway's B3/S23. */
export const CONWAY_RULE: Readonly<LifeRule> = Object.freeze({ birth: 1 << 3, survive: (1 << 2) | (1 << 3) });

/** The parsed rule, or Conway's when the text is not a valid rule. */
export function ruleOrConway(text: string): { rule: LifeRule; text: string } {
  const parsed = parseRule(text);
  return parsed.ok ? parsed : { rule: { ...CONWAY_RULE }, text: formatRule(CONWAY_RULE) };
}

/** The preset with this rule (any spelling), or null for a custom rule. */
export function findPreset(text: string): RulePresetId | null {
  const parsed = parseRule(text);
  if (!parsed.ok) return null;
  return RULE_PRESETS.find((p) => p.rule === parsed.text)?.id ?? null;
}

export type Translate = (key: string, ...args: (string | number)[]) => string;

/** "exactly 3", "2 or 3", "3, 6, 7 or 8". */
function listCounts(digits: number[], t: Translate): string {
  if (digits.length === 1) return t('classic.explain.exactly', digits[0]);
  return `${digits.slice(0, -1).join(', ')}${t('classic.explain.or')}${digits[digits.length - 1]}`;
}

/** Plain-language explanation, e.g. "B3/S23: a dead cell with exactly 3 neighbours is born; …". */
export function describeRule(rule: LifeRule, t: Translate): string {
  const birth = toDigits(rule.birth);
  const survive = toDigits(rule.survive);
  const born = birth.length ? t('classic.explain.born', listCounts(birth, t)) : t('classic.explain.neverBorn');
  const lives = survive.length
    ? t('classic.explain.survives', listCounts(survive, t))
    : t('classic.explain.neverSurvives');
  return t('classic.explain.sentence', formatRule(rule), born, lives);
}
