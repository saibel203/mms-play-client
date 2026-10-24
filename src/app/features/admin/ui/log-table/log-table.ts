import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { LogEntryDto } from '@core/api/logs/log.models';
import { LevelBadge } from '../level-badge/level-badge';

/** Compact list of log entries; a click (or Enter) opens one. */
@Component({
  selector: 'app-log-table',
  imports: [DatePipe, LevelBadge],
  templateUrl: './log-table.html',
  styleUrl: './log-table.scss',
})
export class LogTable {
  readonly entries = input.required<LogEntryDto[]>();
  readonly selectedId = input<number | undefined>(undefined);
  /** Dims the rows while the next page or filter is loading. */
  readonly busy = input(false);

  readonly entrySelected = output<number>();

  /** "MMS.Play.Infrastructure.Scores.ScoreService" → "ScoreService"; the full name is in the tooltip. */
  protected shortSource(source: string | null): string {
    return source ? source.slice(source.lastIndexOf('.') + 1) : '—';
  }
}
