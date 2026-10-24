import { HttpClient, HttpParams, HttpStatusCode } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { PagedResult } from '../api.models';
import { ScoreDto, ScoreListQuery, ScoreUploadDetails, ScoreUploadResult } from './score.models';

/**
 * Thin, stateless client of ScoresController. Knows URLs and wire formats, nothing about UI state:
 * stores in the features decide when to call it and what to do with the result.
 */
@Injectable({ providedIn: 'root' })
export class ScoresApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/scores`;

  /** Newest first. */
  list(query: ScoreListQuery): Observable<PagedResult<ScoreDto>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.search) {
      params = params.set('search', query.search);
    }
    return this.http.get<PagedResult<ScoreDto>>(this.baseUrl, { params });
  }

  get(id: string): Observable<ScoreDto> {
    return this.http.get<ScoreDto>(`${this.baseUrl}/${id}`);
  }

  /** Raw file bytes, ready for alphaTab. Cached by the browser: the file of a score never changes. */
  getContent(id: string): Observable<ArrayBuffer> {
    return this.http.get(`${this.baseUrl}/${id}/content`, { responseType: 'arraybuffer' });
  }

  /** Removes the score and its file. 404 = it does not exist (anymore). */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** 201 = stored, 200 = the same file already exists and is returned instead. */
  upload(file: File, details: ScoreUploadDetails = {}): Observable<ScoreUploadResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    if (details.title) {
      form.append('title', details.title);
    }
    if (details.artist) {
      form.append('artist', details.artist);
    }

    return this.http.post<ScoreDto>(this.baseUrl, form, { observe: 'response' }).pipe(
      map((response) => ({
        score: response.body as ScoreDto,
        isDuplicate: response.status === HttpStatusCode.Ok,
      })),
    );
  }
}
