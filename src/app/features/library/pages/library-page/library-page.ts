import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Session } from '@core/auth/session';
import { SCORE_FILE_ACCEPT } from '@shared/score-file/score-file';
import { ConfirmDialog } from '@shared/ui/confirm-dialog/confirm-dialog';
import { Pagination } from '@shared/ui/pagination/pagination';
import { SearchBox } from '@shared/ui/search-box/search-box';
import { ScoreLibrary } from '../../data-access/score-library';
import { ScoreUploader } from '../../data-access/score-uploader';
import { LibraryFilter } from '../../models/library.models';
import { ScoreList } from '../../ui/score-list/score-list';
import { DraftChange, UploadPanel } from '../../ui/upload-panel/upload-panel';

/**
 * Smart (container) component of the library. Owns the stores and is the only place that
 * talks to the router: the URL (?page=&q=) is the source of truth for what the list shows,
 * so back / forward, reload and shared links all restore the same view.
 *
 * Everyone browses; uploading and deleting are shown to admins only (the API enforces it too).
 */
@Component({
  selector: 'app-library-page',
  imports: [ConfirmDialog, Pagination, ScoreList, SearchBox, UploadPanel],
  providers: [ScoreLibrary, ScoreUploader],
  templateUrl: './library-page.html',
  styleUrl: './library-page.scss',
})
export class LibraryPage {
  protected readonly library = inject(ScoreLibrary);
  protected readonly uploader = inject(ScoreUploader);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly accept = SCORE_FILE_ACCEPT;
  protected readonly canManage = inject(Session).isAdmin;

  constructor() {
    // URL → store. UI events never touch the store's filter directly, they change the URL.
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.library.setFilter(parseFilter(params)));
  }

  protected onSearch(search: string): void {
    // typing replaces the history entry instead of adding one per pause
    this.navigate({ page: 1, search }, true);
  }

  protected onPageChange(page: number): void {
    this.navigate({ ...this.library.filter(), page });
  }

  protected onFileSelected(file: File): void {
    void this.uploader.pick(file);
  }

  protected onDraftChange(change: DraftChange): void {
    this.uploader.updateDraft(change);
  }

  protected async onUploadSubmitted(): Promise<void> {
    const result = await this.uploader.submit();
    if (!result) {
      return;
    }

    // the new score is the newest one, so it is at the top of the unfiltered first page
    const { page, search } = this.library.filter();
    if (page === 1 && !search) {
      this.library.reload();
    } else {
      this.navigate({ page: 1, search: '' });
    }
  }

  protected async onDeleteConfirmed(): Promise<void> {
    const deleted = await this.library.confirmDelete();
    if (!deleted) {
      return;
    }

    // the "was added" notice would link to a score that no longer exists
    if (this.uploader.lastResult()?.score.id === deleted.id) {
      this.uploader.dismissResult();
    }

    // the last card of a page is gone: step back instead of showing an empty page
    const { page, search } = this.library.filter();
    if (page > 1 && this.library.scores().length === 0) {
      this.navigate({ page: page - 1, search });
    } else {
      // pulls the first score of the next page up into the freed slot
      this.library.reload();
    }
  }

  private navigate(filter: LibraryFilter, replaceUrl = false): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: filter.page > 1 ? filter.page : null, q: filter.search || null },
      replaceUrl,
    });
  }
}

/** Tolerates hand-edited URLs: ?page=abc or ?page=-3 fall back to the first page. */
function parseFilter(params: ParamMap): LibraryFilter {
  const page = Number(params.get('page'));
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    search: (params.get('q') ?? '').trim().slice(0, 100),
  };
}
