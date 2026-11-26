import { Human } from '../entities/Human';
import { type Genome, type GenomeSnapshot, Sex } from '../types';
import type { Board } from './Board';

/** The six heritable genes, in display order (PRD 3.18.4). */
export const GENOME_TRAITS: readonly (keyof Genome)[] = [
  'maxHealth',
  'strength',
  'metabolism',
  'greed',
  'caution',
  'longevity',
];

/** Above this many stored snapshots, GenomeHistory halves its resolution. */
export const DEFAULT_MAX_SNAPSHOTS = 5000;

function emptySums(): Genome {
  return { maxHealth: 0, strength: 0, metabolism: 0, greed: 0, caution: 0, longevity: 0 };
}

function average(sums: Genome, count: number): Genome | null {
  if (count === 0) return null;
  const avg = emptySums();
  for (const trait of GENOME_TRAITS) avg[trait] = sums[trait] / count;
  return avg;
}

/**
 * Average genome of the living males and of the living females on the board (PRD 3.18.1).
 * Pregnant females count as females. A sex with no living members gets `null`
 * (never NaN or a misleading 0). One O(cells) pass.
 */
export function computeGenomeSnapshot(board: Board, round: number): GenomeSnapshot {
  const male = emptySums();
  const female = emptySums();
  let males = 0;
  let females = 0;

  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const entity = board.getEntity(x, y);
      if (!(entity instanceof Human) || entity.isDead()) continue;
      const sums = entity.sex === Sex.MALE ? male : female;
      for (const trait of GENOME_TRAITS) sums[trait] += entity.genome[trait];
      if (entity.sex === Sex.MALE) males++;
      else females++;
    }
  }

  return { round, maleAverage: average(male, males), femaleAverage: average(female, females) };
}

/**
 * Per-round genome snapshots with bounded memory.
 *
 * Every round is kept until `maxSnapshots` is exceeded; then every other stored snapshot
 * is dropped (the first is always kept) and from then on only every `stride`-th recorded
 * snapshot is stored. The most recent snapshot is always returned last by getSnapshots(),
 * so "current value" readouts are never stale.
 */
export class GenomeHistory {
  private stored: GenomeSnapshot[] = [];
  private latest: GenomeSnapshot | null = null;
  private stride = 1;
  private sinceStored = 0;
  private cache: readonly GenomeSnapshot[] | null = null;

  constructor(private readonly maxSnapshots = DEFAULT_MAX_SNAPSHOTS) {
    if (!Number.isInteger(maxSnapshots) || maxSnapshots < 2) {
      throw new RangeError('maxSnapshots must be an integer >= 2');
    }
  }

  record(snapshot: GenomeSnapshot): void {
    this.latest = snapshot;
    this.cache = null;
    if (this.sinceStored % this.stride === 0) {
      this.stored.push(snapshot);
      this.sinceStored = 0;
      if (this.stored.length > this.maxSnapshots) {
        this.stored = this.stored.filter((_, i) => i % 2 === 0);
        this.stride *= 2;
      }
    }
    this.sinceStored++;
  }

  /** Snapshots in round order; the latest recorded one is always the last element. */
  getSnapshots(): readonly GenomeSnapshot[] {
    if (this.cache) return this.cache;
    const last = this.stored[this.stored.length - 1];
    this.cache = this.latest && this.latest !== last ? [...this.stored, this.latest] : this.stored.slice();
    return this.cache;
  }

  getLatest(): GenomeSnapshot | null {
    return this.latest;
  }

  reset(): void {
    this.stored = [];
    this.latest = null;
    this.stride = 1;
    this.sinceStored = 0;
    this.cache = null;
  }
}
