import { NextRequest, NextResponse } from "next/server";

import { getGitHubAppInstallUrl } from "@/features/github/server/github-app.service";
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
    logger.error("GITHUB_APP_INSTALL_URL is not set — cannot redirect to GitHub App install page");
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    url.searchParams.set("github", "missing-install-url");
    return NextResponse.redirect(url);
  }

  logger.info({ installUrl }, "Redirecting to GitHub App install page");

  return NextResponse.redirect(installUrl);
});
