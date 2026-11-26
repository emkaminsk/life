/// <reference types="vite/client" />

/**
 * Build-time version string injected by Vite `define` (see vite.config.ts).
 * Undefined under Vitest, which does not inherit the define, so always read it
 * through APP_VERSION in src/version.ts.
 */
declare const __APP_VERSION__: string | undefined;
