import { AsyncLocalStorage } from "async_hooks";
import pino from "pino";

interface RequestContext {
  correlationId: string;
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function getCorrelationId(): string | undefined {
  return asyncLocalStorage.getStore()?.correlationId;
}

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
    // Automatically merge correlationId into every log record
    mixin() {
      const correlationId = getCorrelationId();
      return correlationId ? { correlationId } : {};
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  // Pretty-print in development, plain JSON in production
  process.env.NODE_ENV !== "production"
    ? pino.transport({ target: "pino-pretty", options: { colorize: true } })
    : undefined,
);
