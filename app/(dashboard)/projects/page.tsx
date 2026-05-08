import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { prisma } from "@/lib/prisma";
import type { DeploymentStatus } from "@/types";
import { cn } from "@/lib/utils";

// STATUS BADGE
function StatusBadge({ status }: { status: DeploymentStatus }) {
  const styles: Record<DeploymentStatus, string> = {
    done: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    building: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20",
    error: "bg-red-500/10 text-red-400 ring-red-500/20",
    idle: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
  };

  const dots: Record<DeploymentStatus, string> = {
    done: "bg-emerald-400",
    building: "bg-yellow-400 animate-pulse",
    error: "bg-red-400",
    idle: "bg-zinc-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status])} />
      {status}
    </span>
  );
}

// RELATIVE TIME
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// EMPTY STATE
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-20 text-center">
      <div className="mb-4 rounded-full bg-white/5 p-4">
        <Icon name="rocket" className="size-6 text-zinc-500" />
      </div>
      <p className="mb-1 text-sm font-medium text-zinc-300">
        No deployments yet
      </p>
      <p className="mb-6 text-xs text-zinc-500">
        Deploy your first project to see it here.
      </p>
      <Link
        href="/deployments"
        className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
      >
        Deploy a project
      </Link>
    </div>
  );
}

// PAGE
export default async function ProjectsPage() {
  const deployments = await prisma.deployment.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <main className="ml-64 min-h-screen px-8 pb-12 pt-6">
        <div className="mx-auto max-w-4xl">
          {/* HEADER */}
          <header className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3 text-on-surface-variant">
                <Icon name="folder" className="size-4" />
                <span className="font-mono text-xs uppercase tracking-[0.2em]">
                  Projects
                </span>
              </div>
              <h2 className="text-4xl font-extrabold leading-none tracking-tight text-white">
                All Deployments
              </h2>
            </div>

            <Link
              href="/deployments"
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              <Icon name="rocket" className="size-4" />
              New deployment
            </Link>
          </header>

          {/* LIST */}
          {deployments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-3">
              {deployments.map((d) => (
                <div
                  key={d.id}
                  className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-high p-5 transition hover:border-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* LEFT — REPO INFO */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Icon
                          name="folder"
                          className="size-4 shrink-0 text-zinc-400"
                        />
                        <span className="truncate font-semibold text-white">
                          {d.repoName}
                        </span>
                        <StatusBadge status={d.status as DeploymentStatus} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Icon name="history" className="size-3" />
                          {d.branch}
                        </span>
                        <span>{d.deploymentType}</span>
                        <span>{timeAgo(new Date(d.createdAt))}</span>
                      </div>
                    </div>

                    {/* RIGHT — PUBLIC URL */}
                    {d.publicUrl && (
                      <a
                        href={d.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:text-white"
                      >
                        <Icon name="link" className="size-3" />
                        Visit
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
