import {
  type CellPos,
  type CellRect,
  normalizeRect,
  PLACEABLE_KINDS,
  type PlaceableKind,
} from '../../core/BoardLayout';

/**
 * Pure keyboard reducer for the manual board setup. The view turns a keydown
 * into a SetupKey, calls reduceSetupKey and applies the returned action.
 *
 *   arrows            move the cursor (clears the selection); Ctrl+arrows jump 5 cells
 *   Shift+arrows      extend a rectangular selection from the anchor
 *   Ctrl+A            select the whole board
 *   1–6               pick that item and fill the selection with it
 *   Shift+1–6         pick that item and sprinkle it over ~30% of the empty selected cells
 *   0                 pick the eraser and erase the selection
 *   Enter / Space     fill the selection with the current tool (Shift: sprinkle)
 *   Delete/Backspace  erase the selection
 *   Escape            clear the selection; with no selection: cancel
 *   Ctrl+Enter        confirm (start the game)
 */
export interface SetupKeyState {
  cursor: CellPos;
  /** Fixed corner of the selection; null = only the cursor cell is selected. */
  anchor: CellPos | null;
  /** null = eraser. */
  tool: PlaceableKind | null;
  width: number;
  height: number;
}

export interface SetupKey {
  code: string;
  shift: boolean;
  ctrl: boolean;
}

export type SetupKeyAction =
  | { type: 'fill'; rect: CellRect; kind: PlaceableKind | null }
  | { type: 'randomFill'; rect: CellRect; kind: PlaceableKind; density: number }
  | { type: 'confirm' }
  | { type: 'cancel' };

export interface SetupKeyResult {
  state: SetupKeyState;
  action?: SetupKeyAction;
  /** False when the key means nothing here (the view should not preventDefault). */
  handled: boolean;
}

/** Share of empty selected cells filled by a "sprinkle" (Shift+digit / Shift+Enter). */
export const RANDOM_FILL_DENSITY = 0.3;
/** Cells moved by Ctrl+arrow. */
export const CTRL_STEP = 5;

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** Selected rectangle: anchor..cursor, or just the cursor cell. */
export function selectionRect(state: Pick<SetupKeyState, 'cursor' | 'anchor'>): CellRect {
  return normalizeRect(state.anchor ?? state.cursor, state.cursor);
}

function clamp(v: number, max: number): number {
  return Math.min(Math.max(0, max - 1), Math.max(0, v));
}

/** Digit 0–9 from "Digit3" / "Numpad3", else null. */
function digitOf(code: string): number | null {
  const m = /^(?:Digit|Numpad)([0-9])$/.exec(code);
  return m ? Number(m[1]) : null;
}

function fillAction(state: SetupKeyState, kind: PlaceableKind | null, sprinkle: boolean): SetupKeyAction {
  const rect = selectionRect(state);
  return sprinkle && kind
    ? { type: 'randomFill', rect, kind, density: RANDOM_FILL_DENSITY }
    : { type: 'fill', rect, kind };
}

export function reduceSetupKey(state: SetupKeyState, key: SetupKey): SetupKeyResult {
  const arrow = ARROWS[key.code];
  if (arrow) {
    const step = key.ctrl ? CTRL_STEP : 1;
    const cursor = {
      x: clamp(state.cursor.x + arrow[0] * step, state.width),
      y: clamp(state.cursor.y + arrow[1] * step, state.height),
    };
    const anchor = key.shift ? (state.anchor ?? state.cursor) : null;
    return { state: { ...state, cursor, anchor }, handled: true };
  }

  const digit = digitOf(key.code);
  if (digit !== null && !key.ctrl) {
    if (digit === 0) {
      const next = { ...state, tool: null };
      return { state: next, action: fillAction(next, null, false), handled: true };
    }
    const kind = PLACEABLE_KINDS[digit - 1];
    if (!kind) return { state, handled: false };
    const next = { ...state, tool: kind };
    return { state: next, action: fillAction(next, kind, key.shift), handled: true };
  }

  switch (key.code) {
    case 'KeyA':
      if (!key.ctrl) return { state, handled: false };
      return {
        state: { ...state, anchor: { x: 0, y: 0 }, cursor: { x: state.width - 1, y: state.height - 1 } },
        handled: true,
      };
    case 'Enter':
    case 'NumpadEnter':
      if (key.ctrl) return { state, action: { type: 'confirm' }, handled: true };
      return { state, action: fillAction(state, state.tool, key.shift), handled: true };
    case 'Space':
      return { state, action: fillAction(state, state.tool, key.shift), handled: true };
    case 'Delete':
    case 'Backspace':
      return { state, action: { type: 'fill', rect: selectionRect(state), kind: null }, handled: true };
    case 'Escape':
      if (state.anchor) return { state: { ...state, anchor: null }, handled: true };
      return { state, action: { type: 'cancel' }, handled: true };
    default:
      return { state, handled: false };
  }
}
