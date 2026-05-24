import { NextRequest, NextResponse } from "next/server";

import { githubDetectQuerySchema } from "@/features/github/schemas/github-app.schema";
import { detectInstallationRepository } from "@/features/github/server/github-app.service";
import { auth } from "@/lib/auth";
import { logError, toClientMessage, toStatusCode } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const parsed = githubDetectQuerySchema.safeParse({
      repoFullName: request.nextUrl.searchParams.get("repoFullName") ?? undefined,
      branch: request.nextUrl.searchParams.get("branch") ?? undefined,
      connectionId: request.nextUrl.searchParams.get("connectionId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid query." },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: "No GitHub App installation found." },
        { status: 404 },
      );
    }

    const result = await detectInstallationRepository(
      connection.installationId,
      parsed.data.repoFullName,
      parsed.data.branch,
    );

    return NextResponse.json(result);
  } catch (error) {
    logError("api/github/detect", error);

    return NextResponse.json(
      { error: toClientMessage(error, "Failed to detect repository.") },
      { status: toStatusCode(error) },
    );
  }
}
