/**
 * AppError – a typed error that carries an HTTP status code.
 *
 * Rules:
 *  - 400  Client mistake (bad input, repo not found, validation failure).
 *         The message is safe to return to the browser as-is.
 *  - 500  Our own server misconfiguration (missing env vars, etc.).
 *         The message is NEVER sent to the client; a generic fallback is used.
 *  - 502  Upstream failure (Dokploy / GitHub returned an error).
 *         The message is safe to surface – it helps the user understand what failed.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Returns a message that is safe to send to the browser.
 * Hides the real message when it comes from a 500-level server error so
 * internal configuration details are never leaked.
 */
export function toClientMessage(error: unknown, fallback: string): string {
  if (error instanceof AppError) {
    return error.statusCode === 500 ? fallback : error.message;
  }

  return fallback;
}

/**
 * Returns the HTTP status code that should be sent to the browser.
 */
export function toStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  return 500;
}

/**
 * Logs the full error to the server console with a context prefix.
 * Always call this before returning an error response so the real cause
 * is visible in server logs even when we hide it from the client.
 */
export function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, message);

  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    console.error(error.stack);
  }
}
