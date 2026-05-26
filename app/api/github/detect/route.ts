import { NextRequest, NextResponse } from "next/server";

import { githubDetectQuerySchema } from "@/features/github/schemas/github-app.schema";
import { detectInstallationRepository } from "@/features/github/server/github-app.service";
import { auth } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";
import { unauthorized, notFound, badRequest } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw unauthorized();

  const parsed = githubDetectQuerySchema.safeParse({
    repoFullName: request.nextUrl.searchParams.get("repoFullName") ?? undefined,
    branch: request.nextUrl.searchParams.get("branch") ?? undefined,
    connectionId: request.nextUrl.searchParams.get("connectionId") ?? undefined,
  });

  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Invalid query.");
  }

  const connection = await prisma.gitHubConnection.findFirst({
    where: {
      ...(parsed.data.connectionId ? { id: parsed.data.connectionId } : {}),
      userId: session.user.id,
      kind: "app_installation",
      isActive: true,
      installationId: { not: null },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!connection?.installationId) {
    throw notFound("No GitHub App installation found.");
  }

  logger.info(
    { repoFullName: parsed.data.repoFullName, branch: parsed.data.branch },
    "Detecting repository build type",
  );

  const result = await detectInstallationRepository(
    connection.installationId,
    parsed.data.repoFullName,
    parsed.data.branch,
  );

  logger.info(
    { buildType: result.buildType, confidence: result.confidence },
    "Detection complete",
  );

  return NextResponse.json(result);
});
