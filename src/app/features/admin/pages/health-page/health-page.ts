import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { HealthMonitor } from '../../data-access/health-monitor';
import { HealthCheckCard } from '../../ui/health-check-card/health-check-card';

/** Admin only: the result of every health check of the API (database, Hangfire, document storage…). */
@Component({
  selector: 'app-health-page',
  imports: [DatePipe, DecimalPipe, HealthCheckCard],
  providers: [HealthMonitor],
  templateUrl: './health-page.html',
  styleUrl: './health-page.scss',
})
export class HealthPage {
  protected readonly monitor = inject(HealthMonitor);
}
