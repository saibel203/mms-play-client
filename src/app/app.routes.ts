import { Routes } from '@angular/router';
import { requireRoles } from '@core/auth/auth.guards';
import { Roles } from '@core/auth/roles';
import { Shell } from '@core/layout/shell/shell';
import { authRoutes } from '@features/auth/auth.routes';

/**
 * Who may open what. The guards only steer the UI; the API checks the same roles on every request.
 *
 * | Route         | Access                 |
 * |---------------|------------------------|
 * | /login        | signed out only        |
 * | /no-access    | signed in, no role     |
 * | /library      | Admin, Student         |
 * | /player/:id   | Admin, Student         |
 * | /admin/logs   | Admin                  |
 * | /admin/health | Admin                  |
 * | /admin/jobs   | Admin                  |
 */
export const routes: Routes = [
  ...authRoutes,
  {
    path: '',
    component: Shell,
    canActivate: [requireRoles(Roles.Admin, Roles.Student)],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'library' },
      {
        path: 'library',
        loadChildren: () => import('@features/library/library.routes'),
      },
      {
        path: 'player',
        loadChildren: () => import('@features/tab-player/tab-player.routes'),
      },
      {
        path: 'admin',
        canActivate: [requireRoles(Roles.Admin)],
        loadChildren: () => import('@features/admin/admin.routes'),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
