import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toErrorMessage } from '@core/api/api-error';
import { LoginRequest } from '@core/api/account/account.models';
import { NO_ACCESS_PATH, safeReturnUrl } from '@core/auth/auth.guards';
import { Session } from '@core/auth/session';
import { LoginForm } from '../../ui/login-form/login-form';

/**
 * Sign-in screen, outside the app shell. After a successful sign-in the user goes back to the
 * page that sent them here (?returnUrl=), or to the waiting page when the account has no role yet.
 */
@Component({
  selector: 'app-login-page',
  imports: [LoginForm],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly session = inject(Session);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async onSubmit(request: LoginRequest): Promise<void> {
    this.busy.set(true);
    this.error.set(null);

    try {
      await this.session.login(request);
    } catch (error) {
      this.error.set(toErrorMessage(error));
      this.busy.set(false);
      return;
    }

    const target = this.session.isPendingApproval()
      ? NO_ACCESS_PATH
      : safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }
}
