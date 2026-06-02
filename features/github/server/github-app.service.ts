import "server-only";

import { createSign } from "crypto";

import { githubApiError, serviceUnavailable } from "@/lib/errors";
import { cacheGet, cacheSet } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { detectBuildType } from "./detect-build-type";

const GITHUB_API_BASE_URL =
  process.env.GITHUB_API_BASE_URL ?? "https://api.github.com";
const GITHUB_API_VERSION = process.env.GITHUB_API_VERSION ?? "2022-11-28";

type GitHubInstallationAccount = {
  id: number;
  login: string;
  type: "User" | "Organization" | string;
};

type GitHubInstallationResponse = {
  id: number;
  account: GitHubInstallationAccount | null;
  repository_selection: "all" | "selected" | string;
};

type GitHubInstallationTokenResponse = {
  token: string;
  expires_at: string;
};

export type GitHubInstallationRepository = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
  language: string | null;
  updatedAt: string;
};

type GitHubRepositoriesResponse = {
  repositories: Array<{
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    private: boolean;
    default_branch: string;
    html_url: string;
    language: string | null;
    updated_at: string;
  }>;
};

type GitHubContentItem = {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "submodule";
};

export type DetectedBuildType = "nixpacks" | "dockerfile" | "static";

export type DetectRepositoryResult = {
  buildType: DetectedBuildType;
  /** Confidence: "auto" means we're sure, "guess" means fallback */
  confidence: "auto" | "guess";
  /** Pre-filled suggestions the user can override */
  suggestions: {
    port: string;
    dockerfilePath: string;
    publishDirectory: string;
  };
  /** Root-level file names that informed the decision */
  detectedFiles: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw serviceUnavailable(`Missing ${name} environment variable.`);
  return value;
}

function base64Url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function getPrivateKey() {
  const base64Key = process.env.GITHUB_APP_PRIVATE_KEY;

  if (base64Key) {
    return Buffer.from(base64Key, "base64").toString("utf8");
  }

  const key = requireEnv("GITHUB_APP_PRIVATE_KEY").replace(/\\n/g, "\n");

  if (!key.includes("-----END")) {
    throw serviceUnavailable(
      "GITHUB_APP_PRIVATE_KEY is not a complete private key. Use escaped newline characters or GITHUB_APP_PRIVATE_KEY.",
    );
  }

  return key;
}

export function getGitHubAppInstallUrl() {
  return (
    process.env.GITHUB_APP_INSTALL_URL ??
    process.env.GITHUB_APP_SETUP_URL ??
    null
  );
}

export function createGitHubAppJwt() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 9 * 60,
    iss: requireEnv("GITHUB_APP_ID"),
  };

  const unsignedToken = [
    base64Url({ alg: "RS256", typ: "JWT" }),
    base64Url(payload),
  ].join(".");

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(getPrivateKey()).toString("base64url");
  return `${unsignedToken}.${signature}`;
}

async function githubFetch<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw githubApiError(
      `GitHub request failed with status ${response.status}: ${body}`,
      { status: response.status, body },
    );
  }

  return response.json() as Promise<T>;
}

// ─── Public functions ─────────────────────────────────────────────────────────

export async function getGitHubInstallation(installationId: string) {
  const installation = await githubFetch<GitHubInstallationResponse>(
    `/app/installations/${installationId}`,
    createGitHubAppJwt(),
  );

  if (!installation.account) {
    throw githubApiError("GitHub installation account was not returned.");
  }

  return {
    installationId: String(installation.id),
    githubId: String(installation.account.id),
    githubLogin: installation.account.login,
    accountType: installation.account.type,
    repositorySelection: installation.repository_selection,
  };
}

export async function createInstallationAccessToken(installationId: string) {
  const cacheKey = `github:installation_token:${installationId}`;

  // Check Redis cache first — GitHub tokens last 1h, GitHub rate-limits
  // installations to 100 token creations per hour.
  const cached = await cacheGet(cacheKey);
  if (cached) {
    logger.debug({ installationId }, "using cached installation token");
    return { token: cached, expires_at: "" };
  }

  const result = await githubFetch<GitHubInstallationTokenResponse>(
    `/app/installations/${installationId}/access_tokens`,
    createGitHubAppJwt(),
    { method: "POST" },
  );

  // Cache the token until 60 s before its expiry (GitHub tokens live 1h).
  const ttlSeconds = computeTokenTtl(result.expires_at);
  await cacheSet(cacheKey, result.token, ttlSeconds);

  return result;
}

/**
 * Compute the number of seconds until `expiresAt`, minus a 60-second safety margin.
 * Falls back to 55 minutes if the date cannot be parsed.
 */
function computeTokenTtl(expiresAt: string): number {
  if (!expiresAt) return 55 * 60;
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return 55 * 60;
  const ttl = Math.floor((expiry - Date.now()) / 1000) - 60;
  return Math.max(60, ttl);
}

export async function listInstallationRepositories(installationId: string) {
  const { token } = await createInstallationAccessToken(installationId);
  const data = await githubFetch<GitHubRepositoriesResponse>(
    "/installation/repositories?per_page=100",
    token,
  );

  return data.repositories
    .map(
      (repo): GitHubInstallationRepository => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
        language: repo.language,
        updatedAt: repo.updated_at,
      }),
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

export async function detectInstallationRepository(
  installationId: string,
  repoFullName: string,
  branch: string,
): Promise<DetectRepositoryResult> {
  const { token } = await createInstallationAccessToken(installationId);

  // Fetch root-level contents at the target branch
  const contents = await githubFetch<GitHubContentItem[]>(
    `/repos/${repoFullName}/contents?ref=${encodeURIComponent(branch)}`,
    token,
  );

  return detectBuildType(contents);
}
