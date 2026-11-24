import { i18n } from '../i18n/i18n';

/**
 * Line graph of total human population over time (PRD 3.10.2).
 *
 * The maximum is tracked incrementally as history grows, so a long run never
 * does `Math.max(...history)` (which overflows the call stack on big arrays).
 * Rendering is capped at ~1 point per horizontal pixel.
 */
export class PopulationGraph {
  private readonly ctx: CanvasRenderingContext2D | null;
  private runningMax = 1;
  private seen = 0;
  private readonly padding = 20;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  /** Forget the running max (new game). */
  reset(): void {
    this.runningMax = 1;
    this.seen = 0;
  }

  getMax(): number {
    return this.runningMax;
  }

  /** Fold any new history entries into the running max. */
  private updateMax(history: readonly number[]): void {
    if (history.length < this.seen) this.reset(); // history was cleared
    for (let i = this.seen; i < history.length; i++) {
      if (history[i] > this.runningMax) this.runningMax = history[i];
    }
    this.seen = history.length;
  }

  render(history: readonly number[]): void {
    this.updateMax(history);
    const ctx = this.ctx;
    if (!ctx) return;

    const { width, height } = this.canvas;
    const padding = this.padding;

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);

    if (history.length < 2) {
      ctx.fillStyle = '#595959';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i18n.t('stats.waitingForData'), width / 2, height / 2);
      return;
    }

    const maxPop = this.runningMax;
    const minPop = 0;
    const range = maxPop - minPop || 1;

    // Axes
    ctx.strokeStyle = '#767676';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Y labels
    ctx.fillStyle = '#595959';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(maxPop), padding - 5, padding + 5);
    ctx.fillText(String(minPop), padding - 5, height - padding + 5);

    // Line (downsampled to at most one point per pixel)
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    const last = history.length - 1;
    const stride = Math.max(1, Math.ceil(history.length / Math.max(graphWidth, 1)));

    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i <= last; i += stride) {
      this.plot(ctx, i, history[i], last, graphWidth, graphHeight, range, first);
      first = false;
    }
    if (last % stride !== 0) {
      this.plot(ctx, last, history[last], last, graphWidth, graphHeight, range, false);
    }
    ctx.stroke();

    // X labels
    ctx.fillStyle = '#595959';
    ctx.textAlign = 'center';
    ctx.fillText(i18n.t('stats.graphRound', last), width - padding, height - padding + 15);
    ctx.fillText(i18n.t('stats.graphRound', 0), padding, height - padding + 15);
  }

  private plot(
    ctx: CanvasRenderingContext2D,
    index: number,
    value: number,
    last: number,
    graphWidth: number,
    graphHeight: number,
    range: number,
    moveTo: boolean,
  ): void {
    const x = this.padding + (index / last) * graphWidth;
    const y = this.canvas.height - this.padding - (value / range) * graphHeight;
    if (moveTo) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}
