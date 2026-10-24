import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';

export type ColorScheme = 'light' | 'dark';

/** Also read by the inline script in index.html: keep both in sync. */
const STORAGE_KEY = 'mms-play.theme';

/**
 * Light / dark theme of the whole app. Until the user picks one, the OS setting is followed
 * (and tracked live); the explicit choice is remembered in localStorage.
 *
 * Applies the scheme as `<html data-theme="dark">`; styles.scss switches the design tokens on it.
 */
@Injectable({ providedIn: 'root' })
export class ColorTheme {
  private readonly document = inject(DOCUMENT);
  private readonly root = this.document.documentElement;
  private readonly systemQuery = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');

  private readonly system = signal<ColorScheme>(this.systemQuery?.matches ? 'dark' : 'light');
  private readonly chosen = signal<ColorScheme | null>(readChoice());

  readonly scheme = computed(() => this.chosen() ?? this.system());
  readonly isDark = computed(() => this.scheme() === 'dark');

  constructor() {
    // a root service lives as long as the app, so the listener never needs removing
    this.systemQuery?.addEventListener('change', (e) => this.system.set(e.matches ? 'dark' : 'light'));

    effect(() => {
      const scheme = this.scheme();
      this.root.dataset['theme'] = scheme;
      // native controls (scrollbars, range inputs, dialogs) follow it too
      this.root.style.colorScheme = scheme;
    });
  }

  set(scheme: ColorScheme): void {
    this.chosen.set(scheme);
    saveChoice(scheme);
  }

  toggle(): void {
    this.set(this.isDark() ? 'light' : 'dark');
  }
}

// storage can be unavailable (private mode, blocked cookies): the theme then lasts for the session only
function readChoice(): ColorScheme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function saveChoice(scheme: ColorScheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, scheme);
  } catch {
    // see readChoice
  }
}
