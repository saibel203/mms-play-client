import { HttpStatusCode } from '@angular/common/http';
import { Injectable, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { isHttpStatus, toErrorMessage } from '@core/api/api-error';
import { PagedResult } from '@core/api/api.models';
import { ScoreDto } from '@core/api/scores/score.models';
import { ScoresApi } from '@core/api/scores/scores-api';
import { LIBRARY_PAGE_SIZE, LibraryFilter } from '../models/library.models';

/**
 * State of the score list: which page / search is shown, what the server returned for it,
 * and removal of its items (ask → confirm → delete).
 * The page component feeds the filter from the URL; everything else is derived.
 *
 * Provided per page, so the state is dropped when the user leaves the library.
 */
@Injectable()
export class ScoreLibrary {
  private readonly api = inject(ScoresApi);

  private readonly _filter = signal<LibraryFilter>({ page: 1, search: '' });
  private readonly _deleteTarget = signal<ScoreDto | null>(null);
  private readonly _isDeleting = signal(false);
  private readonly _deleteError = signal<string | null>(null);

  /** Re-fetches automatically whenever the filter changes; a newer request cancels the older one. */
  private readonly response = rxResource({
    params: () => ({ ...this._filter(), pageSize: LIBRARY_PAGE_SIZE }),
    stream: ({ params }) => this.api.list(params),
  });

  /**
   * The last page that arrived. A resource drops its value when the params change, which would
   * blank the list for the duration of every request; keeping the previous page avoids the flicker.
   * Writable, so a deleted score disappears at once instead of after the next response.
   */
  private readonly lastPage = linkedSignal<PagedResult<ScoreDto> | undefined, PagedResult<ScoreDto> | undefined>({
    source: () => (this.response.hasValue() ? this.response.value() : undefined),
    computation: (page, previous) => page ?? previous?.value,
  });

  readonly filter = this._filter.asReadonly();
  readonly scores = computed(() => this.lastPage()?.items ?? []);
  readonly totalCount = computed(() => this.lastPage()?.totalCount ?? 0);
  readonly totalPages = computed(() => this.lastPage()?.totalPages ?? 0);
  readonly isLoading = this.response.isLoading;
  /** Nothing has arrived yet: show a placeholder instead of an empty list. */
  readonly isFirstLoad = computed(() => this.isLoading() && !this.lastPage());
  readonly error = computed(() => {
    const error = this.response.error();
    return error ? toErrorMessage(error) : null;
  });

  /** Score the user asked to delete; the confirmation is shown while it is set. */
  readonly deleteTarget = this._deleteTarget.asReadonly();
  readonly isDeleting = this._isDeleting.asReadonly();
  readonly deleteError = this._deleteError.asReadonly();

  setFilter(filter: LibraryFilter): void {
    const current = this._filter();
    if (current.page !== filter.page || current.search !== filter.search) {
      this._filter.set(filter);
    }
  }

  reload(): void {
    this.response.reload();
  }

  requestDelete(score: ScoreDto): void {
    this._deleteError.set(null);
    this._deleteTarget.set(score);
  }

  cancelDelete(): void {
    if (!this._isDeleting()) {
      this._deleteTarget.set(null);
    }
  }

  /**
   * Deletes the score asked for and removes it from the shown page.
   * Resolves with the deleted score, or null when the request failed (the reason is in `deleteError`).
   */
  async confirmDelete(): Promise<ScoreDto | null> {
    const target = this._deleteTarget();
    if (!target || this._isDeleting()) {
      return null;
    }

    this._isDeleting.set(true);
    this._deleteError.set(null);

    try {
      await firstValueFrom(this.api.delete(target.id), { defaultValue: undefined });
    } catch (error) {
      // already deleted elsewhere (another tab, another admin): the goal is reached anyway
      if (!isHttpStatus(error, HttpStatusCode.NotFound)) {
        this._deleteError.set(toErrorMessage(error));
        this._isDeleting.set(false);
        return null;
      }
    }

    this.removeLocally(target.id);
    this._deleteTarget.set(null);
    this._isDeleting.set(false);
    return target;
  }

  private removeLocally(id: string): void {
    this.lastPage.update((page) => {
      if (!page?.items.some((score) => score.id === id)) {
        return page;
      }
      const totalCount = page.totalCount - 1;
      return {
        ...page,
        items: page.items.filter((score) => score.id !== id),
        totalCount,
        totalPages: Math.ceil(totalCount / page.pageSize),
      };
    });
  }
}
