import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Sidebar } from "@/features/dashboard/components/sidebar";
import { Navbar } from "@/features/dashboard/components/navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return (
    <div
      className="dashboard-light flex min-h-screen"
      style={{ background: "var(--dash-bg)" }}
    >
      <Sidebar />

      <div className="ml-64 flex flex-1 flex-col min-w-0">
        <Navbar session={session} />

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
