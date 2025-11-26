import { Board } from './Board';
import { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Fruit } from '../entities/Fruit';
import { EntityType, VisualEffect } from '../types';
import { DEFAULT_CONFIG } from '../config';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private emojiCache: Map<string, HTMLCanvasElement>;
  private dirtyRects: Set<string>;
  private visualEffects: VisualEffect[];
  private frameCount: number;
  private lastFpsUpdate: number;
  private currentFps: number;

  constructor(canvas: HTMLCanvasElement, cellSize: number = 20) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.cellSize = cellSize;
    this.emojiCache = new Map();
    this.dirtyRects = new Set();
    this.visualEffects = [];
    this.frameCount = 0;
    this.lastFpsUpdate = Date.now();
    this.currentFps = 0;

    // Set canvas size
    this.canvas.width = DEFAULT_CONFIG.board.width * cellSize;
    this.canvas.height = DEFAULT_CONFIG.board.height * cellSize;
  }

  private getEntityEmoji(entity: Entity): string {
    switch (entity.type) {
      case EntityType.MALE:
        return '👨';
      case EntityType.FEMALE:
        return '👩';
      case EntityType.WOLF:
        return '🐺';
      case EntityType.DOG:
        return '🐕';
      case EntityType.FRUIT:
        // Check if fruit is ripe
        if (entity instanceof Fruit) {
          return entity.isRipe() ? '🍎' : '🍏';
        }
        return '🍎';
      default:
        return '❓';
    }
  }

  private cacheEmoji(emoji: string, size: number): HTMLCanvasElement {
    const key = `${emoji}_${size}`;
    if (this.emojiCache.has(key)) {
      return this.emojiCache.get(key)!;
    }

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) throw new Error('Could not create offscreen context');

    offscreenCtx.font = `${size * 0.8}px Arial`;
    offscreenCtx.textAlign = 'center';
    offscreenCtx.textBaseline = 'middle';
    offscreenCtx.fillText(emoji, size / 2, size / 2);

    this.emojiCache.set(key, offscreenCanvas);
    return offscreenCanvas;
  }

  private drawCell(x: number, y: number, entity: Entity | null): void {
    const cellX = x * this.cellSize;
    const cellY = y * this.cellSize;

    // Clear cell
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);

    // Draw grid line
    this.ctx.strokeStyle = '#ddd';
    this.ctx.strokeRect(cellX, cellY, this.cellSize, this.cellSize);

    // Draw entity if present
    if (entity) {
      const emoji = this.getEntityEmoji(entity);
      const cachedEmoji = this.cacheEmoji(emoji, this.cellSize);
      this.ctx.drawImage(cachedEmoji, cellX, cellY);

      // Draw pregnancy indicator for pregnant females
      if (entity instanceof Human && entity.isPregnant()) {
        this.ctx.strokeStyle = '#ff69b4'; // Hot pink
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(cellX + 2, cellY + 2, this.cellSize - 4, this.cellSize - 4);
        this.ctx.lineWidth = 1;
      }
      // Draw red border for injured creatures only (not fruits)
      else if ((entity instanceof Human || entity instanceof Wolf) &&
               entity.isInjured(DEFAULT_CONFIG.board.injuredThreshold)) {
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(cellX + 1, cellY + 1, this.cellSize - 2, this.cellSize - 2);
        this.ctx.lineWidth = 1;
      }
    }
  }

  markDirty(x: number, y: number): void {
    this.dirtyRects.add(`${x},${y}`);
  }

  markAllDirty(board: Board): void {
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        this.markDirty(x, y);
      }
    }
  }

  addVisualEffect(effect: VisualEffect): void {
    this.visualEffects.push(effect);
  }

  private drawVisualEffects(): void {
    const now = Date.now();
    this.visualEffects = this.visualEffects.filter(effect => {
      const elapsed = now - effect.startTime;
      if (elapsed > effect.duration) return false;

      const alpha = 1 - (elapsed / effect.duration);
      const cellX = effect.x * this.cellSize;
      const cellY = effect.y * this.cellSize;

      let color: string;
      switch (effect.type) {
        case 'combat':
          color = `rgba(255, 0, 0, ${alpha * 0.25})`; // Reduced opacity for less overwhelming flash
          break;
        case 'reproduction':
          color = `rgba(0, 255, 0, ${alpha * 0.5})`;
          break;
        case 'eating':
          color = `rgba(255, 255, 0, ${alpha * 0.5})`;
          break;
      }

      this.ctx.fillStyle = color;
      this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);

      return true;
    });
  }

  private updateFps(): void {
    this.frameCount++;
    const now = Date.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  getCurrentFps(): number {
    return this.currentFps;
  }

  render(board: Board): void {
    // Render only dirty rectangles
    this.dirtyRects.forEach(coord => {
      const [x, y] = coord.split(',').map(Number);
      const entity = board.getEntity(x, y);
      this.drawCell(x, y, entity);
    });
    this.dirtyRects.clear();

    // Draw visual effects
    this.drawVisualEffects();

    // Update FPS counter
    this.updateFps();
  }

  renderFull(board: Board): void {
    this.markAllDirty(board);
    this.render(board);
  }
}
