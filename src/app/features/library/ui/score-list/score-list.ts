import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScoreDto } from '@core/api/scores/score.models';
import { formatFileSize } from '@shared/utils/format-file-size';

/** Clickable cards of scores; each one opens the player and has a delete button. */
@Component({
  selector: 'app-score-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './score-list.html',
  styleUrl: './score-list.scss',
})
export class ScoreList {
  readonly scores = input.required<ScoreDto[]>();
  /** Dims the list while the next page is loading. */
  readonly busy = input(false);

  /** Only asks: the owner confirms and deletes. */
  readonly deleteRequested = output<ScoreDto>();

  protected readonly formatFileSize = formatFileSize;
}
