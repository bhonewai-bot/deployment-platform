import "server-only";

import type {
  BuildType,
  DeployParams,
  DeployResult,
  DeploymentLogLine,
  DeploymentStatus,
  DeploymentStatusResult,
  EnvVar,
} from "@/features/deployments/types";
import { dokploy, dokployGet } from "./dokploy-client";
import { parseGithubRepo } from "@/features/github/server/github.service";
import { prisma } from "@/lib/prisma";
import { AppError, logError, toClientMessage } from "@/lib/errors";

// ─── Path / name helpers ───────────────────────────────────────────────────────

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "." || trimmed === "./" || trimmed === "/") {
    return ".";
  }
  return trimmed.replace(/^\.\//, "").replace(/^\/+|\/+$/g, "");
}

function toAppName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function buildEnvString(envVars: EnvVar[]): string {
  return envVars
    .filter((item) => item.key.trim() && item.value.trim())
    .filter((item) => !/^[•]+$/.test(item.value.trim()))
    .map((item) => `${item.key.trim()}=${item.value.trim()}`)
    .join("\n");
}

// ─── Domain helpers ───────────────────────────────────────────────────────────

function getDokployHost(): string | null {
  const baseUrl = process.env.DOKPLOY_URL;
  if (!baseUrl) return null;
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return null;
  }
}

function normalizeGeneratedHost(host: string | null): string | null {
  if (!host) return null;
  const currentHost = getDokployHost();
  if (
    !currentHost ||
    !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(currentHost) ||
    !host.endsWith(".traefik.me")
  ) {
    return host;
  }
  const dashedIp = currentHost.replace(/\./g, "-");
  return host.replace(/-\d{1,3}(?:-\d{1,3}){3}\.traefik\.me$/, `-${dashedIp}.traefik.me`);
}

function findHostCandidate(payload: unknown): string | null {
  if (!payload) return null;

  if (typeof payload === "string") {
    const t = payload.trim();
    if (t && !t.startsWith("http://") && !t.startsWith("https://") && t.includes(".")) {
      return t;
    }
    return null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const candidate = findHostCandidate(item);
      if (candidate) return candidate;
    }
    return null;
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["host", "domain", "url", "fullDomain", "name"]) {
      if (typeof record[key] === "string") {
        const t = (record[key] as string).trim();
        if (t && !t.startsWith("http://") && !t.startsWith("https://") && t.includes(".")) {
          return t;
        }
      }
    }
    for (const value of Object.values(record)) {
      const candidate = findHostCandidate(value);
      if (candidate) return candidate;
    }
  }

  return null;
}

// ─── Domain creation ──────────────────────────────────────────────────────────

type DomainResult = { publicUrl: string | null; domainError: string | null };

async function createDomain(params: {
  appName: string;
  applicationId: string;
  containerPort: number;
}): Promise<DomainResult> {
  try {
    const generatedDomain = await dokploy("domain.generateDomain", { appName: params.appName });
    const generatedHost = normalizeGeneratedHost(findHostCandidate(generatedDomain));

    const existingHost = normalizeGeneratedHost(
      findHostCandidate(
        await dokployGet("domain.byApplicationId", { applicationId: params.applicationId }),
      ),
    );

    const host = generatedHost ?? existingHost;
    if (!host) throw new AppError("Dokploy did not return a generated domain.", 502);

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

    return { publicUrl: `http://${host}`, domainError: null };
  } catch (error) {
    logError("deployment/createDomain", error);
    return { publicUrl: null, domainError: toClientMessage(error, "Failed to generate public URL.") };
  }
}

// ─── Application lookup ───────────────────────────────────────────────────────

type ExistingApplication = {
  applicationId?: string;
  appName?: string | null;
  environmentId?: string | null;
};

function findApplicationId(payload: unknown, appName: string, environmentId: string): string | null {
  if (!payload) return null;

  const matches = (value: ExistingApplication) =>
    value.applicationId && value.appName === appName && value.environmentId === environmentId;

  if (Array.isArray(payload)) {
    const match = payload.find(
      (item) => item && typeof item === "object" && matches(item as ExistingApplication),
    ) as ExistingApplication | undefined;
    return match?.applicationId ?? null;
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["items", "applications", "data", "results"]) {
      const nested = findApplicationId(record[key], appName, environmentId);
      if (nested) return nested;
    }
    if (matches(record as ExistingApplication)) {
      return (record as ExistingApplication).applicationId ?? null;
    }
  }

  return null;
}

async function getOrCreateApplicationId(params: {
  repo: string;
  appName: string;
  environmentId: string;
}): Promise<string> {
  const existing = await dokployGet("application.search", {
    appName: params.appName,
    environmentId: params.environmentId,
    limit: 1,
  });

  const existingId = findApplicationId(existing, params.appName, params.environmentId);
  if (existingId) return existingId;

  const created = (await dokploy("application.create", {
    name: params.repo,
    appName: params.appName,
    environmentId: params.environmentId,
  })) as { applicationId?: string };

  if (!created.applicationId) {
    throw new AppError("Failed to create application in Dokploy.", 502);
  }

  return created.applicationId;
}

// ─── Build type configuration ─────────────────────────────────────────────────

async function configureBuildType(params: {
  applicationId: string;
  buildType: BuildType;
  buildPath: string;
  dockerfilePath: string;
  publishDirectory: string;
}) {
  const { applicationId, buildType, buildPath, dockerfilePath, publishDirectory } = params;

  if (buildType === "dockerfile") {
    const resolvedDockerfile = buildPath === "." ? dockerfilePath : `${buildPath}/${dockerfilePath}`;
    await dokploy("application.saveBuildType", {
      applicationId,
      buildType: "dockerfile",
      dockerfile: resolvedDockerfile,
      dockerContextPath: buildPath,
      dockerBuildStage: null,
      herokuVersion: null,
      railpackVersion: null,
      publishDirectory: null,
      isStaticSpa: null,
    });
  } else if (buildType === "static") {
    const resolvedPublish = buildPath === "." ? publishDirectory : `${buildPath}/${publishDirectory}`;
    await dokploy("application.saveBuildType", {
      applicationId,
      buildType: "static",
      publishDirectory: resolvedPublish,
      isStaticSpa: false,
      dockerfile: null,
      dockerContextPath: null,
      dockerBuildStage: null,
      herokuVersion: null,
      railpackVersion: null,
    });
  } else {
    // nixpacks — Dokploy auto-detects the build pack
    await dokploy("application.saveBuildType", {
      applicationId,
      buildType: "nixpacks",
      dockerfile: null,
      dockerContextPath: buildPath,
      dockerBuildStage: null,
      herokuVersion: null,
      railpackVersion: null,
      publishDirectory: null,
      isStaticSpa: null,
    });
  }
}

// ─── Core Dokploy call (no DB side effects) ───────────────────────────────────

/**
 * Sends all required Dokploy API calls to configure + trigger a deployment.
 * Does NOT write anything to the database — callers are responsible for that.
 */
export async function callDokploy(params: DeployParams): Promise<DeployResult> {
  const environmentId = process.env.DOKPLOY_ENVIRONMENT_ID;
  if (!environmentId) {
    throw new AppError("DOKPLOY_ENVIRONMENT_ID is not set.", 500);
  }

  const { repo, url } = parseGithubRepo(params.repoUrl);
  const buildPath = normalizePath(params.rootDirectory);
  const appName = toAppName(repo);
  const env = buildEnvString(params.envVars ?? []);

  const resolvedPort =
    typeof params.containerPort === "number" && params.containerPort > 0
      ? params.containerPort
      : params.buildType === "static" ? 80 : 3000;

  // Get or create application
  const dokployApplicationId = await getOrCreateApplicationId({ repo, appName, environmentId });

  // Configure git provider
  await dokploy("application.saveGitProvider", {
    applicationId: dokployApplicationId,
    customGitUrl: url,
    customGitBranch: params.branch || "main",
    customGitBuildPath: buildPath,
    enableSubmodules: false,
    watchPaths: null,
    customGitSSHKeyId: null,
  });

  // Configure build type
  await configureBuildType({
    applicationId: dokployApplicationId,
    buildType: params.buildType,
    buildPath,
    dockerfilePath: params.dockerfilePath ?? "Dockerfile",
    publishDirectory: params.publishDirectory ?? "dist",
  });

  // Save env vars
  await dokploy("application.saveEnvironment", {
    applicationId: dokployApplicationId,
    env,
    buildArgs: "",
    buildSecrets: "",
    createEnvFile: true,
  });

  // Trigger deploy
  await dokploy("application.deploy", { applicationId: dokployApplicationId });

  // Create public domain
  const domain =
    params.generatePublicUrl === false
      ? { publicUrl: null, domainError: null }
      : await createDomain({ appName, applicationId: dokployApplicationId, containerPort: resolvedPort });

  return {
    dokployApplicationId,
    message: "Deployment started in Dokploy.",
    publicUrl: domain.publicUrl,
    domainError: domain.domainError,
  };
}

// ─── Legacy wrapper (keeps old API route working) ────────────────────────────

export async function deployApplication(params: DeployParams): Promise<DeployResult> {
  const result = await callDokploy(params);

  const { repo } = parseGithubRepo(params.repoUrl);
  const resolvedPort =
    typeof params.containerPort === "number" && params.containerPort > 0
      ? params.containerPort
      : params.buildType === "static" ? 80 : 3000;

  // Legacy Deployment record — kept for backwards compat with existing UI
  await prisma.deployment.upsert({
    where: { applicationId: result.dokployApplicationId },
    create: {
      repoUrl: params.repoUrl,
      repoName: repo,
      branch: params.branch,
      rootDirectory: params.rootDirectory,
      deploymentType: params.buildType,
      containerPort: resolvedPort,
      applicationId: result.dokployApplicationId,
      publicUrl: result.publicUrl,
      status: "building",
    },
    update: {
      publicUrl: result.publicUrl,
      status: "building",
    },
  });

  return result;
}

// ─── Status polling ───────────────────────────────────────────────────────────

function extractStatus(application: unknown): DeploymentStatus {
  if (!application || typeof application !== "object") return "building";

  const record = application as Record<string, unknown>;
  const deployments = Array.isArray(record.deployments)
    ? (record.deployments as Array<Record<string, unknown>>)
    : [];

  const latest = deployments[0];

  if (latest) {
    const status = typeof latest.status === "string" ? latest.status.toLowerCase() : "";
    const hasError = typeof latest.errorMessage === "string" && latest.errorMessage.length > 0;
    const finishedAt = typeof latest.finishedAt === "string" ? latest.finishedAt : null;

    if (hasError || ["failed", "error", "killed", "cancelled"].includes(status)) return "error";
    if (["running", "queued", "pending", "processing"].includes(status)) return "building";
    if (finishedAt || ["done", "success", "completed"].includes(status)) return "done";
  }

  const appStatus =
    typeof record.applicationStatus === "string" ? record.applicationStatus.toLowerCase() : "";

  if (appStatus === "error") return "error";
  if (appStatus === "running") return "building";
  if (appStatus === "idle") return "idle";

  return "building";
}

type RawLogLine = { time: string; message: string };

function extractRawLines(payload: unknown): RawLogLine[] {
  if (!payload) return [];

  if (typeof payload === "string") {
    return payload.split("\n").map((line) => line.trim()).filter(Boolean).map((message) => ({ time: "", message }));
  }

  if (Array.isArray(payload)) {
    return payload.flatMap((item) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        return trimmed ? [{ time: "", message: trimmed }] : [];
      }
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const message =
          typeof record.message === "string" ? record.message.trim()
          : typeof record.log === "string" ? record.log.trim()
          : typeof record.content === "string" ? record.content.trim()
          : typeof record.line === "string" ? record.line.trim()
          : null;
        const time =
          typeof record.time === "string" ? record.time
          : typeof record.timestamp === "string" ? record.timestamp
          : typeof record.createdAt === "string" ? record.createdAt
          : "";
        if (message) return [{ time, message }];
      }
      return extractRawLines(item);
    });
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["logs", "log", "message", "messages", "content", "lines"]) {
      if (key in record) {
        const extracted = extractRawLines(record[key]);
        if (extracted.length > 0) return extracted;
      }
    }
    for (const value of Object.values(record)) {
      const extracted = extractRawLines(value);
      if (extracted.length > 0) return extracted;
    }
  }

  return [];
}

function classifyLogLine(message: string): DeploymentLogLine["level"] {
  const lower = message.toLowerCase();
  if (lower.includes("error") || lower.includes("failed") || lower.includes("panic")) return "error";
  if (lower.includes("success") || lower.includes("completed") || lower.includes("done")) return "success";
  if (lower.includes("debug") || lower.includes("[internal]") || lower.includes("transferring")) return "debug";
  return "info";
}

function buildLogLines(rawLines: RawLogLine[]): DeploymentLogLine[] {
  return rawLines.map(({ time, message }, index) => ({
    id: `${index}-${message}`,
    time,
    level: classifyLogLine(message),
    message,
  }));
}

export async function fetchDeploymentStatus(applicationId: string): Promise<DeploymentStatusResult> {
  if (!applicationId) throw new AppError("applicationId is required.", 400);

  const application = await dokployGet("application.one", { applicationId });

  let logsResponse: unknown = null;
  try {
    logsResponse = await dokployGet("application.readLogs", { applicationId, tail: 200, since: "10m" });
  } catch {
    logsResponse = null;
  }

  const status = extractStatus(application);
  const logs = buildLogLines(extractRawLines(logsResponse));

  // Sync DeploymentRun status on terminal state
  if (status === "done" || status === "error") {
    const runStatus = status === "done" ? "success" : "failed";
    await prisma.deploymentRun.updateMany({
      where: { dokployApplicationId: applicationId, status: "building" },
      data: { status: runStatus },
    });
    // Keep legacy Deployment record in sync too
    try {
      await prisma.deployment.update({ where: { applicationId }, data: { status } });
    } catch {
      // Legacy record may not exist — ignore
    }
  }

  return { status, logs };
}
