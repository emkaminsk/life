/**
 * Minimal accessible modal dialog controller: toggles the `active` class,
 * moves focus into the dialog on open, keeps Tab inside it, and returns focus
 * to the element that opened it on close. Escape is handled by the global
 * keyboard handler (see keyboard.ts) via close(), unless `closeOnEscape` is set.
 */
export interface DialogController {
  open(): void;
  close(): void;
  isOpen(): boolean;
}

export interface DialogOptions {
  closeButton?: HTMLElement | null;
  /** Element focused on open (defaults to the close button, then the first focusable). */
  initialFocus?: HTMLElement | null;
  /** Let the dialog itself close on Escape (for dialogs keyboard.ts does not know about). */
  closeOnEscape?: boolean;
  /** Called after every close, whatever triggered it (button, backdrop, Escape, close()). */
  onClose?: () => void;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function canTakeFocus(el: HTMLElement | null): el is HTMLElement {
  return !!el && el.isConnected && !(el as HTMLButtonElement).disabled;
}

export function createDialog(overlay: HTMLElement, options: DialogOptions = {}): DialogController {
  let returnFocusTo: HTMLElement | null = null;

  const isOpen = () => overlay.classList.contains('active');

  const close = () => {
    if (!isOpen()) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    // The opener may have been disabled or removed meanwhile (e.g. after the game ended).
    if (canTakeFocus(returnFocusTo)) returnFocusTo.focus();
    returnFocusTo = null;
    options.onClose?.();
  };

  const open = () => {
    if (isOpen()) return;
    returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    overlay.classList.add('active');
    overlay.removeAttribute('aria-hidden');
    (options.initialFocus ?? options.closeButton ?? overlay.querySelector<HTMLElement>(FOCUSABLE))?.focus();
  };

  options.closeButton?.addEventListener('click', close);

  // Clicking the backdrop (outside the content) closes the dialog (PRD 3.11.7).
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape' && options.closeOnEscape) {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    // Focus trap: keep Tab / Shift+Tab inside the dialog while it is open.
    const focusables = Array.from(overlay.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    // Focus on a non-tabbable element (e.g. a heading focused on open) wraps like an edge.
    const onTabbable = !!active && focusables.includes(active);
    if (e.shiftKey && (active === first || !onTabbable)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !onTabbable)) {
      e.preventDefault();
      first.focus();
    }
  });

  return { open, close, isOpen };
}
