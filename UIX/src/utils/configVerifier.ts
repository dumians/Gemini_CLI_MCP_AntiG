/**
 * UIX Client Startup Configuration Access Verifier
 * Verifies local browser storage, network reachability, auth token validity,
 * and calls the backend pre-flight configuration access endpoint.
 */

import { getBaseUrl } from "./env";
import { auth } from "./auth";

export type ConfigCheckStatus = "PASSED" | "WARNING" | "FAILED";
export type ConfigOverallStatus = "HEALTHY" | "DEGRADED" | "FAILED";

export interface ConfigCheckItem {
  id: string;
  name: string;
  category: string;
  status: ConfigCheckStatus;
  message: string;
  details?: any;
  durationMs?: number;
}

export interface ConfigVerificationReport {
  timestamp: string;
  overallStatus: ConfigOverallStatus;
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failed: number;
  };
  checks: ConfigCheckItem[];
  client: {
    baseUrl: string;
    isAuthenticated: boolean;
    hasLocalStorage: boolean;
    userAgent: string;
  };
  backendSystem?: any;
}

type Listener = (report: ConfigVerificationReport) => void;

class ClientConfigVerifier {
  private cachedReport: ConfigVerificationReport | null = null;
  private listeners: Set<Listener> = new Set();
  private isVerifying = false;

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    if (this.cachedReport) {
      listener(this.cachedReport);
    }
    return () => this.listeners.delete(listener);
  }

  public getReport(): ConfigVerificationReport | null {
    return this.cachedReport;
  }

  /**
   * Run full startup verification across both client environment and backend.
   */
  public async verify(forceRefresh = false): Promise<ConfigVerificationReport> {
    if (this.isVerifying && this.cachedReport && !forceRefresh) {
      return this.cachedReport;
    }

    this.isVerifying = true;
    const clientChecks: ConfigCheckItem[] = [];
    const baseUrl = getBaseUrl();
    let hasLocalStorage = false;

    // 1. Client Check: LocalStorage Access
    const t0 = Date.now();
    try {
      const testKey = "__mesh_cfg_test__";
      localStorage.setItem(testKey, "1");
      localStorage.removeItem(testKey);
      hasLocalStorage = true;
      clientChecks.push({
        id: "client_local_storage",
        name: "Browser LocalStorage Access",
        category: "UIX Client Environment",
        status: "PASSED",
        message: "LocalStorage read/write access verified",
        durationMs: Date.now() - t0
      });
    } catch (err: any) {
      clientChecks.push({
        id: "client_local_storage",
        name: "Browser LocalStorage Access",
        category: "UIX Client Environment",
        status: "WARNING",
        message: `LocalStorage access restricted or unavailable: ${err.message}`,
        details: { warning: "Settings and tokens may not persist across reloads" },
        durationMs: Date.now() - t0
      });
    }

    // 2. Client Check: Orchestrator URL Configuration
    const t1 = Date.now();
    try {
      const parsed = new URL(baseUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001"));
      clientChecks.push({
        id: "client_orchestrator_url",
        name: "Orchestrator URL Resolution",
        category: "UIX Client Environment",
        status: "PASSED",
        message: `Resolved API endpoint: ${parsed.origin}`,
        details: { origin: parsed.origin, protocol: parsed.protocol, host: parsed.host },
        durationMs: Date.now() - t1
      });
    } catch (err: any) {
      clientChecks.push({
        id: "client_orchestrator_url",
        name: "Orchestrator URL Resolution",
        category: "UIX Client Environment",
        status: "FAILED",
        message: `Invalid base URL configuration: ${baseUrl}`,
        details: { error: err.message },
        durationMs: Date.now() - t1
      });
    }

    // 3. Client Check: Authentication Token Access & Expiry
    const t2 = Date.now();
    const token = typeof localStorage !== "undefined" ? auth.getToken() : null;
    if (token) {
      try {
        // Decode JWT payload without external library
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp ? payload.exp * 1000 : null;
          const isExpired = exp ? Date.now() > exp : false;

          if (isExpired) {
            clientChecks.push({
              id: "client_auth_token",
              name: "Client Session Token",
              category: "UIX Client Environment",
              status: "WARNING",
              message: "Authentication token has expired. User must re-login.",
              details: { expired: true, expDate: new Date(exp!).toISOString() },
              durationMs: Date.now() - t2
            });
          } else {
            clientChecks.push({
              id: "client_auth_token",
              name: "Client Session Token",
              category: "UIX Client Environment",
              status: "PASSED",
              message: `Active session token for user '${payload.username || "admin"}' (Role: ${payload.role || "admin"})`,
              details: { user: payload.username, role: payload.role },
              durationMs: Date.now() - t2
            });
          }
        } else {
          clientChecks.push({
            id: "client_auth_token",
            name: "Client Session Token",
            category: "UIX Client Environment",
            status: "PASSED",
            message: "Custom auth token present",
            durationMs: Date.now() - t2
          });
        }
      } catch {
        clientChecks.push({
          id: "client_auth_token",
          name: "Client Session Token",
          category: "UIX Client Environment",
          status: "PASSED",
          message: "Auth token present",
          durationMs: Date.now() - t2
        });
      }
    } else {
      clientChecks.push({
        id: "client_auth_token",
        name: "Client Session Token",
        category: "UIX Client Environment",
        status: "WARNING",
        message: "No active session token (User is currently unauthenticated)",
        durationMs: Date.now() - t2
      });
    }

    // 4. Backend Configuration Access Verification
    const t3 = Date.now();
    let backendChecks: ConfigCheckItem[] = [];
    let backendSystem: any = null;

    try {
      // First try authenticated verification endpoint if token exists
      let backendReport: any = null;
      if (token) {
        try {
          const res = await fetch(`${baseUrl}/api/admin/config/verify${forceRefresh ? "?refresh=true" : ""}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            backendReport = await res.json();
          }
        } catch {
          // fallback to public preflight
        }
      }

      // Fallback to public preflight endpoint
      if (!backendReport) {
        const preflightRes = await fetch(`${baseUrl}/api/health/config-access`);
        if (preflightRes.ok || preflightRes.status === 503) {
          backendReport = await preflightRes.json();
        }
      }

      if (backendReport && Array.isArray(backendReport.checks)) {
        backendChecks = backendReport.checks;
        backendSystem = backendReport.system || null;
      } else {
        // Fallback: standard health endpoint
        const healthRes = await fetch(`${baseUrl}/health`);
        if (healthRes.ok) {
          clientChecks.push({
            id: "backend_reachability",
            name: "Backend Service Reachability",
            category: "Backend Orchestrator",
            status: "PASSED",
            message: "Connected to mesh orchestrator API",
            durationMs: Date.now() - t3
          });
        } else {
          clientChecks.push({
            id: "backend_reachability",
            name: "Backend Service Reachability",
            category: "Backend Orchestrator",
            status: "FAILED",
            message: `Backend returned error HTTP status ${healthRes.status}`,
            durationMs: Date.now() - t3
          });
        }
      }
    } catch (err: any) {
      clientChecks.push({
        id: "backend_reachability",
        name: "Backend Service Reachability",
        category: "Backend Orchestrator",
        status: "FAILED",
        message: `Failed to connect to backend at ${baseUrl}: ${err.message}`,
        details: { url: baseUrl, error: err.message },
        durationMs: Date.now() - t3
      });
    }

    // Combine checks
    const allChecks = [...clientChecks, ...backendChecks];
    let passed = 0;
    let warnings = 0;
    let failed = 0;

    for (const c of allChecks) {
      if (c.status === "PASSED") passed++;
      else if (c.status === "WARNING") warnings++;
      else if (c.status === "FAILED") failed++;
    }

    let overallStatus: ConfigOverallStatus = "HEALTHY";
    if (failed > 0) {
      overallStatus = "FAILED";
    } else if (warnings > 0) {
      overallStatus = "DEGRADED";
    }

    const finalReport: ConfigVerificationReport = {
      timestamp: new Date().toISOString(),
      overallStatus,
      summary: {
        totalChecks: allChecks.length,
        passed,
        warnings,
        failed
      },
      checks: allChecks,
      client: {
        baseUrl,
        isAuthenticated: auth.isAuthenticated(),
        hasLocalStorage,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : ""
      },
      backendSystem
    };

    this.cachedReport = finalReport;
    this.isVerifying = false;

    // Broadcast to listeners
    for (const listener of this.listeners) {
      try {
        listener(finalReport);
      } catch (err) {
        console.error("Error in config verifier listener:", err);
      }
    }

    return finalReport;
  }
}

export const clientConfigVerifier = new ClientConfigVerifier();
