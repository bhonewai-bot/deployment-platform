import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Connect GitHub", step: "01" },
  { label: "Select repository", step: "02" },
  { label: "Configure environment", step: "03" },
  { label: "Deploy with Dokploy", step: "04" },
];

const meta = [
  ["Source", "GitHub"],
  ["Build", "Dockerfile · static"],
  ["Runtime", "Dokploy"],
  ["State", "PostgreSQL"],
];

const highlights = [
  {
    icon: "shield" as const,
    title: "Identity first",
    description:
      "Every project, environment, and deployment is owned by a verified user. Nothing is accessible without a session.",
  },
  {
    icon: "terminal" as const,
    title: "Explicit build contract",
    description:
      "Dockerfile and static sites are supported out of the box. No implicit framework detection in the critical path.",
  },
  {
    icon: "history" as const,
    title: "Full run history",
    description:
      "Each deployment records the branch, mode, Dokploy response, status, and public URL for auditing and debugging.",
  },
];

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/projects");
  }

  return (
    <main className="min-h-screen bg-[#101214] text-on-surface">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/10">
        {/* Grid texture */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[44px_44px] opacity-30"
        />
        {/* Radial glow */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(62,165,132,0.18),transparent_50%),linear-gradient(180deg,transparent,rgba(16,18,20,0.96)_80%)]"
        />

        {/* Nav */}
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
              <Icon name="rocket" className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">
              Gori Lab
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Create account
            </Link>
          </div>
        </nav>

        {/* Hero body */}
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:pb-28 lg:pt-24">
          {/* Left */}
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-md border border-white/10 bg-white/4 px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                GitHub → Dokploy control plane
              </span>
            </div>

            <h1 className="max-w-2xl text-[3.25rem] font-black leading-[0.96] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Deploy from GitHub.
              <br />
              <span className="text-primary">One control plane.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-on-surface-variant sm:text-lg">
              Connect your repository, set up environments and secrets, then
              send builds to Dokploy — all from a single protected workspace.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                <Icon name="rocket" className="size-4" />
                Start deploying
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-white/15 bg-white/3",
                )}
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Right — mock deployment card */}
          <div className="flex flex-col rounded-xl border border-white/10 bg-[#17191c]/90 p-5 shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Deployment run
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  api-service · production
                </p>
              </div>
              <span className="rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                Running
              </span>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-2">
              {meta.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-md border border-white/10 bg-white/3 p-3"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {label}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Log output */}
            <div className="mt-3 rounded-md border border-white/10 bg-[#0d0f11] p-3.5 font-mono text-xs leading-[1.7] text-on-surface-variant">
              <p className="text-primary">$ dokploy deploy api-service</p>
              <p>validating session and project ownership</p>
              <p>resolving environment variables</p>
              <p>building from Dockerfile</p>
              <p className="text-white">deployment accepted · run #42</p>
            </div>

            {/* Steps */}
            <div className="mt-3 grid gap-1.5">
              {steps.map(({ label, step }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-md border border-white/10 bg-white/2.5 px-3 py-2"
                >
                  <span className="text-sm text-white">{label}</span>
                  <span className="font-mono text-xs text-on-surface-variant">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────── */}
      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-14 lg:grid-cols-3 lg:px-8">
        {highlights.map((h) => (
          <article
            key={h.title}
            className="rounded-xl border border-white/10 bg-surface-container-low p-6"
          >
            <div className="mb-5 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon name={h.icon} className="size-5" />
            </div>
            <h2 className="text-base font-semibold text-white">{h.title}</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {h.description}
            </p>
          </article>
        ))}
      </section>

      {/* ── Footer strip ──────────────────────────────────────── */}
      <footer className="border-t border-white/10 px-6 py-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-on-surface-variant">
          <span>Gori Lab</span>
        </div>
      </footer>
    </main>
  );
}
