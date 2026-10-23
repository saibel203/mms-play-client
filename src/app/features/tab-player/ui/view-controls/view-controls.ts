import { Component, input, output } from '@angular/core';
import { ScoreLayout, StaveView, ViewOptions } from '../../models/player.models';

/** How the score is displayed: layout, notation type and zoom. */
@Component({
  selector: 'app-view-controls',
  templateUrl: './view-controls.html',
  styleUrl: './view-controls.scss',
})
export class ViewControls {
  readonly view = input.required<ViewOptions>();

  readonly layoutChange = output<ScoreLayout>();
  readonly staveViewChange = output<StaveView>();
  readonly zoomChange = output<number>();

  protected readonly layouts: { value: ScoreLayout; label: string }[] = [
    { value: 'page', label: 'Page' },
    { value: 'horizontal', label: 'Horizontal' },
  ];

  protected readonly staveViews: { value: StaveView; label: string }[] = [
    { value: 'tab', label: 'Tab' },
    { value: 'score-tab', label: 'Notes + Tab' },
    { value: 'score', label: 'Notes' },
  ];

  protected readonly zoomLevels = [0.6, 0.8, 1, 1.25, 1.5];

  protected onZoom(event: Event): void {
    this.zoomChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}
