import type { Entity } from '../entities/Entity';
import { Fruit } from '../entities/Fruit';
import { Human } from '../entities/Human';
import { EntityType } from '../types';

/** Snapshot of everything the statistics panel shows (PRD 3.10.1). */
export interface PopulationCounts {
  males: number;
  females: number;
  pregnant: number;
  wolves: number;
  dogs: number;
  ripeFruits: number;
  unripeFruits: number;
  mushrooms: number;
  /** Creatures only: humans + wolves + dogs (plants excluded). */
  total: number;
  /** Number of fields on the board (width × height). */
  capacity: number;
}

/** Minimal board shape needed for counting (keeps tests free of a full Board). */
export interface CountableBoard {
  readonly width: number;
  readonly height: number;
  getEntity(x: number, y: number): Entity | null;
}

export function emptyCounts(capacity = 0): PopulationCounts {
  return {
    males: 0,
    females: 0,
    pregnant: 0,
    wolves: 0,
    dogs: 0,
    ripeFruits: 0,
    unripeFruits: 0,
    mushrooms: 0,
    total: 0,
    capacity,
  };
}

/**
 * Count every population figure in a single pass over the grid, without
 * allocating an intermediate entity array.
 */
export function countPopulation(board: CountableBoard): PopulationCounts {
  const counts = emptyCounts(board.width * board.height);

  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const entity = board.getEntity(x, y);
      if (!entity) continue;

      switch (entity.type) {
        case EntityType.MALE:
          counts.males++;
          break;
        case EntityType.FEMALE:
          counts.females++;
          if (entity instanceof Human && entity.isPregnant()) counts.pregnant++;
          break;
        case EntityType.WOLF:
          counts.wolves++;
          break;
        case EntityType.DOG:
          counts.dogs++;
          break;
        case EntityType.FRUIT:
          if (entity instanceof Fruit && entity.isRipe()) counts.ripeFruits++;
          else counts.unripeFruits++;
          break;
        case EntityType.MUSHROOM:
          counts.mushrooms++;
          break;
      }
    }
  }

  counts.total = counts.males + counts.females + counts.wolves + counts.dogs;
  return counts;
}

/**
 * Real simulation throughput: completed rounds divided by wall time over a
 * sliding window. Fed from Game.onRoundComplete, so it reflects actual rounds,
 * not renderer frames.
 */
export class RoundsPerSecondTracker {
  private samples: { time: number; round: number }[] = [];

  constructor(
    private readonly now: () => number = () => performance.now(),
    private readonly windowMs = 3000,
  ) {}

  /** Forget all samples (call on pause, reset or a new game). */
  reset(): void {
    this.samples = [];
  }

  /** Record that `round` has just completed. */
  record(round: number): void {
    const time = this.now();
    this.samples.push({ time, round });
    const cutoff = time - this.windowMs;
    // Keep at least two samples so slow speeds (≥ window) still yield a rate.
    while (this.samples.length > 2 && this.samples[0].time < cutoff) {
      this.samples.shift();
    }
  }

  /** Rounds per second, rounded to one decimal. 0 when idle or stale. */
  getRate(): number {
    if (this.samples.length < 2) return 0;
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    if (this.now() - last.time > this.windowMs) return 0;
    const elapsedMs = last.time - first.time;
    if (elapsedMs <= 0) return 0;
    const rate = ((last.round - first.round) * 1000) / elapsedMs;
    return Math.round(rate * 10) / 10;
  }
}

export type AlertKind = 'maleExtinction' | 'femaleExtinction' | 'boardNearlyFull';

/**
 * Edge-triggered alerts (PRD 3.12): extinction fires once when a population that
 * existed drops to zero; the capacity warning re-arms after dropping below 90%.
 */
export class AlertTracker {
  private previousMales = 0;
  private previousFemales = 0;
  private maleAlerted = false;
  private femaleAlerted = false;
  private capacityAlerted = false;

  constructor(private readonly capacityThreshold = 0.9) {}

  reset(): void {
    this.previousMales = 0;
    this.previousFemales = 0;
    this.maleAlerted = false;
    this.femaleAlerted = false;
    this.capacityAlerted = false;
  }

  check(counts: PopulationCounts): AlertKind[] {
    const alerts: AlertKind[] = [];

    if (this.previousMales > 0 && counts.males === 0 && !this.maleAlerted) {
      alerts.push('maleExtinction');
      this.maleAlerted = true;
    }
    if (this.previousFemales > 0 && counts.females === 0 && !this.femaleAlerted) {
      alerts.push('femaleExtinction');
      this.femaleAlerted = true;
    }

    const fill = counts.capacity > 0 ? counts.total / counts.capacity : 0;
    if (fill >= this.capacityThreshold && !this.capacityAlerted) {
      alerts.push('boardNearlyFull');
      this.capacityAlerted = true;
    } else if (fill < this.capacityThreshold) {
      this.capacityAlerted = false;
    }

    this.previousMales = counts.males;
    this.previousFemales = counts.females;
    return alerts;
  }
}

function setText(root: ParentNode, id: string, text: string): void {
  const el = root.querySelector(`#${id}`);
  if (el) el.textContent = text;
}

/**
 * Write counts into the statistics panel (PRD 3.10.1): males, females with
 * pregnant count, wolves, dogs, fruits ripe/unripe, mushrooms, and
 * "Total creatures: X/fields".
 */
export function renderStatistics(
  counts: PopulationCounts,
  t: (key: string, ...args: (string | number)[]) => string,
  root: ParentNode = document,
): void {
  setText(root, 'maleCount', String(counts.males));
  setText(root, 'femaleCount', String(counts.females));
  setText(root, 'pregnantCount', String(counts.pregnant));
  setText(root, 'wolfCount', String(counts.wolves));
  setText(root, 'dogCount', String(counts.dogs));
  setText(root, 'fruitCount', String(counts.ripeFruits + counts.unripeFruits));
  setText(root, 'fruitRipeUnripe', t('stats.ripeUnripe', counts.ripeFruits, counts.unripeFruits));
  setText(root, 'mushroomCount', String(counts.mushrooms));
  setText(root, 'totalCreatures', t('stats.total', counts.total, counts.capacity));
}
