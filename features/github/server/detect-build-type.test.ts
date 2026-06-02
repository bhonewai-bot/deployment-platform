import { describe, it, expect } from "vitest";
import { detectBuildType, FileEntry } from "./detect-build-type";

// ─── Helper ────────────────────────────────────────────────────────────────────

/**
 * Builds a minimal file listing from a list of filenames.
 * Dirs can be included to ensure they're ignored by detection rules.
 */
function files(...names: string[]): FileEntry[] {
  return names.map((name) => ({ name, type: "file" as const }));
}

function mixed(fileNames: string[], dirNames: string[]): FileEntry[] {
  return [
    ...fileNames.map((name) => ({ name, type: "file" as const })),
    ...dirNames.map((name) => ({ name, type: "dir" as const })),
  ];
}

// ─── Rule 1: Dockerfile ────────────────────────────────────────────────────────

describe("Rule 1 — Dockerfile", () => {
  it("detects Dockerfile alone", () => {
    const result = detectBuildType(files("Dockerfile"));

    expect(result.buildType).toBe("dockerfile");
    expect(result.confidence).toBe("auto");
    expect(result.suggestions.dockerfilePath).toBe("Dockerfile");
  });

  it("detects Dockerfile even when package.json is also present (Dockerfile wins)", () => {
    const result = detectBuildType(files("Dockerfile", "package.json"));

    expect(result.buildType).toBe("dockerfile");
  });

  it("detects Dockerfile even when next.config.ts is also present (Dockerfile wins)", () => {
    const result = detectBuildType(files("Dockerfile", "next.config.ts"));

    expect(result.buildType).toBe("dockerfile");
  });

  it("is case-insensitive — dockerfile (lowercase) also matches", () => {
    const result = detectBuildType(files("dockerfile"));

    expect(result.buildType).toBe("dockerfile");
  });

  it("ignores a directory named Dockerfile", () => {
    const result = detectBuildType(mixed(["package.json"], ["Dockerfile"]));

    // Dockerfile is a dir here, not a file — should fall through to nixpacks
    expect(result.buildType).toBe("nixpacks");
  });
});

// ─── Rule 2: index.html ────────────────────────────────────────────────────────

describe("Rule 2 — index.html (raw static site)", () => {
  it("detects index.html as static", () => {
    const result = detectBuildType(files("index.html", "style.css"));

    expect(result.buildType).toBe("static");
    expect(result.confidence).toBe("auto");
    expect(result.suggestions.publishDirectory).toBe(".");
  });

  it("index.html loses to Dockerfile (Rule 1 takes priority)", () => {
    const result = detectBuildType(files("Dockerfile", "index.html"));

    expect(result.buildType).toBe("dockerfile");
  });
});

// ─── Rule 3: Static framework configs ─────────────────────────────────────────

describe("Rule 3 — static framework configs", () => {
  const cases = [
    "vite.config.ts",
    "vite.config.js",
    "astro.config.ts",
    "astro.config.mjs",
    "astro.config.js",
  ];

  it.each(cases)("%s → static with publishDirectory dist", (configFile) => {
    const result = detectBuildType(files(configFile, "package.json"));

    expect(result.buildType).toBe("static");
    expect(result.confidence).toBe("auto");
    expect(result.suggestions.publishDirectory).toBe("dist");
  });

  it("vite config loses to Dockerfile (Rule 1 takes priority)", () => {
    const result = detectBuildType(files("Dockerfile", "vite.config.ts"));

    expect(result.buildType).toBe("dockerfile");
  });
});

// ─── Rule 4: Next.js ──────────────────────────────────────────────────────────

describe("Rule 4 — Next.js", () => {
  const cases = ["next.config.js", "next.config.ts", "next.config.mjs"];

  it.each(cases)("%s → nixpacks (SSR assumed)", (configFile) => {
    const result = detectBuildType(files(configFile, "package.json"));

    expect(result.buildType).toBe("nixpacks");
    expect(result.confidence).toBe("auto");
    // publishDirectory pre-filled to "out" as a hint for static export users
    expect(result.suggestions.publishDirectory).toBe("out");
  });
});

// ─── Rule 5: Language/runtime markers ─────────────────────────────────────────

describe("Rule 5 — runtime markers (nixpacks)", () => {
  const cases = [
    ["package.json", "Node.js"],
    ["requirements.txt", "Python (pip)"],
    ["pyproject.toml", "Python (poetry/uv)"],
    ["go.mod", "Go"],
    ["cargo.toml", "Rust"],
    ["gemfile", "Ruby"],
    ["composer.json", "PHP"],
  ] as const;

  it.each(cases)("%s → nixpacks (%s)", (marker) => {
    const result = detectBuildType(files(marker));

    expect(result.buildType).toBe("nixpacks");
    expect(result.confidence).toBe("auto");
  });
});

// ─── Fallback ──────────────────────────────────────────────────────────────────

describe("Fallback", () => {
  it("returns nixpacks with guess confidence for empty repository", () => {
    const result = detectBuildType([]);

    expect(result.buildType).toBe("nixpacks");
    expect(result.confidence).toBe("guess");
  });

  it("returns nixpacks with guess confidence for unrecognised files only", () => {
    const result = detectBuildType(files("README.md", "LICENSE", ".gitignore"));

    expect(result.buildType).toBe("nixpacks");
    expect(result.confidence).toBe("guess");
  });
});

// ─── detectedFiles passthrough ────────────────────────────────────────────────

describe("detectedFiles", () => {
  it("includes all file and dir names in detectedFiles", () => {
    const input = mixed(["package.json", "README.md"], ["src", "public"]);
    const result = detectBuildType(input);

    expect(result.detectedFiles).toEqual([
      "package.json",
      "README.md",
      "src",
      "public",
    ]);
  });
});
