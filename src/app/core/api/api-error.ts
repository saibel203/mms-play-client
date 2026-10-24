import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetails } from './api.models';

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Turns anything thrown by an API call (or a resource built on one) into a sentence for the UI.
 * Validation errors win over the generic title, so the user sees *why* the request failed.
 */
export function toErrorMessage(error: unknown): string {
  const cause = unwrap(error);

  if (cause instanceof HttpErrorResponse) {
    if (cause.status === 0) {
      return 'Cannot reach the server. Check that MMS.Play.API is running.';
    }
    const problem = isProblemDetails(cause.error) ? cause.error : null;
    const validation = problem?.errors && Object.values(problem.errors).flat()[0];
    return validation || problem?.detail || problem?.title || statusMessage(cause.status);
  }

  return cause instanceof Error && cause.message ? cause.message : FALLBACK_MESSAGE;
}

/** True when the request failed with the given HTTP status, e.g. 404 on a delete that already happened. */
export function isHttpStatus(error: unknown, status: number): boolean {
  const cause = unwrap(error);
  return cause instanceof HttpErrorResponse && cause.status === status;
}

/** Resources wrap failures that are not `Error` instances, the HTTP error is then the cause. */
function unwrap(error: unknown): unknown {
  if (error instanceof Error && error.cause instanceof HttpErrorResponse) {
    return error.cause;
  }
  return error;
}

// binary requests (responseType: 'arraybuffer') receive the problem details as raw bytes
function isProblemDetails(body: unknown): body is ProblemDetails {
  return typeof body === 'object' && body !== null && ('title' in body || 'errors' in body);
}

function statusMessage(status: number): string {
  switch (status) {
    case 404:
      return 'Not found.';
    case 413:
      return 'The file is too large.';
    default:
      return status >= 500 ? 'The server failed to process the request.' : FALLBACK_MESSAGE;
  }
}
