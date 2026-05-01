"use client";

import {
  DeployResult,
  EnvVar,
  ImportedRepo,
  ImportRepoResult,
} from "@/lib/types";
import { useActionState, useEffect, useState } from "react";
import { DeployLog, DeploymentLogLine } from "./deploy-log";
import { importGithubRepoAction } from "@/app/actions/github";

const initialState = {
  success: false,
  error: null as string | null,
  data: null as ImportRepoResult | null,
};

export function DeployForm() {
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("");
  const [rootDirectory, setRootDirectory] = useState("./");
  const [branches, setBranches] = useState<string[]>([]);
  const [repoInfo, setRepoInfo] = useState<ImportedRepo | null>(null);
  const [deploymentType, setDeploymentType] = useState<
    "dockerfile" | "static" | "unknown"
  >("unknown");

  const [importState, importAction, importPending] = useActionState(
    importGithubRepoAction,
    initialState,
  );

  useEffect(() => {
    if (!importState.success || !importState.data) return;

    setRepoInfo(importState.data.repo);
    setBranches(importState.data.branches ?? []);
    setBranch(importState.data.defaultBranch ?? "");
    setRootDirectory(importState.data.rootDirectory ?? "./");
    setDeploymentType(importState.data.detectedDeploymentType ?? "unknown");
  }, [importState]);

  const [applicationId, setApplicationId] = useState("");
  const [logs, setLogs] = useState<DeploymentLogLine[]>([]);
  const [deploymentStatus, setDeploymentStatus] = useState<
    "idle" | "building" | "done" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [deployLoading, setDeployLoading] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [domainError, setDomainError] = useState("");
  const generatePublicUrl = true;
  const [containerPort, setContainerPort] = useState("3000");
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);

  useEffect(() => {
    setContainerPort(deploymentType === "static" ? "80" : "3000");
  }, [deploymentType]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!repoInfo) {
      setError("Please import a repository first.");
      return;
    }

    if (deploymentType === "unknown") {
      setError("Select a deployment type before deploying.");
      return;
    }

    setDeployLoading(true);
    setError("");
    setLogs([]);
    setApplicationId("");
    setDeploymentStatus("building");
    setPublicUrl("");
    setDomainError("");

    try {
      const response = await fetch("/api/deployment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl: repo,
          branch,
          rootDirectory,
          deploymentType,
          generatePublicUrl,
          containerPort: Number.parseInt(containerPort, 10),
          envVars,
        }),
      });

      const data = (await response.json()) as DeployResult;

      if (!response.ok) {
        throw new Error(
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Deployment failed.",
        );
      }

      setApplicationId(data.applicationId ?? "");
      setPublicUrl(data.publicUrl ?? "");
      setDomainError(data.domainError ?? "");

      setLogs([
        {
          id: "deployment-started",
          time: "",
          level: "info",
          message: data.message || "Deployment started in Dokploy.",
        },
      ]);
    } catch (deployError) {
      setError(
        deployError instanceof Error
          ? deployError.message
          : "Deployment failed.",
      );
    } finally {
      setDeployLoading(false);
    }
  }

  useEffect(() => {
    if (!applicationId) {
      return;
    }

    let cancelled = false;

    async function pollDeploymentStatus() {
      try {
        const response = await fetch(
          `/api/deployment/status?applicationId=${encodeURIComponent(applicationId)}`,
          { cache: "no-store" },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load deployment logs.");
        }

        if (cancelled) {
          return;
        }

        setDeploymentStatus(data.status ?? "building");
        setLogs((prev) => {
          const nextLogs = Array.isArray(data.logs) ? data.logs : [];
          return nextLogs.length > 0 ? nextLogs : prev;
        });

        if (data.status === "done" || data.status === "error") {
          clearInterval(interval);
        }
      } catch (error) {
        if (!cancelled) {
          setDeploymentStatus("error");
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load development logs.",
          );
          clearInterval(interval);
        }
      }
    }

    void pollDeploymentStatus();

    const interval = setInterval(() => {
      void pollDeploymentStatus();
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [applicationId]);

  function addVariable() {
    setEnvVars((current) => [
      ...current,
      { id: Date.now(), key: "", value: "", secret: true },
    ]);
  }

  function updateVariable(
    id: number,
    field: "key" | "value" | "secret",
    value: string | boolean,
  ) {
    setEnvVars((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  function removeVariable(id: number) {
    setEnvVars((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* ── Import form ─────────────────────────────────────────── */}
      <form action={importAction} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
              GitHub Repository URL
            </label>
            <span className="rounded bg-surface-container-highest px-2 py-0.5 text-[10px] text-zinc-400">
              Required
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="group relative min-w-0 flex-1">
              <div className="pointer-events-none absolute left-4 top-1/2 z-10 flex -translate-y-1/2 items-center text-[#8ab4ff]">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M10.5 13.5 13.5 10.5" strokeLinecap="round" />
                  <path
                    d="M7.88 14.63 6.5 16a3 3 0 0 0 4.24 4.24l1.38-1.37m4-9.74L17.5 8a3 3 0 0 0-4.24-4.24L11.88 5.13"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <input
                name="repoUrl"
                required
                className="w-full rounded-lg border border-[#4c5f84] bg-surface-container-low py-3 pl-12 pr-4 font-mono text-sm text-on-surface outline-none transition-all placeholder:text-zinc-600 focus:border-[#7fb0ff] focus:ring-2 focus:ring-[#2563eb]/25"
                placeholder="https://github.com/organization/project"
                type="url"
                value={repo}
                onChange={(event) => setRepo(event.target.value)}
              />
            </div>

            <button
              type="submit"
              className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg border border-[#8db4ff] bg-linear-to-b from-[#9fc0ff] to-[#5effff] px-5 py-3 text-sm font-extrabold text-[#123a79] shadow-[0_5px_30px_rgba(101,153,255,0.32)] transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={importPending}
              aria-busy={importPending}
            >
              {importPending ? (
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-4 animate-spin"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    className="opacity-25"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
              ) : (
                "Import"
              )}
            </button>
          </div>

          {importState.error ? (
            <p className="text-sm text-red-300">{importState.error}</p>
          ) : null}
        </div>
      </form>

      {/* ── Deploy form (shown after import) ────────────────────── */}
      {repoInfo ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="repoUrl" value={repo} readOnly />

          {/* Branch + Deployment type row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Branch */}
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                Branch
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-lg border border-[#4c5f84] bg-surface-container-low py-3 pl-4 pr-10 text-sm font-medium text-on-surface outline-none transition-all focus:border-[#7fb0ff] focus:ring-2 focus:ring-[#2563eb]/25"
                  value={branch}
                  onChange={(event) => setBranch(event.target.value)}
                >
                  {branches?.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="m5 7.5 5 5 5-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {/* Deployment type (unknown) OR disabled root directory pill */}
            <div className="space-y-2">
              {deploymentType === "unknown" ? (
                <>
                  <label className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                    Deployment Type
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-lg border border-[#4c5f84] bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface outline-none transition-all focus:border-[#7fb0ff] focus:ring-2 focus:ring-[#2563eb]/25"
                        value={deploymentType}
                        onChange={(event) =>
                          setDeploymentType(
                            event.target.value as
                              | "dockerfile"
                              | "static"
                              | "unknown",
                          )
                        }
                      >
                        <option value="unknown">Select deployment type</option>
                        <option value="dockerfile">Dockerfile</option>
                        <option value="static">Static</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                        <svg
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                          className="size-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path
                            d="m5 7.5 5 5 5-5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant/60">
                      We couldn&apos;t detect the deployment strategy. Choose it
                      manually before deploying.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* No label, no helper text — just a read-only badge */}
                  <label className="font-mono text-xs uppercase tracking-widest text-on-surface-variant/0 select-none">
                    &nbsp;
                  </label>
                  <div className="flex h-[46px] items-center gap-2 rounded-lg border border-[#4c5f84]/40 bg-surface-container-low/60 px-4 opacity-60 cursor-not-allowed select-none">
                    <svg
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      className="size-4 shrink-0 text-on-surface-variant"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path
                        d="M2 6l8-4 8 4v8l-8 4-8-4V6Z"
                        strokeLinejoin="round"
                      />
                      <path d="M10 2v16M2 6l8 4 8-4" strokeLinejoin="round" />
                    </svg>
                    <span className="font-mono text-sm text-on-surface-variant truncate">
                      {rootDirectory === "./" || rootDirectory === "."
                        ? "/ (root)"
                        : rootDirectory}
                    </span>
                    <span className="ml-auto shrink-0 rounded bg-surface-container-highest px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">
                      {deploymentType}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Environment variables ─────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                Environment Variables{" "}
                <span className="normal-case text-on-surface-variant/50">
                  (optional)
                </span>
              </label>
              <button
                className="flex items-center gap-1.5 rounded-md border border-[#4c5f84] bg-surface-container-low px-3 py-1.5 text-[11px] font-bold text-primary transition-all hover:border-[#7fb0ff] hover:bg-surface-container active:scale-95"
                type="button"
                onClick={addVariable}
              >
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                </svg>
                ADD NEW
              </button>
            </div>

            {envVars.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#4c5f84]/40 bg-surface-container-low/50 px-4 py-5 text-sm text-on-surface-variant/50 text-center">
                No environment variables yet.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_1fr_80px_64px] gap-2 px-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/50">
                    Key
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/50">
                    Value
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/50 text-center">
                    Visibility
                  </span>
                  <span />
                </div>

                {envVars.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_1fr_80px_64px] gap-2 items-center"
                  >
                    <input
                      className="w-full rounded-lg border border-[#4c5f84] bg-surface-container-low px-3 py-2.5 font-mono text-sm text-on-surface outline-none transition-all placeholder:text-zinc-600 focus:border-[#7fb0ff] focus:ring-2 focus:ring-[#2563eb]/25"
                      placeholder="KEY_NAME"
                      type="text"
                      value={item.key}
                      onChange={(event) =>
                        updateVariable(item.id, "key", event.target.value)
                      }
                    />
                    <input
                      className="w-full rounded-lg border border-[#4c5f84] bg-surface-container-low px-3 py-2.5 font-mono text-sm text-on-surface outline-none transition-all placeholder:text-zinc-600 focus:border-[#7fb0ff] focus:ring-2 focus:ring-[#2563eb]/25"
                      placeholder="value"
                      type={item.secret ? "password" : "text"}
                      value={item.value}
                      onChange={(event) =>
                        updateVariable(item.id, "value", event.target.value)
                      }
                    />
                    {/* Toggle secret/visible */}
                    <button
                      className={`flex h-[38px] w-full items-center justify-center gap-1 rounded-lg border text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95 ${
                        item.secret
                          ? "border-[#4c5f84] bg-surface-container-low text-on-surface-variant hover:border-[#7fb0ff] hover:text-on-surface"
                          : "border-[#7fb0ff]/60 bg-[#2563eb]/10 text-primary"
                      }`}
                      type="button"
                      title={item.secret ? "Click to reveal" : "Click to hide"}
                      onClick={() =>
                        updateVariable(item.id, "secret", !item.secret)
                      }
                    >
                      {item.secret ? (
                        <svg
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                          className="size-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path
                            d="M3 10s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z"
                            strokeLinejoin="round"
                          />
                          <circle cx="10" cy="10" r="2" />
                          <path
                            d="M3 3l14 14"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                          className="size-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path
                            d="M3 10s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z"
                            strokeLinejoin="round"
                          />
                          <circle cx="10" cy="10" r="2" />
                        </svg>
                      )}
                    </button>
                    {/* Remove */}
                    <button
                      className="flex h-[38px] w-full items-center justify-center rounded-lg border border-[#4c5f84] bg-surface-container-low text-zinc-500 transition-all hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95"
                      type="button"
                      title="Remove variable"
                      onClick={() => removeVariable(item.id)}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path
                          d="M6 6l8 8M14 6l-8 8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Deploy button ─────────────────────────────────────── */}
          <div className="pt-2 pb-2">
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#8db4ff] bg-linear-to-b from-[#9fc0ff] to-[#5effff] px-6 py-3 text-sm font-extrabold uppercase text-[#123a79] shadow-[0_5px_30px_rgba(101,153,255,0.32)] transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={deployLoading}
            >
              {deployLoading ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="size-4 animate-spin"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      className="opacity-25"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                  </svg>
                  Deploying...
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className="size-4"
                    fill="currentColor"
                  >
                    <path d="M10 2a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L10 14.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L2.818 8.123a.75.75 0 0 1 .416-1.28l4.21-.611L9.327 2.418A.75.75 0 0 1 10 2Z" />
                  </svg>
                  Deploy
                </>
              )}
            </button>
          </div>

          {/* ── Error ─────────────────────────────────────────────── */}
          {error ? (
            <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3">
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-rose-400"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          ) : null}

          {/* ── Public URL card ───────────────────────────────────── */}
          {publicUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-5">
              {/* Glow accent */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-emerald-400/10 blur-2xl"
              />

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {/* Live pulse dot */}
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
                    </span>
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant/70">
                    Your app is deployed and publicly accessible
                  </p>
                  <a
                    href={publicUrl}
                    rel="noreferrer"
                    target="_blank"
                    className="group inline-flex items-center gap-1.5 break-all font-mono text-sm font-medium text-emerald-300 transition-colors hover:text-emerald-200"
                  >
                    {publicUrl}
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                      className="size-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        d="M6 3H3v10h10v-3M9 3h4v4M13 3 7 9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </div>

                {/* Copy button */}
                <CopyButton value={publicUrl} />
              </div>
            </div>
          ) : null}

          {/* ── Domain error ──────────────────────────────────────── */}
          {domainError ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3">
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-amber-400"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-amber-300">
                Domain generation skipped: {domainError}
              </p>
            </div>
          ) : null}

          {/* ── Logs ─────────────────────────────────────────────── */}
          {(logs.length > 0 || applicationId) && (
            <DeployLog
              logs={logs}
              loading={deploymentStatus === "building"}
            />
          )}
        </form>
      ) : null}
    </div>
  );
}

// ── Tiny copy-to-clipboard button ────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy URL"
      className="shrink-0 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-400 transition-all hover:border-emerald-400/40 hover:bg-emerald-400/20 active:scale-95"
    >
      {copied ? (
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 8l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <rect x="5" y="5" width="8" height="8" rx="1.5" strokeLinejoin="round" />
          <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
