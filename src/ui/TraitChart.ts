import { GENOME_TRAITS } from '../core/genomeStats';
import { i18n } from '../i18n/i18n';
import { Language } from '../i18n/types';
import type { Genome, GenomeSnapshot } from '../types';

export type Trait = keyof Genome;
type SexKey = 'maleAverage' | 'femaleAverage';

/** PRD 3.18.5: physical traits are shown by default, behavioural ones hidden. */
export const DEFAULT_VISIBLE_TRAITS: readonly Trait[] = ['maxHealth', 'strength', 'metabolism'];

/**
 * Line colours (PRD 3.18.4): males in blues, females in pinks/reds, picked dark enough for
 * ≥3:1 contrast on the light chart background. Female lines are also dashed so the two
 * sexes stay distinguishable without colour vision.
 */
export const TRAIT_COLORS: Readonly<Record<Trait, { male: string; female: string }>> = {
  maxHealth: { male: '#0d47a1', female: '#d81b60' }, // dark blue / pink
  strength: { male: '#3355d6', female: '#b0179a' }, // royal blue / magenta
  metabolism: { male: '#00838f', female: '#c2185b' }, // cyan / rose
  greed: { male: '#0277bd', female: '#d84315' }, // sky blue / coral
  caution: { male: '#4a6f94', female: '#c62828' }, // steel blue / crimson
  longevity: { male: '#1a237e', female: '#7f1d1d' }, // navy / maroon
};

/**
 * Lower bound of each trait's Y-axis maximum (PRD 3.18.6): 0–150 health, 0–2.5 multipliers,
 * 0–1 probabilities. Metabolism is clamped to 0–1 by GENE_BOUNDS, so it uses 0–1.
 * Unbounded genes (maxHealth, strength) widen the range when a population exceeds it.
 */
const BASE_MAX: Readonly<Record<Trait, number>> = {
  maxHealth: 150,
  strength: 2.5,
  metabolism: 1,
  greed: 1,
  caution: 1,
  longevity: 2.5,
};

/** Shared Y range of a trait: identical for ♂ and ♀ so their lines are directly comparable. */
export function traitRange(trait: Trait, snapshots: readonly GenomeSnapshot[]): { min: number; max: number } {
  let max = BASE_MAX[trait];
  for (const s of snapshots) {
    const m = s.maleAverage?.[trait];
    const f = s.femaleAverage?.[trait];
    if (m !== undefined && m > max) max = m;
    if (f !== undefined && f > max) max = f;
  }
  return { min: 0, max };
}

/** Locale-aware value text: health with 1 decimal, the other genes with 2. */
export function formatTraitValue(trait: Trait, value: number): string {
  const digits = trait === 'maxHealth' ? 1 : 2;
  const locale = i18n.getCurrentLanguage() === Language.PL ? 'pl-PL' : 'en-US';
  return value.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

const PAD = { left: 36, right: 8, top: 8, bottom: 18 };

function deviceRatio(): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  return Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
}

/**
 * Genome evolution graph (PRD 3.18): average gene value per round for males (solid) and
 * females (dashed). Every line is drawn as a share of its trait's shared range; a sex that is
 * extinct leaves a gap. Draws at most ~1 point per horizontal pixel and renders into a HiDPI
 * backing store. The optional legend element gets a localized table with the current values.
 */
export class TraitChart {
  private readonly ctx: CanvasRenderingContext2D;
  private snapshots: readonly GenomeSnapshot[] = [];
  private visible: Set<Trait> = new Set(DEFAULT_VISIBLE_TRAITS);
  /** CSS-pixel size used when the canvas is not laid out (e.g. hidden or jsdom). */
  private readonly fallbackWidth: number;
  private readonly fallbackHeight: number;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly legend: HTMLElement | null = null,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context from canvas');
    this.ctx = ctx;
    this.fallbackWidth = canvas.width;
    this.fallbackHeight = canvas.height;
  }

  /** Show exactly these traits (in display order) and re-render. */
  setVisibleTraits(traits: Iterable<Trait>): void {
    this.visible = new Set([...traits].filter((t) => GENOME_TRAITS.includes(t)));
    this.render();
  }

  getVisibleTraits(): Trait[] {
    return GENOME_TRAITS.filter((t) => this.visible.has(t));
  }

  /** Replace the data and re-render. The last snapshot provides the legend's current values. */
  update(snapshots: readonly GenomeSnapshot[]): void {
    this.snapshots = snapshots;
    this.render();
  }

  reset(): void {
    this.update([]);
  }

  render(): void {
    const { width, height } = this.prepareCanvas();
    const ctx = this.ctx;
    const colors = this.themeColors();
    const traits = this.getVisibleTraits();

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
    this.renderLegend(traits);

    const message =
      this.snapshots.length === 0
        ? i18n.t('genome.waitingForData')
        : traits.length === 0
          ? i18n.t('genome.noTraitsSelected')
          : null;
    if (message) {
      ctx.fillStyle = colors.text;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(message, width / 2, height / 2);
      return;
    }

    const plot = {
      x: PAD.left,
      y: PAD.top,
      w: Math.max(1, width - PAD.left - PAD.right),
      h: Math.max(1, height - PAD.top - PAD.bottom),
    };
    this.drawAxes(plot, traits, colors);

    const first = this.snapshots[0].round;
    const span = this.snapshots[this.snapshots.length - 1].round - first;
    const xOf = (round: number) => plot.x + (span > 0 ? ((round - first) / span) * plot.w : 0);

    for (const trait of traits) {
      const { max } = traitRange(trait, this.snapshots);
      const yOf = (value: number) => plot.y + plot.h - (Math.min(value, max) / max) * plot.h;
      this.drawLine(trait, 'maleAverage', TRAIT_COLORS[trait].male, [], xOf, yOf, plot.w);
      this.drawLine(trait, 'femaleAverage', TRAIT_COLORS[trait].female, [4, 3], xOf, yOf, plot.w);
    }
  }

  /** Size the backing store to CSS size × devicePixelRatio; returns the drawing size in CSS px. */
  private prepareCanvas(): { width: number; height: number } {
    const width = this.canvas.clientWidth || this.fallbackWidth;
    const height = this.canvas.clientHeight || this.fallbackHeight;
    const dpr = deviceRatio();
    const backingW = Math.round(width * dpr);
    const backingH = Math.round(height * dpr);
    if (this.canvas.width !== backingW) this.canvas.width = backingW;
    if (this.canvas.height !== backingH) this.canvas.height = backingH;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
  }

  /** Chart colours from CSS custom properties on the canvas (theme hook), with light defaults. */
  private themeColors(): { bg: string; axis: string; grid: string; text: string } {
    const style = typeof getComputedStyle === 'function' ? getComputedStyle(this.canvas) : null;
    const read = (name: string, fallback: string) => style?.getPropertyValue(name).trim() || fallback;
    return {
      bg: read('--trait-chart-bg', '#fafafa'),
      axis: read('--trait-chart-axis', '#767676'),
      grid: read('--trait-chart-grid', '#e0e0e0'),
      text: read('--trait-chart-text', '#595959'),
    };
  }

  private drawAxes(
    plot: { x: number; y: number; w: number; h: number },
    traits: Trait[],
    colors: { axis: string; grid: string; text: string },
  ): void {
    const ctx = this.ctx;
    const bottom = plot.y + plot.h;
    // With one trait the axis shows real values; otherwise each line is a % of its own range.
    const single = traits.length === 1 ? traits[0] : null;
    const singleMax = single ? traitRange(single, this.snapshots).max : 0;

    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    for (const share of [0, 0.5, 1]) {
      const y = bottom - share * plot.h;
      ctx.strokeStyle = share === 0 ? colors.axis : colors.grid;
      ctx.beginPath();
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
      ctx.stroke();
      ctx.fillStyle = colors.text;
      const label = single ? formatTraitValue(single, share * singleMax) : `${share * 100}%`;
      ctx.fillText(label, plot.x - 4, y + 3);
    }

    ctx.strokeStyle = colors.axis;
    ctx.beginPath();
    ctx.moveTo(plot.x, plot.y);
    ctx.lineTo(plot.x, bottom);
    ctx.stroke();

    ctx.fillStyle = colors.text;
    ctx.textAlign = 'left';
    ctx.fillText(i18n.t('stats.graphRound', this.snapshots[0].round), plot.x, bottom + 13);
    if (this.snapshots.length > 1) {
      ctx.textAlign = 'right';
      ctx.fillText(
        i18n.t('stats.graphRound', this.snapshots[this.snapshots.length - 1].round),
        plot.x + plot.w,
        bottom + 13,
      );
    }
  }

  /** One sex's line for one trait; null values lift the pen so extinction shows as a gap. */
  private drawLine(
    trait: Trait,
    sex: SexKey,
    color: string,
    dash: number[],
    xOf: (round: number) => number,
    yOf: (value: number) => number,
    plotWidth: number,
  ): void {
    const ctx = this.ctx;
    const data = this.snapshots;
    const last = data.length - 1;
    const stride = Math.max(1, Math.ceil(data.length / plotWidth));

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash(dash);
    ctx.beginPath();
    let penDown = false;
    for (let i = 0; i <= last; i = i === last ? last + 1 : Math.min(i + stride, last)) {
      const value = data[i][sex]?.[trait];
      if (value === undefined) {
        penDown = false;
        continue;
      }
      const x = xOf(data[i].round);
      const y = yOf(value);
      if (penDown) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
      penDown = true;
    }
    ctx.stroke();

    // Marker on the current value (also makes a single-round history visible).
    const current = data[last][sex]?.[trait];
    if (current !== undefined) {
      ctx.fillStyle = color;
      ctx.fillRect(xOf(data[last].round) - 2, yOf(current) - 2, 4, 4);
    }
  }

  /** Localized table: trait (with ♂/♀ swatches), current male value, current female value. */
  private renderLegend(traits: Trait[]): void {
    const legend = this.legend;
    if (!legend) return;
    const latest = this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
    const doc = legend.ownerDocument;
    const cell = (tag: 'th' | 'td', text: string, className?: string) => {
      const el = doc.createElement(tag);
      el.textContent = text;
      if (className) el.className = className;
      return el;
    };
    const valueText = (trait: Trait, sex: SexKey) => {
      if (!latest) return '–';
      const genome = latest[sex];
      return genome ? formatTraitValue(trait, genome[trait]) : i18n.t('genome.extinct');
    };

    const table = doc.createElement('table');
    table.className = 'trait-legend-table';
    const head = doc.createElement('tr');
    head.append(cell('th', ''));
    for (const [short, long] of [
      ['genome.maleShort', 'genome.male'],
      ['genome.femaleShort', 'genome.female'],
    ]) {
      const th = cell('th', '');
      th.scope = 'col';
      const abbr = doc.createElement('abbr');
      abbr.title = i18n.t(long);
      abbr.textContent = i18n.t(short);
      th.append(abbr);
      head.append(th);
    }
    const thead = doc.createElement('thead');
    thead.append(head);
    const tbody = doc.createElement('tbody');

    for (const trait of traits) {
      const { min, max } = traitRange(trait, this.snapshots);
      const name = i18n.t(`genome.trait.${trait}`);
      const range = i18n.t('genome.range', formatTraitValue(trait, min), formatTraitValue(trait, max));
      const male = valueText(trait, 'maleAverage');
      const female = valueText(trait, 'femaleAverage');

      const row = doc.createElement('tr');
      row.dataset.trait = trait;
      row.title = i18n.t('genome.legendValue', name, male, female, range);
      const th = cell('th', '');
      th.scope = 'row';
      for (const sex of ['male', 'female'] as const) {
        const swatch = doc.createElement('span');
        swatch.className = `trait-swatch trait-swatch-${sex}`;
        swatch.style.borderColor = TRAIT_COLORS[trait][sex];
        swatch.setAttribute('aria-hidden', 'true');
        th.append(swatch);
      }
      th.append(name);
      row.append(th, cell('td', male, 'trait-value'), cell('td', female, 'trait-value'));
      tbody.append(row);
    }

    table.append(thead, tbody);
    legend.replaceChildren(table);
  }
}
