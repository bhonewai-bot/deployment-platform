import { NextResponse } from "next/server";
import { z } from "zod";

import { logError, toClientMessage, toStatusCode } from "@/lib/errors";
import { fetchDeploymentStatus } from "@/features/deployments/server/deployment";

const statusQuerySchema = z.object({
  applicationId: z.string().min(1, "applicationId is required."),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = statusQuerySchema.safeParse({
      applicationId: searchParams.get("applicationId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid query params." },
        { status: 400 },
      );
    }

    const result = await fetchDeploymentStatus(parsed.data.applicationId);

    return NextResponse.json(result);
  } catch (error) {
    logError("api/deployment/status", error);

    return NextResponse.json(
      { error: toClientMessage(error, "Failed to load deployment status.") },
      { status: toStatusCode(error) },
    );
  }
}
