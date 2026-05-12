export type EnvVar = {
  id: number;
  key: string;
  value: string;
  secret?: boolean;
};

export type LogLevel = "info" | "success" | "debug" | "error";

export type DeploymentLogLine = {
  id: string;
  time: string;
  level: LogLevel;
  message: string;
};

export type DeploymentStatus = "idle" | "building" | "done" | "error";

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

export type Deployment = {
  id: string;
  createdAt: string;
  updatedAt: string;
  repoUrl: string;
  repoName: string;
  branch: string;
  rootDirectory: string;
  deploymentType: string;
  containerPort: number;
  applicationId: string;
  publicUrl: string | null;
  status: DeploymentStatus;
};
