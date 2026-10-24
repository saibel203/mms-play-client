import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScoreUploadResult } from '@core/api/scores/score.models';
import { FileDropZone } from '@shared/ui/file-drop-zone/file-drop-zone';
import { fileBaseName } from '@shared/score-file/score-file';
import { formatFileSize } from '@shared/utils/format-file-size';
import { UploadDraft, UploadStep } from '../../models/library.models';

export interface DraftChange {
  title?: string;
  artist?: string;
}

/**
 * Presentational view of the upload flow: a drop zone, then a form to confirm the tags,
 * then the outcome. All state comes in through inputs; every action goes out as an output.
 */
@Component({
  selector: 'app-upload-panel',
  imports: [FileDropZone, RouterLink],
  templateUrl: './upload-panel.html',
  styleUrl: './upload-panel.scss',
})
export class UploadPanel {
  readonly step = input.required<UploadStep>();
  readonly draft = input.required<UploadDraft | null>();
  readonly error = input<string | null>(null);
  readonly lastResult = input<ScoreUploadResult | null>(null);
  readonly accept = input('');

  readonly fileSelected = output<File>();
  readonly draftChange = output<DraftChange>();
  readonly submitted = output<void>();
  readonly cancelled = output<void>();
  readonly resultDismissed = output<void>();

  protected readonly fileSize = computed(() => {
    const draft = this.draft();
    return draft ? formatFileSize(draft.file.size) : '';
  });
  protected readonly titlePlaceholder = computed(() => {
    const draft = this.draft();
    return draft ? fileBaseName(draft.file.name) : '';
  });
  protected readonly isUploading = computed(() => this.step() === 'uploading');

  protected onTitleInput(event: Event): void {
    this.draftChange.emit({ title: (event.target as HTMLInputElement).value });
  }

  protected onArtistInput(event: Event): void {
    this.draftChange.emit({ artist: (event.target as HTMLInputElement).value });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.emit();
  }
}
