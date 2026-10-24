import { Component, input, output } from '@angular/core';
import { SearchBox } from '@shared/ui/search-box/search-box';
import { LOG_LEVEL_FILTERS, LOG_PERIODS, LogFilter, LogPeriod } from '../../models/admin.models';

/** Filter bar of the log viewer. Emits only the changed part; the page resets paging. */
@Component({
  selector: 'app-log-filters',
  imports: [SearchBox],
  templateUrl: './log-filters.html',
  styleUrl: './log-filters.scss',
})
export class LogFilters {
  readonly filter = input.required<LogFilter>();
  readonly busy = input(false);

  readonly filterChange = output<Partial<LogFilter>>();
  readonly refresh = output<void>();

  protected readonly levels = LOG_LEVEL_FILTERS;
  protected readonly periods = LOG_PERIODS;

  protected onPeriodChange(event: Event): void {
    this.filterChange.emit({ period: (event.target as HTMLSelectElement).value as LogPeriod });
  }
}
