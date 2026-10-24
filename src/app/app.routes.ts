import { Routes } from '@angular/router';
import { Shell } from '@core/layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
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
    ],
  },
  { path: '**', redirectTo: '' },
];
