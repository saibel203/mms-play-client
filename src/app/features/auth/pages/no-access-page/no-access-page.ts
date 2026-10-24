import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LOGIN_PATH } from '@core/auth/auth.guards';
import { Session } from '@core/auth/session';

/**
 * Shown to a signed-in account without a role: it exists but an admin has not approved it yet.
 * "Check again" re-reads the roles, so an approval is picked up without signing in again.
 */
@Component({
  selector: 'app-no-access-page',
  templateUrl: './no-access-page.html',
  styleUrl: './no-access-page.scss',
})
export class NoAccessPage {
  protected readonly session = inject(Session);
  private readonly router = inject(Router);

  protected readonly busy = signal(false);

  protected async checkAgain(): Promise<void> {
    this.busy.set(true);
    await this.session.restore();
    this.busy.set(false);

    if (!this.session.isPendingApproval()) {
      void this.router.navigateByUrl(this.session.isAuthenticated() ? '/' : LOGIN_PATH);
    }
  }

  protected async logout(): Promise<void> {
    this.busy.set(true);
    await this.session.logout();
    void this.router.navigateByUrl(LOGIN_PATH);
  }
}
