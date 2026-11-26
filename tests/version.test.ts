import { describe, expect, it } from 'vitest';
import { APP_VERSION, formatVersion, resolveCommitHash, versionFrom } from '../src/version';

const noGit = (): string => {
  throw new Error('git: command not found');
};

describe('resolveCommitHash', () => {
  it('prefers APP_COMMIT, then GITHUB_SHA, then the git HEAD', () => {
    const git = () => 'abcdef1\n';
    expect(resolveCommitHash({ APP_COMMIT: '1234567', GITHUB_SHA: 'fedcba9876' }, git)).toBe('1234567');
    expect(resolveCommitHash({ GITHUB_SHA: 'FEDCBA9876543210' }, git)).toBe('fedcba9');
    expect(resolveCommitHash({}, git)).toBe('abcdef1');
  });

  it('shortens a full 40-char sha to 7 lowercase characters', () => {
    expect(resolveCommitHash({ APP_COMMIT: `ABCDEF0${'1'.repeat(33)}` }, noGit)).toBe('abcdef0');
  });

  it('ignores env values that are not commit hashes', () => {
    expect(resolveCommitHash({ APP_COMMIT: 'main', GITHUB_SHA: '' }, () => '9a8b7c6')).toBe('9a8b7c6');
  });

  it("falls back to 'dev' when git throws or prints garbage", () => {
    expect(resolveCommitHash({}, noGit)).toBe('dev');
    expect(resolveCommitHash({}, () => 'fatal: not a git repository')).toBe('dev');
  });
});

describe('APP_VERSION', () => {
  it('formats as 1.0.<hash>', () => {
    expect(formatVersion('abc1234')).toBe('1.0.abc1234');
  });

  it('uses an injected build value and falls back to 1.0.dev without one', () => {
    expect(versionFrom('1.0.abc1234')).toBe('1.0.abc1234');
    expect(versionFrom(undefined)).toBe('1.0.dev');
    expect(versionFrom('')).toBe('1.0.dev');
  });

  it('is 1.0.dev under Vitest, which does not inherit the Vite define', () => {
    expect(APP_VERSION).toBe('1.0.dev');
  });
});
