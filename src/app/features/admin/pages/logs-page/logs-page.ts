import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { LOG_LEVELS, LogLevel } from '@core/api/logs/log.models';
import { Pagination } from '@shared/ui/pagination/pagination';
import { LogViewer } from '../../data-access/log-viewer';
import { DEFAULT_LOG_FILTER, LOG_PERIODS, LogFilter, LogPeriod } from '../../models/admin.models';
import { LogEntryDetails } from '../../ui/log-entry-details/log-entry-details';
import { LogFilters } from '../../ui/log-filters/log-filters';
import { LogTable } from '../../ui/log-table/log-table';

/** Text fields replace the history entry instead of adding one per typing pause. */
const TYPED_FIELDS: (keyof LogFilter)[] = ['source', 'search'];

/**
 * Log viewer in the spirit of Umbraco's: filter by level, period, source and text, open an entry
 * to see its template, exception and properties. Everything, including the open entry, lives
 * in the URL, so a link shows another admin exactly the same view.
 */
@Component({
  selector: 'app-logs-page',
  imports: [DecimalPipe, LogEntryDetails, LogFilters, LogTable, Pagination],
  providers: [LogViewer],
  templateUrl: './logs-page.html',
  styleUrl: './logs-page.scss',
})
export class LogsPage {
  protected readonly viewer = inject(LogViewer);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.viewer.setFilter(parseFilter(params));
      this.viewer.select(parseEntryId(params));
    });
  }

  protected onFilterChange(patch: Partial<LogFilter>): void {
    const replaceUrl = Object.keys(patch).some((key) =>
      TYPED_FIELDS.includes(key as keyof LogFilter),
    );
    this.navigate(
      { ...this.viewer.filter(), ...patch, page: 1 },
      this.viewer.selectedId(),
      replaceUrl,
    );
  }

  protected onPageChange(page: number): void {
    this.navigate({ ...this.viewer.filter(), page }, this.viewer.selectedId());
  }

  protected onEntrySelected(id: number): void {
    // a second click on the open entry closes it
    this.navigate(this.viewer.filter(), id === this.viewer.selectedId() ? undefined : id);
  }

  protected onDetailsClosed(): void {
    this.navigate(this.viewer.filter(), undefined);
  }

  protected onSourceFiltered(source: string): void {
    this.onFilterChange({ source });
  }

  private navigate(filter: LogFilter, entry: number | undefined, replaceUrl = false): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: filter.page > 1 ? filter.page : null,
        level: filter.level,
        period: filter.period === DEFAULT_LOG_FILTER.period ? null : filter.period,
        source: filter.source || null,
        q: filter.search || null,
        entry: entry ?? null,
      },
      replaceUrl,
    });
  }
}

/** Tolerates hand-edited URLs: unknown values fall back to the defaults. */
function parseFilter(params: ParamMap): LogFilter {
  const page = Number(params.get('page'));
  const level = params.get('level');
  const period = params.get('period');
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    level: LOG_LEVELS.includes(level as LogLevel) ? (level as LogLevel) : null,
    period: LOG_PERIODS.some((p) => p.value === period)
      ? (period as LogPeriod)
      : DEFAULT_LOG_FILTER.period,
    source: (params.get('source') ?? '').trim().slice(0, 256),
    search: (params.get('q') ?? '').trim().slice(0, 200),
  };
}

function parseEntryId(params: ParamMap): number | undefined {
  const id = Number(params.get('entry'));
  return Number.isInteger(id) && id > 0 ? id : undefined;
}
