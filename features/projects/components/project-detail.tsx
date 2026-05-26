"use client";

import { useActionState, useEffect, useReducer, useRef } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DeployLog } from "@/features/deployments/components/deploy-log";
import type { DeploymentLogLine, DeploymentStatus } from "@/features/deployments/types";
import {
  redeployAction,
  type RedeployState,
} from "@/features/github/server/import-repository.action";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ProjectView = {
  id: string;
  name: string;
  repoName: string;
  repoUrl: string;
  defaultBranch: string;
  rootDirectory: string;
};

type EnvironmentView = {
  id: string;
  name: string;
  deploymentMode: string;
  containerPort: number;
  dockerfilePath: string;
  publishDirectory: string;
};

type DeploymentRunView = {
  id: string;
  status: string;
  branch: string;
  deploymentMode: string;
  dokployApplicationId: string | null;
  publicUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
};

type Props = {
  project: ProjectView;
  environment: EnvironmentView;
  latestRun: DeploymentRunView | null;
};

// ─── Deployment state (managed by reducer) ────────────────────────────────────

type RunStatus = "pending" | "building" | "success" | "failed" | "cancelled";

type DeployState = {
  status: RunStatus;
  applicationId: string | null;
  publicUrl: string | null;
  logs: DeploymentLogLine[];
  pollError: string | null;
};

type DeployAction =
  | { type: "REDEPLOY_STARTED"; applicationId: string; publicUrl: string | null }
  | { type: "POLL_TICK"; dokStatus: DeploymentStatus; logs: DeploymentLogLine[] }
  | { type: "POLL_ERROR"; message: string };

function deployReducer(state: DeployState, action: DeployAction): DeployState {
  switch (action.type) {
    case "REDEPLOY_STARTED":
      return {
        status: "building",
        applicationId: action.applicationId,
        publicUrl: action.publicUrl,
        logs: [],
        pollError: null,
      };
    case "POLL_TICK": {
      const status: RunStatus =
        action.dokStatus === "done" ? "success"
        : action.dokStatus === "error" ? "failed"
        : "building";
      return {
        ...state,
        status,
        logs: action.logs.length > 0 ? action.logs : state.logs,
      };
    }
    case "POLL_ERROR":
      return { ...state, pollError: action.message };
  }
}

// ─── Status helpers ────────────────────────────────────────────────────────────

function statusConfig(status: RunStatus) {
  switch (status) {
    case "pending":
      return { label: "Pending", dot: "bg-zinc-400", text: "text-zinc-400" };
    case "building":
      return { label: "Building", dot: "bg-amber-400 animate-pulse", text: "text-amber-400" };
    case "success":
      return { label: "Live", dot: "bg-green-500", text: "text-green-500" };
    case "failed":
      return { label: "Failed", dot: "bg-red-500", text: "text-red-400" };
    case "cancelled":
      return { label: "Cancelled", dot: "bg-zinc-500", text: "text-zinc-400" };
  }
}

function StatusBadge({ status }: { status: RunStatus }) {
  const { label, dot, text } = statusConfig(status);
  return (
    <span className={cn("flex items-center gap-1.5 text-sm font-medium", text)}>
      <span className={cn("size-2 rounded-full", dot)} />
      {label}
    </span>
  );
}

// ─── Project detail ────────────────────────────────────────────────────────────

export function ProjectDetail({ project, environment, latestRun }: Props) {
  const [deploy, dispatch] = useReducer(deployReducer, {
    status: (latestRun?.status ?? "pending") as RunStatus,
    applicationId: latestRun?.dokployApplicationId ?? null,
    publicUrl: latestRun?.publicUrl ?? null,
    logs: [],
    pollError: null,
  });

  const [redeployState, redeployFormAction, isRedeploying] = useActionState<RedeployState, FormData>(
    redeployAction,
    { status: "idle" },
  );

  // When redeployAction resolves to "building", transition state atomically.
  // dispatch() from useReducer is exempt from the setState-in-effect lint rule.
  useEffect(() => {
    if (redeployState.status === "building") {
      dispatch({
        type: "REDEPLOY_STARTED",
        applicationId: redeployState.dokployApplicationId,
        publicUrl: redeployState.publicUrl,
      });
    }
  }, [redeployState]);

  // Polling loop — runs while status is building and we have an applicationId
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!deploy.applicationId || deploy.status !== "building") return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(
          `/api/deployment/status?applicationId=${encodeURIComponent(deploy.applicationId!)}`,
          { cache: "no-store" },
        );

        const data = await res.json() as {
          status?: DeploymentStatus;
          logs?: DeploymentLogLine[];
          error?: string;
        };

        if (cancelled) return;

        if (!res.ok) {
          dispatch({ type: "POLL_ERROR", message: data.error ?? "Polling failed." });
          return;
        }

        dispatch({
          type: "POLL_TICK",
          dokStatus: data.status ?? "building",
          logs: Array.isArray(data.logs) ? data.logs : [],
        });
      } catch {
        if (!cancelled) {
          dispatch({ type: "POLL_ERROR", message: "Lost connection to deployment service." });
        }
      }
    }

    void poll();
    pollingRef.current = setInterval(() => void poll(), 2500);

    return () => {
      cancelled = true;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [deploy.applicationId, deploy.status]);

  const buildTypeLabel =
    environment.deploymentMode === "dockerfile" ? "Dockerfile"
    : environment.deploymentMode === "static" ? "Static site"
    : "Nixpacks";

  const isActive = deploy.status === "building";
  const isTerminal = deploy.status === "success" || deploy.status === "failed" || deploy.status === "cancelled";

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/projects" className="hover:text-foreground transition-colors">
              Projects
            </Link>
            <span>/</span>
            <span className="text-foreground">{project.name}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {project.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <GitHubIcon className="size-3.5" />
              {project.repoName}
            </a>
            <span>·</span>
            <span>{project.defaultBranch}</span>
            <span>·</span>
            <span>{buildTypeLabel}</span>
          </div>
        </div>

        {/* Redeploy button */}
        <form action={redeployFormAction}>
          <input type="hidden" name="projectId" value={project.id} />
          <Button type="submit" disabled={isRedeploying || isActive} size="sm" className="gap-1.5">
            {isRedeploying || isActive ? (
              <>
                <Spinner />
                Deploying...
              </>
            ) : (
              <>
                <RedeployIcon className="size-3.5" />
                Redeploy
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Redeploy error */}
      {redeployState.status === "error" && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {redeployState.error}
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Left: status + logs */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Production
              </p>
              <StatusBadge status={deploy.status} />
            </div>

            {/* Pending with no applicationId = Dokploy trigger failed */}
            {deploy.status === "pending" && !deploy.applicationId && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                {latestRun?.errorMessage ?? "Deployment not started yet."}
                <p className="mt-1 text-xs opacity-70">Use Redeploy to try again.</p>
              </div>
            )}

            {/* Public URL */}
            {deploy.publicUrl && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950">
                <span className="relative flex size-2.5 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-green-400" />
                </span>
                <a
                  href={deploy.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 truncate font-mono text-sm text-green-700 hover:underline dark:text-green-300"
                >
                  {deploy.publicUrl}
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(deploy.publicUrl!)}
                  className="shrink-0 rounded border border-green-200 p-1 text-green-600 hover:bg-green-100 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900"
                >
                  <CopyIcon className="size-3.5" />
                </button>
              </div>
            )}

            {/* Poll error */}
            {deploy.pollError && (
              <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {deploy.pollError}
              </div>
            )}

            {/* Logs */}
            <div className="mt-4">
              <DeployLog logs={deploy.logs} loading={isActive} />
            </div>
          </div>
        </div>

        {/* Right: deployment info */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Deployment info
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label="Environment" value={environment.name} />
              <InfoRow label="Branch" value={latestRun?.branch ?? project.defaultBranch} />
              <InfoRow label="Build type" value={buildTypeLabel} />
              {environment.deploymentMode === "dockerfile" && (
                <InfoRow label="Dockerfile" value={environment.dockerfilePath} />
              )}
              {environment.deploymentMode !== "static" && (
                <InfoRow label="Port" value={String(environment.containerPort)} />
              )}
              {environment.deploymentMode === "static" && (
                <InfoRow label="Publish dir" value={environment.publishDirectory} />
              )}
              <InfoRow label="Root dir" value={project.rootDirectory} />
            </div>
          </div>

          {isTerminal && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Latest run
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <InfoRow label="Status" value={deploy.status} />
                {latestRun?.createdAt && (
                  <InfoRow
                    label="Started"
                    value={new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(latestRun.createdAt))}
                  />
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Small shared components ───────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-mono text-xs text-foreground">{value}</span>
    </div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function RedeployIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" />
      <path d="M8 1v3.5L10.5 2" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={className}>
      <rect x="5" y="5" width="8" height="8" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4 animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}
