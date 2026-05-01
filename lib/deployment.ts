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

type ExistingApplication = {
  applicationId?: string;
  appName?: string | null;
  environmentId?: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Path / name helpers
// ─────────────────────────────────────────────────────────────────────────────

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
    !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(currentHost) ||
    !host.endsWith(".traefik.me")
  ) {
    return host;
  }
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

  const latest = deployments[0];

  if (latest) {
    const status =
      typeof latest.status === "string" ? latest.status.toLowerCase() : "";
    const hasError =
      typeof latest.errorMessage === "string" && latest.errorMessage.length > 0;
    const finishedAt =
      typeof latest.finishedAt === "string" ? latest.finishedAt : null;

    if (
      hasError ||
      ["failed", "error", "killed", "cancelled"].includes(status)
    ) {
      return "error";
    }
    if (["running", "queued", "pending", "processing"].includes(status)) {
      return "building";
    }
    if (finishedAt || ["done", "success", "completed"].includes(status)) {
      return "done";
    }
  }

  const appStatus =
    typeof record.applicationStatus === "string"
      ? record.applicationStatus.toLowerCase()
      : "";

  if (appStatus === "error") return "error";
  if (appStatus === "running") return "building";
  if (appStatus === "idle") return "idle";

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
      (item) => item && typeof item === "object" && matches(item as ExistingApplication),
    ) as ExistingApplication | undefined;

    return match?.applicationId ?? null;
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;

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

  // 2. Link git repository
  await dokploy("application.saveGitProvider", {
    applicationId,
    customGitUrl: url,
    customGitBranch: params.branch || "main",
    customGitBuildPath: buildPath,
    enableSubmodules: false,
    watchPaths: null,
    customGitSSHKeyId: null,
  });

  // 3. Configure build type
  if (params.deploymentType === "dockerfile") {
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

  // 4. Save environment variables
  await dokploy("application.saveEnvironment", {
    applicationId,
    env,
    buildArgs: "",
    buildSecrets: "",
    createEnvFile: true,
  });

  // 5. Trigger deployment
  await dokploy("application.deploy", { applicationId });

  // 6. Optionally create a public domain
  const resolvedPort =
    typeof params.containerPort === "number" && params.containerPort > 0
      ? params.containerPort
      : params.deploymentType === "static"
        ? 80
        : 3000;

  const domain =
    params.generatePublicUrl === false
      ? { publicUrl: null, domainError: null }
      : await createDomain({
          appName,
          applicationId,
          containerPort: resolvedPort,
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

  // Log fetch is best-effort — a failure should not block status polling.
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

  return {
    status: extractStatus(application),
    logs: buildLogLines(extractRawLines(logsResponse)),
  };
}
