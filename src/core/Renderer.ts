import { Board } from './Board';
import { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Fruit } from '../entities/Fruit';
import { EntityType, VisualEffect } from '../types';
import { DEFAULT_CONFIG } from '../config';
import { AnimationSystem } from './AnimationSystem';

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
    const initialWidth = DEFAULT_CONFIG.board.width * cellSize;
    const initialHeight = DEFAULT_CONFIG.board.height * cellSize;
    this.canvas.width = initialWidth;
    this.canvas.height = initialHeight;
    // Explicitly set CSS dimensions to match internal resolution to prevent scaling
    this.canvas.style.width = `${initialWidth}px`;
    this.canvas.style.height = `${initialHeight}px`;
  }

  resize(width: number, height: number): void {
    const pixelWidth = width * this.cellSize;
    const pixelHeight = height * this.cellSize;
    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
    // Explicitly set CSS dimensions to match internal resolution to prevent scaling
    this.canvas.style.width = `${pixelWidth}px`;
    this.canvas.style.height = `${pixelHeight}px`;
    console.log(`[Renderer] Canvas resized to ${pixelWidth}x${pixelHeight} pixels (${width}x${height} cells)`);
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
      case EntityType.MUSHROOM:
        return '🍄';
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

  private drawCell(x: number, y: number, entity: Entity | null, visualPosition?: { x: number; y: number }): void {
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
      // Use visual position if provided (for animations), otherwise use cell position
      const drawX = visualPosition ? visualPosition.x * this.cellSize : cellX;
      const drawY = visualPosition ? visualPosition.y * this.cellSize : cellY;

      const emoji = this.getEntityEmoji(entity);
      const cachedEmoji = this.cacheEmoji(emoji, this.cellSize);
      this.ctx.drawImage(cachedEmoji, drawX, drawY);

      // Draw pregnancy indicator for pregnant females
      if (entity instanceof Human && entity.isPregnant()) {
        this.ctx.strokeStyle = '#ff69b4'; // Hot pink
        this.ctx.lineWidth = 3;
        // Use cell position for border (always aligned to grid)
        this.ctx.strokeRect(cellX + 2, cellY + 2, this.cellSize - 4, this.cellSize - 4);
        this.ctx.lineWidth = 1;
      }
      // Draw red border for injured creatures only (not fruits)
      else if ((entity instanceof Human || entity instanceof Wolf) &&
               entity.isInjured(DEFAULT_CONFIG.board.injuredThreshold)) {
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        // Use cell position for border (always aligned to grid)
        this.ctx.strokeRect(cellX + 1, cellY + 1, this.cellSize - 2, this.cellSize - 2);
        this.ctx.lineWidth = 1;
      }
    }
  }

  /**
   * Draw an entity at an arbitrary fractional position (for animations)
   * Handles clearing affected cells and drawing entity at interpolated position
   */
  private drawEntity(entity: Entity, visualX: number, visualY: number, board: Board): void {
    // Calculate which cells are affected by this entity's position
    // Entity can overlap up to 4 cells when moving diagonally
    const minCellX = Math.floor(visualX);
    const maxCellX = Math.ceil(visualX);
    const minCellY = Math.floor(visualY);
    const maxCellY = Math.ceil(visualY);

    // Clear all affected cells (background and grid)
    // Only clear cells that don't have other entities at their logical positions
    for (let cy = minCellY; cy <= maxCellY; cy++) {
      for (let cx = minCellX; cx <= maxCellX; cx++) {
        if (cx >= 0 && cx < board.width && cy >= 0 && cy < board.height) {
          const cellEntity = board.getEntity(cx, cy);
          // Clear cell if:
          // 1. Cell is empty, OR
          // 2. Cell contains this animating entity (at its destination)
          // Don't clear cells with other stationary entities
          if (!cellEntity || cellEntity === entity) {
            const cellX = cx * this.cellSize;
            const cellY = cy * this.cellSize;
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
            this.ctx.strokeStyle = '#ddd';
            this.ctx.strokeRect(cellX, cellY, this.cellSize, this.cellSize);
          }
        }
      }
    }

    // Draw entity emoji at visual position (fractional pixel coordinates)
    const pixelX = visualX * this.cellSize;
    const pixelY = visualY * this.cellSize;
    const emoji = this.getEntityEmoji(entity);
    const cachedEmoji = this.cacheEmoji(emoji, this.cellSize);
    this.ctx.drawImage(cachedEmoji, pixelX, pixelY);

    // Draw entity-specific indicators at the cell containing the visual position
    // (aligned to grid for visual clarity)
    const visualCellX = Math.floor(visualX);
    const visualCellY = Math.floor(visualY);
    const cellX = visualCellX * this.cellSize;
    const cellY = visualCellY * this.cellSize;

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
    const expiredEffects: VisualEffect[] = [];

    this.visualEffects = this.visualEffects.filter(effect => {
      const elapsed = now - effect.startTime;
      if (elapsed > effect.duration) {
        // Effect expired - will be marked dirty one more time when next render clears it
        expiredEffects.push(effect);
        return false;
      }

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

    // Mark cells with expired effects as dirty for final cleanup
    expiredEffects.forEach(effect => {
      this.markDirty(effect.x, effect.y);
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
    // Mark cells with active visual effects as dirty before rendering
    // This ensures they're redrawn each frame to prevent color accumulation
    this.visualEffects.forEach(effect => {
      this.markDirty(effect.x, effect.y);
    });

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

  /**
   * Mark all animation paths as dirty (optimized batch marking)
   * Called once at animation start to mark all affected cells
   * @param board The game board
   * @param animationSystem The animation system managing current animations
   */
  markAnimationPaths(board: Board, animationSystem: AnimationSystem): void {
    const movementPaths = animationSystem.getAllMovementPaths();
    
    // Mark all cells in all animation paths
    for (const path of movementPaths.values()) {
      // Mark cells in path (handles diagonal movement - up to 4 cells)
      const minX = Math.min(path.fromX, path.toX);
      const maxX = Math.max(path.fromX, path.toX);
      const minY = Math.min(path.fromY, path.toY);
      const maxY = Math.max(path.fromY, path.toY);

      for (let cy = minY; cy <= maxY; cy++) {
        for (let cx = minX; cx <= maxX; cx++) {
          if (cx >= 0 && cx < board.width && cy >= 0 && cy < board.height) {
            this.markDirty(cx, cy);
          }
        }
      }
    }
  }

  /**
   * Render a single animation frame during movement animations
   * Draws all animating entities at their interpolated positions
   * @param board The game board
   * @param animationSystem The animation system managing current animations
   */
  renderAnimationFrame(board: Board, animationSystem: AnimationSystem): void {
    // Mark cells with active visual effects as dirty
    this.visualEffects.forEach(effect => {
      this.markDirty(effect.x, effect.y);
    });

    // Get all animating entities
    const animatingEntities = animationSystem.getAnimatingEntities();

    // Mark animation paths as dirty (only cells that need updating)
    // This is optimized - we mark paths once, but also mark current visual position cells each frame
    for (const entity of animatingEntities) {
      const visualPos = animationSystem.getVisualPosition(entity);
      if (visualPos) {
        // Mark current visual position cell (entity might be between cells)
        const visualCellX = Math.floor(visualPos.x);
        const visualCellY = Math.floor(visualPos.y);
        if (visualCellX >= 0 && visualCellX < board.width && 
            visualCellY >= 0 && visualCellY < board.height) {
          this.markDirty(visualCellX, visualCellY);
        }
        // Also mark adjacent cells if entity is near cell boundary
        if (visualPos.x - visualCellX > 0.5 && visualCellX + 1 < board.width) {
          this.markDirty(visualCellX + 1, visualCellY);
        }
        if (visualPos.y - visualCellY > 0.5 && visualCellY + 1 < board.height) {
          this.markDirty(visualCellX, visualCellY + 1);
        }
      }
    }

    // Render dirty cells (non-animating entities at their logical positions)
    this.dirtyRects.forEach(coord => {
      const [x, y] = coord.split(',').map(Number);
      const entity = board.getEntity(x, y);
      
      // Only render if this entity is not currently animating
      if (entity && !animatingEntities.includes(entity)) {
        this.drawCell(x, y, entity);
      } else if (!entity) {
        // Empty cell - clear it (might be part of animation path)
        this.drawCell(x, y, null);
      }
    });
    this.dirtyRects.clear();

    // Draw all animating entities at their visual positions
    for (const entity of animatingEntities) {
      const visualPos = animationSystem.getVisualPosition(entity);
      if (visualPos) {
        this.drawEntity(entity, visualPos.x, visualPos.y, board);
      }
    }

    // Draw visual effects
    this.drawVisualEffects();

    // Update FPS counter
    this.updateFps();
  }
}
