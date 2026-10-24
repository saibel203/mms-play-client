import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { PagedResult } from '../api.models';
import { LogEntryDetailsDto, LogEntryDto, LogListQuery } from './log.models';

/** Client of LogsController (admins only): the Serilog entries stored in the database. */
@Injectable({ providedIn: 'root' })
export class LogsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/logs`;

  /** Newest first; empty filters are left out of the query string. */
  list(query: LogListQuery): Observable<PagedResult<LogEntryDto>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        params = params.set(key, value);
      }
    }
    return this.http.get<PagedResult<LogEntryDto>>(this.baseUrl, { params });
  }

  /** 404 = no such entry, e.g. removed by the daily cleanup. */
  get(id: number): Observable<LogEntryDetailsDto> {
    return this.http.get<LogEntryDetailsDto>(`${this.baseUrl}/${id}`);
  }
}
