import { NextRequest, NextResponse } from "next/server";

import { githubAppCallbackSchema } from "@/features/github/schemas/github-app.schema";
import { getGitHubInstallation } from "@/features/github/server/github-app.service";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const redirectUrl = request.nextUrl.clone();

  if (!session) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", "/projects");
    return NextResponse.redirect(redirectUrl);
  }

  const parsed = githubAppCallbackSchema.safeParse({
    installation_id: request.nextUrl.searchParams.get("installation_id"),
    setup_action: request.nextUrl.searchParams.get("setup_action") ?? undefined,
  });

  if (!parsed.success) {
    redirectUrl.pathname = "/projects";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("github", "missing-installation");
    return NextResponse.redirect(redirectUrl);
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

    redirectUrl.pathname = "/projects/new";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("connected", "github");
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    logError("api/github/callback", error);

    redirectUrl.pathname = "/projects";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("github", "connection-failed");
    return NextResponse.redirect(redirectUrl);
  }
}
