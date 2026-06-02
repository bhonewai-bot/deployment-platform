"use client";

import { cn } from "@/lib/utils";
import {
  BellIcon,
  BookOpenIcon,
  CaretDownIcon,
  CaretRightIcon,
  ChatIcon,
  ClockClockwiseIcon,
  CpuIcon,
  FolderIcon,
  GearIcon,
  GithubLogoIcon,
  LinkIcon,
  LockIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  QuestionIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SparkleIcon,
  TerminalIcon,
} from "@phosphor-icons/react";

export type IconName =
  | "folder"
  | "rocket"
  | "terminal"
  | "settings"
  | "notification"
  | "help"
  | "sparkles"
  | "link"
  | "shield"
  | "history"
  | "memory"
  | "bell"
  | "chevron-right"
  | "chevron-down"
  | "lock"
  | "plus"
  | "search"
  | "book"
  | "message-square"
  | "log-out"
  | "github";

const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  folder: FolderIcon,
  rocket: RocketLaunchIcon,
  terminal: TerminalIcon,
  settings: GearIcon,
  notification: BellIcon,
  help: QuestionIcon,
  sparkles: SparkleIcon,
  link: LinkIcon,
  shield: ShieldCheckIcon,
  history: ClockClockwiseIcon,
  memory: CpuIcon,
  bell: BellIcon,
  "chevron-right": CaretRightIcon,
  "chevron-down": CaretDownIcon,
  lock: LockIcon,
  plus: PlusIcon,
  search: MagnifyingGlassIcon,
  book: BookOpenIcon,
  "message-square": ChatIcon,
  "log-out": SignOutIcon,
  github: GithubLogoIcon,
};

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const PhosphorIcon = iconMap[name];
  return <PhosphorIcon className={cn("size-5 shrink-0", className)} aria-hidden />;
}
