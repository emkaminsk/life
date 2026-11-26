/**
 * Application wiring: connects the DOM of index.html to the game. All logic
 * lives in tested modules (controls, keyboard, statistics, ConfigPanel,
 * SetupView, SummaryDialog, TraitPanel…); this file only glues them together.
 *
 * Flows
 * - Start (random): resize → lock config → (large board ? async + progress : sync) init → auto-start.
 * - Start (manual): resize → lock config → SetupView; Confirm → init from layout → auto-start,
 *   Back → config panel (the layout is kept for next time).
 * - Game over (automatic or Finish): controls 'over' + summary dialog; "New experiment" → config.
 * - Reset: straight back to the config panel, no summary.
 *
 * createApp() returns handles for tests and a destroy() that removes every listener.
 */
import type { BoardLayout } from './core/BoardLayout';
import { Board } from './core/Board';
import { Game } from './core/Game';
import { summarize } from './core/gameSummary';
import { computeGenomeSnapshot, GenomeHistory } from './core/genomeStats';
import { Renderer } from './core/Renderer';
import type { EndReason } from './core/simulationEvents';
import { domRenderer } from './i18n/DOMRenderer';
import { i18n } from './i18n/i18n';
import type { Language } from './i18n/types';
import { renderAppVersion } from './ui/appVersion';
import { ConfigPanel, type GameConfig, type StartOptions } from './ui/ConfigPanel';
import { GameControls } from './ui/controls';
import { debounce } from './ui/debounce';
import { createDialog } from './ui/dialog';
import { isLargeBoard, runWithProgress } from './ui/initProgress';
import { handleKeydown } from './ui/keyboard';
import { showNotification } from './ui/notifications';
import { PopulationGraph } from './ui/PopulationGraph';
import { applyRulesConfigArgs } from './ui/rulesArgs';
import { SummaryDialog } from './ui/SummaryDialog';
import { SetupView } from './ui/setup/SetupView';
import {
  countPopulation,
  notifyAlerts,
  type PopulationCounts,
  PopulationAlerts,
  RoundsPerSecondTracker,
  renderStatistics,
} from './ui/statistics';
import { getCellAtPoint, TooltipManager } from './ui/TooltipManager';
import { TraitPanel } from './ui/TraitPanel';
import { debugLog, isDebug } from './utils/debug';

export interface App {
  readonly game: Game;
  readonly board: Board;
  readonly controls: GameControls;
  readonly configPanel: ConfigPanel;
  readonly setupView: SetupView;
  readonly summaryDialog: SummaryDialog;
  /** Start a game as if the config panel's Start button was pressed (resolves once it runs or the setup view is open). */
  startGame(config: GameConfig, options?: StartOptions): Promise<void>;
  /** Remove every listener and stop the game (tests / hot reload). */
  destroy(): void;
}

const t = (key: string, ...args: (string | number)[]) => i18n.t(key, ...args);

/** Arrow / Home / End navigation between the rules modal tabs (WAI-ARIA tabs pattern). */
function bindTabs(tabs: HTMLElement[], signal: AbortSignal): void {
  const select = (tab: HTMLElement, focus: boolean): void => {
    for (const other of tabs) {
      const selected = other === tab;
      other.classList.toggle('active', selected);
      other.setAttribute('aria-selected', String(selected));
      other.tabIndex = selected ? 0 : -1;
      other.ownerDocument.getElementById(`${other.dataset.tab}-tab`)?.classList.toggle('active', selected);
    }
    if (focus) tab.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab, false), { signal });
    tab.addEventListener(
      'keydown',
      (e) => {
        const last = tabs.length - 1;
        const target: Record<string, number> = {
          ArrowRight: index === last ? 0 : index + 1,
          ArrowLeft: index === 0 ? last : index - 1,
          Home: 0,
          End: last,
        };
        if (!(e.key in target)) return;
        e.preventDefault();
        select(tabs[target[e.key]], true);
      },
      { signal },
    );
  });
}

export function createApp(doc: Document = document): App {
  const byId = <T extends HTMLElement>(id: string) => doc.getElementById(id) as T;
  const listeners = new AbortController();
  const { signal } = listeners;
  const win = doc.defaultView ?? window;

  // ---------------------------------------------------------------- i18n (before the panels, which relabel on change)
  const languageSelector = byId<HTMLSelectElement>('languageSelector');
  const updateDOM = () => domRenderer.updateDOM();
  domRenderer.updateDOM();
  i18n.onLanguageChange(updateDOM);
  doc.documentElement.lang = i18n.getCurrentLanguage();
  languageSelector.value = i18n.getCurrentLanguage();
  languageSelector.addEventListener('change', () => i18n.setLanguage(languageSelector.value as Language), { signal });

  // ---------------------------------------------------------------- core objects
  const canvas = byId<HTMLCanvasElement>('gameCanvas');
  const gameArea = doc.querySelector<HTMLElement>('.game-area');
  const board = new Board();
  const renderer = new Renderer(canvas);
  const game = new Game(board, renderer);
  const configPanel = new ConfigPanel();
  const setupView = new SetupView(byId('setupView'));
  const summaryDialog = new SummaryDialog(byId('summaryModal'));
  const tooltip = new TooltipManager();
  const graph = new PopulationGraph(byId<HTMLCanvasElement>('populationGraph'));
  const genomeHistory = new GenomeHistory();
  const traitPanel = new TraitPanel(byId('traitPanel'));
  const alerts = new PopulationAlerts();
  const roundsPerSec = new RoundsPerSecondTracker();
  const versionEl = byId<HTMLElement>('appVersion');
  renderAppVersion(versionEl, t);

  const buttons = {
    pause: byId<HTMLButtonElement>('pauseBtn'),
    step: byId<HTMLButtonElement>('stepBtn'),
    runFive: byId<HTMLButtonElement>('runFiveBtn'),
    run: byId<HTMLButtonElement>('runBtn'),
    reset: byId<HTMLButtonElement>('resetBtn'),
    finish: byId<HTMLButtonElement>('finishBtn'),
  };
  const controls = new GameControls(game, buttons);
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
  let fpsTimer: ReturnType<typeof setInterval> | null = null;
  if (isDebug()) {
    fpsEl.hidden = false;
    fpsTimer = setInterval(() => {
      fpsEl.textContent = t('header.fps', renderer.getCurrentFps());
    }, 1000);
  }

  // ---------------------------------------------------------------- statistics + genome chart
  let lastCounts: PopulationCounts | null = null;

  function renderCounts(counts: PopulationCounts): void {
    renderStatistics(counts, t, doc, game.getConfig().overcrowding);
    canvas.setAttribute('aria-label', t('a11y.board', board.width, board.height, board.round, counts.total));
  }

  /** Recount the board and refresh every statistic (one counting pass). */
  function refreshStatistics(checkAlerts: boolean): void {
    const counts = countPopulation(board);
    lastCounts = counts;
    renderCounts(counts);
    renderHeader();
    graph.render(game.getPopulationHistory());
    // No extinction toasts in the round the game ends: the summary explains it.
    const kinds = alerts.check(counts);
    if (checkAlerts && !game.isOver()) notifyAlerts(kinds, t);
  }

  function recordGenome(): void {
    genomeHistory.record(computeGenomeSnapshot(board, board.round));
    traitPanel.update(genomeHistory.getSnapshots());
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

  function clearTooltip(): void {
    pointer = null;
    tooltip.hide();
    if (tooltipFrame !== null) {
      cancelAnimationFrame(tooltipFrame);
      tooltipFrame = null;
    }
  }

  canvas.addEventListener(
    'mousemove',
    (event) => {
      pointer = { clientX: event.clientX, clientY: event.clientY };
      if (tooltipFrame === null) {
        tooltipFrame = requestAnimationFrame(() => {
          tooltipFrame = null;
          refreshTooltip();
        });
      }
    },
    { signal },
  );
  canvas.addEventListener('mouseleave', clearTooltip, { signal });

  // ---------------------------------------------------------------- game events (M13)
  game.onRoundComplete = () => {
    if (game.running()) roundsPerSec.record(board.round);
    refreshStatistics(true);
    recordGenome();
    refreshTooltip();
  };

  game.onStepComplete = () => controls.handleStepComplete();

  function showSummary(reason: EndReason): void {
    summaryDialog.show(summarize(game.getHistory().getRecords(), reason));
  }

  game.onGameOver = (reason) => {
    debugLog(`[App] Game over: ${reason}`);
    controls.setOver();
    showSummary(reason);
  };

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

  win.addEventListener('resize', debounce(fitCanvas, 150), { signal });

  // ---------------------------------------------------------------- start / finish / reset
  const progressElements = {
    overlay: byId<HTMLElement>('initProgress'),
    bar: byId<HTMLElement>('progressBar'),
    text: byId<HTMLElement>('progressText'),
  };

  /** Manual layout of the last setup, offered again next time (resized if the board changed). */
  let lastLayout: BoardLayout | undefined;
  let starting = false;

  function reportStartError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    showNotification(t('notifications.startErrorTitle'), t('notifications.startError', message), 'error');
    game.reset();
    configPanel.show();
  }

  /** Everything between "config accepted" and "board populated". */
  function prepareGame(config: GameConfig): void {
    if (config.board.width !== board.width || config.board.height !== board.height) {
      board.resize(config.board.width, config.board.height);
      renderer.resize(config.board.width, config.board.height);
    }
    game.updateConfig(config); // Game stores a deep-frozen clone (H3)
    game.setSpeed(Number.parseInt(speedSelect.value, 10));
    fitCanvas();
    applyRulesConfigArgs(doc, config);
    domRenderer.updateDOM();

    alerts.reset();
    roundsPerSec.reset();
    graph.reset();
    genomeHistory.reset();
    traitPanel.reset();
    clearTooltip();
  }

  /** The board is populated: show round 0 and auto-start (PRD 3.13.6, M7). */
  function beginGame(): void {
    refreshStatistics(true);
    recordGenome();
    controls.begin();
    // Keep keyboard focus somewhere useful now that the config dialog is gone.
    buttons.pause.focus({ preventScroll: true });
  }

  async function startGame(config: GameConfig, options: StartOptions = { setupMode: 'random' }): Promise<void> {
    if (starting) return;
    starting = true;
    try {
      configPanel.hide(); // already hidden when started from its Start button
      prepareGame(config);
      if (options.setupMode === 'manual') {
        setupView.open({ width: board.width, height: board.height, config, initial: lastLayout });
        return;
      }
      let completed = true;
      await runWithProgress(
        async (report) => {
          completed = await game.initializeBoardAsync(config, { onProgress: report });
        },
        isLargeBoard(board.width, board.height),
        progressElements,
        t,
      );
      if (completed) beginGame(); // false: aborted by a reset meanwhile
    } catch (error) {
      reportStartError(error);
    } finally {
      starting = false;
    }
  }

  setupView.onConfirm = (layout) => {
    lastLayout = layout;
    try {
      game.initializeFromLayout(layout);
      beginGame();
    } catch (error) {
      reportStartError(error);
    }
  };

  setupView.onCancel = () => {
    lastLayout = setupView.getLayout();
    configPanel.show(); // the config is not locked yet: that happens when the board is populated
  };

  /** Back to the config panel (Reset, or "New experiment" in the summary). */
  function endGame(): void {
    controls.setIdle();
    game.reset(); // releases the config lock
    graph.reset();
    alerts.reset();
    genomeHistory.reset();
    traitPanel.reset();
    clearTooltip();
    refreshStatistics(false);
    configPanel.show();
  }

  /** Finish: halt and show the summary (again, when the game had already ended). */
  function finishGame(): void {
    if (controls.getState() === 'idle') return;
    const reason = game.getEndReason();
    if (reason) showSummary(reason);
    else game.finish(); // fires onGameOver → controls 'over' + summary
  }

  summaryDialog.onNewGame = endGame;

  configPanel.onStart((config, options) => {
    void startGame(config, options);
  });

  buttons.pause.addEventListener('click', () => controls.togglePause(), { signal });
  buttons.step.addEventListener('click', () => controls.step(), { signal });
  buttons.runFive.addEventListener('click', () => controls.stepFive(), { signal });
  buttons.run.addEventListener('click', () => controls.runFree(), { signal });
  buttons.reset.addEventListener('click', endGame, { signal });
  buttons.finish.addEventListener('click', finishGame, { signal });

  speedSelect.addEventListener(
    'change',
    () => {
      const speed = Number.parseInt(speedSelect.value, 10);
      debugLog(`[UI] Speed changed to ${speed}ms`);
      game.setSpeed(speed);
    },
    { signal },
  );

  // ---------------------------------------------------------------- rules modal
  const rulesDialog = createDialog(byId('rulesModal'), { closeButton: byId('closeModal') });
  byId<HTMLButtonElement>('helpBtn').addEventListener('click', () => rulesDialog.open(), { signal });
  bindTabs(Array.from(doc.querySelectorAll<HTMLElement>('.modal-tab')), signal);

  // ---------------------------------------------------------------- keyboard
  doc.addEventListener(
    'keydown',
    (e) => {
      handleKeydown(e, {
        game,
        controls,
        modal: rulesDialog,
        isBlocked: () => configPanel.isVisible() || setupView.isActive() || summaryDialog.isOpen(),
      });
    },
    { signal },
  );

  // ---------------------------------------------------------------- language changes
  const onLanguage = (language: Language): void => {
    doc.documentElement.lang = language;
    languageSelector.value = language;
    controls.refreshLabels();
    if (lastCounts) renderCounts(lastCounts);
    renderHeader();
    graph.render(game.getPopulationHistory());
    renderAppVersion(versionEl, t);
    if (isDebug()) fpsEl.textContent = t('header.fps', renderer.getCurrentFps());
  };
  i18n.onLanguageChange(onLanguage);

  // ---------------------------------------------------------------- initial state
  fitCanvas();
  refreshStatistics(false);
  configPanel.show();
  debugLog('Game of Life Simulator initialized', board.width, 'x', board.height);

  return {
    game,
    board,
    controls,
    configPanel,
    setupView,
    summaryDialog,
    startGame,
    destroy(): void {
      game.stop();
      listeners.abort();
      if (fpsTimer !== null) clearInterval(fpsTimer);
      clearTooltip();
      i18n.offLanguageChange(updateDOM);
      i18n.offLanguageChange(onLanguage);
      configPanel.destroy();
      setupView.destroy();
      summaryDialog.destroy();
      traitPanel.destroy();
    },
  };
}
