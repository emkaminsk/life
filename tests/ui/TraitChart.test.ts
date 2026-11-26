import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TraitChart, TRAIT_COLORS, traitRange, DEFAULT_VISIBLE_TRAITS } from '../../src/ui/TraitChart';
import type { Genome, GenomeSnapshot } from '../../src/types';
import { i18n } from '../../src/i18n/i18n';
import { Language } from '../../src/i18n/types';
import { chartCanvas, type recordingContext } from './traitCanvasStub';

const genome = (over: Partial<Genome> = {}): Genome => ({
  maxHealth: 100,
  strength: 1,
  metabolism: 0.5,
  greed: 0.5,
  caution: 0.5,
  longevity: 1,
  ...over,
});
const snap = (round: number, male: Genome | null, female: Genome | null): GenomeSnapshot => ({
  round,
  maleAverage: male,
  femaleAverage: female,
});

const pointsOf = (ctx: ReturnType<typeof recordingContext>, color: string) => ctx.ops.filter((o) => o.color === color);

// Plot area for a 220×140 canvas (padding 36/8/8/18): x 36..212, y 8..122.
const PLOT_BOTTOM = 122;
const PLOT_H = 114;

describe('TraitChart', () => {
  beforeEach(() => {
    i18n.setLanguage(Language.EN);
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws when the canvas has no 2D context', () => {
    const canvas = document.createElement('canvas');
    canvas.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
    expect(() => new TraitChart(canvas)).toThrow(/2D context/);
  });

  it('shows a waiting message without data and a hint when no trait is selected', () => {
    const { canvas, ctx } = chartCanvas();
    const chart = new TraitChart(canvas);
    chart.render();
    expect(ctx.fillText).toHaveBeenCalledWith('Waiting for data...', 110, 70);

    chart.update([snap(0, genome(), genome())]);
    ctx.fillText.mockClear();
    ctx.ops.length = 0;
    chart.setVisibleTraits([]);
    expect(ctx.fillText).toHaveBeenCalledWith('Tick a trait to show it', 110, 70);
    expect(ctx.ops).toHaveLength(0);
  });

  it('defaults to the physical traits and draws one solid ♂ and one dashed ♀ line per visible trait', () => {
    const { canvas, ctx } = chartCanvas();
    const chart = new TraitChart(canvas);
    expect(chart.getVisibleTraits()).toEqual([...DEFAULT_VISIBLE_TRAITS]);

    chart.update([snap(0, genome(), genome()), snap(1, genome(), genome())]);

    for (const trait of DEFAULT_VISIBLE_TRAITS) {
      const male = pointsOf(ctx, TRAIT_COLORS[trait].male);
      const female = pointsOf(ctx, TRAIT_COLORS[trait].female);
      expect(male).toHaveLength(2);
      expect(female).toHaveLength(2);
      expect(male[0].dash).toEqual([]);
      expect(female[0].dash.length).toBeGreaterThan(0);
    }
    expect(pointsOf(ctx, TRAIT_COLORS.greed.male)).toHaveLength(0);
    expect(ctx.fillText).toHaveBeenCalledWith('Round 0', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith('Round 1', expect.any(Number), expect.any(Number));
  });

  it('setVisibleTraits re-renders with exactly the chosen traits', () => {
    const { canvas, ctx } = chartCanvas();
    const chart = new TraitChart(canvas);
    chart.update([snap(0, genome(), genome()), snap(1, genome(), genome())]);
    ctx.ops.length = 0;

    chart.setVisibleTraits(['longevity', 'caution']);

    expect(chart.getVisibleTraits()).toEqual(['caution', 'longevity']);
    const lineColors = new Set(Object.values(TRAIT_COLORS).flatMap((c) => [c.male, c.female]));
    const colors = new Set(ctx.ops.map((o) => o.color).filter((c) => lineColors.has(c)));
    expect(colors).toEqual(
      new Set([
        TRAIT_COLORS.caution.male,
        TRAIT_COLORS.caution.female,
        TRAIT_COLORS.longevity.male,
        TRAIT_COLORS.longevity.female,
      ]),
    );
  });

  it('puts ♂ and ♀ of a trait on one shared PRD scale so equal values coincide', () => {
    const { canvas, ctx } = chartCanvas();
    const chart = new TraitChart(canvas);
    chart.setVisibleTraits(['strength', 'greed']);
    chart.update([
      snap(0, genome({ strength: 2, greed: 0.5 }), genome({ strength: 1, greed: 0.5 })),
      snap(1, genome({ strength: 2, greed: 0.5 }), genome({ strength: 1, greed: 0.5 })),
    ]);

    // strength range is 0–2.5: 2 → 80 %, 1 → 40 % of the plot height
    expect(pointsOf(ctx, TRAIT_COLORS.strength.male)[0].y).toBeCloseTo(PLOT_BOTTOM - 0.8 * PLOT_H);
    expect(pointsOf(ctx, TRAIT_COLORS.strength.female)[0].y).toBeCloseTo(PLOT_BOTTOM - 0.4 * PLOT_H);
    // greed range is 0–1: equal values for both sexes land on the same pixel
    const mg = pointsOf(ctx, TRAIT_COLORS.greed.male)[0].y;
    expect(pointsOf(ctx, TRAIT_COLORS.greed.female)[0].y).toBe(mg);
    expect(mg).toBeCloseTo(PLOT_BOTTOM - 0.5 * PLOT_H);
  });

  it('widens an unbounded trait range to the observed maximum, shared by both sexes', () => {
    const data = [snap(0, genome({ maxHealth: 120 }), genome({ maxHealth: 200 }))];
    expect(traitRange('maxHealth', data)).toEqual({ min: 0, max: 200 });
    expect(traitRange('maxHealth', [snap(0, genome({ maxHealth: 90 }), null)])).toEqual({ min: 0, max: 150 });
    expect(traitRange('greed', data)).toEqual({ min: 0, max: 1 });
    expect(traitRange('longevity', data)).toEqual({ min: 0, max: 2.5 });
  });

  it('labels the Y axis in real units for a single trait and in % of range for several', () => {
    const { canvas, ctx } = chartCanvas();
    const chart = new TraitChart(canvas);
    chart.update([snap(0, genome(), genome()), snap(1, genome(), genome())]);
    expect(ctx.fillText).toHaveBeenCalledWith('100%', expect.any(Number), expect.any(Number));

    ctx.fillText.mockClear();
    chart.setVisibleTraits(['maxHealth']);
    expect(ctx.fillText).toHaveBeenCalledWith('150.0', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).not.toHaveBeenCalledWith('100%', expect.any(Number), expect.any(Number));
  });

  it('leaves a gap while a sex is extinct instead of drawing a fake 0', () => {
    const { canvas, ctx } = chartCanvas();
    const chart = new TraitChart(canvas);
    chart.setVisibleTraits(['strength']);
    chart.update([
      snap(0, genome(), genome()),
      snap(1, genome(), null),
      snap(2, genome(), null),
      snap(3, genome(), genome()),
    ]);
    const female = pointsOf(ctx, TRAIT_COLORS.strength.female);
    expect(female.map((p) => p.op)).toEqual(['moveTo', 'moveTo']);
    expect(female.every((p) => p.y < PLOT_BOTTOM)).toBe(true);
    expect(pointsOf(ctx, TRAIT_COLORS.strength.male).map((p) => p.op)).toEqual([
      'moveTo',
      'lineTo',
      'lineTo',
      'lineTo',
    ]);
  });

  it('draws at most about one point per pixel and always includes the latest round', () => {
    const { canvas, ctx } = chartCanvas();
    const chart = new TraitChart(canvas);
    chart.setVisibleTraits(['strength']);
    const data = Array.from({ length: 5001 }, (_, r) => snap(r, genome({ strength: r === 5000 ? 2.5 : 1 }), null));
    chart.update(data);
    const male = pointsOf(ctx, TRAIT_COLORS.strength.male);
    expect(male.length).toBeLessThanOrEqual(176 + 2);
    expect(male[male.length - 1]?.x).toBeCloseTo(212);
    expect(male[male.length - 1]?.y).toBeCloseTo(8); // the 2.5 at round 5000 is at the top of the plot
  });

  it('renders into a HiDPI backing store and draws in CSS pixels', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const { canvas, ctx } = chartCanvas(220, 140);
    const chart = new TraitChart(canvas);
    chart.update([snap(0, genome(), genome())]);
    expect(canvas.width).toBe(440);
    expect(canvas.height).toBe(280);
    expect(ctx.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);
    // a second render must not grow the canvas again
    chart.render();
    expect(canvas.width).toBe(440);
  });

  describe('legend', () => {
    const data = [snap(0, genome(), genome()), snap(5, genome({ maxHealth: 112.34, strength: 1.256 }), null)];

    it('lists the visible traits with localized names and current ♂/♀ values (EN)', () => {
      const { canvas } = chartCanvas();
      const legend = document.createElement('div');
      const chart = new TraitChart(canvas, legend);
      chart.update(data);

      const rows = [...legend.querySelectorAll('tbody tr')];
      expect(rows.map((r) => (r as HTMLElement).dataset.trait)).toEqual(['maxHealth', 'strength', 'metabolism']);
      const cells = (i: number) => [...rows[i].children].map((c) => c.textContent);
      expect(cells(0)).toEqual(['Max health', '112.3', 'none alive']);
      expect(cells(1)).toEqual(['Strength', '1.26', 'none alive']);
      expect((rows[0] as HTMLElement).title).toBe('Max health: males 112.3, females none alive (range 0.0–150.0)');
      expect(legend.querySelector('thead abbr')?.getAttribute('title')).toBe('Males');
    });

    it('uses Polish names and decimal commas in PL', () => {
      i18n.setLanguage(Language.PL);
      const { canvas } = chartCanvas();
      const legend = document.createElement('div');
      const chart = new TraitChart(canvas, legend);
      chart.update(data);
      const first = [...legend.querySelectorAll('tbody tr')[0].children].map((c) => c.textContent);
      expect(first).toEqual(['Maks. zdrowie', '112,3', 'brak żywych']);
      expect(legend.querySelector('thead abbr')?.getAttribute('title')).toBe('Mężczyźni');
    });

    it('colours the swatches like the lines', () => {
      const { canvas } = chartCanvas();
      const legend = document.createElement('div');
      const chart = new TraitChart(canvas, legend);
      chart.setVisibleTraits(['caution']);
      chart.update(data);
      const male = legend.querySelector<HTMLElement>('.trait-swatch-male');
      const probe = document.createElement('span');
      probe.style.borderColor = TRAIT_COLORS.caution.male;
      expect(male?.style.borderColor).toBe(probe.style.borderColor);
    });
  });
});
