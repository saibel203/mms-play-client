import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ColorTheme } from '@core/theme/color-theme';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

/** Application frame: top bar + routed feature content. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggle],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly theme = inject(ColorTheme);
}
