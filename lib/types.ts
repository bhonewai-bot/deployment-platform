// ─── UI ──────────────────────────────────────────────────────────────────────

export type IconName =
  | "folder"
  | "rocket"
  | "terminal"
  | "settings"
  | "notification"
  | "help"
  | "sparkles"
  | "link"
  | "shield"
  | "history"
  | "memory";

// ─── Environment variables ────────────────────────────────────────────────────

export type EnvVar = {
  id: number;
  key: string;
  value: string;
  secret?: boolean;
};

// ─── Deployment logs ─────────────────────────────────────────────────────────

export type LogLevel = "info" | "success" | "debug" | "error";

export type DeploymentLogLine = {
  id: string;
  time: string;
  level: LogLevel;
  message: string;
};

export type DeploymentStatus = "idle" | "building" | "done" | "error";

// ─── Dokploy ─────────────────────────────────────────────────────────────────

export type DeployParams = {
  repoUrl: string;
  branch: string;
  rootDirectory: string;
  deploymentType: "dockerfile" | "static";
  containerPort?: number;
  generatePublicUrl?: boolean;
  envVars?: EnvVar[];
};

export type DeployResult = {
  applicationId: string;
  message: string;
  publicUrl: string | null;
  domainError: string | null;
};

export type DeploymentStatusResult = {
  status: DeploymentStatus;
  logs: DeploymentLogLine[];
};

// ─── GitHub ──────────────────────────────────────────────────────────────────
export type GithubRepoResponse = {
  name: string;
  full_name: string;
  default_branch: string;
  private: boolean;
  description: string | null;
};

export type GithubBranchResponse = Array<{ name: string }>;

export type GithubContentItem = {
  name: string;
  path: string;
  type: "file" | "dir";
};

export type ImportedRepo = {
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  url: string;
};

export type ImportRepoResult = {
  repo: ImportedRepo;
  branches: string[];
  defaultBranch: string;
  rootDirectory: string;
  detectedDeploymentType: "dockerfile" | "static" | "unknown";
  detectedFiles: string[];
};
