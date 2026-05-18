import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

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
  | "log-out";

const pathMap: Record<IconName, ReactElement> = {
  folder: (
    <>
      <path
        d="M3.75 7.5A2.25 2.25 0 0 1 6 5.25h3.19c.6 0 1.17.24 1.59.66l1.12 1.12c.42.42.99.66 1.59.66H18A2.25 2.25 0 0 1 20.25 9.94v6.31A2.25 2.25 0 0 1 18 18.5H6a2.25 2.25 0 0 1-2.25-2.25V7.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </>
  ),
  rocket: (
    <>
      <path
        d="M12 2.5c0 0-4.5 3.5-4.5 8.5 0 1.5.5 3 1.5 4l1 1c1 1 2.5 1.5 4 1.5 5-1 8.5-4.5 8.5-4.5S21 8 18 5s-6-2.5-6-2.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M14.5 9.5h.01"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M7.5 13.5 4 17v3h3l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </>
  ),
  terminal: (
    <>
      <path
        d="M4.5 6.75h15A2.25 2.25 0 0 1 21.75 9v6A2.25 2.25 0 0 1 19.5 17.25h-15A2.25 2.25 0 0 1 2.25 15V9A2.25 2.25 0 0 1 4.5 6.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m7.5 10.5 2.25 1.5L7.5 13.5m4.5 0h3.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </>
  ),
  settings: (
    <>
      <path
        d="M12 8.25A3.75 3.75 0 1 0 12 15.75A3.75 3.75 0 1 0 12 8.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M19.14 12.94a1 1 0 0 0 0-1.88l-1.02-.37a6.95 6.95 0 0 0-.48-1.15l.47-.98a1 1 0 0 0-.23-1.14l-.74-.74a1 1 0 0 0-1.14-.23l-.98.47c-.37-.2-.76-.36-1.15-.48l-.37-1.02a1 1 0 0 0-1.88 0l-.37 1.02c-.39.12-.78.28-1.15.48l-.98-.47a1 1 0 0 0-1.14.23l-.74.74a1 1 0 0 0-.23 1.14l.47.98c-.2.37-.36.76-.48 1.15l-1.02.37a1 1 0 0 0 0 1.88l1.02.37c.12.39.28.78.48 1.15l-.47.98a1 1 0 0 0 .23 1.14l.74.74a1 1 0 0 0 1.14.23l.98-.47c.37.2.76.36 1.15.48l.37 1.02a1 1 0 0 0 1.88 0l.37-1.02c.39-.12.78-.28 1.15-.48l.98.47a1 1 0 0 0 1.14-.23l.74-.74a1 1 0 0 0 .23-1.14l-.47-.98c.2-.37.36-.76.48-1.15l1.02-.37Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </>
  ),
  notification: (
    <>
      <path
        d="M12 4.5A4.5 4.5 0 0 0 7.5 9v1.11c0 .6-.2 1.18-.57 1.65L5.25 13.88v1.62h13.5v-1.62l-1.68-2.12a2.64 2.64 0 0 1-.57-1.65V9A4.5 4.5 0 0 0 12 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M10.13 18a2.25 2.25 0 0 0 3.74 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </>
  ),
  help: (
    <>
      <path
        d="M12 19.5A7.5 7.5 0 1 0 12 4.5a7.5 7.5 0 0 0 0 15Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M9.75 9.75a2.25 2.25 0 0 1 4.5 0c0 1.5-2.25 1.87-2.25 3.75m0 2.25h.02"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </>
  ),
  sparkles: (
    <>
      <path
        d="m12 3 1.42 4.58L18 9l-4.58 1.42L12 15l-1.42-4.58L6 9l4.58-1.42L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="m18.75 15 .7 2.05 2.05.7-2.05.7-.7 2.05-.7-2.05-2.05-.7 2.05-.7.7-2.05ZM5.25 14.25l.93 2.57 2.57.93-2.57.93-.93 2.57-.93-2.57-2.57-.93 2.57-.93.93-2.57Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </>
  ),
  link: (
    <>
      <path
        d="M10.5 13.5 13.5 10.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <path
        d="M7.88 14.63 6.5 16a3 3 0 0 0 4.24 4.24l1.38-1.37m4-9.74L17.5 8a3 3 0 0 0-4.24-4.24L11.88 5.13"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </>
  ),
  shield: (
    <>
      <path
        d="M12 3.75 5.25 6v4.72c0 3.8 2.37 7.2 5.95 8.53L12 19.5l.8-.25c3.58-1.33 5.95-4.73 5.95-8.53V6L12 3.75Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="m9.75 11.75 1.5 1.5 3-3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </>
  ),
  history: (
    <>
      <path
        d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M12 8.25V12l2.25 1.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </>
  ),
  bell: (
    <>
      <path d="M12 4.5A4.5 4.5 0 0 0 7.5 9v1.11c0 .6-.2 1.18-.57 1.65L5.25 13.88v1.62h13.5v-1.62l-1.68-2.12a2.64 2.64 0 0 1-.57-1.65V9A4.5 4.5 0 0 0 12 4.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M10.13 18a2.25 2.25 0 0 0 3.74 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </>
  ),
  "chevron-right": (
    <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
  ),
  "chevron-down": (
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
  ),
  lock: (
    <>
      <rect x="5.25" y="10.25" width="13.5" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.25 10.25V7.5a3.75 3.75 0 0 1 7.5 0v2.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </>
  ),
  plus: (
    <path d="M12 5.25v13.5M5.25 12h13.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
  ),
  search: (
    <>
      <path d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4.25 4.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </>
  ),
  book: (
    <path d="M4.5 5.25A2.25 2.25 0 0 1 6.75 3h10.5v18H6.75a2.25 2.25 0 0 1-2.25-2.25V5.25Zm0 0v13.5m7.5-13.5v18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
  ),
  "message-square": (
    <path d="M4.5 5.25A2.25 2.25 0 0 1 6.75 3h10.5A2.25 2.25 0 0 1 19.5 5.25v9A2.25 2.25 0 0 1 17.25 16.5H8.25L4.5 20.25V5.25Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
  ),
  "log-out": (
    <>
      <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M18.75 12H9m9.75 0-3-3m3 3-3 3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </>
  ),
  memory: (
    <>
      <path
        d="M7.5 6.75h9A2.25 2.25 0 0 1 18.75 9v6a2.25 2.25 0 0 1-2.25 2.25h-9A2.25 2.25 0 0 1 5.25 15V9A2.25 2.25 0 0 1 7.5 6.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M9 9.75h6M9 12h6M9 14.25h3M3.75 9.75h1.5m0 4.5h-1.5m15 0h1.5m-1.5-4.5h1.5M9 4.5V6m6-1.5V6m-6 12v1.5m6-1.5v1.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </>
  ),
};

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-5 shrink-0", className)}
      fill="none"
    >
      {pathMap[name]}
    </svg>
  );
}
