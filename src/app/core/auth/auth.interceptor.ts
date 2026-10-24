import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AccountApi } from '@core/api/account/account-api';
import { loginUrl } from './auth.guards';
import { Session } from './session';

/**
 * A 401 on a regular request means the session ended while the app was open (cookie expired,
 * signed out in another tab): drop the user and send them to the login page, back here afterwards.
 * The error still reaches the caller, so loading states end normally.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(Session);
  const router = inject(Router);
  const account = inject(AccountApi);

  return next(request).pipe(
    catchError((error: unknown) => {
      const expired =
        error instanceof HttpErrorResponse &&
        error.status === HttpStatusCode.Unauthorized &&
        !account.isAccountRequest(request.url);

      if (expired && session.isAuthenticated()) {
        session.expire();
        void router.navigateByUrl(loginUrl(router, router.url));
      }
      return throwError(() => error);
    }),
  );
};
