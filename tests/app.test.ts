import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/ui/notifications', () => ({ showNotification: vi.fn() }));
vi.mock('../src/core/challenges', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/core/challenges')>();
  return { ...original, getChallenge: vi.fn(original.getChallenge) };
});

import { type App, boardCellSize, createApp } from '../src/app';
import { createEmptyLayout, setCell } from '../src/core/BoardLayout';
import { type ChallengeDef, getChallenge } from '../src/core/challenges';
import { MAX_CELL_SIZE, MIN_CELL_SIZE } from '../src/core/Renderer';
import { i18n } from '../src/i18n/i18n';
import { Language } from '../src/i18n/types';
import type { GameConfig } from '../src/ui/ConfigPanel';
import { getDefaultConfig } from '../src/ui/configValidation';
import { showNotification } from '../src/ui/notifications';
import { APP_VERSION } from '../src/version';
import { installCanvasStub } from './rendering/canvasStub';
import { bodyHtml, startBtn } from './ui/configFixture';

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const click = (id: string) => byId<HTMLButtonElement>(id).click();
const configVisible = () => byId('configPanel').style.display !== 'none';
const summaryOpen = () => byId('summaryModal').classList.contains('active');
const key = (code: string, target: EventTarget = document.body) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true }));

/** A 3×3 board: one male surrounded by eight deadly wolves. Nobody can move, so round 1 runs synchronously. */
function doomedLayout() {
  let layout = createEmptyLayout(3, 3);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) layout = setCell(layout, x, y, 'wolf');
  return setCell(layout, 1, 1, 'male');
}

function smallConfig(width = 3, height = 3): GameConfig {
  const config = getDefaultConfig();
  config.board.width = width;
  config.board.height = height;
  config.wolf.damageToMale = 1000;
  return config;
}

let app: App;

beforeEach(() => {
  installCanvasStub();
  i18n.setLanguage(Language.EN);
  document.body.innerHTML = bodyHtml;
  vi.mocked(showNotification).mockClear();
  app = createApp(document);
});

afterEach(() => {
  app.destroy();
  i18n.setLanguage(Language.EN);
});

describe('createApp', () => {
  it('starts on the config panel with idle controls and the version label', () => {
    expect(configVisible()).toBe(true);
    expect(app.controls.getState()).toBe('idle');
    expect(byId<HTMLButtonElement>('finishBtn').disabled).toBe(true);
    expect(byId('appVersion').textContent).toContain(APP_VERSION);
    expect(byId('traitPanel').querySelector('details')).not.toBeNull();
  });

  it('random start: Start populates the board and auto-starts the game', async () => {
    startBtn().click();
    await vi.waitFor(() => expect(app.controls.getState()).toBe('running'));
    expect(configVisible()).toBe(false);
    expect(app.game.isConfigLocked()).toBe(true);
    expect(app.board.getAllEntities().length).toBeGreaterThan(0);
    expect(Number(byId('maleCount').textContent)).toBeGreaterThan(0);
    expect(byId('overcrowdingStatus')).not.toBeNull();
    // Rules text shows the configured values.
    const pregnancy = String(getDefaultConfig().human.pregnancyPeriod);
    expect(document.querySelector('[data-i18n="rules.femalesDesc"]')?.textContent).toContain(pregnancy);
  });

  it('large boards are populated asynchronously and still auto-start', async () => {
    await app.startGame(smallConfig(60, 52));
    expect(app.board.width).toBe(60);
    expect(app.controls.getState()).toBe('running');
    expect(byId('initProgress').classList.contains('active')).toBe(false);
  });

  it('Finish shows the summary; New experiment returns to the config panel', async () => {
    await app.startGame(getDefaultConfig());
    click('finishBtn');
    expect(app.game.getEndReason()).toBe('userFinished');
    expect(app.controls.getState()).toBe('over');
    expect(summaryOpen()).toBe(true);
    expect(byId('summaryModal').textContent).toContain('You finished the game.');

    byId('summaryModal').querySelector<HTMLButtonElement>('.summary-actions .btn-primary')?.click();
    expect(summaryOpen()).toBe(false);
    expect(configVisible()).toBe(true);
    expect(app.controls.getState()).toBe('idle');
    expect(app.game.isConfigLocked()).toBe(false);
  });

  it('Back to board keeps the finished board; Finish reopens the summary', async () => {
    await app.startGame(getDefaultConfig());
    click('finishBtn');
    byId('summaryModal').querySelector<HTMLButtonElement>('.summary-actions .btn-secondary')?.click();
    expect(summaryOpen()).toBe(false);
    expect(configVisible()).toBe(false);
    expect(app.controls.getState()).toBe('over');
    click('finishBtn');
    expect(summaryOpen()).toBe(true);
  });

  it('Reset goes straight back to the config panel without a summary', async () => {
    await app.startGame(getDefaultConfig());
    click('resetBtn');
    expect(summaryOpen()).toBe(false);
    expect(configVisible()).toBe(true);
    expect(app.controls.getState()).toBe('idle');
    expect(app.board.getAllEntities()).toHaveLength(0);
  });

  it('manual start opens the setup view; Back returns to the config panel', async () => {
    document.querySelector<HTMLInputElement>('input[name="setupMode"][value="manual"]')!.checked = true;
    startBtn().click();
    await vi.waitFor(() => expect(app.setupView.isActive()).toBe(true));
    expect(configVisible()).toBe(false);
    expect(app.controls.getState()).toBe('idle');

    // Global shortcuts are blocked while the setup view is open.
    const toggle = vi.spyOn(app.controls, 'togglePause');
    key('Space');
    expect(toggle).not.toHaveBeenCalled();

    key('Escape', byId('setupView').querySelector('canvas') as HTMLCanvasElement);
    expect(app.setupView.isActive()).toBe(false);
    expect(configVisible()).toBe(true);
  });

  it('confirming a manual layout starts the game from exactly that layout', async () => {
    await app.startGame(smallConfig(4, 4), { setupMode: 'manual' });
    const layout = setCell(setCell(createEmptyLayout(4, 4), 0, 0, 'male'), 3, 3, 'female');
    app.setupView.onConfirm?.(layout);
    expect(app.board.getAllEntities()).toHaveLength(2);
    expect(app.controls.getState()).not.toBe('idle');
  });

  it('automatic game over: controls go to over and the summary shows, without extinction toasts', async () => {
    await app.startGame(smallConfig(), { setupMode: 'manual' });
    app.setupView.onConfirm?.(doomedLayout());

    expect(app.game.getEndReason()).toBe('humansExtinct');
    expect(app.controls.getState()).toBe('over');
    expect(summaryOpen()).toBe(true);
    expect(byId('summaryModal').textContent).toContain('all humans have died out');
    expect(byId('summaryModal').querySelector('.summary-conclusions li')).not.toBeNull();
    const titles = vi.mocked(showNotification).mock.calls.map(([title]) => title);
    expect(titles).not.toContain(i18n.t('notifications.maleExtinctionTitle'));
    // Board stays visible behind the summary; Space does nothing while it is open.
    expect(configVisible()).toBe(false);
    const toggle = vi.spyOn(app.controls, 'togglePause');
    key('Space');
    expect(toggle).not.toHaveBeenCalled();
  });

  it('a start error is reported and the config panel comes back', async () => {
    await app.startGame(smallConfig(), { setupMode: 'manual' });
    app.setupView.onConfirm?.(createEmptyLayout(2, 2)); // wrong size
    expect(showNotification).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'error');
    expect(configVisible()).toBe(true);
    expect(app.game.isConfigLocked()).toBe(false);
  });

  it('language change re-renders the version label and the open summary', async () => {
    await app.startGame(getDefaultConfig());
    click('finishBtn');
    i18n.setLanguage(Language.PL);
    expect(document.documentElement.lang).toBe(Language.PL);
    expect(byId('appVersion').textContent).toBe(i18n.t('app.version', APP_VERSION));
    expect(byId('appVersion').textContent).not.toContain('Version');
    expect(byId('summaryModal').textContent).toContain('Gra została zakończona.');
  });

  it('Space pauses and resumes; arrows step when paused', async () => {
    await app.startGame(getDefaultConfig());
    key('Space');
    expect(app.controls.getState()).toBe('paused');
    app.game.setAnimationDuration(0); // rounds complete synchronously
    const round = app.board.round;
    key('ArrowRight');
    expect(app.board.round).toBe(round + 1);
    key('Space');
    expect(app.controls.getState()).toBe('running');
  });

  it('rules tabs support Left/Right/Home/End', () => {
    click('helpBtn');
    const tabs = Array.from(document.querySelectorAll<HTMLElement>('.modal-tab'));
    const selected = () => tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    key('ArrowRight', tabs[0]);
    expect(selected()).toBe(1);
    expect(document.activeElement).toBe(tabs[1]);
    key('End', tabs[1]);
    expect(selected()).toBe(tabs.length - 1);
    key('ArrowRight', tabs[tabs.length - 1]);
    expect(selected()).toBe(0);
    key('ArrowLeft', tabs[0]);
    expect(selected()).toBe(tabs.length - 1);
    key('Home', tabs[tabs.length - 1]);
    expect(selected()).toBe(0);
    expect(byId(`${tabs[0].dataset.tab}-tab`).classList.contains('active')).toBe(true);
    tabs[2].click();
    expect(selected()).toBe(2);
  });

  it('destroy() removes the listeners', () => {
    app.destroy();
    click('helpBtn');
    expect(byId('rulesModal').classList.contains('active')).toBe(false);
  });
});

describe('createApp: start paused, classic mode, challenges', () => {
  it('Start paused: round 0 paused with Step focused; Step runs round 1', async () => {
    byId<HTMLButtonElement>('startPausedBtn').click();
    await vi.waitFor(() => expect(app.controls.getState()).toBe('paused'));
    expect(app.board.round).toBe(0);
    expect(app.game.running()).toBe(false);
    expect(app.game.isConfigLocked()).toBe(true);
    expect(document.activeElement).toBe(byId('stepBtn'));
    app.game.setAnimationDuration(0); // rounds complete synchronously
    click('stepBtn');
    expect(app.board.round).toBe(1);
    expect(app.controls.getState()).toBe('paused');
    expect(byId('round').textContent).toBe('Round: 1');
  });

  it('manual setup confirm honours Start paused', async () => {
    await app.startGame(smallConfig(4, 4), { setupMode: 'manual', startPaused: true });
    app.setupView.onConfirm?.(setCell(createEmptyLayout(4, 4), 0, 0, 'male'));
    expect(app.controls.getState()).toBe('paused');
    expect(app.board.round).toBe(0);
  });

  it('a start error after the controls began puts them back to idle', async () => {
    vi.spyOn(app.game, 'start').mockImplementation(() => {
      throw new Error('boom');
    });
    await app.startGame(getDefaultConfig());
    expect(showNotification).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('boom'), 'error');
    expect(app.controls.getState()).toBe('idle');
    expect(configVisible()).toBe(true);
    expect(app.game.isConfigLocked()).toBe(false);
  });

  it('classic mode: the buttons drive the classic session, the header shows the generation', async () => {
    await app.startGame(getDefaultConfig(), { setupMode: 'random', mode: 'classic', startPaused: true });
    expect(app.getMode()).toBe('classic');
    expect(document.body.dataset.mode).toBe('classic');
    expect(app.controls.getState()).toBe('paused');
    expect(app.game.isConfigLocked()).toBe(false); // the ecosystem game is untouched
    expect(byId('round').textContent).toBe('Generation: 0');

    click('stepBtn');
    expect(app.classic.getGeneration()).toBe(1);
    expect(byId('round').textContent).toBe('Generation: 1');
    expect(app.controls.getState()).toBe('paused');

    click('runBtn');
    expect(app.classic.running()).toBe(true);
    key('Space');
    expect(app.controls.getState()).toBe('paused');
    expect(app.classic.running()).toBe(false);

    app.classic.onGameOver?.();
    expect(app.controls.getState()).toBe('over');

    click('resetBtn');
    expect(configVisible()).toBe(true);
    expect(app.controls.getState()).toBe('idle');
    expect(app.classic.getGeneration()).toBe(0);
  });

  it('classic mode from the config panel auto-starts; Finish halts without a summary', async () => {
    const radio = document.querySelector<HTMLInputElement>('input[name="gameMode"][value="classic"]')!;
    radio.checked = true;
    radio.dispatchEvent(new Event('change'));
    startBtn().click();
    await vi.waitFor(() => expect(app.controls.getState()).toBe('running'));
    expect(app.classic.running()).toBe(true);
    click('finishBtn');
    expect(app.classic.running()).toBe(false);
    expect(app.controls.getState()).toBe('over');
    expect(summaryOpen()).toBe(false);
    click('resetBtn');
    expect(configVisible()).toBe(true);
    expect(document.body.dataset.mode).toBe('classic'); // the panel's radios decide
  });

  it('a challenge is set before init; the HUD shows its progress until Reset', async () => {
    const def: ChallengeDef<number> = {
      id: 'babyBoom',
      emoji: '👶',
      locks: {},
      init: () => 0,
      step: (n, r) => n + r.events.births,
      progress: (n, round) => ({ value: n, target: 100, status: 'inProgress', round }),
    };
    vi.mocked(getChallenge).mockImplementation((id) => (id === 'babyBoom' ? def : null));
    try {
      await app.startGame(getDefaultConfig(), { setupMode: 'random', challengeId: 'babyBoom', startPaused: true });
      expect(app.game.getChallengeProgress()).toMatchObject({ id: 'babyBoom', round: 0 });
      expect(byId('challengePanel').hidden).toBe(false);
      app.game.setAnimationDuration(0);
      click('stepBtn');
      expect(app.game.getChallengeProgress()?.round).toBe(1);
      click('resetBtn');
      expect(byId('challengePanel').hidden).toBe(true);

      await app.startGame(getDefaultConfig()); // free play
      expect(app.game.getChallengeProgress()).toBeNull();
      expect(byId('challengePanel').hidden).toBe(true);
    } finally {
      vi.mocked(getChallenge).mockRestore(); // back to the real getChallenge
    }
  });

  it('the speed select drives both engines', () => {
    const classicSpeed = vi.spyOn(app.classic, 'setSpeed');
    const select = byId<HTMLSelectElement>('speedSelect');
    select.value = '50';
    select.dispatchEvent(new Event('change'));
    expect(app.game.getSpeed()).toBe(50);
    expect(classicSpeed).toHaveBeenCalledWith(50);
  });

  it('destroy() releases the rules dialog listeners', () => {
    click('helpBtn');
    expect(byId('rulesModal').classList.contains('active')).toBe(true);
    app.destroy();
    click('closeModal');
    expect(byId('rulesModal').classList.contains('active')).toBe(true);
  });
});

describe('boardCellSize', () => {
  it('uses the tighter of width and height', () => {
    expect(boardCellSize(600, 1000, 30, 30)).toBe(20); // width-bound
    expect(boardCellSize(1000, 300, 30, 30)).toBe(10); // height-bound
    expect(boardCellSize(1000, 300, 50, 10)).toBe(20); // wide board: width-bound
  });

  it('clamps to the renderer limits', () => {
    expect(boardCellSize(5000, 5000, 10, 10)).toBe(MAX_CELL_SIZE);
    expect(boardCellSize(100, 100, 100, 100)).toBe(MIN_CELL_SIZE);
    expect(boardCellSize(800, -50, 30, 30)).toBe(MIN_CELL_SIZE); // no room left below the header
    expect(boardCellSize(800, 600, 0, 30)).toBe(MIN_CELL_SIZE);
  });
});

describe('createApp: board fit and teardown', () => {
  const innerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
  const gameCanvas = () => byId<HTMLCanvasElement>('gameCanvas');
  const cssPx = (value: string) => Number.parseFloat(value);

  /** Pretend the game area is `width` px wide, starts `top` px down the page and the viewport is `height` px tall. */
  function mockViewport(width: number, top: number, height: number): void {
    const area = document.querySelector<HTMLElement>('.game-area') as HTMLElement;
    Object.defineProperty(area, 'clientWidth', { configurable: true, value: width });
    vi.spyOn(area, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  }

  function resize(): void {
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(200);
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    if (innerHeight) Object.defineProperty(window, 'innerHeight', innerHeight);
  });

  it('a wide but short viewport limits the board by its height', () => {
    mockViewport(1400, 100, 500); // the width alone would allow the maximum cell
    resize();
    const height = cssPx(gameCanvas().style.height);
    expect(height).toBeGreaterThan(0);
    expect(height).toBeLessThanOrEqual(500 - 100);
    expect(cssPx(gameCanvas().style.width)).toBeLessThan(MAX_CELL_SIZE * app.board.width);
  });

  it('a narrow, tall viewport limits the board by its width', () => {
    mockViewport(330, 60, 2000);
    resize();
    expect(cssPx(gameCanvas().style.width)).toBeLessThanOrEqual(330);
    // At most padding + border + one cell of slack per column is lost.
    expect(cssPx(gameCanvas().style.width)).toBeGreaterThanOrEqual(330 - 60 - app.board.width);
  });

  it('classic mode fits the classic canvas into the same area', async () => {
    mockViewport(900, 80, 600);
    const fit = vi.spyOn(app.classic, 'fit');
    await app.startGame(getDefaultConfig(), { setupMode: 'random', mode: 'classic', startPaused: true });
    expect(fit).toHaveBeenCalled();
    const [w, h] = fit.mock.calls[fit.mock.calls.length - 1];
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThanOrEqual(900);
    expect(h).toBeGreaterThan(0);
    expect(h).toBeLessThanOrEqual(600 - 80);
    fit.mockClear();
    resize();
    expect(fit).toHaveBeenCalledTimes(1);
  });

  it('destroy() cancels a pending resize refit', () => {
    mockViewport(1400, 100, 500);
    const before = gameCanvas().style.height;
    window.dispatchEvent(new Event('resize'));
    app.destroy();
    vi.advanceTimersByTime(1000);
    expect(gameCanvas().style.height).toBe(before);
  });

  it('destroy() hides and empties the entity tooltip', () => {
    const tip = byId('entityTooltip');
    tip.style.display = 'block';
    tip.querySelector('.tooltip-header')!.textContent = 'Wolf';
    tip.querySelector('.tooltip-stats')!.append(document.createElement('div'));
    app.destroy();
    expect(tip.style.display).toBe('none');
    expect(tip.textContent?.trim()).toBe('');
  });
});
