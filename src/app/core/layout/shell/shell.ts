import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LOGIN_PATH } from '@core/auth/auth.guards';
import { Roles } from '@core/auth/roles';
import { Session } from '@core/auth/session';
import { ColorTheme } from '@core/theme/color-theme';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { UserMenu } from '../user-menu/user-menu';

/** Application frame: top bar (navigation by role, theme, user) + routed feature content. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggle, UserMenu],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly theme = inject(ColorTheme);
  protected readonly session = inject(Session);
  private readonly router = inject(Router);

  protected readonly signingOut = signal(false);
  protected readonly roleLabel = computed(() =>
    this.session.isAdmin()
      ? Roles.Admin
      : this.session.hasRole(Roles.Student)
        ? Roles.Student
        : null,
  );

  protected async onSignOut(): Promise<void> {
    this.signingOut.set(true);
    await this.session.logout();
    this.signingOut.set(false);
    void this.router.navigateByUrl(LOGIN_PATH);
  }
}
