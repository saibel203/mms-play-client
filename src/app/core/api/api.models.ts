/**
 * Shapes shared by every backend endpoint. They mirror MMS.Play.Contracts one to one,
 * so a change on the backend is a change here and nowhere else.
 */

/** One page of a list (MMS.Play.Contracts.Models.Common.PagedResult). */
export interface PagedResult<T> {
  items: T[];
  /** 1-based. */
  page: number;
  pageSize: number;
  totalCount: number;
  /** 0 when there are no items. */
  totalPages: number;
}

/** RFC 9457 error body returned by the API for 4xx / 5xx responses. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  /** Validation errors by field name, present on 400 responses. */
  errors?: Record<string, string[]>;
}
