import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isLargeBoard,
  type ProgressElements,
  type ReportProgress,
  runWithProgress,
  toPercent,
} from '../../src/ui/initProgress';

const t = (key: string, ...args: (string | number)[]) => (args.length ? `${key}:${args.join(',')}` : key);
const frame = () => Promise.resolve();

function setup(): ProgressElements & { overlay: HTMLElement; bar: HTMLElement; text: HTMLElement } {
  document.body.innerHTML = `
    <div id="initProgress">
      <div class="progress-bar-container" role="progressbar"><div id="progressBar"></div></div>
      <div id="progressText"></div>
    </div>`;
  return {
    overlay: document.getElementById('initProgress') as HTMLElement,
    bar: document.getElementById('progressBar') as HTMLElement,
    text: document.getElementById('progressText') as HTMLElement,
  };
}

const progressbar = () => document.querySelector('[role="progressbar"]') as HTMLElement;

describe('isLargeBoard / toPercent', () => {
  it('treats boards over 50 cells per side as large', () => {
    expect(isLargeBoard(50, 50)).toBe(false);
    expect(isLargeBoard(51, 10)).toBe(true);
    expect(isLargeBoard(10, 51)).toBe(true);
  });

  it('clamps fractions to an integer 0..100', () => {
    expect(toPercent(0.123)).toBe(12);
    expect(toPercent(-1)).toBe(0);
    expect(toPercent(3)).toBe(100);
    expect(toPercent(Number.NaN)).toBe(0);
    expect(toPercent(Number.POSITIVE_INFINITY)).toBe(100);
  });
});

describe('runWithProgress', () => {
  let els: ReturnType<typeof setup>;
  beforeEach(() => {
    els = setup();
  });

  it('drives a determinate bar from async work and reports aria values', async () => {
    const seen: { width: string; now: string | null; text: string; active: boolean }[] = [];
    const work = async (report: ReportProgress) => {
      for (const f of [0.25, 0.5]) {
        report(f);
        await Promise.resolve();
        seen.push({
          width: els.bar.style.width,
          now: progressbar().getAttribute('aria-valuenow'),
          text: els.text.textContent ?? '',
          active: els.overlay.classList.contains('active'),
        });
      }
    };

    await runWithProgress(work, true, els, t, frame);

    expect(seen).toEqual([
      { width: '25%', now: '25', text: 'init.spawning:25', active: true },
      { width: '50%', now: '50', text: 'init.spawning:50', active: true },
    ]);
    expect(progressbar().getAttribute('aria-valuemin')).toBe('0');
    expect(progressbar().getAttribute('aria-valuemax')).toBe('100');
    expect(progressbar().getAttribute('aria-valuenow')).toBe('100');
    expect(els.text.textContent).toBe('init.spawning:100');
    expect(els.overlay.classList.contains('active')).toBe(false);
    expect(els.overlay.hasAttribute('aria-busy')).toBe(false);
  });

  it('only updates the text when the integer percentage changes', async () => {
    const spy = vi.fn(t);
    await runWithProgress(
      (report) => {
        for (let i = 0; i <= 1000; i++) report(i / 1000); // 1001 reports, 101 distinct percentages
      },
      true,
      els,
      spy,
      frame,
    );
    const spawning = spy.mock.calls.filter(([key]) => key === 'init.spawning');
    expect(spawning).toHaveLength(101);
    expect(spawning.map(([, pct]) => pct)).toEqual(Array.from({ length: 101 }, (_, i) => i));
  });

  it('keeps the old synchronous call shape: indeterminate while working, 100% after', async () => {
    let during: { indeterminate: boolean; now: string | null; text: string } | null = null;
    await runWithProgress(
      () => {
        during = {
          indeterminate: els.bar.classList.contains('indeterminate'),
          now: progressbar().getAttribute('aria-valuenow'),
          text: els.text.textContent ?? '',
        };
      },
      true,
      els,
      t,
      frame,
    );
    expect(during).toEqual({ indeterminate: true, now: null, text: 'init.working' });
    expect(els.bar.classList.contains('indeterminate')).toBe(false);
    expect(progressbar().getAttribute('aria-valuenow')).toBe('100');
  });

  it('removes the overlay and rethrows when sync or async work fails', async () => {
    await expect(
      runWithProgress(
        () => {
          throw new Error('sync boom');
        },
        true,
        els,
        t,
        frame,
      ),
    ).rejects.toThrow('sync boom');
    expect(els.overlay.classList.contains('active')).toBe(false);

    await expect(
      runWithProgress(
        async (report) => {
          report(0.4);
          await Promise.resolve();
          throw new Error('async boom');
        },
        true,
        els,
        t,
        frame,
      ),
    ).rejects.toThrow('async boom');
    expect(els.overlay.classList.contains('active')).toBe(false);
    expect(els.overlay.hasAttribute('aria-busy')).toBe(false);
    expect(els.bar.classList.contains('indeterminate')).toBe(false);
  });

  it('runs (and awaits) work without the overlay on small boards', async () => {
    let finished = false;
    await runWithProgress(
      async (report) => {
        report(0.5);
        await Promise.resolve();
        finished = true;
      },
      false,
      els,
      t,
      frame,
    );
    expect(finished).toBe(true);
    expect(els.overlay.classList.contains('active')).toBe(false);
    expect(els.text.textContent).toBe('');
    expect(progressbar().hasAttribute('aria-valuenow')).toBe(false);
  });

  it('uses an explicit progressbar element when given', async () => {
    const explicit = document.createElement('div');
    await runWithProgress((report) => report(0.3), true, { ...els, progressbar: explicit }, t, frame);
    expect(explicit.getAttribute('aria-valuenow')).toBe('100');
    expect(progressbar().hasAttribute('aria-valuenow')).toBe(false);
  });

  it('paints the overlay before work starts, using the default frame scheduler', async () => {
    let activeAtStart = false;
    await runWithProgress(
      () => {
        activeAtStart = els.overlay.classList.contains('active');
      },
      true,
      els,
      t,
    );
    expect(activeAtStart).toBe(true);
  });
});
