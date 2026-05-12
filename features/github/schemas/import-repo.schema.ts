import { z } from "zod";

export const importRepoSchema = z.object({
  repoUrl: z.string().min(1, "Repository URL is required"),
});

export type ImportRepoInput = z.infer<typeof importRepoSchema>;
