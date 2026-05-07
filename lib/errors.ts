export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toClientMessage(error: unknown, fallback: string): string {
  if (error instanceof AppError) {
    return error.statusCode === 500 ? fallback : error.message;
  }

  return fallback;
}

export function toStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  return 500;
}

export function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, message);

  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    console.error(error.stack);
  }
}
