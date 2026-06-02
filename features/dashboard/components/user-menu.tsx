"use client";

import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";

interface UserMenuProps {
  name: string | null | undefined;
  email: string;
  image: string | null | undefined;
  initials: string;
}

export function UserMenu({ name, email, image, initials }: UserMenuProps) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 transition-colors hover:bg-accent/50 outline-none">
        {image ? (
          <Avatar size="sm">
            <AvatarImage src={image} alt={name ?? email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        ) : (
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        )}

        <span className="max-w-30 truncate text-[13px] text-foreground">
          {name ?? email}
        </span>

        <span className="inline-flex text-muted-foreground">
          <Icon name="chevron-down" className="size-3.5" />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-sm font-semibold text-foreground">
            {name ?? email}
          </div>
          {name && (
            <div className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} className="gap-2.5">
          <Icon name="log-out" className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
