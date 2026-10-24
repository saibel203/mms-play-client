import { Component, input, output } from '@angular/core';

/** Sun / moon button for the top bar. Shows the scheme it switches *to*. */
@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  readonly isDark = input.required<boolean>();

  readonly toggled = output<void>();
}
