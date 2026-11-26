import { GENOME_TRAITS } from '../core/genomeStats';
import { i18n } from '../i18n/i18n';
import type { GenomeSnapshot } from '../types';
import { DEFAULT_VISIBLE_TRAITS, type Trait, TraitChart } from './TraitChart';
import './traitPanel.css';

/** sessionStorage key holding the JSON array of visible traits (US-052: kept for the session). */
export const TRAIT_VISIBILITY_STORAGE_KEY = 'gol.traitPanel.visibleTraits';

function sessionStore(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null; // access itself can throw when storage is blocked
  }
}

function loadVisible(storage: Storage | null): Trait[] {
  try {
    const raw = storage?.getItem(TRAIT_VISIBILITY_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return GENOME_TRAITS.filter((t) => parsed.includes(t));
    }
  } catch {
    // unreadable or corrupt: fall back to the defaults
  }
  return [...DEFAULT_VISIBLE_TRAITS];
}

/**
 * Collapsible "Genetic traits" sidebar panel (PRD 3.18, US-048/049/052): the evolution chart,
 * a legend with current ♂/♀ averages and one checkbox per gene. Renders into `root`
 * (`#traitPanel`). Feed it with `update(history.getSnapshots())` after each round.
 */
export class TraitPanel {
  private readonly chart: TraitChart;
  private readonly details: HTMLDetailsElement;
  private readonly title: HTMLElement;
  private readonly fieldsetLegend: HTMLLegendElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly labels = new Map<
    Trait,
    { label: HTMLLabelElement; text: HTMLSpanElement; input: HTMLInputElement }
  >();
  private readonly onLanguage = () => this.relabel();
  private readonly resizeObserver: ResizeObserver | null = null;

  constructor(
    root: HTMLElement,
    private readonly storage: Storage | null = sessionStore(),
  ) {
    const doc = root.ownerDocument;
    const id = root.id || 'traitPanel';
    const visible = new Set(loadVisible(storage));

    this.details = doc.createElement('details');
    this.details.className = 'trait-panel';
    this.details.open = true;
    const summary = doc.createElement('summary');
    this.title = doc.createElement('h2');
    this.title.id = `${id}Title`;
    summary.append(this.title);

    const body = doc.createElement('div');
    body.className = 'trait-panel-body';

    this.canvas = doc.createElement('canvas');
    this.canvas.className = 'trait-chart';
    this.canvas.width = 220;
    this.canvas.height = 140;
    this.canvas.setAttribute('role', 'img');
    const legendId = `${id}Legend`;
    this.canvas.setAttribute('aria-describedby', legendId);

    const legend = doc.createElement('div');
    legend.id = legendId;
    legend.className = 'trait-legend';

    const fieldset = doc.createElement('fieldset');
    fieldset.className = 'trait-toggles';
    this.fieldsetLegend = doc.createElement('legend');
    fieldset.append(this.fieldsetLegend);
    for (const trait of GENOME_TRAITS) {
      const label = doc.createElement('label');
      const input = doc.createElement('input');
      input.type = 'checkbox';
      input.id = `${id}-show-${trait}`;
      input.value = trait;
      input.checked = visible.has(trait);
      input.addEventListener('change', () => this.onToggle());
      const text = doc.createElement('span');
      label.htmlFor = input.id;
      label.append(input, text);
      fieldset.append(label);
      this.labels.set(trait, { label, text, input });
    }

    body.append(this.canvas, legend, fieldset);
    this.details.append(summary, body);
    root.replaceChildren(this.details);
    root.setAttribute('aria-labelledby', this.title.id);

    this.chart = new TraitChart(this.canvas, legend);
    this.relabel(false);
    this.chart.setVisibleTraits(visible);

    // A collapsed or resized panel has a stale backing store; redraw when it becomes visible again.
    this.details.addEventListener('toggle', () => {
      if (this.details.open) this.chart.render();
    });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.chart.render());
      this.resizeObserver.observe(this.canvas);
    }
    i18n.onLanguageChange(this.onLanguage);
  }

  update(snapshots: readonly GenomeSnapshot[]): void {
    this.chart.update(snapshots);
  }

  /** New game: clear the chart. Trait choices are kept (they are a session preference). */
  reset(): void {
    this.chart.reset();
  }

  getVisibleTraits(): Trait[] {
    return this.chart.getVisibleTraits();
  }

  destroy(): void {
    i18n.offLanguageChange(this.onLanguage);
    this.resizeObserver?.disconnect();
  }

  private onToggle(): void {
    const visible = GENOME_TRAITS.filter((t) => this.labels.get(t)?.input.checked);
    try {
      this.storage?.setItem(TRAIT_VISIBILITY_STORAGE_KEY, JSON.stringify(visible));
    } catch {
      // storage full or blocked: the choice still applies for this page
    }
    this.chart.setVisibleTraits(visible);
  }

  private relabel(render = true): void {
    this.title.textContent = i18n.t('genome.title');
    this.fieldsetLegend.textContent = i18n.t('genome.showTraits');
    this.canvas.setAttribute('aria-label', i18n.t('genome.chartLabel'));
    for (const [trait, { label, text }] of this.labels) {
      text.textContent = i18n.t(`genome.trait.${trait}`);
      label.title = i18n.t(`genome.traitHelp.${trait}`);
    }
    if (render) this.chart.render();
  }
}
