"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/config/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-full w-64 flex-col border-r border-white/5 bg-[#1c1b1d] p-4 text-sm font-medium tracking-tight">
      <div className="mb-10 px-2 pt-2">
        <h1 className="mb-0 text-lg font-black uppercase tracking-tighter text-white">
          Gori Lab
        </h1>
        <p className="-mt-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Deployment Engine
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 active:scale-95",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
