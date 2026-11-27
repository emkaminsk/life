import { i18n } from '../i18n/i18n';
import type { ConfigPanel, ConfigPanelPlugin, GameMode } from '../ui/ConfigPanel';
import { isPatternId, PATTERN_IDS, PATTERNS, type PatternId } from './patterns';
import { describeRule, findPreset, parseRule, RULE_PRESETS, type RulePresetId } from './rules';
import type { ClassicConfig, ClassicStart } from './types';
import './classic.css';

/** Conway's Game of Life on a 50×50 torus, 30% randomly alive. */
export const DEFAULT_CLASSIC_CONFIG: Readonly<ClassicConfig> = Object.freeze({
  width: 50,
  height: 50,
  rule: 'B3/S23',
  start: Object.freeze({ kind: 'random', density: 0.3 }),
});

export const CLASSIC_SIZE_MIN = 10;
export const CLASSIC_SIZE_MAX = 200;
/** Density slider range, in percent. */
export const DENSITY_MIN_PCT = 5;
export const DENSITY_MAX_PCT = 90;
const DEFAULT_PATTERN: PatternId = 'gosperGun';

type StartKind = ClassicStart['kind'];
const START_KINDS: readonly StartKind[] = ['random', 'pattern', 'draw'];
const CUSTOM = 'custom';

/** Integer in [CLASSIC_SIZE_MIN, CLASSIC_SIZE_MAX], or null. */
export function parseBoardSize(text: string): number | null {
  if (!/^\s*\d+\s*$/.test(text)) return null;
  const n = Number(text);
  return n >= CLASSIC_SIZE_MIN && n <= CLASSIC_SIZE_MAX ? n : null;
}

const clampPct = (pct: number): number => Math.min(DENSITY_MAX_PCT, Math.max(DENSITY_MIN_PCT, Math.round(pct)));

/**
 * Classic Life settings in the config panel: board size, rule (preset or a
 * custom B/S rule, validated live) and how to start (random fill, a centred
 * pattern, or drawing). Registers itself with the panel under the save key 'classic'.
 */
export function createClassicConfigForm(
  mount: HTMLElement,
  panel: ConfigPanel,
): ConfigPanelPlugin & { read(): ClassicConfig; destroy(): void } {
  const t = (key: string, ...args: (string | number)[]): string => i18n.t(key, ...args);
  const controller = new AbortController();
  const { signal } = controller;

  // ------------------------------------------------------------ DOM
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  };
  const errorEl = (): HTMLParagraphElement => {
    const p = el('p', 'field-error');
    p.setAttribute('aria-live', 'polite');
    return p;
  };
  const field = (id: string, control: HTMLInputElement | HTMLSelectElement) => {
    const row = el('div', 'classic-field');
    const label = el('label');
    label.htmlFor = id;
    control.id = id;
    row.append(label, control);
    return { row, label };
  };
  const numberInput = (value: number): HTMLInputElement => {
    const input = el('input');
    input.type = 'number';
    input.min = String(CLASSIC_SIZE_MIN);
    input.max = String(CLASSIC_SIZE_MAX);
    input.step = '1';
    input.inputMode = 'numeric';
    input.value = String(value);
    return input;
  };

  const section = el('section', 'classic-settings');
  const title = el('h2');

  const widthInput = numberInput(DEFAULT_CLASSIC_CONFIG.width);
  const widthField = field('classicWidth', widthInput);
  const widthError = errorEl();
  widthField.row.append(widthError);

  const heightInput = numberInput(DEFAULT_CLASSIC_CONFIG.height);
  const heightField = field('classicHeight', heightInput);
  const heightError = errorEl();
  heightField.row.append(heightError);

  const presetSelect = el('select');
  for (const value of [...RULE_PRESETS.map((p) => p.id), CUSTOM]) {
    const option = el('option');
    option.value = value;
    presetSelect.append(option);
  }
  const presetField = field('classicRulePreset', presetSelect);
  presetField.row.classList.add('classic-field-wide');

  const customInput = el('input');
  customInput.type = 'text';
  customInput.autocomplete = 'off';
  customInput.spellcheck = false;
  customInput.value = DEFAULT_CLASSIC_CONFIG.rule;
  const customField = field('classicRuleCustom', customInput);
  const customHelp = el('p', 'classic-help');
  const customError = errorEl();
  customField.row.append(customHelp, customError);

  const explanation = el('p', 'classic-rule-text');

  const startSet = el('fieldset', 'classic-start');
  const startLegend = el('legend');
  const startOptions = el('div', 'classic-start-options');
  const startRadios = new Map<StartKind, { input: HTMLInputElement; text: HTMLSpanElement }>();
  for (const kind of START_KINDS) {
    const label = el('label');
    const input = el('input');
    input.type = 'radio';
    input.name = 'classicStart';
    input.value = kind;
    input.checked = kind === DEFAULT_CLASSIC_CONFIG.start.kind;
    const text = el('span');
    label.append(input, text);
    startOptions.append(label);
    startRadios.set(kind, { input, text });
  }

  const densityInput = el('input');
  densityInput.type = 'range';
  densityInput.min = String(DENSITY_MIN_PCT);
  densityInput.max = String(DENSITY_MAX_PCT);
  densityInput.step = '1';
  densityInput.value = '30';
  const densityField = field('classicDensity', densityInput);

  const patternSelect = el('select');
  for (const id of PATTERN_IDS) {
    const option = el('option');
    option.value = id;
    patternSelect.append(option);
  }
  patternSelect.value = DEFAULT_PATTERN;
  const patternField = field('classicPattern', patternSelect);
  patternField.row.classList.add('classic-field-wide');
  const patternError = errorEl();
  patternField.row.append(patternError);

  const drawInfo = el('p', 'classic-draw-info');

  startSet.append(startLegend, startOptions, densityField.row, patternField.row, drawInfo);
  section.append(title, widthField.row, heightField.row, presetField.row, customField.row, explanation, startSet);
  mount.replaceChildren(section);

  // ------------------------------------------------------------ state
  const startKind = (): StartKind => START_KINDS.find((k) => startRadios.get(k)?.input.checked) ?? 'random';
  const isCustom = (): boolean => presetSelect.value === CUSTOM;
  const presetRule = (): string => RULE_PRESETS.find((p) => p.id === presetSelect.value)?.rule ?? '';
  const ruleText = (): string => (isCustom() ? customInput.value : presetRule());

  const setError = (input: HTMLElement, error: HTMLElement, message: string): void => {
    error.textContent = message;
    input.classList.toggle('invalid', message !== '');
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };

  /** Show/hide the dependent fields, refresh live texts and inline errors; returns the problem count. */
  function check(): number {
    const kind = startKind();
    customField.row.hidden = !isCustom();
    densityField.row.hidden = kind !== 'random';
    patternField.row.hidden = kind !== 'pattern';
    drawInfo.hidden = kind !== 'draw';
    densityField.label.textContent = t('classic.form.density', Number(densityInput.value));

    let problems = 0;
    const sizeMessage = t('classic.errors.size', CLASSIC_SIZE_MIN, CLASSIC_SIZE_MAX);
    const width = parseBoardSize(widthInput.value);
    const height = parseBoardSize(heightInput.value);
    setError(widthInput, widthError, width === null ? sizeMessage : '');
    setError(heightInput, heightError, height === null ? sizeMessage : '');
    problems += (width === null ? 1 : 0) + (height === null ? 1 : 0);

    const parsed = parseRule(ruleText());
    const ruleBad = isCustom() && !parsed.ok;
    setError(customInput, customError, ruleBad ? t('classic.errors.rule') : '');
    explanation.textContent = parsed.ok ? describeRule(parsed.rule, t) : '';
    if (ruleBad) problems++;

    const pattern = PATTERNS[patternSelect.value as PatternId];
    const tooBig =
      kind === 'pattern' && width !== null && height !== null && (pattern.width > width || pattern.height > height);
    setError(
      patternSelect,
      patternError,
      tooBig ? t('classic.errors.patternTooBig', pattern.width, pattern.height) : '',
    );
    if (tooBig) problems++;
    return problems;
  }

  function relabel(): void {
    title.textContent = t('classic.form.title');
    widthField.label.textContent = t('classic.form.width');
    heightField.label.textContent = t('classic.form.height');
    presetField.label.textContent = t('classic.form.rule');
    for (const option of Array.from(presetSelect.options)) option.textContent = t(`classic.rules.${option.value}`);
    customField.label.textContent = t('classic.form.customRule');
    customInput.placeholder = t('classic.form.customPlaceholder');
    customHelp.textContent = t('classic.form.customHelp');
    startLegend.textContent = t('classic.form.start');
    const startKeys: Record<StartKind, string> = {
      random: 'classic.form.startRandom',
      pattern: 'classic.form.startPattern',
      draw: 'classic.form.startDraw',
    };
    for (const [kind, { text }] of startRadios) text.textContent = t(startKeys[kind]);
    patternField.label.textContent = t('classic.form.pattern');
    for (const option of Array.from(patternSelect.options)) option.textContent = t(`classic.patterns.${option.value}`);
    drawInfo.textContent = t('classic.form.drawInfo');
    check();
  }

  const onChange = (): void => {
    check();
    panel.refresh();
  };
  for (const type of ['input', 'change'] as const) section.addEventListener(type, onChange, { signal });

  const languageListener = (): void => relabel();
  i18n.onLanguageChange(languageListener);

  // ------------------------------------------------------------ plugin
  const form = {
    read(): ClassicConfig {
      const kind = startKind();
      const start: ClassicStart =
        kind === 'random'
          ? { kind, density: Number(densityInput.value) / 100 }
          : kind === 'pattern'
            ? { kind, patternId: patternSelect.value }
            : { kind };
      const parsed = parseRule(ruleText());
      return {
        width: parseBoardSize(widthInput.value) ?? DEFAULT_CLASSIC_CONFIG.width,
        height: parseBoardSize(heightInput.value) ?? DEFAULT_CLASSIC_CONFIG.height,
        rule: parsed.ok ? parsed.text : ruleText().trim(),
        start,
      };
    },
    validate: (mode: GameMode): number => (mode === 'classic' ? check() : 0),
    startOptions: () => ({ mode: 'classic' as const, classic: form.read() }),
    save: (): unknown => form.read(),
    /** Apply saved data; unknown or malformed values keep the current field. */
    load(data: unknown): void {
      if (!data || typeof data !== 'object') return;
      const d = data as Partial<Record<keyof ClassicConfig, unknown>>;
      if (typeof d.width === 'number') widthInput.value = String(d.width);
      if (typeof d.height === 'number') heightInput.value = String(d.height);
      if (typeof d.rule === 'string') {
        const preset: RulePresetId | null = findPreset(d.rule);
        presetSelect.value = preset ?? CUSTOM;
        if (!preset) customInput.value = d.rule;
      }
      const start = d.start as Partial<{ kind: unknown; density: unknown; patternId: unknown }> | undefined;
      if (start && typeof start === 'object' && START_KINDS.includes(start.kind as StartKind)) {
        for (const [kind, { input }] of startRadios) input.checked = kind === start.kind;
        if (typeof start.density === 'number') densityInput.value = String(clampPct(start.density * 100));
        if (isPatternId(start.patternId)) patternSelect.value = start.patternId;
      }
      onChange();
    },
    destroy(): void {
      controller.abort();
      i18n.offLanguageChange(languageListener);
      mount.replaceChildren();
    },
  };
  relabel();
  panel.registerPlugin(form, 'classic');
  return form;
}
