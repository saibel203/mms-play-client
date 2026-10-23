import {
  Component,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  input,
  output,
  viewChild,
} from '@angular/core';

export interface ScoreViewerElements {
  container: HTMLElement;
  scrollElement: HTMLElement;
}

/** Hosts the DOM element alphaTab renders into. The engine itself is attached by the page. */
@Component({
  selector: 'app-score-viewer',
  templateUrl: './score-viewer.html',
  styleUrl: './score-viewer.scss',
  // alphaTab injects its own DOM (cursor, selection), so styles must not be encapsulated.
  encapsulation: ViewEncapsulation.None,
})
export class ScoreViewer {
  readonly busy = input(false);

  readonly ready = output<ScoreViewerElements>();

  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly surface = viewChild.required<ElementRef<HTMLElement>>('surface');

  constructor() {
    afterNextRender(() =>
      this.ready.emit({
        container: this.surface().nativeElement,
        scrollElement: this.viewport().nativeElement,
      }),
    );
  }
}
