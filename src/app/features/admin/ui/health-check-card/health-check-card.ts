import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { HealthCheckEntry } from '@core/api/health/health.models';

/** One health check: status, what it said, how long it took and the extra data it reported. */
@Component({
  selector: 'app-health-check-card',
  imports: [DecimalPipe],
  templateUrl: './health-check-card.html',
  styleUrl: './health-check-card.scss',
})
export class HealthCheckCard {
  readonly check = input.required<HealthCheckEntry>();

  protected readonly data = computed(() =>
    Object.entries(this.check().data ?? {}).map(([key, value]) => ({
      key,
      value: formatValue(value),
    })),
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
