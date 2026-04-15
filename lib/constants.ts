import type { IconName } from "@/lib/types";

export const branches = ["main", "production", "staging", "develop"] as const;

export const environments = [
  { label: "Production", active: true },
  { label: "Staging", active: false },
] as const;

export const navigationItems: Array<{
  label: string;
  icon: IconName;
  active?: boolean;
}> = [
  { label: "Projects", icon: "folder" },
  { label: "Deployments", icon: "rocket", active: true },
  { label: "Logs", icon: "terminal" },
];
