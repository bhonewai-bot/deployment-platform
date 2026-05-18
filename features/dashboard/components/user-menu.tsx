"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";
import { Icon } from "@/components/ui/icon";

interface UserMenuProps {
  name: string | null | undefined;
  email: string;
  image: string | null | undefined;
  initials: string;
}

export function UserMenu({ name, email, image, initials }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/login");
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Chip trigger */}
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors hover:bg-(--dash-nav-hover-bg)"
        style={{
          borderColor: "var(--dash-divider)",
          background: open
            ? "var(--dash-nav-hover-bg)"
            : "var(--dash-sidebar-bg)",
        }}
      >
        {image ? (
          <img
            src={image}
            alt={name ?? email}
            className="size-6 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex size-6 items-center justify-center rounded-full text-[11px] font-bold"
            style={{
              background: "var(--dash-nav-active-bg)",
              color: "var(--dash-accent)",
            }}
          >
            {initials}
          </span>
        )}

        <span
          className="max-w-30 truncate text-[13px]"
          style={{ color: "var(--dash-accent)" }}
        >
          {name ?? email}
        </span>

        <span
          className="transition-transform duration-200"
          style={{
            color: "var(--dash-accent-dim)",
            display: "inline-flex",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <Icon name="chevron-down" className="size-3.5" />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border py-1"
          style={{
            background: "var(--dash-sidebar-bg)",
            borderColor: "var(--dash-divider)",
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {/* Identity block */}
          <div
            className="px-3.5 py-2.5"
            style={{ borderBottom: "1px solid var(--dash-divider)" }}
          >
            <p
              className="truncate text-[13px] font-semibold"
              style={{ color: "var(--dash-accent)" }}
            >
              {name ?? email}
            </p>
            {name && (
              <p
                className="truncate text-[12px]"
                style={{ color: "var(--dash-accent-dim)" }}
              >
                {email}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              role="menuitem"
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors hover:bg-(--dash-nav-hover-bg) disabled:opacity-60"
              style={{ color: "var(--dash-nav-fg)" }}
            >
              <Icon name="log-out" className="size-4" />
              {signingOut ? "Signing out\u2026" : "Log out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
