import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toErrorMessage } from '@core/api/api-error';
import { ScoreUploadResult } from '@core/api/scores/score.models';
import { ScoresApi } from '@core/api/scores/scores-api';
import {
  SUPPORTED_SCORE_EXTENSIONS,
  fileBaseName,
  isSupportedScoreFile,
  readScoreTags,
} from '@shared/score-file/score-file';
import { UploadDraft, UploadStep } from '../models/library.models';

/**
 * Drives the upload flow (see UploadStep): pick a file → its tags pre-fill the form →
 * the user confirms → the file goes to the server.
 *
 * Provided per page alongside ScoreLibrary; the page decides what to do after a successful
 * upload (refresh the list), so the two stores stay independent of each other.
 */
@Injectable()
export class ScoreUploader {
  private readonly api = inject(ScoresApi);

  private readonly _step = signal<UploadStep>('idle');
  private readonly _draft = signal<UploadDraft | null>(null);
  private readonly _error = signal<string | null>(null);
  private readonly _lastResult = signal<ScoreUploadResult | null>(null);

  readonly step = this._step.asReadonly();
  readonly draft = this._draft.asReadonly();
  readonly error = this._error.asReadonly();
  /** Outcome of the last upload, shown until the next file is picked. */
  readonly lastResult = this._lastResult.asReadonly();
  readonly isBusy = computed(() => this._step() === 'reading' || this._step() === 'uploading');

  async pick(file: File): Promise<void> {
    this._error.set(null);
    this._lastResult.set(null);

    if (!isSupportedScoreFile(file.name)) {
      this._error.set(`Unsupported file type. Use: ${SUPPORTED_SCORE_EXTENSIONS.join(', ')}`);
      return;
    }

    const draft: UploadDraft = { file, title: '', artist: '' };
    this._draft.set(draft);
    this._step.set('reading');

    const tags = await readScoreTags(file);

    // another file was picked, or the flow was cancelled, while this one was being read
    if (this._draft() !== draft) {
      return;
    }
    this._draft.set({ file, title: tags.title || fileBaseName(file.name), artist: tags.artist });
    this._step.set('editing');
  }

  updateDraft(patch: Partial<Pick<UploadDraft, 'title' | 'artist'>>): void {
    this._draft.update((draft) => (draft ? { ...draft, ...patch } : draft));
  }

  cancel(): void {
    this._draft.set(null);
    this._error.set(null);
    this._step.set('idle');
  }

  /** Resolves with the result, or null when the upload failed (the error is in `error`). */
  async submit(): Promise<ScoreUploadResult | null> {
    const draft = this._draft();
    if (!draft || this._step() !== 'editing') {
      return null;
    }

    this._error.set(null);
    this._step.set('uploading');

    try {
      const result = await firstValueFrom(
        this.api.upload(draft.file, { title: draft.title.trim(), artist: draft.artist.trim() }),
      );
      this._lastResult.set(result);
      this._draft.set(null);
      this._step.set('idle');
      return result;
    } catch (error) {
      // back to the form, so the user can fix the title or pick another file
      this._error.set(toErrorMessage(error));
      this._step.set('editing');
      return null;
    }
  }

  dismissResult(): void {
    this._lastResult.set(null);
  }
}
