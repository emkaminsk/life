import { Entity } from '../entities/Entity';
import { DEFAULT_CONFIG } from '../config';

export class Board {
  width: number;
  height: number;
  grid: (Entity | null)[][];
  round: number;

  constructor(width: number = DEFAULT_CONFIG.board.width, height: number = DEFAULT_CONFIG.board.height) {
    this.width = width;
    this.height = height;
    this.round = 0;
    this.grid = [];

    // Initialize empty grid
    for (let y = 0; y < height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < width; x++) {
        this.grid[y][x] = null;
      }
    }
  }

  resize(newWidth: number, newHeight: number): void {
    // Clear all entities (they will be respawned)
    this.clear();

    this.width = newWidth;
    this.height = newHeight;

    // Reinitialize grid
    this.grid = [];
    for (let y = 0; y < newHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < newWidth; x++) {
        this.grid[y][x] = null;
      }
    }
  }

  clear(): void {
    // Remove all entities from the board
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = null;
      }
    }
    this.round = 0;
  }

  getEntity(x: number, y: number): Entity | null {
    if (!this.isInBounds(x, y)) return null;
    return this.grid[y][x];
  }

  setEntity(x: number, y: number, entity: Entity | null): void {
    if (!this.isInBounds(x, y)) return;
    this.grid[y][x] = entity;
    if (entity) {
      entity.x = x;
      entity.y = y;
    }
  }

  moveEntity(fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (!this.isInBounds(fromX, fromY) || !this.isInBounds(toX, toY)) return false;

    const entity = this.grid[fromY][fromX];
    if (!entity || this.grid[toY][toX] !== null) return false;

    this.grid[fromY][fromX] = null;
    this.grid[toY][toX] = entity;
    entity.x = toX;
    entity.y = toY;
    return true;
  }

  removeEntity(x: number, y: number): void {
    if (this.isInBounds(x, y)) {
      this.grid[y][x] = null;
    }
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  isEmpty(x: number, y: number): boolean {
    return this.isInBounds(x, y) && this.grid[y][x] === null;
  }

  getAllEntities(): Entity[] {
    const entities: Entity[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const entity = this.grid[y][x];
        if (entity) entities.push(entity);
      }
    }
    return entities;
  }

  getAdjacentPositions(x: number, y: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const newX = x + dx;
        const newY = y + dy;
        if (this.isInBounds(newX, newY)) {
          positions.push({ x: newX, y: newY });
        }
      }
    }
    return positions;
  }

  getEmptyAdjacentPositions(x: number, y: number): { x: number; y: number }[] {
    return this.getAdjacentPositions(x, y).filter(pos => this.isEmpty(pos.x, pos.y));
  }

  incrementRound(): void {
    this.round++;
  }

  reset(): void {
    // Clear all cells
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = null;
      }
    }
    // Reset round counter
    this.round = 0;
  }
}
