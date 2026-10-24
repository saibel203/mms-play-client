import { Component, computed, input } from '@angular/core';

/** Short labels, so the level column stays narrow. */
const SHORT_LABELS: Record<string, string> = {
  Verbose: 'VRB',
  Debug: 'DBG',
  Information: 'INF',
  Warning: 'WRN',
  Error: 'ERR',
  Fatal: 'FTL',
};

/** Coloured log level tag: INF, WRN, ERR… The full name is in the tooltip. */
@Component({
  selector: 'app-level-badge',
  templateUrl: './level-badge.html',
  styleUrl: './level-badge.scss',
  host: {
    '[class]': 'levelClass()',
    '[attr.title]': 'level() ?? "Unknown"',
  },
})
export class LevelBadge {
  readonly level = input.required<string | null>();

  protected readonly label = computed(() => {
    const level = this.level();
    return level ? (SHORT_LABELS[level] ?? level.slice(0, 3).toUpperCase()) : '???';
  });
  protected readonly levelClass = computed(
    () => `level-${(this.level() ?? 'unknown').toLowerCase()}`,
  );
}
