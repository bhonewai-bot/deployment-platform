import "server-only";

import { createSign } from "crypto";

import { AppError } from "@/lib/errors";

const GITHUB_API_BASE_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

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

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new AppError(`Missing ${name} environment variable.`);
  }

  return value;
}

function base64Url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function getPrivateKey() {
  return requireEnv("GITHUB_APP_PRIVATE_KEY").replace(/\\n/g, "\n");
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

  return data.repositories.map((repo): GitHubInstallationRepository => {
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      defaultBranch: repo.default_branch,
      htmlUrl: repo.html_url,
      language: repo.language,
      updatedAt: repo.updated_at,
    };
  });
}
