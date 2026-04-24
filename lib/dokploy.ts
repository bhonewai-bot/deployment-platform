export async function dokployGet(
  path: string,
  params: Record<string, string | number | undefined>,
) {
  const baseUrl = process.env.DOKPLOY_URL;
  const apiKey = process.env.DOKPLOY_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Dokploy is not configured.");
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, value.toString());
    }
  }

  const response = await fetch(
    `${baseUrl}/${path}?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const issues =
      Array.isArray(data?.issues) && data.issues.length > 0
        ? ` ${data.issues
            .map((issue: { message?: string }) => issue.message)
            .filter(Boolean)
            .join(", ")}`
        : "";

    throw new Error(
      `${data?.message || "Dokploy request failed."}${issues}`.trim(),
    );
  }

  return data;
}
