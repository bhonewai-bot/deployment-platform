type LogLevel = "info" | "success" | "error" | "debug";

export type DeploymentLogLine = {
  id: string;
  time: string;
  level: LogLevel;
  message: string;
};

function levelClassName(level: LogLevel) {
  switch (level) {
    case "success":
      return "text-teal-300";
    case "error":
      return "text-rose-300";
    case "debug":
      return "text-amber-300";
    default:
      return "text-primary-container";
  }
}

function levelLabel(level: LogLevel) {
  switch (level) {
    case "success":
      return "[SUCCESS]";
    case "error":
      return "[ERROR]";
    case "debug":
      return "[DEBUG]";
    default:
      return "[INFO]";
  }
}

type DeployLogProps = {
  logs: DeploymentLogLine[];
  loading?: boolean;
};

export function DeployLog({ logs, loading }: DeployLogProps) {
  return (
    <div className="rounded-2xl overflow-hidden border border-outline-variant/10 bg-surface-container-lowest shadow-inner">
      <div className="flex items-center justify-between bg-surface-container-high px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg text-on-surface-variant">{"</>"}</span>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Live Deployment Logs
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full border border-error/40 bg-error/20" />
            <div className="h-3 w-3 rounded-full border border-primary/40 bg-primary/20" />
            <div className="h-3 w-3 rounded-full border border-on-surface-variant/40 bg-on-surface-variant/20" />
          </div>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto p-6 font-mono text-sm leading-relaxed">
        {logs.length === 0 ? (
          <div className="text-on-surface-variant/70">
            No deployment logs yet.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => {
              const isLastPending = loading && index === logs.length - 1;

              return (
                <div
                  key={log.id}
                  className={`flex gap-4 ${isLastPending ? "animate-pulse" : ""}`}
                >
                  <span className="w-20 shrink-0 text-right text-on-surface-variant">
                    {log.time}
                  </span>
                  <span className={levelClassName(log.level)}>
                    {levelLabel(log.level)}
                  </span>
                  <span className="text-on-surface">{log.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
