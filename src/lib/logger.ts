type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: { name: string; message: string; stack?: string };
}

const isProd = process.env.NODE_ENV === "production";

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
  };

  if (isProd) {
    if (level === "error") {
      console.error(formatLog(entry));
    } else if (level === "warn") {
      console.warn(formatLog(entry));
    } else {
      console.log(formatLog(entry));
    }
  } else {
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
    if (level === "error") {
      console.error(prefix, message, context ?? "");
    } else if (level === "warn") {
      console.warn(prefix, message, context ?? "");
    } else {
      console.log(prefix, message, context ?? "");
    }
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const errorInfo = error instanceof Error
      ? { name: error.name, message: error.message, stack: isProd ? undefined : error.stack }
      : { name: "Unknown", message: String(error ?? "No error details") };
    log("error", message, { ...context, error: errorInfo });
  },
};
