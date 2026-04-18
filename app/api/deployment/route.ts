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

type CreatedApplication = {
  applicationId?: string;
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
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`,
    )
    .join(" ")
    .slice(0, 63);
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

  if (!response.ok) {
    throw new Error(data?.message || "Dokploy request failed.");
  }

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

    const { repoUrl, branch, rootDirectory, deploymentType, envVars } =
      (await request.json()) as DeployBody;

    const { repo, url } = parseGithubRepo(repoUrl);
    const buildPath = normalizePath(rootDirectory);
    const appName = toAppName(repo);

    const env = (envVars ?? [])
      .filter((item) => item.key.trim() && item.value.trim())
      .filter((item) => !/^[•]+$/.test(item.value.trim()))
      .map((item) => `${item.key.trim()}=${item.value.trim()}`)
      .join("\n");

    const createdApplication = (await dokploy("application.create", {
      name: repo,
      appName,
      environmentId,
    })) as CreatedApplication;

    const applicationId = createdApplication.applicationId;

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

    if (deploymentType === "dockerfile") {
      const dockerfilePath =
        buildPath === "./" ? "Dockerfile" : `${buildPath}/Dockerfile`;

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
    }

    if (deploymentType === "static") {
      await dokploy("application.saveBuildType", {
        applicationId,
        buildType: "static",
        publishDirectory: buildPath,
        isStaticSpa: false,
        dockerfile: null,
        dockerContextPath: null,
        dockerBuildStage: null,
        herokuVersion: null,
        railpackVersion: null,
      });
    }

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
