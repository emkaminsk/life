import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDialog } from '../../src/ui/dialog';
import { showNotification } from '../../src/ui/notifications';
import { isLargeBoard, runWithProgress } from '../../src/ui/initProgress';
import { debounce } from '../../src/ui/debounce';

describe('createDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="opener">?</button>
      <div id="overlay" role="dialog" aria-modal="true">
        <div class="content"><button id="close" aria-label="Close">×</button><button id="other">x</button></div>
      </div>`;
  });

  it('opens, focuses the close button and returns focus on close', () => {
    const overlay = document.getElementById('overlay')!;
    const opener = document.getElementById('opener')!;
    const dialog = createDialog(overlay, { closeButton: document.getElementById('close') });
    opener.focus();
    dialog.open();
    expect(dialog.isOpen()).toBe(true);
    expect(document.activeElement?.id).toBe('close');
    dialog.close();
    expect(dialog.isOpen()).toBe(false);
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(opener);
  });

  it('closes from the close button and from a backdrop click, not from content clicks', () => {
    const overlay = document.getElementById('overlay')!;
    const dialog = createDialog(overlay, { closeButton: document.getElementById('close') });
    dialog.open();
    document.getElementById('other')!.click();
    expect(dialog.isOpen()).toBe(true);
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog.isOpen()).toBe(false);
    dialog.open();
    document.getElementById('close')!.click();
    expect(dialog.isOpen()).toBe(false);
  });
});

describe('showNotification', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="notificationContainer" role="status" aria-live="polite"></div>';
  });

  it('renders title and message as text, not HTML', () => {
    const n = showNotification('<b>Title</b>', '<img src=x onerror=alert(1)>', 'error')!;
    expect(n.className).toBe('notification error');
    expect(n.querySelector('.notification-title')!.textContent).toBe('<b>Title</b>');
    expect(n.querySelector('img')).toBeNull();
    expect(n.querySelector('b')).toBeNull();
  });

  it('auto-dismisses and dismisses on click', () => {
    vi.useFakeTimers();
    const a = showNotification('a', 'b')!;
    const container = document.getElementById('notificationContainer')!;
    expect(container.children.length).toBe(1);
    vi.advanceTimersByTime(5200);
    expect(container.children.length).toBe(0);
    const b = showNotification('c', 'd')!;
    b.click();
    vi.advanceTimersByTime(200);
    expect(container.contains(b)).toBe(false);
    expect(a.isConnected).toBe(false);
    vi.useRealTimers();
  });

  it('returns null without a container', () => {
    document.body.innerHTML = '';
    expect(showNotification('a', 'b')).toBeNull();
  });
});

describe('runWithProgress', () => {
  const t = (key: string, ...args: (string | number)[]) => `${key}${args.length ? `:${args.join(',')}` : ''}`;

  function elements() {
    document.body.innerHTML = '<div id="o"><div id="b"></div><div id="t"></div></div>';
    return {
      overlay: document.getElementById('o'),
      bar: document.getElementById('b'),
      text: document.getElementById('t'),
    };
  }

  it('isLargeBoard is true only above 50 on a side', () => {
    expect(isLargeBoard(50, 50)).toBe(false);
    expect(isLargeBoard(51, 10)).toBe(true);
    expect(isLargeBoard(10, 51)).toBe(true);
  });

  it('runs small boards directly without the overlay', async () => {
    const els = elements();
    const work = vi.fn();
    await runWithProgress(work, false, els, t, async () => {});
    expect(work).toHaveBeenCalledTimes(1);
    expect(els.overlay!.classList.contains('active')).toBe(false);
  });

  it('shows an indeterminate overlay during work and reports 100% only when done', async () => {
    const els = elements();
    const seen: string[] = [];
    const work = vi.fn(() => {
      seen.push(els.text!.textContent!);
      expect(els.overlay!.classList.contains('active')).toBe(true);
      expect(els.bar!.classList.contains('indeterminate')).toBe(true);
    });
    const frames: string[] = [];
    await runWithProgress(work, true, els, t, async () => {
      frames.push(els.text!.textContent!);
    });
    expect(seen).toEqual(['init.working']);
    expect(frames).toEqual(['init.working', 'init.working', 'init.spawning:100']);
    expect(els.overlay!.classList.contains('active')).toBe(false);
  });

  it('hides the overlay even if initialization throws', async () => {
    const els = elements();
    await expect(
      runWithProgress(
        () => {
          throw new Error('boom');
        },
        true,
        els,
        t,
        async () => {},
      ),
    ).rejects.toThrow('boom');
    expect(els.overlay!.classList.contains('active')).toBe(false);
  });
});

describe('debounce', () => {
  it('runs once after the quiet period with the last arguments', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d(1);
    d(2);
    d(3);
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
    vi.useRealTimers();
  });
});
