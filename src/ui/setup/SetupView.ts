import { Board } from '../../core/Board';
import {
  type BoardLayout,
  type CellPos,
  type CellRect,
  countKinds,
  createEmptyLayout,
  fillRect,
  getCell,
  isLayoutEmpty,
  PLACEABLE_KINDS,
  type PlaceableKind,
  randomFillRect,
  rectArea,
  resizeLayout,
  setCell,
} from '../../core/BoardLayout';
import { createEntity } from '../../core/entityFactory';
import { Renderer } from '../../core/Renderer';
import { i18n } from '../../i18n/i18n';
import type { GameConfig } from '../ConfigPanel';
import { reduceSetupKey, type SetupKeyAction, type SetupKeyState, selectionRect } from './setupKeyboard';
import { fitCellSize } from './setupLayout';
import './setup.css';

/** Translator signature (i18n.t). */
export type Translate = (key: string, ...args: (string | number)[]) => string;

export interface SetupOpenOptions {
  width: number;
  height: number;
  config: GameConfig;
  /** Layout to start from (e.g. the previous one); resized to width × height if needed. */
  initial?: BoardLayout;
}

/** Palette tool id: a placeable kind or the eraser. */
type ToolId = PlaceableKind | 'eraser';

/** Same emoji the game Renderer draws (fruit is placed unripe, hence 🍏). */
const TOOL_EMOJI: Record<ToolId, string> = {
  male: '👨',
  female: '👩',
  dog: '🐕',
  wolf: '🐺',
  fruit: '🍏',
  mushroom: '🍄',
  eraser: '🧽',
};

const TOOLS: readonly ToolId[] = [...PLACEABLE_KINDS, 'eraser'];
const DRAG_MIME = 'text/plain';
/** A touch/pen press must travel this far (px) before it becomes a drag-select, so a wobbly tap still places. */
const TOUCH_SLOP_PX = 8;

/** The board press in progress (one pointer at a time). */
interface Press {
  pointerId: number;
  cell: CellPos;
  clientX: number;
  clientY: number;
  slop: number;
  dragging: boolean;
}

const toolOf = (kind: PlaceableKind | null): ToolId => kind ?? 'eraser';
const kindOf = (tool: ToolId): PlaceableKind | null => (tool === 'eraser' ? null : tool);
const isToolId = (v: string): v is ToolId => (TOOLS as readonly string[]).includes(v);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/**
 * Manual board setup (F1): a full-screen editor in which students place the
 * starting creatures and plants by drag & drop, clicks or the keyboard, then
 * confirm to start the game. Renders into the given root (#setupView).
 */
export class SetupView {
  onConfirm?: (layout: BoardLayout) => void;
  onCancel?: () => void;
  /** Asks before leaving a non-empty setup; replaceable (tests, custom dialogs). */
  confirmDiscard: (message: string) => boolean = (message) => window.confirm(message);

  private readonly root: HTMLElement;
  private readonly t: Translate;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly board: Board;
  private readonly cursorBox: HTMLDivElement;
  private readonly selectionBox: HTMLDivElement;
  private readonly live: HTMLDivElement;
  private readonly warning: HTMLParagraphElement;
  private readonly total: HTMLParagraphElement;
  private readonly toolButtons = new Map<
    ToolId,
    { button: HTMLButtonElement; name: HTMLElement; count: HTMLElement }
  >();
  private readonly texts: { node: HTMLElement; key: string }[] = [];

  private active = false;
  private config: GameConfig | null = null;
  private layout: BoardLayout = createEmptyLayout(0, 0);
  private state: SetupKeyState = { cursor: { x: 0, y: 0 }, anchor: null, tool: 'male', width: 0, height: 0 };
  /** Board press in progress; null when no pointer is down. */
  private press: Press | null = null;
  private draggedTool: ToolId | null = null;

  constructor(root: HTMLElement, t: Translate = i18n.t.bind(i18n)) {
    this.root = root;
    this.t = t;
    root.classList.add('setup-view');
    root.hidden = true;
    root.replaceChildren();

    const panel = el('div', 'setup-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'setupTitle');

    const header = el('header', 'setup-header');
    const title = this.text(el('h1'), 'setup.title');
    title.id = 'setupTitle';
    header.append(title, this.text(el('p', 'setup-subtitle'), 'setup.subtitle'));

    // Board: canvas + DOM overlay for the selection and the cursor.
    const scroll = el('div', 'setup-board-scroll');
    const stage = el('div', 'setup-board');
    this.canvas = el('canvas', 'setup-canvas');
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-describedby', 'setupHelp setupLive');
    this.selectionBox = el('div', 'setup-selection');
    this.cursorBox = el('div', 'setup-cursor');
    for (const box of [this.selectionBox, this.cursorBox]) box.setAttribute('aria-hidden', 'true');
    stage.append(this.canvas, this.selectionBox, this.cursorBox);
    scroll.append(stage);

    // Palette with live counts.
    const palette = el('aside', 'setup-palette');
    const paletteTitle = this.text(el('h2'), 'setup.palette');
    paletteTitle.id = 'setupPaletteTitle';
    const list = el('div', 'setup-tools');
    list.setAttribute('role', 'group');
    list.setAttribute('aria-labelledby', 'setupPaletteTitle');
    TOOLS.forEach((tool, i) => {
      const button = el('button', 'setup-tool');
      button.type = 'button';
      button.draggable = true;
      button.dataset.tool = tool;
      const emoji = el('span', 'setup-tool-emoji');
      emoji.textContent = TOOL_EMOJI[tool];
      emoji.setAttribute('aria-hidden', 'true');
      const name = el('span', 'setup-tool-name');
      const keyBadge = el('kbd', 'setup-tool-key');
      keyBadge.textContent = tool === 'eraser' ? '0' : String(i + 1);
      keyBadge.setAttribute('aria-hidden', 'true');
      const count = el('span', 'setup-tool-count');
      button.append(keyBadge, emoji, name, count);
      button.addEventListener('click', () => this.pickTool(kindOf(tool)));
      button.addEventListener('dragstart', (e) => {
        this.draggedTool = tool;
        e.dataTransfer?.setData(DRAG_MIME, tool);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
      });
      button.addEventListener('dragend', () => {
        this.draggedTool = null;
      });
      this.toolButtons.set(tool, { button, name, count });
      list.append(button);
    });
    this.total = el('p', 'setup-total');
    this.warning = el('p', 'setup-warning');
    this.warning.setAttribute('role', 'status');
    palette.append(paletteTitle, list, this.total, this.warning);

    const body = el('div', 'setup-body');
    body.append(scroll, palette);

    const help = el('div', 'setup-help');
    help.id = 'setupHelp';
    help.append(
      this.text(el('p', 'setup-help-pointer'), 'setup.pointerHelp'),
      this.text(el('p', 'setup-help-keys'), 'setup.help'),
    );

    this.live = el('div', 'setup-live');
    this.live.id = 'setupLive';
    this.live.setAttribute('aria-live', 'polite');
    this.live.setAttribute('aria-atomic', 'true');

    const footer = el('footer', 'setup-actions');
    const clear = this.text(el('button', 'btn-warning setup-clear'), 'setup.clear') as HTMLButtonElement;
    const back = this.text(el('button', 'setup-back'), 'setup.back') as HTMLButtonElement;
    const start = this.text(el('button', 'btn-primary setup-start'), 'setup.confirm') as HTMLButtonElement;
    for (const b of [clear, back, start]) b.type = 'button';
    clear.addEventListener('click', () => this.applyLayout(createEmptyLayout(this.layout.width, this.layout.height)));
    back.addEventListener('click', () => this.cancel());
    start.addEventListener('click', () => this.confirm());
    footer.append(clear, back, start);

    panel.append(header, body, help, this.live, footer);
    root.append(panel);

    this.board = new Board(1, 1);
    this.renderer = new Renderer(this.canvas, 20);

    this.bindCanvasEvents();
    panel.addEventListener('keydown', this.handleKeydown);
    i18n.onLanguageChange(this.handleLanguageChange);
    this.relabel();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  open(opts: SetupOpenOptions): void {
    const width = Math.max(1, Math.floor(opts.width));
    const height = Math.max(1, Math.floor(opts.height));
    this.config = opts.config;
    const initial = opts.initial
      ? opts.initial.width === width && opts.initial.height === height
        ? opts.initial
        : resizeLayout(opts.initial, width, height)
      : createEmptyLayout(width, height);

    this.board.resize(width, height);
    this.layout = createEmptyLayout(width, height);
    this.renderer.resize(width, height, this.fitCell(width, height));
    this.state = { cursor: { x: 0, y: 0 }, anchor: null, tool: this.state.tool, width, height };
    this.active = true;
    this.root.hidden = false;
    this.relabel();
    this.applyLayout(initial);
    this.renderer.renderFull(this.board);
    this.canvas.focus();
  }

  close(): void {
    this.active = false;
    this.endPress();
    this.root.hidden = true;
  }

  /** Close and detach the language listener (the view cannot be reopened). */
  destroy(): void {
    this.close();
    i18n.offLanguageChange(this.handleLanguageChange);
  }

  isActive(): boolean {
    return this.active;
  }

  getLayout(): BoardLayout {
    return { ...this.layout, cells: this.layout.cells.slice() };
  }

  /** Re-apply all translated texts (called automatically on language change). */
  relabel(): void {
    for (const { node, key } of this.texts) node.textContent = this.t(key);
    TOOLS.forEach((tool, i) => {
      const entry = this.toolButtons.get(tool);
      if (!entry) return;
      const name = this.t(`setup.tool.${tool}`);
      entry.name.textContent = name;
      entry.button.title = this.t('setup.toolHint', name, tool === 'eraser' ? '0' : String(i + 1));
    });
    this.canvas.setAttribute('aria-roledescription', this.t('setup.roleDescription'));
    this.canvas.setAttribute('aria-label', this.t('setup.boardLabel', this.layout.width, this.layout.height));
    this.updateCounts();
  }

  // ---------------------------------------------------------------------------
  // Layout + preview
  // ---------------------------------------------------------------------------

  private text<T extends HTMLElement>(node: T, key: string): T {
    this.texts.push({ node, key });
    return node;
  }

  private fitCell(width: number, height: number): number {
    const viewport = { width: window.innerWidth || 1024, height: window.innerHeight || 768 };
    const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    return fitCellSize(width, height, viewport, coarse);
  }

  /** Swap in a new layout: update only the changed preview cells, counts and overlay. */
  private applyLayout(next: BoardLayout): void {
    const prev = this.layout;
    const config = this.config;
    if (config) {
      for (let i = 0; i < next.cells.length; i++) {
        const kind = next.cells[i];
        if (kind === prev.cells[i]) continue;
        const x = i % next.width;
        const y = (i - x) / next.width;
        this.board.setEntity(x, y, kind ? createEntity(kind, x, y, config) : null);
        this.renderer.markDirty(x, y);
      }
    }
    this.layout = next;
    if (this.active) this.renderer.render(this.board);
    this.updateCounts();
    this.updateOverlay();
  }

  private applyAction(action: SetupKeyAction): void {
    switch (action.type) {
      case 'fill':
        this.applyLayout(fillRect(this.layout, action.rect, action.kind));
        break;
      case 'randomFill':
        this.applyLayout(randomFillRect(this.layout, action.rect, action.kind, action.density));
        break;
      case 'confirm':
        this.confirm();
        break;
      case 'cancel':
        this.cancel();
        break;
    }
  }

  /** Palette click/tap: choose the item; with an area selected, also fill it (the touch way to fill). */
  private pickTool(kind: PlaceableKind | null): void {
    this.state = { ...this.state, tool: kind };
    if (this.state.anchor) {
      this.applyAction({ type: 'fill', rect: selectionRect(this.state), kind });
      this.announcePosition();
      return;
    }
    this.updateCounts();
    this.announce(this.t('setup.toolSelected', this.t(`setup.tool.${toolOf(kind)}`)));
  }

  private confirm(): void {
    if (!this.active) return;
    const layout = this.getLayout();
    this.close();
    this.onConfirm?.(layout);
  }

  private cancel(): void {
    if (!this.active) return;
    if (!isLayoutEmpty(this.layout) && !this.confirmDiscard(this.t('setup.confirmDiscard'))) return;
    this.close();
    this.onCancel?.();
  }

  // ---------------------------------------------------------------------------
  // View updates
  // ---------------------------------------------------------------------------

  private updateCounts(): void {
    const counts = countKinds(this.layout);
    let placed = 0;
    for (const tool of TOOLS) {
      const entry = this.toolButtons.get(tool);
      if (!entry) continue;
      entry.button.setAttribute('aria-pressed', String(toolOf(this.state.tool) === tool));
      if (tool === 'eraser') {
        entry.count.textContent = '';
        continue;
      }
      placed += counts[tool];
      entry.count.textContent = String(counts[tool]);
    }
    this.total.textContent = this.t('setup.counts', placed, this.layout.cells.length);
    const noHumans = counts.male + counts.female === 0;
    this.warning.textContent = noHumans ? this.t('setup.noHumansWarning') : '';
    this.warning.hidden = !noHumans;
  }

  private placeBox(box: HTMLElement, rect: CellRect): void {
    const cs = this.renderer.getCellSize();
    box.style.left = `${rect.x0 * cs}px`;
    box.style.top = `${rect.y0 * cs}px`;
    box.style.width = `${(rect.x1 - rect.x0 + 1) * cs}px`;
    box.style.height = `${(rect.y1 - rect.y0 + 1) * cs}px`;
  }

  private updateOverlay(): void {
    const { cursor, anchor } = this.state;
    this.placeBox(this.cursorBox, { x0: cursor.x, y0: cursor.y, x1: cursor.x, y1: cursor.y });
    this.selectionBox.hidden = anchor === null;
    if (anchor) this.placeBox(this.selectionBox, selectionRect(this.state));
  }

  private announce(message: string): void {
    this.live.textContent = message;
  }

  private announcePosition(): void {
    const { cursor } = this.state;
    const kind = getCell(this.layout, cursor.x, cursor.y);
    const content = kind ? this.t(`setup.tool.${kind}`) : this.t('setup.emptyCell');
    let message = this.t('setup.cellAnnounce', cursor.x + 1, cursor.y + 1, content);
    if (this.state.anchor) {
      const r = selectionRect(this.state);
      message += `. ${this.t('setup.selectionAnnounce', r.x1 - r.x0 + 1, r.y1 - r.y0 + 1, rectArea(r))}`;
    }
    this.announce(message);
  }

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------

  private handleLanguageChange = (): void => this.relabel();

  private handleKeydown = (e: KeyboardEvent): void => {
    if (!this.active) return;
    // Let focused buttons keep their native Enter/Space/Tab behaviour.
    const onButton = e.target instanceof HTMLButtonElement;
    if (onButton && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') && !e.ctrlKey) return;
    if (e.code === 'Tab') return;
    const result = reduceSetupKey(this.state, { code: e.code, shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey });
    if (!result.handled) return;
    e.preventDefault();
    e.stopPropagation();
    const toolChanged = result.state.tool !== this.state.tool;
    this.state = result.state;
    if (result.action) this.applyAction(result.action);
    if (!this.active) return;
    if (toolChanged) this.updateCounts();
    this.updateOverlay();
    this.announcePosition();
  };

  private cellFromEvent(e: MouseEvent): CellPos {
    const rect = this.canvas.getBoundingClientRect();
    const cs = this.renderer.getCellSize();
    const clampTo = (v: number, n: number) => Math.min(n - 1, Math.max(0, Math.floor(v / cs)));
    return {
      x: clampTo(e.clientX - rect.left, this.layout.width),
      y: clampTo(e.clientY - rect.top, this.layout.height),
    };
  }

  private bindCanvasEvents(): void {
    const c = this.canvas;
    c.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });
    c.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!this.active) return;
      const data = (e as DragEvent).dataTransfer?.getData(DRAG_MIME) ?? '';
      const tool = isToolId(data) ? data : this.draggedTool;
      this.draggedTool = null;
      if (!tool) return;
      const cell = this.cellFromEvent(e);
      this.state = { ...this.state, cursor: cell, anchor: null };
      this.applyLayout(setCell(this.layout, cell.x, cell.y, kindOf(tool)));
      this.announcePosition();
      c.focus();
    });
    // Pointer Events cover mouse, touch and pen: a tap/click places, a drag selects an area.
    c.addEventListener('pointerdown', (e) => {
      if (!this.active || this.press || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      c.focus();
      try {
        c.setPointerCapture?.(e.pointerId);
      } catch {
        // Capture is an optimisation; the window listeners below still see the events.
      }
      const cell = this.cellFromEvent(e);
      this.press = {
        pointerId: e.pointerId,
        cell,
        clientX: e.clientX,
        clientY: e.clientY,
        slop: e.pointerType === 'mouse' ? 0 : TOUCH_SLOP_PX,
        dragging: false,
      };
      this.state = { ...this.state, cursor: cell, anchor: null };
      this.updateOverlay();
      window.addEventListener('pointermove', this.handlePointerMove);
      window.addEventListener('pointerup', this.handlePointerUp);
      window.addEventListener('pointercancel', this.handlePointerCancel);
    });
  }

  private endPress(): void {
    this.press = null;
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerCancel);
  }

  private handlePointerMove = (e: PointerEvent): void => {
    const press = this.press;
    if (!press || e.pointerId !== press.pointerId) return;
    if (!press.dragging) {
      const travelled = Math.hypot(e.clientX - press.clientX, e.clientY - press.clientY);
      const cell = this.cellFromEvent(e);
      const otherCell = cell.x !== press.cell.x || cell.y !== press.cell.y;
      if (!otherCell || travelled <= press.slop) return;
      press.dragging = true;
    }
    this.state = { ...this.state, cursor: this.cellFromEvent(e), anchor: press.cell };
    this.updateOverlay();
  };

  private handlePointerUp = (e: PointerEvent): void => {
    const press = this.press;
    if (!press || e.pointerId !== press.pointerId) return;
    this.handlePointerMove(e);
    this.endPress();
    // A tap/click (no drag) places the current tool; a drag leaves a selection to fill.
    if (!press.dragging) {
      const { x, y } = press.cell;
      this.state = { ...this.state, cursor: press.cell, anchor: null };
      this.applyLayout(setCell(this.layout, x, y, this.state.tool));
    }
    this.announcePosition();
  };

  private handlePointerCancel = (e: PointerEvent): void => {
    if (!this.press || e.pointerId !== this.press.pointerId) return;
    this.endPress();
    this.state = { ...this.state, anchor: null };
    this.updateOverlay();
  };
}
