import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/ui/notifications', () => ({ showNotification: vi.fn() }));

import { createClassicConfigForm, DEFAULT_CLASSIC_CONFIG } from '../../src/classic/ClassicConfigForm';
import { createClassicSession } from '../../src/classic/ClassicSession';
import { ConfigPanel } from '../../src/ui/ConfigPanel';
import { bodyHtml } from '../ui/configFixture';

describe('ClassicSession (W0 stub)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const make = () => {
    const session = createClassicSession(document.createElement('canvas'), document.createElement('div'));
    session.onRoundComplete = vi.fn();
    session.onStepComplete = vi.fn();
    return session;
  };

  it('begin() runs unless paused; generations advance on the timer', () => {
    const session = make();
    session.setSpeed(100);
    session.begin(DEFAULT_CLASSIC_CONFIG, { startPaused: false });
    expect(session.running()).toBe(true);
    session.start(); // no-op while running
    vi.advanceTimersByTime(300);
    expect(session.getGeneration()).toBe(3);
    session.pause();
    vi.advanceTimersByTime(300);
    expect(session.getGeneration()).toBe(3);
    session.end();
    expect(session.getGeneration()).toBe(0);
    expect(session.isOver()).toBe(false);
  });

  it('paused and draw starts do not run; steps fire onStepComplete once per sequence', () => {
    const session = make();
    session.begin({ ...DEFAULT_CLASSIC_CONFIG, start: { kind: 'draw' } }, { startPaused: false });
    expect(session.running()).toBe(false);
    session.step();
    expect(session.getGeneration()).toBe(1);
    expect(session.onStepComplete).toHaveBeenCalledTimes(1);
    session.stepRounds(3);
    vi.advanceTimersByTime(1000);
    expect(session.getGeneration()).toBe(4);
    expect(session.onStepComplete).toHaveBeenCalledTimes(2);
    expect(session.onRoundComplete).toHaveBeenCalledTimes(4);
    session.fit(100, 100);
    session.destroy();
    expect(session.running()).toBe(false);
  });
});

describe('ClassicConfigForm (W0 stub)', () => {
  it('registers as a plugin and emits the default classic config', () => {
    document.body.innerHTML = bodyHtml;
    const panel = new ConfigPanel();
    const form = createClassicConfigForm(document.getElementById('classicConfigMount')!, panel);
    expect(form.read()).toEqual({ width: 50, height: 50, rule: 'B3/S23', start: { kind: 'random', density: 0.3 } });
    expect(form.validate?.('classic')).toBe(0);
    expect(form.startOptions?.()).toEqual({ classic: form.read() });
    expect(form.save?.()).toEqual(form.read());
    form.load?.({});
    const onStart = vi.fn();
    panel.onStart(onStart);
    panel.setMode('classic');
    document.getElementById('startGameBtn')!.click();
    expect(onStart.mock.calls[0][1].classic).toEqual(DEFAULT_CLASSIC_CONFIG);
    form.destroy();
    panel.destroy();
  });
});
