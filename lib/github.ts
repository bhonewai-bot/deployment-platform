import "server-only";

import { AppError } from "./errors";
import {
  GithubBranchResponse,
  GithubContentItem,
  GithubRepoResponse,
  ImportRepoResult,
} from "./types";

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new AppError("Repository not found.");
    }

    if (response.status === 403) {
      throw new AppError("GitHub API rate limit exceeded. Try again later.");
    }

    throw new AppError(`GitHub request failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

function detectDeploymentType(
  contents: GithubContentItem[],
): "dockerfile" | "static" | "unknown" {
  const names = new Set(contents.map((item) => item.name.toLowerCase()));

  if (names.has("dockerfile")) return "dockerfile";
  if (names.has("index.html")) return "static";

  return "unknown";
}

export async function ImportRepositoryFromGithub(
  repoUrl: unknown,
): Promise<ImportRepoResult> {
  const { owner, repo, url } = validateImportRepoInput(repoUrl);

  const [repoInfo, branches, contents] = await Promise.all([
    githubFetch<GithubRepoResponse>(`repos/${owner}/${repo}`),
    githubFetch<GithubBranchResponse>(
      `repos/${owner}/${repo}/branches?per_page=100`,
    ),
    githubFetch<GithubContentItem[]>(`repos/${owner}/${repo}/contents`),
  ]);

  return {
    repo: {
      name: repoInfo.name,
      fullName: repoInfo.full_name,
      description: repoInfo.description,
      private: repoInfo.private,
      url,
    },
    branches: branches.map((item) => item.name),
    defaultBranch: repoInfo.default_branch,
    rootDirectory: "./",
    detectedDeploymentType: detectDeploymentType(contents),
    detectedFiles: contents.map((item) => item.name),
  };
}

export function parseGithubRepo(repoUrl: string) {
  try {
    const url = new URL(repoUrl);

    if (url.hostname !== "github.com") {
      throw new Error("Please enter a valid GitHub repository URL.");
    }

    const parts = url.pathname
      .replace(/\.git$/, "")
      .split("/")
      .filter(Boolean);

    if (parts.length < 2) {
      throw new Error("Please enter a valid GitHub repository URL.");
    }

    const owner = parts[0];
    const repo = parts[1];

    return {
      owner,
      repo,
      url: `https://github.com/${owner}/${repo}`,
    };
  } catch {
    throw new Error("Please enter a valid GitHub repository URL.");
  }
}

function validateImportRepoInput(repoUrl: unknown) {
  if (typeof repoUrl !== "string" || repoUrl.trim().length === 0) {
    throw new Error("Repository URL is required.");
  }

  return parseGithubRepo(repoUrl);
}
