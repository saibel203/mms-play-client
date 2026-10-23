import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

/** Application frame: top bar + routed feature content. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {}
