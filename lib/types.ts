export type EnvVar = {
  id: number;
  key: string;
  value: string;
  secret?: boolean;
};

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
  | "memory";
