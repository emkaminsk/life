import { Language, type TranslationKeys } from './types';
import { translations } from './translations';

/**
 * Event listener type for language change events
 */
type LanguageChangeListener = (language: Language) => void;

/**
 * Internationalization (i18n) class for managing language and translations
 * Supports English and Polish with localStorage persistence
 */
export class I18n {
  private currentLanguage: Language;
  private listeners: LanguageChangeListener[] = [];

  constructor() {
    // Load language from localStorage or default to English
    const stored = this.loadFromStorage();
    this.currentLanguage = stored || this.detectBrowserLanguage();
  }

  /**
   * Load language preference from localStorage
   */
  private loadFromStorage(): Language | null {
    try {
      const stored = localStorage.getItem('language');
      if (stored === Language.EN || stored === Language.PL) {
        return stored as Language;
      }
    } catch (e) {
      // localStorage not available or error
      console.warn('Could not load language from storage:', e);
    }
    return null;
  }

  /**
   * Detect browser language and default to appropriate language
   * Falls back to English if browser language not Polish
   */
  private detectBrowserLanguage(): Language {
    try {
      const browserLang = navigator.language || (navigator as any).userLanguage;
      if (browserLang && browserLang.toLowerCase().startsWith('pl')) {
        return Language.PL;
      }
    } catch (e) {
      // Error detecting browser language
      console.warn('Could not detect browser language:', e);
    }
    return Language.EN;
  }

  /**
   * Save language preference to localStorage
   */
  private saveToStorage(language: Language): void {
    try {
      localStorage.setItem('language', language);
    } catch (e) {
      console.warn('Could not save language to storage:', e);
    }
  }

  /**
   * Set current language and notify listeners
   */
  setLanguage(language: Language): void {
    if (this.currentLanguage !== language) {
      this.currentLanguage = language;
      this.saveToStorage(language);
      this.notifyListeners();
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Get translation for a key with optional interpolation
   * Supports dot notation for nested keys (e.g., 'header.title')
   * Supports string interpolation with {0}, {1}, etc. placeholders
   *
   * @param key - Translation key in dot notation (e.g., 'header.title')
   * @param args - Optional arguments for string interpolation
   * @returns Translated string
   *
   * @example
   * i18n.t('header.title') // "Game of Life Educational Simulator"
   * i18n.t('stats.pregnant', 3) // "3 pregnant"
   * i18n.t('stats.total', 50, 900) // "Total creatures: 50/900"
   */
  t(key: string, ...args: (string | number)[]): string {
    const translation = this.getNestedValue(translations[this.currentLanguage], key);

    if (translation === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key; // Return key as fallback
    }

    // Interpolate arguments if provided
    if (args.length > 0) {
      return this.interpolate(translation, args);
    }

    return translation;
  }

  /**
   * Get nested value from object using dot notation
   * @param obj - Object to traverse
   * @param path - Dot-separated path (e.g., 'header.title')
   */
  private getNestedValue(obj: any, path: string): string | undefined {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Interpolate string with arguments
   * Replaces {0}, {1}, etc. with corresponding arguments
   * @param str - String with placeholders
   * @param args - Arguments to interpolate
   */
  private interpolate(str: string, args: (string | number)[]): string {
    return str.replace(/\{(\d+)\}/g, (match, index) => {
      const argIndex = parseInt(index, 10);
      return argIndex < args.length ? String(args[argIndex]) : match;
    });
  }

  /**
   * Add listener for language change events
   * @param listener - Callback function to be called on language change
   */
  onLanguageChange(listener: LanguageChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove language change listener
   * @param listener - Callback function to remove
   */
  offLanguageChange(listener: LanguageChangeListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of language change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentLanguage));
  }

  /**
   * Get all translations for current language (for debugging/testing)
   */
  getTranslations(): TranslationKeys {
    return translations[this.currentLanguage];
  }
}

/**
 * Global singleton instance of I18n
 * Import this instance throughout the application
 */
export const i18n = new I18n();
