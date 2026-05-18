"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type GitHubConnectionView = {
  id: string;
  login: string;
  repositorySelection: string | null;
};

type GitHubRepository = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
  language: string | null;
  updatedAt: string;
};

type RepositoriesResponse = {
  connection: GitHubConnectionView;
  repositories: GitHubRepository[];
};

type DeployMode = "dockerfile" | "static";

type ImportConfig = {
  branch: string;
  rootDirectory: string;
  mode: DeployMode;
  dockerfilePath: string;
  containerPort: string;
  publishDirectory: string;
};

const initialConfig: ImportConfig = {
  branch: "main",
  rootDirectory: ".",
  mode: "dockerfile",
  dockerfilePath: "Dockerfile",
  containerPort: "3000",
  publishDirectory: "dist",
};

export function RepositoryImportPage({
  initialConnection,
}: {
  initialConnection: GitHubConnectionView | null;
}) {
  const [connection, setConnection] = useState(initialConnection);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [config, setConfig] = useState<ImportConfig>(initialConfig);
  const [loading, setLoading] = useState(Boolean(initialConnection));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialConnection) return;

    async function loadRepositories() {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/github/repositories");
      const body = (await response.json()) as
        | RepositoriesResponse
        | { error: string };

      setLoading(false);

      if (!response.ok) {
        setError("error" in body ? body.error : "Failed to load repositories.");
        return;
      }

      const data = body as RepositoriesResponse;
      setConnection(data.connection);
      setRepositories(data.repositories);
    }

    void loadRepositories();
  }, [initialConnection]);

  const filteredRepositories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return repositories;

    return repositories.filter((repo) => {
      return (
        repo.fullName.toLowerCase().includes(normalizedQuery) ||
        repo.name.toLowerCase().includes(normalizedQuery) ||
        (repo.description ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, repositories]);

  function selectRepo(repo: GitHubRepository) {
    setSelectedRepo(repo);
    setConfig((current) => ({
      ...current,
      branch: repo.defaultBranch,
    }));
  }

  if (!connection) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader />
        <div className="rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Connect GitHub first
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Install the GitHub App before importing a repository. This works even
            if you signed in with email or Google.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/api/github/install"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              <GitHubMark className="size-4" />
              Connect GitHub
            </Link>
            <Link
              href="/projects"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Back to projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-border bg-card p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                GitHub connected
              </p>
              <h2 className="mt-2 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                <GitHubMark className="size-5" />
                {connection.login}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {repositories.length} repositories available from this
                installation.
              </p>
            </div>
            <Link
              href="/api/github/install"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Manage installation
            </Link>
          </div>

          {!selectedRepo ? (
            <RepositoryPicker
              error={error}
              loading={loading}
              query={query}
              repositories={filteredRepositories}
              onQueryChange={setQuery}
              onSelect={selectRepo}
            />
          ) : (
            <ConfigureProject
              config={config}
              repo={selectedRepo}
              onBack={() => setSelectedRepo(null)}
              onConfigChange={setConfig}
            />
          )}
        </section>

        <ImportSummary
          config={config}
          connection={connection}
          repo={selectedRepo}
        />
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Import project
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Select a GitHub repository and prepare its Dokploy settings.
      </p>
    </div>
  );
}

function RepositoryPicker({
  error,
  loading,
  query,
  repositories,
  onQueryChange,
  onSelect,
}: {
  error: string | null;
  loading: boolean;
  query: string;
  repositories: GitHubRepository[];
  onQueryChange: (value: string) => void;
  onSelect: (repo: GitHubRepository) => void;
}) {
  return (
    <div className="pt-6">
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground outline-none transition focus:border-foreground/40"
          placeholder="Search repositories..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        {loading ? (
          <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
            <Spinner />
            Syncing repositories from GitHub...
          </div>
        ) : repositories.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No repositories found for this installation.
          </div>
        ) : (
          repositories.map((repo) => (
            <button
              key={repo.id}
              type="button"
              className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left last:border-b-0 transition hover:bg-muted/60"
              onClick={() => onSelect(repo)}
            >
              <Icon
                name={repo.private ? "lock" : "folder"}
                className="size-4 text-muted-foreground"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {repo.fullName}
                  </p>
                  {repo.private && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Private
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {repo.description ?? "No description"}
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground sm:flex">
                {repo.language && <span>{repo.language}</span>}
                <span>{formatDate(repo.updatedAt)}</span>
              </div>
              <Icon
                name="chevron-right"
                className="size-4 text-muted-foreground"
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function ConfigureProject({
  config,
  repo,
  onBack,
  onConfigChange,
}: {
  config: ImportConfig;
  repo: GitHubRepository;
  onBack: () => void;
  onConfigChange: (config: ImportConfig) => void;
}) {
  function updateConfig(next: Partial<ImportConfig>) {
    onConfigChange({ ...config, ...next });
  }

  return (
    <div className="pt-6">
      <button
        type="button"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        onClick={onBack}
      >
        <Icon name="chevron-right" className="size-4 rotate-180" />
        Choose another repository
      </button>

      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Configure {repo.fullName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set only the values needed to create the project. Deployment can start
          after project creation.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <Field label="Production branch">
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
            value={config.branch}
            onChange={(event) => updateConfig({ branch: event.target.value })}
          />
        </Field>

        <Field label="Root directory">
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
            value={config.rootDirectory}
            onChange={(event) =>
              updateConfig({ rootDirectory: event.target.value })
            }
          />
        </Field>

        <Field label="Deployment mode">
          <div className="grid gap-3 sm:grid-cols-2">
            <ModeCard
              active={config.mode === "dockerfile"}
              description="Build and run a container from a Dockerfile."
              title="Dockerfile"
              onClick={() => updateConfig({ mode: "dockerfile" })}
            />
            <ModeCard
              active={config.mode === "static"}
              description="Serve a publish directory that contains index.html."
              title="Static site"
              onClick={() => updateConfig({ mode: "static" })}
            />
          </div>
        </Field>

        {config.mode === "dockerfile" ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Dockerfile path">
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
                value={config.dockerfilePath}
                onChange={(event) =>
                  updateConfig({ dockerfilePath: event.target.value })
                }
              />
            </Field>
            <Field label="Container port">
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
                inputMode="numeric"
                value={config.containerPort}
                onChange={(event) =>
                  updateConfig({ containerPort: event.target.value })
                }
              />
            </Field>
          </div>
        ) : (
          <Field label="Publish directory">
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
              value={config.publishDirectory}
              onChange={(event) =>
                updateConfig({ publishDirectory: event.target.value })
              }
            />
            <p className="mt-2 text-xs text-muted-foreground">
              This directory must contain an index.html file.
            </p>
          </Field>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button disabled>Create project (next)</Button>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

function ImportSummary({
  config,
  connection,
  repo,
}: {
  config: ImportConfig;
  connection: GitHubConnectionView;
  repo: GitHubRepository | null;
}) {
  return (
    <aside className="rounded-2xl border border-border bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Import summary
      </p>

      <div className="mt-5 space-y-4 text-sm">
        <SummaryRow label="GitHub" value={connection.login} />
        <SummaryRow label="Repository" value={repo?.fullName ?? "Not selected"} />
        <SummaryRow label="Branch" value={repo ? config.branch : "-"} />
        <SummaryRow
          label="Mode"
          value={
            repo
              ? config.mode === "dockerfile"
                ? "Dockerfile"
                : "Static site"
              : "-"
          }
        />
        <SummaryRow
          label="Target"
          value={
            repo
              ? config.mode === "dockerfile"
                ? `${config.dockerfilePath}:${config.containerPort}`
                : `${config.publishDirectory}/index.html`
              : "-"
          }
        />
      </div>
    </aside>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function ModeCard({
  active,
  description,
  title,
  onClick,
}: {
  active: boolean;
  description: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-xl border p-4 text-left transition",
        active
          ? "border-foreground bg-muted shadow-[0_0_0_1px_var(--foreground)]"
          : "border-border hover:bg-muted/60",
      )}
      onClick={onClick}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-mono text-xs text-foreground">{value}</span>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("fill-current", className)}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4 animate-spin">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}
