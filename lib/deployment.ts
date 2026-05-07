import "server-only";

import { parseGithubRepo } from "@/lib/github";
import { dokploy, dokployGet } from "@/lib/dokploy";
import { AppError, logError, toClientMessage } from "@/lib/errors";
import type {
  DeployParams,
  DeployResult,
  DeploymentLogLine,
  DeploymentStatus,
  DeploymentStatusResult,
  EnvVar,
} from "@/lib/types";
import { prisma } from "./prisma";

type ExistingApplication = {
  applicationId?: string;
  appName?: string | null;
  environmentId?: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Path / name helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizePath(path: string): string {
  // Dokploy expects "." for root, not empty string, "./" or "/"
  const trimmed = path.trim();
  if (!trimmed || trimmed === "." || trimmed === "./" || trimmed === "/") {
    return ".";
  }
  return trimmed.replace(/^\.\//, "").replace(/^\/+|\/+$/g, "");
}

function toAppName(value: string): string {
  // Dokploy uses appName as a Docker container name, so it must be
  // lowercase, alphanumeric with dots/dashes only, and under 63 chars
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function buildEnvString(envVars: EnvVar[]): string {
  return (
    envVars
      // Skip rows where the user left key or value blank
      .filter((item) => item.key.trim() && item.value.trim())
      // Skip masked values (bullet placeholder shown in the UI for existing secrets)
      .filter((item) => !/^[•]+$/.test(item.value.trim()))
      .map((item) => `${item.key.trim()}=${item.value.trim()}`)
      .join("\n")
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain helpers
// ─────────────────────────────────────────────────────────────────────────────

function getDokployHost(): string | null {
  const baseUrl = process.env.DOKPLOY_URL;
  if (!baseUrl) return null;
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return null;
  }
}

/**
 * Dokploy's generated *.traefik.me domains embed the server IP.
 * When the server is only accessible by IP (no domain), the generated host
 * may contain a stale or wrong IP — we replace it with the actual server IP.
 */
function normalizeGeneratedHost(host: string | null): string | null {
  if (!host) return null;
  const currentHost = getDokployHost();
  if (
    !currentHost ||
    // Only rewrite when the server URL is a raw IP, not a hostname
    !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(currentHost) ||
    !host.endsWith(".traefik.me")
  ) {
    return host;
  }
  // traefik.me encodes IPs as dashes, e.g. 1.2.3.4 → 1-2-3-4.traefik.me
  const dashedIp = currentHost.replace(/\./g, "-");
  return host.replace(
    /-\d{1,3}(?:-\d{1,3}){3}\.traefik\.me$/,
    `-${dashedIp}.traefik.me`,
  );
}

/**
 * Recursively walks a Dokploy API response to find a hostname value.
 * Dokploy returns domain info in different shapes depending on the endpoint,
 * so we search by preferred key names before falling back to all values.
 */
function findHostCandidate(payload: unknown): string | null {
  if (!payload) return null;

  if (typeof payload === "string") {
    const t = payload.trim();
    // Accept bare hostnames only — skip full URLs since we build the URL ourselves
    if (
      t &&
      !t.startsWith("http://") &&
      !t.startsWith("https://") &&
      t.includes(".")
    ) {
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
    // Check the most likely keys first before doing a full object scan
    for (const key of ["host", "domain", "url", "fullDomain", "name"]) {
      if (typeof record[key] === "string") {
        const t = (record[key] as string).trim();
        if (
          t &&
          !t.startsWith("http://") &&
          !t.startsWith("https://") &&
          t.includes(".")
        ) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Domain creation
// ─────────────────────────────────────────────────────────────────────────────

type DomainResult = { publicUrl: string | null; domainError: string | null };

async function createDomain(params: {
  appName: string;
  applicationId: string;
  containerPort: number;
}): Promise<DomainResult> {
  try {
    const generatedDomain = await dokploy("domain.generateDomain", {
      appName: params.appName,
    });

    const generatedHost = normalizeGeneratedHost(
      findHostCandidate(generatedDomain),
    );

    // Fall back to an already-existing domain if Dokploy didn't generate a new one
    const existingHost = normalizeGeneratedHost(
      findHostCandidate(
        await dokployGet("domain.byApplicationId", {
          applicationId: params.applicationId,
        }),
      ),
    );

    const host = generatedHost ?? existingHost;

    if (!host) {
      throw new AppError("Dokploy did not return a generated domain.", 502);
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

    return { publicUrl: `http://${host}`, domainError: null };
  } catch (error) {
    // Domain creation is non-fatal — the app is still deploying,
    // we just won't have a public URL to show the user
    logError("deployment/createDomain", error);
    return {
      publicUrl: null,
      domainError: toClientMessage(error, "Failed to generate public URL."),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Status extraction
// ─────────────────────────────────────────────────────────────────────────────

function extractStatus(application: unknown): DeploymentStatus {
  if (!application || typeof application !== "object") return "building";

  const record = application as Record<string, unknown>;
  const deployments = Array.isArray(record.deployments)
    ? (record.deployments as Array<Record<string, unknown>>)
    : [];

  // Dokploy returns deployments newest-first, so index 0 is the active one
  const latest = deployments[0];

  if (latest) {
    const status =
      typeof latest.status === "string" ? latest.status.toLowerCase() : "";
    const hasError =
      typeof latest.errorMessage === "string" && latest.errorMessage.length > 0;
    const finishedAt =
      typeof latest.finishedAt === "string" ? latest.finishedAt : null;

    // errorMessage being set is more reliable than status === "error"
    // because Dokploy sometimes leaves status as "running" on failure
    if (
      hasError ||
      ["failed", "error", "killed", "cancelled"].includes(status)
    ) {
      return "error";
    }
    if (["running", "queued", "pending", "processing"].includes(status)) {
      return "building";
    }
    // finishedAt being set means the build runner exited cleanly
    if (finishedAt || ["done", "success", "completed"].includes(status)) {
      return "done";
    }
  }

  // No deployment records yet — fall back to the top-level applicationStatus field
  const appStatus =
    typeof record.applicationStatus === "string"
      ? record.applicationStatus.toLowerCase()
      : "";

  if (appStatus === "error") return "error";
  if (appStatus === "running") return "building";
  if (appStatus === "idle") return "idle";

  // Default to "building" rather than "idle" so the UI keeps polling
  return "building";
}

// ─────────────────────────────────────────────────────────────────────────────
// Log extraction
// ─────────────────────────────────────────────────────────────────────────────

type RawLogLine = {
  time: string;
  message: string;
};

function extractRawLines(payload: unknown): RawLogLine[] {
  if (!payload) return [];

  if (typeof payload === "string") {
    // Plain text response — split on newlines and wrap each line
    return payload
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((message) => ({ time: "", message }));
  }

  if (Array.isArray(payload)) {
    return payload.flatMap((item) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        return trimmed ? [{ time: "", message: trimmed }] : [];
      }

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        // Try the most common field names Dokploy uses for log content
        const message =
          typeof record.message === "string"
            ? record.message.trim()
            : typeof record.log === "string"
              ? record.log.trim()
              : typeof record.content === "string"
                ? record.content.trim()
                : typeof record.line === "string"
                  ? record.line.trim()
                  : null;

        const time =
          typeof record.time === "string"
            ? record.time
            : typeof record.timestamp === "string"
              ? record.timestamp
              : typeof record.createdAt === "string"
                ? record.createdAt
                : "";

        if (message) {
          return [{ time, message }];
        }
      }

      return extractRawLines(item);
    });
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    // Check known wrapper keys before scanning all values
    for (const key of [
      "logs",
      "log",
      "message",
      "messages",
      "content",
      "lines",
    ]) {
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
  if (
    lower.includes("error") ||
    lower.includes("failed") ||
    lower.includes("panic")
  ) {
    return "error";
  }
  if (
    lower.includes("success") ||
    lower.includes("completed") ||
    lower.includes("done")
  ) {
    return "success";
  }
  // Debug-level lines are typically internal buildkit noise — less important visually
  if (
    lower.includes("debug") ||
    lower.includes("[internal]") ||
    lower.includes("transferring")
  ) {
    return "debug";
  }
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

// ─────────────────────────────────────────────────────────────────────────────
// Application lookup
// ─────────────────────────────────────────────────────────────────────────────

function findApplicationId(
  payload: unknown,
  appName: string,
  environmentId: string,
): string | null {
  if (!payload) return null;

  const matches = (value: ExistingApplication) =>
    value.applicationId &&
    value.appName === appName &&
    value.environmentId === environmentId;

  if (Array.isArray(payload)) {
    const match = payload.find(
      (item) =>
        item &&
        typeof item === "object" &&
        matches(item as ExistingApplication),
    ) as ExistingApplication | undefined;

    return match?.applicationId ?? null;
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    // Dokploy sometimes wraps results in a named key — unwrap before checking
    for (const key of ["items", "applications", "data", "results"]) {
      const nested = findApplicationId(record[key], appName, environmentId);
      if (nested) {
        return nested;
      }
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

  const existingApplicationId = findApplicationId(
    existing,
    params.appName,
    params.environmentId,
  );

  // Re-use the existing application instead of creating a duplicate —
  // re-deploying the same repo should update the same Dokploy application
  if (existingApplicationId) {
    return existingApplicationId;
  }

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

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function deployApplication(
  params: DeployParams,
): Promise<DeployResult> {
  const environmentId = process.env.DOKPLOY_ENVIRONMENT_ID;

  if (!environmentId) {
    throw new AppError(
      "Dokploy is not configured. Set DOKPLOY_ENVIRONMENT_ID on the server.",
      500,
    );
  }

  const { repo, url } = parseGithubRepo(params.repoUrl);
  const buildPath = normalizePath(params.rootDirectory);
  const appName = toAppName(repo);
  const env = buildEnvString(params.envVars ?? []);

  const applicationId = await getOrCreateApplicationId({
    repo,
    appName,
    environmentId,
  });

  await dokploy("application.saveGitProvider", {
    applicationId,
    customGitUrl: url,
    customGitBranch: params.branch || "main",
    customGitBuildPath: buildPath,
    enableSubmodules: false,
    watchPaths: null,
    customGitSSHKeyId: null,
  });

  if (params.deploymentType === "dockerfile") {
    // When rootDirectory is ".", the Dockerfile sits at the repo root
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
  } else {
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

  // Deployment is async in Dokploy — this call just queues the build
  await dokploy("application.deploy", { applicationId });

  // Use the user-provided port, or default based on build type
  const resolvedPort =
    typeof params.containerPort === "number" && params.containerPort > 0
      ? params.containerPort
      : params.deploymentType === "static"
        ? 80
        : 3000;

  // Domain creation is attempted after deploy is queued, not after it finishes,
  // because Dokploy registers the route at container start — not build start
  const domain =
    params.generatePublicUrl === false
      ? { publicUrl: null, domainError: null }
      : await createDomain({
          appName,
          applicationId,
          containerPort: resolvedPort,
        });

  await prisma.deployment.create({
    data: {
      repoUrl: params.repoUrl,
      repoName: repo,
      branch: params.branch,
      rootDirectory: params.rootDirectory,
      deploymentType: params.deploymentType,
      containerPort: resolvedPort,
      applicationId,
      publicUrl: domain.publicUrl,
      status: "building",
    },
  });

  return {
    applicationId,
    message: "Deployment started in Dokploy.",
    publicUrl: domain.publicUrl,
    domainError: domain.domainError,
  };
}

export async function fetchDeploymentStatus(
  applicationId: string,
): Promise<DeploymentStatusResult> {
  if (!applicationId) {
    throw new AppError("applicationId is required.", 400);
  }

  const application = await dokployGet("application.one", { applicationId });

  // Log fetching is best-effort — a failure here must not break status polling
  let logsResponse: unknown = null;
  try {
    logsResponse = await dokployGet("application.readLogs", {
      applicationId,
      tail: 200,
      since: "10m",
    });
  } catch {
    logsResponse = null;
  }

  const result = {
    status: extractStatus(application),
    logs: buildLogLines(extractRawLines(logsResponse)),
  };

  // Only write to the DB when the deployment has reached a terminal state —
  // writing on every poll would be unnecessary churn
  if (result.status === "done" || result.status === "error") {
    await prisma.deployment.update({
      where: { applicationId },
      data: { status: result.status },
    });
  }

  return result;
}
