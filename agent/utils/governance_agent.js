/**
 * MeshOS Governance Agent (Policy Enforcement Point)
 * Implements Zero-Trust security for A2A and Tool-Call validation.
 */
import fs from 'fs';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logging_service.js';
import crypto from 'crypto';


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
    validateAccess(sourceAgent, targetDomain, action, traceId = null, userRole = 'Consumer') {
        const agentDef = (this.agentIdentities || []).find(a => a.name === sourceAgent || a.id === sourceAgent);
        const projectId = process.env.GCP_PROJECT_ID || 'mesh-nexus-2026';
        const gcpIdentity = agentDef ? agentDef.gcpServiceAccount : `system-orchestrator@${projectId}.iam.gserviceaccount.com`;

        if (targetDomain === 'HR' && userRole !== 'admin' && sourceAgent !== 'HRAgent') {
            const reason = `Access Restricted: User Role '${userRole}' with Identity '${gcpIdentity}' is unauthorized for HR domain boundary.`;
            logger.logGovernance(sourceAgent, targetDomain, action, 'DENIED', reason, traceId);
            this.triggerComplianceReview({
                table: 'EMPLOYEE',
                column: 'ALL',
                source: sourceAgent,
                sourceColumn: 'N/A',
                policyTag: 'projects/.../taxonomies/.../policyTags/hr_tag',
                reason: `Unauthorized access attempt to HR Domain by User: '${userRole}'`
            });
            return false;
        }

        // Check generic domain access rules from policies
        const matchingRule = this.policies.rules.find(r => r.domain.toLowerCase() === targetDomain.toLowerCase());
        if (matchingRule && matchingRule.classification === 'CRITICAL' && userRole !== 'admin') {
            const reason = `Access Restricted: Critical classification in domain '${targetDomain}' requires Admin authorization. User Role: '${userRole}'`;
            logger.logGovernance(sourceAgent, targetDomain, action, 'DENIED', reason, traceId);
            this.triggerComplianceReview({
                table: 'CRITICAL_DATA',
                column: 'ALL',
                source: sourceAgent,
                sourceColumn: 'N/A',
                policyTag: matchingRule.dataplexAspect || 'default',
                reason: `Access attempt to Critical Domain '${targetDomain}' blocked for Role: '${userRole}'`
            });
            return false;
        }

        logger.logGovernance(sourceAgent, targetDomain, action, 'ALLOWED', `GCP Identity ${gcpIdentity} authorized for domain '${targetDomain}' under role '${userRole}'.`, traceId);
        return true;
    }


    /**
     * Dynamically masks a Data Product payload based on domain policies.
     * @param {string} domain - The data domain.
     * @param {object} payload - The raw data payload.
     * @returns {object} The masked payload.
     */
    maskPayload(domain, payload, userRole = 'Consumer') {
        if (userRole === 'admin') return payload;

        const rule = this.policies.rules.find(r => r.domain.toUpperCase() === domain.toUpperCase() || r.domain.toLowerCase() === domain.toLowerCase());
        if (!rule || !rule.maskFields) return payload;

        const masked = Array.isArray(payload) ? [...payload] : { ...payload };
        
        const maskField = (obj) => {
            if (typeof obj !== 'object' || obj === null) return obj;
            const newObj = { ...obj };
            rule.maskFields.forEach(field => {
                if (newObj[field] !== undefined) {
                    if (rule.maskingRule === 'hash') {
                        newObj[field] = '### HASHED (' + crypto.createHash('md5').update(String(newObj[field])).digest('hex').substring(0, 8) + ') ###';
                    } else if (rule.maskingRule === 'nullify') {
                        newObj[field] = null;
                    } else {
                        newObj[field] = '*** MASKED ***';
                    }
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


    /**
     * Syncs policies locally and in Dataplex Catalog
     */
    async syncPolicies(newPolicies) {
        try {
            const policyPath = join(__dirname, '../../config/policies.json');
            fs.writeFileSync(policyPath, JSON.stringify(newPolicies, null, 2));
            this.policies = newPolicies;
            logger.log('Governance', 'Successfully synchronized governance policies locally', 'INFO');

            // Async Dataplex sync if not in simulation mode
            const isSimulation = !process.env.GCP_PROJECT_ID || process.env.NODE_ENV === 'test' || process.env.USE_REAL_CONNECTIONS !== 'true';
            if (!isSimulation && newPolicies.rules) {
                const { dataplex } = await import('./dataplex.js');
                newPolicies.rules.forEach(rule => {
                    dataplex.createGovernancePolicy(rule).catch(err => {
                        console.error("[Governance] Failed to sync policy to Dataplex:", err);
                    });
                });
            }
            return { success: true };
        } catch (err) {
            logger.log('Governance', `Failed to sync policies: ${err.message}`, 'ERROR');
            throw err;
        }
    }

    /**
     * Triggers a compliance review request (Human-in-the-loop audit alert)
     */
    triggerComplianceReview(alertData) {
        try {
            const alertsPath = join(__dirname, '../../config/compliance_alerts.json');
            let alerts = [];
            if (fs.existsSync(alertsPath)) {
                alerts = JSON.parse(fs.readFileSync(alertsPath, 'utf8'));
            }
            
            const alert = {
                id: `ALR-${Math.floor(Math.random() * 10000)}`,
                timestamp: new Date().toISOString(),
                status: 'PENDING_REVIEW',
                ...alertData
            };
            
            // Deduplicate by target column and status
            const exists = alerts.some(a => a.table === alert.table && a.column === alert.column && a.status === 'PENDING_REVIEW');
            if (!exists) {
                alerts.push(alert);
                fs.writeFileSync(alertsPath, JSON.stringify(alerts, null, 2));
                logger.log('Governance', `Compliance review alert triggered for ${alert.table}.${alert.column}: ${alert.reason}`, 'WARNING');
            }
            return alert;
        } catch (e) {
            logger.log('Governance', `Failed to trigger compliance review: ${e.message}`, 'ERROR');
            return null;
        }
    }
}

export const governanceAgent = new GovernanceAgent();
