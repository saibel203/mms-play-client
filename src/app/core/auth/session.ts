import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CurrentUserDto, LoginRequest } from '@core/api/account/account.models';
import { AccountApi } from '@core/api/account/account-api';
import { APP_ROLES, Role, Roles } from './roles';

/**
 * Who is signed in. Restored once on startup (provideAppInitializer → restore()), so guards
 * and templates can read it synchronously.
 *
 * Role checks here only decide what the UI shows; the API enforces the same rules itself.
 */
@Injectable({ providedIn: 'root' })
export class Session {
  private readonly api = inject(AccountApi);

  private readonly _user = signal<CurrentUserDto | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this.hasRole(Roles.Admin));
  /** Signed in but without any role: the account still has to be approved by an admin. */
  readonly isPendingApproval = computed(
    () => this.isAuthenticated() && !this.hasRole(...APP_ROLES),
  );

  /** True when the user has at least one of the roles. Reads a signal, so it is reactive in templates. */
  hasRole(...roles: Role[]): boolean {
    const userRoles = this._user()?.roles ?? [];
    return roles.some((role) => userRoles.includes(role));
  }

  /** Asks the API whether the cookie is still valid. Never throws: any failure means "signed out". */
  async restore(): Promise<void> {
    try {
      this._user.set(await firstValueFrom(this.api.me()));
    } catch {
      this._user.set(null);
    }
  }

  /** Throws the HTTP error on failure; the caller shows it (toErrorMessage has the server's reason). */
  async login(request: LoginRequest): Promise<CurrentUserDto> {
    const user = await firstValueFrom(this.api.login(request));
    this._user.set(user);
    return user;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.logout(), { defaultValue: undefined });
    } finally {
      // signed out locally even when the request failed: the UI must not keep showing the old user
      this._user.set(null);
    }
  }

  /** The API answered 401 to a regular request: the cookie expired or was revoked. */
  expire(): void {
    this._user.set(null);
  }
}
