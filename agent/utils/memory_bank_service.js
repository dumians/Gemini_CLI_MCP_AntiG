import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { logger } from './logging_service.js';

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
        try {
            // Using execSync as a quick way to fetch token locally
            const token = execSync('gcloud auth application-default print-access-token', { encoding: 'utf8' });
            return token.trim();
        } catch (err) {
            logger.log('MemoryBank', `Failed to fetch access token: ${err.message}`, 'ERROR');
            return null;
        }
    }

    /**
     * Helper for REST API calls to Vertex AI
     */
    async makeRequest(path, method = 'POST', body = null) {
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

    /**
     * Creates a new session inside the Reasoning Engine.
     * @param {string} userId The identity to scope this session to.
     * @returns {Promise<string>} The Session Path/ID
     */
    async createSession(userId) {
        const response = await this.makeRequest('sessions', 'POST', {
            session: {
                user: userId // Scoping memory to user
            }
        });
        return response.name; // e.g., projects/.../locations/.../reasoningEngines/.../sessions/...
    }

    /**
     * Appends an event (message, tool action) to the session.
     * @param {string} sessionPath Full resource name of the session.
     * @param {Object} event The event data (e.g., text, role).
     */
    async appendEvent(sessionPath, event) {
        // sessionPath is already fully qualified
        const path = sessionPath.split(`/reasoningEngines/${this.engineId}/`)[1] + '/events';
        return await this.makeRequest(path, 'POST', {
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
            body.query = query; // Similarity search
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
