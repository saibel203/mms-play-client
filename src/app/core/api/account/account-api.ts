import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { CurrentUserDto, LoginRequest } from './account.models';

/**
 * Client of AccountController. Authentication is an HttpOnly cookie set by the API:
 * the browser stores and sends it, the client never sees a token.
 */
@Injectable({ providedIn: 'root' })
export class AccountApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/account`;

  /** 401 = wrong credentials, locked out or not allowed (the detail says which). */
  login(request: LoginRequest): Observable<CurrentUserDto> {
    return this.http.post<CurrentUserDto>(`${this.baseUrl}/login`, request);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, null);
  }

  /** 401 = not signed in. */
  me(): Observable<CurrentUserDto> {
    return this.http.get<CurrentUserDto>(`${this.baseUrl}/me`);
  }

  /** Requests whose 401 is an answer, not an expired session (see authInterceptor). */
  isAccountRequest(url: string): boolean {
    return url.startsWith(this.baseUrl);
  }
}
