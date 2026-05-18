import { z } from "zod";

export const githubAppCallbackSchema = z.object({
  installation_id: z.string().min(1, "Missing installation id."),
  setup_action: z.string().optional(),
});

export const githubRepositoriesQuerySchema = z.object({
  connectionId: z.string().optional(),
});
