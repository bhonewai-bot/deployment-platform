import { NextRequest, NextResponse } from "next/server";

import { githubRepositoriesQuerySchema } from "@/features/github/schemas/github-app.schema";
import { listInstallationRepositories } from "@/features/github/server/github-app.service";
import { auth } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";
import { unauthorized, notFound, badRequest } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw unauthorized();

  const parsed = githubRepositoriesQuerySchema.safeParse({
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
    { installationId: connection.installationId },
    "Fetching repositories",
  );

  const repositories = await listInstallationRepositories(
    connection.installationId,
  );

  return NextResponse.json({
    connection: {
      id: connection.id,
      login: connection.githubLogin,
      repositorySelection: connection.scopes,
    },
    repositories,
  });
});
