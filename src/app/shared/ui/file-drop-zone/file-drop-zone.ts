import { Component, input, output, signal } from '@angular/core';

/** Generic drag & drop / click-to-browse file picker. Knows nothing about file contents. */
@Component({
  selector: 'app-file-drop-zone',
  templateUrl: './file-drop-zone.html',
  styleUrl: './file-drop-zone.scss',
})
export class FileDropZone {
  readonly accept = input('');
  readonly label = input('Drop a file here or click to browse');
  readonly hint = input('');
  readonly compact = input(false);

  readonly fileSelected = output<File>();

  protected readonly dragging = signal(false);

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files.item(0);
    if (file) {
      this.fileSelected.emit(file);
    }
  }

  protected onInputChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.item(0);
    if (file) {
      this.fileSelected.emit(file);
    }
    // Reset so selecting the same file again still triggers `change`.
    inputEl.value = '';
  }
}
