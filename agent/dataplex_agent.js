import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logging_service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class DataplexAgent {
    constructor() {
        this.policiesPath = path.join(__dirname, '../config/policies.json');
    }

    getTools() {
        return [
            {
                name: "evaluate_policy",
                description: "Evaluates standard Data Product objects against federated Dataplex policies",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        domain: { type: "STRING" },
                        dataProduct: { type: "OBJECT" }
                    },
                    required: ["domain", "dataProduct"]
                }
            },
            {
                name: "tag_entity",
                description: "Tags a mesh entity with governance metadata (e.g., PII, Sensitive)",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        entityId: { type: "STRING" },
                        tag: { type: "STRING" }
                    },
                    required: ["entityId", "tag"]
                }
            }
        ];
    }

    async callTool(toolName, args, traceId) {
        logger.log('DataplexAgent', `Invoked tool ${toolName}`, 'INFO', args, traceId);
        
        switch (toolName) {
            case "evaluate_policy":
                return this.evaluatePolicy(args.domain, args.dataProduct, traceId);
            case "tag_entity":
                return this.tagEntity(args.entityId, args.tag, traceId);
            default:
                throw new Error(`Tool ${toolName} not found`);
        }
    }

    async evaluatePolicy(domain, dataProduct, traceId) {
        let policies = { rules: [] };
        if (fs.existsSync(this.policiesPath)) {
            policies = JSON.parse(fs.readFileSync(this.policiesPath, 'utf8'));
        }

        const domainRule = policies.rules.find((r) => r.domain === domain);
        if (!domainRule) {
            return { status: "PASSED", reason: "No specific policy for this domain. Standard policy applied." };
        }

        // Simple check
        if (domainRule.maskFields && dataProduct) {
            domainRule.maskFields.forEach((field) => {
                if (dataProduct[field]) {
                    dataProduct[field] = "****MASKED****";
                }
            });
            return { status: "MODIFIED", reason: `Masked sensitive fields: ${domainRule.maskFields.join(', ')}`, dataProduct };
        }

        return { status: "PASSED", reason: "All policies satisfied." };
    }

    async tagEntity(entityId, tag, traceId) {
        logger.log('DataplexAgent', `Tagged ${entityId} with ${tag}`, 'INFO', null, traceId);
        return { message: `Entity ${entityId} tagged with ${tag}` };
    }
}
