import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { bodyHtml, input, setInput, startBtn } from './configFixture';

vi.mock('../../src/ui/notifications', () => ({
  showNotification: vi.fn(),
}));

import { ConfigPanel, type GameConfig } from '../../src/ui/ConfigPanel';
import {
  boardAreaOf,
  FIELD_RULES,
  getDefaultConfig,
  isConfigStartable,
  MAX_BOARD_AREA,
  mergeWithDefaults,
  resolveRule,
  validateConfig,
  validateValue,
} from '../../src/ui/configValidation';
import { showNotification } from '../../src/ui/notifications';
import { DEFAULT_CONFIG } from '../../src/config';
import { i18n } from '../../src/i18n/i18n';
import { Language } from '../../src/i18n/types';
import { Game } from '../../src/core/Game';
import { Board } from '../../src/core/Board';
import { createMockRenderer } from '../setup';

describe('ConfigPanel', () => {
  let panel: ConfigPanel;

  beforeEach(() => {
    i18n.setLanguage(Language.EN);
    document.body.innerHTML = bodyHtml;
    vi.mocked(showNotification).mockClear();
    panel = new ConfigPanel();
    panel.show();
  });

  afterEach(() => {
    panel.destroy();
  });

  describe('validation gates Start (M6)', () => {
    it('defaults are valid and Start is enabled', () => {
      expect(panel.validate().valid).toBe(true);
      expect(startBtn().disabled).toBe(false);
      expect(document.getElementById('configValidationSummary')!.hidden).toBe(true);
    });

    it('rejects an empty / NaN value with a per-field message and disables Start', () => {
      setInput('humanHealth', '');
      expect(input('humanHealth').classList.contains('invalid')).toBe(true);
      expect(input('humanHealth').getAttribute('aria-invalid')).toBe('true');
      expect(document.getElementById('humanHealth-error')!.textContent).toBe('Please enter a number');
      expect(startBtn().disabled).toBe(true);
      const summary = document.getElementById('configValidationSummary')!;
      expect(summary.hidden).toBe(false);
      expect(summary.textContent).toContain('1');
    });

    it('validates every numeric field, not just spawn probabilities', () => {
      for (const rule of FIELD_RULES) {
        setInput(rule.id, '-5');
      }
      const result = panel.validate();
      expect(result.valid).toBe(false);
      // every field has a minimum ≥ 0, so -5 is invalid everywhere
      expect(result.fieldErrors.map((e) => e.rule.id).sort()).toEqual(FIELD_RULES.map((r) => r.id).sort());
    });

    it('shows the violated bound in the message', () => {
      setInput('boardWidth', '500');
      expect(document.getElementById('boardWidth-error')!.textContent).toBe('Must be at most 100');
      setInput('boardWidth', '5');
      expect(document.getElementById('boardWidth-error')!.textContent).toBe('Must be at least 10');
      setInput('boardWidth', '20.5');
      expect(document.getElementById('boardWidth-error')!.textContent).toBe('Must be a whole number');
      setInput('boardWidth', '20');
      expect(document.getElementById('boardWidth-error')!.textContent).toBe('');
      expect(startBtn().disabled).toBe(false);
    });

    it('blocks Start when spawn probabilities exceed 100%', () => {
      setInput('spawnFruit', '0.9');
      expect(panel.validate().spawnExceeded).toBe(true);
      expect(document.getElementById('spawnValidation')!.className).toContain('validation-error');
      expect(startBtn().disabled).toBe(true);
    });

    it('warns (but allows Start) above 90% total', () => {
      setInput('spawnFruit', '0.5'); // 0.15+0.15+0.05+0.03+0.5+0.01 = 0.89
      setInput('spawnMushroom', '0.05'); // 0.93
      expect(document.getElementById('spawnValidation')!.className).toContain('validation-warning');
      expect(startBtn().disabled).toBe(false);
    });

    it('clicking a (forced-enabled) Start with invalid input does not start', () => {
      const onStart = vi.fn();
      panel.onStart(onStart);
      setInput('wolfHealth', 'abc');
      startBtn().disabled = false;
      startBtn().click();
      expect(onStart).not.toHaveBeenCalled();
      expect(panel.isVisible()).toBe(true);
    });

    it('provides range tooltips for each parameter (PRD 3.7.12)', () => {
      expect(input('boardWidth').title).toContain('Valid range: 10 to 100 (whole numbers only)');
      expect(input('humanHealth').title).toContain('Valid range: 1 or more');
    });
  });

  describe('no artificial upper limits', () => {
    const bounded = new Set(['boardWidth', 'boardHeight', 'injuredThreshold', 'humanMultiplier', 'animalMultiplier']);

    it('only board size, PRD-specified overcrowding ranges, percentages and probabilities have a fixed max', () => {
      for (const rule of FIELD_RULES) {
        const isProbability = rule.min === 0 && rule.max === 1;
        if (rule.maxIsBoardArea) continue; // dynamic bound, tested below
        if (!bounded.has(rule.id) && !isProbability) {
          expect(rule.max, rule.id).toBeUndefined();
          expect(input(rule.id).hasAttribute('max'), rule.id).toBe(false);
        }
      }
    });

    it('accepts extreme values for unbounded parameters', () => {
      setInput('humanHealth', '100000');
      setInput('wolfDamageToMale', '5000');
      setInput('humanPerception', '250');
      setInput('fruitRipen', '999');
      setInput('humanPregnancy', '365');
      expect(panel.validate().valid).toBe(true);
    });

    it('enforces PRD 3.7.10 overcrowding ranges', () => {
      setInput('humanMultiplier', '11');
      setInput('animalThreshold', '5');
      const ids = panel.validate().fieldErrors.map((e) => e.rule.id);
      expect(ids).toHaveLength(2);
      expect(ids).toContain('humanMultiplier');
      expect(ids).toContain('animalThreshold');
    });

    it('overcrowding thresholds go up to the board area, not a fixed 1000 (R14)', () => {
      setInput('boardWidth', '100');
      setInput('boardHeight', '100');
      setInput('humanThreshold', '5000');
      setInput('animalThreshold', '10000');
      expect(panel.validate().valid).toBe(true);
      expect(input('humanThreshold').max).toBe('10000');

      setInput('animalThreshold', '10001');
      expect(document.getElementById('animalThreshold-error')!.textContent).toBe('Must be at most 10000');

      // shrinking the board re-bounds the thresholds and their range hints
      setInput('boardWidth', '20');
      setInput('boardHeight', '10');
      const ids = panel.validate().fieldErrors.map((e) => e.rule.id);
      expect(ids.sort()).toEqual(['animalThreshold', 'humanThreshold']);
      expect(document.getElementById('humanThreshold-error')!.textContent).toBe('Must be at most 200');
      expect(input('humanThreshold').max).toBe('200');
      expect(document.getElementById('humanThreshold-help')!.textContent).toContain('Valid range: 10 to 200');
    });

    it('a half-typed board size does not flag the thresholds', () => {
      setInput('humanThreshold', '5000');
      setInput('boardWidth', '');
      const ids = panel.validate().fieldErrors.map((e) => e.rule.id);
      expect(ids).toEqual(['boardWidth']);
    });
  });

  describe('start emits a clone (H3)', () => {
    it('passes a config read from the form', () => {
      const onStart = vi.fn();
      panel.onStart(onStart);
      setInput('boardWidth', '42');
      setInput('humanHealth', '150');
      startBtn().click();
      expect(onStart).toHaveBeenCalledTimes(1);
      const config: GameConfig = onStart.mock.calls[0][0];
      expect(config.board.width).toBe(42);
      expect(config.human.startingHealth).toBe(150);
      expect(panel.isVisible()).toBe(false);
    });

    it('never hands out its internal object', () => {
      const onStart = vi.fn();
      panel.onStart(onStart);
      startBtn().click();
      const emitted: GameConfig = onStart.mock.calls[0][0];
      emitted.board.width = 99;
      emitted.human.startingHealth = 1;
      expect(panel.getConfig().board.width).toBe(DEFAULT_CONFIG.board.width);
      expect(panel.getConfig().human.startingHealth).toBe(DEFAULT_CONFIG.human.startingHealth);
      expect(panel.getConfig()).not.toBe(panel.getConfig());
    });

    it('the emitted config is accepted by Game.updateConfig and initializeBoard', () => {
      const onStart = vi.fn();
      panel.onStart(onStart);
      setInput('boardWidth', '20');
      setInput('boardHeight', '15');
      startBtn().click();
      const config: GameConfig = onStart.mock.calls[0][0];
      const board = new Board(config.board.width, config.board.height);
      const game = new Game(board, createMockRenderer());
      game.updateConfig(config);
      game.initializeBoard();
      expect(board.width).toBe(20);
      expect(board.height).toBe(15);
      expect(game.getConfig().board.width).toBe(20);
    });
  });

  describe('loading configuration files', () => {
    it('loads a wrapped config, fills missing values with defaults and notifies', () => {
      const result = panel.applyLoadedData(
        {
          version: '1.0',
          config: { board: { width: 35, height: 40 }, human: { startingHealth: 120 } },
        },
        'my.json',
      );
      expect(result.valid).toBe(true);
      expect(input('boardWidth').value).toBe('35');
      expect(input('boardHeight').value).toBe('40');
      expect(input('humanHealth').value).toBe('120');
      expect(input('wolfHealth').value).toBe(String(DEFAULT_CONFIG.wolf.startingHealth));
      expect(panel.getConfig().board.width).toBe(35);
      expect(showNotification).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('my.json'), 'info');
    });

    it('loads an unwrapped config', () => {
      panel.applyLoadedData({ board: { width: 44, height: 44 } }, 'plain.json');
      expect(input('boardWidth').value).toBe('44');
    });

    it('validates loaded values the same way as typed ones (no silent clamping)', () => {
      const result = panel.applyLoadedData(
        {
          config: {
            board: { width: 5, height: 200 },
            spawn: { maleHumanProbability: 5 },
            human: { startingHealth: 999 },
          },
        },
        'bad.json',
      );
      expect(result.valid).toBe(false);
      expect(input('boardWidth').value).toBe('5');
      expect(input('boardWidth').classList.contains('invalid')).toBe(true);
      expect(input('boardHeight').classList.contains('invalid')).toBe(true);
      expect(input('spawnMaleHuman').classList.contains('invalid')).toBe(true);
      // no artificial cap on health: 999 is fine
      expect(input('humanHealth').classList.contains('invalid')).toBe(false);
      expect(startBtn().disabled).toBe(true);
      expect(showNotification).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'warning');
    });

    it('replaces non-numeric loaded values with defaults', () => {
      panel.applyLoadedData({ human: { startingHealth: 'lots', gompertzA: null } }, 'x.json');
      expect(input('humanHealth').value).toBe(String(DEFAULT_CONFIG.human.startingHealth));
      expect(input('humanGompertzA').value).toBe(String(DEFAULT_CONFIG.human.gompertzA));
    });

    it('reports invalid JSON through an error notification (via FileReader)', () => {
      class FakeReader {
        onload: ((e: { target: { result: string } }) => void) | null = null;
        readAsText() {
          this.onload?.({ target: { result: '{ invalid json' } });
        }
      }
      vi.stubGlobal('FileReader', FakeReader);
      const fileInput = input('loadConfigFile');
      Object.defineProperty(fileInput, 'files', {
        value: [new File(['x'], 'broken.json')],
        configurable: true,
      });
      fileInput.dispatchEvent(new Event('change'));
      expect(showNotification).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'error');
    });

    it('loads a file through the hidden input', () => {
      const json = JSON.stringify({ config: { board: { width: 33 } } });
      class FakeReader {
        onload: ((e: { target: { result: string } }) => void) | null = null;
        readAsText() {
          this.onload?.({ target: { result: json } });
        }
      }
      vi.stubGlobal('FileReader', FakeReader);
      const fileInput = input('loadConfigFile');
      Object.defineProperty(fileInput, 'files', {
        value: [new File([json], 'ok.json')],
        configurable: true,
      });
      fileInput.dispatchEvent(new Event('change'));
      expect(input('boardWidth').value).toBe('33');
    });
  });

  describe('sections and reset', () => {
    it('section headers are buttons that toggle aria-expanded', () => {
      const header = document.querySelector<HTMLButtonElement>('.config-section-header')!;
      expect(header.tagName).toBe('BUTTON');
      expect(header.getAttribute('aria-expanded')).toBe('true');
      header.click();
      expect(header.getAttribute('aria-expanded')).toBe('false');
      expect(header.closest('.config-section')!.classList.contains('collapsed')).toBe(true);
    });

    it('collapse all toggles every section and the button label', () => {
      const btn = document.getElementById('collapseAllBtn')!;
      expect(btn.textContent).toBe('Collapse');
      btn.click();
      expect(document.querySelectorAll('.config-section:not(.collapsed)').length).toBe(0);
      expect(btn.textContent).toBe('Expand');
      btn.click();
      expect(document.querySelectorAll('.config-section.collapsed').length).toBe(0);
    });

    it('Reset to Defaults restores values and clears errors', () => {
      setInput('humanHealth', '');
      document.getElementById('resetConfigBtn')!.click();
      expect(input('humanHealth').value).toBe(String(DEFAULT_CONFIG.human.startingHealth));
      expect(startBtn().disabled).toBe(false);
    });

    it('re-translates validation messages on language change', () => {
      setInput('humanHealth', '');
      i18n.setLanguage(Language.PL);
      expect(document.getElementById('humanHealth-error')!.textContent).toBe('Wpisz liczbę');
      i18n.setLanguage(Language.EN);
    });
  });

  describe('layout: Start always reachable (F3)', () => {
    it('Start sits in the footer outside the scroll area; there is no second Start button', () => {
      const footer = document.querySelector('.config-footer')!;
      const scroll = document.querySelector('.config-scroll')!;
      expect(footer.contains(startBtn())).toBe(true);
      expect(scroll.contains(footer)).toBe(false);
      expect(document.getElementById('startGameBtnTop')).toBeNull();
      expect(document.querySelectorAll('#configPanel .btn-primary')).toHaveLength(1);
      // the validation summary is next to Start, every section scrolls
      expect(footer.contains(document.getElementById('configValidationSummary'))).toBe(true);
      expect(scroll.querySelectorAll('.config-section').length).toBe(
        document.querySelectorAll('.config-section').length,
      );
    });

    it('show() focuses Start and Start advertises Ctrl+Enter', () => {
      panel.hide();
      panel.show();
      expect(document.activeElement).toBe(startBtn());
      expect(startBtn().title).toBe('Start the game (Ctrl+Enter)');
      expect(startBtn().getAttribute('aria-keyshortcuts')).toBe('Control+Enter');
    });
  });

  describe('keyboard shortcuts', () => {
    const press = (key: string, opts: KeyboardEventInit = { ctrlKey: true }) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
      document.dispatchEvent(event);
      return event;
    };

    let blobs: Blob[];
    let downloads: string[];
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;

    beforeEach(() => {
      blobs = [];
      downloads = [];
      URL.createObjectURL = vi.fn((blob: Blob) => {
        blobs.push(blob);
        return 'blob:test';
      });
      URL.revokeObjectURL = vi.fn();
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        downloads.push(this.download);
      });
    });

    afterEach(() => {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    });

    const readBlob = (blob: Blob) =>
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });

    it('Ctrl+S saves the current form (with setup mode) as a JSON download', async () => {
      setInput('humanHealth', '123');
      panel.setSetupMode('manual');
      const event = press('s');
      expect(event.defaultPrevented).toBe(true);
      expect(blobs).toHaveLength(1);
      expect(downloads[0]).toMatch(/^game-of-life-config-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
      expect(document.querySelector('a[download]')).toBeNull(); // temporary link removed

      const saved = JSON.parse(await readBlob(blobs[0]));
      expect(saved.version).toBe('1.0');
      expect(saved.setupMode).toBe('manual');
      expect(saved.config.human.startingHealth).toBe(123);
      expect(vi.mocked(showNotification)).toHaveBeenCalledWith(
        i18n.t('notifications.configSavedTitle'),
        expect.stringContaining(downloads[0]),
        'info',
      );
    });

    it('save then load of the same file round-trips the form', async () => {
      setInput('boardWidth', '44');
      setInput('humanCaution', '0.8');
      setInput('humanMetabolism', '0.4');
      document.getElementById('saveConfigBtn')!.click();
      const saved = JSON.parse(await readBlob(blobs[0]));

      document.getElementById('resetConfigBtn')!.click();
      expect(input('boardWidth').value).toBe(String(DEFAULT_CONFIG.board.width));
      panel.applyLoadedData(saved, 'saved.json');
      expect(panel.getConfig()).toEqual(saved.config);
      expect(input('boardWidth').value).toBe('44');
      expect(input('humanCaution').value).toBe('0.8');
      expect(input('humanMetabolism').value).toBe('0.4');
    });

    it('Ctrl+O opens the hidden file picker', () => {
      const picker = vi.spyOn(input('loadConfigFile'), 'click').mockImplementation(() => {});
      expect(press('o').defaultPrevented).toBe(true);
      expect(picker).toHaveBeenCalledTimes(1);
    });

    it('Ctrl+Enter starts when the form is valid', () => {
      const onStart = vi.fn();
      panel.onStart(onStart);
      expect(press('Enter').defaultPrevented).toBe(true);
      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart.mock.calls[0][1]).toEqual({ setupMode: 'random' });
      expect(panel.isVisible()).toBe(false);
    });

    it('Cmd+Enter works too, but not while the form is invalid', () => {
      const onStart = vi.fn();
      panel.onStart(onStart);
      setInput('humanHealth', '');
      press('Enter', { metaKey: true });
      expect(onStart).not.toHaveBeenCalled();
      expect(panel.isVisible()).toBe(true);
      setInput('humanHealth', '90');
      press('Enter', { metaKey: true });
      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('shortcuts need Ctrl/Cmd and are ignored while the panel is hidden', () => {
      const onStart = vi.fn();
      panel.onStart(onStart);
      expect(press('s', {}).defaultPrevented).toBe(false);
      press('Enter', {});
      expect(onStart).not.toHaveBeenCalled();

      panel.hide();
      expect(press('s').defaultPrevented).toBe(false);
      press('Enter');
      expect(blobs).toHaveLength(0);
      expect(onStart).not.toHaveBeenCalled();
    });

    it('destroy() removes the document, DOM and language listeners (no leak across panels)', () => {
      const onStart = vi.fn();
      panel.onStart(onStart);
      setInput('humanHealth', '');
      panel.destroy();

      press('s');
      expect(blobs).toHaveLength(0);
      startBtn().disabled = false;
      startBtn().click();
      press('Enter');
      expect(onStart).not.toHaveBeenCalled();
      i18n.setLanguage(Language.PL);
      expect(document.getElementById('humanHealth-error')!.textContent).toBe('Please enter a number');
      i18n.setLanguage(Language.EN);

      // A fresh panel on the same document: exactly one save per shortcut.
      panel = new ConfigPanel();
      panel.show();
      press('s');
      expect(blobs).toHaveLength(1);
    });
  });

  describe('setup mode switch (F1)', () => {
    const initialSpawnIds = [
      'spawnMaleHuman',
      'spawnFemaleHuman',
      'spawnWolf',
      'spawnDog',
      'spawnFruit',
      'spawnMushroom',
    ];
    const radio = (mode: string) =>
      document.querySelector<HTMLInputElement>(`input[name="setupMode"][value="${mode}"]`)!;
    const choose = (mode: string) => {
      radio(mode).checked = true;
      radio(mode).dispatchEvent(new Event('change'));
    };

    it('defaults to random with the spawn inputs enabled', () => {
      expect(panel.getSetupMode()).toBe('random');
      for (const id of initialSpawnIds) expect(input(id).disabled, id).toBe(false);
      expect(document.getElementById('setupModeHint')!.textContent).toContain('random');
    });

    it('manual disables the six start-spawn inputs and excludes them from validation', () => {
      setInput('spawnFruit', '0.95'); // sum > 100% blocks Start in random mode
      setInput('spawnWolf', 'abc');
      expect(startBtn().disabled).toBe(true);

      choose('manual');
      expect(panel.getSetupMode()).toBe('manual');
      for (const id of initialSpawnIds) expect(input(id).disabled, id).toBe(true);
      expect(input('wolfSpawn').disabled).toBe(false); // per-round respawn still applies
      const result = panel.validate();
      expect(result.valid).toBe(true);
      expect(result.spawnExceeded).toBe(false);
      expect(input('spawnWolf').classList.contains('invalid')).toBe(false);
      expect(document.getElementById('spawnValidation')!.textContent).toBe('');
      expect(document.getElementById('expectedSummary')!.hidden).toBe(true);
      expect(document.getElementById('setupModeHint')!.textContent).toContain('next screen');
      expect(startBtn().disabled).toBe(false);

      choose('random');
      expect(panel.validate().valid).toBe(false);
      expect(startBtn().disabled).toBe(true);
    });

    it('onStart receives the mode, and a valid config even with ignored invalid spawn inputs', () => {
      const onStart = vi.fn();
      panel.onStart(onStart);
      setInput('spawnWolf', 'abc');
      setInput('spawnDog', '0.2');
      choose('manual');
      startBtn().click();
      const [config, options] = onStart.mock.calls[0];
      expect(options).toEqual({ setupMode: 'manual' });
      expect(config.spawn.wolfProbability).toBe(DEFAULT_CONFIG.spawn.wolfProbability);
      expect(config.spawn.dogProbability).toBe(0.2);
      expect(isConfigStartable(config)).toBe(true);
    });

    it('a loaded file restores its setup mode; a file without one keeps the current mode', () => {
      panel.applyLoadedData({ version: '1.0', setupMode: 'manual', config: {} }, 'a.json');
      expect(panel.getSetupMode()).toBe('manual');
      expect(radio('manual').checked).toBe(true);
      panel.applyLoadedData({ version: '1.0', config: {} }, 'b.json');
      expect(panel.getSetupMode()).toBe('manual');
      panel.applyLoadedData({ setupMode: 'sideways', config: {} }, 'c.json');
      expect(panel.getSetupMode()).toBe('manual');
      panel.applyLoadedData({ setupMode: 'random', config: {} }, 'd.json');
      expect(panel.getSetupMode()).toBe('random');
      expect(input('spawnFruit').disabled).toBe(false);
    });
  });

  describe('genetics averages (R6)', () => {
    it('average caution and metabolism are editable and reach the emitted config', () => {
      const onStart = vi.fn();
      panel.onStart(onStart);
      setInput('humanCaution', '0.9');
      setInput('humanMetabolism', '0.75');
      startBtn().click();
      const config: GameConfig = onStart.mock.calls[0][0];
      expect(config.human.avgCaution).toBe(0.9);
      expect(config.human.avgMetabolism).toBe(0.75);
    });

    it('caution and metabolism are both 0–1 (the metabolism gene is capped at 1)', () => {
      setInput('humanCaution', '1.5');
      setInput('humanMetabolism', '-0.1');
      expect(
        panel
          .validate()
          .fieldErrors.map((e) => e.rule.id)
          .sort(),
      ).toEqual(['humanCaution', 'humanMetabolism']);
      setInput('humanCaution', '1');
      setInput('humanMetabolism', '1.5');
      expect(panel.validate().fieldErrors.map((e) => e.rule.id)).toEqual(['humanMetabolism']);
      setInput('humanMetabolism', '1');
      expect(panel.validate().valid).toBe(true);
    });

    it('loading a file fills both fields', () => {
      panel.applyLoadedData({ config: { human: { avgCaution: 0.2, avgMetabolism: 0.7 } } }, 'g.json');
      expect(input('humanCaution').value).toBe('0.2');
      expect(input('humanMetabolism').value).toBe('0.7');
    });
  });

  describe('expected starting population (R11, R14)', () => {
    it('shows the creature total (humans + wolves + dogs) and all entities', () => {
      // 30×30 defaults: 135♂ 135♀ 45🐺 27🐕 → 342 creatures; + 90🍎 9🍄 → 441 entities
      expect(document.getElementById('expectedCounts')!.textContent).toBe(
        'Expected creatures: ~135♂ 135♀ 45🐺 27🐕 90🍎 9🍄',
      );
      expect(document.getElementById('expectedTotals')!.textContent).toBe(
        'Expected starting creatures: ~342 (all entities including plants: ~441)',
      );
      expect(panel.validate().expectedCreatures).toBe(342);
    });

    it('shows ? while the board size is not a number', () => {
      setInput('boardHeight', '');
      expect(document.getElementById('expectedTotals')!.textContent).toBe(
        'Expected starting creatures: ~? (all entities including plants: ~?)',
      );
    });

    it('warns softly above 1000 expected creatures without blocking Start', () => {
      const warning = document.getElementById('perfWarning')!;
      expect(warning.hidden).toBe(true);
      setInput('boardWidth', '100');
      setInput('boardHeight', '100'); // 1500+1500+500+300 = 3800 creatures
      const result = panel.validate();
      expect(result.performanceWarning).toBe(true);
      expect(result.valid).toBe(true);
      expect(startBtn().disabled).toBe(false);
      expect(warning.hidden).toBe(false);
      expect(warning.textContent).toContain('3800');

      // exactly at the limit is fine: 50×50 cells × 0.4 = 1000 creatures
      setInput('boardWidth', '50');
      setInput('boardHeight', '50');
      setInput('spawnMaleHuman', '0.1');
      setInput('spawnFemaleHuman', '0.1');
      setInput('spawnWolf', '0.1');
      setInput('spawnDog', '0.1');
      expect(panel.validate().expectedCreatures).toBe(1000);
      expect(warning.hidden).toBe(true);
    });

    it('no warning in manual mode', () => {
      setInput('boardWidth', '100');
      setInput('boardHeight', '100');
      panel.setSetupMode('manual');
      expect(panel.validate().performanceWarning).toBe(false);
      expect(document.getElementById('perfWarning')!.hidden).toBe(true);
    });
  });
});

describe('configValidation', () => {
  it('validateValue covers NaN, Infinity, bounds and integers', () => {
    const rule = FIELD_RULES.find((r) => r.id === 'boardWidth')!;
    expect(validateValue(rule, Number.NaN)?.code).toBe('notANumber');
    expect(validateValue(rule, Number.POSITIVE_INFINITY)?.code).toBe('notANumber');
    expect(validateValue(rule, 9)?.code).toBe('tooLow');
    expect(validateValue(rule, 101)?.code).toBe('tooHigh');
    expect(validateValue(rule, 10.5)?.code).toBe('notInteger');
    expect(validateValue(rule, 50)).toBeNull();
  });

  it('default config is valid and startable', () => {
    expect(validateConfig(getDefaultConfig())).toEqual([]);
    expect(isConfigStartable(getDefaultConfig())).toBe(true);
  });

  it('spawn sum over 100% is not startable', () => {
    const config = getDefaultConfig();
    config.spawn.fruitProbability = 0.9;
    expect(validateConfig(config)).toEqual([]);
    expect(isConfigStartable(config)).toBe(false);
  });

  it('mergeWithDefaults keeps out-of-range numbers for validation and maps legacy names', () => {
    const { config, replaced } = mergeWithDefaults({
      board: { width: 5 },
      fruit: { energyValue: 35 },
      mushroom: { damageValue: 25 },
      human: { startingHealth: 'x' },
    });
    expect(config.board.width).toBe(5);
    expect(config.fruit.energyHealed).toBe(35);
    expect(config.mushroom.energyRemoved).toBe(25);
    expect(config.human.startingHealth).toBe(DEFAULT_CONFIG.human.startingHealth);
    expect(replaced).toEqual(['human.startingHealth']);
  });

  it('prefers new property names over legacy ones', () => {
    const { config } = mergeWithDefaults({ fruit: { energyHealed: 40, energyValue: 35 } });
    expect(config.fruit.energyHealed).toBe(40);
  });

  it('overcrowding thresholds are bounded by the configured board area', () => {
    const config = getDefaultConfig();
    config.board.width = 20;
    config.board.height = 10;
    config.overcrowding.humanThreshold = 200;
    expect(validateConfig(config)).toEqual([]);
    config.overcrowding.humanThreshold = 201;
    expect(validateConfig(config).map((e) => [e.rule.id, e.code, e.arg])).toEqual([['humanThreshold', 'tooHigh', 200]]);
  });

  it('boardAreaOf falls back to the largest board while a size is invalid', () => {
    expect(boardAreaOf(20, 10)).toBe(200);
    expect(boardAreaOf(Number.NaN, 10)).toBe(MAX_BOARD_AREA);
    expect(boardAreaOf(20, 101)).toBe(MAX_BOARD_AREA);
    expect(boardAreaOf(20.5, 10)).toBe(MAX_BOARD_AREA);
    expect(MAX_BOARD_AREA).toBe(10000);
  });

  it('resolveRule only changes board-area rules', () => {
    const threshold = FIELD_RULES.find((r) => r.id === 'animalThreshold')!;
    const health = FIELD_RULES.find((r) => r.id === 'humanHealth')!;
    expect(threshold.max).toBeUndefined();
    expect(resolveRule(threshold, 400).max).toBe(400);
    expect(resolveRule(health, 400)).toBe(health);
  });

  it('mergeWithDefaults loads the genetics averages (R6)', () => {
    const { config } = mergeWithDefaults({ human: { avgCaution: 0.3, avgMetabolism: 0.6 } });
    expect(config.human.avgCaution).toBe(0.3);
    expect(config.human.avgMetabolism).toBe(0.6);
    expect(mergeWithDefaults({}).config.human.avgCaution).toBe(DEFAULT_CONFIG.human.avgCaution);
  });

  it('handles empty / non-object input with all defaults', () => {
    expect(mergeWithDefaults({}).config).toEqual(getDefaultConfig());
    expect(mergeWithDefaults(null).config).toEqual(getDefaultConfig());
    expect(mergeWithDefaults('nope').config).toEqual(getDefaultConfig());
  });
});
