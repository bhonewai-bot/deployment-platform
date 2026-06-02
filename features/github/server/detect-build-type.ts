import type { DetectRepositoryResult } from "./github-app.service";

export type FileEntry = {
  name: string;
  type: "file" | "dir" | "symlink" | "submodule";
};

/**
 * Pure detection function — no network, no env vars, no side effects.
 * Takes the root-level file listing from a repository and returns
 * the most likely build type + pre-filled config suggestions.
 *
 * Extracted from `detectInstallationRepository` so it can be unit tested
 * without mocking any GitHub API calls.
 */
export function detectBuildType(contents: FileEntry[]): DetectRepositoryResult {
  const files = new Set(
    contents.filter((c) => c.type === "file").map((c) => c.name.toLowerCase()),
  );

  const detectedFiles = contents.map((c) => c.name);

  // ── Rule 1: Dockerfile present ───────────────────────────────────────────
  if (files.has("dockerfile")) {
    return {
      buildType: "dockerfile",
      confidence: "auto",
      suggestions: { port: "3000", dockerfilePath: "Dockerfile", publishDirectory: "dist" },
      detectedFiles,
    };
  }

  // ── Rule 2: index.html at root → raw static site, no build step ──────────
  if (files.has("index.html")) {
    return {
      buildType: "static",
      confidence: "auto",
      suggestions: { port: "3000", dockerfilePath: "Dockerfile", publishDirectory: "." },
      detectedFiles,
    };
  }

  // ── Rule 3: Known static-output framework config files ───────────────────
  //    Vite, Astro — always output to dist/
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
      suggestions: { port: "3000", dockerfilePath: "Dockerfile", publishDirectory: "dist" },
      detectedFiles,
    };
  }

  // ── Rule 4: Next.js → Nixpacks (SSR assumed; user overrides if static export)
  if (files.has("next.config.js") || files.has("next.config.ts") || files.has("next.config.mjs")) {
    return {
      buildType: "nixpacks",
      confidence: "auto",
      suggestions: { port: "3000", dockerfilePath: "Dockerfile", publishDirectory: "out" },
      detectedFiles,
    };
  }

  // ── Rule 5: Language/runtime markers → Nixpacks ──────────────────────────
  const nixpacksMarkers = [
    "package.json",      // Node
    "requirements.txt",  // Python
    "pyproject.toml",    // Python
    "go.mod",            // Go
    "cargo.toml",        // Rust
    "gemfile",           // Ruby
    "composer.json",     // PHP
  ];

  if (nixpacksMarkers.some((f) => files.has(f))) {
    return {
      buildType: "nixpacks",
      confidence: "auto",
      suggestions: { port: "3000", dockerfilePath: "Dockerfile", publishDirectory: "dist" },
      detectedFiles,
    };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return {
    buildType: "nixpacks",
    confidence: "guess",
    suggestions: { port: "3000", dockerfilePath: "Dockerfile", publishDirectory: "dist" },
    detectedFiles,
  };
}
