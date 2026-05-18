"use server";

import { importRepoSchema } from "@/features/github/schemas/import-repo.schema";
import { ImportRepositoryFromGithub } from "@/features/github/server/github.service";

export async function importGithubRepoAction(_: unknown, formData: FormData) {
  const parsed = importRepoSchema.safeParse({
    repoUrl: formData.get("repoUrl"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      data: null,
    };
  }

  try {
    const data = await ImportRepositoryFromGithub(parsed.data.repoUrl);

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed.",
      data: null,
    };
  }
}
