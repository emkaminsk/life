import { i18n } from './i18n';

/**
 * DOMRenderer handles dynamic text updates for all elements with i18n attributes
 * Automatically updates UI when language changes
 */
export class DOMRenderer {
  /**
   * Update all elements with data-i18n attribute
   * Sets textContent from translation keys
   */
  updateTextContent(): void {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((element) => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        // Get data-i18n-args attribute for interpolation
        const argsAttr = element.getAttribute('data-i18n-args');
        const args = argsAttr ? argsAttr.split(',').map(arg => arg.trim()) : [];

        element.textContent = i18n.t(key, ...args);
      }
    });
  }

  /**
   * Update all elements with data-i18n-placeholder attribute
   * Sets placeholder property for input elements
   */
  updatePlaceholders(): void {
    const elements = document.querySelectorAll('[data-i18n-placeholder]');
    elements.forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (key && element instanceof HTMLInputElement) {
        element.placeholder = i18n.t(key);
      }
    });
  }

  /**
   * Update all elements with data-i18n-title attribute
   * Sets title attribute for tooltips
   */
  updateTooltips(): void {
    const elements = document.querySelectorAll('[data-i18n-title]');
    elements.forEach((element) => {
      const key = element.getAttribute('data-i18n-title');
      if (key) {
        element.setAttribute('title', i18n.t(key));
      }
    });
  }

  /**
   * Update all elements with data-i18n-aria-label attribute
   * Sets aria-label for accessibility
   */
  updateAriaLabels(): void {
    const elements = document.querySelectorAll('[data-i18n-aria-label]');
    elements.forEach((element) => {
      const key = element.getAttribute('data-i18n-aria-label');
      if (key) {
        element.setAttribute('aria-label', i18n.t(key));
      }
    });
  }

  /**
   * Update all i18n-related DOM elements
   * Call this method on language change and page load
   */
  updateDOM(): void {
    this.updateTextContent();
    this.updatePlaceholders();
    this.updateTooltips();
    this.updateAriaLabels();
  }
}

/**
 * Global singleton instance of DOMRenderer
 */
export const domRenderer = new DOMRenderer();

/**
 * Initialize DOMRenderer and setup language change listener
 * Call this once on application startup
 */
export function initializeDOMRenderer(): void {
  // Initial render
  domRenderer.updateDOM();

  // Listen for language changes and update DOM
  i18n.onLanguageChange(() => {
    domRenderer.updateDOM();
  });
}
