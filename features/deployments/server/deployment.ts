import "server-only";

import type {
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

type ExistingApplication = {
  applicationId?: string;
  appName?: string | null;
  environmentId?: string | null;
};

// PATH / NAME HELPERS
function normalizePath(path: string): string {
  // DOKPLOY EXPECTS "." FOR ROOT, NOT EMPTY STRING, "./" OR "/"
  const trimmed = path.trim();
  if (!trimmed || trimmed === "." || trimmed === "./" || trimmed === "/") {
    return ".";
  }
  return trimmed.replace(/^\.\//, "").replace(/^\/+|\/+$/g, "");
}

function toAppName(value: string): string {
  // DOCKER CONTAINER NAME: LOWERCASE, ALPHANUMERIC WITH DOTS/DASHES, MAX 63 CHARS
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function buildEnvString(envVars: EnvVar[]): string {
  return (
    envVars
      // SKIP BLANK KEY OR VALUE ROWS
      .filter((item) => item.key.trim() && item.value.trim())
      // SKIP MASKED VALUES (BULLET PLACEHOLDER FOR EXISTING SECRETS)
      .filter((item) => !/^[•]+$/.test(item.value.trim()))
      .map((item) => `${item.key.trim()}=${item.value.trim()}`)
      .join("\n")
  );
}

// DOMAIN HELPERS
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
    // ONLY REWRITE WHEN SERVER URL IS A RAW IP, NOT A HOSTNAME
    !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(currentHost) ||
    !host.endsWith(".traefik.me")
  ) {
    return host;
  }
  // TRAEFIK.ME ENCODES IPS AS DASHES (e.g. 1.2.3.4 → 1-2-3-4.traefik.me)
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
    // ACCEPT BARE HOSTNAMES ONLY — SKIP FULL URLS
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
    // CHECK MOST LIKELY KEYS FIRST BEFORE FULL OBJECT SCAN
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

// DOMAIN CREATION
type DomainResult = { publicUrl: string | null; domainError: string | null };

async function createDomain(params: {
  appName: string;
  applicationId: string;
  containerPort: number;
}): Promise<DomainResult> {
  try {
    // GENERATE DOMAIN
    const generatedDomain = await dokploy("domain.generateDomain", {
      appName: params.appName,
    });

    const generatedHost = normalizeGeneratedHost(
      findHostCandidate(generatedDomain),
    );

    // FALL BACK TO EXISTING DOMAIN IF NONE GENERATED
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

    // REGISTER DOMAIN IN DOKPLOY
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
    // DOMAIN CREATION IS NON-FATAL — APP STILL DEPLOYS WITHOUT A PUBLIC URL
    logError("deployment/createDomain", error);
    return {
      publicUrl: null,
      domainError: toClientMessage(error, "Failed to generate public URL."),
    };
  }
}

// STATUS EXTRACTION
function extractStatus(application: unknown): DeploymentStatus {
  if (!application || typeof application !== "object") return "building";

  const record = application as Record<string, unknown>;
  const deployments = Array.isArray(record.deployments)
    ? (record.deployments as Array<Record<string, unknown>>)
    : [];

  // DEPLOYMENTS ARE NEWEST-FIRST — INDEX 0 IS THE ACTIVE ONE
  const latest = deployments[0];

  if (latest) {
    const status =
      typeof latest.status === "string" ? latest.status.toLowerCase() : "";
    const hasError =
      typeof latest.errorMessage === "string" && latest.errorMessage.length > 0;
    const finishedAt =
      typeof latest.finishedAt === "string" ? latest.finishedAt : null;

    // CHECK ERROR MESSAGE FIRST — MORE RELIABLE THAN STATUS FIELD
    if (
      hasError ||
      ["failed", "error", "killed", "cancelled"].includes(status)
    ) {
      return "error";
    }
    if (["running", "queued", "pending", "processing"].includes(status)) {
      return "building";
    }
    // FINISHED AT BEING SET MEANS BUILD RUNNER EXITED CLEANLY
    if (finishedAt || ["done", "success", "completed"].includes(status)) {
      return "done";
    }
  }

  // NO DEPLOYMENT RECORDS — FALL BACK TO TOP-LEVEL APPLICATION STATUS
  const appStatus =
    typeof record.applicationStatus === "string"
      ? record.applicationStatus.toLowerCase()
      : "";

  if (appStatus === "error") return "error";
  if (appStatus === "running") return "building";
  if (appStatus === "idle") return "idle";

  // DEFAULT TO "BUILDING" SO THE UI KEEPS POLLING
  return "building";
}

// LOG EXTRACTION
type RawLogLine = {
  time: string;
  message: string;
};

function extractRawLines(payload: unknown): RawLogLine[] {
  if (!payload) return [];

  if (typeof payload === "string") {
    // PLAIN TEXT RESPONSE — SPLIT ON NEWLINES AND WRAP EACH LINE
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
        // TRY COMMON FIELD NAMES DOKPLOY USES FOR LOG CONTENT
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
    // CHECK KNOWN WRAPPER KEYS BEFORE SCANNING ALL VALUES
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
  // DEBUG LINES ARE INTERNAL BUILDKIT NOISE — LESS IMPORTANT VISUALLY
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

// APPLICATION LOOKUP
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

    // UNWRAP KNOWN CONTAINER KEYS BEFORE CHECKING
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
  // SEARCH FOR EXISTING APPLICATION
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

  // REUSE EXISTING APPLICATION TO AVOID DUPLICATES
  if (existingApplicationId) {
    return existingApplicationId;
  }

  // CREATE NEW APPLICATION
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

// PUBLIC API
export async function deployApplication(
  params: DeployParams,
): Promise<DeployResult> {
  // VALIDATE ENVIRONMENT
  const environmentId = process.env.DOKPLOY_ENVIRONMENT_ID;

  if (!environmentId) {
    throw new AppError(
      "Dokploy is not configured. Set DOKPLOY_ENVIRONMENT_ID on the server.",
      500,
    );
  }

  // PARSE AND NORMALIZE INPUTS
  const { repo, url } = parseGithubRepo(params.repoUrl);
  const buildPath = normalizePath(params.rootDirectory);
  const appName = toAppName(repo);
  const env = buildEnvString(params.envVars ?? []);

  // GET OR CREATE APPLICATION
  const applicationId = await getOrCreateApplicationId({
    repo,
    appName,
    environmentId,
  });

  // CONFIGURE GIT PROVIDER
  await dokploy("application.saveGitProvider", {
    applicationId,
    customGitUrl: url,
    customGitBranch: params.branch || "main",
    customGitBuildPath: buildPath,
    enableSubmodules: false,
    watchPaths: null,
    customGitSSHKeyId: null,
  });

  // CONFIGURE BUILD TYPE
  if (params.deploymentType === "dockerfile") {
    // DOCKERFILE PATH: ROOT IF ".", ELSE SUBDIRECTORY
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

  // SAVE ENVIRONMENT VARIABLES
  await dokploy("application.saveEnvironment", {
    applicationId,
    env,
    buildArgs: "",
    buildSecrets: "",
    createEnvFile: true,
  });

  // QUEUE DEPLOYMENT (ASYNC IN DOKPLOY)
  await dokploy("application.deploy", { applicationId });

  // RESOLVE CONTAINER PORT
  const resolvedPort =
    typeof params.containerPort === "number" && params.containerPort > 0
      ? params.containerPort
      : params.deploymentType === "static"
        ? 80
        : 3000;

  // CREATE PUBLIC DOMAIN (AFTER DEPLOY IS QUEUED, NOT AFTER IT FINISHES)
  const domain =
    params.generatePublicUrl === false
      ? { publicUrl: null, domainError: null }
      : await createDomain({
          appName,
          applicationId,
          containerPort: resolvedPort,
        });

  // PERSIST DEPLOYMENT RECORD
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

  // RETURN RESULT
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
  // VALIDATE INPUT
  if (!applicationId) {
    throw new AppError("applicationId is required.", 400);
  }

  // FETCH APPLICATION STATE
  const application = await dokployGet("application.one", { applicationId });

  // FETCH LOGS (BEST-EFFORT — FAILURE MUST NOT BREAK STATUS POLLING)
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

  // EXTRACT STATUS AND LOGS
  const result = {
    status: extractStatus(application),
    logs: buildLogLines(extractRawLines(logsResponse)),
  };

  // PERSIST STATUS ON TERMINAL STATE ONLY
  if (result.status === "done" || result.status === "error") {
    await prisma.deployment.update({
      where: { applicationId },
      data: { status: result.status },
    });
  }

  return result;
}
