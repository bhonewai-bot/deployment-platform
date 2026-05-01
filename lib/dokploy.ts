import { AppError } from "@/lib/errors";

function getConfig() {
  const baseUrl = process.env.DOKPLOY_URL;
  const apiKey = process.env.DOKPLOY_KEY;

  if (!baseUrl || !apiKey) {
    throw new AppError(
      "Dokploy is not configured. Set DOKPLOY_URL and DOKPLOY_KEY on the server.",
      500,
    );
  }

  return { baseUrl, apiKey };
}

function buildErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "Dokploy request failed.";
  }

  const record = data as Record<string, unknown>;

  const issues =
    Array.isArray(record.issues) && record.issues.length > 0
      ? ` ${record.issues
          .map((issue: { message?: string }) => issue.message)
          .filter(Boolean)
          .join(", ")}`
      : "";

  const base =
    typeof record.message === "string"
      ? record.message
      : "Dokploy request failed.";

  return `${base}${issues}`.trim();
}

async function dokployFetch(
  method: "GET" | "POST",
  path: string,
  payload?: unknown,
): Promise<unknown> {
  const { baseUrl, apiKey } = getConfig();

  const headers: Record<string, string> = {
    "x-api-key": apiKey,
  };

  let url = `${baseUrl}/${path}`;
  let body: string | undefined;

  if (method === "GET" && payload && typeof payload === "object") {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(
      payload as Record<string, string | number | undefined>,
    )) {
      if (value !== undefined) {
        params.set(key, value.toString());
      }
    }

    url += `?${params.toString()}`;
  } else if (method === "POST") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(payload);
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AppError(buildErrorMessage(data), 502);
  }

  return data;
}

export function dokploy(path: string, body: unknown): Promise<unknown> {
  return dokployFetch("POST", path, body);
}

export function dokployGet(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<unknown> {
  return dokployFetch("GET", path, params);
}
