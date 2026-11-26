import { i18n } from '../i18n/i18n';
import { ClassicRenderer } from './ClassicRenderer';
import { LifeEngine, type LifeStatus } from './LifeEngine';
import { isPatternId, PATTERNS } from './patterns';
import { CONWAY_RULE, describeRule, findPreset, formatRule, parseRule, ruleOrConway, type Translate } from './rules';
import type { ClassicConfig, ClassicSession } from './types';
import './classic.css';

type Notice = Exclude<LifeStatus, 'active'> | 'patternTooBig' | null;

const DEFAULT_SPEED_MS = 200;

/**
 * Classic Life session: a LifeEngine stepped on a timer, drawn by a
 * ClassicRenderer on `canvas`, with a status panel in `panel`.
 * While paused the board can be edited with Pointer Events (tap toggles,
 * drag paints); `touch-action: none` is set only then so the page scrolls
 * normally during a run.
 */
export function createClassicSession(
  canvas: HTMLCanvasElement,
  panel: HTMLElement,
  t: Translate = (key, ...args) => i18n.t(key, ...args),
): ClassicSession {
  const renderer = new ClassicRenderer(canvas);
  const controller = new AbortController();
  const { signal } = controller;

  let engine: LifeEngine | null = null;
  let ruleText = formatRule(CONWAY_RULE);
  let isRunning = false;
  let over = false;
  let pendingSteps = 0;
  let speed = DEFAULT_SPEED_MS;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let notice: Notice = null;
  let avail = { w: 0, h: 0 };
  let painting: { value: boolean; x: number; y: number } | null = null;

  // ------------------------------------------------------------ panel DOM
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  };
  const title = el('h2');
  const statRow = () => {
    const row = el('div', 'stat-row');
    const label = el('span', 'stat-label');
    const value = el('span', 'stat-value');
    row.append(label, value);
    return { row, label, value };
  };
  const genRow = statRow();
  const popRow = statRow();
  const ruleRow = statRow();
  genRow.value.dataset.classic = 'generation';
  popRow.value.dataset.classic = 'population';
  ruleRow.value.dataset.classic = 'rule';
  const stats = el('div', 'stats-grid');
  stats.append(genRow.row, popRow.row, ruleRow.row);
  const explanation = el('p', 'classic-rule-text');
  const hint = el('p', 'classic-hint');
  const noticeEl = el('p', 'classic-notice');
  noticeEl.setAttribute('role', 'status');
  noticeEl.setAttribute('aria-live', 'polite');
  panel.replaceChildren(title, stats, explanation, hint, noticeEl);

  const ruleName = (): string => {
    const preset = findPreset(ruleText);
    return preset ? t(`classic.rules.${preset}`) : ruleText;
  };

  function renderLabels(): void {
    title.textContent = t('classic.panel.title');
    genRow.label.textContent = t('classic.panel.generation');
    popRow.label.textContent = t('classic.panel.population');
    ruleRow.label.textContent = t('classic.panel.rule');
    hint.textContent = t('classic.panel.drawHint');
    const parsed = parseRule(ruleText);
    explanation.textContent = parsed.ok ? describeRule(parsed.rule, t) : '';
    ruleRow.value.textContent = ruleName();
    renderStats();
  }

  function renderStats(): void {
    genRow.value.textContent = String(engine?.generation ?? 0);
    popRow.value.textContent = String(engine?.population ?? 0);
    noticeEl.textContent = notice ? t(`classic.panel.${notice}`) : '';
    noticeEl.dataset.notice = notice ?? '';
  }

  const editable = (): boolean => !!engine && !isRunning && !over && pendingSteps === 0;

  /** Drawing hint, cursor and touch-action follow whether the board can be edited. */
  function updateInteractivity(): void {
    const canEdit = editable();
    hint.hidden = !canEdit;
    canvas.style.touchAction = canEdit ? 'none' : '';
    canvas.classList.toggle('classic-editable', canEdit);
    if (!canEdit) painting = null;
  }

  const draw = (): void => {
    if (engine) renderer.draw(engine);
  };

  // ------------------------------------------------------------ stepping
  const clearTimer = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const schedule = (): void => {
    clearTimer();
    timer = setTimeout(tick, speed);
  };

  function halt(): void {
    isRunning = false;
    pendingSteps = 0;
    clearTimer();
  }

  /** One generation; returns false when the board died out (game over). */
  function advance(): boolean {
    if (!engine) return false;
    engine.step();
    const status = engine.status();
    notice = status === 'active' ? null : status;
    draw();
    renderStats();
    session.onRoundComplete?.();
    if (status !== 'extinct') return true;
    halt();
    over = true;
    updateInteractivity();
    session.onGameOver?.();
    return false;
  }

  function tick(): void {
    timer = null;
    if (!advance()) return;
    if (isRunning) {
      schedule();
    } else if (pendingSteps > 0) {
      pendingSteps--;
      if (pendingSteps > 0) {
        schedule();
      } else {
        updateInteractivity();
        session.onStepComplete?.();
      }
    }
  }

  // ------------------------------------------------------------ drawing
  function paintAt(clientX: number, clientY: number, first: boolean): void {
    if (!engine) return;
    const cell = renderer.cellAt(clientX, clientY);
    if (!cell) return;
    if (first) {
      painting = { value: engine.toggle(cell.x, cell.y), ...cell };
    } else if (painting && (painting.x !== cell.x || painting.y !== cell.y)) {
      engine.set(cell.x, cell.y, painting.value);
      painting.x = cell.x;
      painting.y = cell.y;
    } else {
      return;
    }
    notice = null; // the board changed: old "stable" / "period 2" notices no longer hold
    draw();
    renderStats();
  }

  canvas.addEventListener(
    'pointerdown',
    (e) => {
      if (!editable() || e.button > 0) return;
      e.preventDefault();
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Synthetic events (tests) have no active pointer to capture.
      }
      paintAt(e.clientX, e.clientY, true);
    },
    { signal },
  );
  canvas.addEventListener(
    'pointermove',
    (e) => {
      if (painting && editable()) paintAt(e.clientX, e.clientY, false);
    },
    { signal },
  );
  const endPaint = (): void => {
    painting = null;
  };
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    canvas.addEventListener(type, endPaint, { signal });
  }

  const languageListener = (): void => renderLabels();
  i18n.onLanguageChange(languageListener);

  // ------------------------------------------------------------ session API
  const session: ClassicSession = {
    begin(config: ClassicConfig, opts: { startPaused: boolean }): void {
      halt();
      over = false;
      notice = null;
      const { rule, text } = ruleOrConway(config.rule);
      ruleText = text;
      engine = new LifeEngine(config.width, config.height, rule);
      let canRun = config.start.kind !== 'draw';
      if (config.start.kind === 'random') {
        engine.randomFill(config.start.density);
      } else if (config.start.kind === 'pattern') {
        const { patternId } = config.start;
        const placed = isPatternId(patternId) ? engine.placePattern(PATTERNS[patternId]) : null;
        if (!placed?.ok) {
          notice = 'patternTooBig';
          canRun = false;
        }
      }
      renderer.fit(config.width, config.height, avail.w, avail.h);
      draw();
      renderLabels();
      updateInteractivity();
      if (canRun && !opts.startPaused) session.start();
    },
    end(): void {
      halt();
      engine = null;
      over = false;
      notice = null;
      renderLabels();
      updateInteractivity();
    },
    running: () => isRunning,
    start(): void {
      if (isRunning || over || !engine) return;
      isRunning = true;
      pendingSteps = 0;
      updateInteractivity();
      schedule();
    },
    pause(): void {
      if (!isRunning) return;
      isRunning = false;
      clearTimer();
      updateInteractivity();
    },
    /** Halt for good (Finish / Reset): the board stays visible but cannot advance or be edited. */
    stop(): void {
      halt();
      if (engine) over = true;
      updateInteractivity();
    },
    step(): void {
      session.stepRounds(1);
    },
    stepRounds(n: number): void {
      if (isRunning || over || !engine || pendingSteps > 0 || n <= 0) return;
      pendingSteps = n;
      updateInteractivity();
      tick();
    },
    setSpeed(ms: number): void {
      if (Number.isFinite(ms) && ms >= 0) speed = ms;
    },
    fit(availW: number, availH: number): void {
      avail = { w: availW, h: availH };
      if (!engine) return;
      renderer.fit(engine.width, engine.height, availW, availH);
      draw();
    },
    getGeneration: () => engine?.generation ?? 0,
    isOver: () => over,
    destroy(): void {
      halt();
      controller.abort();
      i18n.offLanguageChange(languageListener);
      panel.replaceChildren();
    },
  };
  renderLabels();
  updateInteractivity();
  return session;
}
