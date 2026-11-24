/**
 * Debug logging gated behind a flag so hot paths (per-round, per-frame) don't
 * pay for console output in normal use.
 *
 * Enabled when the page URL contains `?debug` (or `&debug`), or when
 * `localStorage.debug === '1'`. Tests and code can toggle it via setDebug().
 */
let enabled = detectDebug();

function detectDebug(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (/[?&]debug\b/.test(window.location?.search ?? '')) return true;
    return window.localStorage?.getItem('debug') === '1';
  } catch {
    return false;
  }
}

export function isDebug(): boolean {
  return enabled;
}

export function setDebug(value: boolean): void {
  enabled = value;
}

export function debugLog(...args: unknown[]): void {
  if (enabled) console.log(...args);
}
