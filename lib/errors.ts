/**
 * errors-v2.ts
 *
 * Structured error system used by `apiHandler`.
 * Every HttpError carries:
 *   - HTTP status code
 *   - machine-readable `code`  → goes in the JSON "error" field
 *   - user-facing `message`    → goes in the JSON "message" field
 *   - optional `details`       → logged server-side only, never sent to client
 */

export type ErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "lock_conflict"
  | "internal_error"
  | "service_unavailable"
  | "dokploy_api_error"
  | "github_api_error"
  | "github_no_installation"
  | "webhook_invalid_signature"
  | "webhook_missing_headers";

export class HttpError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 | 500 | 502 | 503,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// ─── Factory helpers ───────────────────────────────────────────────────────────

export function badRequest(message: string, details?: unknown): HttpError {
  return new HttpError(400, "bad_request", message, details);
}

export function unauthorized(message = "Authentication required."): HttpError {
  return new HttpError(401, "unauthorized", message);
}

export function forbidden(
  message = "You do not have permission to do this.",
): HttpError {
  return new HttpError(403, "forbidden", message);
}

export function notFound(message: string): HttpError {
  return new HttpError(404, "not_found", message);
}

export function conflict(message: string): HttpError {
  return new HttpError(409, "conflict", message);
}

export function lockConflict(message: string): HttpError {
  return new HttpError(409, "lock_conflict", message);
}

export function internalError(
  message = "Something went wrong. Please try again.",
): HttpError {
  return new HttpError(500, "internal_error", message);
}

export function serviceUnavailable(
  message = "Service temporarily unavailable.",
): HttpError {
  return new HttpError(503, "service_unavailable", message);
}

export function dokployApiError(
  message = "Dokploy API request failed.",
  details?: unknown,
): HttpError {
  return new HttpError(502, "dokploy_api_error", message, details);
}

export function githubApiError(
  message = "GitHub API request failed.",
  details?: unknown,
): HttpError {
  return new HttpError(502, "github_api_error", message, details);
}

// ─── Type guard ────────────────────────────────────────────────────────────────

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export function toClientMessage(error: unknown, fallback: string): string {
  if (isHttpError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
