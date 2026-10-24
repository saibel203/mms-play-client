import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

/**
 * Modal question built on the native <dialog>: focus trap, Esc and the backdrop come from the browser.
 * Fully controlled: `open` shows it, and closing is only requested through `cancelled`,
 * so the owner's state always decides whether it is visible. The body is projected content.
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly heading = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  /** Red confirm button, for actions that cannot be undone. */
  readonly danger = input(false);
  /** Disables both buttons while the confirmed action is running. */
  readonly busy = input(false);
  readonly error = input<string | null>(null);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    // showModal() / close() are imperative DOM calls, so they are driven by an effect
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) {
        dialog.showModal();
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }

  /** Esc: the browser would close the dialog on its own, the owner decides instead. */
  protected onCancel(event: Event): void {
    event.preventDefault();
    this.requestCancel();
  }

  protected requestCancel(): void {
    if (!this.busy()) {
      this.cancelled.emit();
    }
  }
}
