import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TraitPanel, TRAIT_VISIBILITY_STORAGE_KEY } from '../../src/ui/TraitPanel';
import { TRAIT_COLORS } from '../../src/ui/TraitChart';
import type { Genome, GenomeSnapshot } from '../../src/types';
import { i18n } from '../../src/i18n/i18n';
import { Language } from '../../src/i18n/types';
import { recordingContext } from './traitCanvasStub';

const genome = (strength: number): Genome => ({
  maxHealth: 100,
  strength,
  metabolism: 0.5,
  greed: 0.4,
  caution: 0.3,
  longevity: 1,
});
const data: GenomeSnapshot[] = [
  { round: 0, maleAverage: genome(1), femaleAverage: genome(1) },
  { round: 1, maleAverage: genome(1.5), femaleAverage: genome(0.9) },
];

let ctx: ReturnType<typeof recordingContext>;

function mount(storage: Storage | null = sessionStorage) {
  document.body.innerHTML = '<section id="traitPanel" class="panel"></section>';
  const root = document.getElementById('traitPanel') as HTMLElement;
  ctx = recordingContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  const panel = new TraitPanel(root, storage);
  return { root, panel };
}

const checkbox = (root: HTMLElement, trait: string) =>
  root.querySelector<HTMLInputElement>(`input[type="checkbox"][value="${trait}"]`) as HTMLInputElement;

function toggle(root: HTMLElement, trait: string) {
  const box = checkbox(root, trait);
  box.checked = !box.checked;
  box.dispatchEvent(new Event('change'));
}

const legendTraits = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('.trait-legend tbody tr')].map((r) => r.dataset.trait);

describe('TraitPanel', () => {
  beforeEach(() => {
    sessionStorage.clear();
    i18n.setLanguage(Language.EN);
  });

  it('renders a collapsible titled panel with an accessible chart and six labelled checkboxes', () => {
    const { root, panel } = mount();
    const details = root.querySelector('details');
    expect(details?.open).toBe(true);
    const title = root.querySelector('summary h2');
    expect(title?.textContent).toBe('Genetic traits');
    expect(root.getAttribute('aria-labelledby')).toBe(title?.id);

    const canvas = root.querySelector('canvas');
    expect(canvas?.getAttribute('role')).toBe('img');
    expect(canvas?.getAttribute('aria-label')).toMatch(/genetic traits/i);
    expect(document.getElementById(canvas?.getAttribute('aria-describedby') ?? '')).not.toBeNull();

    const boxes = [...root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    expect(boxes.map((b) => b.value)).toEqual(['maxHealth', 'strength', 'metabolism', 'greed', 'caution', 'longevity']);
    for (const b of boxes) expect(root.querySelector(`label[for="${b.id}"]`)?.textContent).not.toBe('');
    expect(root.querySelector('fieldset legend')?.textContent).toBe('Show traits');
    panel.destroy();
  });

  it('checks the physical traits by default (PRD 3.18.5)', () => {
    const { root, panel } = mount();
    expect(panel.getVisibleTraits()).toEqual(['maxHealth', 'strength', 'metabolism']);
    expect(checkbox(root, 'greed').checked).toBe(false);
    expect(checkbox(root, 'longevity').checked).toBe(false);
    panel.destroy();
  });

  it('toggling a checkbox re-renders the chart and the legend', () => {
    const { root, panel } = mount();
    panel.update(data);
    expect(legendTraits(root)).toEqual(['maxHealth', 'strength', 'metabolism']);
    ctx.ops.length = 0;

    toggle(root, 'strength');
    toggle(root, 'longevity');

    expect(panel.getVisibleTraits()).toEqual(['maxHealth', 'metabolism', 'longevity']);
    expect(legendTraits(root)).toEqual(['maxHealth', 'metabolism', 'longevity']);
    const colors = new Set(ctx.ops.map((o) => o.color));
    expect(colors.has(TRAIT_COLORS.longevity.male)).toBe(true);
    expect(colors.has(TRAIT_COLORS.strength.male)).toBe(false);
    panel.destroy();
  });

  it('remembers the choice for the session and restores it in a new panel', () => {
    const first = mount();
    toggle(first.root, 'maxHealth');
    toggle(first.root, 'caution');
    expect(JSON.parse(sessionStorage.getItem(TRAIT_VISIBILITY_STORAGE_KEY) ?? '[]')).toEqual([
      'strength',
      'metabolism',
      'caution',
    ]);
    first.panel.destroy();

    const second = mount();
    expect(second.panel.getVisibleTraits()).toEqual(['strength', 'metabolism', 'caution']);
    expect(checkbox(second.root, 'caution').checked).toBe(true);
    expect(checkbox(second.root, 'maxHealth').checked).toBe(false);
    second.panel.destroy();
  });

  it('ignores corrupt stored data and keeps working when storage throws', () => {
    sessionStorage.setItem(TRAIT_VISIBILITY_STORAGE_KEY, '{not json');
    const corrupt = mount();
    expect(corrupt.panel.getVisibleTraits()).toEqual(['maxHealth', 'strength', 'metabolism']);
    corrupt.panel.destroy();

    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    } as unknown as Storage;
    const { root, panel } = mount(broken);
    expect(panel.getVisibleTraits()).toEqual(['maxHealth', 'strength', 'metabolism']);
    toggle(root, 'greed');
    expect(panel.getVisibleTraits()).toContain('greed');
    panel.destroy();
  });

  it('reset() clears the chart but keeps the trait choice', () => {
    const { root, panel } = mount();
    toggle(root, 'greed');
    panel.update(data);
    expect(root.querySelector('.trait-value')?.textContent).toBe('100.0');

    ctx.fillText.mockClear();
    panel.reset();
    expect(ctx.fillText).toHaveBeenCalledWith('Waiting for data...', expect.any(Number), expect.any(Number));
    expect(root.querySelector('.trait-value')?.textContent).toBe('–');
    expect(panel.getVisibleTraits()).toContain('greed');
    panel.destroy();
  });

  it('relabels everything when the language changes, and stops after destroy()', () => {
    const { root, panel } = mount();
    panel.update(data);

    i18n.setLanguage(Language.PL);
    expect(root.querySelector('summary h2')?.textContent).toBe('Cechy genetyczne');
    expect(root.querySelector('fieldset legend')?.textContent).toBe('Pokaż cechy');
    const strengthLabel = root.querySelector(`label[for="${checkbox(root, 'strength').id}"]`) as HTMLLabelElement;
    expect(strengthLabel.textContent).toBe('Siła');
    expect(strengthLabel.title).toMatch(/walce/);
    expect(root.querySelector('.trait-legend tbody th')?.textContent).toBe('Maks. zdrowie');
    expect(root.querySelector('.trait-value')?.textContent).toBe('100,0');

    panel.destroy();
    i18n.setLanguage(Language.EN);
    expect(root.querySelector('summary h2')?.textContent).toBe('Cechy genetyczne');
  });

  it('redraws when the collapsed panel is opened again', () => {
    const { root, panel } = mount();
    panel.update(data);
    const details = root.querySelector('details') as HTMLDetailsElement;
    details.open = false;
    details.dispatchEvent(new Event('toggle'));
    ctx.ops.length = 0;
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
    expect(ctx.ops.length).toBeGreaterThan(0);
    panel.destroy();
  });
});
