import type { IconName } from "@/lib/types";

export const navigationItems: Array<{
  label: string;
  icon: IconName;
  href?: string;
  active?: boolean;
}> = [
  { label: "Deployments", icon: "link", href: "/deployments", active: true },
];
