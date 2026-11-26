import { describe, it, expect, beforeEach } from 'vitest';
import { TraitChart } from '../../src/ui/TraitChart';
import type { Genome, GenomeSnapshot } from '../../src/types';
import { canvasWithStub } from './canvasStub';
import { i18n } from '../../src/i18n/i18n';
import { Language } from '../../src/i18n/types';

const genome = (v: number): Genome => ({
  maxHealth: 100 * v,
  strength: v,
  metabolism: v / 2,
  greed: v / 3,
  caution: v / 4,
});
const snapshot = (round: number, m: number, f: number): GenomeSnapshot => ({
  round,
  maleAverage: genome(m),
  femaleAverage: genome(f),
});

describe('TraitChart', () => {
  beforeEach(() => {
    i18n.setLanguage(Language.EN);
    document.body.innerHTML = `
      <input type="checkbox" id="showMaxHealth" checked>
      <input type="checkbox" id="showStrength" checked>
      <input type="checkbox" id="showMetabolism">`;
  });

  it('throws for a missing canvas or context', () => {
    expect(() => new TraitChart('nope')).toThrow(/not found/);
    const canvas = document.createElement('canvas');
    canvas.id = 'noctx';
    document.body.appendChild(canvas);
    canvas.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
    expect(() => new TraitChart('noctx')).toThrow(/2D context/);
  });

  it('draws the empty state without history', () => {
    const { ctx } = canvasWithStub('traits');
    new TraitChart('traits').render();
    expect(ctx.fillText).toHaveBeenCalledWith('Waiting for data...', 150, 75);
    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it('draws one male and one female line per checked trait plus legend', () => {
    const { ctx } = canvasWithStub('traits');
    const chart = new TraitChart('traits');
    chart.updateHistory([snapshot(0, 1, 1), snapshot(1, 1.2, 0.9), snapshot(2, 1.4, 0.8)]);
    chart.render();
    // axes (1) + 2 traits × 2 sexes
    expect(ctx.stroke).toHaveBeenCalledTimes(5);
    expect(ctx.fillText).toHaveBeenCalledWith('Round 0', 30, 135);
    expect(ctx.fillText).toHaveBeenCalledWith('Round 2', 290, 135);
    expect(ctx.fillText).toHaveBeenCalledWith('MaxHealth', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith('Strength', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).not.toHaveBeenCalledWith('Metabolism', expect.any(Number), expect.any(Number));
  });

  it('handles a single snapshot without dividing by zero', () => {
    const { ctx } = canvasWithStub('traits');
    const chart = new TraitChart('traits');
    chart.updateHistory([snapshot(0, 1, 1)]);
    chart.render();
    for (const [x, y] of ctx.moveTo.mock.calls) {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }
  });
});
