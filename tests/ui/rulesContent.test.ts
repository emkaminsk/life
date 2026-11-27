import { beforeEach, describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';
import { DEFAULT_CONFIG } from '../../src/config';
import { DOMRenderer } from '../../src/i18n/DOMRenderer';
import { i18n } from '../../src/i18n/i18n';
import { en, pl } from '../../src/i18n/sections/rules';
import { Language } from '../../src/i18n/types';
import type { GameConfig } from '../../src/ui/ConfigPanel';
import { applyRulesConfigArgs } from '../../src/ui/rulesArgs';

function loadRulesModal(): HTMLElement {
  const doc = new DOMParser().parseFromString(indexHtml, 'text/html');
  const modal = doc.getElementById('rulesModal') as HTMLElement;
  document.body.innerHTML = '';
  document.body.appendChild(document.importNode(modal, true));
  return document.getElementById('rulesModal') as HTMLElement;
}

const text = (modal: HTMLElement, key: string) => modal.querySelector(`[data-i18n="rules.${key}"]`)?.textContent ?? '';

function config(overrides: { pregnancyPeriod?: number; roundsToRipen?: number; humanThreshold?: number }): GameConfig {
  const c = structuredClone(DEFAULT_CONFIG) as unknown as GameConfig;
  if (overrides.pregnancyPeriod !== undefined) c.human.pregnancyPeriod = overrides.pregnancyPeriod;
  if (overrides.roundsToRipen !== undefined) c.fruit.roundsToRipen = overrides.roundsToRipen;
  if (overrides.humanThreshold !== undefined) c.overcrowding.humanThreshold = overrides.humanThreshold;
  return c;
}

describe('rules modal content (R9, R15)', () => {
  let modal: HTMLElement;
  beforeEach(() => {
    i18n.setLanguage(Language.EN);
    modal = loadRulesModal();
  });

  it('renders every rules key somewhere in the modal', () => {
    const used = new Set(
      Array.from(modal.querySelectorAll('[data-i18n^="rules."]')).map((e) => e.getAttribute('data-i18n')),
    );
    // Section headings kept for other views; the modal shows tab names instead.
    const notInModal = new Set(['roundPriorityTitle', 'creaturesTitle', 'plantsTitle', 'controlsTitle']);
    const unused = Object.keys(en).filter((k) => !notInModal.has(k) && !used.has(`rules.${k}`));
    expect(unused).toEqual([]);
  });

  it('every tab controls an existing panel (including the new Genetics & Energy tab)', () => {
    const tabs = Array.from(modal.querySelectorAll<HTMLElement>('[role="tab"]'));
    expect(tabs.map((tab) => tab.dataset.tab)).toEqual(['rules', 'creatures', 'plants', 'genetics', 'controls']);
    for (const tab of tabs) {
      const panel = modal.querySelector(`#${tab.getAttribute('aria-controls')}`);
      expect(panel?.getAttribute('role')).toBe('tabpanel');
      expect(panel?.id).toBe(`${tab.dataset.tab}-tab`);
    }
    const genetics = modal.querySelector('#genetics-tab') as HTMLElement;
    expect(genetics.querySelectorAll('li')).toHaveLength(11); // 6 genes + 5 energy states
  });

  it('explains genes, energy, dogs vs mushrooms, fights, overcrowding, births and the end of the game', () => {
    new DOMRenderer().updateDOM();
    expect(text(modal, 'geneLongevity')).toMatch(/Longevity/);
    expect(text(modal, 'geneMetabolism')).toMatch(/every step/);
    expect(text(modal, 'energyDesperate')).toMatch(/30%/);
    expect(text(modal, 'dogsDesc')).toMatch(/immune to mushrooms/);
    expect(text(modal, 'importantRuleMaleFight')).toMatch(/winner gains the loser’s health/);
    expect(text(modal, 'importantRuleBirthSpace')).toMatch(/no empty cell/);
    expect(text(modal, 'orderExample1')).toMatch(/phase 2.*phase 4/);
    expect(text(modal, 'gameEndDesc')).toMatch(/all humans have died.*no wolves and no mushrooms.*round 10/);
    expect(text(modal, 'challengesDesc')).toMatch(/win when you reach the goal.*switched off/);
    expect(text(modal, 'classicDesc')).toMatch(/B3\/S23.*exactly 3.*2 or 3 survives/);
  });

  it('shows the default config values before a game starts and the active ones after', () => {
    new DOMRenderer().updateDOM();
    expect(text(modal, 'femalesDesc')).toContain('lasts 3 rounds');
    expect(text(modal, 'fruitsDesc')).toContain('after 2 rounds');
    expect(text(modal, 'importantRuleOvercrowding')).toContain('more than 100 humans');

    applyRulesConfigArgs(document, config({ pregnancyPeriod: 9, roundsToRipen: 4, humanThreshold: 250 }));
    new DOMRenderer().updateDOM();
    expect(text(modal, 'femalesDesc')).toContain('lasts 9 rounds');
    expect(text(modal, 'fruitsDesc')).toContain('after 4 rounds');
    expect(text(modal, 'importantRuleOvercrowding')).toContain('more than 250 humans');

    i18n.setLanguage(Language.PL);
    new DOMRenderer().updateDOM();
    expect(text(modal, 'femalesDesc')).toContain('(w rundach): 9');
    expect(text(modal, 'importantRuleOvercrowding')).toContain('więcej niż 250');
    expect(modal.querySelector('#genetics-tab h3')?.textContent).toBe('🧬 Geny');
  });

  it('uses 👨 as the male emoji everywhere (no 🧑‍🦰) in both languages and the markup', () => {
    for (const table of [en, pl]) {
      expect(Object.values(table).join('\n')).not.toContain('🧑‍🦰');
      expect(table.malesTitle.startsWith('👨')).toBe(true);
    }
    expect(modal.innerHTML).not.toContain('🧑‍🦰');
  });
});
