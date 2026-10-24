import { InjectionToken } from '@angular/core';

/**
 * Root of the versioned backend API. Relative, so the dev server proxy (proxy.conf.json)
 * forwards it to MMS.Play.API and the browser never makes a cross-origin request.
 * Override it in app.config.ts when the API is hosted elsewhere.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => '/api/v1',
});
