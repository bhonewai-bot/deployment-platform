import { z } from "zod";

export const importRepoSchema = z.object({
  repoUrl: z.string().min(1, "Repository URL is required"),
});

export type ImportRepoInput = z.infer<typeof importRepoSchema>;

// ─── New: used by the Deploy button in the import flow ────────────────────────

export const deployProjectSchema = z.object({
  // Repository identity
  repoFullName: z.string().min(1, "repoFullName is required"),   // e.g. "acme/api-gateway"
  repoName: z.string().min(1, "repoName is required"),           // e.g. "api-gateway"
  repoUrl: z.string().url("repoUrl must be a valid URL"),        // e.g. "https://github.com/acme/api-gateway"
  defaultBranch: z.string().min(1, "defaultBranch is required"),

  // Deploy config
  branch: z.string().min(1, "branch is required"),
  rootDirectory: z.string().default("."),
  buildType: z.enum(["nixpacks", "dockerfile", "static"]),
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  dockerfilePath: z.string().default("Dockerfile"),
  publishDirectory: z.string().default("dist"),

  // Optional — used to look up the installation token
  connectionId: z.string().optional(),
});

export type DeployProjectInput = z.infer<typeof deployProjectSchema>;
