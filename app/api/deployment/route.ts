import { parseGithubRepo } from "@/lib/github";
import type { EnvVar } from "@/lib/types";
import { NextResponse } from "next/server";

type DeployBody = {
  repoUrl: string;
  branch: string;
  rootDirectory: string;
  deploymentType: "dockerfile" | "static";
  envVars?: EnvVar[];
};

function normalizePath(path: string) {
  const trimmed = path.trim();

  if (!trimmed || trimmed === "." || trimmed === "./") {
    return "./";
  }

  return trimmed.replace(/^\.\//, "").replace(/^\/+|\/+$/g, "");
}

function toAppName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function extractApplicationId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.applicationId === "string") {
    return record.applicationId;
  }

  if (typeof record.id === "string") {
    return record.id;
  }

  for (const value of Object.values(record)) {
    const nested = extractApplicationId(value);
    if (nested) {
      return nested;
    }
  }

  return null;
}

async function dokploy(path: string, body: unknown) {
  const baseUrl = process.env.DOKPLOY_URL;
  const apiKey = process.env.DOKPLOY_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Dokploy is not configured. Set DOKPLOY_URL and DOKPLOY_KEY on the server.",
    );
  }

  const response = await fetch(`${baseUrl}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  return data;
}

export async function POST(request: Request) {
  try {
    const environmentId = process.env.DOKPLOY_ENVIRONMENT_ID;

    if (!environmentId) {
      throw new Error(
        "Dokploy is not configured. Set DOKPLOY_ENVIRONMENT_ID on the server.",
      );
    }

    const { repoUrl, branch, rootDirectory, envVars } =
      (await request.json()) as DeployBody;

    const { repo, url } = parseGithubRepo(repoUrl);
    const buildPath = normalizePath(rootDirectory);
    const dockerfilePath =
      buildPath === "./" ? "Dockerfile" : `${buildPath}/Dockerfile`;
    const appName = toAppName(repo);
    const env = (envVars ?? [])
      .filter((item) => item.key.trim() && item.value.trim())
      .filter((item) => !/^[•]+$/.test(item.value.trim()))
      .map((item) => `${item.key.trim()}=${item.value.trim()}`)
      .join("\n");

    const createdApplication = await dokploy("application.create", {
      name: repo,
      appName,
      environmentId,
    });

    const applicationId = extractApplicationId(createdApplication);

    if (!applicationId) {
      throw new Error("Failed to create application");
    }

    await dokploy("application.saveGitProvider", {
      applicationId,
      customGitUrl: url,
      customGitBranch: branch || "main",
      customGitBuildPath: buildPath,
      enableSubmodules: false,
      watchPaths: null,
      customGitSSHKeyId: null,
    });

    await dokploy("application.saveBuildType", {
      applicationId,
      buildType: "dockerfile",
      dockerfile: dockerfilePath,
      dockerContextPath: buildPath,
      dockerBuildStage: null,
      herokuVersion: null,
      railpackVersion: null,
      publishDirectory: null,
      isStaticSpa: null,
    });

    await dokploy("application.saveEnvironment", {
      applicationId,
      env,
      buildArgs: "",
      buildSecrets: "",
      createEnvFile: true,
    });

    await dokploy("application.deploy", {
      applicationId,
    });

    return NextResponse.json({
      ok: true,
      applicationId,
      message: "Deployment started in Dokploy.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Deployment failed.",
      },
      { status: 400 },
    );
  }
}
