/**
 * Feature-level view models. UI components depend only on these types,
 * never on alphaTab classes, so the rendering engine stays swappable.
 */

export type LoadStatus = 'empty' | 'loading' | 'ready' | 'error';

export type ScoreLayout = 'page' | 'horizontal';

export type StaveView = 'tab' | 'score-tab' | 'score';

export interface ScoreInfo {
  fileName: string;
  title: string;
  artist: string;
}

export interface TrackState {
  index: number;
  name: string;
  color: string;
  isVisible: boolean;
  isMute: boolean;
  isSolo: boolean;
  /** Volume multiplier, 1 = original volume from the file. */
  volume: number;
}

export interface PlaybackPosition {
  currentMs: number;
  endMs: number;
}

export interface ViewOptions {
  layout: ScoreLayout;
  staveView: StaveView;
  zoom: number;
}
