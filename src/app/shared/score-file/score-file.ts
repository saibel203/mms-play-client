/**
 * Knowledge about score files that more than one feature needs: which files are accepted
 * and how to peek at their tags. Keep in sync with ScoreFormat on the backend.
 */

export const SUPPORTED_SCORE_EXTENSIONS = ['.gp', '.gp3', '.gp4', '.gp5', '.gpx', '.musicxml', '.xml'];

/** Value for `<input type="file" accept>`. */
export const SCORE_FILE_ACCEPT = SUPPORTED_SCORE_EXTENSIONS.join(',');

export interface ScoreTags {
  title: string;
  artist: string;
}

export function isSupportedScoreFile(fileName: string): boolean {
  const name = fileName.toLowerCase();
  return SUPPORTED_SCORE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/** Strips the extension: "Metallica - One.gp5" → "Metallica - One". */
export function fileBaseName(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/**
 * Reads title and artist stored inside the file, so the library shows "One — Metallica"
 * instead of "one_final_v2". Never throws: an unreadable file just yields empty tags and
 * the server still validates it on upload.
 *
 * alphaTab is imported lazily, so pages that only list scores don't download the engine.
 */
export async function readScoreTags(file: File): Promise<ScoreTags> {
  try {
    const [{ importer }, buffer] = await Promise.all([
      import('@coderline/alphatab'),
      file.arrayBuffer(),
    ]);
    const score = importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(buffer));
    return { title: score.title.trim(), artist: score.artist.trim() };
  } catch {
    return { title: '', artist: '' };
  }
}
