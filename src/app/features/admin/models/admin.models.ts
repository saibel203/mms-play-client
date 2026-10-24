import { LogLevel } from '@core/api/logs/log.models';

/** View models of the admin feature. Transport models live in core/api. */

export const LOG_PAGE_SIZE = 50;

/** Time window of the log list, relative to the moment the list is (re)loaded. */
export type LogPeriod = 'hour' | 'day' | 'week' | 'all';

export const LOG_PERIODS: readonly { value: LogPeriod; label: string; ms: number | null }[] = [
  { value: 'hour', label: 'Last hour', ms: 60 * 60 * 1000 },
  { value: 'day', label: 'Last 24 hours', ms: 24 * 60 * 60 * 1000 },
  { value: 'week', label: 'Last 7 days', ms: 7 * 24 * 60 * 60 * 1000 },
  { value: 'all', label: 'All', ms: null },
];

/** Minimum levels offered in the filter; Verbose is covered by "All". */
export const LOG_LEVEL_FILTERS: readonly { value: LogLevel | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'Debug', label: 'Debug' },
  { value: 'Information', label: 'Info' },
  { value: 'Warning', label: 'Warning' },
  { value: 'Error', label: 'Error' },
  { value: 'Fatal', label: 'Fatal' },
];

/**
 * What the URL of the logs page encodes: ?level=Warning&period=day&source=MMS.Play&q=timeout&page=2&entry=123
 * The selected entry is part of it, so a link opens the same entry for another admin.
 */
export interface LogFilter {
  /** 1-based. */
  page: number;
  /** Minimum level; null = all levels. */
  level: LogLevel | null;
  period: LogPeriod;
  /** Start of the source context (namespace or class). */
  source: string;
  search: string;
}

export const DEFAULT_LOG_FILTER: LogFilter = {
  page: 1,
  level: null,
  period: 'day',
  source: '',
  search: '',
};
