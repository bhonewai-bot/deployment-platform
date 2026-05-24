import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ProjectDetail } from "@/features/projects/components/project-detail";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      environments: {
        where: { name: "production" },
        take: 1,
      },
      deploymentRuns: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) notFound();

  const environment = project.environments[0];
  if (!environment) notFound();

  const latestRun = project.deploymentRuns[0] ?? null;

  return (
    <ProjectDetail
      project={{
        id: project.id,
        name: project.name,
        repoName: project.repoName,
        repoUrl: project.repoUrl,
        defaultBranch: project.defaultBranch,
        rootDirectory: project.rootDirectory,
      }}
      environment={{
        id: environment.id,
        name: environment.name,
        deploymentMode: environment.deploymentMode,
        containerPort: environment.containerPort,
        dockerfilePath: environment.dockerfilePath,
        publishDirectory: environment.publishDirectory,
      }}
      latestRun={
        latestRun
          ? {
              id: latestRun.id,
              status: latestRun.status,
              branch: latestRun.branch,
              deploymentMode: latestRun.deploymentMode,
              dokployApplicationId: latestRun.dokployApplicationId,
              publicUrl: latestRun.publicUrl,
              errorMessage: latestRun.errorMessage,
              createdAt: latestRun.createdAt.toISOString(),
            }
          : null
      }
    />
  );
}
