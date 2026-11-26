import type { Entity } from '../entities/Entity';
import { Fruit } from '../entities/Fruit';
import { Human } from '../entities/Human';
import { EntityType } from '../types';
import { type NotificationType, showNotification } from './notifications';
import './statistics.css';

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

export type PopulationAlertKind =
  | 'maleExtinction'
  | 'maleExtinctionUnlessBoy'
  | 'femaleExtinction'
  | 'wolfExtinction'
  | 'dogExtinction'
  | 'boardNearlyFull';

/** i18n title / message keys and severity for every alert. */
export const ALERT_MESSAGES: Record<PopulationAlertKind, { title: string; message: string; type: NotificationType }> = {
  maleExtinction: { title: 'notifications.maleExtinctionTitle', message: 'notifications.allMalesDied', type: 'error' },
  maleExtinctionUnlessBoy: {
    title: 'notifications.maleExtinctionTitle',
    message: 'summary.alerts.allMalesDiedUnlessBoy',
    type: 'warning',
  },
  femaleExtinction: {
    title: 'notifications.femaleExtinctionTitle',
    message: 'notifications.allFemalesDied',
    type: 'error',
  },
  wolfExtinction: { title: 'summary.alerts.wolvesExtinctTitle', message: 'summary.alerts.wolvesExtinct', type: 'info' },
  dogExtinction: { title: 'summary.alerts.dogsExtinctTitle', message: 'summary.alerts.dogsExtinct', type: 'info' },
  boardNearlyFull: {
    title: 'notifications.boardNearlyFullTitle',
    message: 'notifications.boardNearlyFull',
    type: 'warning',
  },
};

/** Show a notification for each alert kind (in the order given). */
export function notifyAlerts(
  kinds: readonly PopulationAlertKind[],
  t: (key: string) => string,
  notify: (title: string, message: string, type: NotificationType) => unknown = showNotification,
): void {
  for (const kind of kinds) {
    const { title, message, type } = ALERT_MESSAGES[kind];
    notify(t(title), t(message), type);
  }
}

/**
 * Fires once when a population that existed drops to 0 and re-arms as soon as
 * it is back above 0 (e.g. a baby boy after the last male died, R7).
 */
class ExtinctionEdge {
  private previous = 0;
  private alerted = false;

  reset(): void {
    this.previous = 0;
    this.alerted = false;
  }

  /** true exactly when this update is a new extinction. */
  update(count: number): boolean {
    const fired = this.previous > 0 && count === 0 && !this.alerted;
    if (fired) this.alerted = true;
    if (count > 0) this.alerted = false;
    this.previous = count;
    return fired;
  }
}

/**
 * Edge-triggered alerts (PRD 3.12): an extinction fires once when a population
 * that existed drops to zero and re-arms when it comes back; the capacity
 * warning re-arms after dropping below 90%.
 *
 * Male extinction while a female is still pregnant is not final (she may have
 * a boy), so it raises 'maleExtinctionUnlessBoy'; if the last pregnancy then
 * ends without bringing a male back, the final 'maleExtinction' follows.
 */
export class PopulationAlerts {
  private readonly males = new ExtinctionEdge();
  private readonly females = new ExtinctionEdge();
  private readonly wolves = new ExtinctionEdge();
  private readonly dogs = new ExtinctionEdge();
  /** Male extinction was announced only provisionally (pregnancies pending). */
  private malesProvisional = false;
  private capacityAlerted = false;

  constructor(private readonly capacityThreshold = 0.9) {}

  reset(): void {
    this.males.reset();
    this.females.reset();
    this.wolves.reset();
    this.dogs.reset();
    this.malesProvisional = false;
    this.capacityAlerted = false;
  }

  check(counts: PopulationCounts): PopulationAlertKind[] {
    const alerts: PopulationAlertKind[] = [];

    if (this.males.update(counts.males)) {
      this.malesProvisional = counts.pregnant > 0;
      alerts.push(this.malesProvisional ? 'maleExtinctionUnlessBoy' : 'maleExtinction');
    } else if (counts.males > 0) {
      this.malesProvisional = false;
    } else if (this.malesProvisional && counts.pregnant === 0) {
      this.malesProvisional = false;
      alerts.push('maleExtinction');
    }
    if (this.females.update(counts.females)) alerts.push('femaleExtinction');
    if (this.wolves.update(counts.wolves)) alerts.push('wolfExtinction');
    if (this.dogs.update(counts.dogs)) alerts.push('dogExtinction');

    const fill = counts.capacity > 0 ? counts.total / counts.capacity : 0;
    if (fill >= this.capacityThreshold && !this.capacityAlerted) {
      alerts.push('boardNearlyFull');
      this.capacityAlerted = true;
    } else if (fill < this.capacityThreshold) {
      this.capacityAlerted = false;
    }

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
  overcrowding?: OvercrowdingLimits,
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
  if (overcrowding) renderOvercrowding(counts, overcrowding, t, root);
}

/** The overcrowding part of GameConfig (structurally GameConfig['overcrowding']). */
export interface OvercrowdingLimits {
  humanThreshold: number;
  humanMultiplier: number;
  animalThreshold: number;
  animalMultiplier: number;
}

export interface OvercrowdingState {
  humans: number;
  animals: number;
  /** Active death-probability multiplier (1 = not overcrowded). Same rule as DeathSystem: count > threshold. */
  humanFactor: number;
  animalFactor: number;
}

export function overcrowdingState(counts: PopulationCounts, limits: OvercrowdingLimits): OvercrowdingState {
  const humans = counts.males + counts.females;
  const animals = counts.wolves + counts.dogs;
  return {
    humans,
    animals,
    humanFactor: humans > limits.humanThreshold ? limits.humanMultiplier : 1,
    animalFactor: animals > limits.animalThreshold ? limits.animalMultiplier : 1,
  };
}

export const OVERCROWDING_ID = 'overcrowdingStatus';

/**
 * Show "Humans 112/100 ⚠ overcrowded ×2" / "Animals 30/50" in the statistics
 * panel (R8). The element is created on first use right after
 * #totalCreatures, so index.html needs no extra markup. Not a live region:
 * it changes every round and the screen-reader announcements would be noise.
 */
export function renderOvercrowding(
  counts: PopulationCounts,
  limits: OvercrowdingLimits,
  t: (key: string, ...args: (string | number)[]) => string,
  root: ParentNode = document,
): HTMLElement | null {
  let box = root.querySelector<HTMLElement>(`#${OVERCROWDING_ID}`);
  if (!box) {
    const anchor = root.querySelector<HTMLElement>('#totalCreatures');
    if (!anchor) return null;
    box = document.createElement('div');
    box.id = OVERCROWDING_ID;
    box.className = 'stat-overcrowding';
    for (const group of ['humans', 'animals']) {
      const line = document.createElement('div');
      line.className = 'stat-overcrowding-line';
      line.dataset.group = group;
      box.appendChild(line);
    }
    anchor.after(box);
  }

  const state = overcrowdingState(counts, limits);
  const lines: [string, number, number, number][] = [
    ['humans', state.humans, limits.humanThreshold, state.humanFactor],
    ['animals', state.animals, limits.animalThreshold, state.animalFactor],
  ];
  box.title = t('summary.overcrowding.title');
  for (const [group, count, threshold, factor] of lines) {
    const line = box.querySelector<HTMLElement>(`[data-group="${group}"]`);
    if (!line) continue;
    const label = t(`summary.overcrowding.${group}`, count, threshold);
    const active = factor !== 1;
    line.textContent = active ? `${label} ${t('summary.overcrowding.active', factor)}` : label;
    line.classList.toggle('overcrowded', active);
  }
  return box;
}
