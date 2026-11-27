/**
 * Classic starting patterns as plain-text grids: 'O' = live cell, '.' = dead.
 * Names live in i18n under `classic.patterns.<id>`.
 */
export type PatternId =
  | 'glider'
  | 'lwss'
  | 'pulsar'
  | 'rPentomino'
  | 'gosperGun'
  | 'acorn'
  | 'diehard'
  | 'pentadecathlon';

export interface Pattern {
  id: PatternId;
  width: number;
  height: number;
  /** Live cells as [x, y] relative to the top-left corner. */
  cells: readonly (readonly [number, number])[];
}

/** Parse rows of '.'/'O' text (rows may differ in length). */
export function parsePattern(id: PatternId, rows: readonly string[]): Pattern {
  const cells: [number, number][] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === 'O') cells.push([x, y]);
  });
  return { id, width: Math.max(...rows.map((r) => r.length)), height: rows.length, cells };
}

const SOURCES: Record<PatternId, readonly string[]> = {
  glider: ['.O.', '..O', 'OOO'],
  lwss: ['.O..O', 'O....', 'O...O', 'OOOO.'],
  pulsar: [
    '..OOO...OOO..',
    '.............',
    'O....O.O....O',
    'O....O.O....O',
    'O....O.O....O',
    '..OOO...OOO..',
    '.............',
    '..OOO...OOO..',
    'O....O.O....O',
    'O....O.O....O',
    'O....O.O....O',
    '.............',
    '..OOO...OOO..',
  ],
  rPentomino: ['.OO', 'OO.', '.O.'],
  gosperGun: [
    '........................O...........',
    '......................O.O...........',
    '............OO......OO............OO',
    '...........O...O....OO............OO',
    'OO........O.....O...OO..............',
    'OO........O...O.OO....O.O...........',
    '..........O.....O.......O...........',
    '...........O...O....................',
    '............OO......................',
  ],
  acorn: ['.O.....', '...O...', 'OO..OOO'],
  diehard: ['......O.', 'OO......', '.O...OOO'],
  pentadecathlon: ['..O....O..', 'OO.OOOO.OO', '..O....O..'],
};

export const PATTERN_IDS = Object.keys(SOURCES) as PatternId[];

export const PATTERNS: Readonly<Record<PatternId, Pattern>> = Object.fromEntries(
  PATTERN_IDS.map((id) => [id, parsePattern(id, SOURCES[id])]),
) as Record<PatternId, Pattern>;

export function isPatternId(value: unknown): value is PatternId {
  return typeof value === 'string' && (PATTERN_IDS as string[]).includes(value);
}
