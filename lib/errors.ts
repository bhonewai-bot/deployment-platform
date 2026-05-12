export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error instanceof Error ? error.message : error);
}

export function toClientMessage(error: unknown, fallback: string): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function toStatusCode(error: unknown): number {
  if (error instanceof AppError) return error.status;
  return 500;
}
