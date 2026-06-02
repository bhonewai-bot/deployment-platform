import { NextRequest, NextResponse } from "next/server";

import { getGitHubAppInstallUrl } from "@/features/github/server/github-app.service";
import { GITHUB_STATE_COOKIE } from "@/features/github/server/github-state";
import { apiHandler } from "@/lib/api-handler";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const GET = apiHandler(async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", "/projects");
    return NextResponse.redirect(url);
  }

  const installUrl = getGitHubAppInstallUrl();

  if (!installUrl) {
    logger.error(
      "GITHUB_APP_INSTALL_URL is not set — cannot redirect to GitHub App install page",
    );
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    url.searchParams.set("github", "missing-install-url");
    return NextResponse.redirect(url);
  }

  // Generate a one-time state value and append it to the GitHub install URL.
  // GitHub echoes it back in the callback so we can verify the flow was
  // initiated by this user and not forged by a third party.
  const state = crypto.randomUUID();
  const destination = new URL(installUrl);
  destination.searchParams.set("state", state);

  logger.info(
    { installUrl: destination.href },
    "Redirecting to GitHub App install page",
  );

  const response = NextResponse.redirect(destination.href);

  // Store state in a short-lived httpOnly cookie so the callback can verify it.
  // sameSite: "lax" is required — GitHub's redirect back will include the cookie.
  response.cookies.set(GITHUB_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes — more than enough for an install flow
    path: "/",
  });

  return response;
});
