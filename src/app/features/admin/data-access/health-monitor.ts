import { Injectable, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { toErrorMessage } from '@core/api/api-error';
import { HealthApi } from '@core/api/health/health-api';

/**
 * The health report: loaded when the page opens, re-run on demand. While a re-run is in flight
 * the previous report stays on screen (a reloading resource keeps its value).
 *
 * Provided per page.
 */
@Injectable()
export class HealthMonitor {
  private readonly api = inject(HealthApi);

  private readonly response = rxResource({
    stream: () => this.api.getReport(),
  });

  readonly report = computed(() => (this.response.hasValue() ? this.response.value() : null));
  readonly isLoading = this.response.isLoading;
  readonly error = computed(() => {
    const error = this.response.error();
    return error ? toErrorMessage(error) : null;
  });

  /** Runs every check on the server again. */
  refresh(): void {
    this.response.reload();
  }
}
