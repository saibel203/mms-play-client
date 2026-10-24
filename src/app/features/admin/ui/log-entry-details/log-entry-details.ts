import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { LogEntryDetailsDto } from '@core/api/logs/log.models';
import { LevelBadge } from '../level-badge/level-badge';

/**
 * Everything about one log entry: message, template, exception and the event properties
 * (template arguments and enrichers such as RequestPath). "Only this source" narrows the list to its class.
 */
@Component({
  selector: 'app-log-entry-details',
  imports: [DatePipe, LevelBadge],
  templateUrl: './log-entry-details.html',
  styleUrl: './log-entry-details.scss',
})
export class LogEntryDetails {
  readonly entry = input<LogEntryDetailsDto | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly closed = output<void>();
  /** "Only this source": filter the list by the entry's source context. */
  readonly sourceFiltered = output<string>();

  protected readonly properties = computed(() =>
    Object.entries(this.entry()?.properties ?? {}).map(([key, value]) => ({
      key,
      value: formatValue(value),
      multiline: typeof value === 'object' && value !== null,
    })),
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
}
