import Link from "next/link";

import { Icon } from "@/app/styles/icon";
import { navigationItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-full w-64 flex-col border-r border-white/5 bg-[#1c1b1d] p-4 text-sm font-medium tracking-tight">
      <div className="mb-10 px-2 pt-2">
        <h1 className="mb-0 text-lg font-black uppercase tracking-tighter text-white">
          Monolithic Void
        </h1>
        <p className="-mt-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Deployment Engine
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navigationItems.map((item) => {
          const content = (
            <>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </>
          );

          const className = cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 active:scale-95",
            item.active
              ? "bg-white/10 text-white"
              : "text-zinc-400 hover:bg-white/5 hover:text-white",
          );

          if (item.label === "Deployments") {
            return (
              <Link key={item.label} href="/deployment" className={className}>
                {content}
              </Link>
            );
          }

          return (
            <div key={item.label} className={className} aria-disabled="true">
              {content}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
