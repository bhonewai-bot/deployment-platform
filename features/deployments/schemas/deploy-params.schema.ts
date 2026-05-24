import { z } from "zod";

export const deployParamsSchema = z.object({
  repoUrl: z.string().min(1, "Repository URL is required"),
  branch: z.string().min(1, "Branch is required"),
  rootDirectory: z.string().min(1, "Root directory is required"),
  buildType: z.enum(["nixpacks", "dockerfile", "static"]),
  containerPort: z.number().int().positive().optional(),
  dockerfilePath: z.string().optional(),
  publishDirectory: z.string().optional(),
  generatePublicUrl: z.boolean().optional(),
  envVars: z
    .array(
      z.object({
        id: z.number(),
        key: z.string(),
        value: z.string(),
        secret: z.boolean().optional(),
      }),
    )
    .optional(),
});

export type DeployParamsInput = z.infer<typeof deployParamsSchema>;
