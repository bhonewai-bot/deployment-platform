import Link from "next/link";
import { headers } from "next/headers";

import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { ConnectGitHubEmptyState } from "@/features/projects/components/connect-github-empty-state";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeploymentStatus = "live" | "building" | "ready" | "failed";

interface RecentDeployment {
  id: string;
  repo: string;
  branch: string;
  commitSha: string;
  status: DeploymentStatus;
  time: string;
}

interface Project {
  id: string;
  name: string;
  repoName: string;
  defaultBranch: string;
  recentDeployments: RecentDeployment[];
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const statusConfig: Record<DeploymentStatus, { label: string; dot: string }> = {
  live: { label: "Live", dot: "bg-green-500" },
  building: { label: "Building", dot: "bg-amber-400" },
  ready: { label: "Ready", dot: "bg-zinc-400" },
  failed: { label: "Failed", dot: "bg-red-500" },
};

function StatusDot({ status }: { status: DeploymentStatus }) {
  const { dot, label } = statusConfig[status];
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${dot}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  );
}

// ─── No-projects empty state (GitHub already connected) ───────────────────────

function NoProjectsEmptyState() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Projects
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          GitHub is connected. Import your first repository to get started.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-8 shadow-xs">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          No projects yet
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Import a repository to create your first project.
        </p>
        <div className="mt-6">
          <Link
            href="/projects/new"
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            <Icon name="plus" className="size-4" />
            Import Repository
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const latest = project.recentDeployments[0];

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group h-40 cursor-pointer border border-border bg-card shadow-xs transition-colors hover:border-foreground/20">
        <CardContent className="flex h-full flex-col justify-between py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {latest ? (
                <StatusDot status={latest.status} />
              ) : (
                <span className="text-xs text-muted-foreground">No runs</span>
              )}
              {latest && (
                <span className="text-xs text-muted-foreground">
                  {latest.time}
                </span>
              )}
            </div>
          </div>

          <h4 className="truncate text-sm font-semibold text-foreground">
            {project.name}
          </h4>

          <Separator className="my-1" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 rounded bg-muted px-2 py-1">
              <Icon name="history" className="size-3 text-muted-foreground" />
              <span className="font-mono text-[11px] text-muted-foreground">
                {latest?.branch ?? project.defaultBranch}
              </span>
            </div>
            {latest && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {latest.commitSha}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Projects list state ──────────────────────────────────────────────────────

function ProjectsState({ projects }: { projects: Project[] }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and monitor your active deployment workflows.
          </p>
        </div>
        <Link
          href="/projects/new"
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
        >
          <Icon name="plus" className="size-4" />
          New Project
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recent Deployments
          </p>
          <Button variant="ghost" size="sm">
            <Link href="/deployments">View All</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return null;
  }

  const [projects, connection] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        deploymentRuns: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.gitHubConnection.findFirst({
      where: {
        userId: session.user.id,
        kind: "app_installation",
        isActive: true,
        installationId: { not: null },
      },
    }),
  ]);

  // No GitHub connection at all → prompt to connect
  if (!connection) {
    return <ConnectGitHubEmptyState />;
  }

  // GitHub connected but no projects yet → prompt to import first repo
  if (projects.length === 0) {
    return <NoProjectsEmptyState />;
  }

  return (
    <ProjectsState
      projects={projects.map((project): Project => {
        const latest = project.deploymentRuns[0];

        return {
          id: project.id,
          name: project.name,
          repoName: project.repoName,
          defaultBranch: project.defaultBranch,
          recentDeployments: latest
            ? [
                {
                  id: latest.id,
                  repo: project.repoName,
                  branch: latest.branch,
                  commitSha: latest.commitSha ?? "pending",
                  status: toDeploymentStatus(latest.status),
                  time: formatRelativeTime(latest.createdAt),
                },
              ]
            : [],
        };
      })}
    />
  );
}

function toDeploymentStatus(status: string): DeploymentStatus {
  if (status === "building" || status === "failed") return status;
  if (status === "success") return "live";
  return "ready";
}

function formatRelativeTime(value: Date) {
  const diffMs = Date.now() - value.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
