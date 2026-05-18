"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const mainNav = [
  { label: "Projects", icon: "folder" as const, href: "/projects" },
  { label: "Deployments", icon: "history" as const, href: "/deployments" },
  { label: "Environments", icon: "settings" as const, href: "/environments" },
];

/* const footerNav = [
  { label: "Documentation", icon: "book" as const, href: "/docs" },
  { label: "Feedback", icon: "message-square" as const, href: "/feedback" },
]; */

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/projects"
      ? pathname === "/projects"
      : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r p-4 gap-2"
      style={{
        background: "var(--dash-sidebar-bg)",
        borderColor: "var(--dash-sidebar-border)",
      }}
    >
      {/* Logo / workspace header */}
      <div className="flex items-center gap-3 px-2 mb-6 mt-1">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded font-bold text-sm"
          style={{
            background: "var(--dash-logo-bg)",
            color: "var(--dash-logo-fg)",
          }}
        >
          A
        </div>
        <div className="min-w-0">
          <p
            className="truncate text-sm font-bold leading-none"
            style={{ color: "var(--dash-accent)" }}
          >
            Gori Lab
          </p>
          <p
            className="mt-0.5 truncate text-[11px]"
            style={{ color: "var(--dash-accent-dim)" }}
          >
            Production Cluster
          </p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col gap-0.5">
        {mainNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                active ? "font-medium" : "hover:bg-(--dash-nav-hover-bg)",
              )}
              style={{
                background: active ? "var(--dash-nav-active-bg)" : undefined,
                color: active
                  ? "var(--dash-nav-fg-active)"
                  : "var(--dash-nav-fg)",
              }}
            >
              <Icon name={item.icon} className="size-4.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider + footer nav */}
      {/* <div
        className="mt-1 border-t pt-2 flex flex-col gap-0.5"
        style={{ borderColor: "var(--dash-divider)" }}
      >
        {footerNav.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 hover:bg-(--dash-nav-hover-bg)"
            style={{ color: "var(--dash-nav-fg)" }}
          >
            <Icon name={item.icon} className="size-4.5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div> */}
    </aside>
  );
}
