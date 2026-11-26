import { beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from '../../src/ui/debounce';
import { createDialog } from '../../src/ui/dialog';
import { isLargeBoard, runWithProgress } from '../../src/ui/initProgress';
import { showNotification } from '../../src/ui/notifications';

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

  const tab = (target: Element, shiftKey = false) => {
    const e = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
    target.dispatchEvent(e);
    return e;
  };

  it('Tab on the last focusable wraps to the first, Shift+Tab on the first wraps to the last', () => {
    // jsdom has no layout (offsetParent is always null): pretend everything is visible
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body);
    const overlay = document.getElementById('overlay')!;
    const close = document.getElementById('close')!;
    const other = document.getElementById('other')!;
    createDialog(overlay, { closeButton: close }).open();

    other.focus();
    expect(tab(other).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(close);

    expect(tab(close, true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(other);

    // in the middle the browser moves focus itself
    close.focus();
    expect(tab(close).defaultPrevented).toBe(false);
  });

  it('skips hidden and disabled controls when wrapping', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function (this: HTMLElement) {
      return this.id === 'hidden' ? null : document.body;
    });
    document
      .getElementById('overlay')!
      .querySelector('.content')!
      .insertAdjacentHTML('beforeend', '<button id="disabled" disabled>d</button><button id="hidden">h</button>');
    const close = document.getElementById('close')!;
    const other = document.getElementById('other')!;
    createDialog(document.getElementById('overlay')!, { closeButton: close }).open();
    other.focus();
    tab(other);
    expect(document.activeElement).toBe(close);
  });

  it('Tab is ignored when the dialog is closed', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body);
    const overlay = document.getElementById('overlay')!;
    createDialog(overlay, { closeButton: document.getElementById('close') });
    const other = document.getElementById('other')!;
    other.focus();
    expect(tab(other).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(other);
  });

  it('Escape closes only when closeOnEscape is set; onClose fires on every close', () => {
    const overlay = document.getElementById('overlay')!;
    const onClose = vi.fn();
    const plain = createDialog(overlay, { closeButton: document.getElementById('close'), onClose });
    plain.open();
    overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(plain.isOpen()).toBe(true); // keyboard.ts owns Escape for this dialog
    plain.close();
    expect(onClose).toHaveBeenCalledOnce();

    document.body.innerHTML = '<div id="o2"><button id="b2">x</button></div>';
    const o2 = document.getElementById('o2')!;
    const escaping = createDialog(o2, { closeOnEscape: true, onClose });
    escaping.open();
    expect(document.activeElement?.id).toBe('b2'); // first focusable by default
    o2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(escaping.isOpen()).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('does not return focus to an opener that became disabled', () => {
    const overlay = document.getElementById('overlay')!;
    const opener = document.getElementById('opener') as HTMLButtonElement;
    const dialog = createDialog(overlay, { closeButton: document.getElementById('close') });
    opener.focus();
    dialog.open();
    opener.disabled = true;
    dialog.close();
    expect(document.activeElement).not.toBe(opener);
  });

  it('destroy() and an aborted signal remove the listeners', () => {
    const overlay = document.getElementById('overlay')!;
    const close = document.getElementById('close')!;
    const dialog = createDialog(overlay, { closeButton: close });
    dialog.open();
    dialog.destroy();
    close.click();
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog.isOpen()).toBe(true);

    dialog.close();
    const owner = new AbortController();
    const other = createDialog(overlay, { closeButton: close, signal: owner.signal });
    other.open();
    owner.abort();
    close.click();
    expect(other.isOpen()).toBe(true);
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

  it('cancel() drops the pending call', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d(1);
    d.cancel();
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
    d.cancel(); // no-op when nothing is pending
    d(2);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith(2);
    vi.useRealTimers();
  });
});
