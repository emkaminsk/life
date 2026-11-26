/**
 * Application entry point: wires DOM elements to the game. Logic lives in
 * tested modules under src/ui (controls, keyboard, statistics, ConfigPanel…).
 */
import { Board } from './core/Board';
import { Game } from './core/Game';
import { Renderer } from './core/Renderer';
import { initializeDOMRenderer } from './i18n/DOMRenderer';
import { i18n } from './i18n/i18n';
import type { Language } from './i18n/types';
import { ConfigPanel, type GameConfig } from './ui/ConfigPanel';
import { GameControls } from './ui/controls';
import { debounce } from './ui/debounce';
import { createDialog } from './ui/dialog';
import { isLargeBoard, runWithProgress } from './ui/initProgress';
import { handleKeydown } from './ui/keyboard';
import { showNotification } from './ui/notifications';
import { PopulationGraph } from './ui/PopulationGraph';
import {
  AlertTracker,
  type AlertKind,
  countPopulation,
  type PopulationCounts,
  RoundsPerSecondTracker,
  renderStatistics,
} from './ui/statistics';
import { getCellAtPoint, TooltipManager } from './ui/TooltipManager';
import { debugLog, isDebug } from './utils/debug';

const t = (key: string, ...args: (string | number)[]) => i18n.t(key, ...args);
const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// ---------------------------------------------------------------- i18n
initializeDOMRenderer();
document.documentElement.lang = i18n.getCurrentLanguage();

const languageSelector = byId<HTMLSelectElement>('languageSelector');
languageSelector.value = i18n.getCurrentLanguage();
languageSelector.addEventListener('change', () => {
  i18n.setLanguage(languageSelector.value as Language);
});

// ---------------------------------------------------------------- core objects
const canvas = byId<HTMLCanvasElement>('gameCanvas');
const gameArea = document.querySelector<HTMLElement>('.game-area');
const board = new Board();
const renderer = new Renderer(canvas);
const game = new Game(board, renderer);
const configPanel = new ConfigPanel();
const tooltip = new TooltipManager();
const graph = new PopulationGraph(byId<HTMLCanvasElement>('populationGraph'));
const alerts = new AlertTracker();
const roundsPerSec = new RoundsPerSecondTracker();

const controls = new GameControls(game, {
  pause: byId<HTMLButtonElement>('pauseBtn'),
  step: byId<HTMLButtonElement>('stepBtn'),
  runFive: byId<HTMLButtonElement>('runFiveBtn'),
  run: byId<HTMLButtonElement>('runBtn'),
  reset: byId<HTMLButtonElement>('resetBtn'),
  finish: byId<HTMLButtonElement>('finishBtn'),
});

const speedSelect = byId<HTMLSelectElement>('speedSelect');

// ---------------------------------------------------------------- header
const roundEl = byId<HTMLElement>('round');
const roundsPerSecEl = byId<HTMLElement>('roundsPerSec');
const fpsEl = byId<HTMLElement>('fps');

function renderHeader(): void {
  roundEl.textContent = t('header.round', board.round);
  roundsPerSecEl.textContent = t('header.roundsPerSec', roundsPerSec.getRate());
}

// FPS is a developer metric: only shown with ?debug (M14).
if (isDebug()) {
  fpsEl.hidden = false;
  setInterval(() => {
    fpsEl.textContent = t('header.fps', renderer.getCurrentFps());
  }, 1000);
}

// ---------------------------------------------------------------- statistics
let lastCounts: PopulationCounts | null = null;

const ALERT_MESSAGES: Record<AlertKind, [string, string, 'error' | 'warning']> = {
  maleExtinction: ['notifications.maleExtinctionTitle', 'notifications.allMalesDied', 'error'],
  femaleExtinction: ['notifications.femaleExtinctionTitle', 'notifications.allFemalesDied', 'error'],
  boardNearlyFull: ['notifications.boardNearlyFullTitle', 'notifications.boardNearlyFull', 'warning'],
};

function renderCounts(counts: PopulationCounts): void {
  renderStatistics(counts, t);
  canvas.setAttribute('aria-label', t('a11y.board', board.width, board.height, board.round, counts.total));
}

/** Recount the board and refresh every statistic. One counting pass. */
function refreshStatistics(checkAlerts: boolean): void {
  const counts = countPopulation(board);
  lastCounts = counts;
  renderCounts(counts);
  renderHeader();
  graph.render(game.getPopulationHistory());
  if (checkAlerts) {
    for (const kind of alerts.check(counts)) {
      const [title, message, type] = ALERT_MESSAGES[kind];
      showNotification(t(title), t(message), type);
    }
  }
}

// ---------------------------------------------------------------- tooltip (L4)
let pointer: { clientX: number; clientY: number } | null = null;
let tooltipFrame: number | null = null;

function refreshTooltip(): void {
  if (!pointer) return;
  // Content box only: the canvas has a CSS border, and canvas.width is the HiDPI backing store.
  const box = canvas.getBoundingClientRect();
  const content = {
    left: box.left + canvas.clientLeft,
    top: box.top + canvas.clientTop,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  };
  const cell = getCellAtPoint(content, board.width, board.height, pointer.clientX, pointer.clientY);
  const entity = cell ? board.getEntity(cell.x, cell.y) : null;
  if (entity) tooltip.show(entity, pointer.clientX, pointer.clientY);
  else tooltip.hide();
}

canvas.addEventListener('mousemove', (event) => {
  pointer = { clientX: event.clientX, clientY: event.clientY };
  if (tooltipFrame === null) {
    tooltipFrame = requestAnimationFrame(() => {
      tooltipFrame = null;
      refreshTooltip();
    });
  }
});

canvas.addEventListener('mouseleave', () => {
  pointer = null;
  tooltip.hide();
  if (tooltipFrame !== null) {
    cancelAnimationFrame(tooltipFrame);
    tooltipFrame = null;
  }
});

// ---------------------------------------------------------------- game events (M13)
game.onRoundComplete = () => {
  if (game.running()) roundsPerSec.record(board.round);
  refreshStatistics(true);
  refreshTooltip();
};

game.onStepComplete = () => controls.handleStepComplete();

controls.onStateChange = (state) => {
  if (state !== 'running') roundsPerSec.reset();
  renderHeader();
};

// ---------------------------------------------------------------- layout (M12)
function fitCanvas(): void {
  if (!gameArea) return;
  const style = getComputedStyle(gameArea);
  const canvasBorder = canvas.offsetWidth - canvas.clientWidth; // 2px border each side
  const available =
    gameArea.clientWidth -
    Number.parseFloat(style.paddingLeft || '0') -
    Number.parseFloat(style.paddingRight || '0') -
    canvasBorder;
  if (available <= 0) return;
  renderer.fitToWidth(available, board.width, board.height);
  renderer.renderFull(board);
}

window.addEventListener('resize', debounce(fitCanvas, 150));

// ---------------------------------------------------------------- start / reset
const progressElements = {
  overlay: document.getElementById('initProgress'),
  bar: document.getElementById('progressBar'),
  text: document.getElementById('progressText'),
};

let starting = false;

async function startGame(config: GameConfig): Promise<void> {
  if (starting) return;
  starting = true;
  try {
    if (config.board.width !== board.width || config.board.height !== board.height) {
      board.resize(config.board.width, config.board.height);
      renderer.resize(config.board.width, config.board.height);
    }
    game.updateConfig(config); // Game stores a deep-frozen clone (H3)
    renderer.setInjuredThreshold(config.board.injuredThreshold);
    game.setSpeed(Number.parseInt(speedSelect.value, 10));
    fitCanvas();

    alerts.reset();
    roundsPerSec.reset();
    graph.reset();

    await runWithProgress(() => game.initializeBoard(), isLargeBoard(board.width, board.height), progressElements, t);

    refreshStatistics(true);
    controls.begin(); // auto-start after initialization (PRD 3.13.6, M7)
    // Keep keyboard focus somewhere useful now that the config dialog is gone.
    byId<HTMLButtonElement>('pauseBtn').focus({ preventScroll: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showNotification(t('notifications.startErrorTitle'), t('notifications.startError', message), 'error');
    configPanel.show();
  } finally {
    starting = false;
  }
}

function endGame(): void {
  controls.setIdle();
  game.reset(); // releases the config lock
  graph.reset();
  alerts.reset();
  pointer = null;
  tooltip.hide();
  refreshStatistics(false);
  configPanel.show();
}

configPanel.onStart((config) => {
  void startGame(config);
});

byId<HTMLButtonElement>('pauseBtn').addEventListener('click', () => controls.togglePause());
byId<HTMLButtonElement>('stepBtn').addEventListener('click', () => controls.step());
byId<HTMLButtonElement>('runFiveBtn').addEventListener('click', () => controls.stepFive());
byId<HTMLButtonElement>('runBtn').addEventListener('click', () => controls.runFree());
byId<HTMLButtonElement>('resetBtn').addEventListener('click', endGame);
byId<HTMLButtonElement>('finishBtn').addEventListener('click', endGame);

speedSelect.addEventListener('change', () => {
  const speed = Number.parseInt(speedSelect.value, 10);
  debugLog(`[UI] Speed changed to ${speed}ms`);
  game.setSpeed(speed);
});

// ---------------------------------------------------------------- rules modal
const rulesModal = byId<HTMLElement>('rulesModal');
const rulesDialog = createDialog(rulesModal, {
  closeButton: document.getElementById('closeModal'),
});
byId<HTMLButtonElement>('helpBtn').addEventListener('click', () => rulesDialog.open());

const modalTabs = Array.from(document.querySelectorAll<HTMLElement>('.modal-tab'));
for (const tab of modalTabs) {
  tab.addEventListener('click', () => {
    for (const other of modalTabs) {
      const selected = other === tab;
      other.classList.toggle('active', selected);
      other.setAttribute('aria-selected', String(selected));
      other.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(`${other.dataset.tab}-tab`);
      panel?.classList.toggle('active', selected);
    }
  });
}

// ---------------------------------------------------------------- keyboard
document.addEventListener('keydown', (e) => {
  handleKeydown(e, {
    game,
    controls,
    modal: rulesDialog,
    isBlocked: () => configPanel.isVisible(),
  });
});

// ---------------------------------------------------------------- language changes
i18n.onLanguageChange((language) => {
  document.documentElement.lang = language;
  languageSelector.value = language;
  controls.refreshLabels();
  if (lastCounts) renderCounts(lastCounts);
  renderHeader();
  graph.render(game.getPopulationHistory());
  if (isDebug()) fpsEl.textContent = t('header.fps', renderer.getCurrentFps());
});

// ---------------------------------------------------------------- initial state
fitCanvas();
refreshStatistics(false);
configPanel.show();
debugLog('Game of Life Simulator initialized', board.width, 'x', board.height);
