import { LayoutMode, ScrollMode, StaveProfile, json } from '@coderline/alphatab';
import { ScoreLayout, StaveView, ViewOptions } from '../models/player.models';

/** Static files copied from node_modules by the `assets` section of angular.json. */
const ASSETS = {
  fontDirectory: '/alphatab/font/',
  soundFont: '/alphatab/soundfont/sonivox.sf3',
};

/**
 * Colours and fonts of the rendered notation. Change these to restyle the score itself
 * (staff lines, notes, tab numbers, bar numbers…). Cursor / selection colours live in
 * score-viewer.scss because alphaTab draws them as plain DOM elements.
 */
export const SCORE_THEME: json.RenderingResourcesJson = {
  staffLineColor: '#a5abb8',
  barSeparatorColor: '#7d8494',
  barNumberColor: '#d64545',
  mainGlyphColor: '#1d2330',
  secondaryGlyphColor: 'rgba(29, 35, 48, 0.45)',
  scoreInfoColor: '#1d2330',
};

/** Colours used to tell instruments apart in the mixer (by track index). */
export const TRACK_PALETTE = [
  '#2f6fed',
  '#e8833a',
  '#2bb673',
  '#c94fd6',
  '#e0b000',
  '#1fb5c4',
  '#d64545',
  '#7a5af8',
];

export const DEFAULT_VIEW_OPTIONS: ViewOptions = {
  layout: 'page',
  staveView: 'tab',
  zoom: 1,
};

const LAYOUT_MAP: Record<ScoreLayout, LayoutMode> = {
  page: LayoutMode.Page,
  horizontal: LayoutMode.Horizontal,
};

const STAVE_MAP: Record<StaveView, StaveProfile> = {
  tab: StaveProfile.Tab,
  'score-tab': StaveProfile.ScoreTab,
  score: StaveProfile.Score,
};

export function toLayoutMode(layout: ScoreLayout): LayoutMode {
  return LAYOUT_MAP[layout];
}

export function toStaveProfile(view: StaveView): StaveProfile {
  return STAVE_MAP[view];
}

export function createAlphaTabSettings(
  scrollElement: HTMLElement,
  view: ViewOptions,
): json.SettingsJson {
  return {
    core: {
      fontDirectory: ASSETS.fontDirectory,
      useWorkers: true,
    },
    display: {
      layoutMode: toLayoutMode(view.layout),
      staveProfile: toStaveProfile(view.staveView),
      scale: view.zoom,
      resources: SCORE_THEME,
    },
    player: {
      enablePlayer: true,
      soundFont: ASSETS.soundFont,
      scrollElement,
      scrollMode: ScrollMode.Continuous,
      enableCursor: true,
      enableAnimatedBeatCursor: true,
      enableElementHighlighting: true,
      enableUserInteraction: true,
    },
  };
}
