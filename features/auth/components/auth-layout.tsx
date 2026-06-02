import Link from "next/link";

import { Icon } from "@/components/ui/icon";

interface AuthLayoutProps {
  children: React.ReactNode;
  tagline: string;
  description: string;
}

export function AuthLayout({
  children,
  tagline,
  description,
}: AuthLayoutProps) {
  return (
    <div className="dark min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh lg:grid-cols-2">
        {/* Left — branding panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-muted p-10 lg:flex">
          {/* Purple glow */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,oklch(0.56_0.23_265/0.12),transparent_60%),radial-gradient(ellipse_at_70%_80%,oklch(0.56_0.23_265/0.06),transparent_50%)]"
          />

          <Link href="/" className="relative z-10 flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
              <Icon name="rocket" className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Deplus
            </span>
          </Link>

          <div className="relative z-10 max-w-sm space-y-3">
            <p className="text-2xl font-bold leading-snug text-foreground">
              {tagline}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          {/* Bottom brand mark */}
          <p className="relative z-10 text-xs text-muted-foreground">
            &copy; 2026 Deplus
          </p>
        </div>

        {/* Right — form */}
        <div className="flex flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
          <Link
            href="/"
            className="flex items-center gap-2 self-center font-medium text-foreground lg:hidden"
          >
            <div className="flex size-6 items-center justify-center rounded-md bg-primary/20">
              <Icon name="rocket" className="size-3.5 text-primary" />
            </div>
            Deplus
          </Link>

          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
