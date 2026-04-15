import { NextResponse } from "next/server";

function parseGithubRepo(repoUrl: string) {
  try {
    const url = new URL(repoUrl);

    const isGithubHost = url.hostname === "github.com";

    if (!isGithubHost) {
      throw new Error("Please enter a valid GitHub repository URL.");
    }

    const parts = url.pathname.split("/").filter(Boolean);
    console.log(parts);
    if (parts.length < 2) {
      throw new Error("Please enter a valid GitHub repository URL.");
    }

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");

    return {
      owner,
      repo,
      url: `https://github.com/${owner}/${repo}`,
    };
  } catch {
    throw new Error("Please enter a valid GitHub repository URL.");
  }
}

async function github<T>(path: string): Promise<T> {
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
      throw new Error("Repository not found");
    }

    throw new Error(`GitHub request failed: ${response.status}`);
  }

  return response.json();
}

export async function POST(request: Request) {
  try {
    const { repoUrl } = await request.json();
    const { owner, repo, url } = parseGithubRepo(repoUrl);

    const repoInfo = await github<{
      name: string;
      full_name: string;
      default_branch: string;
      private: boolean;
      description: string | null;
    }>(`repos/${owner}/${repo}`);

    const branches = await github<Array<{ name: string }>>(
      `repos/${owner}/${repo}/branches?per_page=100`,
    );

    const contents = await github<
      Array<{ name: string; path: string; type: "file" | "dir" }>
    >(`repos/${owner}/${repo}/contents`);

    const directories = contents
      .filter((item) => item.type === "dir")
      .map((item) => item.path);

    return NextResponse.json({
      repo: {
        name: repoInfo.name,
        fullName: repoInfo.full_name,
        description: repoInfo.description,
        private: repoInfo.private,
        url: url,
      },
      branches: branches.map((item) => item.name),
      defaultBranch: repoInfo.default_branch,
      rootDirectory: ".",
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message });
  }
}
