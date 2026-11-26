/**
 * Application version: "1.0.<short commit hash>" (TODO F6, review R15c).
 *
 * The hash is resolved at build time in vite.config.ts and injected through
 * `define` as __APP_VERSION__. Vitest does not inherit that define, so the
 * typeof guard falls back to the development label.
 */
export const VERSION_PREFIX = '1.0.';
export const DEV_HASH = 'dev';
const SHORT_HASH_LENGTH = 7;
const HASH_PATTERN = /^[0-9a-f]{4,40}$/i;

export function formatVersion(hash: string): string {
  return `${VERSION_PREFIX}${hash}`;
}

/** A short lowercase hash, or null when the value is not a commit hash. */
function normalizeHash(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return HASH_PATTERN.test(trimmed) ? trimmed.slice(0, SHORT_HASH_LENGTH).toLowerCase() : null;
}

/**
 * Pick the commit hash for the build label. Precedence: APP_COMMIT env, then
 * GITHUB_SHA (CI), then the local repository HEAD, else 'dev'.
 * `readGitHead` is injected so this stays pure and testable; it may throw
 * (no git binary, not a repository), which also falls back to 'dev'.
 */
export function resolveCommitHash(env: Record<string, string | undefined>, readGitHead: () => string): string {
  const fromEnv = normalizeHash(env.APP_COMMIT) ?? normalizeHash(env.GITHUB_SHA);
  if (fromEnv) return fromEnv;
  try {
    return normalizeHash(readGitHead()) ?? DEV_HASH;
  } catch {
    return DEV_HASH;
  }
}

/** Resolve the label from an injected build value (exported for tests). */
export function versionFrom(injected: unknown): string {
  return typeof injected === 'string' && injected !== '' ? injected : formatVersion(DEV_HASH);
}

export const APP_VERSION: string = versionFrom(typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : undefined);
