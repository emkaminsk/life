import { describe, it, expect, beforeEach } from 'vitest'
import { DOMRenderer, initializeDOMRenderer } from '../../src/i18n/DOMRenderer'
import { i18n } from '../../src/i18n/i18n'
import { Language } from '../../src/i18n/types'

describe('DOMRenderer', () => {
  beforeEach(() => {
    i18n.setLanguage(Language.EN)
    document.body.innerHTML = `
      <h1 id="title" data-i18n="header.title">x</h1>
      <div id="round" data-i18n="header.round" data-i18n-args="12">x</div>
      <input id="field" data-i18n-placeholder="controls.speed" />
      <button id="help" data-i18n-title="header.helpTitle" data-i18n-aria-label="a11y.close">?</button>
    `
  })

  it('fills text, placeholders, titles and aria-labels', () => {
    new DOMRenderer().updateDOM()
    expect(document.getElementById('title')!.textContent).toBe('Game of Life Educational Simulator')
    expect(document.getElementById('round')!.textContent).toBe('Round: 12')
    expect((document.getElementById('field') as HTMLInputElement).placeholder).toBe('Speed:')
    expect(document.getElementById('help')!.getAttribute('title')).toBe('View rules')
    expect(document.getElementById('help')!.getAttribute('aria-label')).toBe('Close')
  })

  it('updates data-i18n nodes when the language switches', () => {
    initializeDOMRenderer()
    expect(document.getElementById('title')!.textContent).toBe('Game of Life Educational Simulator')
    i18n.setLanguage(Language.PL)
    expect(document.getElementById('title')!.textContent).toBe('Symulator Edukacyjny Gra w Życie')
    expect(document.getElementById('round')!.textContent).toBe('Runda: 12')
    expect(document.getElementById('help')!.getAttribute('aria-label')).toBe('Zamknij')
    i18n.setLanguage(Language.EN)
    expect(document.getElementById('round')!.textContent).toBe('Round: 12')
  })
})
