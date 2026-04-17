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
