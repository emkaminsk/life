import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/ui/notifications', () => ({ showNotification: vi.fn() }));

import { type App, createApp } from '../src/app';
import { createEmptyLayout, setCell } from '../src/core/BoardLayout';
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
