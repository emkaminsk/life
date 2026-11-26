import { i18n } from '../i18n/i18n';
import { debugLog } from '../utils/debug';
import {
  FIELD_RULES,
  type FieldError,
  type FieldRule,
  getDefaultConfig,
  getValue,
  mergeWithDefaults,
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

const SPAWN_IDS = ['spawnMaleHuman', 'spawnFemaleHuman', 'spawnWolf', 'spawnDog', 'spawnFruit', 'spawnMushroom'];
const START_BUTTON_IDS = ['startGameBtn', 'startGameBtnTop'];

export interface ValidationResult {
  valid: boolean;
  fieldErrors: FieldError[];
  spawnTotal: number;
  spawnExceeded: boolean;
}

/**
 * Pre-game configuration form (PRD 3.7, US-007/008).
 *
 * Every numeric field is validated on input; Start stays disabled with a
 * summary while anything is invalid. The config handed to onStart is a fresh
 * clone, never this panel's internal object (Game freezes what it receives).
 */
export class ConfigPanel {
  private panel: HTMLElement;
  private config: GameConfig;
  private onStartCallback: ((config: GameConfig) => void) | null = null;

  constructor() {
    const panel = document.getElementById('configPanel');
    if (!panel) throw new Error('Config panel element not found');
    this.panel = panel;
    this.config = getDefaultConfig();
    this.prepareInputs();
    this.setupEventListeners();
  }

  // ---------------------------------------------------------------- setup

  /** Sync min/max attributes from the rules, add error slots and range hints. */
  private prepareInputs(): void {
    for (const rule of FIELD_RULES) {
      const input = this.getInput(rule.id);
      if (!input) continue;
      input.min = String(rule.min);
      if (rule.max !== undefined) input.max = String(rule.max);
      else input.removeAttribute('max');
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
      input.setAttribute('aria-describedby', errorId);
    }
    this.updateHints();
  }

  private setupEventListeners(): void {
    document.getElementById('saveConfigBtn')?.addEventListener('click', () => this.saveConfiguration());
    document.getElementById('loadConfigBtn')?.addEventListener('click', () => this.triggerLoadConfiguration());
    document.getElementById('loadConfigFile')?.addEventListener('change', (e) => this.loadConfiguration(e));
    document.getElementById('resetConfigBtn')?.addEventListener('click', () => this.resetToDefaults());
    for (const id of START_BUTTON_IDS) {
      document.getElementById(id)?.addEventListener('click', () => this.handleStartGame());
    }
    document.getElementById('collapseAllBtn')?.addEventListener('click', () => this.toggleCollapseAll());

    for (const header of Array.from(document.querySelectorAll<HTMLElement>('.config-section-header'))) {
      header.addEventListener('click', () => this.toggleSection(header));
    }

    for (const rule of FIELD_RULES) {
      const input = this.getInput(rule.id);
      if (!input) continue;
      input.addEventListener('input', () => this.validate());
      input.addEventListener('change', () => this.validate());
    }

    i18n.onLanguageChange(() => {
      this.updateButtonTexts();
      this.updateHints();
      this.validate();
    });

    // Ctrl/Cmd+S save, Ctrl/Cmd+O load – only while the panel is showing.
    document.addEventListener('keydown', (e) => {
      if (!this.isVisible() || !(e.ctrlKey || e.metaKey)) return;
      if (e.key === 's') {
        e.preventDefault();
        this.saveConfiguration();
      } else if (e.key === 'o') {
        e.preventDefault();
        this.triggerLoadConfiguration();
      }
    });
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

  /** Build a brand-new config object from the current form values. */
  private readConfigFromInputs(): GameConfig {
    const config = getDefaultConfig();
    for (const rule of FIELD_RULES) {
      if (!this.getInput(rule.id)) continue; // keep default for fields absent from the DOM
      (config[rule.section] as unknown as Record<string, number>)[rule.key] = this.getInputValue(rule.id);
    }
    return config;
  }

  // ---------------------------------------------------------------- validation

  private hintFor(rule: FieldRule): string {
    let hint =
      rule.max !== undefined ? i18n.t('errors.rangeHint', rule.min, rule.max) : i18n.t('errors.minHint', rule.min);
    if (rule.integer) hint += ` (${i18n.t('errors.wholeNumberHint')})`;
    return hint;
  }

  /** Tooltips with the valid range for each parameter (PRD 3.7.12). */
  private updateHints(): void {
    for (const rule of FIELD_RULES) {
      const input = this.getInput(rule.id);
      if (input) input.title = this.hintFor(rule);
    }
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
   * the summary and the Start buttons. Returns the overall result.
   */
  validate(): ValidationResult {
    const fieldErrors: FieldError[] = [];

    for (const rule of FIELD_RULES) {
      const input = this.getInput(rule.id);
      if (!input) continue;
      const error = validateValue(rule, this.getInputValue(rule.id));
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

    const total = SPAWN_IDS.reduce((sum, id) => sum + this.getInputValue(id), 0);
    const spawnExceeded = Number.isFinite(total) && total > 1 + 1e-9;
    this.renderSpawnMessage(total, spawnExceeded);
    this.updateExpectedCounts();

    const problemCount = fieldErrors.length + (spawnExceeded ? 1 : 0);
    const valid = problemCount === 0;

    for (const id of START_BUTTON_IDS) {
      const btn = document.getElementById(id);
      if (btn instanceof HTMLButtonElement) btn.disabled = !valid;
    }
    const summary = document.getElementById('configValidationSummary');
    if (summary) {
      summary.textContent = valid ? '' : `❌ ${i18n.t('config.validationSummary', problemCount)}`;
      summary.hidden = valid;
    }

    return { valid, fieldErrors, spawnTotal: total, spawnExceeded };
  }

  private renderSpawnMessage(total: number, exceeded: boolean): void {
    const msg = document.getElementById('spawnValidation');
    if (!msg) return;
    const pct = `${(total * 100).toFixed(1)}%`;
    if (!Number.isFinite(total)) {
      msg.textContent = '';
      msg.className = 'validation-message';
    } else if (exceeded) {
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

  private updateExpectedCounts(): void {
    const el = document.getElementById('expectedCounts');
    if (!el) return;
    const cells = this.getInputValue('boardWidth') * this.getInputValue('boardHeight');
    const expected = SPAWN_IDS.map((id) => {
      const n = Math.round(cells * this.getInputValue(id));
      return Number.isFinite(n) ? n : '?';
    });
    el.textContent = i18n.t('config.expectedCreaturesDetailed', ...expected);
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
    this.onStartCallback?.(structuredClone(this.config));
  }

  show(): void {
    this.panel.style.display = 'flex';
    this.panel.removeAttribute('aria-hidden');
    this.populateInputs();
    this.updateButtonTexts();
    document.getElementById('startGameBtnTop')?.focus();
  }

  hide(): void {
    this.panel.style.display = 'none';
    this.panel.setAttribute('aria-hidden', 'true');
  }

  isVisible(): boolean {
    return this.panel.style.display !== 'none';
  }

  onStart(callback: (config: GameConfig) => void): void {
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
   * Returns the validation result.
   */
  applyLoadedData(data: unknown, fileName: string): ValidationResult {
    const wrapped = data as { config?: unknown; version?: unknown } | null;
    const loaded = wrapped && typeof wrapped === 'object' && 'config' in wrapped ? wrapped.config : data;
    if (wrapped && typeof wrapped === 'object' && wrapped.version) {
      debugLog('[ConfigPanel] Loading config version:', wrapped.version);
    }

    const { config, replaced } = mergeWithDefaults(loaded);
    if (replaced.length > 0) debugLog('[ConfigPanel] Non-numeric values replaced by defaults:', replaced);
    this.config = config;
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
