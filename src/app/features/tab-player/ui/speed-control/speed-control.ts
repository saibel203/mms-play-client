import { DecimalPipe } from '@angular/common';
import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';

/**
 * Button showing the current speed; opens a popover with Songsterr-like presets
 * and a 15–200% slider (1% steps) below them for anything in between.
 */
@Component({
  selector: 'app-speed-control',
  imports: [DecimalPipe],
  templateUrl: './speed-control.html',
  styleUrl: './speed-control.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
})
export class SpeedControl {
  /** Playback speed multiplier, 1 = original tempo. */
  readonly speed = input(1);
  /** Current tempo in BPM with the speed applied; 0 when unknown. */
  readonly tempo = input(0);

  readonly speedChange = output<number>();

  protected readonly minPercent = 15;
  protected readonly maxPercent = 200;
  protected readonly presets = [15, 25, 50, 75, 100, 125, 150, 175, 200];

  protected readonly isOpen = signal(false);
  protected readonly percent = computed(() => Math.round(this.speed() * 100));

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected toggle(): void {
    this.isOpen.update((open) => !open);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected onSliderInput(event: Event): void {
    this.setPercent(Number((event.target as HTMLInputElement).value));
  }

  protected nudge(delta: number): void {
    this.setPercent(this.percent() + delta);
  }

  protected setPercent(value: number): void {
    const clamped = Math.min(this.maxPercent, Math.max(this.minPercent, value));
    if (clamped !== this.percent()) {
      this.speedChange.emit(clamped / 100);
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
