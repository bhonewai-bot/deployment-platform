import type { IconName } from "@/lib/types";

export const navigationItems: Array<{
  label: string;
  icon: IconName;
  href: string;
}> = [
  { label: "Projects", icon: "folder", href: "/projects" },
  { label: "Deploy", icon: "rocket", href: "/deployments" },
];
