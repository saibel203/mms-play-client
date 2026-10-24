import { Routes } from '@angular/router';
import { HealthPage } from './pages/health-page/health-page';
import { JobsPage } from './pages/jobs-page/jobs-page';
import { LogsPage } from './pages/logs-page/logs-page';

/** Admin-only pages; the role guard sits on the parent route in app.routes.ts. */
export default [
  { path: '', pathMatch: 'full', redirectTo: 'logs' },
  { path: 'logs', component: LogsPage, title: 'Logs · MMS Play' },
  { path: 'health', component: HealthPage, title: 'Health · MMS Play' },
  { path: 'jobs', component: JobsPage, title: 'Jobs · MMS Play' },
] satisfies Routes;
