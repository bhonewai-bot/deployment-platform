import type { Session } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import { UserMenu } from "./user-menu";

interface NavbarProps {
  session: Session;
  /** Optional breadcrumb segments rendered left of the header. */
  breadcrumbs?: { label: string; href?: string }[];
}

export function Navbar({ session }: NavbarProps) {
  const { user } = session;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background/85 px-8 backdrop-blur-md">
      {/* Left — breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground" />

      {/* Right — actions + identity */}
      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="rounded-md p-1.5 transition-colors hover:bg-accent/50 text-muted-foreground"
        >
          <Icon name="bell" className="size-4.5" />
        </button>

        <button
          aria-label="Help"
          className="rounded-md p-1.5 transition-colors hover:bg-accent/50 text-muted-foreground"
        >
          <Icon name="help" className="size-4.5" />
        </button>

        <UserMenu
          name={user.name}
          email={user.email}
          image={user.image}
          initials={initials}
        />
      </div>
    </header>
  );
}
