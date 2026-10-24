import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Role } from './roles';
import { Session } from './session';

export const LOGIN_PATH = '/login';
export const NO_ACCESS_PATH = '/no-access';

/**
 * Lets the route through when the user has one of the roles (any signed-in user when none are given).
 * Otherwise redirects: signed out → login (and back afterwards), no role at all → waiting for approval,
 * a role that does not fit → the start page.
 */
export function requireRoles(...roles: Role[]): CanActivateFn {
  return (_route, state) => {
    const session = inject(Session);
    const router = inject(Router);

    if (!session.isAuthenticated()) {
      return loginUrl(router, state.url);
    }
    if (roles.length === 0 || session.hasRole(...roles)) {
      return true;
    }
    return router.parseUrl(session.isPendingApproval() ? NO_ACCESS_PATH : '/');
  };
}

/** For the login page: a signed-in user has nothing to do there. */
export const guestOnly: CanActivateFn = () =>
  inject(Session).isAuthenticated() ? inject(Router).parseUrl('/') : true;

/** The no-access page is only for signed-in accounts that have no role yet. */
export const pendingApprovalOnly: CanActivateFn = () => {
  const session = inject(Session);
  const router = inject(Router);
  if (!session.isAuthenticated()) {
    return router.parseUrl(LOGIN_PATH);
  }
  return session.isPendingApproval() ? true : router.parseUrl('/');
};

export function loginUrl(router: Router, returnUrl: string): UrlTree {
  const isHome = returnUrl === '/' || returnUrl.startsWith(LOGIN_PATH);
  return router.createUrlTree([LOGIN_PATH], { queryParams: isHome ? {} : { returnUrl } });
}

/**
 * Only app-internal paths are followed after login: "//evil.com" or "https://…" in the query
 * string would otherwise turn the login page into an open redirect.
 */
export function safeReturnUrl(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}
