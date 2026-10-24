/** Transport models of /api/v1/logs, mirroring MMS.Play.Contracts.Models.Logging. */

/** Serilog levels from the least to the most severe (LogSeverity). */
export const LOG_LEVELS = ['Verbose', 'Debug', 'Information', 'Warning', 'Error', 'Fatal'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

/** Row of the log list (LogEntryDto): no event properties, they are loaded per entry. */
export interface LogEntryDto {
  id: number;
  /** ISO 8601, UTC. */
  timeStamp: string;
  /** Normally a LogLevel; typed loosely because the column is free text. */
  level: string | null;
  /** Class that wrote the entry, e.g. MMS.Play.Infrastructure.Scores.ScoreService. */
  sourceContext: string | null;
  message: string | null;
  /** With the stack trace. */
  exception: string | null;
}

/** A single entry with the structured data of the event (LogEntryDetailsDto). */
export interface LogEntryDetailsDto extends LogEntryDto {
  /** The message before rendering, e.g. "Score {ScoreId} deleted": the same for every event of a kind. */
  messageTemplate: string | null;
  /** Template arguments and enrichers (RequestPath, MachineName…); null when not stored. */
  properties: Record<string, unknown> | null;
}

export interface LogListQuery {
  /** 1-based. */
  page: number;
  /** At most 200. */
  pageSize: number;
  /** This level and more severe ones. */
  minLevel?: LogLevel;
  /** ISO 8601 with an offset; inclusive. */
  from?: string;
  /** ISO 8601 with an offset; exclusive. */
  to?: string;
  /** Start of the source context: a namespace or a full class name. */
  source?: string;
  /** Part of the message or the exception. */
  search?: string;
}
