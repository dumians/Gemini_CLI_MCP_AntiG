/**
 * Agentic Data Mesh: Enhanced Logging Service
 * Captures diagnostics, reasoning steps, and A2A communication events.
 */

// Log severity levels
export const LogLevels = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
};

// Log type constants
export const LogTypes = {
    INFO: 'INFO',
    DEBUG: 'DEBUG',
    WARN: 'WARN',
    ERROR: 'ERROR',
    REASONING: 'REASONING',
    A2A_DISPATCH: 'A2A_DISPATCH',         // Orchestrator dispatches to sub-agent
    A2A_RESPONSE: 'A2A_RESPONSE',         // Sub-agent returns result
    A2A_CONTEXT_SYNC: 'A2A_CONTEXT_SYNC', // Cross-context injection
    TOOL_CALL: 'TOOL_CALL',               // MCP tool invocation
    TOOL_RESULT: 'TOOL_RESULT',           // MCP tool response
    CATALOG_LOOKUP: 'CATALOG_LOOKUP',     // Catalog metadata query
    GROUNDING: 'GROUNDING',               // GraphRAG grounding event
    DATA_CONTRACT: 'DATA_CONTRACT',       // Data product validation
    HEALTH_CHECK: 'HEALTH_CHECK',         // Agent / source health
    DATA_SHARING: 'DATA_SHARING',         // Data sharing metrics
    GOVERNANCE_AUDIT: 'GOVERNANCE_AUDIT', // PEP validation event
    INTENT_ALIGNMENT: 'INTENT_ALIGNMENT', // Tracking reasoning quality
    SEMANTIC_CACHE: 'SEMANTIC_CACHE',     // Cache hit/miss events
    HTTP_REQUEST: 'HTTP_REQUEST',         // API request lifecycle
    CLIENT_EVENT: 'CLIENT_EVENT'          // Telemetry forwarded from UIX
};

// Map agents to their enterprise domains
export const AGENT_DOMAINS = {
    'RetailAgent': 'Spanner Retail',
    'AnalyticsAgent': 'BigQuery Analytics',
    'CRMAgent': 'AlloyDB CRM',
    'HRAgent': 'Oracle HR',
    'OracleERPAgent': 'Oracle ERP',
    'WarehouseAgent': 'Warehouse Spatial',
    'NetSuiteAgent': 'NetSuite ERP',
    'CatalogAgent': 'Metadata Catalog',
    'GovernanceAgent': 'Dataplex Governance',
    'DiscoveryAgent': 'Knowledge Discovery',
    'Orchestrator': 'Master Orchestrator',
    'Planner': 'Strategic Planner',
    'Server': 'API Gateway',
    'UIX-Client': 'Frontend UIX'
};

class LoggingService {
    constructor() {
        this.logs = [];
        this.a2aEvents = [];       // Dedicated A2A communication timeline
        this.agentStatuses = {};   // Live agent statuses
        this.listeners = new Set(); // Real-time SSE listeners
        this.maxLogs = 2500;
        this.maxA2AEvents = 300;
        this._sessionId = Date.now().toString(36);
        this.isCloudLogging = Boolean(
            process.env.K_SERVICE || 
            process.env.LOG_FORMAT === 'json' ||
            (process.env.NODE_ENV === 'production' && !process.stdout.isTTY)
        );
    }

    /**
     * Subscribe to live real-time log events (used by SSE).
     * @param {Function} listener
     * @returns {Function} unsubscribe function
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Broadcast log entry to real-time subscribers.
     */
    broadcast(entry) {
        for (const listener of this.listeners) {
            try {
                listener(entry);
            } catch (err) {
                this.listeners.delete(listener);
            }
        }
    }

    /**
     * Map log type or severity to standard LogLevel.
     */
    _resolveLevel(type, explicitLevel = null) {
        if (explicitLevel && LogLevels[explicitLevel]) return explicitLevel;
        switch (type) {
            case LogTypes.ERROR:
                return LogLevels.ERROR;
            case LogTypes.WARN:
                return LogLevels.WARN;
            case LogTypes.DEBUG:
                return LogLevels.DEBUG;
            default:
                return LogLevels.INFO;
        }
    }

    /**
     * Resolve enterprise domain for an agent.
     */
    _resolveDomain(agent, explicitDomain = null) {
        if (explicitDomain) return explicitDomain;
        if (!agent) return 'System';
        return AGENT_DOMAINS[agent] || 'System';
    }

    /**
     * Log a mesh event.
     * @param {string} agent - Name of the agent or component.
     * @param {string} message - The log message.
     * @param {string} type - One of LogTypes values.
     * @param {object} [meta] - Optional structured metadata (payload, latency, etc.)
     * @param {string} [traceId] - Optional trace identifier for request correlation.
     * @param {string} [level] - Explicit severity (DEBUG, INFO, WARN, ERROR).
     * @param {string} [source] - 'backend' or 'client'.
     */
    log(agent, message, type = 'INFO', meta = null, traceId = null, level = null, source = 'backend') {
        const resolvedLevel = this._resolveLevel(type, level);
        const domain = this._resolveDomain(agent, meta?.domain);

        const entry = {
            id: `${this._sessionId}-${this.logs.length + 1}`,
            timestamp: new Date().toISOString(),
            level: resolvedLevel,
            type,
            agent: agent || 'System',
            domain,
            message: typeof message === 'string' ? message : JSON.stringify(message),
            meta: meta || null,
            traceId: traceId || meta?.traceId || null,
            source
        };

        this.logs.unshift(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
        }

        // Track A2A and tool events in dedicated stream
        if (type.startsWith('A2A_') || type === LogTypes.TOOL_CALL || type === LogTypes.TOOL_RESULT) {
            this.a2aEvents.unshift(entry);
            if (this.a2aEvents.length > this.maxA2AEvents) {
                this.a2aEvents.pop();
            }
        }

        // Update live agent status on relevant events
        if (type === LogTypes.A2A_DISPATCH) {
            this._updateAgentStatus(agent, 'dispatching', message);
        } else if (type === LogTypes.A2A_RESPONSE) {
            this._updateAgentStatus(agent, 'completed', message);
        } else if (type === LogTypes.TOOL_CALL) {
            this._updateAgentStatus(agent, 'tool_executing', message);
        } else if (resolvedLevel === LogLevels.ERROR) {
            this._updateAgentStatus(agent, 'error', message);
        }

        // Output to stdout
        this._writeOutput(entry);

        // Notify live listeners
        this.broadcast(entry);

        return entry;
    }

    /**
     * Standard Convenience Loggers
     */
    info(agent, message, meta = null, traceId = null) {
        return this.log(agent, message, LogTypes.INFO, meta, traceId, LogLevels.INFO);
    }

    warn(agent, message, meta = null, traceId = null) {
        return this.log(agent, message, LogTypes.WARN, meta, traceId, LogLevels.WARN);
    }

    error(agent, message, meta = null, traceId = null) {
        return this.log(agent, message, LogTypes.ERROR, meta, traceId, LogLevels.ERROR);
    }

    debug(agent, message, meta = null, traceId = null) {
        return this.log(agent, message, LogTypes.DEBUG, meta, traceId, LogLevels.DEBUG);
    }

    /**
     * Record an HTTP request lifecycle event.
     */
    logHttpRequest(method, url, statusCode, durationMs, meta = {}, traceId = null) {
        const level = statusCode >= 500 ? LogLevels.ERROR : (statusCode >= 400 || durationMs > 1500) ? LogLevels.WARN : LogLevels.INFO;
        const msg = `${method.toUpperCase()} ${url} [${statusCode}] (${durationMs}ms)`;
        return this.log('Server', msg, LogTypes.HTTP_REQUEST, {
            method,
            url,
            statusCode,
            durationMs,
            ...meta
        }, traceId, level, 'backend');
    }

    /**
     * Ingest frontend telemetry/log from UIX.
     */
    logClient({ level = 'INFO', message, meta = null, traceId = null }) {
        return this.log('UIX-Client', message, LogTypes.CLIENT_EVENT, meta, traceId, level, 'client');
    }

    /**
     * Record a Governance PEP audit event.
     */
    logGovernance(agent, resource, action, status, reason = null, traceId = null) {
        const level = status === 'DENIED' || status === 'REJECTED' ? LogLevels.WARN : LogLevels.INFO;
        this.log(agent, `Governance [${action}]: ${resource} -> ${status}`, LogTypes.GOVERNANCE_AUDIT, {
            resource,
            action,
            status,
            reason
        }, traceId, level);
    }

    /**
     * Record Intent Alignment / Reasoning Quality.
     */
    logIntent(agent, query, score, reasoning, traceId = null) {
        this.log(agent, `Intent Alignment: ${Math.round(score * 100)}%`, LogTypes.INTENT_ALIGNMENT, {
            query,
            score,
            reasoning
        }, traceId);
    }

    /**
     * Record Semantic Cache events.
     */
    logCache(event, query, hit = false, key = null, traceId = null) {
        this.log('Orchestrator', `Cache ${event}: ${hit ? 'HIT' : 'MISS'}`, LogTypes.SEMANTIC_CACHE, {
            query,
            hit,
            key
        }, traceId);
    }

    /**
     * Record an A2A dispatch event (orchestrator → sub-agent).
     */
    logDispatch(sourceAgent, targetAgent, query, traceId = null) {
        this.log(sourceAgent, `Dispatching to ${targetAgent}: "${query}"`, LogTypes.A2A_DISPATCH, {
            source: sourceAgent,
            target: targetAgent,
            query,
            direction: 'outbound'
        }, traceId);
        this._updateAgentStatus(targetAgent, 'processing', `Handling: ${query?.substring?.(0, 80) || query}`);
    }

    /**
     * Record an A2A response event (sub-agent → orchestrator).
     */
    logResponse(agent, domain, confidence, durationMs, traceId = null) {
        this.log(agent, `Returned result (confidence: ${confidence}, ${durationMs}ms)`, LogTypes.A2A_RESPONSE, {
            domain,
            confidence,
            durationMs,
            direction: 'inbound'
        }, traceId);
        this._updateAgentStatus(agent, 'idle', `Last: ${domain} query (${durationMs}ms)`);
    }

    /**
     * Record a data sharing event (rows, size, consumer).
     */
    logDataSharing(agent, consumerId, rowCount, dataSize, domain, traceId = null) {
        this.log(agent, `Shared data with ${consumerId} (Rows: ${rowCount}, Size: ${dataSize} bytes)`, LogTypes.DATA_SHARING, {
            consumerId,
            rowCount,
            dataSize,
            domain,
            direction: 'outbound'
        }, traceId);
    }

    /**
     * Record a tool call through MCP.
     */
    logToolCall(agent, toolName, args, traceId = null) {
        this.log(agent, `MCP Tool: ${toolName}`, LogTypes.TOOL_CALL, {
            tool: toolName,
            args: typeof args === 'object' ? JSON.stringify(args).substring(0, 300) : args
        }, traceId);
    }

    /**
     * Record a tool result from MCP.
     */
    logToolResult(agent, toolName, resultPreview, durationMs, traceId = null) {
        this.log(agent, `Tool ${toolName} returned (${durationMs}ms)`, LogTypes.TOOL_RESULT, {
            tool: toolName,
            preview: typeof resultPreview === 'string' ? resultPreview.substring(0, 200) : JSON.stringify(resultPreview).substring(0, 200),
            durationMs
        }, traceId);
    }

    /**
     * Record context sync between agents.
     */
    logContextSync(sourceAgent, targetAgent, contextKeys, traceId = null) {
        this.log('Orchestrator', `Context sync: ${sourceAgent} → ${targetAgent} [${contextKeys.join(', ')}]`, LogTypes.A2A_CONTEXT_SYNC, {
            source: sourceAgent,
            target: targetAgent,
            keys: contextKeys
        }, traceId);
    }

    /**
     * Update live agent status.
     */
    _updateAgentStatus(agent, status, detail = '') {
        this.agentStatuses[agent] = {
            agent,
            domain: this._resolveDomain(agent),
            status,
            detail,
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Set agent status explicitly (e.g., on startup).
     */
    setAgentStatus(agent, status, detail = '') {
        this._updateAgentStatus(agent, status, detail);
    }

    /**
     * Write formatted log to stdout/stderr.
     * Generates Google Cloud Logging JSON in production or colored ANSI locally.
     */
    _writeOutput(entry) {
        if (this.isCloudLogging) {
            const gcpEntry = {
                severity: entry.level,
                message: `[${entry.agent}] [${entry.type}] ${entry.message}`,
                timestamp: entry.timestamp,
                component: entry.agent,
                domain: entry.domain,
                type: entry.type,
                source: entry.source,
                meta: entry.meta
            };
            if (entry.traceId) {
                const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'total-vertex-469513-r8';
                gcpEntry['logging.googleapis.com/trace'] = `projects/${projectId}/traces/${entry.traceId}`;
            }
            if (entry.level === LogLevels.ERROR) {
                console.error(JSON.stringify(gcpEntry));
            } else {
                console.log(JSON.stringify(gcpEntry));
            }
        } else {
            const color = this._getTypeColor(entry.type, entry.level);
            const traceSuffix = entry.traceId ? ` \x1b[90m(trace: ${entry.traceId})\x1b[0m` : '';
            console.log(`${color}[${entry.timestamp}] [${entry.level}] [${entry.agent}|${entry.domain}]: ${entry.message}\x1b[0m${traceSuffix}`);
        }
    }

    /**
     * Get console color code for log type / severity.
     */
    _getTypeColor(type, level) {
        if (level === LogLevels.ERROR) return '\x1b[31m'; // Red
        if (level === LogLevels.WARN) return '\x1b[33m';  // Yellow
        switch (type) {
            case LogTypes.REASONING: return '\x1b[35m';      // Magenta
            case LogTypes.A2A_DISPATCH: return '\x1b[36m';   // Cyan
            case LogTypes.A2A_RESPONSE: return '\x1b[32m';   // Green
            case LogTypes.TOOL_CALL: return '\x1b[33m';      // Yellow
            case LogTypes.TOOL_RESULT: return '\x1b[32m';    // Green
            case LogTypes.A2A_CONTEXT_SYNC: return '\x1b[34m'; // Blue
            case LogTypes.GROUNDING: return '\x1b[32m';      // Green
            case LogTypes.DATA_CONTRACT: return '\x1b[36m';  // Cyan
            case LogTypes.HTTP_REQUEST: return '\x1b[34m';   // Blue
            case LogTypes.CLIENT_EVENT: return '\x1b[95m';   // Bright Magenta
            default: return '\x1b[37m';                      // White
        }
    }

    // --- Accessors & Analytics ---

    /**
     * Retrieve filtered logs with pagination.
     */
    getLogs(filter = null, limit = 100, offset = 0) {
        let filtered = this.logs;

        if (filter) {
            const searchKeyword = (filter.search || filter.q || '').trim().toLowerCase();
            const levelFilter = filter.level ? filter.level.toUpperCase() : null;
            const typeFilter = filter.type ? filter.type.toUpperCase() : null;

            filtered = filtered.filter(l => {
                if (filter.agent && filter.agent !== 'all' && l.agent !== filter.agent) return false;
                if (filter.domain && filter.domain !== 'all' && l.domain !== filter.domain) return false;
                if (levelFilter && levelFilter !== 'ALL' && l.level !== levelFilter) return false;
                if (typeFilter && typeFilter !== 'ALL' && l.type !== typeFilter) return false;
                if (filter.traceId && l.traceId !== filter.traceId) return false;
                if (filter.source && filter.source !== 'all' && l.source !== filter.source) return false;
                if (searchKeyword) {
                    const matchMsg = l.message?.toLowerCase().includes(searchKeyword);
                    const matchAgent = l.agent?.toLowerCase().includes(searchKeyword);
                    const matchDomain = l.domain?.toLowerCase().includes(searchKeyword);
                    const matchTrace = l.traceId?.toLowerCase().includes(searchKeyword);
                    const matchMeta = l.meta ? JSON.stringify(l.meta).toLowerCase().includes(searchKeyword) : false;
                    if (!matchMsg && !matchAgent && !matchDomain && !matchTrace && !matchMeta) return false;
                }
                return true;
            });
        }

        const total = filtered.length;
        const sliced = filtered.slice(offset, offset + limit);

        // Support array methods on result for backward compatibility while providing total and stats
        const result = [...sliced];
        result.logs = sliced;
        result.total = total;
        result.limit = limit;
        result.offset = offset;
        result.stats = this.getStats();

        return result;
    }

    /**
     * Compute real-time log statistics.
     */
    getStats() {
        let errors = 0;
        let warnings = 0;
        let toolCalls = 0;
        let a2aCount = 0;
        const byAgent = {};
        const byDomain = {};
        const byLevel = { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0 };

        for (const l of this.logs) {
            if (l.level === LogLevels.ERROR) errors++;
            if (l.level === LogLevels.WARN) warnings++;
            if (l.type === LogTypes.TOOL_CALL) toolCalls++;
            if (l.type.startsWith('A2A_')) a2aCount++;

            byLevel[l.level] = (byLevel[l.level] || 0) + 1;
            byAgent[l.agent] = (byAgent[l.agent] || 0) + 1;
            if (l.domain) {
                byDomain[l.domain] = (byDomain[l.domain] || 0) + 1;
            }
        }

        return {
            total: this.logs.length,
            errors,
            warnings,
            toolCalls,
            a2aCount,
            activeSubscribers: this.listeners.size,
            byLevel,
            byAgent,
            byDomain
        };
    }

    getA2AEvents(limit = 50) {
        return this.a2aEvents.slice(0, limit);
    }

    getAgentStatuses() {
        return Object.values(this.agentStatuses);
    }

    clearLogs() {
        this.logs = [];
        this.a2aEvents = [];
        return true;
    }
}

export const logger = new LoggingService();
