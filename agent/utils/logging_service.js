/**
 * Agentic Data Mesh: Centralized Logging Service
 * Captures diagnostics and reasoning steps from all agents in the mesh.
 */

class LoggingService {
    constructor() {
        this.logs = [];
        this.maxLogs = 500; // Keep last 500 logs in memory
    }

    /**
     * Log a mesh event.
     * @param {string} agent - Name of the agent or component.
     * @param {string} message - The log message.
     * @param {string} type - INFO, DEBUG, REASONING, ERROR.
     */
    log(agent, message, type = 'INFO') {
        const entry = {
            timestamp: new Date().toISOString(),
            agent,
            message,
            type
        };

        this.logs.unshift(entry); // Most recent first

        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
        }

        console.log(`[${entry.timestamp}] [${type}] [${agent}]: ${message}`);
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
    }
}

export const logger = new LoggingService();
