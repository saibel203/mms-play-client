import { Component } from '@angular/core';

/**
 * Admin only: the Hangfire dashboard of the API, embedded. It is a server-rendered page that
 * authorizes with the same auth cookie, so the iframe needs nothing but a same-site URL
 * (/hangfire is proxied to the API like /api, see proxy.conf.json).
 */
@Component({
  selector: 'app-jobs-page',
  templateUrl: './jobs-page.html',
  styleUrl: './jobs-page.scss',
})
export class JobsPage {}
