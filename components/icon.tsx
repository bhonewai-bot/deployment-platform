import type { ReactElement } from "react";

import type { IconName } from "@/lib/types";
import { cn } from "@/lib/utils";

const pathMap: Record<IconName, ReactElement> = {
  folder: (
    <path
      d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h3.19a2.25 2.25 0 0 1 1.59.66l.56.56c.42.42.99.66 1.59.66H18A2.25 2.25 0 0 1 20.25 9v7.5A2.25 2.25 0 0 1 18 18.75H6A2.25 2.25 0 0 1 3.75 16.5V6.75Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  ),
  rocket: (
    <>
      <path
        d="M14.4 4.8c2.66-.54 4.74.34 5.4 1-.66.66-1.54 2.74-1 5.4L12 18l-3.6.6.6-3.6 6.6-6.8Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M8.4 15.6 5.4 18.6M8.4 8.4 5.4 5.4m0 0c2.4-.6 3.6.6 4.2 1.2m-4.2-1.2L4.2 9.6"
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
        d="M12 8.25A3.75 3.75 0 1 1 12 15.75 3.75 3.75 0 0 1 12 8.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m19.5 12-1.55.51a6.13 6.13 0 0 1-.55 1.32l.72 1.46-1.59 1.59-1.46-.72c-.42.23-.86.41-1.32.55L12 19.5l-1.51-.49a6.13 6.13 0 0 1-1.32-.55l-1.46.72-1.59-1.59.72-1.46a6.13 6.13 0 0 1-.55-1.32L4.5 12l.49-1.51c.14-.46.32-.9.55-1.32l-.72-1.46 1.59-1.59 1.46.72c.42-.23.86-.41 1.32-.55L12 4.5l1.51.49c.46.14.9.32 1.32.55l1.46-.72 1.59 1.59-.72 1.46c.23.42.41.86.55 1.32L19.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
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
    <path
      d="M12 3.75c2.07 1.63 4.41 2.52 6.75 2.7v4.36c0 4.44-2.85 7.73-6.75 9.44-3.9-1.71-6.75-5-6.75-9.44V6.45c2.34-.18 4.68-1.07 6.75-2.7Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  ),
  history: (
    <>
      <path
        d="M12 6.75A5.25 5.25 0 1 1 6.75 12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M6.75 4.5V9H11.25M12 9v3l2.25 1.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </>
  ),
  memory: (
    <>
      <path
        d="M7.5 7.5h9v9h-9Zm-3 3h3m9 0h3m-15 3h3m9 0h3M9 4.5v3m6-3v3m-6 9v3m6-3v3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
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
