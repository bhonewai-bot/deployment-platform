import { NextRequest, NextResponse } from "next/server";

import { githubAppCallbackSchema } from "@/features/github/schemas/github-app.schema";
import { getGitHubInstallation } from "@/features/github/server/github-app.service";
import {
  GITHUB_STATE_COOKIE,
  isValidState,
} from "@/features/github/server/github-state";
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

  // ── CSRF / state validation ─────────────────────────────────────────────
  // The install route stores a random UUID in a short-lived httpOnly cookie
  // and appends the same value as ?state= on the GitHub install URL.
  // GitHub echoes it back here — we reject anything that doesn't match.
  const callbackState = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get(GITHUB_STATE_COOKIE)?.value ?? null;

  if (!isValidState(callbackState, cookieState)) {
    logger.warn(
      { callbackState, hasCookie: !!cookieState },
      "GitHub callback rejected: state mismatch or missing",
    );
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    url.search = "";
    url.searchParams.set("github", "invalid-state");
    const errorResponse = NextResponse.redirect(url);
    // Clear the cookie even on rejection to prevent reuse.
    errorResponse.cookies.delete(GITHUB_STATE_COOKIE);
    return errorResponse;
  }
  // ────────────────────────────────────────────────────────────────────────

  const parsed = githubAppCallbackSchema.safeParse({
    installation_id: request.nextUrl.searchParams.get("installation_id"),
    setup_action: request.nextUrl.searchParams.get("setup_action") ?? undefined,
    state: callbackState,
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
    const errorResponse = NextResponse.redirect(url);
    errorResponse.cookies.delete(GITHUB_STATE_COOKIE);
    return errorResponse;
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
    const successResponse = NextResponse.redirect(url);
    // Consume the state cookie — one-time use.
    successResponse.cookies.delete(GITHUB_STATE_COOKIE);
    return successResponse;
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
