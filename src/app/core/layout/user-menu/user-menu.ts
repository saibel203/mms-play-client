import { Component, input, output } from '@angular/core';

/** Signed-in user in the top bar: name, role badge and a sign-out button. */
@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
})
export class UserMenu {
  readonly userName = input.required<string>();
  /** Shown as a badge, e.g. "Admin". */
  readonly role = input<string | null>(null);
  readonly busy = input(false);

  readonly signOut = output<void>();
}
