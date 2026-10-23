import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { formatDuration } from '@shared/utils/format-duration';
import { PlaybackPosition } from '../../models/player.models';

/** Playback controls: play/stop, seek bar, speed, loop, metronome, count-in, master volume. */
@Component({
  selector: 'app-transport-bar',
  imports: [DecimalPipe],
  templateUrl: './transport-bar.html',
  styleUrl: './transport-bar.scss',
})
export class TransportBar {
  readonly canPlay = input(false);
  readonly isPlaying = input(false);
  readonly position = input<PlaybackPosition>({ currentMs: 0, endMs: 0 });
  readonly tempo = input(0);
  readonly speed = input(1);
  readonly isLooping = input(false);
  readonly hasRange = input(false);
  readonly metronome = input(false);
  readonly countIn = input(false);
  readonly masterVolume = input(1);

  readonly playPause = output();
  readonly stop = output();
  readonly seek = output<number>();
  readonly speedChange = output<number>();
  readonly loopChange = output<boolean>();
  readonly clearRange = output();
  readonly metronomeChange = output<boolean>();
  readonly countInChange = output<boolean>();
  readonly masterVolumeChange = output<number>();

  protected readonly speedPresets = [0.25, 0.5, 0.75, 1, 1.25, 1.5];

  protected readonly currentTime = computed(() => formatDuration(this.position().currentMs));
  protected readonly endTime = computed(() => formatDuration(this.position().endMs));

  protected onSeek(event: Event): void {
    this.seek.emit(Number((event.target as HTMLInputElement).value));
  }

  protected onSpeed(event: Event): void {
    this.speedChange.emit(Number((event.target as HTMLSelectElement).value));
  }

  protected onMasterVolume(event: Event): void {
    this.masterVolumeChange.emit(Number((event.target as HTMLInputElement).value) / 100);
  }
}
