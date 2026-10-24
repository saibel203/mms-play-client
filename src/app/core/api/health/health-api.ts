import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { HealthReport } from './health.models';

/** Client of HealthController (admins only). The anonymous /health/* probes are not for the UI. */
@Injectable({ providedIn: 'root' })
export class HealthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/health`;

  /** Runs every check on the server; always 200, failed checks are part of the report. */
  getReport(): Observable<HealthReport> {
    return this.http.get<HealthReport>(this.baseUrl);
  }
}
