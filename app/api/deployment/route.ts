import { NextRequest, NextResponse } from "next/server";

import { deployParamsSchema } from "@/features/deployments/schemas/deploy-params.schema";
import { deployApplication } from "@/features/deployments/server/deployment";
import { apiHandler } from "@/lib/api-handler";
import { badRequest } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const POST = apiHandler(async (request: NextRequest) => {
  const body: unknown = await request.json();

  const parsed = deployParamsSchema.safeParse(body);

  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Invalid request body.");
  }

  logger.info(
    { repoUrl: parsed.data.repoUrl, branch: parsed.data.branch, buildType: parsed.data.buildType },
    "Starting deployment",
  );

  const result = await deployApplication(parsed.data);

  logger.info(
    { dokployApplicationId: result.dokployApplicationId, publicUrl: result.publicUrl },
    "Deployment triggered",
  );

  return NextResponse.json(result);
});
