/**
 * Pure layout maths for the manual board setup. The three modes mirror the
 * media queries in setup.css, so keep the breakpoints in sync:
 *
 *   side       wide screens: board left, palette in a 240px column on the right
 *   stacked    (max-width: 800px): board on top, palette below (phones, portrait)
 *   landscape  (max-height: 500px) and (orientation: landscape): board fills the
 *              height on the left, everything else in a column on the right
 */
export type SetupLayoutMode = 'side' | 'stacked' | 'landscape';

export interface Viewport {
  width: number;
  height: number;
}

export const STACK_MAX_WIDTH = 800;
export const LANDSCAPE_MAX_HEIGHT = 500;
/** Smallest cell a finger can still hit; small/touch screens scroll the board instead of shrinking it further. */
export const MIN_TAP_CELL = 11;
/** Smallest cell with a fine pointer (mouse) on a big screen. */
export const MIN_CELL = 6;
export const MAX_CELL = 32;

/** Space around the board, in px, per mode (panel padding + board border + side column). */
const SIDE_CHROME = { w: 360, h: 300 };
const STACKED_PAD = 36; // 2 × 16px panel padding + 2 × 2px border
const STACKED_MAX_HEIGHT = 0.7; // .setup-board-scroll max-height: 70vh
const LANDSCAPE_PAD = 20; // 2 × 8px panel padding + 2 × 2px border
const LANDSCAPE_COLUMN = 272; // 260px side column + 12px gap

export function setupLayoutMode(vp: Viewport): SetupLayoutMode {
  if (vp.height <= LANDSCAPE_MAX_HEIGHT && vp.width > vp.height) return 'landscape';
  if (vp.width <= STACK_MAX_WIDTH) return 'stacked';
  return 'side';
}

/** Cell size (px) that fits a width × height board into the viewport for the current layout. */
export function fitCellSize(width: number, height: number, vp: Viewport, coarsePointer = false): number {
  const mode = setupLayoutMode(vp);
  let availW: number;
  let availH: number;
  if (mode === 'stacked') {
    availW = vp.width - STACKED_PAD;
    availH = vp.height * STACKED_MAX_HEIGHT - 4;
  } else if (mode === 'landscape') {
    availW = vp.width - LANDSCAPE_PAD - LANDSCAPE_COLUMN;
    availH = vp.height - LANDSCAPE_PAD;
  } else {
    availW = vp.width - SIDE_CHROME.w;
    availH = vp.height - SIDE_CHROME.h;
  }
  const min = mode !== 'side' || coarsePointer ? MIN_TAP_CELL : MIN_CELL;
  const size = Math.floor(Math.min(Math.max(availW, 200) / width, Math.max(availH, 200) / height));
  return Math.min(MAX_CELL, Math.max(min, size));
}
