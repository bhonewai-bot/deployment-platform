"use client";

import { EnvVar } from "@/lib/types";
import { useState } from "react";
import { DeployLog, DeploymentLogLine } from "./deploy-log";

export function DeployForm() {
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("");
  const [rootDirectory, setRootDirectory] = useState("./");
  const [branches, setBranches] = useState<string[]>([]);
  const [repoInfo, setRepoInfo] = useState(null);
  const [deploymentType, setDeploymentType] = useState<
    "dockerfile" | "static" | "unknown"
  >("unknown");
  const [applicationId, setApplicationId] = useState("");
  const [logs, setLogs] = useState<DeploymentLogLine[]>([]);
  const [deploymentStatus, setDeploymentStatus] = useState<
    "idle" | "building" | "done" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);

  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { id: 1, key: "DATABASE_URL", value: "", secret: true },
  ]);

  function isValidGithubRepoUrl(value: string) {
    try {
      const url = new URL(value);
      const parts = url.pathname
        .replace(/\.git$/, "")
        .split("/")
        .filter(Boolean);

      return url.hostname === "github.com" && parts.length >= 2;
    } catch {
      return false;
    }
  }

  async function handleImport() {
    if (!isValidGithubRepoUrl(repo)) {
      setError("Please enter a valid GitHub repository URL.");
      return;
    }

    setImportLoading(true);
    setError("");

    try {
      const response = await fetch("/api/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl: repo }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setRepoInfo(data.repo);
      setBranches(data.branches);
      setBranch(data.defaultBranch);
      setDeploymentType(data.detectedDeploymentType ?? "unknown");
    } catch (error) {
      setDeploymentType("unknown");
      setError(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setImportLoading(false);
    }
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!repoInfo) {
      setError("Please import a repository first.");
      return;
    }

    setDeployLoading(true);
    setError("");
    setLogs([]);
    setApplicationId("");
    setDeploymentStatus("building");

    try {
      const resolvedDeploymentType =
        deploymentType === "static" ? "static" : "dockerfile";

      const response = await fetch("/api/deployment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl: repo,
          branch,
          rootDirectory,
          deploymentType: resolvedDeploymentType,
          envVars,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Deployment failed.");
      }

      setApplicationId(data.applicationId);

      setLogs([
        {
          id: "deployment-started",
          time: new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          level: "info",
          message: data.message || "Deployment started in Dokploy.",
        },
      ]);
    } catch (deplyError) {
      setError(
        deplyError instanceof Error ? deplyError.message : "Deployment failed.",
      );
    } finally {
      setDeployLoading(false);
    }
  }

  function addVariable() {
    setEnvVars((current) => [
      ...current,
      { id: Date.now(), key: "", value: "" },
    ]);
  }

  function updateVariable(id: number, field: "key" | "value", value: string) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full rounded-lg border border-[#4c5f84] bg-surface-container-low py-3 pl-12 pr-4 font-mono text-sm text-on-surface outline-none transition-all placeholder:text-zinc-600 focus:border-[#7fb0ff] focus:ring-2 focus:ring-[#2563eb]/25"
              placeholder="https://github.com/organization/project"
              type="text"
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handleImport}
            className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg border border-[#8db4ff] bg-linear-to-b from-[#9fc0ff] to-[#5effff] px-5 py-3 text-sm font-extrabold text-[#123a79] shadow-[0_5px_30px_rgba(101,153,255,0.32)] transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={importLoading || !repo.trim()}
            aria-busy={importLoading}
          >
            {importLoading ? (
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
              </>
            ) : (
              "Import"
            )}
          </button>
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>

      {repoInfo ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <label className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                Branch
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-lg border border-outline-variant/20 bg-surface-container-low py-3 pl-4 pr-10 text-sm font-medium text-on-surface outline-none transition-all focus:ring-1 focus:ring-primary/20"
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

            <div className="space-y-3">
              <label className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                Root Directory
              </label>
              <div className="relative">
                <input
                  disabled
                  className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-4 py-3 font-mono text-sm text-on-surface outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-primary/20"
                  placeholder="./"
                  type="text"
                  value={rootDirectory}
                  onChange={(event) => setRootDirectory(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                Environment Variables <span>(optional)</span>
              </label>
              <button
                className="flex items-center gap-1 text-[11px] font-bold text-primary transition-opacity hover:opacity-80"
                type="button"
                onClick={addVariable}
              >
                <span className="text-sm">+</span>
                ADD NEW
              </button>
            </div>

            <div className="space-y-2">
              {envVars.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-3">
                  <div className="col-span-5">
                    <input
                      className="w-full appearance-none rounded-lg border border-outline-variant/20 bg-surface-container-low py-3 pl-4 pr-10 text-sm font-medium text-on-surface outline-none transition-all focus:ring-1 focus:ring-primary/20"
                      placeholder="Key"
                      type="text"
                      value={item.key}
                      onChange={(event) =>
                        updateVariable(item.id, "key", event.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      className="w-full appearance-none rounded-lg border border-outline-variant/20 bg-surface-container-low py-3 pl-4 pr-10 text-sm font-medium text-on-surface outline-none transition-all focus:ring-1 focus:ring-primary/20"
                      placeholder="Value"
                      type={item.secret ? "password" : "text"}
                      value={item.value}
                      onChange={(event) =>
                        updateVariable(item.id, "value", event.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <button
                      className="text-zinc-600 transition-colors hover:text-error"
                      type="button"
                      onClick={() => removeVariable(item.id)}
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center border-outline-variant/5 pt-4 pb-4">
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
                  "Deploy"
                )}
              </button>
            </div>

            {(logs.length > 0 || applicationId) && (
              <DeployLog
                logs={logs}
                loading={deploymentStatus === "building"}
              />
            )}
          </div>
        </div>
      ) : null}
    </form>
  );
}
