import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { I18n } from '../../src/i18n/i18n'
import { translations } from '../../src/i18n/translations'
import { Language } from '../../src/i18n/types'
import indexHtml from '../../index.html?raw'

function keyPaths(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k))
}

function placeholders(s: string): string[] {
  return (s.match(/\{\d+\}/g) ?? []).sort()
}

function valueAt(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj)
}

describe('I18n', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('translates keys in English and Polish', () => {
    const i18n = new I18n()
    i18n.setLanguage(Language.EN)
    expect(i18n.t('controls.pause')).toBe('Pause')
    expect(i18n.t('controls.resume')).toBe('Resume')
    i18n.setLanguage(Language.PL)
    expect(i18n.t('controls.pause')).toBe('Pauza')
    expect(i18n.t('controls.resume')).toBe('Wznów')
  })

  it('returns the key and warns for a missing key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const i18n = new I18n()
    expect(i18n.t('does.not.exist')).toBe('does.not.exist')
    expect(i18n.t('controls')).toBe('controls') // a section, not a string
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('does.not.exist'))
  })

  it('interpolates positional arguments and leaves unmatched placeholders', () => {
    const i18n = new I18n()
    i18n.setLanguage(Language.EN)
    expect(i18n.t('stats.total', 50, 900)).toBe('Total creatures: 50/900')
    expect(i18n.t('header.round', 7)).toBe('Round: 7')
    expect(i18n.t('stats.ripeUnripe', 3)).toBe('3 ripe / {1} unripe')
  })

  it('setLanguage persists to localStorage and notifies listeners once', () => {
    const i18n = new I18n()
    i18n.setLanguage(Language.EN)
    const listener = vi.fn()
    i18n.onLanguageChange(listener)
    i18n.setLanguage(Language.PL)
    expect(localStorage.getItem('language')).toBe('pl')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(Language.PL)
    expect(i18n.getCurrentLanguage()).toBe(Language.PL)
  })

  it('does not notify when setting the same language', () => {
    const i18n = new I18n()
    i18n.setLanguage(Language.EN)
    const listener = vi.fn()
    i18n.onLanguageChange(listener)
    i18n.setLanguage(Language.EN)
    expect(listener).not.toHaveBeenCalled()
  })

  it('offLanguageChange removes a listener', () => {
    const i18n = new I18n()
    i18n.setLanguage(Language.EN)
    const listener = vi.fn()
    i18n.onLanguageChange(listener)
    i18n.offLanguageChange(listener)
    i18n.setLanguage(Language.PL)
    expect(listener).not.toHaveBeenCalled()
  })

  it('restores the stored language', () => {
    localStorage.setItem('language', 'pl')
    expect(new I18n().getCurrentLanguage()).toBe(Language.PL)
  })

  it('detects Polish from navigator.language', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('pl-PL')
    expect(new I18n().getCurrentLanguage()).toBe(Language.PL)
  })

  it('defaults to English for other browser languages', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE')
    expect(new I18n().getCurrentLanguage()).toBe(Language.EN)
  })

  it('ignores an invalid stored value and falls back to browser detection', () => {
    localStorage.setItem('language', 'klingon')
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB')
    expect(new I18n().getCurrentLanguage()).toBe(Language.EN)
  })

  it('getTranslations returns the active table', () => {
    const i18n = new I18n()
    i18n.setLanguage(Language.PL)
    expect(i18n.getTranslations()).toBe(translations[Language.PL])
  })
})

describe('translations', () => {
  const en = translations[Language.EN]
  const pl = translations[Language.PL]

  it('EN and PL have exactly the same keys', () => {
    expect(keyPaths(pl).sort()).toEqual(keyPaths(en).sort())
  })

  it('every value is a non-empty string with matching placeholders', () => {
    for (const path of keyPaths(en)) {
      const e = valueAt(en, path)
      const p = valueAt(pl, path)
      expect(typeof e, path).toBe('string')
      expect(typeof p, path).toBe('string')
      expect((e as string).length, path).toBeGreaterThan(0)
      expect((p as string).length, path).toBeGreaterThan(0)
      expect(placeholders(p as string), path).toEqual(placeholders(e as string))
    }
  })

  it('every data-i18n key used in index.html exists', () => {
    const html = indexHtml
    const keys = [...html.matchAll(/data-i18n(?:-title|-aria-label|-placeholder)?="([\w.]+)"/g)].map((m) => m[1])
    expect(keys.length).toBeGreaterThan(50)
    for (const key of keys) {
      expect(typeof valueAt(en, key), key).toBe('string')
    }
  })
})
