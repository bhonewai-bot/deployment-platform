import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { fetchDeploymentStatus } from "@/features/deployments/server/deployment";
import { apiHandler } from "@/lib/api-handler";
import { badRequest } from "@/lib/errors";

const statusQuerySchema = z.object({
  applicationId: z.string().min(1, "applicationId is required."),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const parsed = statusQuerySchema.safeParse({
    applicationId: new URL(request.url).searchParams.get("applicationId"),
  });

  if (!parsed.success) {
    throw badRequest(
      parsed.error.issues[0]?.message ?? "Invalid query params.",
    );
  }

  const result = await fetchDeploymentStatus(parsed.data.applicationId);

  return NextResponse.json(result);
});
