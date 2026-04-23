/**
 * MeshOS Governance Agent (Policy Enforcement Point)
 * Implements Zero-Trust security for A2A and Tool-Call validation.
 */
import fs from 'fs';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logging_service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class GovernanceAgent {
    constructor() {
        this.policies = this._loadPolicies();
        this._loadAgentIdentities();
    }

    _loadAgentIdentities() {
        try {
            const agentsPath = join(__dirname, '../../config/agents.json');
            if (fs.existsSync(agentsPath)) {
                this.agentIdentities = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
            } else {
                this.agentIdentities = [];
            }
        } catch (e) {
            console.error("[Governance] Failed to load agent identities:", e.message);
            this.agentIdentities = [];
        }
    }

    _loadPolicies() {
        try {
            const policyPath = join(__dirname, '../../config/policies.json');
            const data = fs.readFileSync(policyPath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error('[Governance] Failed to load policies:', err.message);
            return { rules: [] };
        }
    }

    /**
     * Validates if an agent is allowed to access a resource/domain.
     * @param {string} sourceAgent - The agent making the request.
     * @param {string} targetDomain - The domain being accessed.
     * @param {string} action - The action (e.g., 'READ', 'DELEGATE').
     * @param {string} traceId - The trace ID.
     * @returns {boolean} True if allowed.
     */
    validateAccess(sourceAgent, targetDomain, action, traceId = null) {
        const agentDef = (this.agentIdentities || []).find(a => a.name === sourceAgent || a.id === sourceAgent);
        const projectId = process.env.GCP_PROJECT_ID || 'mesh-nexus-2026';
        const gcpIdentity = agentDef ? agentDef.gcpServiceAccount : `system-orchestrator@${projectId}.iam.gserviceaccount.com`;

        if (targetDomain === 'HR' && sourceAgent !== 'MasterOrchestrator' && sourceAgent !== 'HRAgent') {
            logger.logGovernance(sourceAgent, targetDomain, action, 'DENIED', `Access Restricted: Zero-Trust Domain Boundary for ${gcpIdentity}`, traceId);
            return false;
        }

        logger.logGovernance(sourceAgent, targetDomain, action, 'ALLOWED', `GCP Identity ${gcpIdentity} authorized.`, traceId);
        return true;
    }

    /**
     * Dynamically masks a Data Product payload based on domain policies.
     * @param {string} domain - The data domain.
     * @param {object} payload - The raw data payload.
     * @returns {object} The masked payload.
     */
    maskPayload(domain, payload) {
        const rule = this.policies.rules.find(r => r.domain.toUpperCase() === domain.toUpperCase());
        if (!rule || !rule.maskFields) return payload;

        const masked = Array.isArray(payload) ? [...payload] : { ...payload };
        
        const maskField = (obj) => {
            if (typeof obj !== 'object' || obj === null) return obj;
            const newObj = { ...obj };
            rule.maskFields.forEach(field => {
                if (newObj[field]) {
                    newObj[field] = '*** MASKED ***';
                }
            });
            return newObj;
        };

        if (Array.isArray(masked)) {
            return masked.map(item => maskField(item));
        } else if (masked.data && Array.isArray(masked.data)) {
            masked.data = masked.data.map(item => maskField(item));
            return masked;
        }

        return maskField(masked);
    }
}

export const governanceAgent = new GovernanceAgent();
