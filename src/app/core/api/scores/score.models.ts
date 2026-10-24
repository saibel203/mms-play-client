/** Transport models of /api/v1/scores, mirroring MMS.Play.Contracts.Models.Scores. */

/** File extension without the dot. */
export type ScoreFormat = 'gp' | 'gp3' | 'gp4' | 'gp5' | 'gpx' | 'musicxml' | 'xml';

/** Uploaded score file (ScoreDto). */
export interface ScoreDto {
  id: string;
  /** The file name without extension when none was given on upload. */
  title: string;
  artist: string | null;
  fileName: string;
  format: ScoreFormat;
  /** Bytes. */
  size: number;
  /** ISO 8601, UTC. */
  uploadedAt: string;
}

export interface ScoreListQuery {
  /** 1-based. */
  page: number;
  /** At most 100. */
  pageSize: number;
  /** Matched against title, artist and file name; empty = no filter. */
  search: string;
}

export interface ScoreUploadDetails {
  /** Defaults to the file name on the server. */
  title?: string;
  artist?: string;
}

export interface ScoreUploadResult {
  score: ScoreDto;
  /** The same file had already been uploaded, `score` is the existing one. */
  isDuplicate: boolean;
}
