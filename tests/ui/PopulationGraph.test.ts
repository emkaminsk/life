import { describe, it, expect, beforeEach } from 'vitest';
import { PopulationGraph } from '../../src/ui/PopulationGraph';
import { canvasWithStub } from './canvasStub';
import { i18n } from '../../src/i18n/i18n';
import { Language } from '../../src/i18n/types';

describe('PopulationGraph', () => {
  beforeEach(() => {
    i18n.setLanguage(Language.EN);
    document.body.innerHTML = '';
  });

  it('shows a waiting message with fewer than two points', () => {
    const { canvas, ctx } = canvasWithStub('graph', 220, 120);
    new PopulationGraph(canvas).render([5]);
    expect(ctx.fillText).toHaveBeenCalledWith('Waiting for data...', 110, 60);
  });

  it('tracks a running max incrementally', () => {
    const { canvas } = canvasWithStub('graph', 220, 120);
    const graph = new PopulationGraph(canvas);
    const history = [10, 40, 20];
    graph.render(history);
    expect(graph.getMax()).toBe(40);
    history.push(15, 80);
    graph.render(history);
    expect(graph.getMax()).toBe(80);
    graph.render([3, 4]); // history cleared by a new game
    expect(graph.getMax()).toBe(4);
  });

  it('handles very long histories without spreading into Math.max', () => {
    const { canvas, ctx } = canvasWithStub('graph', 220, 120);
    const graph = new PopulationGraph(canvas);
    const history = Array.from({ length: 300_000 }, (_, i) => i % 1000);
    expect(() => graph.render(history)).not.toThrow();
    expect(graph.getMax()).toBe(999);
    // downsampled: roughly one point per horizontal pixel
    expect(ctx.lineTo.mock.calls.length).toBeLessThan(400);
    expect(ctx.fillText).toHaveBeenCalledWith('Round 299999', 200, 115);
  });
});
