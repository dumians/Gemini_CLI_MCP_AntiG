import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { GoogleAuth } from "google-auth-library";
import { logger } from "./logging_service.js";
import path from "path";

const gAuth = new GoogleAuth();

/**
 * Resolves a Google Cloud OIDC ID token for Cloud Run service invocation.
 * @param {string} targetUrl The target Cloud Run service URL
 * @returns {Promise<string|null>} Authorization header value (e.g. "Bearer eyJ...")
 */
export async function resolveGcpIdToken(targetUrl) {
    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.includes('run.app')) {
        return null;
    }

    try {
        const urlObj = new URL(targetUrl);
        const audience = urlObj.origin;

        // 1. Try GoogleAuth client (handles automatic caching & metadata resolution)
        try {
            const client = await gAuth.getIdTokenClient(audience);
            const headers = await client.getRequestHeaders();
            let authVal = null;
            if (headers) {
                if (typeof headers.get === 'function') {
                    authVal = headers.get('authorization') || headers.get('Authorization');
                } else {
                    authVal = headers['authorization'] || headers['Authorization'];
                }
            }
            if (authVal && authVal.trim() && authVal.startsWith('Bearer ')) {
                return authVal.trim();
            }
        } catch (_) {}

        // 2. Direct Compute Engine / Cloud Run Metadata Server query
        try {
            const metaUrl = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${audience}`;
            const metaRes = await fetch(metaUrl, {
                headers: { 'Metadata-Flavor': 'Google' },
                signal: AbortSignal.timeout(3000)
            });
            if (metaRes.ok) {
                const token = await metaRes.text();
                if (token && token.trim()) {
                    return `Bearer ${token.trim()}`;
                }
            }
        } catch (_) {}
    } catch (err) {
        logger.log("MCPAuth", `Failed to resolve GCP ID token for ${targetUrl}: ${err.message}`, "WARNING");
    }

    return null;
}

/**
 * Creates an authenticated MCP Client (SSE with automatic fallback to local stdio).
 */
export async function createAuthenticatedMcpClient(clientName, serverCmd, serverArgs, remoteUrl = null) {
    if (remoteUrl && remoteUrl.startsWith("http")) {
        try {
            const urlObj = new URL(remoteUrl);
            const requestHeaders = {};

            const authHeader = await resolveGcpIdToken(remoteUrl);
            if (authHeader) {
                requestHeaders['Authorization'] = authHeader;
            }

            const transport = new SSEClientTransport(urlObj, {
                requestInit: {
                    headers: requestHeaders
                }
            });

            const client = new Client(
                { name: clientName, version: "2.0.0" },
                { capabilities: {} }
            );

            await client.connect(transport);
            return client;
        } catch (sseErr) {
            logger.log("MCPClient", `SSE connection failed for ${clientName} (${sseErr.message}). Falling back to stdio...`, "WARNING");
        }
    }

    const rootDir = process.cwd().endsWith('server') ? path.resolve(process.cwd(), '..') : process.cwd();
    const absoluteArgs = (serverArgs || []).map(arg => {
        if (arg && typeof arg === 'string' && arg.startsWith('servers/')) {
            return path.resolve(rootDir, arg);
        }
        return arg;
    });

    const transport = new StdioClientTransport({
        command: serverCmd || "node",
        args: absoluteArgs,
        env: { ...process.env }
    });

    const client = new Client(
        { name: clientName, version: "2.0.0" },
        { capabilities: {} }
    );

    await client.connect(transport);
    return client;
}
