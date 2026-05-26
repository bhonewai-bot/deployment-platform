import "server-only";

import { dokployApiError, serviceUnavailable } from "@/lib/errors";

function getConfig() {
  const baseUrl = process.env.DOKPLOY_URL;
  const apiKey = process.env.DOKPLOY_KEY;

  // REQUIRE BOTH ENV VARS TO BE SET
  if (!baseUrl || !apiKey) {
    throw serviceUnavailable(
      "Dokploy is not configured. Set DOKPLOY_URL and DOKPLOY_KEY on the server.",
    );
  }

  return { baseUrl, apiKey };
}

function buildErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "Dokploy request failed.";
  }

  const record = data as Record<string, unknown>;

  // APPEND VALIDATION ISSUES IF PRESENT
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

  // BUILD QUERY STRING FOR GET, JSON BODY FOR POST
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

  // SEND REQUEST
  const response = await fetch(url, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  // THROW ON ERROR RESPONSE
  if (!response.ok) {
    throw dokployApiError(buildErrorMessage(data), data);
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
