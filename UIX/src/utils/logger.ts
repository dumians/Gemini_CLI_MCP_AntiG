import { getBaseUrl } from "./env";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface ClientLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  type: string;
  agent: string;
  domain: string;
  message: string;
  meta?: any;
  traceId?: string;
  source: "client" | "backend";
}

type LogListener = (entry: ClientLogEntry) => void;

class ClientLogger {
  private buffer: ClientLogEntry[] = [];
  private maxBufferSize = 250;
  private listeners: Set<LogListener> = new Set();
  private flushQueue: Array<{
    level: LogLevel;
    message: string;
    meta?: any;
    traceId?: string;
    type?: string;
  }> = [];
  private flushTimer: any = null;
  private isFlushing = false;
  private isInitialized = false;

  constructor() {
    // Generate session prefix
    this.sessionPrefix = "uix-" + Date.now().toString(36);
  }

  private sessionPrefix: string;

  /**
   * Subscribe to client-side log events in real time.
   */
  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Core logging method.
   */
  public log(
    level: LogLevel,
    message: string,
    meta?: any,
    traceId?: string,
    type: string = "CLIENT_EVENT"
  ) {
    const entry: ClientLogEntry = {
      id: `${this.sessionPrefix}-${this.buffer.length + 1}`,
      timestamp: new Date().toISOString(),
      level,
      type,
      agent: "UIX-Client",
      domain: "Frontend UIX",
      message: typeof message === "string" ? message : JSON.stringify(message),
      meta: meta || null,
      traceId: traceId || undefined,
      source: "client"
    };

    // Buffer locally
    this.buffer.unshift(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.pop();
    }

    // Notify UI listeners
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (err) {
        console.error("Error in client logger listener:", err);
      }
    }

    // Mirror to browser console
    const prefix = `[UIX ${level}]`;
    if (level === "ERROR") {
      console.error(prefix, message, meta || "");
    } else if (level === "WARN") {
      console.warn(prefix, message, meta || "");
    } else if (level === "DEBUG") {
      console.debug(prefix, message, meta || "");
    } else {
      console.log(prefix, message, meta || "");
    }

    // Queue for backend forwarding
    this.queueForward({
      level,
      message,
      meta,
      traceId,
      type
    });
  }

  public debug(message: string, meta?: any, traceId?: string) {
    this.log("DEBUG", message, meta, traceId);
  }

  public info(message: string, meta?: any, traceId?: string) {
    this.log("INFO", message, meta, traceId);
  }

  public warn(message: string, meta?: any, traceId?: string) {
    this.log("WARN", message, meta, traceId);
  }

  public error(message: string, meta?: any, traceId?: string) {
    this.log("ERROR", message, meta, traceId);
  }

  /**
   * Return recent client logs.
   */
  public getLogs(): ClientLogEntry[] {
    return [...this.buffer];
  }

  /**
   * Clear local buffer.
   */
  public clear(): void {
    this.buffer = [];
  }

  /**
   * Queue log item to be forwarded to backend.
   */
  private queueForward(item: {
    level: LogLevel;
    message: string;
    meta?: any;
    traceId?: string;
    type?: string;
  }) {
    this.flushQueue.push(item);

    if (this.flushTimer) return;

    // Batch and forward every 1.5 seconds or immediately for errors
    const delay = item.level === "ERROR" ? 200 : 1500;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flushToBackend();
    }, delay);
  }

  /**
   * Flush queued logs to /api/admin/logs/client.
   */
  private async flushToBackend() {
    if (this.isFlushing || this.flushQueue.length === 0) return;
    this.isFlushing = true;

    const batch = [...this.flushQueue];
    this.flushQueue = [];

    try {
      const baseUrl = getBaseUrl();
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("mesh_auth_token") : null;

      for (const item of batch) {
        try {
          await fetch(`${baseUrl}/api/admin/logs/client`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              level: item.level,
              message: item.message,
              meta: item.meta,
              traceId: item.traceId,
              agent: "UIX-Client",
              domain: "Frontend UIX",
              type: item.type || "CLIENT_EVENT"
            })
          });
        } catch {
          // Prevent infinite error reporting loop on network disconnection
        }
      }
    } catch {
      // Ignore network transport failures
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Install global window.onerror and unhandledrejection handlers.
   */
  public initGlobalErrorLogging() {
    if (this.isInitialized || typeof window === "undefined") return;
    this.isInitialized = true;

    window.addEventListener("error", (event) => {
      this.error(`Uncaught exception: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : null;

      this.error(`Unhandled Promise Rejection: ${message}`, {
        stack
      });
    });
  }
}

export const clientLogger = new ClientLogger();
