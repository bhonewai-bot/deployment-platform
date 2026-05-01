import { NextResponse } from "next/server";

import { fetchDeploymentStatus } from "@/lib/deployment";
import {
  AppError,
  logError,
  toClientMessage,
  toStatusCode,
} from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      throw new AppError("applicationId is required.", 400);
    }

    const result = await fetchDeploymentStatus(applicationId);

    return NextResponse.json(result);
  } catch (error) {
    logError("api/deployment/status", error);

    return NextResponse.json(
      { error: toClientMessage(error, "Failed to load deployment status.") },
      { status: toStatusCode(error) },
    );
  }
}
