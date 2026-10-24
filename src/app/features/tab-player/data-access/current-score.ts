import { Injectable, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { toErrorMessage } from '@core/api/api-error';
import { ScoresApi } from '@core/api/scores/scores-api';

/**
 * The score the player page shows: its metadata and file, fetched in parallel by id.
 * Pure data, knows nothing about alphaTab — the page hands `content` to ScorePlayer.
 *
 * Provided per page, like ScorePlayer.
 */
@Injectable()
export class CurrentScore {
  private readonly api = inject(ScoresApi);

  /** undefined keeps both resources idle until the page opens a score. */
  private readonly _id = signal<string | undefined>(undefined);

  private readonly details = rxResource({
    params: this._id,
    stream: ({ params: id }) => this.api.get(id),
  });

  private readonly file = rxResource({
    params: this._id,
    stream: ({ params: id }) => this.api.getContent(id),
  });

  readonly id = this._id.asReadonly();
  readonly score = computed(() => (this.details.hasValue() ? this.details.value() : null));
  /** Raw file bytes; a new buffer every time another score is opened. */
  readonly content = computed(() => (this.file.hasValue() ? this.file.value() : null));
  readonly isLoading = computed(() => this.details.isLoading() || this.file.isLoading());
  /** The metadata error goes first: it carries the server's message (e.g. "Score not found"). */
  readonly error = computed(() => {
    const error = this.details.error() ?? this.file.error();
    return error ? toErrorMessage(error) : null;
  });

  open(id: string): void {
    this._id.set(id);
  }

  reload(): void {
    this.details.reload();
    this.file.reload();
  }
}
