/**
 * Minimal accessible modal dialog controller: toggles the `active` class,
 * moves focus into the dialog on open, keeps Tab inside it, and returns focus
 * to the element that opened it on close. Escape is handled by the global
 * keyboard handler (see keyboard.ts) via close().
 */
export interface DialogController {
  open(): void;
  close(): void;
  isOpen(): boolean;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function createDialog(
  overlay: HTMLElement,
  options: { closeButton?: HTMLElement | null; initialFocus?: HTMLElement | null } = {},
): DialogController {
  let returnFocusTo: HTMLElement | null = null;

  const isOpen = () => overlay.classList.contains('active');

  const close = () => {
    if (!isOpen()) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    returnFocusTo?.focus();
    returnFocusTo = null;
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

  // Focus trap: keep Tab / Shift+Tab inside the dialog while it is open.
  overlay.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !isOpen()) return;
    const focusables = Array.from(overlay.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  return { open, close, isOpen };
}
