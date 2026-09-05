import { logger } from "../../agent/utils/logging_service.js";

/**
 * Express Middleware for Request Tracing & Structured HTTP Logging
 * Extracts or generates trace IDs and logs HTTP transaction metrics.
 */
export function requestLogger(req, res, next) {
    const startTime = Date.now();

    // Extract trace ID from Google Cloud Load Balancer / Cloud Trace header:
    // Format: "TRACE_ID/SPAN_ID;o=TRACE_TRUE"
    const cloudTraceHeader = req.headers["x-cloud-trace-context"];
    let traceId = null;

    if (cloudTraceHeader) {
        traceId = cloudTraceHeader.split("/")[0];
    }

    if (!traceId) {
        traceId = req.headers["x-request-id"] || req.headers["x-trace-id"] || `mesh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    }

    req.traceId = traceId;
    res.setHeader("x-trace-id", traceId);

    // Filter out high-frequency ping/poll routes from verbose INFO logs
    const isQuietRoute = req.path === "/health" || req.path === "/" || req.path === "/api/admin/logs/stream";

    res.on("finish", () => {
        const durationMs = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Skip quiet routes unless they errored
        if (isQuietRoute && statusCode < 400) {
            return;
        }

        const meta = {
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers["user-agent"]?.substring(0, 100),
            user: req.user?.username || "anonymous",
            role: req.user?.role || null
        };

        logger.logHttpRequest(req.method, req.originalUrl || req.url, statusCode, durationMs, meta, traceId);
    });

    next();
}
