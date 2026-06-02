"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { deployProjectSchema } from "@/features/github/schemas/import-repo.schema";
import { callDokploy } from "@/features/deployments/server/deployment";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

// ─── State type ───────────────────────────────────────────────────────────────

export type DeployProjectState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success"; projectId: string };

// ─── Deploy action ────────────────────────────────────────────────────────────

export async function deployProjectAction(
  _prev: DeployProjectState,
  formData: FormData,
): Promise<DeployProjectState> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { status: "error", error: "You must be signed in to deploy." };

  // ── Validate ──────────────────────────────────────────────────────────────
  const parsed = deployProjectSchema.safeParse({
    repoFullName: formData.get("repoFullName"),
    repoName: formData.get("repoName"),
    repoUrl: formData.get("repoUrl"),
    defaultBranch: formData.get("defaultBranch"),
    branch: formData.get("branch"),
    rootDirectory: formData.get("rootDirectory"),
    buildType: formData.get("buildType"),
    port: formData.get("port"),
    dockerfilePath: formData.get("dockerfilePath"),
    publishDirectory: formData.get("publishDirectory"),
    connectionId: formData.get("connectionId") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const input = parsed.data;

  // ── Step 1: Create Project + Environment + DeploymentRun in DB ───────────
  let projectId: string;
  let deploymentRunId: string;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: input.repoName,
          repoUrl: input.repoUrl,
          repoName: input.repoFullName,
          defaultBranch: input.defaultBranch,
          rootDirectory: input.rootDirectory,
          userId: session.user.id,
        },
      });

      const environment = await tx.environment.create({
        data: {
          name: "production",
          deploymentMode: input.buildType,
          dockerfilePath: input.dockerfilePath,
          containerPort: input.port,
          publishDirectory: input.publishDirectory,
          projectId: project.id,
        },
      });

      const deploymentRun = await tx.deploymentRun.create({
        data: {
          branch: input.branch,
          deploymentMode: input.buildType,
          status: "pending",
          triggeredBy: "manual",
          projectId: project.id,
          environmentId: environment.id,
          actorId: session.user.id,
        },
      });

      await tx.auditEvent.create({
        data: {
          action: "project.created",
          summary: `Project "${input.repoName}" created from ${input.repoFullName}`,
          metadata: {
            repoFullName: input.repoFullName,
            branch: input.branch,
            buildType: input.buildType,
          },
          actorId: session.user.id,
          projectId: project.id,
        },
      });

      return { project, environment, deploymentRun };
    });

    projectId = result.project.id;
    deploymentRunId = result.deploymentRun.id;
  } catch (error) {
    logger.error({ err: error }, "deployProjectAction/db failed");
    return {
      status: "error",
      error: "Failed to create project. Please try again.",
    };
  }

  // ── Step 2: Trigger Dokploy (best-effort — project already exists in DB) ─
  try {
    const dokployResult = await callDokploy({
      repoUrl: input.repoUrl,
      branch: input.branch,
      rootDirectory: input.rootDirectory,
      buildType: input.buildType,
      containerPort: input.port,
      dockerfilePath: input.dockerfilePath,
      publishDirectory: input.publishDirectory,
      generatePublicUrl: true,
    });

    // Persist the Dokploy application ID + public URL back to the run
    await prisma.deploymentRun.update({
      where: { id: deploymentRunId },
      data: {
        status: "building",
        dokployApplicationId: dokployResult.dokployApplicationId,
        publicUrl: dokployResult.publicUrl,
      },
    });
  } catch (error) {
    // Non-fatal: project is created, user can retry from the project page
    logger.error({ err: error }, "deployProjectAction/dokploy failed");
    await prisma.deploymentRun
      .update({
        where: { id: deploymentRunId },
        data: {
          status: "pending",
          errorMessage: "Dokploy trigger failed. Click Deploy to retry.",
        },
      })
      .catch(() => null);
  }

  // ── Redirect to project page ──────────────────────────────────────────────
  redirect(`/projects/${projectId}`);
}

// ─── Redeploy action (called from the project page) ──────────────────────────

export type RedeployState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | {
      status: "building";
      dokployApplicationId: string;
      publicUrl: string | null;
    };

export async function redeployAction(
  _prev: RedeployState,
  formData: FormData,
): Promise<RedeployState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { status: "error", error: "Unauthorized." };

  const projectId = formData.get("projectId") as string | null;
  if (!projectId) return { status: "error", error: "Missing projectId." };

  // Load project + production environment
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { environments: { where: { name: "production" }, take: 1 } },
  });

  if (!project) return { status: "error", error: "Project not found." };

  const environment = project.environments[0];
  if (!environment)
    return { status: "error", error: "No production environment found." };

  // Create a new DeploymentRun
  const deploymentRun = await prisma.deploymentRun.create({
    data: {
      branch: project.defaultBranch,
      deploymentMode: environment.deploymentMode,
      status: "pending",
      triggeredBy: "manual",
      projectId: project.id,
      environmentId: environment.id,
      actorId: session.user.id,
    },
  });

  // Trigger Dokploy
  try {
    const dokployResult = await callDokploy({
      repoUrl: project.repoUrl,
      branch: project.defaultBranch,
      rootDirectory: project.rootDirectory,
      buildType: environment.deploymentMode as
        | "nixpacks"
        | "dockerfile"
        | "static",
      containerPort: environment.containerPort,
      dockerfilePath: environment.dockerfilePath,
      publishDirectory: environment.publishDirectory,
      generatePublicUrl: true,
    });

    await prisma.deploymentRun.update({
      where: { id: deploymentRun.id },
      data: {
        status: "building",
        dokployApplicationId: dokployResult.dokployApplicationId,
        publicUrl: dokployResult.publicUrl,
      },
    });

    return {
      status: "building",
      dokployApplicationId: dokployResult.dokployApplicationId,
      publicUrl: dokployResult.publicUrl,
    };
  } catch (error) {
    logger.error({ err: error }, "redeployAction/dokploy failed");
    await prisma.deploymentRun
      .update({
        where: { id: deploymentRun.id },
        data: { status: "failed", errorMessage: "Dokploy trigger failed." },
      })
      .catch(() => null);
    return {
      status: "error",
      error: "Failed to trigger deployment. Please try again.",
    };
  }
}
