import type { Board } from './Board';
import type { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import { Fruit } from '../entities/Fruit';
import { EntityType, type VisualEffect } from '../types';
import { DEFAULT_CONFIG } from '../config';
import type { AnimationSystem, MovementPath } from './AnimationSystem';
import { debugLog } from '../utils/debug';

/** Cell background and grid line colours. */
const BACKGROUND_COLOR = '#f0f0f0';
const GRID_COLOR = '#ddd';

/** Emoji-capable font stack (plain Arial renders emoji small / clipped on some platforms). */
const EMOJI_FONT_STACK = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

/** Glyph size relative to the cached sprite box. */
const EMOJI_SCALE = 0.82;

const BROKEN_HEART = '💔';

/** Cell size limits used by fitToWidth (CSS px). */
export const MIN_CELL_SIZE = 6;
export const MAX_CELL_SIZE = 28;

/** Flash colour (set once, faded via globalAlpha) and peak opacity per effect type. */
const EFFECT_STYLE: Record<VisualEffect['type'], { color: string; maxAlpha: number }> = {
  combat: { color: 'rgb(255, 0, 0)', maxAlpha: 0.45 }, // red: combat damage / poison
  reproduction: { color: 'rgb(0, 255, 0)', maxAlpha: 0.5 }, // green: reproduction / birth
  eating: { color: 'rgb(255, 255, 0)', maxAlpha: 0.55 }, // yellow: fruit eaten
};

/** If an external animation frame was rendered this recently, the effect loop does not draw. */
const EXTERNAL_FRAME_GRACE_MS = 100;

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function deviceRatio(): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  return Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
}

/**
 * Canvas renderer with:
 * - HiDPI backing store drawn in whole device pixels: each cell is exactly
 *   cellPx = floor(cellSize × devicePixelRatio) device px, so every redraw fully
 *   replaces the old pixels (no antialiased residue on cell edges at dpr 1.25 / 1.5)
 * - dirty-cell rendering backed by typed arrays (key = y * width + x)
 * - ghost-free movement animation frames
 * - one fading flash per cell, kept alive by its own rAF loop while paused
 *
 * The canvas CSS size is always boardWidth × getCellSize() by boardHeight × getCellSize()
 * (excluding any CSS border), so CSS px / getCellSize() gives the cell coordinate.
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  /** Requested cell size in CSS px. */
  private cellSize: number;
  private dpr: number;
  /** Cell size in device px (whole number); all board drawing uses device px. */
  private cellPx = 1;
  private gridWidth = 0;
  private gridHeight = 0;

  /** Sprite cache (cellPx × cellPx device px), keyed by emoji. */
  private emojiCache: Map<string, HTMLCanvasElement>;
  private heartIcon: HTMLCanvasElement | null = null;
  private heartIconSize = 0;
  private cellBackground: HTMLCanvasElement | null = null;

  // Dirty cell set: flag per cell + compact index list.
  private dirtyFlags: Uint8Array = new Uint8Array(0);
  private dirtyList: Int32Array = new Int32Array(0);
  private dirtyCount = 0;

  // Cells covered by moving sprites in the last animation frame (redrawn next frame).
  private touchedFlags: Uint8Array = new Uint8Array(0);
  private touchedList: Int32Array = new Int32Array(0);
  private touchedCount = 0;

  /** Active visual effects, at most one per cell (newest wins). */
  private visualEffects: Map<number, VisualEffect>;

  private injuredThreshold: number;

  // Effect loop
  private lastBoard: Board | null = null;
  private effectLoopId: number | null = null;
  private lastAnimationSystem: AnimationSystem | null = null;
  private lastExternalFrameAt = Number.NEGATIVE_INFINITY;
  private lastAnimationGeneration = -1;

  // FPS measurement (frames actually rendered)
  private fpsWindowStart: number;
  private fpsFrames = 0;
  private lastFrameAt = Number.NEGATIVE_INFINITY;
  private currentFps = 0;

  constructor(canvas: HTMLCanvasElement, cellSize: number = 20) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.cellSize = cellSize;
    this.dpr = deviceRatio();
    this.emojiCache = new Map();
    this.visualEffects = new Map();
    this.injuredThreshold = DEFAULT_CONFIG.board.injuredThreshold;
    this.fpsWindowStart = now();

    this.resize(DEFAULT_CONFIG.board.width, DEFAULT_CONFIG.board.height);
  }

  // ---------------------------------------------------------------------------
  // Sizing
  // ---------------------------------------------------------------------------

  /**
   * Resize the canvas for a board of width × height cells. Clears the dirty set,
   * effects and caches, and marks every cell dirty (the canvas was cleared).
   */
  resize(width: number, height: number, cellSize?: number): void {
    if (cellSize !== undefined && Number.isFinite(cellSize) && cellSize > 0) {
      this.cellSize = cellSize;
    }
    this.gridWidth = Math.max(0, Math.floor(width));
    this.gridHeight = Math.max(0, Math.floor(height));
    this.applyCanvasSize();

    const cells = this.gridWidth * this.gridHeight;
    this.dirtyFlags = new Uint8Array(cells);
    this.dirtyList = new Int32Array(cells);
    this.dirtyCount = 0;
    this.touchedFlags = new Uint8Array(cells);
    this.touchedList = new Int32Array(cells);
    this.touchedCount = 0;
    this.visualEffects.clear();
    this.markAllCells();

    debugLog(
      `[Renderer] Canvas resized to ${this.canvas.width}x${this.canvas.height} device px ` +
        `(${this.gridWidth}x${this.gridHeight} cells, cell ${this.cellPx} device px = ${this.getCellSize()} CSS px, dpr ${this.dpr})`,
    );
  }

  /**
   * Pick a cell size so the board fits the available CSS width:
   * clamp(floor(available / boardWidth), 6, 28). Resizes and returns the cell size.
   */
  fitToWidth(availableCssWidth: number, boardWidth: number, boardHeight: number): number {
    const raw = boardWidth > 0 ? Math.floor(availableCssWidth / boardWidth) : MIN_CELL_SIZE;
    const size = Number.isFinite(raw) ? Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, raw)) : MIN_CELL_SIZE;
    this.resize(boardWidth, boardHeight, size);
    return size;
  }

  /** Effective cell size in CSS px (cellPx / dpr; may be fractional at dpr 1.25 etc.). */
  getCellSize(): number {
    return this.cellPx / this.dpr;
  }

  /** Injured indicator threshold, as a percentage of the creature's max health. */
  setInjuredThreshold(percent: number): void {
    if (Number.isFinite(percent)) this.injuredThreshold = percent;
  }

  private applyCanvasSize(): void {
    this.dpr = deviceRatio();
    // Floor (not round) so the board never exceeds the CSS area it was fitted to; ε absorbs FP error.
    this.cellPx = Math.max(1, Math.floor(this.cellSize * this.dpr + 1e-6));
    this.canvas.width = this.gridWidth * this.cellPx;
    this.canvas.height = this.gridHeight * this.cellPx;
    this.canvas.style.width = `${this.canvas.width / this.dpr}px`;
    this.canvas.style.height = `${this.canvas.height / this.dpr}px`;
    // Draw in device px (identity transform); setting width/height resets the context state.
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    this.emojiCache.clear();
    this.heartIcon = null;
    this.heartIconSize = this.computeHeartIconSize();
    this.cellBackground = null;
  }

  /** Board / DPR changed behind our back: resize and redraw everything. */
  private syncWithBoard(board: Board): void {
    if (board.width !== this.gridWidth || board.height !== this.gridHeight) {
      this.resize(board.width, board.height);
    } else if (deviceRatio() !== this.dpr) {
      this.applyCanvasSize();
      this.markAllCells();
    }
  }

  // ---------------------------------------------------------------------------
  // Caches
  // ---------------------------------------------------------------------------

  private getEntityEmoji(entity: Entity): string {
    switch (entity.type) {
      case EntityType.MALE:
        return '👨';
      case EntityType.FEMALE:
        return entity instanceof Human && entity.isPregnant() ? '🤰' : '👩';
      case EntityType.WOLF:
        return '🐺';
      case EntityType.DOG:
        return '🐕';
      case EntityType.FRUIT:
        if (entity instanceof Fruit) return entity.isRipe() ? '🍎' : '🍏';
        return '🍎';
      case EntityType.MUSHROOM:
        return '🍄';
      default:
        return '❓';
    }
  }

  /** Render an emoji once into an offscreen canvas of px × px device pixels. */
  private createEmojiSprite(emoji: string, px: number): HTMLCanvasElement {
    const sprite = document.createElement('canvas');
    sprite.width = px;
    sprite.height = px;
    sprite.dataset.emoji = emoji;
    const c = sprite.getContext('2d');
    if (!c) throw new Error('Could not create offscreen context');

    c.font = `${Math.floor(px * EMOJI_SCALE)}px ${EMOJI_FONT_STACK}`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const m = c.measureText(emoji);
    const left = m.actualBoundingBoxLeft || 0;
    const right = m.actualBoundingBoxRight || 0;
    const ascent = m.actualBoundingBoxAscent || 0;
    const descent = m.actualBoundingBoxDescent || 0;

    // Centre the actual glyph bounding box (avoids bottom clipping of emoji).
    const glyphWidth = left + right > 0 ? left + right : m.width || px * EMOJI_SCALE;
    const glyphHeight = ascent + descent > 0 ? ascent + descent : px * EMOJI_SCALE;
    const x = (px - glyphWidth) / 2 + (left + right > 0 ? left : 0);
    const y = (px - glyphHeight) / 2 + (ascent + descent > 0 ? ascent : glyphHeight * 0.8);
    c.fillText(emoji, x, y);
    return sprite;
  }

  private getSprite(emoji: string): HTMLCanvasElement {
    let sprite = this.emojiCache.get(emoji);
    if (!sprite) {
      sprite = this.createEmojiSprite(emoji, this.cellPx);
      this.emojiCache.set(emoji, sprite);
    }
    return sprite;
  }

  /** Device px: ≈48% of the cell, at least 9 CSS px, but never more than 3/4 of the cell. */
  private computeHeartIconSize(): number {
    const p = this.cellPx;
    return Math.max(1, Math.round(Math.min(p * 0.75, Math.max(9 * this.dpr, p * 0.48))));
  }

  private getHeartIcon(): HTMLCanvasElement {
    if (!this.heartIcon) this.heartIcon = this.createEmojiSprite(BROKEN_HEART, this.heartIconSize);
    return this.heartIcon;
  }

  /** One cell of background + crisp 1-device-pixel grid line (top and left edges). */
  private getCellBackground(): HTMLCanvasElement {
    if (this.cellBackground) return this.cellBackground;
    const px = this.cellPx;
    const tile = document.createElement('canvas');
    tile.width = px;
    tile.height = px;
    tile.dataset.role = 'cell-bg';
    const c = tile.getContext('2d');
    if (!c) throw new Error('Could not create offscreen context');
    const line = Math.max(1, Math.round(this.dpr));
    c.fillStyle = BACKGROUND_COLOR;
    c.fillRect(0, 0, px, px);
    c.fillStyle = GRID_COLOR;
    c.fillRect(0, 0, px, line);
    c.fillRect(0, 0, line, px);
    this.cellBackground = tile;
    return tile;
  }

  // ---------------------------------------------------------------------------
  // Drawing primitives
  // ---------------------------------------------------------------------------

  /** Creatures (not plants) below the injured % of their max health. */
  private isInjured(entity: Entity): boolean {
    if (!(entity instanceof Human || entity instanceof Wolf || entity instanceof Dog)) return false;
    const maxHealth = entity.maxHealth;
    if (!(maxHealth > 0)) return false;
    return (entity.health / maxHealth) * 100 < this.injuredThreshold;
  }

  private drawBackground(x: number, y: number): void {
    const s = this.cellPx;
    this.ctx.drawImage(this.getCellBackground(), x * s, y * s, s, s);
  }

  /** Draw an entity sprite (+ injured icon) with its top-left at device px (px, py). */
  private drawSprite(entity: Entity, px: number, py: number): void {
    const s = this.cellPx;
    this.ctx.drawImage(this.getSprite(this.getEntityEmoji(entity)), px, py, s, s);
    if (this.isInjured(entity)) {
      const icon = this.heartIconSize;
      this.ctx.drawImage(this.getHeartIcon(), px + s - icon, py, icon, icon);
    }
  }

  private drawCell(x: number, y: number, entity: Entity | null): void {
    this.drawBackground(x, y);
    if (entity) this.drawSprite(entity, x * this.cellPx, y * this.cellPx);
  }

  // ---------------------------------------------------------------------------
  // Dirty set
  // ---------------------------------------------------------------------------

  markDirty(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= this.gridWidth || y >= this.gridHeight) return;
    const idx = y * this.gridWidth + x;
    if (this.dirtyFlags[idx] === 0) {
      this.dirtyFlags[idx] = 1;
      this.dirtyList[this.dirtyCount++] = idx;
    }
  }

  markAllDirty(board: Board): void {
    if (board.width !== this.gridWidth || board.height !== this.gridHeight) {
      this.resize(board.width, board.height); // marks everything
      return;
    }
    this.markAllCells();
  }

  private markAllCells(): void {
    const cells = this.gridWidth * this.gridHeight;
    this.dirtyFlags.fill(1);
    for (let i = 0; i < cells; i++) this.dirtyList[i] = i;
    this.dirtyCount = cells;
  }

  /** Mark a cell dirty and remember it as covered by a moving sprite this frame. */
  private touch(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= this.gridWidth || y >= this.gridHeight) return;
    this.markDirty(x, y);
    const idx = y * this.gridWidth + x;
    if (this.touchedFlags[idx] === 0) {
      this.touchedFlags[idx] = 1;
      this.touchedList[this.touchedCount++] = idx;
    }
  }

  /** Cells covered by moving sprites last frame must be redrawn this frame. */
  private flushTouched(): void {
    for (let i = 0; i < this.touchedCount; i++) {
      const idx = this.touchedList[i];
      this.touchedFlags[idx] = 0;
      if (this.dirtyFlags[idx] === 0) {
        this.dirtyFlags[idx] = 1;
        this.dirtyList[this.dirtyCount++] = idx;
      }
    }
    this.touchedCount = 0;
  }

  private touchRect(minX: number, minY: number, maxX: number, maxY: number): void {
    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) this.touch(cx, cy);
    }
  }

  // ---------------------------------------------------------------------------
  // Visual effects
  // ---------------------------------------------------------------------------

  /** Add a flash. A newer flash on the same cell replaces the older one. */
  addVisualEffect(effect: VisualEffect): void {
    const { x, y } = effect;
    if (x < 0 || y < 0 || x >= this.gridWidth || y >= this.gridHeight) return;
    this.visualEffects.set(y * this.gridWidth + x, effect);
    this.markDirty(x, y);
    this.ensureEffectLoop();
  }

  /** Remove all flashes (cells are redrawn clean on the next render). */
  clearVisualEffects(): void {
    for (const idx of this.visualEffects.keys()) {
      this.markDirty(idx % this.gridWidth, Math.floor(idx / this.gridWidth));
    }
    this.visualEffects.clear();
  }

  getActiveEffectCount(): number {
    return this.visualEffects.size;
  }

  /** Mark cells of all effects dirty; drop expired ones (their cell is redrawn clean). */
  private prepareEffects(time: number): void {
    for (const [idx, effect] of this.visualEffects) {
      if (time - effect.startTime >= effect.duration) this.visualEffects.delete(idx);
      const x = idx % this.gridWidth;
      this.markDirty(x, (idx - x) / this.gridWidth);
    }
  }

  private drawVisualEffects(time: number): void {
    if (this.visualEffects.size === 0) return;
    const ctx = this.ctx;
    const s = this.cellPx;
    let lastColor = '';
    for (const effect of this.visualEffects.values()) {
      const elapsed = Math.max(0, time - effect.startTime);
      const style = EFFECT_STYLE[effect.type] ?? EFFECT_STYLE.combat;
      if (style.color !== lastColor) {
        ctx.fillStyle = style.color;
        lastColor = style.color;
      }
      ctx.globalAlpha = style.maxAlpha * (1 - elapsed / effect.duration);
      ctx.fillRect(effect.x * s, effect.y * s, s, s);
    }
    ctx.globalAlpha = 1;
  }

  /** Start the self-driven effect loop if effects are active and none is scheduled. */
  private ensureEffectLoop(): void {
    if (this.effectLoopId !== null || this.visualEffects.size === 0) return;
    if (typeof requestAnimationFrame !== 'function') return;
    this.effectLoopId = requestAnimationFrame(this.effectTick);
  }

  private effectTick = (): void => {
    this.effectLoopId = null;
    if (this.visualEffects.size === 0) return;
    const animationDriven =
      this.lastAnimationSystem?.isAnimating() === true && now() - this.lastExternalFrameAt < EXTERNAL_FRAME_GRACE_MS;
    if (!animationDriven && this.lastBoard) {
      this.render(this.lastBoard); // reschedules itself while effects remain
      return;
    }
    this.ensureEffectLoop();
  };

  /** True while the internal effect loop has a frame scheduled. */
  isEffectLoopRunning(): boolean {
    return this.effectLoopId !== null;
  }

  // ---------------------------------------------------------------------------
  // FPS
  // ---------------------------------------------------------------------------

  private countFrame(): void {
    const t = now();
    this.lastFrameAt = t;
    this.fpsFrames++;
    const elapsed = t - this.fpsWindowStart;
    if (elapsed >= 1000) {
      this.currentFps = Math.round((this.fpsFrames * 1000) / elapsed);
      this.fpsFrames = 0;
      this.fpsWindowStart = t;
    }
  }

  /** Frames actually rendered per second over the last ~1 s window (0 when idle). */
  getCurrentFps(): number {
    const t = now();
    if (t - this.lastFrameAt > 1000) {
      this.fpsFrames = 0;
      this.fpsWindowStart = t;
      return 0;
    }
    return this.currentFps;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  /** Redraw dirty cells (entities at their logical positions) and effects. */
  render(board: Board): void {
    this.syncWithBoard(board);
    this.lastBoard = board;
    this.flushTouched();
    const time = Date.now();
    this.prepareEffects(time);

    const w = this.gridWidth;
    for (let i = 0; i < this.dirtyCount; i++) {
      const idx = this.dirtyList[i];
      this.dirtyFlags[idx] = 0;
      const x = idx % w;
      const y = (idx - x) / w;
      this.drawCell(x, y, board.getEntity(x, y));
    }
    this.dirtyCount = 0;

    this.drawVisualEffects(time);
    this.countFrame();
    this.ensureEffectLoop();
  }

  renderFull(board: Board): void {
    this.markAllDirty(board);
    this.render(board);
  }

  /**
   * Mark all cells on all animation paths dirty (called once at animation start).
   * The cells are also remembered so the next frame redraws them.
   */
  markAnimationPaths(board: Board, animationSystem: AnimationSystem): void {
    this.syncWithBoard(board);
    this.lastAnimationGeneration = animationSystem.getGeneration();
    animationSystem.getAllMovementPaths().forEach(this.touchPath);
  }

  private touchPath = (path: MovementPath): void => {
    this.touchRect(
      Math.min(path.fromX, path.toX),
      Math.min(path.fromY, path.toY),
      Math.max(path.fromX, path.toX),
      Math.max(path.fromY, path.toY),
    );
  };

  private touchVisual = (_path: MovementPath, entity: Entity): void => {
    const vx = entity.visualX;
    const vy = entity.visualY;
    this.touchRect(Math.floor(vx), Math.floor(vy), Math.ceil(vx), Math.ceil(vy));
  };

  private drawMover = (_path: MovementPath, entity: Entity): void => {
    // Snap to device pixels so moving sprites stay sharp.
    const p = this.cellPx;
    this.drawSprite(entity, Math.round(entity.visualX * p), Math.round(entity.visualY * p));
  };

  /**
   * Render one movement animation frame. Cells covered by each moving sprite in
   * the previous and the current frame are redrawn (background + stationary
   * entity), then moving sprites are drawn on top at their visual positions.
   */
  renderAnimationFrame(board: Board, animationSystem: AnimationSystem): void {
    this.syncWithBoard(board);
    this.lastBoard = board;
    this.lastAnimationSystem = animationSystem;
    this.lastExternalFrameAt = now();

    // Previous frame's sprite cells.
    this.flushTouched();

    const paths = animationSystem.getAllMovementPaths();
    if (animationSystem.getGeneration() !== this.lastAnimationGeneration) {
      // New batch not announced via markAnimationPaths: cover start cells too.
      this.lastAnimationGeneration = animationSystem.getGeneration();
      paths.forEach(this.touchPath);
    }
    // Current frame's sprite cells.
    paths.forEach(this.touchVisual);

    const time = Date.now();
    this.prepareEffects(time);

    const w = this.gridWidth;
    for (let i = 0; i < this.dirtyCount; i++) {
      const idx = this.dirtyList[i];
      this.dirtyFlags[idx] = 0;
      const x = idx % w;
      const y = (idx - x) / w;
      const entity = board.getEntity(x, y);
      if (entity && !animationSystem.isAnimatingEntity(entity)) {
        this.drawCell(x, y, entity);
      } else {
        this.drawBackground(x, y); // empty, or a mover drawn below at its visual position
      }
    }
    this.dirtyCount = 0;

    paths.forEach(this.drawMover);

    this.drawVisualEffects(time);
    this.countFrame();
    this.ensureEffectLoop();
  }
}
