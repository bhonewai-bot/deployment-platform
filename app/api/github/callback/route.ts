import { NextRequest, NextResponse } from "next/server";

import { githubAppCallbackSchema } from "@/features/github/schemas/github-app.schema";
import { getGitHubInstallation } from "@/features/github/server/github-app.service";
import { apiHandler } from "@/lib/api-handler";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", "/projects");
    return NextResponse.redirect(url);
  }

  const parsed = githubAppCallbackSchema.safeParse({
    installation_id: request.nextUrl.searchParams.get("installation_id"),
    setup_action: request.nextUrl.searchParams.get("setup_action") ?? undefined,
  });

  if (!parsed.success) {
    logger.warn(
      { issues: parsed.error.issues },
      "GitHub callback received invalid params",
    );
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    url.search = "";
    url.searchParams.set("github", "missing-installation");
    return NextResponse.redirect(url);
  }

  try {
    const installation = await getGitHubInstallation(
      parsed.data.installation_id,
    );

    await prisma.gitHubConnection.upsert({
      where: {
        userId_githubId_kind: {
          userId: session.user.id,
          githubId: installation.githubId,
          kind: "app_installation",
        },
      },
      create: {
        kind: "app_installation",
        githubLogin: installation.githubLogin,
        githubId: installation.githubId,
        installationId: installation.installationId,
        scopes: installation.repositorySelection,
        isActive: true,
        userId: session.user.id,
      },
      update: {
        githubLogin: installation.githubLogin,
        installationId: installation.installationId,
        scopes: installation.repositorySelection,
        isActive: true,
      },
    });

    logger.info(
      {
        installationId: installation.installationId,
        login: installation.githubLogin,
      },
      "GitHub App installation saved",
    );

    const url = request.nextUrl.clone();
    url.pathname = "/projects/new";
    url.search = "";
    url.searchParams.set("connected", "github");
    return NextResponse.redirect(url);
  } catch (error) {
    logger.error(
      {
        err:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      },
      "GitHub callback failed",
    );

    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    url.search = "";
    url.searchParams.set("github", "connection-failed");
    return NextResponse.redirect(url);
  }
});
