"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "connect" | "authorize" | "pick" | "configure" | "ready";

type DeployMode = "dockerfile" | "static";

interface MockRepo {
  id: string;
  fullName: string;
  name: string;
  description: string | null;
  private: boolean;
  language: string;
  updatedAt: string;
  defaultBranch: string;
}

// ─── Mock repos — replace with real GitHub App installation API call ──────────

const MOCK_REPOS: MockRepo[] = [
  {
    id: "1",
    fullName: "acme/api-gateway",
    name: "api-gateway",
    description: "Edge routing and auth middleware",
    private: false,
    language: "TypeScript",
    updatedAt: "2h ago",
    defaultBranch: "main",
  },
  {
    id: "2",
    fullName: "acme/web-client",
    name: "web-client",
    description: "Customer-facing Next.js front-end",
    private: false,
    language: "TypeScript",
    updatedAt: "4h ago",
    defaultBranch: "main",
  },
  {
    id: "3",
    fullName: "acme/payment-worker",
    name: "payment-worker",
    description: "Stripe webhook consumer",
    private: true,
    language: "Go",
    updatedAt: "1d ago",
    defaultBranch: "main",
  },
  {
    id: "4",
    fullName: "acme/data-pipeline",
    name: "data-pipeline",
    description: null,
    private: true,
    language: "Python",
    updatedAt: "3d ago",
    defaultBranch: "main",
  },
  {
    id: "5",
    fullName: "acme/docs",
    name: "docs",
    description: "Static documentation site",
    private: false,
    language: "MDX",
    updatedAt: "1w ago",
    defaultBranch: "main",
  },
];

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Go: "#00add8",
  Python: "#3572a5",
  Rust: "#dea584",
  MDX: "#fcb32c",
};

// ─── Step indicator ────────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string }[] = [
  { id: "connect", label: "Connect" },
  { id: "authorize", label: "Authorize" },
  { id: "pick", label: "Select repo" },
  { id: "configure", label: "Configure" },
  { id: "ready", label: "Deploy" },
];

const STEP_ORDER: Step[] = [
  "connect",
  "authorize",
  "pick",
  "configure",
  "ready",
];

function stepIndex(s: Step) {
  return STEP_ORDER.indexOf(s);
}

function StepIndicator({ current }: { current: Step }) {
  const ci = stepIndex(current);
  return (
    <ol className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < ci;
        const active = i === ci;
        const last = i === STEPS.length - 1;
        return (
          <li key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all",
                  done
                    ? "border-transparent text-white"
                    : active
                      ? "border-transparent text-white"
                      : "border-[var(--dash-divider)] text-[var(--dash-accent-dim)]",
                )}
                style={{
                  background: done
                    ? "var(--dash-logo-bg)"
                    : active
                      ? "var(--dash-cta-bg)"
                      : "transparent",
                }}
              >
                {done ? (
                  <svg viewBox="0 0 12 12" fill="none" className="size-3">
                    <path
                      d="M2 6l2.5 2.5L10 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium tracking-wide whitespace-nowrap",
                  active
                    ? "text-[var(--dash-accent)]"
                    : done
                      ? "text-[var(--dash-accent-dim)]"
                      : "text-[var(--dash-accent-dim)]",
                )}
              >
                {step.label}
              </span>
            </div>
            {!last && (
              <div
                className="mx-2 mb-5 h-px w-10 transition-all"
                style={{
                  background: done
                    ? "var(--dash-accent)"
                    : "var(--dash-divider)",
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Step panels ──────────────────────────────────────────────────────────────

function ConnectPanel({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--dash-accent)" }}
        >
          Connect GitHub
        </h2>
        <p
          className="mt-1.5 text-sm leading-relaxed"
          style={{ color: "var(--dash-accent-dim)" }}
        >
          Install the GitHub App to grant access to your repositories. You
          choose which repos to expose — read-only by default.
        </p>
      </div>

      {/* How it works */}
      <div
        className="rounded-xl border p-5 space-y-4"
        style={{
          borderColor: "var(--dash-divider)",
          background: "var(--dash-header-bg)",
        }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--dash-accent-dim)" }}
        >
          How it works
        </p>
        {[
          {
            n: "1",
            title: "Install the GitHub App",
            body: "You'll be redirected to GitHub to install the app on your account or organization.",
          },
          {
            n: "2",
            title: "Choose repositories",
            body: "Grant access to all repositories or select specific ones. You can change this later.",
          },
          {
            n: "3",
            title: "We generate an access token",
            body: "A short-lived installation token is created server-side using your installation ID. Your password is never stored.",
          },
        ].map((row) => (
          <div key={row.n} className="flex gap-3.5">
            <div
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                background: "var(--dash-nav-active-bg)",
                color: "var(--dash-accent)",
              }}
            >
              {row.n}
            </div>
            <div>
              <p
                className="text-[13px] font-semibold"
                style={{ color: "var(--dash-accent)" }}
              >
                {row.title}
              </p>
              <p
                className="mt-0.5 text-[12px] leading-relaxed"
                style={{ color: "var(--dash-accent-dim)" }}
              >
                {row.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="lg"
          className="gap-2.5"
          style={{
            background: "var(--dash-cta-bg)",
            color: "var(--dash-cta-fg)",
          }}
          onClick={onNext}
        >
          <GitHubMark className="size-4" />
          Install GitHub App
        </Button>
        <span
          className="flex items-center gap-1.5 text-[12px]"
          style={{ color: "var(--dash-accent-dim)" }}
        >
          <Icon name="shield" className="size-3.5" />
          Read-only code access
        </span>
      </div>
    </div>
  );
}

function AuthorizePanel({ onNext }: { onNext: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function simulate() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 1400);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--dash-accent)" }}
        >
          Authorize installation
        </h2>
        <p
          className="mt-1.5 text-sm leading-relaxed"
          style={{ color: "var(--dash-accent-dim)" }}
        >
          GitHub returns an{" "}
          <code
            className="rounded px-1.5 py-0.5 font-mono text-[11px]"
            style={{
              background: "var(--dash-nav-active-bg)",
              color: "var(--dash-accent)",
            }}
          >
            installation_id
          </code>{" "}
          after the app is installed. We use it to generate a short-lived access
          token for your repositories.
        </p>
      </div>

      {/* Token exchange visualization */}
      <div
        className="rounded-xl border divide-y text-[12px] font-mono overflow-hidden"
        style={{
          borderColor: "var(--dash-divider)",
          background: "var(--dash-header-bg)",
        }}
      >
        {[
          { label: "GitHub returns", value: "installation_id=48291736" },
          { label: "Server signs", value: "JWT (App private key, exp 10m)" },
          {
            label: "Exchange",
            value: "POST /app/installations/:id/access_tokens",
          },
          { label: "Token lifetime", value: "1 hour · never stored" },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-3"
            style={{ borderColor: "var(--dash-divider)" }}
          >
            <span style={{ color: "var(--dash-accent-dim)" }}>{row.label}</span>
            <span
              className="text-right"
              style={{ color: "var(--dash-accent)" }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {!done ? (
          <Button
            size="lg"
            disabled={loading}
            style={{
              background: "var(--dash-cta-bg)",
              color: "var(--dash-cta-fg)",
            }}
            onClick={simulate}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner /> Exchanging token…
              </span>
            ) : (
              "Confirm authorization"
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
              style={{
                background: "#dcfce7",
                color: "#166534",
              }}
            >
              <svg viewBox="0 0 16 16" fill="none" className="size-4">
                <path
                  d="M3 8l3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Installation verified
            </div>
            <Button
              size="lg"
              style={{
                background: "var(--dash-cta-bg)",
                color: "var(--dash-cta-fg)",
              }}
              onClick={onNext}
            >
              List repositories →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function PickPanel({
  onNext,
  onSelect,
  selected,
}: {
  onNext: () => void;
  onSelect: (r: MockRepo) => void;
  selected: MockRepo | null;
}) {
  const [query, setQuery] = useState("");

  const filtered = MOCK_REPOS.filter(
    (r) =>
      r.fullName.toLowerCase().includes(query.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--dash-accent)" }}
        >
          Select a repository
        </h2>
        <p
          className="mt-1.5 text-sm"
          style={{ color: "var(--dash-accent-dim)" }}
        >
          {MOCK_REPOS.length} repositories accessible via your GitHub
          installation.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
          style={{ color: "var(--dash-accent-dim)" }}
        >
          <path
            d="M13 13l4 4M9 15A6 6 0 1 0 9 3a6 6 0 0 0 0 12Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          type="text"
          placeholder="Search repositories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border py-2.5 pl-9 pr-4 text-sm outline-none transition-colors"
          style={{
            borderColor: "var(--dash-divider)",
            background: "var(--dash-sidebar-bg)",
            color: "var(--dash-accent)",
          }}
        />
      </div>

      {/* Repo list */}
      <div
        className="rounded-xl border divide-y overflow-hidden"
        style={{ borderColor: "var(--dash-divider)" }}
      >
        {filtered.length === 0 && (
          <p
            className="px-4 py-6 text-center text-sm"
            style={{ color: "var(--dash-accent-dim)" }}
          >
            No repositories match &ldquo;{query}&rdquo;
          </p>
        )}
        {filtered.map((repo) => {
          const isSelected = selected?.id === repo.id;
          return (
            <button
              key={repo.id}
              type="button"
              onClick={() => onSelect(repo)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{
                background: isSelected
                  ? "var(--dash-nav-active-bg)"
                  : "var(--dash-sidebar-bg)",
                borderColor: "var(--dash-divider)",
              }}
            >
              {/* Lock/public icon */}
              <span style={{ color: "var(--dash-accent-dim)" }}>
                {repo.private ? (
                  <svg viewBox="0 0 16 16" fill="none" className="size-4">
                    <rect
                      x="3"
                      y="7"
                      width="10"
                      height="7"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M5 7V5a3 3 0 0 1 6 0v2"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" fill="none" className="size-4">
                    <path
                      d="M2 4.5A2.5 2.5 0 0 1 4.5 2H7v12H4.5A2.5 2.5 0 0 1 2 11.5v-7Zm0 0v7M7 2h5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7V2Z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[13px] font-semibold"
                    style={{ color: "var(--dash-accent)" }}
                  >
                    {repo.fullName}
                  </span>
                  {repo.private && (
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        background: "var(--dash-nav-active-bg)",
                        color: "var(--dash-accent-dim)",
                      }}
                    >
                      Private
                    </span>
                  )}
                </div>
                {repo.description && (
                  <p
                    className="mt-0.5 truncate text-[12px]"
                    style={{ color: "var(--dash-accent-dim)" }}
                  >
                    {repo.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {/* Language dot */}
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{
                      background: LANG_COLORS[repo.language] ?? "#888",
                    }}
                  />
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--dash-accent-dim)" }}
                  >
                    {repo.language}
                  </span>
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "var(--dash-accent-dim)" }}
                >
                  {repo.updatedAt}
                </span>
                {/* Selection radio */}
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full border transition-all",
                    isSelected ? "border-transparent" : "",
                  )}
                  style={{
                    borderColor: isSelected
                      ? "transparent"
                      : "var(--dash-divider)",
                    background: isSelected
                      ? "var(--dash-cta-bg)"
                      : "transparent",
                  }}
                >
                  {isSelected && (
                    <svg viewBox="0 0 8 8" fill="none" className="size-2">
                      <circle cx="4" cy="4" r="2" fill="white" />
                    </svg>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <Button
          size="lg"
          disabled={!selected}
          style={
            selected
              ? {
                  background: "var(--dash-cta-bg)",
                  color: "var(--dash-cta-fg)",
                }
              : undefined
          }
          onClick={onNext}
        >
          {selected ? `Configure ${selected.name} →` : "Select a repository"}
        </Button>
      </div>
    </div>
  );
}

function ConfigurePanel({
  repo,
  onNext,
}: {
  repo: MockRepo;
  onNext: (mode: DeployMode, branch: string) => void;
}) {
  const [mode, setMode] = useState<DeployMode>("dockerfile");
  const [branch, setBranch] = useState(repo.defaultBranch);

  const MOCK_BRANCHES = [repo.defaultBranch, "develop", "staging"];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--dash-accent)" }}
        >
          Configure{" "}
          <span
            className="font-mono text-lg"
            style={{ color: "var(--dash-accent-dim)" }}
          >
            {repo.fullName}
          </span>
        </h2>
        <p
          className="mt-1.5 text-sm"
          style={{ color: "var(--dash-accent-dim)" }}
        >
          Choose how this repository should be built and deployed to Dokploy.
        </p>
      </div>

      {/* Branch */}
      <div className="space-y-2">
        <label
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--dash-accent-dim)" }}
        >
          Production branch
        </label>
        <div className="relative">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full appearance-none rounded-lg border py-2.5 pl-4 pr-10 text-sm font-medium outline-none"
            style={{
              borderColor: "var(--dash-divider)",
              background: "var(--dash-sidebar-bg)",
              color: "var(--dash-accent)",
            }}
          >
            {MOCK_BRANCHES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
            style={{ color: "var(--dash-accent-dim)" }}
          >
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Deploy mode cards */}
      <div className="space-y-2">
        <label
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--dash-accent-dim)" }}
        >
          Deployment mode
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              {
                id: "dockerfile" as DeployMode,
                title: "Dockerfile",
                desc: "Build and run a container. Works with any language or framework.",
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" className="size-5">
                    <path
                      d="M13 2.05V2a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9M3 5h10M3 9h10"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <rect
                      x="2"
                      y="12"
                      width="20"
                      height="10"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M6 17h.01M10 17h.01M14 17h.01M18 17h.01"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
              {
                id: "static" as DeployMode,
                title: "Static site",
                desc: "Serve a build output directory. For HTML, React, Vue, and more.",
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" className="size-5">
                    <path
                      d="M4 4h16v12H4z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 20h8M12 16v4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M8 9l3 3-3 3M13 15h3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
              },
            ] as const
          ).map((opt) => {
            const active = mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id)}
                className="flex flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition-all"
                style={{
                  borderColor: active
                    ? "var(--dash-accent)"
                    : "var(--dash-divider)",
                  background: active
                    ? "var(--dash-nav-active-bg)"
                    : "var(--dash-sidebar-bg)",
                  boxShadow: active
                    ? "0 0 0 1px var(--dash-accent)"
                    : undefined,
                }}
              >
                <span style={{ color: "var(--dash-accent)" }}>{opt.icon}</span>
                <div>
                  <p
                    className="text-[13px] font-semibold"
                    style={{ color: "var(--dash-accent)" }}
                  >
                    {opt.title}
                  </p>
                  <p
                    className="mt-0.5 text-[12px] leading-relaxed"
                    style={{ color: "var(--dash-accent-dim)" }}
                  >
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Button
          size="lg"
          style={{
            background: "var(--dash-cta-bg)",
            color: "var(--dash-cta-fg)",
          }}
          onClick={() => onNext(mode, branch)}
        >
          Create project →
        </Button>
      </div>
    </div>
  );
}

function ReadyPanel({
  repo,
  mode,
  branch,
}: {
  repo: MockRepo;
  mode: DeployMode;
  branch: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-full"
          style={{ background: "#dcfce7" }}
        >
          <svg viewBox="0 0 20 20" fill="none" className="size-5">
            <path
              d="M4 10l4 4 8-8"
              stroke="#166534"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--dash-accent)" }}
          >
            Project created
          </h2>
          <p className="text-sm" style={{ color: "var(--dash-accent-dim)" }}>
            Ready to deploy{" "}
            <span className="font-mono font-medium">{repo.fullName}</span> to
            Dokploy.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div
        className="rounded-xl border divide-y text-sm overflow-hidden"
        style={{ borderColor: "var(--dash-divider)" }}
      >
        {[
          { label: "Repository", value: repo.fullName },
          { label: "Branch", value: branch },
          {
            label: "Mode",
            value: mode === "dockerfile" ? "Dockerfile" : "Static site",
          },
          { label: "Environment", value: "Production (default)" },
          { label: "Status", value: "Ready to deploy" },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: "var(--dash-sidebar-bg)",
              borderColor: "var(--dash-divider)",
            }}
          >
            <span style={{ color: "var(--dash-accent-dim)" }}>{row.label}</span>
            <span
              className="font-mono text-[13px] font-medium"
              style={{ color: "var(--dash-accent)" }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="lg"
          style={{
            background: "var(--dash-cta-bg)",
            color: "var(--dash-cta-fg)",
          }}
        >
          Deploy now
        </Button>
        <Button variant="outline" size="lg">
          View project
        </Button>
      </div>
    </div>
  );
}

// ─── Right preview card ────────────────────────────────────────────────────────

function PreviewCard({
  step,
  selected,
  mode,
  branch,
}: {
  step: Step;
  selected: MockRepo | null;
  mode: DeployMode;
  branch: string;
}) {
  // The right card morphs to reflect the current step context
  if (step === "connect" || step === "authorize") {
    return (
      <div
        className="rounded-2xl border p-6 flex flex-col gap-5"
        style={{
          borderColor: "var(--dash-divider)",
          background: "var(--dash-sidebar-bg)",
        }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--dash-accent-dim)" }}
        >
          What you get
        </p>
        {[
          {
            icon: (
              <svg viewBox="0 0 20 20" fill="none" className="size-4.5">
                <path
                  d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 6v4l3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ),
            title: "Automatic deployments",
            desc: "Push to your branch and a new deploy starts automatically.",
          },
          {
            icon: (
              <svg viewBox="0 0 20 20" fill="none" className="size-4.5">
                <path
                  d="M3 10s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            ),
            title: "Live deploy logs",
            desc: "Stream real-time build output from Dokploy directly in the UI.",
          },
          {
            icon: (
              <svg viewBox="0 0 20 20" fill="none" className="size-4.5">
                <path
                  d="M4 4h12v10H4z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 17h6M10 14v3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ),
            title: "Public URL",
            desc: "Get a shareable HTTPS URL for every environment, generated by Traefik.",
          },
          {
            icon: (
              <svg viewBox="0 0 20 20" fill="none" className="size-4.5">
                <rect
                  x="3"
                  y="8"
                  width="14"
                  height="9"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M7 8V6a3 3 0 0 1 6 0v2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ),
            title: "Environment secrets",
            desc: "Store API keys and tokens — never exposed to the browser.",
          },
        ].map((item) => (
          <div key={item.title} className="flex gap-3">
            <span
              className="mt-0.5 shrink-0"
              style={{ color: "var(--dash-accent-dim)" }}
            >
              {item.icon}
            </span>
            <div>
              <p
                className="text-[13px] font-semibold"
                style={{ color: "var(--dash-accent)" }}
              >
                {item.title}
              </p>
              <p
                className="mt-0.5 text-[12px] leading-relaxed"
                style={{ color: "var(--dash-accent-dim)" }}
              >
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (step === "pick") {
    return (
      <div
        className="rounded-2xl border p-6 flex flex-col gap-4"
        style={{
          borderColor: "var(--dash-divider)",
          background: "var(--dash-sidebar-bg)",
        }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--dash-accent-dim)" }}
        >
          Selected repository
        </p>
        {selected ? (
          <>
            <div className="flex items-start gap-3">
              <GitHubMark
                className="mt-0.5 size-5 shrink-0"
                style={{ color: "var(--dash-accent)" }}
              />
              <div className="min-w-0">
                <p
                  className="font-mono text-sm font-semibold"
                  style={{ color: "var(--dash-accent)" }}
                >
                  {selected.fullName}
                </p>
                {selected.description && (
                  <p
                    className="mt-1 text-[12px] leading-relaxed"
                    style={{ color: "var(--dash-accent-dim)" }}
                  >
                    {selected.description}
                  </p>
                )}
              </div>
            </div>
            <div
              className="rounded-lg border divide-y text-[12px] overflow-hidden"
              style={{ borderColor: "var(--dash-divider)" }}
            >
              {[
                { k: "Branch", v: selected.defaultBranch },
                { k: "Language", v: selected.language },
                { k: "Visibility", v: selected.private ? "Private" : "Public" },
              ].map((row) => (
                <div
                  key={row.k}
                  className="flex justify-between px-3 py-2"
                  style={{
                    background: "var(--dash-header-bg)",
                    borderColor: "var(--dash-divider)",
                  }}
                >
                  <span style={{ color: "var(--dash-accent-dim)" }}>
                    {row.k}
                  </span>
                  <span
                    className="font-mono font-medium"
                    style={{ color: "var(--dash-accent)" }}
                  >
                    {row.v}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div
            className="rounded-xl border border-dashed py-10 text-center text-sm"
            style={{
              borderColor: "var(--dash-divider)",
              color: "var(--dash-accent-dim)",
            }}
          >
            No repository selected yet
          </div>
        )}
      </div>
    );
  }

  if (step === "configure" || step === "ready") {
    const repo = selected!;
    return (
      <div
        className="rounded-2xl border p-6 flex flex-col gap-4"
        style={{
          borderColor: "var(--dash-divider)",
          background: "var(--dash-sidebar-bg)",
        }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--dash-accent-dim)" }}
        >
          Deployment preview
        </p>

        {/* Fake pipeline visualization */}
        <div className="flex flex-col gap-2">
          {[
            {
              label: "Clone repository",
              sub: `${repo.fullName}@${branch}`,
              done: step === "ready",
            },
            {
              label:
                mode === "dockerfile"
                  ? "Build Docker image"
                  : "Build static assets",
              sub:
                mode === "dockerfile" ? "docker build -t app ." : "serve /dist",
              done: step === "ready",
            },
            {
              label: "Push to Dokploy",
              sub: "application.deploy via tRPC",
              done: step === "ready",
            },
            {
              label: "Assign Traefik domain",
              sub: "*.traefik.me → container",
              done: step === "ready",
            },
          ].map((row, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className="flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold"
                  style={{
                    borderColor: row.done
                      ? "transparent"
                      : "var(--dash-divider)",
                    background: row.done
                      ? "#dcfce7"
                      : "var(--dash-nav-active-bg)",
                    color: row.done ? "#166534" : "var(--dash-accent-dim)",
                  }}
                >
                  {row.done ? (
                    <svg viewBox="0 0 10 10" fill="none" className="size-2.5">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 3 && (
                  <div
                    className="my-1 w-px flex-1"
                    style={{
                      height: 14,
                      background: row.done ? "#86efac" : "var(--dash-divider)",
                    }}
                  />
                )}
              </div>
              <div className="pb-1">
                <p
                  className="text-[13px] font-medium"
                  style={{ color: "var(--dash-accent)" }}
                >
                  {row.label}
                </p>
                <p
                  className="font-mono text-[11px]"
                  style={{ color: "var(--dash-accent-dim)" }}
                >
                  {row.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Root import flow ──────────────────────────────────────────────────────────

export function GitHubImportFlow() {
  const [step, setStep] = useState<Step>("connect");
  const [selectedRepo, setSelectedRepo] = useState<MockRepo | null>(null);
  const [deployMode, setDeployMode] = useState<DeployMode>("dockerfile");
  const [deployBranch, setDeployBranch] = useState("main");

  function advance() {
    const idx = stepIndex(step);
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1]);
    }
  }

  function handleSelect(repo: MockRepo) {
    setSelectedRepo(repo);
    setDeployBranch(repo.defaultBranch);
  }

  function handleConfigure(mode: DeployMode, branch: string) {
    setDeployMode(mode);
    setDeployBranch(branch);
    advance();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--dash-accent)" }}
        >
          Projects
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--dash-accent-dim)" }}>
          Import a GitHub repository and deploy it to Dokploy.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left — active step panel */}
        <div
          className="rounded-2xl border p-8"
          style={{
            borderColor: "var(--dash-divider)",
            background: "var(--dash-sidebar-bg)",
          }}
        >
          {step === "connect" && <ConnectPanel onNext={advance} />}
          {step === "authorize" && <AuthorizePanel onNext={advance} />}
          {step === "pick" && (
            <PickPanel
              onNext={advance}
              onSelect={handleSelect}
              selected={selectedRepo}
            />
          )}
          {step === "configure" && selectedRepo && (
            <ConfigurePanel repo={selectedRepo} onNext={handleConfigure} />
          )}
          {step === "ready" && selectedRepo && (
            <ReadyPanel
              repo={selectedRepo}
              mode={deployMode}
              branch={deployBranch}
            />
          )}
        </div>

        {/* Right — contextual preview */}
        <PreviewCard
          step={step}
          selected={selectedRepo}
          mode={deployMode}
          branch={deployBranch}
        />
      </div>
    </div>
  );
}

// ─── Small shared components ──────────────────────────────────────────────────

function GitHubMark({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn("fill-current", className)}
      style={style}
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-4 animate-spin"
      aria-hidden
    >
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
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
