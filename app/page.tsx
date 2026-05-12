import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-surface text-on-surface">
      {/* Background glow accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 -top-40 h-150 w-150 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute -right-40 bottom-0 h-125 w-125 rounded-full bg-primary/8 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between border-b border-outline-variant/20 px-6 py-4 lg:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/20">
            <Icon name="rocket" className="size-4 text-primary" />
          </div>
          <span className="font-semibold tracking-tight text-on-surface">
            Monolithic Void
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Login
          </Link>
          <Link href="/sign-up" className={cn(buttonVariants({ size: "sm" }))}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center lg:py-36">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low px-3.5 py-1.5">
          <Icon name="sparkles" className="size-3.5 text-primary" />
          <span className="font-mono text-xs tracking-wide text-on-surface-variant">
            GitHub → Dokploy — simplified
          </span>
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-tight text-on-surface lg:text-6xl">
          Deploy your repos.{" "}
          <span className="text-primary">Without the ceremony.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-on-surface-variant">
          Connect GitHub, select a repository, configure your environment, and
          ship — all from one control plane backed by Dokploy.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            <Icon name="rocket" className="size-4" />
            Start deploying
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative z-10 border-t border-outline-variant/20 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="mb-10 text-center font-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant">
            Everything you need to ship
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-6 transition-colors hover:border-outline-variant/30 hover:bg-surface-container"
              >
                <div className="mb-4 inline-flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon name={feature.icon} className="size-4 text-primary" />
                </div>
                <h3 className="mb-1.5 font-semibold text-on-surface">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="relative z-10 border-t border-outline-variant/20 px-6 py-16 text-center lg:px-10">
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-on-surface">
          Ready to ship your first project?
        </h2>
        <p className="mb-8 text-on-surface-variant">
          Create a free account and deploy in minutes.
        </p>
        <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }))}>
          Create an account
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-outline-variant/15 px-6 py-6 lg:px-10">
        <p className="text-center text-xs text-on-surface-variant/60">
          © {new Date().getFullYear()} Monolithic Void. Powered by Dokploy.
        </p>
      </footer>
    </main>
  );
}

const features: {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Icon>["name"];
}[] = [
  {
    icon: "link",
    title: "GitHub integration",
    description:
      "Connect your GitHub account and select from your authorized repositories. No manual URL pasting required.",
  },
  {
    icon: "terminal",
    title: "Dockerfile & static deploys",
    description:
      "Deploy containerized apps with a Dockerfile or static sites with a publish directory — your choice.",
  },
  {
    icon: "folder",
    title: "Monorepo support",
    description:
      "Set a root directory per project so monorepos deploy the right service every time.",
  },
  {
    icon: "shield",
    title: "Secrets management",
    description:
      "Store environment variables securely. Secrets are encrypted and never returned to the browser.",
  },
  {
    icon: "history",
    title: "Deployment history",
    description:
      "Every deploy run is recorded — who triggered it, which branch, the status, and the public URL.",
  },
  {
    icon: "sparkles",
    title: "Multiple environments",
    description:
      "Create production, staging, and preview environments for each project with isolated settings.",
  },
];
