/**
 * Shared simulation event / history types (frozen contract, see tasks/todo.md).
 * Systems report what happened in a round with these; Game aggregates them
 * into RoundRecords for history, statistics and the end-of-game summary.
 */

/** Why a creature died. Set on the Entity when its health first drops to ≤ 0 (or via kill()). */
export type DeathCause =
  | 'wolfAttack'
  | 'maleFight'
  | 'dogAttack'
  | 'humanDefense'
  | 'mushroom'
  | 'metabolism'
  | 'oldAge'
  | 'overcrowding'
  | 'childbirth'
  | 'unknown';

/** Creature species tracked in history (plants are counted, not tracked individually). */
export type Species = 'male' | 'female' | 'wolf' | 'dog';

export interface DeathRecord {
  species: Species;
  cause: DeathCause;
  age: number;
}

export interface RoundEvents {
  deaths: DeathRecord[];
  births: number;
  newPregnancies: number;
  fruitsEaten: number;
  mushroomsEaten: number;
}

export interface RoundRecord {
  round: number;
  males: number;
  females: number;
  pregnant: number;
  wolves: number;
  dogs: number;
  fruits: number;
  mushrooms: number;
  events: RoundEvents;
}

export type EndReason = 'humansExtinct' | 'humansSafe' | 'userFinished';

/** Anything that can be placed on a board cell. */
export type PlaceableKind = 'male' | 'female' | 'wolf' | 'dog' | 'fruit' | 'mushroom';

export interface BoardLayout {
  width: number;
  height: number;
  /** Row-major: cells[y * width + x]. */
  cells: (PlaceableKind | null)[];
}
