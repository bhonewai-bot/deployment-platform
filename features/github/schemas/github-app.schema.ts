import { z } from "zod";

export const githubAppCallbackSchema = z.object({
  installation_id: z.string().min(1, "Missing installation id."),
  setup_action: z.string().optional(),
});

export const githubRepositoriesQuerySchema = z.object({
  connectionId: z.string().optional(),
});

export const githubDetectQuerySchema = z.object({
  repoFullName: z.string().min(1, "repoFullName is required."), // e.g. "acme/api-gateway"
  branch: z.string().min(1, "branch is required."),
  connectionId: z.string().optional(),
});
