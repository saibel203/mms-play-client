/** Transport models of /api/v1/health, mirroring MMS.Play.Presentation.Models.Responses.Health. */

export type HealthStatus = 'Healthy' | 'Degraded' | 'Unhealthy';

/** Result of a single check (HealthCheckEntryResponse). */
export interface HealthCheckEntry {
  /** database, hangfire, document-storage… */
  name: string;
  status: HealthStatus;
  /** For a failed check, the error message. */
  description: string | null;
  durationMs: number;
  /** Extra values reported by the check, e.g. Hangfire server and job counts. */
  data: Record<string, unknown>;
}

/** Result of running every check (HealthReportResponse). */
export interface HealthReport {
  /** The worst status of all checks. */
  status: HealthStatus;
  /** The checks run in parallel, so this is about the slowest one. */
  totalDurationMs: number;
  /** ISO 8601, UTC. */
  checkedAt: string;
  checks: HealthCheckEntry[];
}
