import { parseGithubRepo } from "@/lib/github";
import type { EnvVar } from "@/lib/types";
import { NextResponse } from "next/server";
import { dokployGet } from "./status/route";

type DeployBody = {
  repoUrl: string;
  branch: string;
  rootDirectory: string;
  deploymentType: "dockerfile" | "static";
  containerPort?: number;
  generatePublicUrl?: boolean;
  envVars?: EnvVar[];
};

type CreatedApplication = {
  applicationId?: string;
};

type DomainResult = {
  publicUrl: string | null;
  error: string | null;
};

function normalizePath(path: string) {
  const trimmed = path.trim();

  if (!trimmed || trimmed === "." || trimmed === "./" || trimmed === "/") {
    return ".";
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
    const issues =
      Array.isArray(data?.issues) && data.issues.length > 0
        ? ` ${data.issues
            .map((issue: { message?: string }) => issue.message)
            .filter(Boolean)
            .join(", ")}`
        : "";

    throw new Error(
      `${data?.message || "Dokploy request failed."}${issues}`.trim(),
    );
  }

  return data;
}

function findHostCandidate(payload: unknown): string | null {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    const trimmed = payload.trim();

    if (
      trimmed &&
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      trimmed.includes(".")
    ) {
      return trimmed;
    }

    return null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const candidate = findHostCandidate(item);

      if (candidate) {
        return candidate;
      }
    }

    return null;
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const preferredKeys = ["host", "domain", "url", "fullDomain", "name"];

    for (const key of preferredKeys) {
      if (key in record) {
        const value = record[key];

        if (typeof value === "string") {
          const trimmed = value.trim();

          if (
            trimmed &&
            !trimmed.startsWith("http://") &&
            !trimmed.startsWith("https://") &&
            trimmed.includes(".")
          ) {
            return trimmed;
          }
        }
      }
    }

    for (const value of Object.values(record)) {
      const candidate = findHostCandidate(value);

      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

async function createGeneratedDomain(params: {
  appName: string;
  applicationId: string;
  containerPort: number;
}): Promise<DomainResult> {
  try {
    const generatedDomain = await dokploy("domain.generateDomain", {
      appName: params.appName,
    });

    const host =
      findHostCandidate(generatedDomain) ||
      findHostCandidate(
        await dokployGet("domain.byApplicationId", {
          applicationId: params.applicationId,
        }),
      );

    if (!host) {
      throw new Error("Dokploy did not return a generated domain.");
    }

    await dokploy("domain.create", {
      host,
      path: "/",
      port: params.containerPort,
      https: false,
      applicationId: params.applicationId,
      certificateType: "none",
      customCertResolver: null,
      composeId: null,
      serviceName: null,
      domainType: "application",
      previewDeploymentId: null,
      internalPath: null,
      stripPath: false,
    });

    return {
      publicUrl: `http://${host}`,
      error: null,
    };
  } catch (error) {
    return {
      publicUrl: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate public URL.",
    };
  }
}

export async function POST(request: Request) {
  try {
    const environmentId = process.env.DOKPLOY_ENVIRONMENT_ID;

    if (!environmentId) {
      throw new Error(
        "Dokploy is not configured. Set DOKPLOY_ENVIRONMENT_ID on the server.",
      );
    }

    const {
      repoUrl,
      branch,
      rootDirectory,
      deploymentType,
      containerPort,
      generatePublicUrl,
      envVars,
    } = (await request.json()) as DeployBody;

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
        buildPath === "." ? "Dockerfile" : `${buildPath}/Dockerfile`;

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

    const resolvedContainerPort =
      typeof containerPort === "number" && containerPort > 0
        ? containerPort
        : deploymentType === "static"
          ? 80
          : 3000;

    const domainResult =
      generatePublicUrl === false
        ? { publicUrl: null, error: null }
        : await createGeneratedDomain({
            appName,
            applicationId,
            containerPort: resolvedContainerPort,
          });

    return NextResponse.json({
      ok: true,
      applicationId,
      message: "Deployment started in Dokploy.",
      publicUrl: domainResult.publicUrl,
      domainError: domainResult.error,
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
