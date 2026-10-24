/** View models of the library feature. Transport models live in core/api. */

export const LIBRARY_PAGE_SIZE = 20;

/** What the URL of the library page encodes: ?page=2&q=metallica */
export interface LibraryFilter {
  /** 1-based. */
  page: number;
  search: string;
}

/**
 * The upload flow is a small state machine:
 * idle → reading (tags from the file) → editing (user checks title / artist) → uploading → idle
 */
export type UploadStep = 'idle' | 'reading' | 'editing' | 'uploading';

/** A picked file waiting for the user to confirm its title and artist. */
export interface UploadDraft {
  file: File;
  title: string;
  artist: string;
}
