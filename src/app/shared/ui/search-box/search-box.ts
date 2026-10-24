import { Component, DestroyRef, inject, input, output } from '@angular/core';

/**
 * Text field that reports what was typed once the user pauses, so a list is not
 * re-fetched on every keystroke. Enter and the clear button report immediately.
 */
@Component({
  selector: 'app-search-box',
  templateUrl: './search-box.html',
  styleUrl: './search-box.scss',
})
export class SearchBox {
  /** Current term, e.g. restored from the URL. */
  readonly value = input('');
  readonly placeholder = input('Search');
  readonly maxLength = input(100);
  readonly debounceMs = input(300);

  readonly termChange = output<string>();

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected onInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.emit(term), this.debounceMs());
  }

  protected onEnter(event: Event): void {
    this.emit((event.target as HTMLInputElement).value);
  }

  protected clear(field: HTMLInputElement): void {
    field.value = '';
    field.focus();
    this.emit('');
  }

  private emit(term: string): void {
    clearTimeout(this.timer);
    this.termChange.emit(term.trim());
  }
}
