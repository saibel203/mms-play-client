import { Component, computed, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ColorTheme } from '@core/theme/color-theme';
import { CurrentScore } from '../../data-access/current-score';
import { ScorePlayer } from '../../data-access/score-player';
import { ScoreViewer, ScoreViewerElements } from '../../ui/score-viewer/score-viewer';
import { TrackMixer } from '../../ui/track-mixer/track-mixer';
import { TransportBar } from '../../ui/transport-bar/transport-bar';
import { ViewControls } from '../../ui/view-controls/view-controls';

/**
 * Smart (container) component: opens the score from the URL (/player/:id), feeds its file
 * into the ScorePlayer engine and wires both into the presentational components.
 */
@Component({
  selector: 'app-tab-player-page',
  imports: [RouterLink, ScoreViewer, TrackMixer, TransportBar, ViewControls],
  providers: [CurrentScore, ScorePlayer],
  templateUrl: './tab-player-page.html',
  styleUrl: './tab-player-page.scss',
  host: {
    '(document:keydown.space)': 'onSpace($event)',
  },
})
export class TabPlayerPage {
  protected readonly current = inject(CurrentScore);
  protected readonly player = inject(ScorePlayer);

  protected readonly hasScore = computed(() => this.player.tracks().length > 0);
  protected readonly isBusy = computed(
    () => this.current.isLoading() || this.player.isRendering() || this.player.status() === 'loading',
  );
  protected readonly soundFontPercent = computed(() =>
    Math.round(this.player.soundFontProgress() * 100),
  );

  constructor() {
    const title = inject(Title);
    const theme = inject(ColorTheme);

    // URL → store; the same page instance is reused when only the id changes
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => this.current.open(params.get('id') ?? ''));

    // data → engine: alphaTab is an imperative external system, which is what effects are for
    effect(() => {
      const content = this.current.content();
      if (content) {
        untracked(() => this.player.load(content));
      }
    });

    // before attach() this only changes the settings the engine will be created with
    effect(() => {
      const scheme = theme.scheme();
      untracked(() => this.player.setTheme(scheme));
    });

    effect(() => {
      const score = this.current.score();
      if (score) {
        title.setTitle(`${score.title}${score.artist ? ` – ${score.artist}` : ''} · MMS Play`);
      }
    });
  }

  protected onViewerReady({ container, scrollElement }: ScoreViewerElements): void {
    this.player.attach(container, scrollElement);
  }

  protected onSpace(event: Event): void {
    const target = event.target as HTMLElement;
    if (!this.player.canPlay() || target.closest('input, select, textarea, button')) {
      return;
    }
    event.preventDefault();
    this.player.playPause();
  }
}
