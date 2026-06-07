import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import DotField from "@/components/reactbits/DotField";

const features = [
  {
    icon: "sparkles" as const,
    title: "Build Automation",
    description:
      "Auto-detect Dockerfiles, configure static sites, and ship through Dokploy without manual setup.",
  },
  {
    icon: "lock" as const,
    title: "Auto SSL/TLS",
    description:
      "Automatic certificate provisioning and renewal for every deployed environment.",
  },
  {
    icon: "history" as const,
    title: "Monitoring & Logging",
    description:
      "Real-time deployment logs, status tracking, and full audit history for every run.",
  },
  {
    icon: "link" as const,
    title: "Custom Domains & Routing",
    description:
      "Map custom domains to any environment with flexible routing rules.",
  },
];

const steps = [
  { label: "Connect GitHub", icon: "folder" as const },
  { label: "Configure project", icon: "settings" as const },
  { label: "Set secrets", icon: "lock" as const },
  { label: "Deploy", icon: "rocket" as const },
];

// Session check — runs at request time inside Suspense boundary
async function SessionRedirect() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/projects");
  }

  return null;
}

export default function LandingPage() {
  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <Suspense fallback={null}>
        <SessionRedirect />
      </Suspense>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <Suspense fallback={null}>
      <section className="relative overflow-hidden border-border"> {/* DotField is client-side, wrapped below */}
        {/* Dot Field Background */}
        <div aria-hidden className="absolute inset-0">
          <DotField
            dotRadius={2}
            dotSpacing={22}
            bulgeStrength={67}
            glowRadius={240}
            sparkle={false}
            waveAmplitude={0}
            cursorRadius={200}
          />
          {/* Overlay gradient to blend into the page content */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
              <Icon name="rocket" className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Deplus
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
              Sign up
            </Link>
          </div>
        </nav>

        {/* Hero body — centered */}
        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28 pt-14 text-center lg:px-8 lg:pb-36 lg:pt-24">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center justify-center">
            <Badge
              variant="outline"
              className="gap-2 border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary"
            >
              <span className="size-1.5 rounded-full bg-primary" />
              GitHub → Dokploy control plane
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-[3.25rem] font-black leading-[0.96] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Deploy from GitHub.
            <br />
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Ship to Dokploy in minutes.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Connect your repository, configure environments and secrets, then
            deploy with automatic SSL, monitoring, and custom domains &mdash;
            all from a single protected workspace.
          </p>

          {/* CTA */}
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                <Icon name="rocket" className="size-4" />
                Start deploying
              </Button>
            </Link>
          </div>
        </section>
      </section>
      </Suspense>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Everything you need to ship
          </h2>
          <p className="mt-3 text-muted-foreground">
            From repository connection to production deployment.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title} size="sm">
              <CardHeader>
                <div className="mb-1 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon name={f.icon} className="size-5" />
                </div>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30 px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Four steps from repo to running application.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={s.label}
                className="relative flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center"
              >
                <span className="mb-3 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon name={s.icon} className="size-5" />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {s.label}
                </span>
                {/* Step number */}
                <span className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                {/* Connector arrow on desktop */}
                {i < steps.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-muted-foreground/30 sm:block"
                  >
                    <Icon name="chevron-right" className="size-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border px-6 py-20 lg:px-8 lg:py-28">
        {/* Purple glow */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,oklch(0.56_0.23_265/0.08),transparent_60%)]"
        />

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to ship?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Connect your first repository and deploy in minutes. No credit card
            required.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                <Icon name="rocket" className="size-4" />
                Start deploying
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded border border-primary/20 bg-primary/5 text-primary">
              <Icon name="rocket" className="size-3" />
            </span>
            Deplus
          </span>
          <span>&copy; 2026 Deplus</span>
        </div>
      </footer>
    </main>
  );
}
