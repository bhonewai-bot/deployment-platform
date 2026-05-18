import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getGitHubAppInstallUrl } from "@/features/github/server/github-app.service";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", "/projects");
    return NextResponse.redirect(url);
  }

  const installUrl = getGitHubAppInstallUrl();

  if (!installUrl) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    url.searchParams.set("github", "missing-install-url");
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(installUrl);
}
