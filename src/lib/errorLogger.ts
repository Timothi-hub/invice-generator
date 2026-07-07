// Simple client-side error logger.
// Captures runtime errors, unhandled promise rejections, and console.error calls.
// Stores them in localStorage and exposes helpers to view / download / clear the log.

const STORAGE_KEY = "app_error_log";
const MAX_ENTRIES = 200;

// Lazy import to avoid circular init issues
async function pushToServer(entry: ErrorLogEntry) {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("error_logs").insert({
      user_id: user.id,
      type: entry.type,
      message: entry.message?.slice(0, 4000) ?? "",
      stack: entry.stack?.slice(0, 8000),
      source: entry.source,
      url: entry.url,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    /* swallow */
  }
}

export type ErrorLogEntry = {
  timestamp: string;
  type: "error" | "unhandledrejection" | "console.error" | "manual";
  message: string;
  stack?: string;
  source?: string;
  url?: string;
};

function read(): ErrorLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ErrorLogEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: ErrorLogEntry[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries.slice(-MAX_ENTRIES))
    );
  } catch {
    /* ignore quota errors */
  }
}

export function logError(entry: Omit<ErrorLogEntry, "timestamp" | "url"> & { url?: string }) {
  const full: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    ...entry,
  };
  const entries = read();
  entries.push(full);
  write(entries);
  void pushToServer(full);
}

export function getErrorLog(): ErrorLogEntry[] {
  return read();
}

export function clearErrorLog() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function downloadErrorLog(filename = `error-log-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`) {
  const entries = read();
  const text = entries
    .map(
      (e) =>
        `[${e.timestamp}] (${e.type}) ${e.message}\n` +
        (e.source ? `  source: ${e.source}\n` : "") +
        (e.url ? `  url: ${e.url}\n` : "") +
        (e.stack ? `  stack: ${e.stack}\n` : "")
    )
    .join("\n");
  const blob = new Blob([text || "No errors logged."], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let installed = false;
export function installGlobalErrorLogger() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    logError({
      type: "error",
      message: event.message || String(event.error),
      stack: event.error?.stack,
      source: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason: any = event.reason;
    logError({
      type: "unhandledrejection",
      message: reason?.message ? String(reason.message) : String(reason),
      stack: reason?.stack,
    });
  });

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      logError({
        type: "console.error",
        message: args
          .map((a) => (a instanceof Error ? a.message : typeof a === "string" ? a : JSON.stringify(a)))
          .join(" "),
        stack: args.find((a) => a instanceof Error) instanceof Error ? (args.find((a) => a instanceof Error) as Error).stack : undefined,
      });
    } catch {
      /* ignore */
    }
    originalConsoleError(...args);
  };

  // Expose helpers on window for quick manual access from devtools.
  (window as any).__errorLog = {
    get: getErrorLog,
    clear: clearErrorLog,
    download: downloadErrorLog,
  };
}