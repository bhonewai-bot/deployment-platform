import { headers } from "next/headers";

import { RepositoryImportPage } from "@/features/projects/components/repository-import-page";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewProjectPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const connection = session
    ? await prisma.gitHubConnection.findFirst({
        where: {
          userId: session.user.id,
          kind: "app_installation",
          isActive: true,
          installationId: { not: null },
        },
        orderBy: { updatedAt: "desc" },
      })
    : null;

  return (
    <RepositoryImportPage
      initialConnection={
        connection
          ? {
              id: connection.id,
              login: connection.githubLogin,
              repositorySelection: connection.scopes,
            }
          : null
      }
    />
  );
}
