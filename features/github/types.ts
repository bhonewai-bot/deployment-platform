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
