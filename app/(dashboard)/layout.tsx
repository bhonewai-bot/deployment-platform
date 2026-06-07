import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Sidebar } from "@/features/dashboard/components/sidebar";
import { Navbar } from "@/features/dashboard/components/navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Sidebar skeleton fallback while Sidebar streams in
function SidebarSkeleton() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card p-4 gap-2">
      <div className="flex items-center gap-3 px-2 mb-6 mt-1">
        <div className="size-8 animate-pulse rounded bg-muted" />
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex flex-col gap-2 px-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-full animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </aside>
  );
}

// Navbar skeleton fallback while session streams in
function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background/85 px-8 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground" />
      <div className="flex items-center gap-3">
        <div className="size-8 animate-pulse rounded-full bg-muted" />
      </div>
    </header>
  );
}

// Session check and Navbar — streams at request time inside Suspense
async function DashboardHeader({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <Navbar session={session} />
      <main className="flex-1 p-8">{children}</main>
    </>
  );
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>

      <div className="ml-64 flex flex-1 flex-col min-w-0">
        <Suspense fallback={<NavbarSkeleton />}>
          <DashboardHeader>{children}</DashboardHeader>
        </Suspense>
      </div>
    </div>
  );
}
