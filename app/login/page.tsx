import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/projects");
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* ── Left panel — branding ──────────────────────────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-[#0e1012] p-10 lg:flex">
        {/* Subtle grid */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[36px_36px]"
        />
        {/* Glow */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(62,165,132,0.14),transparent_55%)]"
        />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
            <Icon name="rocket" className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">
            Gori Lab
          </span>
        </Link>

        {/* Tagline */}
        <div className="relative z-10 space-y-3">
          <p className="text-2xl font-bold leading-snug text-white">
            Your deployment
            <br />
            control plane.
          </p>
          <p className="text-sm text-on-surface-variant">
            Connect GitHub, configure environments, and ship to Dokploy from one
            protected workspace.
          </p>
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────── */}
      <div className="flex flex-col items-center justify-center gap-6 bg-surface p-6 md:p-10">
        {/* Mobile logo */}
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium text-on-surface lg:hidden"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary/20">
            <Icon name="rocket" className="size-3.5 text-primary" />
          </div>
          Gori Lab
        </Link>

        <div className="w-full max-w-sm">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
