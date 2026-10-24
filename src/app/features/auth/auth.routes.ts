import { Routes } from '@angular/router';
import { guestOnly, pendingApprovalOnly } from '@core/auth/auth.guards';

/**
 * Top-level routes outside the shell: /login and /no-access. Spread into app.routes.ts instead
 * of being mounted under `path: ''` with loadChildren: such a parent also matches "/" with no
 * child at all, which renders an empty page and skips the guarded shell route after it.
 */
export const authRoutes = [
  {
    path: 'login',
    canActivate: [guestOnly],
    loadComponent: () => import('./pages/login-page/login-page').then((m) => m.LoginPage),
    title: 'Sign in · MMS Play',
  },
  {
    path: 'no-access',
    canActivate: [pendingApprovalOnly],
    loadComponent: () => import('./pages/no-access-page/no-access-page').then((m) => m.NoAccessPage),
    title: 'Waiting for approval · MMS Play',
  },
] satisfies Routes;
