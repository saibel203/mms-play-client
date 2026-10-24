import { Routes } from '@angular/router';
import { TabPlayerPage } from './pages/tab-player-page/tab-player-page';

export default [
  // the player always shows a stored score; without an id there is nothing to play
  { path: '', pathMatch: 'full', redirectTo: '/library' },
  { path: ':id', component: TabPlayerPage, title: 'Tab player · MMS Play' },
] satisfies Routes;
