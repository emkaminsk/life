import { i18n } from '../i18n/i18n';
import { debugLog } from '../utils/debug';
import { attachFieldHelp } from './configHelp';
import {
  boardAreaOf,
  FIELD_RULES,
  type FieldError,
  getDefaultConfig,
  getValue,
  mergeWithDefaults,
  resolveRule,
  validateValue,
} from './configValidation';
import { showNotification } from './notifications';

export interface GameConfig {
  board: {
    width: number;
    height: number;
    injuredThreshold: number;
  };
  spawn: {
    maleHumanProbability: number;
    femaleHumanProbability: number;
    wolfProbability: number;
    dogProbability: number;
    fruitProbability: number;
    mushroomProbability: number;
  };
  human: {
    startingHealth: number;
    maleVsMaleDamage: number;
    maleVsWolfDamage: number;
    reproductionProbability: number;
    pregnancyPeriod: number;
    cooldownPeriod: number;
    perceptionRange: number;
    moveTowardFruitProbability: number;
    /** Average caution gene of the initial population (0-1). */
    avgCaution: number;
    /** Average metabolism gene of the initial population (health cost per round). */
    avgMetabolism: number;
    gompertzA: number;
    gompertzB: number;
  };
  wolf: {
    startingHealth: number;
    damageToMale: number;
    damageToFemale: number;
    damageToDog: number;
    perceptionRange: number;
    moveTowardHumanProbability: number;
    spawnProbability: number;
    gompertzA: number;
    gompertzB: number;
  };
  dog: {
    startingHealth: number;
    damageToWolf: number;
    perceptionRange: number;
    moveTowardWolfProbability: number;
    spawnProbability: number;
    gompertzA: number;
    gompertzB: number;
  };
  fruit: {
    energyHealed: number;
    spawnProbability: number;
    roundsToRipen: number;
  };
  mushroom: {
    energyRemoved: number;
    spawnProbability: number;
  };
  overcrowding: {
    humanThreshold: number;
    humanMultiplier: number;
    animalThreshold: number;
    animalMultiplier: number;
  };
}

/** How the board is filled at start: by spawn probabilities or by hand (F1). */
export type SetupMode = 'random' | 'manual';

export interface StartOptions {
  setupMode: SetupMode;
}

/** The six initial-spawn inputs; disabled and not validated in manual setup mode. */
const SPAWN_IDS = ['spawnMaleHuman', 'spawnFemaleHuman', 'spawnWolf', 'spawnDog', 'spawnFruit', 'spawnMushroom'];
/** Spawn ids that produce creatures (the rest are plants). */
const CREATURE_SPAWN_IDS = SPAWN_IDS.slice(0, 4);
/** Above this many expected starting creatures a soft performance warning is shown (R14). */
export const PERFORMANCE_WARNING_CREATURES = 1000;

export interface ValidationResult {
  valid: boolean;
  fieldErrors: FieldError[];
  /** Sum of the initial spawn probabilities; 0 in manual setup mode. */
  spawnTotal: number;
  spawnExceeded: boolean;
  /** Expected starting humans + wolves + dogs (NaN while unknown or in manual mode). */
  expectedCreatures: number;
  /** Soft, non-blocking: expectedCreatures > PERFORMANCE_WARNING_CREATURES. */
  performanceWarning: boolean;
}

const isSetupMode = (v: unknown): v is SetupMode => v === 'random' || v === 'manual';

/**
 * Pre-game configuration form (PRD 3.7, US-007/008).
 *
 * Every numeric field is validated on input; Start stays disabled with a
 * summary while anything is invalid. The config handed to onStart is a fresh
 * clone, never this panel's internal object (Game freezes what it receives).
 * Call destroy() to remove every listener this panel registered.
 */
export class ConfigPanel {
  private panel: HTMLElement;
  private config: GameConfig;
  private onStartCallback: ((config: GameConfig, options: StartOptions) => void) | null = null;
  private readonly listeners = new AbortController();
  private readonly languageListener = (): void => {
    this.updateButtonTexts();
    this.refreshHelp();
    this.validate();
  };
  /** Board area the dynamic bounds and help texts were last rendered for. */
  private renderedArea = Number.NaN;

  constructor() {
    const panel = document.getElementById('configPanel');
    if (!panel) throw new Error('Config panel element not found');
    this.panel = panel;
    this.config = getDefaultConfig();
    this.prepareInputs();
    this.setupEventListeners();
    this.applySetupMode();
  }

  /** Remove every listener (DOM, document and i18n) registered by this panel. */
  destroy(): void {
    this.listeners.abort();
    i18n.offLanguageChange(this.languageListener);
    this.onStartCallback = null;
  }

  // ---------------------------------------------------------------- setup

  /** Add error slots, then min/max attributes, help tooltips and range hints. */
  private prepareInputs(): void {
    for (const rule of FIELD_RULES) {
      const input = this.getInput(rule.id);
      if (!input) continue;
      input.required = true;

      const errorId = `${rule.id}-error`;
      if (!document.getElementById(errorId)) {
        const error = document.createElement('div');
        error.id = errorId;
        error.className = 'field-error';
        const row = input.closest('.config-row');
        if (row) row.insertAdjacentElement('afterend', error);
        else input.insertAdjacentElement('afterend', error);
      }
    }
    this.refreshHelp();
  }

  private setupEventListeners(): void {
    const opts = { signal: this.listeners.signal };
    const on = (id: string, type: string, handler: (e: Event) => void) =>
      document.getElementById(id)?.addEventListener(type, handler, opts);

    on('saveConfigBtn', 'click', () => this.saveConfiguration());
    on('loadConfigBtn', 'click', () => this.triggerLoadConfiguration());
    on('loadConfigFile', 'change', (e) => this.loadConfiguration(e));
    on('resetConfigBtn', 'click', () => this.resetToDefaults());
    on('startGameBtn', 'click', () => this.handleStartGame());
    on('collapseAllBtn', 'click', () => this.toggleCollapseAll());

    for (const header of Array.from(document.querySelectorAll<HTMLElement>('.config-section-header'))) {
      header.addEventListener('click', () => this.toggleSection(header), opts);
    }
    for (const radio of this.setupModeRadios()) {
      radio.addEventListener('change', () => this.applySetupMode(), opts);
    }
    for (const rule of FIELD_RULES) {
      const input = this.getInput(rule.id);
      if (!input) continue;
      input.addEventListener('input', () => this.validate(), opts);
      input.addEventListener('change', () => this.validate(), opts);
    }

    i18n.onLanguageChange(this.languageListener);

    // Ctrl/Cmd+S save, Ctrl/Cmd+O load, Ctrl/Cmd+Enter start – only while the panel is showing.
    document.addEventListener(
      'keydown',
      (e) => {
        if (!this.isVisible() || !(e.ctrlKey || e.metaKey)) return;
        if (e.key === 's') {
          e.preventDefault();
          this.saveConfiguration();
        } else if (e.key === 'o') {
          e.preventDefault();
          this.triggerLoadConfiguration();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.handleStartGame();
        }
      },
      opts,
    );
  }

  // ---------------------------------------------------------------- setup mode

  private setupModeRadios(): HTMLInputElement[] {
    return Array.from(document.querySelectorAll<HTMLInputElement>('input[name="setupMode"]'));
  }

  getSetupMode(): SetupMode {
    const checked = this.setupModeRadios().find((r) => r.checked)?.value;
    return checked === 'manual' ? 'manual' : 'random';
  }

  setSetupMode(mode: SetupMode): void {
    for (const radio of this.setupModeRadios()) radio.checked = radio.value === mode;
    this.applySetupMode();
  }

  /** Enable/disable the initial-spawn inputs and show the matching hint, then revalidate. */
  private applySetupMode(): void {
    const manual = this.getSetupMode() === 'manual';
    for (const id of SPAWN_IDS) {
      const input = this.getInput(id);
      if (input) input.disabled = manual;
    }
    const summary = document.getElementById('expectedSummary');
    if (summary) summary.hidden = manual;
    this.updateSetupModeHint();
    this.validate();
  }

  private updateSetupModeHint(): void {
    const hint = document.getElementById('setupModeHint');
    if (!hint) return;
    const manual = this.getSetupMode() === 'manual';
    hint.textContent = i18n.t(manual ? 'configHelp.setupMode.manualHint' : 'configHelp.setupMode.randomHint');
  }

  private isExcluded(id: string): boolean {
    return this.getSetupMode() === 'manual' && SPAWN_IDS.includes(id);
  }

  // ---------------------------------------------------------------- inputs

  private getInput(id: string): HTMLInputElement | null {
    const el = document.getElementById(id);
    return el instanceof HTMLInputElement ? el : null;
  }

  /** Parsed value of an input; NaN when empty or not a number. */
  private getInputValue(id: string): number {
    const input = this.getInput(id);
    if (!input) return Number.NaN;
    const raw = input.value.trim();
    return raw === '' ? Number.NaN : Number(raw);
  }

  private setInputValue(id: string, value: number): void {
    const input = this.getInput(id);
    if (input) input.value = String(value);
  }

  private populateInputs(): void {
    for (const rule of FIELD_RULES) {
      this.setInputValue(rule.id, getValue(this.config, rule));
    }
    this.validate();
  }

  private boardArea(): number {
    return boardAreaOf(this.getInputValue('boardWidth'), this.getInputValue('boardHeight'));
  }

  /**
   * Build a brand-new config object from the current form values. Excluded
   * (manual-mode) spawn inputs holding an invalid value keep the default, so
   * the emitted config is always valid.
   */
  private readConfigFromInputs(): GameConfig {
    const config = getDefaultConfig();
    const area = this.boardArea();
    for (const rule of FIELD_RULES) {
      if (!this.getInput(rule.id)) continue; // keep default for fields absent from the DOM
      const value = this.getInputValue(rule.id);
      if (this.isExcluded(rule.id) && validateValue(resolveRule(rule, area), value)) continue;
      (config[rule.section] as unknown as Record<string, number>)[rule.key] = value;
    }
    return config;
  }

  // ---------------------------------------------------------------- validation

  /** Min/max attributes, help tooltips and range hints for the current board area. */
  private refreshHelp(): void {
    const area = this.boardArea();
    const rules = FIELD_RULES.map((rule) => resolveRule(rule, area));
    for (const rule of rules) {
      const input = this.getInput(rule.id);
      if (!input) continue;
      input.min = String(rule.min);
      if (rule.max !== undefined) input.max = String(rule.max);
      else input.removeAttribute('max');
    }
    attachFieldHelp(rules);
    this.renderedArea = area;
  }

  private messageFor(error: FieldError): string {
    switch (error.code) {
      case 'notANumber':
        return i18n.t('errors.notANumber');
      case 'tooLow':
        return i18n.t('errors.tooLow', error.arg ?? error.rule.min);
      case 'tooHigh':
        return i18n.t('errors.tooHigh', error.arg ?? error.rule.max ?? '');
      case 'notInteger':
        return i18n.t('errors.notInteger');
    }
  }

  /**
   * Validate every field, update per-field messages, the spawn-sum message,
   * the expected counts, the summary and the Start button. Returns the overall result.
   */
  validate(): ValidationResult {
    const area = this.boardArea();
    if (area !== this.renderedArea) this.refreshHelp();
    const fieldErrors: FieldError[] = [];

    for (const rule of FIELD_RULES) {
      const input = this.getInput(rule.id);
      if (!input) continue;
      const error = this.isExcluded(rule.id)
        ? null
        : validateValue(resolveRule(rule, area), this.getInputValue(rule.id));
      const slot = document.getElementById(`${rule.id}-error`);
      if (error) {
        fieldErrors.push(error);
        input.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
        if (slot) slot.textContent = this.messageFor(error);
      } else {
        input.classList.remove('invalid');
        input.removeAttribute('aria-invalid');
        if (slot) slot.textContent = '';
      }
    }

    const manual = this.getSetupMode() === 'manual';
    const total = manual ? 0 : SPAWN_IDS.reduce((sum, id) => sum + this.getInputValue(id), 0);
    const spawnExceeded = Number.isFinite(total) && total > 1 + 1e-9;
    this.renderSpawnMessage(manual ? null : total, spawnExceeded);
    const expectedCreatures = manual ? Number.NaN : this.updateExpectedCounts();
    const performanceWarning = expectedCreatures > PERFORMANCE_WARNING_CREATURES;
    this.renderPerformanceWarning(performanceWarning ? expectedCreatures : null);

    const problemCount = fieldErrors.length + (spawnExceeded ? 1 : 0);
    const valid = problemCount === 0;

    const start = document.getElementById('startGameBtn');
    if (start instanceof HTMLButtonElement) start.disabled = !valid;
    const summary = document.getElementById('configValidationSummary');
    if (summary) {
      summary.textContent = valid ? '' : `❌ ${i18n.t('config.validationSummary', problemCount)}`;
      summary.hidden = valid;
    }

    return { valid, fieldErrors, spawnTotal: total, spawnExceeded, expectedCreatures, performanceWarning };
  }

  /** total = null clears the message (manual setup mode). */
  private renderSpawnMessage(total: number | null, exceeded: boolean): void {
    const msg = document.getElementById('spawnValidation');
    if (!msg) return;
    if (total === null || !Number.isFinite(total)) {
      msg.textContent = '';
      msg.className = 'validation-message';
      return;
    }
    const pct = `${(total * 100).toFixed(1)}%`;
    if (exceeded) {
      msg.textContent = `❌ ${i18n.t('config.totalSpawnProbability')} ${pct} ${i18n.t('config.spawnExceeds100')}`;
      msg.className = 'validation-message validation-error';
    } else if (total > 0.9) {
      msg.textContent = `⚠️ ${i18n.t('config.spawnWarning')} ${i18n.t('config.totalSpawnProbability')} ${pct} ${i18n.t('config.spawnVeryHigh')} - ${i18n.t('errors.spawnWarning')}`;
      msg.className = 'validation-message validation-warning';
    } else {
      msg.textContent = `✓ ${i18n.t('config.totalSpawnProbability')}: ${pct}`;
      msg.className = 'validation-message validation-success';
    }
  }

  /** Per-type and total expected counts (R11). Returns the expected creatures (NaN if unknown). */
  private updateExpectedCounts(): number {
    const cells = this.getInputValue('boardWidth') * this.getInputValue('boardHeight');
    const counts = SPAWN_IDS.map((id) => Math.round(cells * this.getInputValue(id)));
    const show = (n: number) => (Number.isFinite(n) ? n : '?');
    const creatures = counts.slice(0, CREATURE_SPAWN_IDS.length).reduce((a, b) => a + b, 0);
    const entities = counts.reduce((a, b) => a + b, 0);

    const detail = document.getElementById('expectedCounts');
    if (detail) detail.textContent = i18n.t('config.expectedCreaturesDetailed', ...counts.map(show));
    const totals = document.getElementById('expectedTotals');
    if (totals) totals.textContent = i18n.t('configHelp.totals', show(creatures), show(entities));
    return creatures;
  }

  /** creatures = null hides the soft performance warning. */
  private renderPerformanceWarning(creatures: number | null): void {
    const el = document.getElementById('perfWarning');
    if (!el) return;
    el.textContent = creatures === null ? '' : `⚠️ ${i18n.t('configHelp.perfWarning', creatures)}`;
    el.hidden = creatures === null;
  }

  // ---------------------------------------------------------------- sections

  private toggleSection(header: HTMLElement): void {
    const section = header.closest('.config-section');
    if (!section) return;
    this.setSectionCollapsed(section, !section.classList.contains('collapsed'));
    this.updateButtonTexts();
  }

  private setSectionCollapsed(section: Element, collapsed: boolean): void {
    section.classList.toggle('collapsed', collapsed);
    section.querySelector('.config-section-header')?.setAttribute('aria-expanded', String(!collapsed));
  }

  private allCollapsed(): boolean {
    const sections = Array.from(document.querySelectorAll('.config-section'));
    return sections.length > 0 && sections.every((s) => s.classList.contains('collapsed'));
  }

  private toggleCollapseAll(): void {
    const collapse = !this.allCollapsed();
    for (const section of Array.from(document.querySelectorAll('.config-section'))) {
      this.setSectionCollapsed(section, collapse);
    }
    this.updateButtonTexts();
  }

  private updateButtonTexts(): void {
    const btn = document.getElementById('collapseAllBtn');
    if (btn) btn.textContent = this.allCollapsed() ? i18n.t('config.expand') : i18n.t('config.collapse');
    document.getElementById('startGameBtn')?.setAttribute('title', i18n.t('configHelp.startShortcut'));
    this.updateSetupModeHint();
  }

  // ---------------------------------------------------------------- lifecycle

  private resetToDefaults(): void {
    this.config = getDefaultConfig();
    this.populateInputs();
    debugLog('[ConfigPanel] Reset to default values');
  }

  private handleStartGame(): void {
    if (!this.validate().valid) return;
    this.config = this.readConfigFromInputs();
    this.hide();
    this.onStartCallback?.(structuredClone(this.config), { setupMode: this.getSetupMode() });
  }

  show(): void {
    this.panel.style.display = 'flex';
    this.panel.removeAttribute('aria-hidden');
    this.populateInputs();
    this.updateButtonTexts();
    document.getElementById('startGameBtn')?.focus();
  }

  hide(): void {
    this.panel.style.display = 'none';
    this.panel.setAttribute('aria-hidden', 'true');
  }

  isVisible(): boolean {
    return this.panel.style.display !== 'none';
  }

  /** The callback receives a fresh config clone and how the board should be filled. */
  onStart(callback: (config: GameConfig, options: StartOptions) => void): void {
    this.onStartCallback = callback;
  }

  /** A copy of the last applied/loaded configuration. */
  getConfig(): GameConfig {
    return structuredClone(this.config);
  }

  // ---------------------------------------------------------------- save / load

  private saveConfiguration(): void {
    const configData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      setupMode: this.getSetupMode(),
      config: this.readConfigFromInputs(),
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    a.download = `game-of-life-config-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    debugLog('[ConfigPanel] Configuration saved:', a.download);
    showNotification(i18n.t('notifications.configSavedTitle'), i18n.t('notifications.configSaved', a.download), 'info');
  }

  private triggerLoadConfiguration(): void {
    (document.getElementById('loadConfigFile') as HTMLInputElement | null)?.click();
  }

  /**
   * Apply parsed JSON from a config file. Missing values take defaults; loaded
   * values go through exactly the same validation as typed ones, so
   * out-of-range numbers are flagged (and block Start) rather than clamped.
   * A wrapper's `setupMode` is applied; files without one keep the current mode.
   * Returns the validation result.
   */
  applyLoadedData(data: unknown, fileName: string): ValidationResult {
    const wrapped = data as { config?: unknown; version?: unknown; setupMode?: unknown } | null;
    const isWrapper = !!wrapped && typeof wrapped === 'object' && 'config' in wrapped;
    const loaded = isWrapper ? wrapped.config : data;
    if (wrapped && typeof wrapped === 'object' && wrapped.version) {
      debugLog('[ConfigPanel] Loading config version:', wrapped.version);
    }

    const { config, replaced } = mergeWithDefaults(loaded);
    if (replaced.length > 0) debugLog('[ConfigPanel] Non-numeric values replaced by defaults:', replaced);
    this.config = config;
    if (isWrapper && isSetupMode(wrapped.setupMode)) this.setSetupMode(wrapped.setupMode);
    this.populateInputs();
    const result = this.validate();

    if (result.valid) {
      showNotification(
        i18n.t('notifications.configLoadedTitle'),
        i18n.t('notifications.configLoaded', fileName),
        'info',
      );
    } else {
      showNotification(
        i18n.t('notifications.configLoadInvalidTitle'),
        i18n.t('notifications.configLoadInvalid', result.fieldErrors.length + (result.spawnExceeded ? 1 : 0)),
        'warning',
      );
    }
    return result;
  }

  private loadConfiguration(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        this.applyLoadedData(JSON.parse(content), file.name);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid JSON file';
        showNotification(
          i18n.t('notifications.configLoadErrorTitle'),
          i18n.t('notifications.configLoadError', errorMessage),
          'error',
        );
      }
    };
    reader.readAsText(file);
    input.value = '';
  }
}
