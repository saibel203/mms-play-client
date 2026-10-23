import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { AlphaTabApi, model, synth } from '@coderline/alphatab';
import {
  LoadStatus,
  PlaybackPosition,
  ScoreInfo,
  ScoreLayout,
  StaveView,
  TrackState,
  ViewOptions,
} from '../models/player.models';
import {
  DEFAULT_VIEW_OPTIONS,
  TRACK_PALETTE,
  createAlphaTabSettings,
  toLayoutMode,
  toStaveProfile,
} from './alphatab.config';

export const SUPPORTED_SCORE_EXTENSIONS = ['.gp', '.gp3', '.gp4', '.gp5', '.gpx', '.musicxml', '.xml'];

/**
 * Facade over alphaTab: the only place in the app that talks to the engine.
 * Exposes read-only signals for the UI and command methods for user actions.
 *
 * Provided per page (not in root), so every player instance owns its own engine
 * and everything is torn down when the page is destroyed.
 */
@Injectable()
export class ScorePlayer {
  private api: AlphaTabApi | null = null;
  private score: model.Score | null = null;

  private readonly _status = signal<LoadStatus>('empty');
  private readonly _error = signal<string | null>(null);
  private readonly _info = signal<ScoreInfo | null>(null);
  private readonly _tracks = signal<TrackState[]>([]);
  private readonly _isRendering = signal(false);
  private readonly _isPlayerReady = signal(false);
  private readonly _soundFontProgress = signal(0);
  private readonly _isPlaying = signal(false);
  private readonly _position = signal<PlaybackPosition>({ currentMs: 0, endMs: 0 });
  private readonly _tempo = signal(0);
  private readonly _speed = signal(1);
  private readonly _isLooping = signal(false);
  private readonly _hasRange = signal(false);
  private readonly _metronome = signal(false);
  private readonly _countIn = signal(false);
  private readonly _masterVolume = signal(1);
  private readonly _view = signal<ViewOptions>(DEFAULT_VIEW_OPTIONS);

  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly info = this._info.asReadonly();
  readonly tracks = this._tracks.asReadonly();
  readonly isRendering = this._isRendering.asReadonly();
  readonly isPlayerReady = this._isPlayerReady.asReadonly();
  readonly soundFontProgress = this._soundFontProgress.asReadonly();
  readonly isPlaying = this._isPlaying.asReadonly();
  readonly position = this._position.asReadonly();
  readonly tempo = this._tempo.asReadonly();
  readonly speed = this._speed.asReadonly();
  readonly isLooping = this._isLooping.asReadonly();
  readonly hasRange = this._hasRange.asReadonly();
  readonly metronome = this._metronome.asReadonly();
  readonly countIn = this._countIn.asReadonly();
  readonly masterVolume = this._masterVolume.asReadonly();
  readonly view = this._view.asReadonly();

  readonly canPlay = computed(() => this._status() === 'ready' && this._isPlayerReady());

  constructor() {
    inject(DestroyRef).onDestroy(() => this.detach());
  }

  /** Creates the engine inside the given element. Called once by the score viewer. */
  attach(container: HTMLElement, scrollElement: HTMLElement): void {
    this.detach();
    const api = new AlphaTabApi(container, createAlphaTabSettings(scrollElement, this._view()));
    this.api = api;

    api.scoreLoaded.on((score) => this.onScoreLoaded(score));
    api.renderStarted.on(() => this._isRendering.set(true));
    api.renderFinished.on(() => this._isRendering.set(false));
    api.soundFontLoad.on((e) => this._soundFontProgress.set(e.total ? e.loaded / e.total : 0));
    api.playerReady.on(() => this._isPlayerReady.set(true));
    api.playerStateChanged.on((e) => this._isPlaying.set(e.state === synth.PlayerState.Playing));
    api.playerPositionChanged.on((e) => {
      this._position.set({ currentMs: e.currentTime, endMs: e.endTime });
      this._tempo.set(e.modifiedTempo);
    });
    api.playbackRangeChanged.on((e) => this._hasRange.set(e.playbackRange !== null));
    api.error.on((e) => this.fail(e.message));
  }

  async loadFile(file: File): Promise<void> {
    const api = this.api;
    if (!api) {
      return;
    }
    if (!isSupportedFile(file.name)) {
      this.fail(`Unsupported file type. Use: ${SUPPORTED_SCORE_EXTENSIONS.join(', ')}`);
      return;
    }

    this._status.set('loading');
    this._error.set(null);
    this._info.set({ fileName: file.name, title: '', artist: '' });
    api.stop();
    this.clearRange();

    try {
      const data = new Uint8Array(await file.arrayBuffer());
      // Render only the first track initially, like Songsterr; audio plays all tracks.
      if (!api.load(data, [0])) {
        this.fail('alphaTab could not read this file.');
      }
    } catch (e) {
      this.fail(e instanceof Error ? e.message : String(e));
    }
  }

  // --- Transport -----------------------------------------------------------------

  playPause(): void {
    this.api?.playPause();
  }

  stop(): void {
    this.api?.stop();
  }

  seek(ms: number): void {
    if (this.api) {
      this.api.timePosition = ms;
    }
  }

  setSpeed(speed: number): void {
    this._speed.set(speed);
    if (this.api) {
      this.api.playbackSpeed = speed;
    }
  }

  setLooping(looping: boolean): void {
    this._isLooping.set(looping);
    if (this.api) {
      this.api.isLooping = looping;
    }
  }

  /** Removes the bar selection made with the mouse (Shift/drag over the score). */
  clearRange(): void {
    if (this.api) {
      this.api.playbackRange = null;
      this.api.clearPlaybackRangeHighlight();
    }
    this._hasRange.set(false);
  }

  setMetronome(enabled: boolean): void {
    this._metronome.set(enabled);
    if (this.api) {
      this.api.metronomeVolume = enabled ? 1 : 0;
    }
  }

  setCountIn(enabled: boolean): void {
    this._countIn.set(enabled);
    if (this.api) {
      this.api.countInVolume = enabled ? 1 : 0;
    }
  }

  setMasterVolume(volume: number): void {
    this._masterVolume.set(volume);
    if (this.api) {
      this.api.masterVolume = volume;
    }
  }

  // --- Tracks --------------------------------------------------------------------

  toggleTrackVisible(index: number): void {
    const tracks = this._tracks();
    const target = tracks.find((t) => t.index === index);
    const visibleCount = tracks.filter((t) => t.isVisible).length;
    // At least one track must stay on screen.
    if (!target || (target.isVisible && visibleCount === 1)) {
      return;
    }
    this.patchTrack(index, { isVisible: !target.isVisible });
    this.renderVisibleTracks();
  }

  /** Shows only the given track. */
  showOnlyTrack(index: number): void {
    this._tracks.update((tracks) => tracks.map((t) => ({ ...t, isVisible: t.index === index })));
    this.renderVisibleTracks();
  }

  setTrackMute(index: number, mute: boolean): void {
    this.withTrack(index, (track) => this.api?.changeTrackMute([track], mute));
    this.patchTrack(index, { isMute: mute });
  }

  setTrackSolo(index: number, solo: boolean): void {
    this.withTrack(index, (track) => this.api?.changeTrackSolo([track], solo));
    this.patchTrack(index, { isSolo: solo });
  }

  setTrackVolume(index: number, volume: number): void {
    this.withTrack(index, (track) => this.api?.changeTrackVolume([track], volume));
    this.patchTrack(index, { volume });
  }

  // --- View ----------------------------------------------------------------------

  setLayout(layout: ScoreLayout): void {
    this.updateView({ layout });
  }

  setStaveView(staveView: StaveView): void {
    this.updateView({ staveView });
  }

  setZoom(zoom: number): void {
    this.updateView({ zoom });
  }

  // --- Internals -----------------------------------------------------------------

  private onScoreLoaded(score: model.Score): void {
    this.score = score;
    const fileName = this._info()?.fileName ?? '';
    this._info.set({ fileName, title: score.title, artist: score.artist });
    this._tracks.set(
      score.tracks.map((track) => ({
        index: track.index,
        name: track.name || `Track ${track.index + 1}`,
        color: TRACK_PALETTE[track.index % TRACK_PALETTE.length],
        isVisible: track.index === 0,
        isMute: track.playbackInfo.isMute,
        isSolo: track.playbackInfo.isSolo,
        volume: 1,
      })),
    );
    this._position.set({ currentMs: 0, endMs: 0 });
    this._status.set('ready');
  }

  private renderVisibleTracks(): void {
    if (!this.api || !this.score) {
      return;
    }
    const visible = new Set(this._tracks().filter((t) => t.isVisible).map((t) => t.index));
    this.api.renderTracks(this.score.tracks.filter((t) => visible.has(t.index)));
  }

  private updateView(patch: Partial<ViewOptions>): void {
    const view = { ...this._view(), ...patch };
    this._view.set(view);
    const api = this.api;
    if (!api) {
      return;
    }
    api.settings.display.layoutMode = toLayoutMode(view.layout);
    api.settings.display.staveProfile = toStaveProfile(view.staveView);
    api.settings.display.scale = view.zoom;
    api.updateSettings();
    if (this.score) {
      api.render();
    }
  }

  private withTrack(index: number, action: (track: model.Track) => void): void {
    const track = this.score?.tracks[index];
    if (track) {
      action(track);
    }
  }

  private patchTrack(index: number, patch: Partial<TrackState>): void {
    this._tracks.update((tracks) => tracks.map((t) => (t.index === index ? { ...t, ...patch } : t)));
  }

  private fail(message: string): void {
    this._error.set(message);
    this._status.set(this.score ? 'ready' : 'error');
  }

  private detach(): void {
    this.api?.destroy();
    this.api = null;
    this.score = null;
    this._isPlayerReady.set(false);
    this._isPlaying.set(false);
  }
}

function isSupportedFile(fileName: string): boolean {
  const name = fileName.toLowerCase();
  return SUPPORTED_SCORE_EXTENSIONS.some((ext) => name.endsWith(ext));
}
