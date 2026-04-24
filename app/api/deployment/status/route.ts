import { NextResponse } from "next/server";
import { dokployGet } from "@/lib/dokploy";

type LogLevel = "info" | "success" | "debug" | "error";
type DeploymentStatus = "idle" | "building" | "done" | "error";

type DeploymentLogLine = {
  id: string;
  time: string;
  level: LogLevel;
  message: string;
};
function extractDeploymentStatus(application: unknown): DeploymentStatus {
  if (!application || typeof application !== "object") {
    return "building";
  }

  const record = application as Record<string, unknown>;
  const deployments = Array.isArray(record.deployments)
    ? (record.deployments as Array<Record<string, unknown>>)
    : [];

  const latestDeployment = deployments[0];

  if (latestDeployment) {
    const status =
      typeof latestDeployment.status === "string"
        ? latestDeployment.status.toLowerCase()
        : "";

    const errorMessage =
      typeof latestDeployment.errorMessage === "string"
        ? latestDeployment.errorMessage
        : null;

    const finishedAt =
      typeof latestDeployment.finishedAt === "string"
        ? latestDeployment.finishedAt
        : null;

    if (
      errorMessage ||
      ["failed", "error", "killed", "cancelled"].includes(status)
    ) {
      return "error";
    }

    if (["running", "queued", "pending", "processing"].includes(status)) {
      return "building";
    }

    if (finishedAt || ["done", "success", "completed"].includes(status)) {
      return "done";
    }
  }

  const applicationStatus =
    typeof record.applicationStatus === "string"
      ? record.applicationStatus.toLowerCase()
      : "";

  if (applicationStatus === "error") {
    return "error";
  }

  if (applicationStatus === "running") {
    return "building";
  }

  if (applicationStatus === "idle") {
    return "idle";
  }

  return "building";
}

function extractRawLogs(payload: unknown): string[] {
  if (!payload) {
    return [];
  }

  if (typeof payload === "string") {
    return payload
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (Array.isArray(payload)) {
    return payload.flatMap((item) => extractRawLogs(item));
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    const directKeys = [
      "logs",
      "log",
      "message",
      "messages",
      "content",
      "lines",
    ];

    for (const key of directKeys) {
      if (key in record) {
        const extracted = extractRawLogs(record[key]);

        if (extracted.length > 0) {
          return extracted;
        }
      }
    }

    for (const value of Object.values(record)) {
      const extracted = extractRawLogs(value);

      if (extracted.length > 0) {
        return extracted;
      }
    }
  }

  return [];
}

function toLogLevel(message: string): LogLevel {
  const lower = message.toLowerCase();

  if (
    lower.includes("error") ||
    lower.includes("failed") ||
    lower.includes("panic")
  ) {
    return "error";
  }

  if (
    lower.includes("success") ||
    lower.includes("completed") ||
    lower.includes("done")
  ) {
    return "success";
  }

  if (
    lower.includes("debug") ||
    lower.includes("[internal]") ||
    lower.includes("transferring")
  ) {
    return "debug";
  }

  return "info";
}

function normalizeLogs(messages: string[]): DeploymentLogLine[] {
  return messages.map((message, index) => ({
    id: `${index}-${message}`,
    time: new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    level: toLogLevel(message),
    message,
  }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId is required." },
        { status: 400 },
      );
    }

    const application = await dokployGet("application.one", { applicationId });

    let logsResponse: unknown = null;

    try {
      logsResponse = await dokployGet("application.readLogs", {
        applicationId,
        tail: 200,
        since: "10m",
      });
    } catch {
      logsResponse = null;
    }

    const status = extractDeploymentStatus(application);
    const logs = normalizeLogs(extractRawLogs(logsResponse));

    return NextResponse.json({
      application,
      status,
      logs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load deployment status.",
      },
      { status: 400 },
    );
  }
}
