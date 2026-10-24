import { Injectable, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { toErrorMessage } from '@core/api/api-error';
import { LogListQuery } from '@core/api/logs/log.models';
import { LogsApi } from '@core/api/logs/logs-api';
import { keepPreviousValue } from '@shared/utils/keep-previous-value';
import { DEFAULT_LOG_FILTER, LOG_PAGE_SIZE, LOG_PERIODS, LogFilter } from '../models/admin.models';

/**
 * State of the log viewer: the filtered list and the entry opened next to it.
 * Both come from the URL (fed by the page); the list and the entry load independently,
 * so a shared link to an entry works even when that entry is not on the shown page.
 *
 * Provided per page.
 */
@Injectable()
export class LogViewer {
  private readonly api = inject(LogsApi);

  private readonly _filter = signal<LogFilter>(DEFAULT_LOG_FILTER);
  private readonly _selectedId = signal<number | undefined>(undefined);

  private readonly list = rxResource({
    params: this._filter,
    // "last 24 hours" is computed when the request starts, so a reload moves the window to now
    stream: ({ params }) => this.api.list(toQuery(params)),
  });

  private readonly lastPage = keepPreviousValue(this.list);

  private readonly details = rxResource({
    params: this._selectedId,
    stream: ({ params: id }) => this.api.get(id),
  });

  readonly filter = this._filter.asReadonly();
  readonly entries = computed(() => this.lastPage()?.items ?? []);
  readonly totalCount = computed(() => this.lastPage()?.totalCount ?? 0);
  readonly totalPages = computed(() => this.lastPage()?.totalPages ?? 0);
  readonly isLoading = this.list.isLoading;
  readonly isFirstLoad = computed(() => this.isLoading() && !this.lastPage());
  readonly error = computed(() => {
    const error = this.list.error();
    return error ? toErrorMessage(error) : null;
  });

  readonly selectedId = this._selectedId.asReadonly();
  readonly selected = computed(() => (this.details.hasValue() ? this.details.value() : null));
  readonly isSelectedLoading = this.details.isLoading;
  readonly selectedError = computed(() => {
    const error = this.details.error();
    return error ? toErrorMessage(error) : null;
  });

  setFilter(filter: LogFilter): void {
    const current = this._filter();
    const changed = (Object.keys(filter) as (keyof LogFilter)[]).some(
      (key) => filter[key] !== current[key],
    );
    if (changed) {
      this._filter.set(filter);
    }
  }

  select(id: number | undefined): void {
    this._selectedId.set(id);
  }

  /** Re-reads the list with the period moved to now; new entries appear at the top. */
  refresh(): void {
    this.list.reload();
  }
}

function toQuery(filter: LogFilter): LogListQuery {
  const periodMs = LOG_PERIODS.find((period) => period.value === filter.period)?.ms ?? null;
  return {
    page: filter.page,
    pageSize: LOG_PAGE_SIZE,
    minLevel: filter.level ?? undefined,
    from: periodMs === null ? undefined : new Date(Date.now() - periodMs).toISOString(),
    source: filter.source || undefined,
    search: filter.search || undefined,
  };
}
