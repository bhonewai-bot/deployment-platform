"use server";

import { ImportRepositoryFromGithub } from "@/lib/github";

export async function importGithubRepoAction(_: unknown, formData: FormData) {
  try {
    const data = await ImportRepositoryFromGithub(formData.get("repoUrl"));

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
