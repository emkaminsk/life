import type { RoundEvents, RoundRecord } from './simulationEvents';

/** A RoundEvents value with nothing happened (used for round 0 and as an accumulator). */
export function emptyRoundEvents(): RoundEvents {
  return { deaths: [], births: 0, newPregnancies: 0, fruitsEaten: 0, mushroomsEaten: 0 };
}

/** Number of humans (males + females) in a record. */
export function humansIn(record: RoundRecord): number {
  return record.males + record.females;
}

/**
 * Per-round history of a game: one RoundRecord for the initial board (round 0) and
 * one after every completed round. The human population series is kept alongside
 * so the population graph can read it without recomputing.
 */
export class GameHistory {
  private records: RoundRecord[] = [];
  private humanPopulation: number[] = [];

  /** Begin a new game with the initial (round 0) record, discarding any previous one. */
  start(initial: RoundRecord): void {
    this.clear();
    this.record(initial);
  }

  /** Append the record of a completed round. */
  record(record: RoundRecord): void {
    this.records.push(record);
    this.humanPopulation.push(humansIn(record));
  }

  /** All records, oldest first (index i is round i for a normally played game). */
  getRecords(): readonly RoundRecord[] {
    return this.records;
  }

  /** The most recent record, or undefined before the game starts. */
  getLatest(): RoundRecord | undefined {
    return this.records[this.records.length - 1];
  }

  /** Human population (males + females) for each record. */
  getHumanPopulation(): number[] {
    return this.humanPopulation;
  }

  get length(): number {
    return this.records.length;
  }

  clear(): void {
    this.records = [];
    this.humanPopulation = [];
  }
}
