import { Component, computed, inject } from '@angular/core';
import { FileDropZone } from '@shared/ui/file-drop-zone/file-drop-zone';
import { SUPPORTED_SCORE_EXTENSIONS, ScorePlayer } from '../../data-access/score-player';
import { ScoreViewer, ScoreViewerElements } from '../../ui/score-viewer/score-viewer';
import { TrackMixer } from '../../ui/track-mixer/track-mixer';
import { TransportBar } from '../../ui/transport-bar/transport-bar';
import { ViewControls } from '../../ui/view-controls/view-controls';

/**
 * Smart (container) component: owns the ScorePlayer instance and wires its state
 * into the presentational components. Nothing is persisted — reload starts fresh.
 */
@Component({
  selector: 'app-tab-player-page',
  imports: [FileDropZone, ScoreViewer, TrackMixer, TransportBar, ViewControls],
  providers: [ScorePlayer],
  templateUrl: './tab-player-page.html',
  styleUrl: './tab-player-page.scss',
  host: {
    '(document:keydown.space)': 'onSpace($event)',
  },
})
export class TabPlayerPage {
  protected readonly player = inject(ScorePlayer);

  protected readonly accept = SUPPORTED_SCORE_EXTENSIONS.join(',');
  protected readonly hasScore = computed(() => this.player.tracks().length > 0);
  protected readonly soundFontPercent = computed(() =>
    Math.round(this.player.soundFontProgress() * 100),
  );

  protected onViewerReady({ container, scrollElement }: ScoreViewerElements): void {
    this.player.attach(container, scrollElement);
  }

  protected onFileSelected(file: File): void {
    void this.player.loadFile(file);
  }

  protected onSpace(event: Event): void {
    const target = event.target as HTMLElement;
    if (!this.player.canPlay() || target.closest('input, select, textarea, button')) {
      return;
    }
    event.preventDefault();
    this.player.playPause();
  }
}
