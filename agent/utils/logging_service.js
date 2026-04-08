/**
 * Agentic Data Mesh: Enhanced Logging Service
 * Captures diagnostics, reasoning steps, and A2A communication events.
 */

// Log type constants
export const LogTypes = {
    INFO: 'INFO',
    DEBUG: 'DEBUG',
    ERROR: 'ERROR',
    REASONING: 'REASONING',
    A2A_DISPATCH: 'A2A_DISPATCH',       // Orchestrator dispatches to sub-agent
    A2A_RESPONSE: 'A2A_RESPONSE',       // Sub-agent returns result
    A2A_CONTEXT_SYNC: 'A2A_CONTEXT_SYNC', // Cross-context injection
    TOOL_CALL: 'TOOL_CALL',             // MCP tool invocation
    TOOL_RESULT: 'TOOL_RESULT',         // MCP tool response
    CATALOG_LOOKUP: 'CATALOG_LOOKUP',   // Catalog metadata query
    GROUNDING: 'GROUNDING',             // GraphRAG grounding event
    DATA_CONTRACT: 'DATA_CONTRACT',     // Data product validation
    HEALTH_CHECK: 'HEALTH_CHECK',       // Agent / source health
    DATA_SHARING: 'DATA_SHARING',       // Data sharing metrics
    GOVERNANCE_AUDIT: 'GOVERNANCE_AUDIT', // PEP validation event
    INTENT_ALIGNMENT: 'INTENT_ALIGNMENT', // Tracking reasoning quality
    SEMANTIC_CACHE: 'SEMANTIC_CACHE'     // Cache hit/miss events
};

class LoggingService {
    constructor() {
        this.logs = [];
        this.a2aEvents = [];       // Dedicated A2A communication timeline
        this.agentStatuses = {};   // Live agent statuses
        this.maxLogs = 1000;
        this.maxA2AEvents = 200;
        this._sessionId = Date.now().toString(36);
    }

    /**
     * Record a Governance PEP audit event.
     */
    logGovernance(agent, resource, action, status, reason = null) {
        this.log(agent, `Governance [${action}]: ${resource} -> ${status}`, LogTypes.GOVERNANCE_AUDIT, {
            resource,
            action,
            status,
            reason
        });
    }

    /**
     * Record Intent Alignment / Reasoning Quality.
     */
    logIntent(agent, query, score, reasoning) {
        this.log(agent, `Intent Alignment: ${score * 100}%`, LogTypes.INTENT_ALIGNMENT, {
            query,
            score,
            reasoning
        });
    }

    /**
     * Record Semantic Cache events.
     */
    logCache(event, query, hit = false, key = null) {
        this.log('Orchestrator', `Cache ${event}: ${hit ? 'HIT' : 'MISS'}`, LogTypes.SEMANTIC_CACHE, {
            query,
            hit,
            key
        });
    }

    /**
     * Log a mesh event.
     * @param {string} agent - Name of the agent or component.
     * @param {string} message - The log message.
     * @param {string} type - One of LogTypes values.
     * @param {object} [meta] - Optional structured metadata (payload, latency, etc.)
     * @param {string} [traceId] - Optional trace identifier for request correlation.
     */
    log(agent, message, type = 'INFO', meta = null, traceId = null) {
        const entry = {
            id: `${this._sessionId}-${this.logs.length}`,
            timestamp: new Date().toISOString(),
            agent,
            message,
            type,
            meta,
            traceId
        };

        this.logs.unshift(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
        }

        // Track A2A events separately for the status dialog
        if (type.startsWith('A2A_') || type === 'TOOL_CALL' || type === 'TOOL_RESULT') {
            this.a2aEvents.unshift(entry);
            if (this.a2aEvents.length > this.maxA2AEvents) {
                this.a2aEvents.pop();
            }
        }

        // Update agent status on key events
        if (type === LogTypes.A2A_DISPATCH) {
            this._updateAgentStatus(agent, 'dispatching', message);
        } else if (type === LogTypes.A2A_RESPONSE) {
            this._updateAgentStatus(agent, 'completed', message);
        } else if (type === LogTypes.TOOL_CALL) {
            this._updateAgentStatus(agent, 'tool_executing', message);
        } else if (type === LogTypes.ERROR) {
            this._updateAgentStatus(agent, 'error', message);
        }

        const color = this._getTypeColor(type);
        console.log(`${color}[${entry.timestamp}] [${type}] [${agent}]: ${message}\x1b[0m`);
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
        this._updateAgentStatus(targetAgent, 'processing', `Handling: ${query.substring(0, 80)}`);
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
            args: typeof args === 'object' ? JSON.stringify(args).substring(0, 200) : args
        }, traceId);
    }

    /**
     * Record a tool result from MCP.
     */
    logToolResult(agent, toolName, resultPreview, durationMs, traceId = null) {
        this.log(agent, `Tool ${toolName} returned (${durationMs}ms)`, LogTypes.TOOL_RESULT, {
            tool: toolName,
            preview: resultPreview?.substring?.(0, 150),
            durationMs
        }, traceId);
    }

    /**
     * Record context sync between agents.
     */
    logContextSync(sourceAgent, targetAgent, contextKeys) {
        this.log('Orchestrator', `Context sync: ${sourceAgent} → ${targetAgent} [${contextKeys.join(', ')}]`, LogTypes.A2A_CONTEXT_SYNC, {
            source: sourceAgent,
            target: targetAgent,
            keys: contextKeys
        });
    }

    /**
     * Update live agent status.
     */
    _updateAgentStatus(agent, status, detail = '') {
        this.agentStatuses[agent] = {
            agent,
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
     * Get console color code for log type.
     */
    _getTypeColor(type) {
        switch (type) {
            case LogTypes.ERROR: return '\x1b[31m';          // red
            case LogTypes.REASONING: return '\x1b[35m';      // magenta
            case LogTypes.A2A_DISPATCH: return '\x1b[36m';   // cyan
            case LogTypes.A2A_RESPONSE: return '\x1b[32m';   // green
            case LogTypes.TOOL_CALL: return '\x1b[33m';      // yellow
            case LogTypes.TOOL_RESULT: return '\x1b[33m';    // yellow
            case LogTypes.A2A_CONTEXT_SYNC: return '\x1b[34m'; // blue
            case LogTypes.GROUNDING: return '\x1b[32m';      // green
            case LogTypes.DATA_CONTRACT: return '\x1b[36m';  // cyan
            default: return '\x1b[37m';                      // white
        }
    }

    // --- Accessors ---

    getLogs(filter = null, limit = 100) {
        let filtered = this.logs;
        if (filter) {
            filtered = filtered.filter(l =>
                (!filter.agent || l.agent === filter.agent) &&
                (!filter.type || l.type === filter.type)
            );
        }
        return filtered.slice(0, limit);
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
    }
}

export const logger = new LoggingService();
