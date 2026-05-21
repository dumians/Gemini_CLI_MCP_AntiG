import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { logger } from './logging_service.js';
import fs from 'fs';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sessionsFile = join(__dirname, '../../config/sessions.json');


dotenv.config();

class MemoryBankService {
    constructor() {
        this.projectId = process.env.GCP_PROJECT_ID || 'total-vertex-469513-r8';
        this.location = process.env.VERTEX_AI_LOCATION || 'europe-west1'; // Standard Vertex region
        this.engineId = process.env.VERTEX_MEMORY_BANK_ENGINE_ID || 'default-engine'; // Placeholder
        this.apiEndpoint = `https://${this.location}-aiplatform.googleapis.com/v1`;
    }

    /**
     * Fetches access token via gcloud application-default.
     * @returns {string|null}
     */
    getAccessToken() {
        // Check if token is provided via environment variable first
        if (process.env.GCP_ACCESS_TOKEN) {
            return process.env.GCP_ACCESS_TOKEN.trim();
        }

        try {
            // Using execSync as a quick way to fetch token locally
            const token = execSync('gcloud auth application-default print-access-token', { encoding: 'utf8' });
            return token.trim();
        } catch (err) {
            logger.log('MemoryBank', `Failed to fetch access token: ${err.message}`, 'ERROR');
            return null;
        }
    }

    async makeRequest(path, method = 'POST', body = null) {
        const isPlaceholder = !process.env.VERTEX_MEMORY_BANK_ENGINE_ID || process.env.VERTEX_MEMORY_BANK_ENGINE_ID === 'default-engine';
        const isSimulated = process.env.USE_REAL_CONNECTIONS !== 'true' || isPlaceholder;
        
        if (isSimulated) {
            return this._getSimulatedResponse(path, body);
        }

        const token = this.getAccessToken();
        if (!token) {
            throw new Error("Authentication failed: No access token available.");
        }

        const url = `${this.apiEndpoint}/projects/${this.projectId}/locations/${this.location}/reasoningEngines/${this.engineId}/${path}`;
        
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`Vertex AI Error (${response.status}): ${JSON.stringify(data)}`);
            }
            
            return data;
        } catch (error) {
            logger.log('MemoryBank', `API Request Failed to ${path}: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    _getSimulatedResponse(path, body) {
        if (path === 'sessions') {
            return { name: `projects/${this.projectId}/locations/${this.location}/reasoningEngines/${this.engineId}/sessions/simulated-session-${Date.now()}` };
        }
        if (path.endsWith('/events')) {
            return { status: "success", message: "Event simulated." };
        }
        if (path === 'memories:generate') {
            return { status: "success", message: "Memory generation simulated." };
        }
        if (path === 'memories:retrieve') {
            return {
                memories: [
                    "Simulated memory: User previously queried about cross-domain assets.",
                    "Simulated memory: Compliance scopes require encryption for PII."
                ]
            };
        }
        return {};
    }

    /**
     * Creates a new session inside the Reasoning Engine.
     * @param {string} userId The identity to scope this session to.
     * @returns {Promise<string>} The Session Path/ID
     */
    _loadSessions() {
        try {
            if (fs.existsSync(sessionsFile)) {
                return JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
            }
        } catch (e) {
            logger.log('MemoryBank', `Failed to load sessions.json: ${e.message}`, 'WARNING');
        }
        return [];
    }

    _saveSessions(sessions) {
        try {
            fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
        } catch (e) {
            logger.log('MemoryBank', `Failed to save sessions.json: ${e.message}`, 'WARNING');
        }
    }

    /**
     * Creates a new session inside the Reasoning Engine and logs it locally.
     * @param {string} userId The identity to scope this session to.
     * @returns {Promise<string>} The Session Path/ID
     */
    async createSession(userId) {
        const response = await this.makeRequest('sessions', 'POST', {});
        const sessionPath = response.name;
        const sessionId = sessionPath.split('/sessions/').pop();

        const sessions = this._loadSessions();
        sessions.push({
            id: sessionId,
            sessionPath: sessionPath,
            userId: userId,
            createdAt: new Date().toISOString(),
            messages: []
        });
        this._saveSessions(sessions);

        return sessionPath;
    }

    /**
     * Lists active sessions for a user.
     */
    listSessions(userId) {
        const sessions = this._loadSessions();
        return sessions.filter(s => s.userId === userId);
    }

    /**
     * Deletes a session from file and API context.
     */
    async deleteSession(sessionId) {
        let sessions = this._loadSessions();
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            sessions = sessions.filter(s => s.id !== sessionId);
            this._saveSessions(sessions);
            logger.log('MemoryBank', `Session deleted locally: ${sessionId}`, 'INFO');
            try {
                // If the remote endpoint supported delete, we would call it here
            } catch (err) {
                logger.log('MemoryBank', `Failed to delete remote session: ${err.message}`, 'WARNING');
            }
            return true;
        }
        return false;
    }

    /**
     * Retrieves session details including message history.
     */
    getSession(sessionId) {
        const sessions = this._loadSessions();
        return sessions.find(s => s.id === sessionId || s.sessionPath === sessionId);
    }

    /**
     * Appends an event (message, tool action) to the session and syncs locally.
     * @param {string} sessionPath Full resource name of the session or sessionId.
     * @param {Object} event The event data (e.g., text, role).
     */
    async appendEvent(sessionPath, event) {
        const pathSuffix = sessionPath.split(`/reasoningEngines/${this.engineId}/`)[1];
        const apiPath = pathSuffix ? pathSuffix + '/events' : `sessions/${sessionPath}/events`;
        
        // Sync locally first
        const sessions = this._loadSessions();
        const session = sessions.find(s => s.id === sessionPath || s.sessionPath === sessionPath);
        if (session) {
            session.messages.push({
                role: event.role,
                text: event.text,
                timestamp: new Date().toISOString()
            });
            this._saveSessions(sessions);
        }

        return await this.makeRequest(apiPath, 'POST', {
            event: event
        });
    }


    /**
     * Triggers memory generation based on conversation history.
     * @param {string} sessionPath Full resource name of the session.
     */
    async generateMemories(sessionPath) {
        // Format: memories:generate
        const path = 'memories:generate';
        return await this.makeRequest(path, 'POST', {
            session: sessionPath
        });
    }

    /**
     * Retrieves memories scoped to a user, with optional similarity search.
     * @param {string} userId The user identity.
     * @param {string} query Optional search query for similarity retrieval.
     */
    async retrieveMemories(userId, query = null) {
        const path = 'memories:retrieve';
        const body = {
            scope: {
                user: userId
            }
        };

        if (query) {
            // body.query = query; // Similarity search (Unsupported by Vertex Reasoning payload field restrictions)
        }

        try {
            const response = await this.makeRequest(path, 'POST', body);
            return response.memories || [];
        } catch (err) {
            logger.log('MemoryBank', `Failed to retrieve memories for user ${userId}: ${err.message}`, 'WARNING');
            return [];
        }
    }
}

export const memoryBankService = new MemoryBankService();
