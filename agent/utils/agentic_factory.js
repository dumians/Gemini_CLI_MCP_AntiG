import fs from 'fs';
import path from 'path';
import GenericAgent from './generic_agent.js';
import { logger } from "./logging_service.js";

import { fileURLToPath } from 'url';

class AgenticFactory {
    constructor() {
        this.agents = {}; // Cached instances
        this.agentDefinitions = [];
        this.loadDefinitions();
    }

    loadDefinitions() {
        try {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const configPath = path.resolve(__dirname, '../../config/agents.json');
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                this.agentDefinitions = JSON.parse(content);
                logger.log("AgenticFactory", `Loaded ${this.agentDefinitions.length} agent templates from agents.json`, "INFO");
            } else {
                logger.log("AgenticFactory", `Configuration not found: ${configPath}`, "ERROR");
            }
        } catch (error) {
            logger.log("AgenticFactory", `Failed to parse agent templates: ${error.message}`, "ERROR");
        }
    }

    /**
     * Dynamically provisions an agent via configuration.
     */
    getAgent(agentName) {
        if (!this.agents[agentName]) {
            const def = this.agentDefinitions.find(a => a.name === agentName || a.id === agentName);
            if (!def) {
                throw new Error(`Agent template '${agentName}' not found in registry.`);
            }

            logger.log("AgenticFactory", `Provisioning agent instance: ${def.name} [${def.domain}]`, "INFO");
            this.agents[agentName] = new GenericAgent(def);
        }
        return this.agents[agentName];
    }

    getAllDefinitions() {
        return this.agentDefinitions;
    }
}

export const agenticFactory = new AgenticFactory();
