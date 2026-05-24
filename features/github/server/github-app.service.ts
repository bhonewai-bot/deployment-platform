import "server-only";

import { createSign } from "crypto";

import { AppError } from "@/lib/errors";

const GITHUB_API_BASE_URL = "https://api.github.com";
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
  if (!value) throw new AppError(`Missing ${name} environment variable.`);
  return value;
}

function base64Url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function getPrivateKey() {
  const base64Key = process.env.GITHUB_APP_PRIVATE_KEY_BASE64;

  if (base64Key) {
    return Buffer.from(base64Key, "base64").toString("utf8");
  }

  const key = requireEnv("GITHUB_APP_PRIVATE_KEY").replace(/\\n/g, "\n");

  if (!key.includes("-----END")) {
    throw new AppError(
      "GITHUB_APP_PRIVATE_KEY is not a complete private key. Use escaped newline characters or GITHUB_APP_PRIVATE_KEY_BASE64.",
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
    throw new AppError(
      `GitHub request failed with status ${response.status}: ${body}`,
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
    throw new AppError("GitHub installation account was not returned.");
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
  return githubFetch<GitHubInstallationTokenResponse>(
    `/app/installations/${installationId}/access_tokens`,
    createGitHubAppJwt(),
    { method: "POST" },
  );
}

export async function listInstallationRepositories(installationId: string) {
  const { token } = await createInstallationAccessToken(installationId);
  const data = await githubFetch<GitHubRepositoriesResponse>(
    "/installation/repositories?per_page=100",
    token,
  );

  return data.repositories
    .map((repo): GitHubInstallationRepository => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      defaultBranch: repo.default_branch,
      htmlUrl: repo.html_url,
      language: repo.language,
      updatedAt: repo.updated_at,
    }))
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

  const files = new Set(
    contents.filter((c) => c.type === "file").map((c) => c.name.toLowerCase()),
  );

  const detectedFiles = contents.map((c) => c.name);

  // ── Rule 1: Dockerfile present ───────────────────────────────────────────
  if (files.has("dockerfile")) {
    return {
      buildType: "dockerfile",
      confidence: "auto",
      suggestions: {
        port: "3000",
        dockerfilePath: "Dockerfile",
        publishDirectory: "dist",
      },
      detectedFiles,
    };
  }

  // ── Rule 2: Static site markers ──────────────────────────────────────────
  //    index.html at root → definitely static, no build step
  if (files.has("index.html")) {
    return {
      buildType: "static",
      confidence: "auto",
      suggestions: {
        port: "3000",
        dockerfilePath: "Dockerfile",
        publishDirectory: ".",
      },
      detectedFiles,
    };
  }

  // ── Rule 3: Known static-output frameworks (check config files) ──────────
  //    Vite, Astro, SvelteKit (static adapter), plain CRA
  const staticFrameworkConfigs = [
    "vite.config.ts",
    "vite.config.js",
    "astro.config.ts",
    "astro.config.mjs",
    "astro.config.js",
  ];

  if (staticFrameworkConfigs.some((f) => files.has(f))) {
    return {
      buildType: "static",
      confidence: "auto",
      suggestions: {
        port: "3000",
        dockerfilePath: "Dockerfile",
        publishDirectory: "dist",
      },
      detectedFiles,
    };
  }

  // ── Rule 4: Next.js — needs deeper check for output: 'export' ────────────
  //    We can't read file contents here cheaply, so we default to Nixpacks
  //    and let the user override if they use static export.
  if (files.has("next.config.js") || files.has("next.config.ts") || files.has("next.config.mjs")) {
    return {
      buildType: "nixpacks",
      confidence: "auto",
      suggestions: {
        port: "3000",
        dockerfilePath: "Dockerfile",
        publishDirectory: "out",
      },
      detectedFiles,
    };
  }

  // ── Rule 5: Any Node/Python/Go project → Nixpacks ────────────────────────
  const nixpacksMarkers = [
    "package.json",   // Node
    "requirements.txt", // Python
    "pyproject.toml", // Python
    "go.mod",         // Go
    "cargo.toml",     // Rust
    "gemfile",        // Ruby
    "composer.json",  // PHP
  ];

  if (nixpacksMarkers.some((f) => files.has(f))) {
    return {
      buildType: "nixpacks",
      confidence: "auto",
      suggestions: {
        port: "3000",
        dockerfilePath: "Dockerfile",
        publishDirectory: "dist",
      },
      detectedFiles,
    };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return {
    buildType: "nixpacks",
    confidence: "guess",
    suggestions: {
      port: "3000",
      dockerfilePath: "Dockerfile",
      publishDirectory: "dist",
    },
    detectedFiles,
  };
}
