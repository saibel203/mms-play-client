import { Component, input, output } from '@angular/core';
import { LoginRequest } from '@core/api/account/account.models';

/**
 * User name / password form. Uses plain inputs with `autocomplete` hints, so password
 * managers fill it in; the browser checks the required fields before `submitted` fires.
 */
@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
})
export class LoginForm {
  readonly busy = input(false);
  readonly error = input<string | null>(null);

  readonly submitted = output<LoginRequest>();

  protected onSubmit(event: Event, userName: string, password: string, rememberMe: boolean): void {
    event.preventDefault();
    this.submitted.emit({ userName: userName.trim(), password, rememberMe });
  }
}
