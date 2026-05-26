import { type NextRequest, NextResponse } from "next/server";

import { isHttpError } from "./errors";
import { asyncLocalStorage, logger } from "./logger";

type RouteContext = {
  params?: Promise<Record<string, string>>;
};

type HandlerFn = (
  request: NextRequest,
  context: RouteContext,
) => Promise<NextResponse>;

/**
 * Wraps a Next.js App Router route handler with:
 *
 *   1. Correlation ID — reads `x-correlation-id` from the request header
 *      or generates a UUID. Injected into every response header.
 *
 *   2. AsyncLocalStorage context — every `logger.*` call inside the handler
 *      automatically includes the correlation ID via the Pino `mixin`.
 *
 *   3. Global error boundary — thrown `HttpError` instances are serialised
 *      to `{ error, message, ref }`. Unhandled errors become 500s.
 *      Full stack traces are always logged server-side.
 *
 * Usage:
 *   export const GET = apiHandler(async (req) => {
 *     // throw HttpError from errors-v2 — apiHandler turns it into JSON
 *     return NextResponse.json({ ok: true });
 *   });
 */
export function apiHandler(handler: HandlerFn): HandlerFn {
  return async (request: NextRequest, context: RouteContext) => {
    const correlationId =
      request.headers.get("x-correlation-id") ?? crypto.randomUUID();

    return asyncLocalStorage.run({ correlationId }, async () => {
      try {
        const response = await handler(request, context);

        // Stamp every successful response with the correlation ID
        response.headers.set("x-correlation-id", correlationId);

        return response;
      } catch (error) {
        if (isHttpError(error)) {
          logger.error(
            {
              err: {
                message: error.message,
                stack: error.stack,
                details: error.details,
              },
              status: error.status,
              code: error.code,
            },
            error.message,
          );

          return NextResponse.json(
            { error: error.code, message: error.message, ref: correlationId },
            {
              status: error.status,
              headers: { "x-correlation-id": correlationId },
            },
          );
        }

        // Unhandled / unexpected errors
        logger.error(
          {
            err:
              error instanceof Error
                ? { message: error.message, stack: error.stack }
                : error,
          },
          "Unhandled route error",
        );

        return NextResponse.json(
          {
            error: "internal_error",
            message: "Something went wrong. Please try again.",
            ref: correlationId,
          },
          {
            status: 500,
            headers: { "x-correlation-id": correlationId },
          },
        );
      }
    });
  };
}
