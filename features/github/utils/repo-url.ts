/**
 * Parses a GitHub repository URL into owner, repo, and canonical URL.
 * Pure string utility — no API calls, no server-only imports.
 */
export function parseGithubRepo(repoUrl: string) {
  try {
    const url = new URL(repoUrl);

    // VALIDATE GITHUB HOSTNAME
    if (url.hostname !== "github.com") {
      throw new Error("Please enter a valid GitHub repository URL.");
    }

    // EXTRACT OWNER AND REPO FROM PATH
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
