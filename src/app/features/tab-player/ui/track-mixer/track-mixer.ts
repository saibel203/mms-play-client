import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { TrackState } from '../../models/player.models';

export interface TrackFlagChange {
  index: number;
  value: boolean;
}

export interface TrackVolumeChange {
  index: number;
  volume: number;
}

/** List of instruments with visibility, mute, solo and volume controls. */
@Component({
  selector: 'app-track-mixer',
  imports: [DecimalPipe],
  templateUrl: './track-mixer.html',
  styleUrl: './track-mixer.scss',
})
export class TrackMixer {
  readonly tracks = input.required<TrackState[]>();

  readonly visibilityToggled = output<number>();
  readonly showOnly = output<number>();
  readonly muteChanged = output<TrackFlagChange>();
  readonly soloChanged = output<TrackFlagChange>();
  readonly volumeChanged = output<TrackVolumeChange>();

  protected onVolumeInput(index: number, event: Event): void {
    const volume = Number((event.target as HTMLInputElement).value) / 100;
    this.volumeChanged.emit({ index, volume });
  }
}
