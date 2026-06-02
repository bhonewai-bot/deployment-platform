"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const mainNav = [
  { label: "Projects", icon: "folder" as const, href: "/projects" },
  { label: "Deployments", icon: "history" as const, href: "/deployments" },
  { label: "Environments", icon: "settings" as const, href: "/environments" },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/projects"
      ? pathname === "/projects"
      : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card p-4 gap-2">
      {/* Logo / workspace header */}
      <div className="flex items-center gap-3 px-2 mb-6 mt-1">
        <div className="flex size-8 shrink-0 items-center justify-center rounded font-bold text-sm bg-primary text-primary-foreground">
          A
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-none text-foreground">
            Gori Lab
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
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
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon name={item.icon} className="size-4.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Separator />
    </aside>
  );
}
