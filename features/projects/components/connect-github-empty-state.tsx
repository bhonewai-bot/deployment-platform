import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function ConnectGitHubEmptyState() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Projects
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect GitHub to import your first repository.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xs">
          <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
            <GitHubMark className="size-6" />
          </div>

          <h2 className="mt-8 text-2xl font-bold tracking-tight text-foreground">
            Import from GitHub
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Install the GitHub App, choose the repositories this platform can
            access, then import one project at a time. GitHub is a source
            connection, so it works even when you log in with email or Google.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Install app", "Choose account or organization."],
              ["2", "Select repos", "Grant all repos or only selected repos."],
              ["3", "Import project", "Pick branch and deployment settings."],
            ].map(([number, title, body]) => (
              <div key={number} className="rounded-xl border border-border p-4">
                <div className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                  {number}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/api/github/install"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              <GitHubMark className="size-4" />
              Connect GitHub
            </Link>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="shield" className="size-3.5" />
              Repository access is controlled by GitHub installation settings.
            </span>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            After connection
          </p>
          <div className="mt-5 space-y-4">
            {[
              ["Repository list", "Search repositories available to the app."],
              ["Dockerfile deploy", "Set Dockerfile path and container port."],
              ["Static deploy", "Set publish directory with index.html."],
              ["Dokploy ready", "Create project, then trigger deployment."],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3">
                <Icon
                  name="chevron-right"
                  className="mt-0.5 size-4 text-muted-foreground"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn("fill-current", className)}
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
